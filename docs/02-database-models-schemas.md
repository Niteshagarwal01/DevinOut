# 🗄️ Database Models & Schemas - DevinOut

## Table of Contents
1. [MongoDB Connection Setup](#mongodb-connection-setup)
2. [Model 1: User](#model-1-user)
3. [Model 2: FreelancerProfile](#model-2-freelancerprofile)
4. [Model 3: Project](#model-3-project)
5. [Model 4: ChatRoom](#model-4-chatroom)
6. [Model 5: Notification](#model-5-notification)
7. [Relationships & References](#relationships--references)
8. [Data Flow Examples](#data-flow-examples)
9. [Querying Patterns](#querying-patterns)

---

## MongoDB Connection Setup

### Connection Pooling Implementation

```typescript
// lib/mongodb.ts - Singleton Pattern for Connection Reuse
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  var mongoose: {
    conn: any;
    promise: Promise<any> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,  // Fail fast instead of buffering
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;  // Clear failed promise
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
```

**Why This Pattern?**
- ✅ **Connection Reuse**: Prevents exhausting MongoDB Atlas connection limits (512 max on M0)
- ✅ **Hot Reload Safe**: Maintains connection across Next.js development reloads
- ✅ **Production Ready**: Efficient connection pooling for serverless functions
- ✅ **Error Recovery**: Clears failed promises to allow retry

**Usage in API Routes:**
```typescript
import dbConnect from '@/lib/mongodb';

export async function GET() {
  await dbConnect();  // Ensures connection before query
  const users = await User.find({});
  return Response.json(users);
}
```

---

## Model 1: User

### TypeScript Interface

```typescript
export interface IUser {
  clerkId: string;          // Clerk authentication ID (unique)
  email: string;            // User email (unique)
  name: string;             // Full name
  role: 'business' | 'freelancer';  // Account type
  createdAt: Date;          // Auto-generated
  updatedAt: Date;          // Auto-generated
}
```

### Mongoose Schema

```typescript
// models/User.ts
import mongoose, { Schema, models } from 'mongoose';

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,       // Enforces uniqueness at DB level
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
      enum: ['business', 'freelancer'],  // Only these values allowed
      required: true,
    },
  },
  {
    timestamps: true,  // Auto-creates createdAt & updatedAt
  }
);

// Prevent model recompilation in development
const User = models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
```

### Field Explanations

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `clerkId` | String | Yes | Yes | Clerk's unique user identifier (e.g., `user_2abc123...`) |
| `email` | String | Yes | Yes | User's email address |
| `name` | String | Yes | No | Full name (from Clerk profile) |
| `role` | Enum | Yes | No | Either `'business'` (client) or `'freelancer'` (designer/developer) |
| `createdAt` | Date | Auto | No | Account creation timestamp |
| `updatedAt` | Date | Auto | No | Last modification timestamp |

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "clerkId": "user_2abc123xyz",
  "email": "nitesh@example.com",
  "name": "Nitesh Agarwal",
  "role": "business",
  "createdAt": "2025-11-27T10:30:00.000Z",
  "updatedAt": "2025-11-27T10:30:00.000Z"
}
```

### Why This Design?

**Dual ID System:**
- `clerkId`: For authentication (Clerk manages this)
- `_id` (ObjectId): For database relationships (MongoDB manages this)

**Role-Based Access:**
```typescript
// Check user role
const user = await User.findOne({ clerkId: userId });

if (user.role === 'business') {
  // Show business dashboard
} else {
  // Show freelancer dashboard
}
```

---

## Model 2: FreelancerProfile

### TypeScript Interface

```typescript
export interface IFreelancerProfile {
  userId: mongoose.Types.ObjectId;          // Reference to User
  clerkId: string;                          // Clerk ID (for quick lookups)
  freelancerType: 'designer' | 'developer'; // Specialization
  skills: string[];                         // Array of skills
  experienceLevel: 'junior' | 'mid' | 'senior';
  portfolioLink?: string;                   // Optional portfolio URL
  toolsUsed: string[];                      // Technologies/tools
  availabilityStatus: boolean;              // Available for matching?
  rating: number;                           // 0-5 rating
  completedProjects: number;                // Count of finished projects
  hourlyRate?: number;                      // ₹/hour (optional)
  bio?: string;                             // Profile description
  createdAt: Date;
  updatedAt: Date;
}
```

### Mongoose Schema

```typescript
// models/FreelancerProfile.ts
import mongoose, { Schema, models } from 'mongoose';

const FreelancerProfileSchema = new Schema<IFreelancerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',         // References User collection
      required: true,
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,        // One profile per Clerk user
    },
    freelancerType: {
      type: String,
      enum: ['designer', 'developer'],
      required: true,
    },
    skills: {
      type: [String],      // Array of strings
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
      default: true,       // Available by default
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,              // Validation: minimum 0
      max: 5,              // Validation: maximum 5
    },
    completedProjects: {
      type: Number,
      default: 0,
    },
    hourlyRate: {
      type: Number,        // In ₹ (Indian Rupees)
    },
    bio: {
      type: String,
      maxlength: 500,      // Limit bio to 500 characters
    },
  },
  {
    timestamps: true,
  }
);

const FreelancerProfile = 
  models.FreelancerProfile || 
  mongoose.model<IFreelancerProfile>('FreelancerProfile', FreelancerProfileSchema);

export default FreelancerProfile;
```

### Field Explanations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | ObjectId | Yes | Links to User document (for name, email) |
| `clerkId` | String | Yes | Clerk ID (duplicate for faster queries) |
| `freelancerType` | Enum | Yes | `'designer'` or `'developer'` |
| `skills` | String[] | Yes | e.g., `['React', 'TypeScript', 'Node.js']` |
| `experienceLevel` | Enum | Yes | `'junior'`, `'mid'`, or `'senior'` |
| `portfolioLink` | String | No | URL to portfolio/GitHub/Behance |
| `toolsUsed` | String[] | No | Same as skills (legacy field) |
| `availabilityStatus` | Boolean | No | `true` = open to projects |
| `rating` | Number | No | Average rating (0-5 stars) |
| `completedProjects` | Number | No | Count of finished projects |
| `hourlyRate` | Number | No | Hourly rate in ₹ |
| `bio` | String | No | Profile description (max 500 chars) |

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "clerkId": "user_2abc123xyz",
  "freelancerType": "developer",
  "skills": ["React", "Next.js", "TypeScript", "MongoDB", "Tailwind CSS"],
  "experienceLevel": "senior",
  "portfolioLink": "https://github.com/niteshkumar",
  "toolsUsed": ["React", "Next.js", "TypeScript"],
  "availabilityStatus": true,
  "rating": 4.9,
  "completedProjects": 52,
  "hourlyRate": 1800,
  "bio": "Full-stack developer specializing in modern web applications.",
  "createdAt": "2025-11-27T10:30:00.000Z",
  "updatedAt": "2025-11-27T10:30:00.000Z"
}
```

### Querying with Population

```typescript
// Get freelancer with user details
const freelancer = await FreelancerProfile
  .findById(freelancerId)
  .populate('userId');  // Replaces ObjectId with User document

console.log(freelancer.userId.name);  // "Nitesh Kumar"
console.log(freelancer.userId.email); // "nitesh@example.com"
```

---

## Model 3: Project

### TypeScript Interface

```typescript
export interface IProject {
  businessOwnerId: mongoose.Types.ObjectId;  // Reference to User
  clerkId: string;                           // Business owner's Clerk ID
  projectDetails: {
    websiteType: string;          // e.g., "e-commerce", "portfolio"
    designComplexity: string;     // "simple", "moderate", "advanced"
    features: string[];           // Array of feature descriptions
    numPages: number;             // Number of pages/screens
    timeline: string;             // e.g., "2 weeks", "1 month"
    budgetRange: string;          // e.g., "₹25,000-₹50,000"
    techPreference?: string;      // Optional tech stack preference
  };
  estimatedCost?: {
    agencyCost: number;           // Traditional agency cost
    devinOutCost: number;         // DevinOut platform cost
    recommendedTimeline: string;  // AI-suggested timeline
  };
  selectedTeam?: {
    designerId: mongoose.Types.ObjectId;
    developerId: mongoose.Types.ObjectId;
    teamType: 'premium' | 'pro' | 'freemium';
    designerAccepted?: boolean;   // Designer accepted invitation?
    developerAccepted?: boolean;  // Developer accepted invitation?
    designerRejected?: boolean;   // Designer rejected invitation?
    developerRejected?: boolean;  // Developer rejected invitation?
  };
  status: 'chatting' | 'team_presented' | 'awaiting_acceptance' | 
          'team_accepted' | 'team_selected' | 'in_progress' | 
          'completed' | 'cancelled';
  invitationSentAt?: Date;        // When invitations sent to freelancers
  chatRoomId?: mongoose.Types.ObjectId;  // Reference to ChatRoom
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  razorpayOrderId?: string;       // Razorpay transaction ID
  createdAt: Date;
  updatedAt: Date;
}
```

### Mongoose Schema

```typescript
// models/Project.ts
import mongoose, { Schema, models } from 'mongoose';

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
      enum: [
        'chatting',           // AI consultation phase
        'team_presented',     // Teams shown to business
        'awaiting_acceptance',// Waiting for freelancers to accept
        'team_accepted',      // Both freelancers accepted
        'team_selected',      // Business selected & paid
        'in_progress',        // Work in progress
        'completed',          // Project delivered
        'cancelled'           // Project cancelled
      ],
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
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "businessOwnerId": "507f1f77bcf86cd799439011",
  "clerkId": "user_2abc123xyz",
  "projectDetails": {
    "websiteType": "e-commerce",
    "designComplexity": "moderate",
    "features": ["user authentication", "payment integration", "admin dashboard"],
    "numPages": 8,
    "timeline": "4 weeks",
    "budgetRange": "₹50,000-₹75,000"
  },
  "estimatedCost": {
    "agencyCost": 125000,
    "devinOutCost": 65000,
    "recommendedTimeline": "4-6 weeks"
  },
  "selectedTeam": {
    "designerId": "507f1f77bcf86cd799439014",
    "developerId": "507f1f77bcf86cd799439015",
    "teamType": "pro",
    "designerAccepted": true,
    "developerAccepted": true
  },
  "status": "team_selected",
  "chatRoomId": "507f1f77bcf86cd799439016",
  "paymentStatus": "paid",
  "razorpayOrderId": "order_MxYz123abc",
  "createdAt": "2025-11-27T10:00:00.000Z",
  "updatedAt": "2025-11-27T11:30:00.000Z"
}
```

### Project Lifecycle

```
1. chatting               → AI consultation in progress
2. team_presented         → 3 teams shown to business
3. team_selected          → Business selected & paid for team
4. awaiting_acceptance    → Invitations sent to freelancers
5. team_accepted          → Both freelancers accepted
6. in_progress            → Work ongoing
7. completed / cancelled  → Final states
```

---

## Model 4: ChatRoom

### TypeScript Interfaces

```typescript
// Nested interface for messages
export interface IMessage {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  timestamp: Date;
  fileUrl?: string;  // Future: file attachments
}

// Main chat room interface
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
```

### Mongoose Schema

```typescript
// models/ChatRoom.ts
import mongoose, { Schema, models } from 'mongoose';

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
      unique: true,  // One chat room per project
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
      type: [MessageSchema],  // Embedded array of messages
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ChatRoom = models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);

export default ChatRoom;
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439016",
  "projectId": "507f1f77bcf86cd799439013",
  "participants": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "clerkId": "user_2abc123xyz",
      "role": "business",
      "name": "Nitesh Agarwal"
    },
    {
      "userId": "507f1f77bcf86cd799439014",
      "clerkId": "user_3def456uvw",
      "role": "designer",
      "name": "Raj Sharma"
    },
    {
      "userId": "507f1f77bcf86cd799439015",
      "clerkId": "user_4ghi789rst",
      "role": "developer",
      "name": "Arjun Patel"
    }
  ],
  "messages": [
    {
      "senderId": "507f1f77bcf86cd799439011",
      "senderName": "Nitesh Agarwal",
      "message": "Hi team! Excited to work with you on this project.",
      "timestamp": "2025-11-27T12:00:00.000Z"
    },
    {
      "senderId": "507f1f77bcf86cd799439014",
      "senderName": "Raj Sharma",
      "message": "Thank you! I'll start working on the design mockups.",
      "timestamp": "2025-11-27T12:05:00.000Z"
    }
  ],
  "createdAt": "2025-11-27T11:30:00.000Z",
  "updatedAt": "2025-11-27T12:05:00.000Z"
}
```

### Adding Messages (Embedded Pattern)

```typescript
// Add new message to chat room
const chatRoom = await ChatRoom.findById(chatRoomId);

chatRoom.messages.push({
  senderId: userId,
  senderName: user.name,
  message: messageText,
  timestamp: new Date(),
});

await chatRoom.save();  // Saves entire document with new message
```

**Why Embedded Messages?**
- ✅ **Atomic Operations**: Update messages in single query
- ✅ **Fast Reads**: All messages loaded with room
- ✅ **Simple**: No JOIN equivalent needed
- ⚠️ **Limitation**: Max 16MB per document (sufficient for ~50K messages)

---

## Model 5: Notification

### TypeScript Interface

```typescript
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
```

### Mongoose Schema

```typescript
// models/Notification.ts
import mongoose, { Schema, models } from 'mongoose';

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
    timestamps: true,  // Only createdAt needed (no updates)
  }
);

const Notification = 
  models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439017",
  "userId": "507f1f77bcf86cd799439014",
  "clerkId": "user_3def456uvw",
  "type": "invitation",
  "title": "New Project Invitation",
  "message": "You have been selected for an E-commerce Website project",
  "projectId": "507f1f77bcf86cd799439013",
  "isRead": false,
  "createdAt": "2025-11-27T11:30:00.000Z"
}
```

### Notification Types

| Type | Description | Sent To |
|------|-------------|---------|
| `invitation` | Freelancer selected for project | Freelancer |
| `team_selection` | Business selected a team | Freelancers in team |
| `message` | New chat message | All chat participants |
| `payment` | Payment confirmed | Business & freelancers |
| `project_update` | Project status changed | All involved users |

---

## Relationships & References

### Visual Database Schema

```
┌─────────────────┐
│      User       │
│─────────────────│
│ _id (PK)        │◄──────┐
│ clerkId (UK)    │       │
│ email (UK)      │       │
│ name            │       │
│ role            │       │
└─────────────────┘       │
         ▲                │
         │                │
         │ userId (FK)    │
         │                │
┌─────────────────────────┼────────────────┐
│  FreelancerProfile      │                │
│─────────────────────────┼────────────────│
│ _id (PK)                │                │
│ userId (FK) ────────────┘                │
│ clerkId (UK)                             │
│ freelancerType                           │
│ skills []                                │
│ experienceLevel                          │
│ rating                                   │
└──────────────────────────────────────────┘

┌─────────────────┐
│    Project      │
│─────────────────│
│ _id (PK)        │◄──────┐
│ businessOwnerId │       │ projectId (FK)
│ clerkId         │       │
│ projectDetails  │       │
│ selectedTeam    │       │
│ chatRoomId (FK) │───┐   │
└─────────────────┘   │   │
                      ▼   │
┌─────────────────────────┼────────────────┐
│      ChatRoom           │                │
│─────────────────────────┼────────────────│
│ _id (PK)                │                │
│ projectId (FK) ─────────┘                │
│ participants []                          │
│   ├─ userId (FK)                         │
│   ├─ role                                │
│   └─ name                                │
│ messages []                              │
│   ├─ senderId (FK)                       │
│   ├─ message                             │
│   └─ timestamp                           │
└──────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Notification                     │
│─────────────────────────────────────────│
│ _id (PK)                                │
│ userId (FK) ─────────────────►User      │
│ projectId (FK) ──────────────►Project   │
│ type                                    │
│ message                                 │
│ isRead                                  │
└─────────────────────────────────────────┘
```

### Reference Types

**1. One-to-One**
- User ↔ FreelancerProfile (via `userId`)
- Project ↔ ChatRoom (via `chatRoomId`)

**2. One-to-Many**
- User → Projects (business owner creates many projects)
- User → Notifications (user receives many notifications)

**3. Many-to-Many** (via embedded documents)
- ChatRoom ↔ Users (participants array)

---

## Data Flow Examples

### Example 1: Creating a New Project

```typescript
// 1. User signs in (Clerk)
const { userId } = await auth();  // "user_2abc123xyz"

// 2. Find/Create User in database
let user = await User.findOne({ clerkId: userId });
if (!user) {
  user = await User.create({
    clerkId: userId,
    email: clerkUser.emailAddresses[0].emailAddress,
    name: `${clerkUser.firstName} ${clerkUser.lastName}`,
    role: 'business',
  });
}

// 3. Create Project
const project = await Project.create({
  businessOwnerId: user._id,        // MongoDB ObjectId
  clerkId: userId,                  // Clerk ID
  projectDetails: {
    websiteType: 'e-commerce',
    designComplexity: 'moderate',
    features: ['login', 'payment'],
    numPages: 5,
    timeline: '4 weeks',
    budgetRange: '₹50,000-₹75,000'
  },
  status: 'chatting',
});
```

### Example 2: Team Matching & Selection

```typescript
// 1. Find available freelancers
const designers = await FreelancerProfile.find({
  freelancerType: 'designer',
  availabilityStatus: true,
}).populate('userId');  // Load User data

const developers = await FreelancerProfile.find({
  freelancerType: 'developer',
  availabilityStatus: true,
}).populate('userId');

// 2. Calculate match scores (see AI implementation doc)
const topTeams = calculateTopTeams(designers, developers, project);

// 3. Business selects a team
await Project.findByIdAndUpdate(projectId, {
  selectedTeam: {
    designerId: topTeams[0].designer._id,
    developerId: topTeams[0].developer._id,
    teamType: 'pro',
  },
  status: 'team_selected',
  paymentStatus: 'paid',
});

// 4. Create chat room
const chatRoom = await ChatRoom.create({
  projectId: project._id,
  participants: [
    {
      userId: businessOwner._id,
      clerkId: businessOwner.clerkId,
      role: 'business',
      name: businessOwner.name,
    },
    {
      userId: designer._id,
      clerkId: designer.clerkId,
      role: 'designer',
      name: designer.userId.name,
    },
    {
      userId: developer._id,
      clerkId: developer.clerkId,
      role: 'developer',
      name: developer.userId.name,
    },
  ],
  messages: [],
});

// 5. Update project with chat room ID
project.chatRoomId = chatRoom._id;
await project.save();

// 6. Send notifications
await Notification.create({
  userId: designer._id,
  clerkId: designer.clerkId,
  type: 'team_selection',
  title: 'You've been selected!',
  message: `Selected for ${project.projectDetails.websiteType} project`,
  projectId: project._id,
});
```

---

## Querying Patterns

### Basic Queries

```typescript
// Find by ID
const user = await User.findById(userId);

// Find one by field
const user = await User.findOne({ clerkId: 'user_123' });

// Find many with conditions
const designers = await FreelancerProfile.find({
  freelancerType: 'designer',
  experienceLevel: 'senior',
  availabilityStatus: true,
});

// Count documents
const count = await Project.countDocuments({ status: 'in_progress' });
```

### Population (JOIN equivalent)

```typescript
// Single populate
const project = await Project
  .findById(projectId)
  .populate('businessOwnerId');  // Replaces ObjectId with User doc

console.log(project.businessOwnerId.name);  // Access User fields

// Multiple populates
const project = await Project
  .findById(projectId)
  .populate('businessOwnerId')
  .populate('selectedTeam.designerId')
  .populate('selectedTeam.developerId')
  .populate('chatRoomId');

// Nested populate
const chatRoom = await ChatRoom
  .findById(chatRoomId)
  .populate('participants.userId');  // Populate users in participants array
```

### Complex Queries

```typescript
// Find projects with filters
const projects = await Project.find({
  clerkId: userId,
  status: { $in: ['in_progress', 'team_selected'] },  // Multiple values
  'projectDetails.budgetRange': { $exists: true },     // Has budget
});

// Update operations
await Project.findByIdAndUpdate(
  projectId,
  {
    $set: { status: 'completed' },          // Set field
    $inc: { 'selectedTeam.rating': 1 },     // Increment
    $push: { 'projectDetails.features': 'new-feature' },  // Add to array
  },
  { new: true }  // Return updated document
);

// Aggregation
const stats = await Project.aggregate([
  { $match: { status: 'completed' } },
  { $group: {
      _id: '$selectedTeam.teamType',
      count: { $sum: 1 },
      avgBudget: { $avg: '$estimatedCost.devinOutCost' }
    }
  }
]);
```

### Array Operations (Messages)

```typescript
// Add message to chat room
await ChatRoom.findByIdAndUpdate(
  chatRoomId,
  {
    $push: {
      messages: {
        senderId: userId,
        senderName: userName,
        message: messageText,
        timestamp: new Date(),
      }
    }
  }
);

// Mark notification as read
await Notification.findByIdAndUpdate(
  notificationId,
  { $set: { isRead: true } }
);
```

---

## Best Practices

### 1. Always Use TypeScript Interfaces
```typescript
// ✅ Good - Type safety
const user: IUser = await User.findById(userId);

// ❌ Bad - No type checking
const user = await User.findById(userId);
```

### 2. Populate Only When Needed
```typescript
// ✅ Good - Only populate if you need user details
const project = await Project.findById(projectId);
if (needUserDetails) {
  await project.populate('businessOwnerId');
}

// ❌ Bad - Always populating wastes bandwidth
const project = await Project.findById(projectId).populate('businessOwnerId');
```

### 3. Index Frequently Queried Fields
```typescript
// Add indexes for faster queries
UserSchema.index({ clerkId: 1 });  // Unique index
ProjectSchema.index({ clerkId: 1, status: 1 });  // Compound index
```

### 4. Handle Errors Gracefully
```typescript
try {
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
} catch (error) {
  return NextResponse.json({ error: 'Database error' }, { status: 500 });
}
```

### 5. Use Lean Queries for Read-Only
```typescript
// ✅ Faster - Returns plain JavaScript object
const projects = await Project.find({ clerkId: userId }).lean();

// ❌ Slower - Returns Mongoose document with methods
const projects = await Project.find({ clerkId: userId });
```

---

## Summary

**5 Mongoose Models:**
1. **User**: Authentication & basic info
2. **FreelancerProfile**: Skills, ratings, availability
3. **Project**: Project details, team selection, status
4. **ChatRoom**: 3-way chat with embedded messages
5. **Notification**: User notifications

**Key Design Decisions:**
- ✅ Dual ID system (Clerk + MongoDB)
- ✅ Embedded messages (faster reads)
- ✅ Status-based workflows
- ✅ TypeScript interfaces for type safety
- ✅ Connection pooling (prevents exhaustion)

**Next Document**: React Components & Frontend - Deep dive into all 13 .tsx files with component patterns, hooks, and state management.
