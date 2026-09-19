import crypto from "crypto";
import { Lab } from "../models/Lab";
import { LabAttempt } from "../models/LabAttempt";
import { LabConsent } from "../models/LabConsent";
import { DIFFICULTY_LABELS } from "../models/Test";

const HINT_PENALTY_POINTS = {
  easy: 10,
  medium: 15,
  hard: 20,
} as const;

const BASE_SCORE_BY_DIFFICULTY = {
  easy: 100,
  medium: 120,
  hard: 140,
} as const;

const LAB_SEEDS = [
  {
    title: "Find the Hidden File",
    slug: "find-the-hidden-file",
    description: "Learn basic Linux navigation by locating a hidden file in a safe simulated environment.",
    category: "Linux",
    difficulty: "easy",
    estimatedTimeMinutes: 15,
    instructions: [
      "Use the terminal to inspect the workspace.",
      "The challenge is local and simulated — no real system is affected.",
      "Look for files that are not shown by a normal directory listing.",
    ],
    objectives: [
      "Understand how hidden files appear in Linux.",
      "Use ls and cat to inspect a simple filesystem.",
      "Submit the flag once you find it.",
    ],
    hints: [
      "Hidden files start with a dot.",
      "Use ls -a to see entries that normal ls hides.",
      "Once you locate the file, read it with cat.",
    ],
    flag: "SCRIPTKIDDIE{hidden_file_found}",
    virtualFilesystem: [
      { name: "/", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
        { name: "home", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
          { name: "student", type: "dir", permissions: "drwxr-xr-x", owner: "student", hidden: false, children: [
            { name: "notes.txt", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "This is only a decoy. The real answer is hidden." },
            { name: ".secret.txt", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: true, content: "SCRIPTKIDDIE{hidden_file_found}" },
            { name: "documents", type: "dir", permissions: "drwxr-xr-x", owner: "student", hidden: false, children: [
              { name: "guide.txt", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "The hidden file does not show up in a normal listing." },
            ] },
          ] },
        ] },
      ] },
    ],
  },
  {
    title: "Permission Denied",
    slug: "permission-denied",
    description: "A file looks important, but the current user has no read permission yet.",
    category: "Linux",
    difficulty: "easy",
    estimatedTimeMinutes: 18,
    instructions: [
      "Inspect the file listing and permissions.",
      "Determine which file is blocked by access rules.",
      "Use chmod only as a simulated learning action.",
    ],
    objectives: [
      "Read permission strings correctly.",
      "Understand why a user may not access a file.",
      "Use chmod to make the content readable.",
    ],
    hints: [
      "Look for the file with a leading dash and permission bits that do not include r for the owner or group.",
      "The file is still there — the problem is access, not existence.",
      "A read-only permission string can block the current user from opening it.",
    ],
    flag: "SCRIPTKIDDIE{chmod_unlocks_access}",
    virtualFilesystem: [
      { name: "/", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
        { name: "home", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
          { name: "student", type: "dir", permissions: "drwxr-xr-x", owner: "student", hidden: false, children: [
            { name: "readme.txt", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "Decoy content for a simple exercise." },
            { name: "restricted.txt", type: "file", permissions: "-r--------", owner: "root", hidden: false, content: "SCRIPTKIDDIE{chmod_unlocks_access}" },
            { name: "notes", type: "dir", permissions: "drwxr-xr-x", owner: "student", hidden: false },
          ] },
        ] },
      ] },
    ],
  },
  {
    title: "Hidden Configuration",
    slug: "hidden-configuration",
    description: "A configuration file contains the secret value hidden among settings.",
    category: "Linux",
    difficulty: "easy",
    estimatedTimeMinutes: 12,
    instructions: [
      "Inspect files in the workspace to find configuration entries.",
      "The flag is stored as a value in a config file.",
    ],
    objectives: [
      "Read and interpret simple configuration files.",
      "Locate the flag inside a non-obvious file.",
    ],
    hints: [
      "Look for common config filenames like config.ini or settings.conf.",
      "Open files and scan for lines that look like KEY=VALUE.",
    ],
    flag: "SCRIPTKIDDIE{config_secret_found}",
    virtualFilesystem: [
      { name: "/", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
        { name: "etc", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
          { name: "app.conf", type: "file", permissions: "-rw-r--r--", owner: "root", hidden: false, content: "mode=dev\nflag=SCRIPTKIDDIE{config_secret_found}\n" },
        ] },
      ] },
    ],
  },
  {
    title: "Needle in the Haystack",
    slug: "needle-in-the-haystack",
    description: "The flag is buried deeper in a file tree; search carefully and narrow the results.",
    category: "Linux",
    difficulty: "medium",
    estimatedTimeMinutes: 20,
    instructions: [
      "Search the directory tree rather than opening every file manually.",
      "Focus on files that contain the target string.",
      "The flag is hidden inside a nested folder structure.",
    ],
    objectives: [
      "Use a directory search to find candidate files.",
      "Filter results by filename or file content.",
      "Read the correct file to retrieve the flag.",
    ],
    hints: [
      "This is a deeper tree than the first challenge. A normal ls is not enough.",
      "The right command can search recursively through the folders.",
      "Look for the file whose contents match the flag pattern.",
    ],
    flag: "SCRIPTKIDDIE{grep_found_the_needle}",
    virtualFilesystem: [
      { name: "/", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
        { name: "workspace", type: "dir", permissions: "drwxr-xr-x", owner: "student", hidden: false, children: [
          { name: "logs", type: "dir", permissions: "drwxr-xr-x", owner: "student", hidden: false, children: [
            { name: "service.log", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "status=ok\nwatch=off" },
            { name: "audit.log", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "token=expired\ncheck=done" },
          ] },
          { name: "archive", type: "dir", permissions: "drwxr-xr-x", owner: "student", hidden: false, children: [
            { name: "2024", type: "dir", permissions: "drwxr-xr-x", owner: "student", hidden: false, children: [
              { name: "notes.txt", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "This file is not the answer." },
              { name: "grep-target.txt", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "SCRIPTKIDDIE{grep_found_the_needle}" },
            ] },
          ] },
          { name: "misc.txt", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "No flag here." },
        ] },
      ] },
    ],
  },
  {
    title: "Pipes and Filters",
    slug: "pipes-and-filters",
    description: "The answer is only visible after combining command output through a filter.",
    category: "Linux",
    difficulty: "medium",
    estimatedTimeMinutes: 22,
    instructions: [
      "Read the file contents in a structured way.",
      "Chain output through a filter to isolate the right data.",
      "The flag is not printed as a full-line message by default.",
    ],
    objectives: [
      "Recognize that multiple commands can be chained.",
      "Use simple output filtering to isolate the flag.",
      "Confirm the value before submitting it.",
    ],
    hints: [
      "The flag is mixed into a list of other lines; it is not the only line in the file.",
      "Command output can be fed directly into a filter command for a narrower result.",
      "You want the line that contains the flag marker, not the whole file dump.",
    ],
    flag: "SCRIPTKIDDIE{pipe_to_filter}",
    virtualFilesystem: [
      { name: "/", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
        { name: "data", type: "dir", permissions: "drwxr-xr-x", owner: "student", hidden: false, children: [
          { name: "report.txt", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "build=pass\nowner=student\nstatus=review\nflag=SCRIPTKIDDIE{pipe_to_filter}\nnotes=keep" },
          { name: "summary.txt", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "unit=ok\npass=all" },
        ] },
      ] },
    ],
  },
  {
    title: "Process Inspector",
    slug: "process-inspector",
    description: "A suspicious process is running; identify it and read the file it references.",
    category: "Linux",
    difficulty: "hard",
    estimatedTimeMinutes: 25,
    instructions: [
      "Inspect the running process list to find suspicious entries.",
      "Correlate the PID or process name to a file reference.",
      "Read the referenced file to extract the final flag.",
    ],
    objectives: [
      "Interpret a simulated process list safely.",
      "Match a process to the right file reference.",
      "Use the final file content as the answer.",
    ],
    hints: [
      "The process list is a simulation, not a real machine. Each process has a name, PID, and a file path.",
      "One process name stands out as suspicious and its file reference points to the flag.",
      "Read the file tied to that process rather than any random process entry.",
    ],
    flag: "SCRIPTKIDDIE{suspicious_pid_42}",
    virtualFilesystem: [
      { name: "/", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
        { name: "proc", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
          { name: "jobs.txt", type: "file", permissions: "-rw-r--r--", owner: "root", hidden: false, content: "PID 101  python\nPID 042  suspicious_agent\nPID 503  nginx\n" },
          { name: "suspicious_agent.txt", type: "file", permissions: "-rw-r--r--", owner: "root", hidden: false, content: "SCRIPTKIDDIE{suspicious_pid_42}" },
        ] },
      ] },
    ],
  },
  {
    title: "Environment Variables",
    slug: "environment-variables",
    description: "The flag is stored in the environment, not in a normal file on disk.",
    category: "Linux",
    difficulty: "hard",
    estimatedTimeMinutes: 25,
    instructions: [
      "Inspect the environment variables rather than a file tree.",
      "Find the variable that carries the final value.",
      "Read the value exactly as stored and submit it.",
    ],
    objectives: [
      "Understand that shell variables can be exported and read by name.",
      "Use the environment list to locate the right variable.",
      "Submit the exact value stored in the variable.",
    ],
    hints: [
      "This challenge is not a hidden file; it is an exported variable with a name and value.",
      "The answer begins with `env` or by printing a variable value, not by reading a disk file.",
      "Look for the variable name that looks like a flag or challenge token.",
    ],
    flag: "SCRIPTKIDDIE{env_flag_is_set}",
    virtualFilesystem: [
      { name: "/", type: "dir", permissions: "drwxr-xr-x", owner: "root", hidden: false, children: [
        { name: "env", type: "dir", permissions: "drwxr-xr-x", owner: "student", hidden: false, children: [
          { name: "shell.txt", type: "file", permissions: "-rw-r--r--", owner: "student", hidden: false, content: "PATH=/usr/local/bin\nHOME=/home/student\nFLAG=SCRIPTKIDDIE{env_flag_is_set}" },
        ] },
      ] },
    ],
  },
] as const;

