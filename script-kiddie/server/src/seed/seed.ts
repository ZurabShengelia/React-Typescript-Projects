import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { Category } from "../models/Category";
import { Test } from "../models/Test";
import { Question } from "../models/Question";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import { categorySeeds } from "./data/categories";
import { testSeeds } from "./data/questions";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function run() {
  await mongoose.connect(env.mongoUri);
  logger.info("Connected for seeding");

  await Promise.all([
    Category.deleteMany({}),
    Test.deleteMany({}),
    Question.deleteMany({}),
  ]);

  const categories = await Category.insertMany(categorySeeds);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  for (const testSeed of testSeeds) {
    const category = categoryBySlug.get(testSeed.categorySlug);
    if (!category) {
      logger.error(`Unknown category slug: ${testSeed.categorySlug}`);
      continue;
    }

    const test = await Test.create({
      title: testSeed.title,
      slug: slugify(testSeed.title),
      description: testSeed.description,
      category: category._id,
      difficulty: testSeed.difficulty,
      timeLimitMinutes: testSeed.timeLimitMinutes,
      isPublished: true,
    });

    await Question.insertMany(
      testSeed.questions.map((q, index) => ({
        test: test._id,
        prompt: q.prompt,
        type: q.type,
        options: q.options.map((text) => ({ text })),
        correctOptionIndexes: q.correctOptionIndexes,
        explanation: q.explanation,
        order: index,
      }))
    );

    logger.info(`Seeded test "${test.title}" with ${testSeed.questions.length} questions`);
  }

  const demoEmail = "demo@scriptkiddie.dev";
  const existingDemo = await User.findOne({ email: demoEmail });
  if (!existingDemo) {
    await User.create({
      name: "Demo User",
      email: demoEmail,
      passwordHash: await bcrypt.hash("Demo1234!", 12),
      role: "user",
      emailVerified: true,
    });
    logger.info(`Created demo account: ${demoEmail} / Demo1234!`);
  }

  logger.info("Seeding complete");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  logger.error("Seeding failed", { error: err });
  process.exit(1);
});
