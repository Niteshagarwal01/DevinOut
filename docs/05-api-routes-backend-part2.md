# 🔌 API Routes & Backend - DevinOut (Part 2: Chat, Payment, Projects)

## Table of Contents
1. [Chat APIs](#chat-apis)
2. [Payment API](#payment-api)
3. [Project APIs](#project-apis)
4. [User & Freelancer APIs](#user--freelancer-apis)
5. [Notifications API](#notifications-api)

---

## Chat APIs

### 1. Get Messages (GET)

**File:** `app/api/chat/[chatRoomId]/messages/route.ts`

**Purpose:** Fetch all messages from a chat room (used for polling)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatRoomId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatRoomId } = await params;

    await dbConnect();

    const chatRoom = await ChatRoom.findById(chatRoomId);
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Check if user is a participant
    const isParticipant = chatRoom.participants.some(
      (p: any) => p.clerkId === user.id
    );

    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized to view this chat' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      messages: chatRoom.messages,
      participants: chatRoom.participants,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    );
  }
}
```

**Request:**
```http
GET /api/chat/674chatroom123/messages
Authorization: Clerk session
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "senderId": "673user1",
      "senderName": "John Doe",
      "message": "Welcome to the project!",
      "timestamp": "2025-11-27T10:00:00Z"
    },
    {
      "senderId": "673user2",
      "senderName": "Jane Smith",
      "message": "Thanks! Excited to work together.",
      "timestamp": "2025-11-27T10:05:00Z"
    }
  ],
  "participants": [
    {
      "userId": "673user1",
      "clerkId": "user_clerk1",
      "role": "business",
      "name": "John Doe"
    },
    {
      "userId": "673user2",
      "clerkId": "user_clerk2",
      "role": "designer",
      "name": "Jane Smith"
    },
    {
      "userId": "673user3",
      "clerkId": "user_clerk3",
      "role": "developer",
      "name": "Bob Johnson"
    }
  ]
}
```

---

### 2. Send Message (POST)

**File:** `app/api/chat/[chatRoomId]/messages/route.ts`

**Purpose:** Send a new message to chat room

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatRoomId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatRoomId } = await params;
    const { message } = await request.json();

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    await dbConnect();

    const chatRoom = await ChatRoom.findById(chatRoomId);
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Check if user is a participant
    const participant = chatRoom.participants.find(
      (p: any) => p.clerkId === user.id
    );

    if (!participant) {
      return NextResponse.json({ error: 'Not authorized to send messages' }, { status: 403 });
    }

    // Add new message
    const newMessage = {
      senderId: participant.userId,
      senderName: participant.name,
      message: message.trim(),
      timestamp: new Date(),
    };

    chatRoom.messages.push(newMessage);
    await chatRoom.save();

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    );
  }
}
```

**Request:**
```json
POST /api/chat/674chatroom123/messages
{
  "message": "I have a question about the design..."
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "senderId": "673user2",
    "senderName": "Jane Smith",
    "message": "I have a question about the design...",
    "timestamp": "2025-11-27T10:15:00Z"
  }
}
```

---

### 3. Get Chat Room by Project

**File:** `app/api/chat/room/route.ts`

