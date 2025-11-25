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
      return NextResponse.json({ error: 'You have already responded to this invitation' }, { status: 400 });
    }
    if (isDeveloper && (project.selectedTeam?.developerAccepted || project.selectedTeam?.developerRejected)) {
      return NextResponse.json({ error: 'You have already responded to this invitation' }, { status: 400 });
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

    // Get freelancer profile for rating update
    const freelancerProfile = await FreelancerProfile.findOne({ userId: currentUser._id });

    // Check both responses and handle accordingly
    const designerAccepted = project.selectedTeam?.designerAccepted || false;
    const developerAccepted = project.selectedTeam?.developerAccepted || false;
    const designerRejected = project.selectedTeam?.designerRejected || false;
    const developerRejected = project.selectedTeam?.developerRejected || false;

    const bothResponded = (designerAccepted || designerRejected) && (developerAccepted || developerRejected);

    if (bothResponded) {
      // Case 1: Both accepted - Create chatroom with all 3
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
      
      // Case 2: Both rejected - No chatroom, no rating penalty
      else if (designerRejected && developerRejected) {
        project.status = 'team_presented';
        project.selectedTeam = undefined;
        await project.save();

        // Notify business owner
        const businessOwner = await User.findById(project.businessOwnerId);
        if (businessOwner) {
          await Notification.create({
            userId: businessOwner._id,
            clerkId: businessOwner.clerkId,
            type: 'project_update',
            title: 'Team Unavailable',
            message: `Both freelancers declined your ${project.projectDetails.websiteType} project. Generate a new team to continue.`,
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
      
      // Case 3: One accepted, one rejected
      else {
        const acceptedRole = designerAccepted ? 'designer' : 'developer';
        const rejectedRole = designerRejected ? 'designer' : 'developer';

        // Create chatroom with business + accepted freelancer only
        await createChatRoom(project, designerAccepted, developerAccepted);
        project.status = 'team_accepted';
        await project.save();

        // Apply rating penalty to rejector (-0.3)
        const rejectorId = designerRejected ? project.selectedTeam?.designerId : project.selectedTeam?.developerId;
        const rejectorProfile = await FreelancerProfile.findOne({ userId: rejectorId });
        if (rejectorProfile) {
          rejectorProfile.rating = Math.max(1.0, rejectorProfile.rating - 0.3); // Min rating 1.0
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
            message: `The ${acceptedRole} accepted your ${project.projectDetails.websiteType} project. The ${rejectedRole} declined. You can proceed or find a replacement.`,
            projectId: project._id,
            isRead: false
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: `${acceptedRole} accepted. Chat room created. ${rejectedRole} declined (rating reduced).`,
          chatRoomId: project.chatRoomId,
          status: 'partial_acceptance',
          acceptedRole,
          rejectedRole
        });
      }
    } else {
      // Only one person responded so far
      return NextResponse.json({ 
        success: true, 
        message: `You ${response}ed the invitation. Waiting for the other freelancer to respond.`,
        status: 'waiting'
      });
    }

  } catch (error: any) {
    console.error('Invitation response error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process invitation response' },
      { status: 500 }
    );
  }
}

// Helper function to create chatroom
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
        message: `Welcome to the project chat! Let's build this ${project.projectDetails.websiteType} project together. 🚀`,
        timestamp: new Date()
      }
    ]
  });

  project.chatRoomId = chatRoom._id;
  await project.save();

  return chatRoom;
}