function getFlagHash(flag: string) {
  return crypto.createHash("sha256").update(flag).digest("hex");
}

export async function ensureSeedLab() {
  const slugs = LAB_SEEDS.map((lab) => lab.slug);
  const existing = await Lab.find({ slug: { $in: slugs } }).lean();
  const existingMap = new Map(existing.map((lab) => [lab.slug, lab]));

  for (const seed of LAB_SEEDS) {
    const existingLab = existingMap.get(seed.slug);

    if (!existingLab) {
      await Lab.create({
        title: seed.title,
        slug: seed.slug,
        description: seed.description,
        category: seed.category,
        difficulty: seed.difficulty,
        estimatedTimeMinutes: seed.estimatedTimeMinutes,
        instructions: seed.instructions,
        objectives: seed.objectives,
        order: LAB_SEEDS.findIndex((item) => item.slug === seed.slug) + 1,
        active: true,
        environmentType: "simulated",
        challenge: {
          objective: seed.objectives[0],
          instructions: seed.instructions,
          hints: seed.hints,
          flagHash: getFlagHash(seed.flag),
          targetPath: "/home/student",
          virtualFilesystem: seed.virtualFilesystem,
        },
      });
      continue;
    }

    const update: any = {};
    if (!existingLab.difficulty) update.difficulty = seed.difficulty;
    if (existingLab.active !== true) update.active = true;
    if (!existingLab.order) update.order = LAB_SEEDS.findIndex((item) => item.slug === seed.slug) + 1;
    if (!existingLab.environmentType) update.environmentType = "simulated";
    if (!existingLab.challenge || !existingLab.challenge.virtualFilesystem) {
      update.challenge = {
        objective: seed.objectives[0],
        instructions: seed.instructions,
        hints: seed.hints,
        flagHash: getFlagHash(seed.flag),
        targetPath: "/home/student",
        virtualFilesystem: seed.virtualFilesystem,
      };
    }

    if (Object.keys(update).length > 0) {
      await Lab.updateOne({ slug: seed.slug }, { $set: update });
    }
  }

  return Lab.find({ active: true }).sort({ order: 1 });
}