**Purpose:** Get chat room ID for a specific project

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import Project from '@/models/Project';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    await dbConnect();

    const project = await Project.findById(projectId);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.chatRoomId) {
      return NextResponse.json({ error: 'Chat room not created yet' }, { status: 404 });
    }

    const chatRoom = await ChatRoom.findById(project.chatRoomId);
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Check if user is a participant
    const isParticipant = chatRoom.participants.some(
      (p: any) => p.clerkId === user.id
    );

    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized to view this chat' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      chatRoom: {
        _id: chatRoom._id,
        projectId: chatRoom.projectId,
        participants: chatRoom.participants,
      },
    });
  } catch (error: any) {
    console.error('Error fetching chat room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat room', details: error.message },
      { status: 500 }
    );
  }
}
```

**Request:**
```http
GET /api/chat/room?projectId=674abc123def456789
```

**Response:**
```json
{
  "success": true,
  "chatRoom": {
    "_id": "674chatroom123",
    "projectId": "674abc123def456789",
    "participants": [
      { "userId": "673user1", "clerkId": "user_clerk1", "role": "business", "name": "John Doe" },
      { "userId": "673user2", "clerkId": "user_clerk2", "role": "designer", "name": "Jane Smith" },
      { "userId": "673user3", "clerkId": "user_clerk3", "role": "developer", "name": "Bob Johnson" }
    ]
  }
}
```

---

### 4. Create Chat Room

**File:** `app/api/chat/create-for-project/route.ts`

**Purpose:** Create a chat room for a project (rarely used - usually created automatically)

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import ChatRoom from '@/models/ChatRoom';
import User from '@/models/User';

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

    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if chat room already exists
    let chatRoom = await ChatRoom.findOne({ projectId: project._id });

    if (chatRoom) {
      return NextResponse.json({ 
        success: true, 
        chatRoomId: chatRoom._id,
        message: 'Chat room already exists'
      });
    }

    // Get business owner
    const businessOwner = await User.findOne({ clerkId: userId });
    if (!businessOwner) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create chat room with just business owner
    chatRoom = await ChatRoom.create({
      projectId: project._id,
      participants: [
        {
          userId: businessOwner._id,
          clerkId: businessOwner.clerkId,
          role: 'business',
          name: businessOwner.name
        }
      ],
      messages: [
        {
          senderId: businessOwner._id,
          senderName: businessOwner.name,
          message: `Chat room created for ${project.projectDetails.websiteType} project.`,
          timestamp: new Date()
        }
      ]
    });

    // Update project with chat room ID
    project.chatRoomId = chatRoom._id;
    await project.save();

    return NextResponse.json({ 
      success: true, 
      chatRoomId: chatRoom._id,
      message: 'Chat room created successfully'
    });

  } catch (error: any) {
    console.error('Create chat room error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create chat room' },
      { status: 500 }
    );
  }
}
```

---

## Payment API

**File:** `app/api/payment/create-order/route.ts`

### Purpose
- Create Razorpay order for Pro/Premium teams
- Returns order ID for frontend checkout
- Stores payment details in Project

