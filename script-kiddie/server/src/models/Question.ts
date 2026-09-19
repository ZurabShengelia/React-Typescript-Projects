import { Schema, model, Document, Types } from "mongoose";

export type QuestionType = "single" | "multiple";

export interface IQuestionOption {
  _id?: Types.ObjectId;
  text: string;
}

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  test: Types.ObjectId;
  prompt: string;
  type: QuestionType;
  options: IQuestionOption[];
  correctOptionIndexes: number[];
  explanation?: string;
  order: number;
}

const optionSchema = new Schema<IQuestionOption>(
  { text: { type: String, required: true, maxlength: 300 } },
  { _id: true }
);

const questionSchema = new Schema<IQuestion>(
  {
    test: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    prompt: { type: String, required: true, maxlength: 600 },
    type: { type: String, enum: ["single", "multiple"], default: "single" },
    options: {
      type: [optionSchema],
      validate: [(v: IQuestionOption[]) => v.length >= 2 && v.length <= 6, "Need 2-6 options"],
    },
    correctOptionIndexes: {
      type: [Number],
      required: true,
      validate: [(v: number[]) => v.length >= 1, "At least one correct answer required"],
    },
    explanation: { type: String, maxlength: 800 },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ test: 1, order: 1 });

export const Question = model<IQuestion>("Question", questionSchema);
