import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  senderUsername: string;
  room: string;
  recipient?: mongoose.Types.ObjectId | null;
  text: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderUsername: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    required: true,
    index: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