### Complete Implementation

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, projectId, teamType } = await req.json();

    if (!amount || !projectId || !teamType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create unique receipt (max 40 chars)
    const shortId = projectId.slice(-8);  // Last 8 chars of MongoDB ObjectId
    const timestamp = Date.now().toString().slice(-8);  // Last 8 digits
    const receipt = `${shortId}_${timestamp}`;  // Total: 17 chars
    
    const options = {
      amount: amount * 100,  // Convert to paise (₹100 = 10000 paise)
      currency: 'INR',
      receipt,
      notes: {
        projectId,
        teamType,
        userId,
      },
    };

    // Create Razorpay order
    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
```

### Request/Response Example

**Request:**
```json
POST /api/payment/create-order
{
  "amount": 100,
  "projectId": "674abc123def456789",
  "teamType": "pro"
}
```

**Response:**
```json
{
  "orderId": "order_ABC123XYZ456",
  "amount": 10000,
  "currency": "INR"
}
```

### Frontend Integration

```typescript
// In React component
const initiatePayment = async (team: Team) => {
  // 1. Create order
  const orderResponse = await fetch('/api/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: team.platformFee,  // ₹100 or ₹250
      projectId,
      teamType: team.teamType,
    }),
  });

  const orderData = await orderResponse.json();

  // 2. Open Razorpay checkout
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: orderData.amount,
    currency: 'INR',
    order_id: orderData.orderId,
    handler: async function (response: any) {
      // 3. Payment successful - select team
      await selectTeam(team, response);
    },
    theme: { color: '#8B0000' },
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
```

---

## Project APIs

### 1. Get My Projects (Business Owner)

**File:** `app/api/projects/my-projects/route.ts`

**Purpose:** Fetch all projects created by the business owner

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all projects for this user
    const rawProjects = await Project.find({ 
      clerkId: userId 
    })
    .sort({ createdAt: -1 })
    .lean();

    // Flatten projectDetails for frontend
    const projects = rawProjects.map((p: any) => ({
      _id: p._id,
      websiteType: p.projectDetails?.websiteType || '',
      designComplexity: p.projectDetails?.designComplexity || '',
      features: p.projectDetails?.features || [],
      numPages: p.projectDetails?.numPages || 0,
      timeline: p.projectDetails?.timeline || '',
      budgetRange: p.projectDetails?.budgetRange || '',
      status: p.status,
      selectedTeamType: p.selectedTeam?.teamType || null,
      chatRoomId: p.chatRoomId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      selectedTeam: {
        designerAccepted: p.selectedTeam?.designerAccepted || false,
        developerAccepted: p.selectedTeam?.developerAccepted || false,
        designerRejected: p.selectedTeam?.designerRejected || false,
        developerRejected: p.selectedTeam?.developerRejected || false,
      }
    }));

    return NextResponse.json({ 
      success: true, 
      projects 
    });

  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch projects',
      details: error.message 
    }, { status: 500 });
  }
}
```

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "_id": "674abc123",
      "websiteType": "e-commerce",
      "designComplexity": "moderate",
      "features": ["payment", "login", "product catalog"],
      "numPages": 10,
      "timeline": "2 months",
      "budgetRange": "₹25,000-₹50,000",
      "status": "team_accepted",
      "selectedTeamType": "pro",
      "chatRoomId": "674chat123",
      "createdAt": "2025-11-20T10:00:00Z",
      "updatedAt": "2025-11-27T10:00:00Z",
      "selectedTeam": {
        "designerAccepted": true,
        "developerAccepted": true,
        "designerRejected": false,
        "developerRejected": false
      }
    }
  ]
}
```

---

### 2. Get Freelancer Projects

**File:** `app/api/projects/freelancer-projects/route.ts`

**Purpose:** Fetch all projects where freelancer is invited (designer or developer)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Project from '@/models/Project';
import FreelancerProfile from '@/models/FreelancerProfile';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get freelancer profile
    const freelancerProfile = await FreelancerProfile.findOne({ userId: currentUser._id });
    
    if (!freelancerProfile) {
      return NextResponse.json({ 
        error: 'Freelancer profile not found' 
      }, { status: 404 });
    }

    // Find projects where this freelancer is in selectedTeam
    const allProjects = await Project.find({
      $or: [
        { 'selectedTeam.designerId': currentUser._id },
        { 'selectedTeam.developerId': currentUser._id }
      ]
    })
    .sort({ updatedAt: -1 })
    .lean();

    // Add role and acceptance status
    const projects = allProjects.map((p: any) => {
      const isDesigner = p.selectedTeam?.designerId?.toString() === currentUser._id.toString();
      const isDeveloper = p.selectedTeam?.developerId?.toString() === currentUser._id.toString();
      
      return {
        _id: p._id,
        websiteType: p.projectDetails?.websiteType || '',
        designComplexity: p.projectDetails?.designComplexity || '',
        features: p.projectDetails?.features || [],
        numPages: p.projectDetails?.numPages || 0,
        timeline: p.projectDetails?.timeline || '',
        budgetRange: p.projectDetails?.budgetRange || '',
        status: p.status,
        selectedTeamType: p.selectedTeam?.teamType || null,
        chatRoomId: p.chatRoomId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        myRole: isDesigner ? 'designer' : 'developer',
        myAcceptance: isDesigner ? p.selectedTeam?.designerAccepted : p.selectedTeam?.developerAccepted,
        myRejection: isDesigner ? p.selectedTeam?.designerRejected : p.selectedTeam?.developerRejected,
        invitationSentAt: p.invitationSentAt
      };
    });

    // Categorize projects
    const pending = projects.filter((p: any) => 
      p.status === 'awaiting_acceptance' && !p.myAcceptance && !p.myRejection
    );
    const ongoing = projects.filter((p: any) => 
      ['team_accepted', 'team_selected', 'in_progress'].includes(p.status) && p.myAcceptance
    );
    const completed = projects.filter((p: any) => p.status === 'completed');

    return NextResponse.json({ 
      success: true, 
      projects: {
        pending,
        ongoing,
        completed,
        all: projects
      }
    });

  } catch (error: any) {
    console.error('Error fetching freelancer projects:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch projects',
      details: error.message 
    }, { status: 500 });
  }
}
```

