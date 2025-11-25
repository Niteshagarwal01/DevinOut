import mongoose, { Schema, models } from 'mongoose';

export interface IUser {
  clerkId: string;
  email: string;
  name: string;
  role: 'business' | 'freelancer';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['business', 'freelancer'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
