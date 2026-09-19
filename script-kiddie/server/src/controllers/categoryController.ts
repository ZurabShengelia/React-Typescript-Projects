import { Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Category } from "../models/Category";
import { Test } from "../models/Test";
import { Attempt } from "../models/Attempt";
import { ApiError } from "../utils/ApiError";

export const listCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const categories = await Category.find().sort({ name: 1 });
  const counts = await Test.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  const performance = await Attempt.aggregate([
    { $match: { user: new Types.ObjectId(req.auth!.userId), status: "submitted" } },
    { $lookup: { from: "tests", localField: "test", foreignField: "_id", as: "test" } },
    { $unwind: "$test" },
    {
      $group: {
        _id: "$test.category",
        attempts: { $sum: 1 },
        averageScore: { $avg: "$score" },
      },
    },
  ]);
  const performanceMap = new Map(
    performance.map((p) => [p._id.toString(), { attempts: p.attempts, averageScore: Math.round(p.averageScore) }])
  );

  res.json({
    success: true,
    data: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      testCount: countMap.get(c._id.toString()) ?? 0,
      performance: performanceMap.get(c._id.toString()) ?? null,
    })),
  });
});

export const getCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");
  res.json({
    success: true,
    data: { id: category._id.toString(), name: category.name, slug: category.slug, description: category.description, icon: category.icon },
  });
});
