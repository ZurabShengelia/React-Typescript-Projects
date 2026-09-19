import { Response } from "express";
import { HydratedDocument } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Test, DIFFICULTY_LABELS } from "../models/Test";
import { Question } from "../models/Question";
import { Attempt, IAttempt } from "../models/Attempt";
import { Category } from "../models/Category";
import { ApiError } from "../utils/ApiError";
import { startOrResumeAttempt, submitAttempt } from "../services/testService";

export const listTests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { category, difficulty, search, page = "1", limit = "12" } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { isPublished: true };
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (search) filter.title = { $regex: search.slice(0, 80), $options: "i" };

  const pageNum = Math.max(1, Math.min(Number(page) || 1, 1000));
  const limitNum = Math.max(1, Math.min(Number(limit) || 12, 50));

  const [tests, total] = await Promise.all([
    Test.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Test.countDocuments(filter),
  ]);

  const testIds = tests.map((t) => t._id);
  const [questionCounts, userAttempts] = await Promise.all([
    Question.aggregate([{ $match: { test: { $in: testIds } } }, { $group: { _id: "$test", count: { $sum: 1 } } }]),
    req.auth
      ? Attempt.find({ user: req.auth.userId, test: { $in: testIds } }).sort({ createdAt: -1 })
      : Promise.resolve<HydratedDocument<IAttempt>[]>([]),
  ]);

  const questionCountMap = new Map(questionCounts.map((q) => [q._id.toString(), q.count]));
  const attemptsByTest = new Map<string, HydratedDocument<IAttempt>[]>();
  for (const attempt of userAttempts) {
    const key = attempt.test.toString();
    if (!attemptsByTest.has(key)) attemptsByTest.set(key, []);
    attemptsByTest.get(key)!.push(attempt);
  }

  res.json({
    success: true,
    data: tests.map((t) => {
      const attempts = attemptsByTest.get(t._id.toString()) ?? [];
      const latestSubmitted = attempts.find((a) => a.status === "submitted");
      const inProgress = attempts.find((a) => a.status === "in_progress");
      return {
        id: t._id.toString(),
        title: t.title,
        slug: t.slug,
        description: t.description,
        category: t.category,
        difficulty: t.difficulty,
        difficultyLabel: DIFFICULTY_LABELS[t.difficulty],
        timeLimitMinutes: t.timeLimitMinutes,
        questionCount: questionCountMap.get(t._id.toString()) ?? 0,
        state: inProgress ? "in_progress" : latestSubmitted ? "completed" : "not_started",
        bestScore: attempts.length ? Math.max(...attempts.filter((a) => a.status === "submitted").map((a) => a.score), 0) : null,
        latestAttemptId: latestSubmitted ? latestSubmitted._id.toString() : null,
      };
    }),
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

export const getTest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const test = await Test.findOne({ _id: req.params.id, isPublished: true }).populate("category", "name slug");
  if (!test) throw ApiError.notFound("Test not found");

  const questionCount = await Question.countDocuments({ test: test._id });
  const attempts = await Attempt.find({ user: req.auth!.userId, test: test._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      id: test._id.toString(),
      title: test.title,
      description: test.description,
      category: test.category,
      difficulty: test.difficulty,
      difficultyLabel: DIFFICULTY_LABELS[test.difficulty],
      timeLimitMinutes: test.timeLimitMinutes,
      questionCount,
      attempts: attempts.map((a) => ({
        id: a._id.toString(),
        status: a.status,
        score: a.score,
        submittedAt: a.submittedAt,
      })),
    },
  });
});

export const startTest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const attempt = await startOrResumeAttempt(req.auth!.userId, req.params.id);
  const [questions, test] = await Promise.all([
    Question.find({ test: req.params.id }).sort({ order: 1 }),
    Test.findById(req.params.id).populate<{ category: { name: string } | null }>("category", "name"),
  ]);

  res.json({
    success: true,
    data: {
      attemptId: attempt._id.toString(),
      startedAt: attempt.startedAt,
      test: test
        ? {
            title: test.title,
            categoryName: test.category?.name ?? "Uncategorized",
            difficultyLabel: DIFFICULTY_LABELS[test.difficulty],
          }
        : null,
      questions: questions.map((q) => ({
        id: q._id.toString(),
        prompt: q.prompt,
        type: q.type,
        options: q.options.map((o, idx) => ({ index: idx, text: o.text })),
      })),
    },
  });
});

export const submitTest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { answers, durationSeconds } = req.body;
  const attempt = await submitAttempt(req.auth!.userId, req.params.id, answers, durationSeconds);
  res.json({
    success: true,
    data: {
      attemptId: attempt._id.toString(),
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
    },
  });
});
