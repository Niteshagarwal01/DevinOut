import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import Project from '@/models/Project';
import User from '@/models/User';

// GET - Fetch chat room by project ID
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

    // Ensure User model is registered
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