export async function listLabs() {
  await ensureSeedLab();
  const labs = await Lab.find({ active: true }).sort({ order: 1 }).lean();
  return labs.map((lab) => ({
    id: lab._id.toString(),
    title: lab.title,
    slug: lab.slug,
    description: lab.description,
    category: lab.category,
    difficulty: lab.difficulty,
    difficultyLabel: DIFFICULTY_LABELS[lab.difficulty],
    estimatedTimeMinutes: lab.estimatedTimeMinutes,
    environmentType: lab.environmentType,
    objectives: lab.objectives,
  }));
}

export async function acceptLabAup(userId: string) {
  await LabConsent.findOneAndUpdate(
    { user: userId },
    { user: userId, policyVersion: "simulated-lab-v1", acceptedAt: new Date() },
    { upsert: true, new: true }
  );
}

export async function getLabConsent(userId: string) {
  return LabConsent.findOne({ user: userId }).lean();
}

function redactContents<T extends LabVirtualNodeLike>(nodes: T[]): T[] {
  return nodes.map((node) => ({
    ...node,
    content: undefined,
    children: node.children ? redactContents(node.children) : node.children,
  }));
}

interface LabVirtualNodeLike {
  content?: string;
  children?: LabVirtualNodeLike[];
  [key: string]: unknown;
}

