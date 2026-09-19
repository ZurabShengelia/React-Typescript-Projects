import { Schema, model, Document, Types } from "mongoose";

export interface ILabAttempt extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  lab: Types.ObjectId;
  status: "in_progress" | "completed";
  score: number;
  hintsUsed: number;
  startedAt: Date;
  completedAt?: Date;
  currentPath: string;
  virtualFilesystem: unknown;
  commandHistory: Array<{ command: string; output: string; timestamp: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const labAttemptSchema = new Schema<ILabAttempt>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lab: { type: Schema.Types.ObjectId, ref: "Lab", required: true, index: true },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    score: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    currentPath: { type: String, default: "/home/student" },
    virtualFilesystem: { type: Schema.Types.Mixed, required: true },
    commandHistory: [{
      command: { type: String, required: true },
      output: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    }],
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

labAttemptSchema.index({ user: 1, lab: 1, status: 1 });

export const LabAttempt = model<ILabAttempt>("LabAttempt", labAttemptSchema);
