# 📘 TypeScript Patterns & Type Safety - DevinOut

## Table of Contents
1. [Overview](#overview)
2. [Interface Definitions](#interface-definitions)
3. [Type Safety in Components](#type-safety-in-components)
4. [Type Safety in API Routes](#type-safety-in-api-routes)
5. [Mongoose Schema Types](#mongoose-schema-types)
6. [Advanced TypeScript Patterns](#advanced-typescript-patterns)
7. [Type Utilities](#type-utilities)

---

## Overview

DevinOut uses **TypeScript 5** throughout the entire stack for:
- **Type Safety** - Catch errors at compile time
- **IntelliSense** - Better developer experience
- **Refactoring** - Safer code changes
- **Documentation** - Types serve as inline docs

### TypeScript Configuration

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,                    // ✅ Strict mode enabled
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]              // Path alias for imports
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Interface Definitions

### Core Data Interfaces

```typescript
// Message in chat
interface Message {
  role: 'user' | 'assistant';         // Literal union type
  content: string;
}

// Project data from database
interface Project {
  _id: string;
  websiteType: string;
  designComplexity: 'simple' | 'moderate' | 'advanced';
  features: string[];
  numPages: number;
  timeline: string;
  budgetRange: string;
  status: 'chatting' | 'team_presented' | 'awaiting_acceptance' | 'team_accepted';
  selectedTeamType: 'premium' | 'pro' | 'freemium' | null;
  chatRoomId?: string;                // Optional property
  createdAt: string;
  updatedAt: string;
  selectedTeam?: {
    designerAccepted: boolean;
    developerAccepted: boolean;
    designerRejected: boolean;
    developerRejected: boolean;
  };
}

// Team data from API
interface Team {
  teamType: 'premium' | 'pro' | 'freemium';
  score: number;
  designer: TeamMember;
  developer: TeamMember;
  platformFee: number;
  estimatedHours: number;
  estimatedProjectCost: number;
}

interface TeamMember {
  id: string;
  name: string;
  experienceLevel: 'junior' | 'mid' | 'senior';
  skills: string[];
  rating: number;
  completedProjects: number;
  hourlyRate: number;
  portfolioLink?: string;
  bio?: string;
}

// Freelancer profile
interface FreelancerProfile {
  freelancerType: 'designer' | 'developer';
  skills: string[];
  experienceLevel: 'junior' | 'mid' | 'senior';
  rating: number;
  completedProjects: number;
  hourlyRate?: number;
  portfolioLink?: string;
  bio?: string;
  availabilityStatus: boolean;
}

// Chat room participant
interface Participant {
  userId: string;
  clerkId: string;
  role: 'business' | 'designer' | 'developer';
  name: string;
}

// Chat message
interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

// Notification
interface Notification {
  _id: string;
  userId: string;
  clerkId: string;
  type: 'invitation' | 'project_update' | 'message';
  title: string;
  message: string;
  projectId?: string;
  isRead: boolean;
  createdAt: string;
}
```

### Literal Types (Enums Alternative)

```typescript
// ❌ Old way: Enums
enum Status {
  Chatting,
  TeamPresented,
  AwaitingAcceptance
}

// ✅ Better way: Literal unions
type Status = 'chatting' | 'team_presented' | 'awaiting_acceptance' | 'team_accepted';

// ✅ Better way: Const object + typeof
const TEAM_TYPES = {
  PREMIUM: 'premium',
  PRO: 'pro',
  FREEMIUM: 'freemium'
} as const;

type TeamType = typeof TEAM_TYPES[keyof typeof TEAM_TYPES];
// Result: 'premium' | 'pro' | 'freemium'
```

**Why Literal Types?**
- ✅ Compile-time safety
- ✅ Better autocomplete
- ✅ No runtime overhead
- ✅ JSON-friendly (string values)

---

## Type Safety in Components

### React Component Props

```typescript
// ❌ Without types (unsafe)
export default function TeamCard({ team, onSelect }) {
  return <button onClick={() => onSelect(team)}>Select</button>;
}

// ✅ With types (safe)
interface TeamCardProps {
  team: Team;
  onSelect: (team: Team) => void;
  disabled?: boolean;
}

export default function TeamCard({ team, onSelect, disabled = false }: TeamCardProps) {
  return (
    <button 
      onClick={() => onSelect(team)}
      disabled={disabled}
    >
      Select {team.teamType} Team
    </button>
  );
}
```

### useState with Types

```typescript
// ❌ Type inference (works but not explicit)
const [messages, setMessages] = useState([]);  // Type: never[]

// ✅ Explicit typing (better)
const [messages, setMessages] = useState<Message[]>([]);

// ✅ With initial value (type inferred correctly)
const [messages, setMessages] = useState<Message[]>([
  { role: 'assistant', content: 'Welcome!' }
]);

// Complex state
const [formData, setFormData] = useState<{
  freelancerType: string;
  skills: string[];
  experienceLevel: string;
  hourlyRate: string;
}>({
  freelancerType: '',
  skills: [],
  experienceLevel: '',
  hourlyRate: '',
});

// Update with type safety
setFormData(prev => ({
  ...prev,
  skills: [...prev.skills, 'React']  // ✅ Type-safe array spread
}));
```

### Event Handlers

```typescript
// Form submit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // ...
};

// Input change
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setInput(e.target.value);
};

// Textarea change
const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setBio(e.target.value);
};

// Select change
const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setSelected(e.target.value);
};

// Keyboard event
const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

// Click event with specific element
const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log('Button clicked:', e.currentTarget.value);
};
```

### useRef with Types

```typescript
// DOM reference
const messagesEndRef = useRef<HTMLDivElement>(null);

// Access with null check
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

// Input reference
const inputRef = useRef<HTMLInputElement>(null);

// Focus input
const focusInput = () => {
  inputRef.current?.focus();
};
```

### Custom Hooks

```typescript
// Custom hook with return type
function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/my-projects');
      const data = await response.json();
      setProjects(data.projects);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { projects, loading, error, refetch: fetchProjects };
}

// Usage with destructuring (type-safe)
const { projects, loading, error, refetch } = useProjects();
```

---

## Type Safety in API Routes

### Request/Response Types

```typescript
// API Route with typed request body
export async function POST(req: Request) {
  // Parse and type request body
  const body: {
    projectId: string;
    designerId: string;
    developerId: string;
    teamType: 'premium' | 'pro' | 'freemium';
    paymentDetails?: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };
  } = await req.json();

  // Destructure with type safety
  const { projectId, designerId, developerId, teamType, paymentDetails } = body;

  // Type-safe response
  return NextResponse.json({
    success: true,
    message: 'Team selected',
    projectId
  });
}
```

### Type Guards

```typescript
// Type guard function
function isValidTeamType(value: any): value is 'premium' | 'pro' | 'freemium' {
  return ['premium', 'pro', 'freemium'].includes(value);
}

// Usage
const { teamType } = await req.json();

if (!isValidTeamType(teamType)) {
  return NextResponse.json({ error: 'Invalid team type' }, { status: 400 });
}

// Now teamType is narrowed to: 'premium' | 'pro' | 'freemium'
```

### Type Assertions

```typescript
// Clerk user metadata (unsafe but necessary)
const role = user?.unsafeMetadata?.role as string | undefined;

// Type assertion with validation
const role = user?.unsafeMetadata?.role as 'business' | 'freelancer' | undefined;

if (role && !['business', 'freelancer'].includes(role)) {
  throw new Error('Invalid role');
}
```

### Generic API Response Type

```typescript
// Generic API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Usage in API route
export async function GET(): Promise<NextResponse<ApiResponse<Project[]>>> {
  const projects = await Project.find({});
  
  return NextResponse.json({
    success: true,
    data: projects
  });
}

// Frontend usage
const response = await fetch('/api/projects');
const data: ApiResponse<Project[]> = await response.json();

if (data.success && data.data) {
  setProjects(data.data);  // Type-safe
}
```

---

## Mongoose Schema Types

### Schema Definition with TypeScript

```typescript
import { Schema, model, models, Document, Types } from 'mongoose';

// TypeScript interface
interface IUser extends Document {
  clerkId: string;
  email: string;
  name: string;
  role: 'business' | 'freelancer';
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const UserSchema = new Schema<IUser>({
  clerkId: {
    type: String,
    required: [true, 'Clerk ID is required'],
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['business', 'freelancer'],
    required: true
  }
}, {
  timestamps: true  // Auto-adds createdAt, updatedAt
});

// Export typed model
const User = models.User || model<IUser>('User', UserSchema);
export default User;
```

### Nested Schema Types

```typescript
interface IProject extends Document {
  businessOwnerId: Types.ObjectId;
  clerkId: string;
  projectDetails: {
    websiteType: string;
    designComplexity: 'simple' | 'moderate' | 'advanced';
    features: string[];
    numPages: number;
    timeline: string;
    budgetRange: string;
  };
  selectedTeam?: {
    designerId: Types.ObjectId;
    developerId: Types.ObjectId;
    teamType: 'premium' | 'pro' | 'freemium';
    designerAccepted: boolean;
    developerAccepted: boolean;
    designerRejected: boolean;
    developerRejected: boolean;
  };
  status: 'chatting' | 'team_presented' | 'awaiting_acceptance' | 'team_accepted';
  chatRoomId?: Types.ObjectId;
}

const ProjectSchema = new Schema<IProject>({
  businessOwnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectDetails: {
    websiteType: { type: String, default: '' },
    designComplexity: { 
      type: String, 
      enum: ['simple', 'moderate', 'advanced'],
      default: 'simple'
    },
    features: [{ type: String }],
    numPages: { type: Number, default: 0 },
    timeline: { type: String, default: '' },
    budgetRange: { type: String, default: '' }
  },
  selectedTeam: {
    designerId: { type: Schema.Types.ObjectId, ref: 'User' },
    developerId: { type: Schema.Types.ObjectId, ref: 'User' },
    teamType: { 
      type: String, 
      enum: ['premium', 'pro', 'freemium'] 
    },
    designerAccepted: { type: Boolean, default: false },
    developerAccepted: { type: Boolean, default: false },
    designerRejected: { type: Boolean, default: false },
    developerRejected: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['chatting', 'team_presented', 'awaiting_acceptance', 'team_accepted'],
    default: 'chatting'
  },
  chatRoomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom' }
}, { timestamps: true });
```

### Populate with Types

```typescript
// Type-safe populate
const project = await Project.findById(projectId)
  .populate<{ businessOwnerId: IUser }>('businessOwnerId')
  .lean();

// Access with type safety
if (project) {
  console.log(project.businessOwnerId.name);  // ✅ Type-safe
}

// Multiple populates
const freelancer = await FreelancerProfile.findById(id)
  .populate<{ userId: IUser }>('userId')
  .lean();

console.log((freelancer.userId as IUser).email);
```

---

## Advanced TypeScript Patterns

### Discriminated Unions

```typescript
// API response with discriminated union
type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Type narrowing based on discriminant
async function fetchProjects(): Promise<ApiResult<Project[]>> {
  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();
    return { success: true, data: projects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Usage with type narrowing
const result = await fetchProjects();

if (result.success) {
  // TypeScript knows result.data exists here
  setProjects(result.data);
} else {
  // TypeScript knows result.error exists here
  setError(result.error);
}
```

### Utility Types

```typescript
// Partial - Make all properties optional
type PartialProject = Partial<Project>;
// { _id?: string; websiteType?: string; ... }

// Pick - Select specific properties
type ProjectSummary = Pick<Project, '_id' | 'websiteType' | 'status'>;
// { _id: string; websiteType: string; status: string }

// Omit - Exclude specific properties
type ProjectWithoutId = Omit<Project, '_id'>;
// All properties except _id

// Required - Make all properties required
type RequiredProfile = Required<FreelancerProfile>;
// All optional properties become required

// Record - Create object type with specific keys
type TeamScores = Record<'premium' | 'pro' | 'freemium', number>;
// { premium: number; pro: number; freemium: number }

// Example usage
const scores: TeamScores = {
  premium: 159,
  pro: 125,
  freemium: 95
};
```

### Generic Functions

```typescript
// Generic API fetch function
async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('API request failed');
  }
  return response.json();
}

// Usage with type inference
const projects = await fetchApi<Project[]>('/api/projects/my-projects');
// projects is typed as Project[]

const profile = await fetchApi<FreelancerProfile>('/api/freelancer/profile');
// profile is typed as FreelancerProfile

// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map(item => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Usage
<List
  items={projects}
  renderItem={project => <ProjectCard project={project} />}
  keyExtractor={project => project._id}
/>
```

### Mapped Types

```typescript
// Make all properties readonly
type ReadonlyProject = Readonly<Project>;

// Make all properties nullable
type NullableProject = {
  [K in keyof Project]: Project[K] | null;
};

// Transform property types
type StringifiedProject = {
  [K in keyof Project]: string;
};

// Conditional mapped type
type OptionalKeys<T> = {
  [K in keyof T as T[K] extends undefined ? K : never]: T[K];
};

type ProjectOptionalKeys = OptionalKeys<Project>;
// Only includes optional properties
```

### Type Inference

```typescript
// Infer return type from function
function getTeamScore(team: Team) {
  return {
    teamType: team.teamType,
    totalScore: team.score,
    avgRating: (team.designer.rating + team.developer.rating) / 2
  };
}

type TeamScore = ReturnType<typeof getTeamScore>;
// { teamType: string; totalScore: number; avgRating: number }

// Infer parameter types
type GetTeamScoreParams = Parameters<typeof getTeamScore>;
// [team: Team]
```

---

## Type Utilities

### Custom Type Utilities

```typescript
// Deep Partial - Make all nested properties optional
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type PartialProjectWithNested = DeepPartial<Project>;
// All properties AND nested properties are optional

// NonNullable properties
type NonNullableProject = {
  [K in keyof Project]: NonNullable<Project[K]>;
};

// Extract by type
type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

type ProjectStringKeys = StringKeys<Project>;
// '_id' | 'websiteType' | 'timeline' | 'budgetRange' | 'status' | ...
```

### Type Validation at Runtime

```typescript
// Zod for runtime validation
import { z } from 'zod';

const ProjectSchema = z.object({
  websiteType: z.string().min(1),
  designComplexity: z.enum(['simple', 'moderate', 'advanced']),
  features: z.array(z.string()),
  numPages: z.number().min(1),
  timeline: z.string(),
  budgetRange: z.string()
});

// Infer TypeScript type from Zod schema
type ProjectFromZod = z.infer<typeof ProjectSchema>;

// Validate at runtime
const validateProject = (data: unknown) => {
  try {
    return ProjectSchema.parse(data);  // ✅ Type-safe
  } catch (error) {
    throw new Error('Invalid project data');
  }
};
```

### Type Branding

```typescript
// Branded types for IDs (prevent mixing different ID types)
type ProjectId = string & { readonly __brand: 'ProjectId' };
type UserId = string & { readonly __brand: 'UserId' };

function createProjectId(id: string): ProjectId {
  return id as ProjectId;
}

function createUserId(id: string): UserId {
  return id as UserId;
}

// Usage
const projectId = createProjectId('674abc123');
const userId = createUserId('673xyz789');

// ❌ TypeScript error: Type 'UserId' is not assignable to 'ProjectId'
// const wrongId: ProjectId = userId;
```

---

## Summary

**Document 6 Complete!** ✅

Comprehensive TypeScript patterns documentation:

✅ **Interface Definitions** - All core data types  
✅ **Component Type Safety** - Props, useState, events, refs  
✅ **API Route Types** - Request/response, type guards  
✅ **Mongoose Schema Types** - Typed models, populate  
✅ **Advanced Patterns** - Discriminated unions, generics, mapped types  
✅ **Type Utilities** - Partial, Pick, Omit, custom utilities  

**Key Patterns:**
- Literal types over enums
- Explicit useState typing
- Type guards for validation
- Generic API functions
- Discriminated unions for results
- Branded types for IDs

**Next:** Document 7 - Deployment & Production Guide?