export async function startLabAttempt(userId: string, slug: string) {
  const lab = await Lab.findOne({ slug, active: true });
  if (!lab) throw new Error("Lab not found");

  const consent = await LabConsent.findOne({ user: userId });
  if (!consent) throw new Error("Lab acceptance required");

  const attempt = await LabAttempt.create({
    user: userId,
    lab: lab._id,
    status: "in_progress",
    score: 0,
    hintsUsed: 0,
    currentPath: "/home/student",
    virtualFilesystem: lab.challenge.virtualFilesystem,
    commandHistory: [],
  });

  const hintCost = HINT_PENALTY_POINTS[lab.difficulty];

  return {
    attempt: {
      id: attempt._id.toString(),
      status: attempt.status,
      currentPath: attempt.currentPath,
      virtualFilesystem: redactContents(attempt.virtualFilesystem as LabVirtualNodeLike[]),
      startedAt: attempt.startedAt,
      score: attempt.score,
    },
    lab: {
      id: lab._id.toString(),
      title: lab.title,
      slug: lab.slug,
      description: lab.description,
      difficulty: lab.difficulty,
      estimatedTimeMinutes: lab.estimatedTimeMinutes,
      environmentType: lab.environmentType,
      simulationNotice: "Simulated Environment — Learn Linux commands safely, no real system is affected.",
      objectives: lab.objectives,
      hints: lab.challenge.hints,
      instructions: lab.challenge.instructions,
      hintCost,
    },
  };
}

export async function revealHintForAttempt(userId: string, slug: string, hintIndex: number) {
  const lab = await Lab.findOne({ slug, active: true });
  if (!lab) throw new Error("Lab not found");

  const attempt = await LabAttempt.findOne({ user: userId, lab: lab._id, status: "in_progress" }).sort({ startedAt: -1 });
  if (!attempt) throw new Error("No active attempt found");

  if (hintIndex !== attempt.hintsUsed) {
    throw new Error("Hints must be revealed in order.");
  }

  if (hintIndex >= lab.challenge.hints.length) {
    throw new Error("Hint not available");
  }

  const hintCost = HINT_PENALTY_POINTS[lab.difficulty];
  attempt.hintsUsed += 1;
  await attempt.save();

  return {
    hint: lab.challenge.hints[hintIndex],
    hintsUsed: attempt.hintsUsed,
    cost: hintCost,
  };
}

export async function submitLabFlag(userId: string, slug: string, candidate: string) {
  const lab = await Lab.findOne({ slug, active: true });
  if (!lab) throw new Error("Lab not found");

  const attempt = await LabAttempt.findOne({ user: userId, lab: lab._id, status: "in_progress" }).sort({ startedAt: -1 });
  if (!attempt) throw new Error("No active attempt found");

  const normalized = candidate.trim();
  const expectedHash = lab.challenge.flagHash;
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");

  if (hash !== expectedHash) {
    return { completed: false, message: "Incorrect flag." };
  }

  const score = Math.max(0, BASE_SCORE_BY_DIFFICULTY[lab.difficulty] - attempt.hintsUsed * HINT_PENALTY_POINTS[lab.difficulty]);

  attempt.status = "completed";
  attempt.score = score;
  attempt.completedAt = new Date();
  await attempt.save();

  return { completed: true, message: "Flag accepted.", score };
}
