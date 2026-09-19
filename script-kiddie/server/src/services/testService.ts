import { Types } from "mongoose";
import { Test } from "../models/Test";
import { Question } from "../models/Question";
import { Attempt } from "../models/Attempt";
import { ApiError } from "../utils/ApiError";

interface SubmittedAnswer {
  question: string;
  selectedOptionIndexes: number[];
}

export async function startOrResumeAttempt(userId: string, testId: string) {
  const test = await Test.findOne({ _id: testId, isPublished: true });
  if (!test) throw ApiError.notFound("Test not found");

  const questionCount = await Question.countDocuments({ test: test._id });
  if (questionCount === 0) throw ApiError.badRequest("This test has no questions yet");

  let attempt = await Attempt.findOne({ user: userId, test: test._id, status: "in_progress" });
  if (!attempt) {
    attempt = await Attempt.create({
      user: userId,
      test: test._id,
      totalQuestions: questionCount,
      status: "in_progress",
    });
  }
  return attempt;
}

export async function submitAttempt(
  userId: string,
  testId: string,
  answers: SubmittedAnswer[],
  durationSeconds?: number
) {
  const attempt = await Attempt.findOne({ user: userId, test: testId, status: "in_progress" }).sort({
    createdAt: -1,
  });
  if (!attempt) throw ApiError.badRequest("No active attempt found for this test. Start the test first.");

  const questions = await Question.find({ test: testId });
  if (questions.length === 0) throw ApiError.badRequest("This test has no questions yet");

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let correctCount = 0;
  const gradedAnswers = answers
    .filter((a) => questionMap.has(a.question))
    .map((a) => {
      const question = questionMap.get(a.question)!;
      const correctSet = new Set(question.correctOptionIndexes);
      const selectedSet = new Set(a.selectedOptionIndexes);
      const isCorrect =
        correctSet.size === selectedSet.size && [...correctSet].every((i) => selectedSet.has(i));
      if (isCorrect) correctCount += 1;
      return {
        question: new Types.ObjectId(a.question),
        selectedOptionIndexes: a.selectedOptionIndexes,
        isCorrect,
      };
    });

  const totalQuestions = questions.length;
  const score = Math.round((correctCount / totalQuestions) * 100);

  attempt.answers = gradedAnswers;
  attempt.correctCount = correctCount;
  attempt.totalQuestions = totalQuestions;
  attempt.score = score;
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  attempt.durationSeconds = durationSeconds;
  await attempt.save();

  return attempt;
}
