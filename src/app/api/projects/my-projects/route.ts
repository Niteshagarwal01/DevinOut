import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Project from '@/models/Project';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await Project.init();

    // Fetch all projects for this user, sorted by newest first
    const projects = await Project.find({ 
      clerkId: userId 
    })
    .sort({ createdAt: -1 })
    .lean();

    // Flatten projectDetails for frontend
    const flattenedProjects = projects.map((p: any) => ({
      _id: p._id,
      websiteType: p.projectDetails?.websiteType || '',
      designComplexity: p.projectDetails?.designComplexity || '',
      features: p.projectDetails?.features || [],
      numPages: p.projectDetails?.numPages || 0,
      timeline: p.projectDetails?.timeline || '',
      budgetRange: p.projectDetails?.budgetRange || '',
      status: p.status,
      selectedTeamType: p.selectedTeam?.teamType || null,
      chatRoomId: p.chatRoomId || null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    return NextResponse.json({ 
      success: true, 
      projects: flattenedProjects 
    });

  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch projects',
      details: error.message 
    }, { status: 500 });
  }
}
