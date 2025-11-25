import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful AI assistant for DevinOut, an Indian freelance platform that matches businesses with designer-developer teams.

Your job is to gather project requirements through a friendly conversation. Ask ONE question at a time.

IMPORTANT: This is for the Indian market - budgets are in Indian Rupees (₹), keep it affordable.

Conversation flow (ask these questions in order):
1. "What type of website/app do you want to build?" (e.g., e-commerce, portfolio, business website, landing page, mobile app)

2. "How would you describe the design style you're looking for?" (simple & clean, modern & professional, creative & unique)

3. "What key features do you need?" (e.g., contact form, user login, payment gateway, admin panel, blog, product catalog)

4. "Roughly how many pages or screens will you need?" (Just ask for an approximate number)

5. "What's your timeline? When do you need this completed?" (e.g., 2 weeks, 1 month, 2 months)

6. "What's your budget range in Indian Rupees?" (Suggest ranges like ₹15,000-₹25,000, ₹25,000-₹50,000, ₹50,000-₹1,00,000)

After gathering all 6 answers:
- Calculate realistic estimate for Indian market (base: ₹20,000-₹80,000 range)
- Show comparison: Traditional Agency vs DevinOut (30% savings)
- End with: "Ready to see your matched teams? Click 'Create My Team' below!"

Be conversational, friendly, and encouraging. Keep responses short and clear.`;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, projectId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
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
        role: 'business',
      });
    }

    // Get or create project
    let project = projectId ? await Project.findById(projectId) : null;
    
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const step = userMessages.length;
    
    if (!project && step === 1) {
      // Create new project on first user message
      project = await Project.create({
        businessOwnerId: user._id,
        clerkId: userId,
        status: 'chatting'
      });
    }
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Call Groq with conversation history
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I had trouble with that. Could you try again?';

    // Parse and save project details from conversation
    const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';
    
    // Initialize projectDetails if it doesn't exist
    if (!project.projectDetails) {
      project.projectDetails = {
        websiteType: '',
        designComplexity: '',
        features: [],
        numPages: 0,
        timeline: '',
        budgetRange: ''
      };
    }
    
    if (step === 1) {
      // Extract website type (e.g., "e-commerce", "portfolio")
      project.projectDetails.websiteType = lastUserMsg.toLowerCase().trim();
    } else if (step === 2) {
      // Extract design complexity
      project.projectDetails.designComplexity = lastUserMsg.toLowerCase().trim();
    } else if (step === 3) {
      // Extract features - split by comma, "and", or newlines
      const featuresList = lastUserMsg
        .toLowerCase()
        .replace(/\band\b/g, ',')
        .split(/[,\n]+/)
        .map((f: string) => f.trim())
        .filter((f: string) => f.length > 0 && !f.match(/^\d+\s*(page|screen)/i));
      project.projectDetails.features = featuresList;
    } else if (step === 4) {
      // Extract number of pages - look for any number
      const pageMatch = lastUserMsg.match(/(\d+)\s*(page|screen)?/i);
      project.projectDetails.numPages = pageMatch ? parseInt(pageMatch[1]) : 5;
    } else if (step === 5) {
      // Extract timeline
      project.projectDetails.timeline = lastUserMsg.toLowerCase().trim();
    } else if (step === 6) {
      // Extract budget range
      project.projectDetails.budgetRange = lastUserMsg.trim();
      // Update status to team_presented when all questions are answered
      project.status = 'team_presented';
    }

    await project.save();

    // Check if ready to create team (after question 6)
    const showCreateTeam = step >= 6;

    return NextResponse.json({ 
      response: aiResponse,
      showCreateTeam,
      projectId: project._id.toString()
    });

  } catch (error: any) {
    console.error('Chatbot error:', error);
    
    // Fallback if Groq fails
    if (error.code === 'ENOTFOUND' || error.status === 401) {
      return NextResponse.json(
        { error: 'Groq API key not configured. Please add GROQ_API_KEY to .env.local' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to get response' },
      { status: 500 }
    );
  }
}
