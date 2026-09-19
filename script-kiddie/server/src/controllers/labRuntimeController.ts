import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Lab } from "../models/Lab";
import { LabAttempt } from "../models/LabAttempt";

type LabVirtualNode = any;

function redactContents(nodes: LabVirtualNode[]): LabVirtualNode[] {
  return nodes.map((node) => ({
    ...node,
    content: undefined,
    children: node.children ? redactContents(node.children) : node.children,
  }));
}

function virtualize(absolutePath: string) {
  return absolutePath.replace("/home/student", "/") || "/";
}

function toVirtualPath(currentPath: string, target: string) {
  const base = "/home/student";
  const absolute = target.startsWith("/") ? target : `${currentPath.replace(/\/$/, "")}/${target}`;
  const parts = absolute.split("/").filter(Boolean);
  const startsWithBase = absolute.startsWith(base + "/") || absolute === base;
  const stack: string[] = [];
  const relevant = startsWithBase ? parts.slice(base.split("/").filter(Boolean).length) : parts;
  for (const p of relevant) {
    if (p === ".") continue;
    if (p === "..") {
      if (stack.length > 0) stack.pop();
      continue;
    }
    stack.push(p);
  }
  if (!startsWithBase) return `/__outside__/${stack.join("/")}`;
  return `/${stack.join("/")}` || "/";
}

function findNode(vf: LabVirtualNode[], fullPath: string): LabVirtualNode | null {
  const root = vf.find((n) => n.name === "/");
  if (!root) return null;
  if (fullPath === "/" || fullPath === "") return root;
  let current: LabVirtualNode | undefined = root;
  for (const part of fullPath.split("/").filter(Boolean)) {
    if (!current?.children) return null;
    current = current.children.find((c: any) => c.name === part);
    if (!current) return null;
  }
  return current ?? null;
}

function formatEntry(node: LabVirtualNode): string {
  const perms = node.type === "dir" ? "drwxr-xr-x" : node.permissions || "-rw-r--r--";
  const owner = node.owner || "student";
  const size = node.content ? node.content.length : 4096;
  return `${perms}  1 ${owner} ${owner} ${String(size).padStart(5)} ${node.name}`;
}

function listDirectory(vf: LabVirtualNode[], currentPath: string, showAll: boolean): string[] {
  const node = findNode(vf, virtualize(currentPath));
  if (!node) return [`ls: cannot access '${currentPath}': No such file or directory`];
  if (node.type === "file") return [formatEntry(node)];
  const visible = (node.children ?? []).filter((child: any) => showAll || !child.hidden);
  return visible.map(formatEntry);
}

function setPermissions(vf: LabVirtualNode[], fullPath: string, permissions: string): LabVirtualNode[] {
  const parts = fullPath.split("/").filter(Boolean);
  function rebuild(node: LabVirtualNode, depth: number): LabVirtualNode {
    if (depth === parts.length) return { ...node, permissions };
    if (!node.children) return node;
    return {
      ...node,
      children: node.children.map((child: any) => (child.name === parts[depth] ? rebuild(child, depth + 1) : child)),
    };
  }
  return vf.map((n) => (n.name === "/" ? rebuild(n, 0) : n));
}

export const execLabCommand = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const { slug } = req.params;
  const { cmd } = req.body as { cmd: string };

  const lab = await Lab.findOne({ slug, active: true });
  if (!lab) return res.status(404).json({ success: false, error: "Lab not found" });

  const attempt = await LabAttempt.findOne({ user: userId, lab: lab._id, status: "in_progress" }).sort({ startedAt: -1 });
  if (!attempt) return res.status(400).json({ success: false, error: "No active attempt" });

  const vf = attempt.virtualFilesystem as LabVirtualNode[];
  let currentPath = attempt.currentPath || "/home/student";
  const writeOutput = (lines: string[]) => lines.join("\n");

  const raw = (cmd || "").trim();
  if (!raw) return res.json({ success: true, data: { output: [""], currentPath } });

  const parts = raw.split(/\s+/).filter(Boolean);
  const verb = parts[0];
  const args = parts.slice(1);
  let output: string[] = [];

  if (verb === "pwd") {
    output = [currentPath];
  } else if (verb === "ls") {
    const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
    const target = args.find((a) => !a.startsWith("-"));
    const path = target ? toVirtualPath(currentPath, target) : currentPath;
    output = listDirectory(vf, path, showAll);
  } else if (verb === "cat") {
    const target = args[0];
    if (!target) output = ["cat: missing operand"];
    else {
      const node = findNode(vf, toVirtualPath(currentPath, target));
      if (!node) output = [`cat: ${target}: No such file or directory`];
      else if (node.type === "dir") output = [`cat: ${target}: Is a directory`];
      else {
        const perms = node.permissions || "-rw-r--r--";
        if (perms[1] !== "r") output = [`cat: ${target}: Permission denied`];
        else output = (node.content ?? "").split("\n");
      }
    }
  } else if (verb === "chmod") {
    const [mode, target] = args;
    if (!mode || !target) output = ["chmod: missing operand"];
    else {
      const modeMap: Record<string, string> = { "644": "-rw-r--r--", "600": "-rw-------", "755": "-rwxr-xr-x" };
      const perms = modeMap[mode];
      if (!perms) output = [`chmod: invalid mode: '${mode}'`];
      else {
        const targetPath = toVirtualPath(currentPath, target);
        const node = findNode(vf, targetPath);
        if (!node || node.type !== "file") output = [`chmod: cannot access '${target}': No such file or directory`];
        else {
          const nextVf = setPermissions(vf, targetPath, perms);
          attempt.virtualFilesystem = nextVf as any;
          await attempt.save();
          output = [`mode of '${target}' changed to ${mode} (${perms})`];
        }
      }
    }
  } else if (verb === "cd") {
    const target = args[0] || "/home/student";
    const next = toVirtualPath(currentPath, target);
    const node = findNode(vf, virtualize(next));
    if (!node) output = [`cd: ${target}: No such file or directory`];
    else if (node.type !== "dir") output = [`cd: ${target}: Not a directory`];
    else {

      attempt.currentPath = next.startsWith("/") ? `/home/student${next === "/" ? "" : next}` : `/home/student/${next}`;
      await attempt.save();
      currentPath = attempt.currentPath;
      output = [];
    }
  } else if (verb === "help") {
    output = ["Available: ls [-a] [path], cat <file>, chmod <mode> <file>, pwd, clear, help"];
  } else if (verb === "clear") {
    output = [];
  } else {
    output = [`${verb}: command not found`];
  }

  let outStr = output.join("\n");

  if (!outStr) outStr = "\n";
  attempt.commandHistory.push({ command: raw, output: outStr, timestamp: new Date() } as any);
  await attempt.save();

  return res.json({
    success: true,
    data: {
      output,
      currentPath: attempt.currentPath,
      virtualFilesystem: redactContents(attempt.virtualFilesystem as LabVirtualNode[]),
    },
  });
});

export default { execLabCommand };
