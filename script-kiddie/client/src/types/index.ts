export type Difficulty = "easy" | "medium" | "hard";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  avatarUrl: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  testCount: number;
  performance: { attempts: number; averageScore: number } | null;
}

export interface TestSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: { _id: string; name: string; slug: string } | null;
  difficulty: Difficulty;
  difficultyLabel: string;
  timeLimitMinutes?: number;
  questionCount: number;
  state: "not_started" | "in_progress" | "completed";
  bestScore: number | null;
  latestAttemptId: string | null;
}

export interface TestDetail {
  id: string;
  title: string;
  description: string;
  category: { _id: string; name: string; slug: string };
  difficulty: Difficulty;
  difficultyLabel: string;
  timeLimitMinutes?: number;
  questionCount: number;
  attempts: Array<{ id: string; status: string; score: number; submittedAt?: string }>;
}

export interface RunnerQuestion {
  id: string;
  prompt: string;
  type: "single" | "multiple";
  options: Array<{ index: number; text: string }>;
}

export interface RunnerSession {
  attemptId: string;
  startedAt: string;
  test: { title: string; categoryName: string; difficultyLabel: string } | null;
  questions: RunnerQuestion[];
}

export interface AttemptSummary {
  id: string;
  test: { _id: string; title: string; difficulty: Difficulty; category?: { name: string } } | null;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  durationSeconds?: number;
}

export interface AttemptReviewQuestion {
  id: string;
  prompt: string;
  options: Array<{ index: number; text: string }>;
  correctOptionIndexes: number[];
  selectedOptionIndexes: number[];
  isCorrect: boolean;
  wasAnswered: boolean;
  explanation?: string;
}

export interface AttemptDetail {
  id: string;
  status: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  durationSeconds?: number;
  test: {
    _id: string;
    title: string;
    difficulty: Difficulty;
    difficultyLabel: string;
    category: { id: string | null; name: string };
  };
  review: AttemptReviewQuestion[];
}

export interface DashboardData {
  totals: {
    totalTests: number;
    completedTests: number;
    totalAttempts: number;
    averageScore: number;
    successRate: number;
  };
  performanceTrend: Array<{ date: string; score: number }>;
  categoryPerformance: Array<{ categoryId: string; name: string; attempts: number; averageScore: number }>;
  recentAttempts: AttemptSummary[];
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  avatarUrl: string | null;

  pendingEmail: string | null;
  privacy: { profileVisibility: "private" | "public"; shareAnalytics: boolean };
  stats: { completedTests: number; averageScore: number; strongestCategory: string | null };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface LabSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  difficultyLabel: string;
  estimatedTimeMinutes: number;
  environmentType: string;
  objectives: string[];
  acceptedAup: boolean;
}

export interface LabVirtualNode {
  name: string;
  type: "file" | "dir";
  permissions?: string;
  owner?: string;
  hidden?: boolean;
  content?: string;
  children?: LabVirtualNode[];
}

export interface LabAttemptSession {
  attempt: {
    id: string;
    status: string;
    currentPath: string;
    virtualFilesystem?: LabVirtualNode[];
    startedAt: string;
    score: number;
  };
  lab: {
    id: string;
    title: string;
    slug: string;
    description: string;
    difficulty: Difficulty;
    estimatedTimeMinutes: number;
    environmentType: string;
    simulationNotice: string;
    objectives: string[];
    hints: string[];
    instructions: string[];

    hintCost: number;
  };
}

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Friend {
  user: ChatUser;
  conversationId: string | null;
  unread: number;
  online: boolean;
  lastMessage: { body: string; sentAt: string; fromSelf: boolean } | null;
}

export interface FriendRequest {
  id: string;
  user: ChatUser;
  direction: "incoming" | "outgoing";
  createdAt: string;
}

export type RelationshipState = "none" | "friends" | "request_sent" | "request_received";

export interface UserSearchResult extends ChatUser {
  relationship: RelationshipState;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt: string | null;

  pending?: "sending" | "failed";
  clientId?: string;
}
