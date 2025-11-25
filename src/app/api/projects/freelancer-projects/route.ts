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
        // Get freelancer profile
    const freelancerProfile = await FreelancerProfile.findOne({ clerkId: userId });
    
    if (!freelancerProfile) {
      return NextResponse.json({ 
        error: 'Freelancer profile not found' 
      }, { status: 404 });
    }

    // Find all chat rooms where this freelancer is a participant
    const chatRooms = await ChatRoom.find({
      'participants.clerkId': userId
    }).select('projectId participants createdAt').lean();

    const projectIds = chatRooms.map(room => room.projectId);

    // Fetch all projects
    const rawProjects = await Project.find({
      _id: { $in: projectIds }
    })
    .sort({ updatedAt: -1 })
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
      updatedAt: p.updatedAt
    }));

    // Categorize projects
    const pending = projects.filter((p: any) => p.status === 'team_presented');
    const ongoing = projects.filter((p: any) => p.status === 'team_selected');
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
