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

    // Get business owner user
    const businessOwner = await User.findOne({ clerkId: userId });
    if (!businessOwner) {
      return NextResponse.json({ error: 'Business owner not found' }, { status: 404 });
    }

    // Check if chat room already exists for this project
    let chatRoom = await ChatRoom.findOne({ projectId: project._id });

    if (!chatRoom) {
      // Create new chat room with proper participant structure
      chatRoom = await ChatRoom.create({
        projectId: project._id,
        participants: [
          {
            userId: businessOwner._id,
            clerkId: businessOwner.clerkId,
            role: 'business' as const,
            name: businessOwner.name
          },
          {
            userId: designerProfile.userId._id,
            clerkId: (designerProfile.userId as any).clerkId,
            role: 'designer' as const,
            name: (designerProfile.userId as any).name
          },
          {
            userId: developerProfile.userId._id,
            clerkId: (developerProfile.userId as any).clerkId,
            role: 'developer' as const,
            name: (developerProfile.userId as any).name
          }
        ],
        messages: [
          {
            senderId: businessOwner._id,
            senderName: businessOwner.name,
            message: `Welcome to the project chat! I'm excited to work with you both on this ${project.projectDetails.websiteType} project.`,
            timestamp: new Date()
          }
        ]
      });
    } else {
      // Update existing chat room participants if team changed
      chatRoom.participants = [
        {
          userId: businessOwner._id,
          clerkId: businessOwner.clerkId,
          role: 'business' as const,
          name: businessOwner.name
        },
        {
          userId: designerProfile.userId._id,
          clerkId: (designerProfile.userId as any).clerkId,
          role: 'designer' as const,
          name: (designerProfile.userId as any).name
        },
        {
          userId: developerProfile.userId._id,
          clerkId: (developerProfile.userId as any).clerkId,
          role: 'developer' as const,
          name: (developerProfile.userId as any).name
        }
      ];
      await chatRoom.save();
    }

    // Update project
    project.selectedTeam = {
      designerId: designerProfile.userId._id,
      developerId: developerProfile.userId._id,
      teamType: teamType as 'premium' | 'pro' | 'freemium'
    };
    project.status = 'team_selected';
    project.chatRoomId = chatRoom._id;
    
    if (teamType !== 'freemium' && paymentDetails) {
      project.paymentStatus = 'paid';
      project.razorpayOrderId = paymentDetails.razorpay_order_id;
    }

    await project.save();

    // Create notifications for freelancers
    await Notification.create({
      userId: designerProfile.userId._id,
      clerkId: (designerProfile.userId as any).clerkId,
      type: 'team_selection',
      title: 'New Project!',
      message: `🎉 You've been selected for a new ${project.projectDetails.websiteType} project!`,
      projectId: project._id,
      isRead: false
    });

    await Notification.create({
      userId: developerProfile.userId._id,
      clerkId: (developerProfile.userId as any).clerkId,
      type: 'team_selection',
      title: 'New Project!',
      message: `🎉 You've been selected for a new ${project.projectDetails.websiteType} project!`,
      projectId: project._id,
      isRead: false
    });

    return NextResponse.json({ 
      success: true, 
      chatRoomId: chatRoom._id 
    });

  } catch (error: any) {
    console.error('Team selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to select team' },
      { status: 500 }
    );
  }
}