**Response:**
```json
{
  "success": true,
  "projects": {
    "pending": [
      {
        "_id": "674abc123",
        "websiteType": "e-commerce",
        "status": "awaiting_acceptance",
        "myRole": "designer",
        "myAcceptance": false,
        "myRejection": false,
        "invitationSentAt": "2025-11-27T10:00:00Z"
      }
    ],
    "ongoing": [
      {
        "_id": "674def456",
        "websiteType": "portfolio",
        "status": "team_accepted",
        "myRole": "developer",
        "myAcceptance": true,
        "chatRoomId": "674chat456"
      }
    ],
    "completed": [],
    "all": [...]
  }
}
```

---

### 3. Respond to Invitation

**File:** `app/api/projects/invitation/respond/route.ts`

**Purpose:** Freelancer accepts or rejects project invitation

**This is the most complex API** - handles 3 scenarios:
1. Both accept → Create chat room
2. Both reject → Reset project
3. One accepts, one rejects → Partial chat room + rating penalty

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import ChatRoom from '@/models/ChatRoom';
import Notification from '@/models/Notification';
import FreelancerProfile from '@/models/FreelancerProfile';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, response } = await req.json();

    if (!projectId || !response || !['accept', 'reject'].includes(response)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    await dbConnect();

    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'awaiting_acceptance') {
      return NextResponse.json({ error: 'Invitations already processed' }, { status: 400 });
    }

    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is designer or developer
    const isDesigner = project.selectedTeam?.designerId.toString() === currentUser._id.toString();
    const isDeveloper = project.selectedTeam?.developerId.toString() === currentUser._id.toString();

    if (!isDesigner && !isDeveloper) {
      return NextResponse.json({ error: 'You are not part of this team' }, { status: 403 });
    }

    // Check if already responded
    if (isDesigner && (project.selectedTeam?.designerAccepted || project.selectedTeam?.designerRejected)) {
      return NextResponse.json({ error: 'You have already responded' }, { status: 400 });
    }
    if (isDeveloper && (project.selectedTeam?.developerAccepted || project.selectedTeam?.developerRejected)) {
      return NextResponse.json({ error: 'You have already responded' }, { status: 400 });
    }

    // Update acceptance/rejection status
    if (response === 'accept') {
      if (isDesigner) {
        project.selectedTeam!.designerAccepted = true;
      } else {
        project.selectedTeam!.developerAccepted = true;
      }
    } else {
      if (isDesigner) {
        project.selectedTeam!.designerRejected = true;
      } else {
        project.selectedTeam!.developerRejected = true;
      }
    }

    await project.save();

    // Check both responses
    const designerAccepted = project.selectedTeam?.designerAccepted || false;
    const developerAccepted = project.selectedTeam?.developerAccepted || false;
    const designerRejected = project.selectedTeam?.designerRejected || false;
    const developerRejected = project.selectedTeam?.developerRejected || false;

    const bothResponded = (designerAccepted || designerRejected) && 
                          (developerAccepted || developerRejected);

    if (bothResponded) {
      // SCENARIO 1: Both accepted
      if (designerAccepted && developerAccepted) {
        await createChatRoom(project, true, true);
        project.status = 'team_accepted';
        await project.save();

        // Notify business owner
        const businessOwner = await User.findById(project.businessOwnerId);
        if (businessOwner) {
          await Notification.create({
            userId: businessOwner._id,
            clerkId: businessOwner.clerkId,
            type: 'project_update',
            title: 'Team Accepted!',
            message: `🎉 Both freelancers accepted your ${project.projectDetails.websiteType} project. Chat room is ready!`,
            projectId: project._id,
            isRead: false
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Both freelancers accepted! Chat room created.',
          chatRoomId: project.chatRoomId,
          status: 'both_accepted'
        });
      }
      
      // SCENARIO 2: Both rejected
      else if (designerRejected && developerRejected) {
        project.status = 'team_presented';
        project.selectedTeam = undefined;
        await project.save();

        const businessOwner = await User.findById(project.businessOwnerId);
        if (businessOwner) {
          await Notification.create({
            userId: businessOwner._id,
            clerkId: businessOwner.clerkId,
            type: 'project_update',
            title: 'Team Unavailable',
            message: `Both freelancers declined your ${project.projectDetails.websiteType} project. Generate a new team.`,
            projectId: project._id,
            isRead: false
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Both freelancers rejected. No rating impact.',
          status: 'both_rejected'
        });
      }
      
      // SCENARIO 3: One accepted, one rejected
      else {
        const acceptedRole = designerAccepted ? 'designer' : 'developer';
        const rejectedRole = designerRejected ? 'designer' : 'developer';

        // Create chatroom with business + accepted freelancer only
        await createChatRoom(project, designerAccepted, developerAccepted);
        project.status = 'team_accepted';
        await project.save();

        // PENALTY: Reduce rejector's rating by 0.3
        const rejectorId = designerRejected ? 
          project.selectedTeam?.designerId : 
          project.selectedTeam?.developerId;
        const rejectorProfile = await FreelancerProfile.findOne({ userId: rejectorId });
        if (rejectorProfile) {
          rejectorProfile.rating = Math.max(1.0, rejectorProfile.rating - 0.3);
          await rejectorProfile.save();
        }

        // Notify business owner
        const businessOwner = await User.findById(project.businessOwnerId);
        if (businessOwner) {
          await Notification.create({
            userId: businessOwner._id,
            clerkId: businessOwner.clerkId,
            type: 'project_update',
            title: 'Partial Team Acceptance',
            message: `The ${acceptedRole} accepted. The ${rejectedRole} declined.`,
            projectId: project._id,
            isRead: false
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: `${acceptedRole} accepted. ${rejectedRole} declined (rating reduced).`,
          chatRoomId: project.chatRoomId,
          status: 'partial_acceptance',
          acceptedRole,
          rejectedRole
        });
      }
    } else {
      // Only one person responded
      return NextResponse.json({ 
        success: true, 
        message: `You ${response}ed. Waiting for the other freelancer.`,
        status: 'waiting'
      });
    }

  } catch (error: any) {
    console.error('Invitation response error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process response' },
      { status: 500 }
    );
  }
}

