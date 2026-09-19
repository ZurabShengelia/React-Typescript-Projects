import { Schema, model, Document, Types } from "mongoose";

export interface ILabConsent extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  policyVersion: string;
  acceptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const labConsentSchema = new Schema<ILabConsent>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    policyVersion: { type: String, required: true, default: "simulated-lab-v1" },
    acceptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const LabConsent = model<ILabConsent>("LabConsent", labConsentSchema);
