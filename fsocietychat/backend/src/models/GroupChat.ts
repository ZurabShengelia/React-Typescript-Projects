import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGroupChat extends Document {
  name: string;
  admin: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const GroupChatSchema = new Schema<IGroupChat>({
  name: { type: String, required: true, trim: true },
  admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  createdAt: { type: Date, default: Date.now },
});

const GroupChat: Model<IGroupChat> = mongoose.model<IGroupChat>('GroupChat', GroupChatSchema);
export default GroupChat;
