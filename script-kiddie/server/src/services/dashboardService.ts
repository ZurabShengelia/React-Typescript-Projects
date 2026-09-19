import { Types } from "mongoose";
import { Attempt } from "../models/Attempt";
import { Test } from "../models/Test";

export async function getDashboardSummary(userId: string) {
  const userObjectId = new Types.ObjectId(userId);

  const [totalTests, submittedAttempts, recentAttemptsRaw, categoryPerformance] = await Promise.all([
    Test.countDocuments({ isPublished: true }),
    Attempt.find({ user: userObjectId, status: "submitted" }).sort({ submittedAt: -1 }),
    Attempt.find({ user: userObjectId, status: "submitted" })
      .sort({ submittedAt: -1 })
      .limit(8)
      .populate<{
        test: { _id: Types.ObjectId; title: string; difficulty: "easy" | "medium" | "hard"; category: { _id: Types.ObjectId; name: string } | null } | null;
      }>({ path: "test", select: "title difficulty category", populate: { path: "category", select: "name" } })
      .lean(),
    Attempt.aggregate([
      { $match: { user: userObjectId, status: "submitted" } },
      { $lookup: { from: "tests", localField: "test", foreignField: "_id", as: "test" } },
      { $unwind: "$test" },
      { $lookup: { from: "categories", localField: "test.category", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category._id",
          name: { $first: "$category.name" },
          attempts: { $sum: 1 },
          averageScore: { $avg: "$score" },
        },
      },
      { $sort: { averageScore: -1 } },
    ]),
  ]);

  const completedTests = new Set(submittedAttempts.map((a) => a.test.toString())).size;
  const averageScore = submittedAttempts.length
    ? Math.round(submittedAttempts.reduce((sum, a) => sum + a.score, 0) / submittedAttempts.length)
    : 0;
  const successRate = submittedAttempts.length
    ? Math.round((submittedAttempts.filter((a) => a.score >= 70).length / submittedAttempts.length) * 100)
    : 0;

  const performanceTrend = submittedAttempts
    .slice(0, 12)
    .reverse()
    .map((a) => ({ date: a.submittedAt, score: a.score }));

  const recentAttempts = recentAttemptsRaw.map((a) => ({
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
  }));

  return {
    totals: {
      totalTests,
      completedTests,
      totalAttempts: submittedAttempts.length,
      averageScore,
      successRate,
    },
    performanceTrend,
    categoryPerformance: categoryPerformance.map((c) => ({
      categoryId: c._id.toString(),
      name: c.name,
      attempts: c.attempts,
      averageScore: Math.round(c.averageScore),
    })),
    recentAttempts,
  };
}
