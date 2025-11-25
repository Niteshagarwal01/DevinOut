import mongoose, { Schema, models } from 'mongoose';

export interface INotification {
  userId: mongoose.Types.ObjectId;
  clerkId: string;
  type: 'invitation' | 'team_selection' | 'message' | 'payment' | 'project_update';
  title: string;
  message: string;
  projectId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
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
    type: {
      type: String,
      enum: ['invitation', 'team_selection', 'message', 'payment', 'project_update'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
