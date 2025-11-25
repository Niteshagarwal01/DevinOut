import mongoose, { Schema, models } from 'mongoose';

export interface IFreelancerProfile {
  userId: mongoose.Types.ObjectId;
  clerkId: string;
  freelancerType: 'designer' | 'developer';
  skills: string[];
  experienceLevel: 'junior' | 'mid' | 'senior';
  portfolioLink?: string;
  toolsUsed: string[];
  availabilityStatus: boolean;
  rating: number;
  completedProjects: number;
  hourlyRate?: number;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FreelancerProfileSchema = new Schema<IFreelancerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    freelancerType: {
      type: String,
      enum: ['designer', 'developer'],
      required: true,
    },
    skills: {
      type: [String],
      required: true,
      default: [],
    },
    experienceLevel: {
      type: String,
      enum: ['junior', 'mid', 'senior'],
      required: true,
    },
    portfolioLink: {
      type: String,
    },
    toolsUsed: {
      type: [String],
      default: [],
    },
    availabilityStatus: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    completedProjects: {
      type: Number,
      default: 0,
    },
    hourlyRate: {
      type: Number,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

const FreelancerProfile =
  models.FreelancerProfile || mongoose.model<IFreelancerProfile>('FreelancerProfile', FreelancerProfileSchema);

export default FreelancerProfile;
