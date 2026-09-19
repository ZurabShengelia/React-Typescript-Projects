import { Schema, model, Document, Types } from "mongoose";

export type FriendshipStatus = "pending" | "accepted";

export interface IFriendship extends Document {
  _id: Types.ObjectId;
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: FriendshipStatus;

  pairKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new Schema<IFriendship>(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["pending", "accepted"], default: "pending", index: true },
    pairKey: { type: String, required: true },
  },
  { timestamps: true }
);

friendshipSchema.index({ pairKey: 1 }, { unique: true });

export function buildPairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export const Friendship = model<IFriendship>("Friendship", friendshipSchema);
