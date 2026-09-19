import { Schema, model, Document, Types } from "mongoose";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  body: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },

    body: { type: String, required: true, trim: true, maxlength: 4000 },
    readAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);
