import { Schema, model, Document, Types } from "mongoose";

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  pairKey: string;
  lastMessage?: { body: string; sender: Types.ObjectId; sentAt: Date };
  unread: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    pairKey: { type: String, required: true, unique: true },
    lastMessage: {
      body: { type: String },
      sender: { type: Schema.Types.ObjectId, ref: "User" },
      sentAt: { type: Date },
    },
    unread: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation = model<IConversation>("Conversation", conversationSchema);
