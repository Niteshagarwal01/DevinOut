import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import FreelancerProfile from '@/models/FreelancerProfile';
import User from '@/models/User';

interface TeamScore {
  designer: any;
  developer: any;
  score: number;
  teamType: 'premium' | 'pro' | 'freemium';
}

function calculateMatchScore(
  designer: any,
  developer: any,
  projectDetails: any
): number {
  let score = 0;

  // Experience level scoring
  const expPoints = { junior: 1, mid: 2, senior: 3 };
  score += expPoints[designer.experienceLevel as keyof typeof expPoints] * 15;
  score += expPoints[developer.experienceLevel as keyof typeof expPoints] * 15;

  // Rating scoring
  score += designer.rating * 10;
  score += developer.rating * 10;

  // Completed projects bonus
  score += Math.min(designer.completedProjects * 2, 20);
  score += Math.min(developer.completedProjects * 2, 20);

  // Design complexity match
  const complexityMatch = {
    simple: designer.experienceLevel === 'junior' || designer.experienceLevel === 'mid',
    moderate: designer.experienceLevel === 'mid' || designer.experienceLevel === 'senior',
    advanced: designer.experienceLevel === 'senior'
  };
  
  if (complexityMatch[projectDetails.designComplexity as keyof typeof complexityMatch]) {
    score += 15;
  }

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

  if (hasReact && developer.skills.includes('React')) score += 10;
  if (hasPayment && (developer.skills.includes('Payment Integration') || developer.skills.includes('Stripe'))) score += 10;
  if (hasAuth && developer.skills.includes('Authentication')) score += 10;

  return score;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    await dbConnect();

    // Ensure User model is loaded for populate to work
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

    // Get available designers and developers
    const designers = await FreelancerProfile.find({
      freelancerType: 'designer'
    }).populate('userId');

    const developers = await FreelancerProfile.find({
      freelancerType: 'developer'
    }).populate('userId');

    console.log('Found designers:', designers.length);
    console.log('Found developers:', developers.length);

    if (designers.length === 0 || developers.length === 0) {
      return NextResponse.json({ 
        error: 'No available freelancers at the moment. Please try again later.' 
      }, { status: 404 });
    }

    // Calculate all possible team combinations
    const allTeams: TeamScore[] = [];

    for (const designer of designers) {
      for (const developer of developers) {
        const score = calculateMatchScore(designer, developer, project.projectDetails);
        allTeams.push({
          designer,
          developer,
          score,
          teamType: 'freemium' // Will be assigned later
        });
      }
    }

    // Sort by score
    allTeams.sort((a, b) => b.score - a.score);

    // Select top 3 teams
    const topTeams = allTeams.slice(0, Math.min(3, allTeams.length));

    // Assign team types
    if (topTeams.length >= 1) topTeams[0].teamType = 'premium';
    if (topTeams.length >= 2) topTeams[1].teamType = 'pro';
    if (topTeams.length >= 3) topTeams[2].teamType = 'freemium';

    // Calculate costs based on user's budget range
    const budgetRange = project.projectDetails.budgetRange || '';
    let maxBudget = 50000; // default fallback

    // Parse budget from various formats: "₹25,000-₹50,000", "25k-50k", "25000-50000", "25-30k"
    // Match patterns like: 25-30, 25k-30k, ₹25,000-₹30,000, etc.
    const cleanBudget = budgetRange.replace(/₹|,/g, '').toLowerCase();
    const budgetMatch = cleanBudget.match(/(\d+)\s*k?\s*-\s*(\d+)\s*k?/i);
    
    if (budgetMatch) {
      let upperBudget = parseInt(budgetMatch[2]);
      // If the number is small (like "30" from "25-30k"), assume it's in thousands
      if (budgetRange.toLowerCase().includes('k') || upperBudget < 1000) {
        upperBudget = upperBudget * 1000;
      }
      maxBudget = upperBudget;
    }

    // Calculate estimated hours based on project scope
    const estimatedHours = (
      (project.projectDetails.numPages || 5) * 8 + // 8 hours per page
      (project.projectDetails.features?.length || 1) * 12 + // 12 hours per feature
      (project.projectDetails.designComplexity === 'advanced' ? 40 : 
       project.projectDetails.designComplexity === 'moderate' ? 20 : 10)
    );

    // Platform fees for unlocking premium teams
    const PLATFORM_FEES = {
      premium: 250, // ₹250 to unlock Premium team
      pro: 100,     // ₹100 to unlock Pro team
      freemium: 0   // Free
    };

    // Format response
    const teams = topTeams.map(team => {
      // Platform fee based on team type
      const platformFee = PLATFORM_FEES[team.teamType];

      return {
        teamType: team.teamType,
        score: team.score,
        designer: {
          id: team.designer._id,
          name: (team.designer.userId as any).name,
          experienceLevel: team.designer.experienceLevel,
          skills: team.designer.skills,
          rating: team.designer.rating,
          completedProjects: team.designer.completedProjects,
          hourlyRate: team.designer.hourlyRate,
          portfolioLink: team.designer.portfolioLink,
          bio: team.designer.bio
        },
        developer: {
          id: team.developer._id,
          name: (team.developer.userId as any).name,
          experienceLevel: team.developer.experienceLevel,
          skills: team.developer.skills,
          rating: team.developer.rating,
          completedProjects: team.developer.completedProjects,
          hourlyRate: team.developer.hourlyRate,
          portfolioLink: team.developer.portfolioLink,
          bio: team.developer.bio
        },
        platformFee, // Platform unlock fee
        estimatedHours, // Total estimated hours for the project
        estimatedProjectCost: team.teamType === 'freemium' ? 0 : Math.min(maxBudget, Math.round(estimatedHours * ((team.designer.hourlyRate || 1000) + (team.developer.hourlyRate || 1200)) / 2)) // Show project estimate
      };
    });

    return NextResponse.json({ teams, project });

  } catch (error: any) {
    console.error('Team generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate teams' },
      { status: 500 }
    );
  }
}
