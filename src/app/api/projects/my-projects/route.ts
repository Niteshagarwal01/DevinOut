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

    console.log('Fetching projects for Clerk user:', userId);

    await dbConnect();

    // Fetch all projects for this user, sorted by newest first
    const rawProjects = await Project.find({ 
      clerkId: userId 
    })
    .sort({ createdAt: -1 })
    .lean();

    console.log(`Found ${rawProjects.length} projects for user ${userId}`);

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
