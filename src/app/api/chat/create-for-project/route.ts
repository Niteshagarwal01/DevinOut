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

    // Ensure User model is registered
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

    // Create simple chat room with just the business owner for now
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
          message: `Chat room created for ${project.projectDetails.websiteType} project. Team members will join when selected.`,
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