// Helper: Create chat room with specified participants
async function createChatRoom(project: any, includeDesigner: boolean, includeDeveloper: boolean) {
  const businessOwner = await User.findById(project.businessOwnerId);
  if (!businessOwner) throw new Error('Business owner not found');

  const participants: any[] = [
    {
      userId: businessOwner._id,
      clerkId: businessOwner.clerkId,
      role: 'business' as const,
      name: businessOwner.name
    }
  ];

  if (includeDesigner && project.selectedTeam?.designerId) {
    const designer = await User.findById(project.selectedTeam.designerId);
    if (designer) {
      participants.push({
        userId: designer._id,
        clerkId: designer.clerkId,
        role: 'designer' as const,
        name: designer.name
      });
    }
  }

  if (includeDeveloper && project.selectedTeam?.developerId) {
    const developer = await User.findById(project.selectedTeam.developerId);
    if (developer) {
      participants.push({
        userId: developer._id,
        clerkId: developer.clerkId,
        role: 'developer' as const,
        name: developer.name
      });
    }
  }

  const chatRoom = await ChatRoom.create({
    projectId: project._id,
    participants,
    messages: [
      {
        senderId: businessOwner._id,
        senderName: businessOwner.name,
        message: `Welcome! Let's build this ${project.projectDetails.websiteType} project together. 🚀`,
        timestamp: new Date()
      }
    ]
  });

  project.chatRoomId = chatRoom._id;
  await project.save();

  return chatRoom;
}
```

**Request:**
```json
POST /api/projects/invitation/respond
{
  "projectId": "674abc123",
  "response": "accept"
}
```

**Response (Both accepted):**
```json
{
  "success": true,
  "message": "Both freelancers accepted! Chat room created.",
  "chatRoomId": "674chat123",
  "status": "both_accepted"
}
```

**Response (Waiting):**
```json
{
  "success": true,
  "message": "You accepted. Waiting for the other freelancer.",
  "status": "waiting"
}
```

---

## User & Freelancer APIs

### 1. User Onboarding

**File:** `app/api/user/onboarding/route.ts`

**Purpose:** Save user role (business/freelancer) from Clerk to MongoDB

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let { role } = body;

    await dbConnect();

    // Get user info from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no role in body, try Clerk metadata
    if (!role && clerkUser.unsafeMetadata?.role) {
      role = clerkUser.unsafeMetadata.role;
    }

    if (!role || !['business', 'freelancer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create or update user in MongoDB
    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        role: role,
      },
      { upsert: true, new: true }
    );

    // For freelancers, check if profile exists
    if (role === 'freelancer') {
      const FreelancerProfile = (await import('@/models/FreelancerProfile')).default;
      const profile = await FreelancerProfile.findOne({ clerkId: userId });
      
      if (!profile) {
        return NextResponse.json({ 
          success: true, 
          user: dbUser,
          redirectTo: '/dashboard/freelancer/profile'  // Create profile first
        });
      } else {
        return NextResponse.json({ 
          success: true, 
          user: dbUser,
          redirectTo: '/dashboard/freelancer'
        });
      }
    }

    // Business users go straight to dashboard
    return NextResponse.json({ 
      success: true, 
      user: dbUser,
      redirectTo: '/dashboard/business'
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to save user role' },
      { status: 500 }
    );
  }
}
```

