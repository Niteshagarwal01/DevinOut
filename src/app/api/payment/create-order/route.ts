import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, projectId, teamType } = await req.json();

    if (!amount || !projectId || !teamType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create Razorpay order
    // Razorpay receipt max length is 40 chars, so use last 8 chars of projectId + timestamp
    const shortId = projectId.slice(-8); // Last 8 chars of MongoDB ObjectId
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const receipt = `${shortId}_${timestamp}`; // Total: 17 chars (8+1+8)
    
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt,
      notes: {
        projectId,
        teamType,
        userId,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
