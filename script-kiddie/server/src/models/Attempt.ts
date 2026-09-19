import { Schema, model, Document, Types } from "mongoose";

export interface IAttemptAnswer {
  question: Types.ObjectId;
  selectedOptionIndexes: number[];
  isCorrect: boolean;
}

export type AttemptStatus = "in_progress" | "submitted";

export interface IAttempt extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  test: Types.ObjectId;
  status: AttemptStatus;
  answers: IAttemptAnswer[];
  score: number;
  totalQuestions: number;
  correctCount: number;
  startedAt: Date;
  submittedAt?: Date;
  durationSeconds?: number;
}

const attemptAnswerSchema = new Schema<IAttemptAnswer>(
  {
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    selectedOptionIndexes: { type: [Number], default: [] },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const attemptSchema = new Schema<IAttempt>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    test: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    status: { type: String, enum: ["in_progress", "submitted"], default: "in_progress" },
    answers: { type: [attemptAnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: () => new Date() },
    submittedAt: { type: Date },
    durationSeconds: { type: Number },
  },
  { timestamps: true }
);

attemptSchema.index({ user: 1, test: 1, createdAt: -1 });
attemptSchema.index({ user: 1, status: 1 });

export const Attempt = model<IAttempt>("Attempt", attemptSchema);