---

### 2. Freelancer Profile (GET, POST, PATCH)

**File:** `app/api/freelancer/profile/route.ts`

**GET - Get profile:**
```typescript
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const profile = await FreelancerProfile.findOne({ clerkId: userId });

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}
```

**POST - Create profile:**
```typescript
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      freelancerType,
      skills,
      experienceLevel,
      portfolioLink,
      hourlyRate,
      bio,
    } = body;

    // Validation
    if (!freelancerType || !['designer', 'developer'].includes(freelancerType)) {
      return NextResponse.json({ error: 'Invalid freelancer type' }, { status: 400 });
    }

    if (!skills || skills.length < 3) {
      return NextResponse.json({ error: 'At least 3 skills required' }, { status: 400 });
    }

    if (!experienceLevel || !['junior', 'mid', 'senior'].includes(experienceLevel)) {
      return NextResponse.json({ error: 'Invalid experience level' }, { status: 400 });
    }

    await dbConnect();

    // Get Clerk user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Clerk user not found' }, { status: 404 });
    }

    // Get or create User
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        role: 'freelancer',
      });
    }

    // Create freelancer profile
    const profile = await FreelancerProfile.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          userId: user._id,
          clerkId: userId,
          freelancerType,
          skills,
          experienceLevel,
          portfolioLink,
          hourlyRate,
          bio,
          availabilityStatus: true,
        },
        $setOnInsert: {
          rating: 4.5,  // Default starting rating
          completedProjects: 0,
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ 
      success: true, 
      profile,
      redirectTo: '/dashboard/freelancer'
    });

  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}
```

**PATCH - Update profile:**
```typescript
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    await dbConnect();

    const profile = await FreelancerProfile.findOneAndUpdate(
      { clerkId: userId },
      { $set: body },
      { new: true }
    );

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
```

---

## Notifications API

**File:** `app/api/notifications/route.ts`

**GET - Fetch notifications:**
```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get last 50 notifications
    const notifications = await Notification.find({ clerkId: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('projectId');

    return NextResponse.json({
      success: true,
      notifications
    });

  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
```

**PATCH - Mark as read:**
```typescript
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await req.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    await dbConnect();

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    notification.isRead = true;
    await notification.save();

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark as read' },
      { status: 500 }
    );
  }
}
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "674notif123",
      "userId": "673user1",
      "clerkId": "user_clerk1",
      "type": "invitation",
      "title": "New Project Invitation!",
      "message": "You've been invited to join an e-commerce project as Designer.",
      "projectId": "674abc123",
      "isRead": false,
      "createdAt": "2025-11-27T10:00:00Z"
    }
  ]
}
```

---

## Summary

**Part 2 Complete!** ✅

Documented all remaining APIs:
- **Chat APIs** (4 routes) - Messages, rooms, polling
- **Payment API** - Razorpay order creation
- **Project APIs** (3 routes) - My projects, freelancer projects, invitation response
- **User/Freelancer APIs** (2 routes) - Onboarding, profile CRUD
- **Notifications API** - Fetch and mark read

**Total: 13 API routes** fully documented with TypeScript code, request/response examples, and explanations.

Should I create **Part 3** for error handling patterns, authentication middleware, and API best practices?
