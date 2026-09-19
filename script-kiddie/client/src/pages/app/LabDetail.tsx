import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { LabAttemptSession, LabSummary, LabVirtualNode } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/common/DifficultyBadge";
import { PageSpinner } from "@/components/common/LoadingState";
import { LabTerminal } from "@/components/labs/LabTerminal";
import { LabHints } from "@/components/labs/LabHints";
import { LabFlagSubmit, type FlagFeedback } from "@/components/labs/LabFlagSubmit";

const PROMPT = "student@script-kiddie:~$";

function virtualize(absolutePath: string): string {
  return absolutePath.replace("/home/student", "/") || "/";
}

function toVirtualPath(currentPath: string, target: string): string {
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

  if (!startsWithBase) {

    return `/__outside__/${stack.join("/")}`;
  }

  return `/${stack.join("/")}` || "/";
}

function findNode(vf: LabVirtualNode[], fullPath: string): LabVirtualNode | null {
  const root = vf.find((n) => n.name === "/");
  if (!root) return null;
  if (fullPath === "/" || fullPath === "") return root;

  let current: LabVirtualNode | undefined = root;
  for (const part of fullPath.split("/").filter(Boolean)) {
    if (!current?.children) return null;
    current = current.children.find((c) => c.name === part);
    if (!current) return null;
  }
  return current ?? null;
}

function setPermissions(vf: LabVirtualNode[], fullPath: string, permissions: string): LabVirtualNode[] {
  const parts = fullPath.split("/").filter(Boolean);

  function rebuild(node: LabVirtualNode, depth: number): LabVirtualNode {
    if (depth === parts.length) return { ...node, permissions };
    if (!node.children) return node;
    return {
      ...node,
      children: node.children.map((child) => (child.name === parts[depth] ? rebuild(child, depth + 1) : child)),
    };
  }

  return vf.map((n) => (n.name === "/" ? rebuild(n, 0) : n));
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

  const visible = (node.children ?? []).filter((child) => showAll || !child.hidden);
  return visible.map(formatEntry);
}

