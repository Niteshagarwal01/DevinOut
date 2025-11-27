# 📐 Project Architecture - DevinOut

## Table of Contents
1. [System Overview](#system-overview)
2. [Tech Stack Deep Dive](#tech-stack-deep-dive)
3. [Project Structure](#project-structure)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Authentication Flow](#authentication-flow)
6. [State Management Strategy](#state-management-strategy)
7. [Routing & Navigation](#routing--navigation)

---

## System Overview

DevinOut is an **AI-powered freelance platform** built with modern web technologies, designed to match businesses with perfect designer-developer teams using intelligent algorithms.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React 19 Components (TypeScript)                       │   │
│  │  - Pages (Next.js 16 App Router)                        │   │
│  │  - Client Components ('use client')                     │   │
│  │  - Server Components (default)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Clerk Authentication (OAuth + Session Management)      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER (Edge)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Clerk Middleware - Route Protection & Auth Checks      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js Routes)                    │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐  │
│  │   Chatbot    │    Teams     │     Chat     │   Payment   │  │
│  │   (Groq AI)  │  (Matching)  │  (Messages)  │ (Razorpay)  │  │
│  └──────────────┴──────────────┴──────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (MongoDB)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Mongoose ODM - Type-Safe Database Operations            │  │
│  │  Models: User, Project, FreelancerProfile,               │  │
│  │         ChatRoom, Notification                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MongoDB Atlas (Cloud Database)                          │  │
│  │  Collections: users, projects, freelancerprofiles,       │  │
│  │              chatrooms, notifications                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌──────────────┬──────────────┬──────────────────────────┐    │
│  │  Groq API    │  Razorpay    │  Clerk Authentication    │    │
│  │  (Llama 3.3) │  (Payments)  │  (Google OAuth + Email)  │    │
│  └──────────────┴──────────────┴──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Deep Dive

### Frontend Framework: Next.js 16 + React 19

**Why Next.js 16?**
- **App Router**: File-based routing with nested layouts
- **React Server Components**: Reduced client-side JavaScript
- **Server Actions**: Direct database mutations without API routes
- **Built-in Optimization**: Image, font, and script optimization
- **React Compiler**: Automatic memoization (enabled in `next.config.ts`)

```typescript
// next.config.ts - React Compiler enabled
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,  // Automatic optimization
};

export default nextConfig;
```

**Why React 19?**
- **Improved Hooks**: Better useState, useEffect performance
- **Automatic Batching**: Multiple state updates in single render
- **Concurrent Features**: Better UX with Suspense
- **Form Actions**: Native form handling

### Language: TypeScript 5

**Type Safety Throughout:**
```typescript
// Strong typing for all data structures
interface IProject {
  businessOwnerId: mongoose.Types.ObjectId;
  clerkId: string;
  projectDetails: {
    websiteType: string;
    designComplexity: string;
    features: string[];
    numPages: number;
    timeline: string;
    budgetRange: string;
  };
  status: 'chatting' | 'team_presented' | 'awaiting_acceptance' | 'team_selected';
  createdAt: Date;
  updatedAt: Date;
}
```

**Benefits:**
- Catch errors at compile-time
- IntelliSense autocomplete
- Refactoring safety
- Self-documenting code

### Styling: Tailwind CSS 4

**Custom Theme Configuration:**
```css
/* globals.css - Custom CSS Variables */
:root {
  --background: #FFFAF0;
  --foreground: #2C1810;
  --royal-red: #8B0000;
  --royal-red-light: #DC143C;
  --cream: #FFF8DC;
  --gold: #D4AF37;
}

/* Custom Utility Classes */
.bg-royal-gradient {
  background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
}

.text-royal-gradient {
  background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.shadow-royal {
  box-shadow: 0 10px 40px rgba(139, 0, 0, 0.15);
}
```

**Why Tailwind 4?**
- Utility-first approach for rapid development
- Custom royal/cream color palette
- Responsive design with mobile-first approach
- No CSS file bloat (purges unused styles)

### Fonts: Google Fonts

```typescript
// layout.tsx - Font Configuration
import { Poppins, Montserrat } from "next/font/google";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: 'swap',  // Prevents FOUT (Flash of Unstyled Text)
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: 'swap',
});
```

**Font Strategy:**
- **Poppins**: Body text (paragraphs, buttons)
- **Montserrat**: Headings (h1-h6, titles)
- Font-display: swap for better perceived performance

### Database: MongoDB Atlas + Mongoose

**Connection Management:**
```typescript
// lib/mongodb.ts - Connection Pooling
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// Global cache to prevent connection growth in development
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

  // Create new connection if none exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,  // Fail fast if connection drops
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
```

**Why This Pattern?**
- **Connection Reuse**: Prevents exhausting MongoDB connection limits
- **Development Hot Reload**: Maintains connection across Next.js reloads
- **Production Ready**: Single connection pool for all requests
- **Error Handling**: Clears failed promises for retry

### Authentication: Clerk

**Provider Setup:**
```typescript
// layout.tsx - Root Layout with Clerk
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${poppins.variable} ${montserrat.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

**Features Used:**
- Google OAuth integration
- Email/password authentication
- Session management
- User profile management
- Built-in UI components (UserButton)

### AI: Groq (Llama 3.3 70B)

**Why Groq?**
- **Speed**: 300+ tokens/second (faster than OpenAI)
- **Cost**: Free tier with 30 requests/minute
- **Quality**: Llama 3.3 70B is state-of-the-art
- **Reliability**: 99.9% uptime

**SDK Usage:**
```typescript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const completion = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [...],
  temperature: 0.7,
  max_tokens: 500,
});
```

### Payments: Razorpay

**Integration:**
```typescript
// lib/razorpay.ts
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default razorpay;
```

**Features:**
- Indian payment methods (UPI, Cards, NetBanking)
- Test mode for development
- Secure checkout modal
- Webhook support for payment verification

---

## Project Structure

```
DevinOut/
├── src/
│   ├── app/                          # Next.js 16 App Router
│   │   ├── layout.tsx               # Root layout (ClerkProvider)
│   │   ├── page.tsx                 # Landing page (/)
│   │   ├── globals.css              # Global styles + Tailwind
│   │   │
│   │   ├── about/
│   │   │   └── page.tsx             # About page
│   │   │
│   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── page.tsx             # Clerk sign-in (catch-all route)
│   │   │
│   │   ├── sign-up/[[...sign-up]]/
│   │   │   └── page.tsx             # Clerk sign-up
│   │   │
│   │   ├── onboarding/
│   │   │   └── page.tsx             # Role selection (Business/Freelancer)
│   │   │
│   │   ├── dashboard/
│   │   │   ├── business/
│   │   │   │   ├── page.tsx         # Business dashboard (AI chat)
│   │   │   │   └── teams/[projectId]/
│   │   │   │       └── page.tsx     # Team selection page
│   │   │   │
│   │   │   └── freelancer/
│   │   │       ├── page.tsx         # Freelancer dashboard
│   │   │       └── profile/
│   │   │           └── page.tsx     # Profile management
│   │   │
│   │   ├── chat/[chatRoomId]/
│   │   │   └── page.tsx             # 3-way chat room
│   │   │
│   │   └── api/                     # Backend API routes
│   │       ├── chatbot/
│   │       │   └── route.ts         # Groq AI chatbot
│   │       │
│   │       ├── teams/
│   │       │   ├── generate/
│   │       │   │   └── route.ts     # AI team matching
│   │       │   ├── select/
│   │       │   │   └── route.ts     # Team selection
│   │       │   └── replace/
│   │       │       └── route.ts     # Replace team member
│   │       │
│   │       ├── chat/
│   │       │   ├── [chatRoomId]/messages/
│   │       │   │   └── route.ts     # GET/POST messages
│   │       │   ├── create-for-project/
│   │       │   │   └── route.ts     # Create chat room
│   │       │   └── room/
│   │       │       └── route.ts     # Get room details
│   │       │
│   │       ├── payment/
│   │       │   └── create-order/
│   │       │       └── route.ts     # Razorpay order creation
│   │       │
│   │       ├── projects/
│   │       │   ├── my-projects/
│   │       │   │   └── route.ts     # Fetch business projects
│   │       │   ├── freelancer-projects/
│   │       │   │   └── route.ts     # Fetch freelancer projects
│   │       │   └── invitation/respond/
│   │       │       └── route.ts     # Accept/reject invitations
│   │       │
│   │       ├── freelancer/profile/
│   │       │   └── route.ts         # Freelancer profile CRUD
│   │       │
│   │       ├── notifications/
│   │       │   └── route.ts         # User notifications
│   │       │
│   │       └── user/onboarding/
│   │           └── route.ts         # Save user role
│   │
│   ├── components/                  # Reusable React components
│   │   ├── Navbar.tsx              # Navigation (with Clerk)
│   │   └── Footer.tsx              # Site footer
│   │
│   ├── lib/                         # Utility libraries
│   │   ├── mongodb.ts              # Database connection
│   │   ├── razorpay.ts             # Payment client
│   │   ├── openai.ts               # OpenAI client (unused)
│   │   └── utils.ts                # Helper functions
│   │
│   ├── models/                      # Mongoose schemas
│   │   ├── User.ts                 # User accounts
│   │   ├── FreelancerProfile.ts    # Freelancer profiles
│   │   ├── Project.ts              # Projects
│   │   ├── ChatRoom.ts             # Chat rooms
│   │   └── Notification.ts         # Notifications
│   │
│   └── middleware.ts                # Clerk auth middleware
│
├── scripts/
│   └── seedFreelancers.ts          # Database seeding script
│
├── public/                          # Static assets
│
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── next.config.ts                   # Next.js config
├── postcss.config.mjs              # PostCSS (Tailwind)
├── eslint.config.mjs               # ESLint rules
└── README.md                        # Project documentation
```

### Key Directory Explanations

**`src/app/`** - Next.js App Router
- File-based routing (folder = route)
- `page.tsx` = route component
- `layout.tsx` = shared layout
- `[param]` = dynamic route segment
- `[[...catch-all]]` = optional catch-all route

**`src/app/api/`** - Backend API Routes
- Each `route.ts` = API endpoint
- Supports GET, POST, PUT, DELETE methods
- Full TypeScript support
- Direct database access via Mongoose

**`src/models/`** - Database Models
- Mongoose schemas with TypeScript interfaces
- Data validation rules
- Relationships via ObjectId references
- Timestamps (createdAt, updatedAt)

**`src/lib/`** - Shared Libraries
- Database connection pooling
- External service clients
- Utility functions
- Reusable logic

---

## Data Flow Architecture

### 1. User Request Flow

```
User Action (Click/Submit)
    ↓
React Event Handler (onClick, onSubmit)
    ↓
useState Update (Local state change)
    ↓
API Call (fetch to /api/*)
    ↓
Next.js API Route Handler
    ↓
Clerk Auth Check (auth())
    ↓
Database Connection (dbConnect())
    ↓
Mongoose Model Query
    ↓
MongoDB Atlas
    ↓
Response Back to Client
    ↓
setState (Update UI)
    ↓
Re-render Component
```

### 2. Example: Sending Chat Message

**Frontend (Client Component):**
```typescript
// chat/[chatRoomId]/page.tsx
'use client';

const sendMessage = async () => {
  if (!input.trim() || sending) return;
  
  setSending(true);
  const messageText = input.trim();
  setInput('');  // Clear input immediately

  try {
    // API call
    const response = await fetch(`/api/chat/${chatRoomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageText }),
    });

    const data = await response.json();

    if (data.success) {
      // Update local state
      setMessages([...messages, data.message]);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setSending(false);
  }
};
```

**Backend (API Route):**
```typescript
// api/chat/[chatRoomId]/messages/route.ts
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';

export async function POST(req: Request, { params }) {
  // 1. Authenticate user
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse request body
  const { message } = await req.json();

  // 3. Connect to database
  await dbConnect();

  // 4. Find chat room
  const chatRoom = await ChatRoom.findById(params.chatRoomId);
  
  // 5. Add message to array
  chatRoom.messages.push({
    senderId: userId,
    senderName: user.name,
    message,
    timestamp: new Date(),
  });

  // 6. Save to database
  await chatRoom.save();

  // 7. Return success
  return NextResponse.json({ success: true, message: newMessage });
}
```

---

## Authentication Flow

### Middleware Protection

```typescript
// src/middleware.ts - Route Protection
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes (no auth required)
const isPublicRoute = createRouteMatcher([
  '/',              // Landing page
  '/about',         // About page
  '/sign-in(.*)',   // Sign-in + catch-all
  '/sign-up(.*)',   // Sign-up + catch-all
  '/api/webhooks(.*)',  // Clerk webhooks
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();  // Redirects to /sign-in if not authenticated
  }
});

// Run middleware on all routes except static files
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### Authentication States

**1. Unauthenticated User**
```
Visit /dashboard/business
    ↓
Middleware checks auth
    ↓
Not authenticated
    ↓
Redirect to /sign-in
```

**2. Authenticated User**
```
Visit /dashboard/business
    ↓
Middleware checks auth
    ↓
Authenticated ✓
    ↓
Allow access
    ↓
Render dashboard
```

### Using Auth in Components

**Client Component:**
```typescript
import { useUser, useClerk } from '@clerk/nextjs';

function Dashboard() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  if (!isSignedIn) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p>Welcome, {user.firstName}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

**API Route:**
```typescript
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const clerkUser = await currentUser();
  
  return Response.json({ 
    clerkId: userId,
    email: clerkUser.emailAddresses[0].emailAddress 
  });
}
```

---

## State Management Strategy

### React Hooks Pattern (No Redux/Zustand)

**Why No State Management Library?**
- App is not complex enough to warrant Redux
- Server Components reduce client-side state needs
- Database is source of truth (not client state)
- Simpler codebase, fewer dependencies

### State Management Approaches

**1. Local Component State (useState)**
```typescript
// For UI state that doesn't need to be shared
const [input, setInput] = useState('');
const [loading, setLoading] = useState(false);
const [showMenu, setShowMenu] = useState(false);
```

**2. Server State (Database + Refetch)**
```typescript
// Fetch data from API, store in state
const [projects, setProjects] = useState<Project[]>([]);

useEffect(() => {
  async function fetchProjects() {
    const response = await fetch('/api/projects/my-projects');
    const data = await response.json();
    setProjects(data.projects);
  }
  fetchProjects();
}, []);
```

**3. Polling for Real-Time Updates**
```typescript
// Chat messages - poll every 3 seconds
useEffect(() => {
  fetchMessages();
  
  const interval = setInterval(fetchMessages, 3000);
  
  return () => clearInterval(interval);  // Cleanup
}, [chatRoomId]);
```

**4. URL State (useParams, useRouter)**
```typescript
// State derived from URL
const params = useParams();
const projectId = params.projectId as string;
```

**5. Global State (ClerkProvider)**
```typescript
// User authentication state managed by Clerk
const { user, isSignedIn } = useUser();
```

---

## Routing & Navigation

### File-Based Routing

```
app/
├── page.tsx                    → /
├── about/page.tsx             → /about
├── dashboard/business/page.tsx → /dashboard/business
├── chat/[chatRoomId]/page.tsx → /chat/123abc (dynamic)
└── sign-in/[[...sign-in]]/page.tsx → /sign-in, /sign-in/sso-callback (catch-all)
```

### Dynamic Routes

```typescript
// app/chat/[chatRoomId]/page.tsx
import { useParams } from 'next/navigation';

export default function ChatPage() {
  const params = useParams();
  const chatRoomId = params.chatRoomId as string;
  
  return <div>Chat Room: {chatRoomId}</div>;
}
```

### Navigation Methods

**1. Link Component (Preferred)**
```typescript
import Link from 'next/link';

<Link href="/dashboard/business">
  Go to Dashboard
</Link>
```

**2. useRouter Hook (Programmatic)**
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

// Navigate
router.push('/dashboard/business');

// Go back
router.back();

// Replace (no history entry)
router.replace('/sign-in');
```

**3. Redirect (Server-Side)**
```typescript
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return <div>Welcome!</div>;
}
```

---

## Performance Optimizations

### 1. Font Optimization
```typescript
// Fonts are preloaded and self-hosted
const poppins = Poppins({
  display: 'swap',  // Prevents FOUT
  preload: true,    // Preloads font files
});
```

### 2. React Compiler
```typescript
// next.config.ts
reactCompiler: true,  // Automatic memoization
```

### 3. Database Connection Pooling
```typescript
// Reuses connections instead of creating new ones
let cached = global.mongoose;
```

### 4. Client vs Server Components
- **Server Components** (default): No JavaScript sent to client
- **Client Components** ('use client'): Only when interactivity needed

### 5. Image Optimization
```typescript
import Image from 'next/image';

<Image 
  src="/logo.png" 
  width={500} 
  height={300}
  alt="Logo"
  // Automatically optimized, lazy-loaded, responsive
/>
```

---

## Security Best Practices

### 1. Environment Variables
```bash
# Never commit to Git
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_test_...
GROQ_API_KEY=gsk_...
```

### 2. API Authentication
```typescript
// Every protected API route
const { userId } = await auth();
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 3. Input Validation
```typescript
// Validate all user inputs
if (!message || typeof message !== 'string') {
  return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
}
```

### 4. CORS Protection
- Next.js API routes are same-origin by default
- No external API calls allowed without explicit configuration

### 5. SQL Injection Prevention
- Mongoose handles escaping automatically
- Never use raw queries with user input

---

## Deployment Architecture

```
GitHub Repository
    ↓
Vercel (CI/CD)
    ↓
Build Process
    ↓
Deploy to Edge Network (Worldwide CDN)
    ↓
Environment Variables Injected
    ↓
Connect to:
    - MongoDB Atlas (Database)
    - Clerk (Auth)
    - Groq (AI)
    - Razorpay (Payments)
```

**Production URL**: `https://devinout.vercel.app`

---

## Summary

DevinOut uses a modern, scalable architecture:

✅ **Next.js 16 + React 19**: Latest features, best performance  
✅ **TypeScript**: Type safety throughout  
✅ **MongoDB + Mongoose**: Flexible schema, type-safe queries  
✅ **Clerk**: Enterprise-grade authentication  
✅ **Groq AI**: Fast, cost-effective AI responses  
✅ **Tailwind CSS 4**: Rapid UI development  
✅ **Vercel**: Zero-config deployment  

**Key Architectural Decisions:**
- No state management library (React hooks sufficient)
- Server Components by default (less JavaScript)
- Polling for real-time (simpler than WebSockets)
- Connection pooling (prevents database overload)
- Middleware for route protection (centralized auth)

---

**Next Document**: Database Models & Schemas - Deep dive into all 5 Mongoose models with TypeScript interfaces and relationships.
