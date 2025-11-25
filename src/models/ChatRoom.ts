import mongoose, { Schema, models } from 'mongoose';

export interface IMessage {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  timestamp: Date;
  fileUrl?: string;
}

export interface IChatRoom {
  projectId: mongoose.Types.ObjectId;
  participants: {
    userId: mongoose.Types.ObjectId;
    clerkId: string;
    role: 'business' | 'designer' | 'developer';
    name: string;
  }[];
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  fileUrl: {
    type: String,
  },
});

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
    },
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        clerkId: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ['business', 'designer', 'developer'],
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
      },
    ],
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ChatRoom = models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);

export default ChatRoom;
