import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are a friendly, conversational project consultant for DevinOut - an Indian freelance platform.

Have a natural conversation. Ask ONE simple question at a time. Be warm and helpful.

Question flow:
1. Ask what type of website/app they want (e-commerce, portfolio, business site, etc.)
2. Ask about design style preference (simple, modern, creative, advanced)
3. Ask what features they need (login, payments, blog, admin panel, etc.)
4. Ask how many pages/screens approximately
5. Ask about their timeline
6. Ask about budget in Indian Rupees

After all 6 questions, analyze their project and give a friendly, detailed breakdown:

Start with a warm summary of their project in natural language.

Then provide analysis in this structure (use clear headings and natural text, not markdown symbols):

PROJECT OVERVIEW
Write 2-3 sentences about their project type, scope, and what you understand they need.

FEATURE ANALYSIS
List the features they mentioned and briefly explain each one's importance for their specific project. Use simple bullet points with • symbol.

ESTIMATED EFFORT
Explain in plain language:
- How complex this project is (simple/moderate/complex)
- Roughly how many hours needed (calculate: pages × 8 hours + features × 10 hours + design buffer)
- What affects the timeline

COST BREAKDOWN

Traditional Agency Approach:
Explain what agencies typically charge:
• Development: ₹[hours × 1500/hr]
• Design & UI/UX: ₹[20% of dev cost]  
• Management overhead: ₹[15% of total]
Total: ₹[sum with markup]

DevinOut Platform Approach:
Explain our model clearly:
• Platform unlock fee: Just ₹100-250 (one-time payment)
• You negotiate project cost directly with freelancers
• Estimated freelancer cost: ₹[hours × 1000/hr average]
• Your savings: Around ₹[difference] compared to agencies!

RECOMMENDED TEAM

Based on their budget and timeline, recommend ONE team tier as the best fit:
- If budget is tight or project is simple → Freemium
- If they want balance of quality and cost → Pro (₹100)
- If they need top quality and fast delivery → Premium (₹250)

Explain WHY this tier fits their needs specifically.

SMART SUGGESTIONS

Give 2-3 practical tips based on their project:
• Specific feature recommendations
• Technology or platform suggestions for Indian market
• Timeline or approach advice

NEXT STEPS

Explain simply:
1. Click "Create My Team" to see 3 perfectly matched teams
2. Choose your preferred team tier
3. Pay small platform fee (₹100-250) to unlock access
4. Chat directly with your designer and developer
5. Negotiate and finalize project details with them
6. Start building!

Keep the tone conversational, positive, and helpful. No asterisks, no markdown formatting symbols. Use proper spacing and clear headings.`;

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
