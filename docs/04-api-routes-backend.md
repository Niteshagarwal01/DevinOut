# 🔌 API Routes & Backend - DevinOut (Part 1: AI & Chatbot)

## Table of Contents
1. [Overview](#overview)
2. [Chatbot API](#chatbot-api)
3. [Team Generation API](#team-generation-api)
4. [Team Selection API](#team-selection-api)

---

## Overview

DevinOut uses **Next.js 15 App Router API Routes** (`app/api/*/route.ts`) for all backend operations.

### API Route Structure

```
src/app/api/
├── chatbot/route.ts              # AI conversation with Groq
├── teams/
│   ├── generate/route.ts         # AI team matching algorithm
│   └── select/route.ts           # Team selection & invitations
├── chat/
│   ├── create-for-project/route.ts
│   ├── room/route.ts
│   └── [chatRoomId]/messages/route.ts
├── payment/create-order/route.ts  # Razorpay integration
├── projects/
│   ├── my-projects/route.ts
│   ├── freelancer-projects/route.ts
│   └── invitation/respond/route.ts
├── user/onboarding/route.ts
├── freelancer/profile/route.ts
└── notifications/route.ts
```

### Common Patterns

All API routes follow these patterns:

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();

    // 3. Database connection
    await dbConnect();

    // 4. Business logic
    // ...

    // 5. Return response
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed' },
      { status: 500 }
    );
  }
}
```

---

## Chatbot API

**File:** `app/api/chatbot/route.ts`

### Purpose
- Conversational AI for project requirements gathering
- Uses **Groq Llama 3.3 70B** model
- Asks 6 questions sequentially
- Stores answers in Project model
- Generates detailed project breakdown

### Complete Implementation

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are a friendly, conversational project consultant for DevinOut - an Indian freelance platform.

Have a natural conversation. Ask ONE simple question at a time. Be warm and helpful.

Question flow:
1. Ask what type of website/app they want (e-commerce, portfolio, business site, etc.)
2. Ask about design style preference (simple, modern, creative, advanced)
3. Ask what features they need (login, payments, blog, admin panel, etc.)
4. Ask how many pages/screens approximately
5. Ask about their timeline
6. Ask about budget in Indian Rupees

After all 6 questions, analyze their project and give a friendly, detailed breakdown:

Start with a warm summary of their project in natural language.

Then provide analysis in this structure:

PROJECT OVERVIEW
Write 2-3 sentences about their project type, scope, and what you understand they need.

FEATURE ANALYSIS
List the features they mentioned and briefly explain each one's importance.

ESTIMATED EFFORT
Explain in plain language:
- How complex this project is (simple/moderate/complex)
- Roughly how many hours needed (calculate: pages × 8 hours + features × 10 hours)
- What affects the timeline

COST BREAKDOWN

Traditional Agency Approach:
• Development: ₹[hours × 1500/hr]
• Design & UI/UX: ₹[20% of dev cost]  
• Management overhead: ₹[15% of total]
Total: ₹[sum with markup]

DevinOut Platform Approach:
• Platform unlock fee: Just ₹100-250 (one-time)
• You negotiate directly with freelancers
• Estimated freelancer cost: ₹[hours × 1000/hr average]
• Your savings: Around ₹[difference] compared to agencies!

RECOMMENDED TEAM
Based on budget and timeline, recommend ONE team tier:
- Freemium (free) - for simple/budget projects
- Pro (₹100) - balanced quality and cost
- Premium (₹250) - top quality and fast delivery

SMART SUGGESTIONS
Give 2-3 practical tips specific to their project.

NEXT STEPS
1. Click "Create My Team" to see 3 matched teams
2. Choose your preferred team tier
3. Pay platform fee to unlock access
4. Chat with designer and developer
5. Negotiate and start building!`;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, projectId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    await dbConnect();

    // Get Clerk user info
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Clerk user not found' }, { status: 404 });
    }

    // Get or create User in database
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        role: 'business',
      });
    }

    // Get or create project
    let project = projectId ? await Project.findById(projectId) : null;
    
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const step = userMessages.length;  // Which question we're on (1-6)
    
    if (!project && step === 1) {
      // Create new project on first user message
      project = await Project.create({
        businessOwnerId: user._id,
        clerkId: userId,
        status: 'chatting'
      });
    }
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Call Groq AI with conversation history
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content || 
      'Sorry, I had trouble with that. Could you try again?';

    // Parse and save project details from conversation
    const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';
    
    // Initialize projectDetails if it doesn't exist
    if (!project.projectDetails) {
      project.projectDetails = {
        websiteType: '',
        designComplexity: '',
        features: [],
        numPages: 0,
        timeline: '',
        budgetRange: ''
      };
    }
    
    // Save user's answer based on which step we're on
    if (step === 1) {
      // Extract website type (e.g., "e-commerce", "portfolio")
      project.projectDetails.websiteType = lastUserMsg.toLowerCase().trim();
    } else if (step === 2) {
      // Extract design complexity
      project.projectDetails.designComplexity = lastUserMsg.toLowerCase().trim();
    } else if (step === 3) {
      // Extract features - split by comma, "and", or newlines
      const featuresList = lastUserMsg
        .toLowerCase()
        .replace(/\band\b/g, ',')
        .split(/[,\n]+/)
        .map((f: string) => f.trim())
        .filter((f: string) => f.length > 0);
      project.projectDetails.features = featuresList;
    } else if (step === 4) {
      // Extract number of pages
      const pageMatch = lastUserMsg.match(/(\d+)\s*(page|screen)?/i);
      project.projectDetails.numPages = pageMatch ? parseInt(pageMatch[1]) : 5;
    } else if (step === 5) {
      // Extract timeline
      project.projectDetails.timeline = lastUserMsg.toLowerCase().trim();
    } else if (step === 6) {
      // Extract budget range
      project.projectDetails.budgetRange = lastUserMsg.trim();
      // Update status to team_presented when all questions are answered
      project.status = 'team_presented';
    }

    await project.save();

    // Check if ready to create team (after question 6)
    const showCreateTeam = step >= 6;

    return NextResponse.json({ 
      response: aiResponse,
      showCreateTeam,  // Show "Create Team" button
      projectId: project._id.toString()
    });

  } catch (error: any) {
    console.error('Chatbot error:', error);
    
    // Fallback if Groq fails
    if (error.code === 'ENOTFOUND' || error.status === 401) {
      return NextResponse.json(
        { error: 'Groq API key not configured. Please add GROQ_API_KEY to .env.local' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to get response' },
      { status: 500 }
    );
  }
}
```

### Request/Response Examples

**Request (Step 1 - First user message):**
```json
POST /api/chatbot
{
  "messages": [
    { "role": "assistant", "content": "Welcome! What type of website are you envisioning?" },
    { "role": "user", "content": "I want an e-commerce website" }
  ],
  "projectId": null
}
```

**Response:**
```json
{
  "response": "Great choice! E-commerce websites are popular. Now, what design style do you prefer? Simple and clean, or more creative and advanced?",
  "showCreateTeam": false,
  "projectId": "674abc123def456789"
}
```

**Request (Step 6 - Final question):**
```json
POST /api/chatbot
{
  "messages": [
    // ... previous 5 Q&A pairs
    { "role": "user", "content": "₹25,000 to ₹50,000" }
  ],
  "projectId": "674abc123def456789"
}
```

**Response:**
```json
{
  "response": "PROJECT OVERVIEW\nYou're looking to build an e-commerce website with modern design...\n\nCOST BREAKDOWN\nTraditional Agency: ₹85,000\nDevinOut Platform: ₹35,000 + ₹100-250 unlock fee\nYour savings: ₹50,000!\n\nRECOMMENDED TEAM\nPro Team (₹100) - Perfect balance for your budget...",
  "showCreateTeam": true,
  "projectId": "674abc123def456789"
}
```

### Key Features

1. **Sequential Question Flow**
   ```typescript
   const userMessages = messages.filter((m: any) => m.role === 'user');
   const step = userMessages.length;  // 1-6
   ```

2. **Project Creation on First Message**
   ```typescript
   if (!project && step === 1) {
     project = await Project.create({
       businessOwnerId: user._id,
       clerkId: userId,
       status: 'chatting'
     });
   }
   ```

3. **Progressive Data Extraction**
   ```typescript
   if (step === 1) {
     project.projectDetails.websiteType = lastUserMsg.toLowerCase().trim();
   } else if (step === 2) {
     project.projectDetails.designComplexity = lastUserMsg.toLowerCase().trim();
   }
   // ... and so on
   ```

4. **Groq AI Integration**
   ```typescript
   const completion = await groq.chat.completions.create({
     model: 'llama-3.3-70b-versatile',
     messages: [
       { role: 'system', content: SYSTEM_PROMPT },
       ...messages
     ],
     temperature: 0.7,
     max_tokens: 500,
   });
   ```

---

## Team Generation API

**File:** `app/api/teams/generate/route.ts`

### Purpose
- AI-powered team matching algorithm
- Scores all Designer + Developer combinations
- Selects top 3 teams
- Assigns team tiers (Premium, Pro, Freemium)
- Calculates costs and hours

### Complete Implementation

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import FreelancerProfile from '@/models/FreelancerProfile';
import User from '@/models/User';

interface TeamScore {
  designer: any;
  developer: any;
  score: number;
  teamType: 'premium' | 'pro' | 'freemium';
}

function calculateMatchScore(
  designer: any,
  developer: any,
  projectDetails: any
): number {
  let score = 0;

  // Experience level scoring (30 points total)
  const expPoints = { junior: 1, mid: 2, senior: 3 };
  score += expPoints[designer.experienceLevel as keyof typeof expPoints] * 15;
  score += expPoints[developer.experienceLevel as keyof typeof expPoints] * 15;

  // Rating scoring (20 points total)
  score += designer.rating * 10;
  score += developer.rating * 10;

  // Completed projects bonus (40 points max)
  score += Math.min(designer.completedProjects * 2, 20);
  score += Math.min(developer.completedProjects * 2, 20);

  // Design complexity match (15 points)
  const complexityMatch = {
    simple: designer.experienceLevel === 'junior' || designer.experienceLevel === 'mid',
    moderate: designer.experienceLevel === 'mid' || designer.experienceLevel === 'senior',
    advanced: designer.experienceLevel === 'senior'
  };
  
  if (complexityMatch[projectDetails.designComplexity as keyof typeof complexityMatch]) {
    score += 15;
  }

  // Skills match for developer (30 points max)
  const requiredSkills = projectDetails.features || [];
  const hasReact = requiredSkills.some((f: string) => 
    f.toLowerCase().includes('modern') || f.toLowerCase().includes('interactive')
  );
  const hasPayment = requiredSkills.some((f: string) => 
    f.toLowerCase().includes('payment') || f.toLowerCase().includes('checkout')
  );
  const hasAuth = requiredSkills.some((f: string) => 
    f.toLowerCase().includes('login') || f.toLowerCase().includes('auth')
  );

  if (hasReact && developer.skills.includes('React')) score += 10;
  if (hasPayment && developer.skills.includes('Payment Integration')) score += 10;
  if (hasAuth && developer.skills.includes('Authentication')) score += 10;

  return score;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    await dbConnect();

    // Ensure User model is loaded for populate
    User.modelName;

    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify ownership
    if (project.clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get available designers and developers
    const designers = await FreelancerProfile.find({
      freelancerType: 'designer'
    }).populate('userId');

    const developers = await FreelancerProfile.find({
      freelancerType: 'developer'
    }).populate('userId');

    if (designers.length === 0 || developers.length === 0) {
      return NextResponse.json({ 
        error: 'No available freelancers at the moment.' 
      }, { status: 404 });
    }

    // Calculate all possible team combinations
    const allTeams: TeamScore[] = [];

    for (const designer of designers) {
      for (const developer of developers) {
        const score = calculateMatchScore(designer, developer, project.projectDetails);
        allTeams.push({
          designer,
          developer,
          score,
          teamType: 'freemium'
        });
      }
    }

    // Sort by score (highest first)
    allTeams.sort((a, b) => b.score - a.score);

    // Select top 3 teams
    const topTeams = allTeams.slice(0, Math.min(3, allTeams.length));

    // Assign team types to top 3
    if (topTeams.length >= 1) topTeams[0].teamType = 'premium';
    if (topTeams.length >= 2) topTeams[1].teamType = 'pro';
    if (topTeams.length >= 3) topTeams[2].teamType = 'freemium';

    // Parse budget from project
    const budgetRange = project.projectDetails.budgetRange || '';
    let maxBudget = 50000; // default

    const cleanBudget = budgetRange.replace(/₹|,/g, '').toLowerCase();
    const budgetMatch = cleanBudget.match(/(\d+)\s*k?\s*-\s*(\d+)\s*k?/i);
    
    if (budgetMatch) {
      let upperBudget = parseInt(budgetMatch[2]);
      if (budgetRange.toLowerCase().includes('k') || upperBudget < 1000) {
        upperBudget = upperBudget * 1000;
      }
      maxBudget = upperBudget;
    }

    // Calculate estimated hours
    const estimatedHours = (
      (project.projectDetails.numPages || 5) * 8 +  // 8 hours per page
      (project.projectDetails.features?.length || 1) * 12 +  // 12 hours per feature
      (project.projectDetails.designComplexity === 'advanced' ? 40 : 
       project.projectDetails.designComplexity === 'moderate' ? 20 : 10)
    );

    // Platform fees
    const PLATFORM_FEES = {
      premium: 250,
      pro: 100,
      freemium: 0
    };

    // Format response
    const teams = topTeams.map(team => {
      const platformFee = PLATFORM_FEES[team.teamType];

      return {
        teamType: team.teamType,
        score: team.score,
        designer: {
          id: team.designer._id,
          name: (team.designer.userId as any).name,
          experienceLevel: team.designer.experienceLevel,
          skills: team.designer.skills,
          rating: team.designer.rating,
          completedProjects: team.designer.completedProjects,
          hourlyRate: team.designer.hourlyRate,
          portfolioLink: team.designer.portfolioLink,
          bio: team.designer.bio
        },
        developer: {
          id: team.developer._id,
          name: (team.developer.userId as any).name,
          experienceLevel: team.developer.experienceLevel,
          skills: team.developer.skills,
          rating: team.developer.rating,
          completedProjects: team.developer.completedProjects,
          hourlyRate: team.developer.hourlyRate,
          portfolioLink: team.developer.portfolioLink,
          bio: team.developer.bio
        },
        platformFee,
        estimatedHours,
        estimatedProjectCost: Math.min(
          maxBudget, 
          Math.round(estimatedHours * ((team.designer.hourlyRate || 1000) + 
                                       (team.developer.hourlyRate || 1200)) / 2)
        )
      };
    });

    return NextResponse.json({ teams, project });

  } catch (error: any) {
    console.error('Team generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate teams' },
      { status: 500 }
    );
  }
}
```

### Scoring Algorithm Breakdown

```typescript
// TOTAL POSSIBLE SCORE: ~135 points

// 1. Experience Level (30 points)
junior = 1 × 15 = 15
mid = 2 × 15 = 30
senior = 3 × 15 = 45

// 2. Rating (20 points)
rating × 10 (e.g., 4.5 × 10 = 45)

// 3. Completed Projects (40 points max)
Math.min(completedProjects × 2, 20) per freelancer

// 4. Design Complexity Match (15 points)
if (designer experience matches project complexity) +15

// 5. Skill Matching (30 points)
React skill match: +10
Payment skill match: +10
Auth skill match: +10
```

### Request/Response Example

**Request:**
```json
POST /api/teams/generate
{
  "projectId": "674abc123def456789"
}
```

**Response:**
```json
{
  "teams": [
    {
      "teamType": "premium",
      "score": 125,
      "designer": {
        "id": "673xyz",
        "name": "Priya Sharma",
        "experienceLevel": "senior",
        "skills": ["Figma", "UI/UX", "Adobe XD"],
        "rating": 4.8,
        "completedProjects": 15,
        "hourlyRate": 1500,
        "portfolioLink": "https://portfolio.com",
        "bio": "Senior UI/UX designer..."
      },
      "developer": {
        "id": "673abc",
        "name": "Rahul Kumar",
        "experienceLevel": "senior",
        "skills": ["React", "Next.js", "MongoDB"],
        "rating": 4.9,
        "completedProjects": 20,
        "hourlyRate": 2000
      },
      "platformFee": 250,
      "estimatedHours": 120,
      "estimatedProjectCost": 48000
    },
    {
      "teamType": "pro",
      "score": 95,
      // ... similar structure
      "platformFee": 100
    },
    {
      "teamType": "freemium",
      "score": 75,
      // ... similar structure
      "platformFee": 0
    }
  ],
  "project": { /* project data */ }
}
```

---

## Team Selection API

**File:** `app/api/teams/select/route.ts`

### Purpose
- User selects a team from top 3
- Send invitations to designer and developer
- Create notifications
- Store payment info (if Pro/Premium)
- **Does NOT create chat room yet** (waits for both to accept)

### Complete Implementation

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import Notification from '@/models/Notification';
import FreelancerProfile from '@/models/FreelancerProfile';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, designerId, developerId, teamType, paymentDetails } = await req.json();

    if (!projectId || !designerId || !developerId || !teamType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    // Get project and verify ownership
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get freelancer profiles to get user IDs
    const designerProfile = await FreelancerProfile.findById(designerId).populate('userId');
    const developerProfile = await FreelancerProfile.findById(developerId).populate('userId');

    if (!designerProfile || !developerProfile) {
      return NextResponse.json({ error: 'Freelancers not found' }, { status: 404 });
    }

    // Update project with selected team (NO chatroom yet)
    project.selectedTeam = {
      designerId: designerProfile.userId._id,
      developerId: developerProfile.userId._id,
      teamType: teamType as 'premium' | 'pro' | 'freemium',
      designerAccepted: false,
      developerAccepted: false,
      designerRejected: false,
      developerRejected: false,
    };
    project.status = 'awaiting_acceptance';
    project.invitationSentAt = new Date();
    
    if (teamType !== 'freemium' && paymentDetails) {
      project.paymentStatus = 'paid';
      project.razorpayOrderId = paymentDetails.razorpay_order_id;
    }

    await project.save();

    // Send INVITATION notifications to freelancers
    await Notification.create({
      userId: designerProfile.userId._id,
      clerkId: (designerProfile.userId as any).clerkId,
      type: 'invitation',
      title: 'New Project Invitation!',
      message: `🎉 You've been invited to join a ${project.projectDetails.websiteType} project as the Designer. Accept within 48 hours!`,
      projectId: project._id,
      isRead: false
    });

    await Notification.create({
      userId: developerProfile.userId._id,
      clerkId: (developerProfile.userId as any).clerkId,
      type: 'invitation',
      title: 'New Project Invitation!',
      message: `🎉 You've been invited to join a ${project.projectDetails.websiteType} project as the Developer. Accept within 48 hours!`,
      projectId: project._id,
      isRead: false
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Invitations sent to freelancers',
      projectId: project._id
    });

  } catch (error: any) {
    console.error('Team selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to select team' },
      { status: 500 }
    );
  }
}
```

### Request/Response Example

**Request:**
```json
POST /api/teams/select
{
  "projectId": "674abc123def456789",
  "designerId": "673xyz",
  "developerId": "673abc",
  "teamType": "pro",
  "paymentDetails": {
    "razorpay_order_id": "order_ABC123",
    "razorpay_payment_id": "pay_XYZ789",
    "razorpay_signature": "signature_hash"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitations sent to freelancers",
  "projectId": "674abc123def456789"
}
```

### Database Changes

After this API call, the Project document looks like:

```javascript
{
  _id: "674abc123def456789",
  businessOwnerId: "673owner",
  clerkId: "user_clerk123",
  status: "awaiting_acceptance",  // Changed from "team_presented"
  projectDetails: { /* ... */ },
  selectedTeam: {
    designerId: "673designerUser",
    developerId: "673devUser",
    teamType: "pro",
    designerAccepted: false,  // Waiting
    developerAccepted: false, // Waiting
    designerRejected: false,
    developerRejected: false
  },
  invitationSentAt: "2025-11-27T10:30:00Z",
  paymentStatus: "paid",
  razorpayOrderId: "order_ABC123",
  chatRoomId: null  // Still null - created after acceptance
}
```

---

**Continue to Part 2?** (Chat, Payment, Projects, User APIs)
