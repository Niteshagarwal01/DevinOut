import mongoose, { Schema, models } from 'mongoose';

export interface IProject {
  businessOwnerId: mongoose.Types.ObjectId;
  clerkId: string;
  projectDetails: {
    websiteType: string;
    designComplexity: string;
    features: string[];
    numPages: number;
    timeline: string;
    budgetRange: string;
    techPreference?: string;
  };
  estimatedCost?: {
    agencyCost: number;
    devinOutCost: number;
    recommendedTimeline: string;
  };
  selectedTeam?: {
    designerId: mongoose.Types.ObjectId;
    developerId: mongoose.Types.ObjectId;
    teamType: 'premium' | 'pro' | 'freemium';
    designerAccepted?: boolean;
    developerAccepted?: boolean;
    designerRejected?: boolean;
    developerRejected?: boolean;
  };
  status: 'chatting' | 'team_presented' | 'awaiting_acceptance' | 'team_accepted' | 'team_selected' | 'in_progress' | 'completed' | 'cancelled';
  invitationSentAt?: Date;
  chatRoomId?: mongoose.Types.ObjectId;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  razorpayOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    businessOwnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clerkId: {
      type: String,
      required: true,
    },
    projectDetails: {
      websiteType: { type: String, default: '' },
      designComplexity: { type: String, default: '' },
      features: { type: [String], default: [] },
      numPages: { type: Number, default: 0 },
      timeline: { type: String, default: '' },
      budgetRange: { type: String, default: '' },
      techPreference: { type: String },
    },
    estimatedCost: {
      agencyCost: { type: Number },
      devinOutCost: { type: Number },
      recommendedTimeline: { type: String },
    },
    selectedTeam: {
      designerId: { type: Schema.Types.ObjectId, ref: 'User' },
      developerId: { type: Schema.Types.ObjectId, ref: 'User' },
      teamType: { type: String, enum: ['premium', 'pro', 'freemium'] },
      designerAccepted: { type: Boolean, default: false },
      developerAccepted: { type: Boolean, default: false },
      designerRejected: { type: Boolean, default: false },
      developerRejected: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['chatting', 'team_presented', 'awaiting_acceptance', 'team_accepted', 'team_selected', 'in_progress', 'completed', 'cancelled'],
      default: 'chatting',
    },
    invitationSentAt: {
      type: Date,
    },
    chatRoomId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
    },
    razorpayOrderId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Project = models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
