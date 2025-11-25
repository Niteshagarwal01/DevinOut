import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import User from '@/models/User';

// GET - Fetch all messages from a chat room
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

// POST - Send a new message
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
