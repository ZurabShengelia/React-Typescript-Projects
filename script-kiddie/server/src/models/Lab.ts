import { Schema, model, Document, Types } from "mongoose";
import { DIFFICULTY_LABELS, type Difficulty } from "./Test";

export type LabDifficulty = Difficulty;

export interface ILabVirtualNode {
  name: string;
  type: "file" | "dir";
  permissions: string;
  owner: string;
  hidden?: boolean;
  content?: string;
  children?: ILabVirtualNode[];
}

export interface ILabChallenge {
  objective: string;
  instructions: string[];
  hints: string[];
  flagHash: string;
  virtualFilesystem: ILabVirtualNode[];
  targetPath: string;
}

export interface ILab extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: LabDifficulty;
  estimatedTimeMinutes: number;
  instructions: string[];
  objectives: string[];
  order: number;
  active: boolean;
  environmentType: "simulated";
  challenge: ILabChallenge;
  createdAt: Date;
  updatedAt: Date;
}

const labVirtualNodeSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["file", "dir"], required: true },
    permissions: { type: String, required: true },
    owner: { type: String, default: "student" },
    hidden: { type: Boolean, default: false },
    content: { type: String, default: "" },
    children: [{ type: Schema.Types.Mixed, default: [] }],
  },
  { _id: false }
);

const labChallengeSchema = new Schema(
  {
    objective: { type: String, required: true },
    instructions: [{ type: String, required: true }],
    hints: [{ type: String, required: true }],
    flagHash: { type: String, required: true },
    targetPath: { type: String, required: true },
    virtualFilesystem: { type: [labVirtualNodeSchema], required: true },
  },
  { _id: false }
);

const labSchema = new Schema<ILab>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    category: { type: String, default: "Linux" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true, default: "easy", index: true },
    estimatedTimeMinutes: { type: Number, default: 20 },
    instructions: [{ type: String, required: true }],
    objectives: [{ type: String, required: true }],
    order: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
    environmentType: { type: String, enum: ["simulated"], default: "simulated" },
    challenge: { type: labChallengeSchema, required: true },
  },
  { timestamps: true }
);

export { DIFFICULTY_LABELS };

export const Lab = model<ILab>("Lab", labSchema);
