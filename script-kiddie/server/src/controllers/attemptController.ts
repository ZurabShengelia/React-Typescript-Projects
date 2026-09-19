import { Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Attempt } from "../models/Attempt";
import { Question } from "../models/Question";
import { Test, DIFFICULTY_LABELS } from "../models/Test";
import { ApiError } from "../utils/ApiError";

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  newest: { submittedAt: -1 },
  oldest: { submittedAt: 1 },
  score_desc: { score: -1 },
  score_asc: { score: 1 },
};

export const listAttempts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = "1", limit = "10", category, sort = "newest" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(Number(limit) || 10, 50));
  const sortSpec = SORT_OPTIONS[sort] ?? SORT_OPTIONS.newest;

  const filter: Record<string, unknown> = { user: req.auth!.userId, status: "submitted" };

  if (category) {
    const testsInCategory = await Test.find({ category }).select("_id");
    filter.test = { $in: testsInCategory.map((t) => t._id) };
  }

  const [attempts, total] = await Promise.all([
    Attempt.find(filter)
      .sort(sortSpec)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate<{
        test: { _id: Types.ObjectId; title: string; difficulty: "easy" | "medium" | "hard"; category: { _id: Types.ObjectId; name: string } | null } | null;
      }>({ path: "test", select: "title difficulty category", populate: { path: "category", select: "name" } })
      .lean(),
    Attempt.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: attempts.map((a) => ({
      id: a._id.toString(),
      test: a.test
        ? {
            _id: a.test._id.toString(),
            title: a.test.title,
            difficulty: a.test.difficulty,
            category: a.test.category ? { name: a.test.category.name } : { name: "Uncategorized" },
          }
        : null,
      score: a.score,
      correctCount: a.correctCount,
      totalQuestions: a.totalQuestions,
      submittedAt: a.submittedAt,
      durationSeconds: a.durationSeconds,
    })),
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

export const getAttempt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const attempt = await Attempt.findOne({ _id: req.params.id, user: req.auth!.userId })
    .populate<{
      test: {
        _id: Types.ObjectId;
        title: string;
        difficulty: "easy" | "medium" | "hard";
        timeLimitMinutes?: number;
        category: { _id: Types.ObjectId; name: string } | null;
      } | null;
    }>({
      path: "test",
      select: "title difficulty category timeLimitMinutes",
      populate: { path: "category", select: "name" },
    })
    .lean();

  if (!attempt) throw ApiError.notFound("Attempt not found");

  const test = attempt.test;
  const testPayload = {
    _id: test?._id?.toString() ?? null,
    title: test?.title ?? "Deleted test",
    difficulty: test?.difficulty ?? "easy",
    difficultyLabel: DIFFICULTY_LABELS[test?.difficulty ?? "easy"],
    timeLimitMinutes: test?.timeLimitMinutes,
    category: { id: test?.category?._id?.toString() ?? null, name: test?.category?.name ?? "Uncategorized" },
  };

  if (attempt.status !== "submitted") {
    return res.json({
      success: true,
      data: {
        id: attempt._id.toString(),
        status: attempt.status,
        test: testPayload,
      },
    });
  }

  const questions = test?._id ? await Question.find({ test: test._id }).sort({ order: 1 }).lean() : [];
  const answerMap = new Map(attempt.answers.map((a) => [a.question.toString(), a]));

  res.json({
    success: true,
    data: {
      id: attempt._id.toString(),
      status: attempt.status,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      submittedAt: attempt.submittedAt,
      durationSeconds: attempt.durationSeconds,
      test: testPayload,
      review: questions.map((q) => {
        const answer = answerMap.get(q._id.toString());
        return {
          id: q._id.toString(),
          prompt: q.prompt,
          options: q.options.map((o, idx) => ({ index: idx, text: o.text })),
          correctOptionIndexes: q.correctOptionIndexes,
          selectedOptionIndexes: answer?.selectedOptionIndexes ?? [],
          isCorrect: answer?.isCorrect ?? false,
          wasAnswered: Boolean(answer),
          explanation: q.explanation,
        };
      }),
    },
  });
});
