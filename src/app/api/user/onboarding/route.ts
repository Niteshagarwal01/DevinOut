import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let { role } = body;

    await dbConnect();

    // Get user info from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no role provided in body, try to get from Clerk metadata
    if (!role && clerkUser.unsafeMetadata?.role) {
      role = clerkUser.unsafeMetadata.role;
    }

    if (!role || !['business', 'freelancer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create or update user in MongoDB
    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        role: role,
      },
      { upsert: true, new: true }
    );

    // For freelancers, check if they have a profile
    if (role === 'freelancer') {
      const FreelancerProfile = (await import('@/models/FreelancerProfile')).default;
      const profile = await FreelancerProfile.findOne({ clerkId: userId });
      
      if (!profile) {
        // No profile yet - redirect to create one
        return NextResponse.json({ 
          success: true, 
          user: dbUser,
          redirectTo: '/dashboard/freelancer/profile'
        });
      } else {
        // Profile exists - go to dashboard
        return NextResponse.json({ 
          success: true, 
          user: dbUser,
          redirectTo: '/dashboard/freelancer'
        });
      }
    }

    // For business users, always go to dashboard
    return NextResponse.json({ 
      success: true, 
      user: dbUser,
      redirectTo: '/dashboard/business'
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to save user role' },
      { status: 500 }
    );
  }
}