export default function LabDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [lab, setLab] = useState<LabSummary | null>(null);
  const [session, setSession] = useState<LabAttemptSession | null>(null);
  const [acceptance, setAcceptance] = useState(false);

  const [terminalCmd, setTerminalCmd] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [flagInput, setFlagInput] = useState("");
  const [flagFeedback, setFlagFeedback] = useState<FlagFeedback>(null);
  const [solved, setSolved] = useState(false);

  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [hintPrompt, setHintPrompt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);
    api
      .get("/labs")
      .then((res) => {
        if (!mounted) return;
        const items = res.data.data as LabSummary[];
        setLab(items.find((l) => l.slug === slug) ?? null);

        setAcceptance(items.some((l) => l.acceptedAup));
      })
      .catch((err) => mounted && setLoadError(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [slug, reloadKey]);

  async function handleAcceptAup() {
    try {
      await api.post("/labs/accept-aup");
      setAcceptance(true);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleStartLab() {
    if (!lab || session || starting) return;
    setStarting(true);
    setError(null);
    try {
      const res = await api.post(`/labs/${lab.slug}/start`);
      const next = res.data.data as LabAttemptSession;
      setSession(next);

      setTerminalOutput([next.lab.simulationNotice, ""]);
      setTerminalCmd("");
      setFlagInput("");
      setFlagFeedback(null);
      setSolved(false);
      setRevealedHints([]);
      setHintPrompt(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  async function handleRevealHint(index: number) {
    if (!lab || !session || index !== revealedHints.length) return;
    try {
      await api.post(`/labs/${lab.slug}/hints/${index}/reveal`);
      setRevealedHints((prev) => [...prev, index]);
      setHintPrompt(null);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleSubmitFlag() {
    if (!lab || !session || submitting) return;
    const flag = flagInput.trim();
    if (!flag) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/labs/${lab.slug}/submit-flag`, { flag });
      const payload = res.data.data as { completed: boolean; score?: number };
      if (payload.completed) {
        setSolved(true);
        setFlagFeedback({ type: "success", message: `Correct — ${payload.score ?? 0} points` });
      } else {
        setFlagFeedback({ type: "error", message: "Not quite. Try again." });
      }
    } catch (err) {

      setFlagFeedback({ type: "error", message: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function runCommand(raw: string) {
    if (!session || !lab) return;
    const cmd = raw.trim();
    setTerminalCmd("");
    if (!cmd) return;

    setTerminalOutput((prev) => [...prev, `${PROMPT} ${cmd}`]);

    try {
      const res = await api.post(`/labs/${lab.slug}/exec`, { cmd });
      const { output, currentPath, virtualFilesystem } = res.data.data as {
        output: string[];
        currentPath: string;
        virtualFilesystem?: LabVirtualNode[];
      };

      setTerminalOutput((prev) => [...prev, ...(output ?? [])]);

      if (virtualFilesystem) {
        setSession((prev) => (prev ? { ...prev, attempt: { ...prev.attempt, virtualFilesystem } } : prev));
      }
      if (currentPath) {
        setSession((prev) => (prev ? { ...prev, attempt: { ...prev.attempt, currentPath } } : prev));
      }
    } catch (err) {
      setTerminalOutput((prev) => [...prev, `Error: ${getErrorMessage(err)}`]);
    }
  }

  if (loading) return <PageSpinner />;

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-mono-label">LABORATORY</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Couldn't load this lab</h1>
        </div>
        <Alert variant="danger">{loadError}</Alert>
        <div className="flex gap-3">
          <Button onClick={() => setReloadKey((k) => k + 1)}>Retry</Button>
          <Button variant="secondary" onClick={() => navigate("/labs")}>
            Back to labs
          </Button>
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-mono-label">LABORATORY</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Lab not found</h1>
        </div>
        <Alert variant="warning">No lab matches that address.</Alert>
        <Button variant="secondary" onClick={() => navigate("/labs")}>
          Back to labs
        </Button>
      </div>
    );
  }

  const objectives = session?.lab.objectives ?? lab.objectives;
  const instructions = session?.lab.instructions ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/labs"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          All labs
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-mono-label">LABORATORY</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{lab.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={lab.difficulty} />
            <span className="text-xs text-ink-faint">
              {lab.category} · ~{lab.estimatedTimeMinutes} min
            </span>
          </div>
        </div>
        <Badge variant="accent">Simulated</Badge>
      </header>

      {!acceptance && (
        <Alert variant="info" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Accept the simulated environment use policy before starting this lab.</span>
          <Button onClick={handleAcceptAup}>Accept policy</Button>
        </Alert>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {}
        <div className="space-y-6">
          <section className="rounded-md border border-base-border bg-base-panel px-5 py-5">
            <h2 className="text-mono-label">BRIEF</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{lab.description}</p>

            {objectives.length > 0 && (
              <>
                <h3 className="mt-6 text-mono-label">OBJECTIVES</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-muted marker:text-ink-faint">
                  {objectives.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </>
            )}

            {instructions.length > 0 && (
              <>
                <h3 className="mt-6 text-mono-label">STEPS</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-muted marker:text-ink-faint">
                  {instructions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </>
            )}

            {!session && (
              <Button onClick={handleStartLab} disabled={!acceptance || starting} className="mt-6 w-full">
                {starting ? "Starting…" : "Start lab"}
              </Button>
            )}
          </section>

          {session && (
            <LabHints
              hints={session.lab.hints}
              revealed={revealedHints}
              pendingIndex={hintPrompt}
              hintCost={session.lab.hintCost}
              onAskReveal={setHintPrompt}
              onConfirmReveal={handleRevealHint}
              onCancelReveal={() => setHintPrompt(null)}
            />
          )}
        </div>

        <div className="space-y-4">
          {session ? (
            <>
              <LabTerminal
                output={terminalOutput}
                currentPath={session.attempt.currentPath || "/home/student"}
                value={terminalCmd}
                onChange={setTerminalCmd}
                onSubmit={runCommand}
              />
              <LabFlagSubmit
                value={flagInput}
                onChange={setFlagInput}
                onSubmit={handleSubmitFlag}
                submitting={submitting}
                feedback={flagFeedback}
                solved={solved}
              />
            </>
          ) : (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-md border border-dashed border-base-border px-6 text-center">
              <p className="font-mono text-sm text-ink-faint">{PROMPT} _</p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
                Start the lab to open the simulated terminal. Nothing you run here affects a real system.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
