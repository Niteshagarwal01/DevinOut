import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import FreelancerProfile from '@/models/FreelancerProfile';
import Notification from '@/models/Notification';
import User from '@/models/User';

interface FreelancerScore {
  freelancer: any;
  score: number;
}

function calculateMatchScore(
  freelancer: any,
  projectDetails: any,
  role: 'designer' | 'developer'
): number {
  let score = 0;

  // Experience level scoring
  const expPoints = { junior: 1, mid: 2, senior: 3 };
  score += expPoints[freelancer.experienceLevel as keyof typeof expPoints] * 15;

  // Rating scoring
  score += freelancer.rating * 10;

  // Completed projects bonus
  score += Math.min(freelancer.completedProjects * 2, 20);

  if (role === 'designer') {
    // Design complexity match
    const complexityMatch = {
      simple: freelancer.experienceLevel === 'junior' || freelancer.experienceLevel === 'mid',
      moderate: freelancer.experienceLevel === 'mid' || freelancer.experienceLevel === 'senior',
      advanced: freelancer.experienceLevel === 'senior'
    };
    
    if (complexityMatch[projectDetails.designComplexity as keyof typeof complexityMatch]) {
      score += 15;
    }
  } else {
    // Skills match for developer
    const requiredSkills = projectDetails.features || [];
    const hasReact = requiredSkills.some((f: string) => 
      f.toLowerCase().includes('modern') || f.toLowerCase().includes('interactive')
    );
    const hasPayment = requiredSkills.some((f: string) => 
      f.toLowerCase().includes('payment') || f.toLowerCase().includes('checkout')
    );
    const hasAuth = requiredSkills.some((f: string) => 
      f.toLowerCase().includes('login') || f.toLowerCase().includes('auth')
    );

    if (hasReact && freelancer.skills.includes('React')) score += 10;
    if (hasPayment && (freelancer.skills.includes('Payment Integration') || freelancer.skills.includes('Stripe'))) score += 10;
    if (hasAuth && freelancer.skills.includes('Authentication')) score += 10;
  }

  return score;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, role } = await req.json();

    if (!projectId || !role || !['designer', 'developer'].includes(role)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    await dbConnect();

    // Ensure User model is loaded
    User.modelName;

    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify ownership
    if (project.clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the existing team member (the one who accepted)
    const existingMemberId = role === 'designer' 
      ? project.selectedTeam?.developerId 
      : project.selectedTeam?.designerId;

    // Get available freelancers for the rejected role
    const freelancers = await FreelancerProfile.find({
      freelancerType: role,
      availabilityStatus: true
    }).populate('userId');

    if (freelancers.length === 0) {
      return NextResponse.json({ error: 'No available freelancers found' }, { status: 404 });
    }

    // Score and rank freelancers
    const scoredFreelancers: FreelancerScore[] = freelancers.map(freelancer => ({
      freelancer,
      score: calculateMatchScore(freelancer, project.projectDetails, role)
    }));

    // Sort by score descending
    scoredFreelancers.sort((a, b) => b.score - a.score);

    // Get top 5 matches
    const topMatches = scoredFreelancers.slice(0, 5).map(sf => ({
      _id: sf.freelancer._id,
      userId: (sf.freelancer.userId as any)._id,
      name: (sf.freelancer.userId as any).name,
      experienceLevel: sf.freelancer.experienceLevel,
      skills: sf.freelancer.skills,
      rating: sf.freelancer.rating,
      completedProjects: sf.freelancer.completedProjects,
      hourlyRate: sf.freelancer.hourlyRate,
      bio: sf.freelancer.bio,
      portfolioLink: sf.freelancer.portfolioLink,
      matchScore: sf.score
    }));

    return NextResponse.json({
      success: true,
      replacements: topMatches,
      role,
      existingMemberId
    });

  } catch (error: any) {
    console.error('Replacement freelancer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find replacement' },
      { status: 500 }
    );
  }
}

// Endpoint to select a replacement
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, replacementId, role } = await req.json();

    if (!projectId || !replacementId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify ownership
    if (project.clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get replacement freelancer profile
    const replacementProfile = await FreelancerProfile.findById(replacementId).populate('userId');
    if (!replacementProfile) {
      return NextResponse.json({ error: 'Replacement freelancer not found' }, { status: 404 });
    }

    // Update project with replacement
    if (role === 'designer') {
      project.selectedTeam!.designerId = replacementProfile.userId._id;
      project.selectedTeam!.designerAccepted = false;
      project.selectedTeam!.designerRejected = false;
    } else {
      project.selectedTeam!.developerId = replacementProfile.userId._id;
      project.selectedTeam!.developerAccepted = false;
      project.selectedTeam!.developerRejected = false;
    }

    project.status = 'awaiting_acceptance';
    project.invitationSentAt = new Date();
    await project.save();

    // Send invitation to replacement
    await Notification.create({
      userId: replacementProfile.userId._id,
      clerkId: (replacementProfile.userId as any).clerkId,
      type: 'invitation',
      title: 'New Project Invitation!',
      message: `🎉 You've been invited to join a ${project.projectDetails.websiteType} project as the ${role}. Accept within 48 hours!`,
      projectId: project._id,
      isRead: false
    });

    return NextResponse.json({
      success: true,
      message: 'Replacement invitation sent'
    });

  } catch (error: any) {
    console.error('Select replacement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to select replacement' },
      { status: 500 }
    );
  }
}
