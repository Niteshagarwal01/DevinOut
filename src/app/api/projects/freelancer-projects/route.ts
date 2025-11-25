import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Project from '@/models/Project';
import ChatRoom from '@/models/ChatRoom';
import FreelancerProfile from '@/models/FreelancerProfile';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Ensure User model is registered
    User.modelName;
    
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

    // Flatten projectDetails for frontend and add acceptance status
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
    const pending = projects.filter((p: any) => p.status === 'awaiting_acceptance' && !p.myAcceptance && !p.myRejection);
    const ongoing = projects.filter((p: any) => ['team_accepted', 'team_selected', 'in_progress'].includes(p.status) && p.myAcceptance);
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
