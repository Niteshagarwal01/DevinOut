import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FreelancerProfile from '@/models/FreelancerProfile';
import User from '@/models/User';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const profile = await FreelancerProfile.findOne({ clerkId: userId });

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      freelancerType,
      skills,
      experienceLevel,
      portfolioLink,
      toolsUsed,
      hourlyRate,
      bio,
    } = body;

    // Validation
    if (!freelancerType || !['designer', 'developer'].includes(freelancerType)) {
      return NextResponse.json({ error: 'Invalid freelancer type' }, { status: 400 });
    }

    if (!skills || skills.length < 3) {
      return NextResponse.json({ error: 'At least 3 skills are required' }, { status: 400 });
    }

    if (!experienceLevel || !['junior', 'mid', 'senior'].includes(experienceLevel)) {
      return NextResponse.json({ error: 'Invalid experience level' }, { status: 400 });
    }

    await dbConnect();

    // Get Clerk user info
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Clerk user not found' }, { status: 404 });
    }

    // Get or create User in database
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      // Auto-create user if doesn't exist
      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        role: 'freelancer',
      });
    } else if (user.role !== 'freelancer') {
      // Update existing user role to freelancer
      user.role = 'freelancer';
      await user.save();
    }

    // Create or update freelancer profile
    const profile = await FreelancerProfile.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          userId: user._id,
          clerkId: userId,
          freelancerType,
          skills,
          experienceLevel,
          portfolioLink,
          toolsUsed: toolsUsed || [],
          hourlyRate,
          bio,
          availabilityStatus: true,
        },
        $setOnInsert: {
          rating: 4.5,
          completedProjects: 0,
          isAvailable: true,
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ 
      success: true, 
      profile,
      redirectTo: '/dashboard/freelancer'
    });

  } catch (error) {
    console.error('Create profile error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create profile';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    await dbConnect();

    const profile = await FreelancerProfile.findOneAndUpdate(
      { clerkId: userId },
      { $set: body },
      { new: true }
    );

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
