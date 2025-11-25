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

    // Send INVITATION notifications to freelancers (not team_selection)
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
