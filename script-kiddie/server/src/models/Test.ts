import { Schema, model, Document, Types } from "mongoose";

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Script Kiddie",
  medium: "Experienced Coder",
  hard: "Senior Developer",
};

export interface ITest extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  category: Types.ObjectId;
  difficulty: Difficulty;
  timeLimitMinutes?: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<ITest>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true, maxlength: 500 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true, index: true },
    timeLimitMinutes: { type: Number, min: 1, max: 180 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

testSchema.index({ category: 1, difficulty: 1 });

export const Test = model<ITest>("Test", testSchema);
