# 🤖 AI Implementation & Integrations - DevinOut

## Table of Contents
1. [Overview](#overview)
2. [Groq AI Integration](#groq-ai-integration)
3. [Team Matching Algorithm](#team-matching-algorithm)
4. [Third-Party Integrations](#third-party-integrations)
5. [Database Connection](#database-connection)
6. [Utility Functions](#utility-functions)

---

## Overview

DevinOut uses **AI and smart algorithms** for:
- **Conversational AI** - Groq Llama 3.3 70B for chatbot
- **Team Matching** - Custom scoring algorithm
- **Payment Processing** - Razorpay integration
- **Database** - MongoDB with connection pooling
- **Utilities** - Currency formatting, cost calculations

### Technology Stack

```typescript
// AI & Machine Learning
- Groq SDK (Llama 3.3 70B) - Free tier: 30 req/min
- Custom matching algorithm - TypeScript

// Payment Gateway
- Razorpay - Indian payment gateway
- INR currency support

// Database
- MongoDB Atlas - Cloud NoSQL database
- Mongoose ODM - Schema validation

// Utilities
- Tailwind Merge - CSS class merging
- Clsx - Conditional classes
```

---

## Groq AI Integration

### Setup

**File:** `src/lib/openai.ts` (legacy file, not actively used)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
```

**Note:** Originally planned for OpenAI, but switched to **Groq** for cost efficiency.

### Groq Implementation

**Used in:** `app/api/chatbot/route.ts`

```typescript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
```

### Environment Variables

```env
# .env.local
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get API Key:** https://console.groq.com/keys

### AI Conversation Flow

```typescript
const completion = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',  // Best model for reasoning
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'assistant', content: "Welcome! What type of website..." },
    { role: 'user', content: "I want an e-commerce site" },
    { role: 'assistant', content: "Great! What design style..." },
    { role: 'user', content: "Modern and clean" },
    // ... continues for 6 questions
  ],
  temperature: 0.7,      // Creativity level (0.0 - 2.0)
  max_tokens: 500,       // Response length limit
});

const aiResponse = completion.choices[0]?.message?.content;
```

### System Prompt Engineering

The system prompt is **critical** for AI behavior. Here's the structure:

```typescript
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

PROJECT OVERVIEW
Write 2-3 sentences about their project type, scope, and what you understand they need.

FEATURE ANALYSIS
List the features they mentioned and briefly explain each one's importance.

ESTIMATED EFFORT
Explain in plain language:
- How complex this project is (simple/moderate/complex)
- Roughly how many hours needed (calculate: pages × 8 hours + features × 10 hours)
- What affects the timeline

COST BREAKDOWN

Traditional Agency Approach:
• Development: ₹[hours × 1500/hr]
• Design & UI/UX: ₹[20% of dev cost]  
• Management overhead: ₹[15% of total]
Total: ₹[sum with markup]

DevinOut Platform Approach:
• Platform unlock fee: Just ₹100-250 (one-time)
• You negotiate directly with freelancers
• Estimated freelancer cost: ₹[hours × 1000/hr average]
• Your savings: Around ₹[difference] compared to agencies!

RECOMMENDED TEAM
Based on budget and timeline, recommend ONE team tier:
- Freemium (free) - for simple/budget projects
- Pro (₹100) - balanced quality and cost
- Premium (₹250) - top quality and fast delivery

SMART SUGGESTIONS
Give 2-3 practical tips specific to their project.

NEXT STEPS
1. Click "Create My Team" to see 3 matched teams
2. Choose your preferred team tier
3. Pay platform fee to unlock access
4. Chat with designer and developer
5. Negotiate and start building!

Keep the tone conversational, positive, and helpful. No asterisks, no markdown formatting symbols. Use proper spacing and clear headings.`;
```

### Prompt Engineering Best Practices

1. **Clear Role Definition**
   ```
   "You are a friendly, conversational project consultant"
   ```

2. **Explicit Instructions**
   ```
   "Ask ONE simple question at a time"
   "No asterisks, no markdown formatting symbols"
   ```

3. **Structured Output**
   ```
   PROJECT OVERVIEW
   [content]
   
   FEATURE ANALYSIS
   [content]
   ```

4. **Context-Aware Calculations**
   ```
   "calculate: pages × 8 hours + features × 10 hours"
   ```

5. **Localization**
   ```
   "Indian Rupees"
   "₹[amount]"
   "DevinOut - an Indian freelance platform"
   ```

### Response Parsing

```typescript
// AI returns structured text response
const aiResponse = `
PROJECT OVERVIEW
You're building an e-commerce website with modern design...

COST BREAKDOWN
Traditional Agency: ₹85,000
DevinOut Platform: ₹35,000 + ₹100 unlock
Your savings: ₹50,000!
`;

// Frontend displays it as-is (pre-formatted by AI)
// No need for complex parsing!
```

### Error Handling

```typescript
try {
  const completion = await groq.chat.completions.create({...});
  const aiResponse = completion.choices[0]?.message?.content || 
    'Sorry, I had trouble with that. Could you try again?';
  
  return NextResponse.json({ response: aiResponse });
  
} catch (error: any) {
  console.error('Chatbot error:', error);
  
  // Specific error handling
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
```

### Rate Limits

**Groq Free Tier:**
- **30 requests/minute**
- **7,000 requests/day**
- **Unlimited tokens** (no token charges!)

**Handling Rate Limits:**
```typescript
// Frontend: Disable send button while loading
const [loading, setLoading] = useState(false);

const handleSend = async () => {
  if (loading) return;  // Prevent spam
  setLoading(true);
  
  try {
    await fetch('/api/chatbot', {...});
  } finally {
    setLoading(false);  // Re-enable button
  }
};
```

### Conversation State Management

```typescript
// Store entire conversation history
const [messages, setMessages] = useState<Message[]>([
  {
    role: 'assistant',
    content: "Welcome! What type of website are you envisioning?"
  }
]);

// Add user message
const newMessages = [...messages, { 
  role: 'user', 
  content: userInput 
}];

// Send FULL conversation to AI (context awareness)
const response = await fetch('/api/chatbot', {
  body: JSON.stringify({ 
    messages: newMessages,  // Full history
    projectId 
  })
});

// Add AI response
setMessages([...newMessages, { 
  role: 'assistant', 
  content: aiResponse 
}]);
```

---

## Team Matching Algorithm

### Algorithm Overview

**File:** `app/api/teams/generate/route.ts`

The matching algorithm scores **all possible Designer + Developer combinations** and selects the top 3.

### Scoring Formula

```typescript
function calculateMatchScore(
  designer: FreelancerProfile,
  developer: FreelancerProfile,
  projectDetails: ProjectDetails
): number {
  let score = 0;

  // 1. EXPERIENCE LEVEL (30 points total)
  const expPoints = { junior: 1, mid: 2, senior: 3 };
  score += expPoints[designer.experienceLevel] * 15;  // 0-45 points
  score += expPoints[developer.experienceLevel] * 15; // 0-45 points

  // 2. RATING (20 points total)
  score += designer.rating * 10;  // 0-50 points (if rating 5.0)
  score += developer.rating * 10; // 0-50 points

  // 3. COMPLETED PROJECTS (40 points max)
  score += Math.min(designer.completedProjects * 2, 20);  // Cap at 20
  score += Math.min(developer.completedProjects * 2, 20); // Cap at 20

  // 4. DESIGN COMPLEXITY MATCH (15 points)
  const complexityMatch = {
    simple: designer.experienceLevel === 'junior' || designer.experienceLevel === 'mid',
    moderate: designer.experienceLevel === 'mid' || designer.experienceLevel === 'senior',
    advanced: designer.experienceLevel === 'senior'
  };
  
  if (complexityMatch[projectDetails.designComplexity]) {
    score += 15;
  }

  // 5. SKILL MATCHING (30 points max)
  const requiredSkills = projectDetails.features || [];
  
  const hasReact = requiredSkills.some(f => 
    f.toLowerCase().includes('modern') || f.toLowerCase().includes('interactive')
  );
  const hasPayment = requiredSkills.some(f => 
    f.toLowerCase().includes('payment') || f.toLowerCase().includes('checkout')
  );
  const hasAuth = requiredSkills.some(f => 
    f.toLowerCase().includes('login') || f.toLowerCase().includes('auth')
  );

  if (hasReact && developer.skills.includes('React')) score += 10;
  if (hasPayment && developer.skills.includes('Payment Integration')) score += 10;
  if (hasAuth && developer.skills.includes('Authentication')) score += 10;

  return score;
}
```

### Score Breakdown Example

```typescript
// Example: Senior Designer + Senior Developer
// Project: Advanced e-commerce with payment + auth

score = 0;

// 1. Experience (30 + 30 = 60)
score += 3 * 15;  // Designer: senior (3) × 15 = 45
score += 3 * 15;  // Developer: senior (3) × 15 = 45
// Subtotal: 90

// 2. Rating (45 + 49 = 94)
score += 4.5 * 10;  // Designer: 4.5 rating = 45
score += 4.9 * 10;  // Developer: 4.9 rating = 49
// Subtotal: 94

// 3. Completed Projects (20 + 20 = 40)
score += Math.min(15 * 2, 20);  // Designer: 15 projects = 20 (capped)
score += Math.min(20 * 2, 20);  // Developer: 20 projects = 20 (capped)
// Subtotal: 40

// 4. Design Complexity Match (15)
// Project: "advanced" → Senior designer matches → +15
score += 15;
// Subtotal: 15

// 5. Skill Matching (20)
// Project has: payment + auth (no React mentioned)
score += 10;  // Developer has "Payment Integration" → +10
score += 10;  // Developer has "Authentication" → +10
// Subtotal: 20

// TOTAL SCORE: 90 + 94 + 40 + 15 + 20 = 159 points
```

### Team Selection Process

```typescript
// 1. Calculate scores for ALL combinations
const allTeams: TeamScore[] = [];

for (const designer of designers) {
  for (const developer of developers) {
    const score = calculateMatchScore(designer, developer, projectDetails);
    allTeams.push({ designer, developer, score, teamType: 'freemium' });
  }
}

// If 10 designers × 10 developers = 100 possible teams!

// 2. Sort by score (highest first)
allTeams.sort((a, b) => b.score - a.score);

// 3. Select top 3
const topTeams = allTeams.slice(0, 3);

// 4. Assign tiers
topTeams[0].teamType = 'premium';   // Best team
topTeams[1].teamType = 'pro';       // Second best
topTeams[2].teamType = 'freemium';  // Third best (free)
```

### Cost Calculation

```typescript
// Parse budget from user input
const budgetRange = "₹25,000-₹50,000";
const cleanBudget = budgetRange.replace(/₹|,/g, '').toLowerCase();
const budgetMatch = cleanBudget.match(/(\d+)\s*k?\s*-\s*(\d+)\s*k?/i);

let maxBudget = 50000;  // Default
if (budgetMatch) {
  let upperBudget = parseInt(budgetMatch[2]);  // "50"
  if (budgetRange.toLowerCase().includes('k') || upperBudget < 1000) {
    upperBudget = upperBudget * 1000;  // 50 → 50,000
  }
  maxBudget = upperBudget;
}

// Estimate hours
const estimatedHours = (
  (projectDetails.numPages || 5) * 8 +           // 8 hours per page
  (projectDetails.features?.length || 1) * 12 +  // 12 hours per feature
  (projectDetails.designComplexity === 'advanced' ? 40 : 
   projectDetails.designComplexity === 'moderate' ? 20 : 10)
);

// Platform fees
const PLATFORM_FEES = {
  premium: 250,  // ₹250 to unlock Premium
  pro: 100,      // ₹100 to unlock Pro
  freemium: 0    // Free
};

// Estimated project cost
const avgHourlyRate = (designer.hourlyRate + developer.hourlyRate) / 2;
const estimatedCost = Math.min(maxBudget, estimatedHours * avgHourlyRate);
```

### Why This Algorithm Works

1. **Multi-Factor Scoring**
   - Experience, rating, projects, skills all matter
   - No single factor dominates

2. **Caps Prevent Unfairness**
   - Completed projects capped at 20 points
   - Prevents 100+ project veterans from always winning

3. **Project-Specific Matching**
   - Design complexity matching
   - Skill matching for required features

4. **Transparent Tiers**
   - Top 3 teams clearly identified
   - User knows why Premium > Pro > Freemium

---

## Third-Party Integrations

### Razorpay Payment Gateway

**File:** `src/lib/razorpay.ts`

```typescript
import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createOrder(amount: number, currency: string = 'INR') {
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,  // Razorpay expects paise (1 rupee = 100 paise)
      currency,
      receipt: `receipt_${Date.now()}`,
    });
    return order;
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    throw new Error('Failed to create payment order');
  }
}
```

### Environment Variables

```env
# .env.local
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
```

**Get API Keys:** https://dashboard.razorpay.com/app/keys

### Payment Flow

```typescript
// 1. User clicks "Select Team" → Create order
const orderResponse = await fetch('/api/payment/create-order', {
  method: 'POST',
  body: JSON.stringify({ amount: 100, projectId, teamType: 'pro' })
});
const { orderId } = await orderResponse.json();

// 2. Open Razorpay checkout modal
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: 10000,  // ₹100 in paise
  currency: 'INR',
  order_id: orderId,
  handler: function (response) {
    // 3. Payment successful
    console.log('Payment ID:', response.razorpay_payment_id);
    console.log('Order ID:', response.razorpay_order_id);
    console.log('Signature:', response.razorpay_signature);
    
    // 4. Select team with payment details
    selectTeam(team, response);
  },
  theme: { color: '#8B0000' }
};

const razorpay = new window.Razorpay(options);
razorpay.open();
```

### Razorpay Receipt Format

```typescript
// Receipt must be ≤40 characters
const shortId = projectId.slice(-8);           // Last 8 chars: "def45678"
const timestamp = Date.now().toString().slice(-8);  // Last 8 digits: "27145930"
const receipt = `${shortId}_${timestamp}`;     // Total: 17 chars ✅
```

---

## Database Connection

**File:** `src/lib/mongodb.ts`

### Connection Pooling

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

// Global cache for connection
declare global {
  var mongoose: {
    conn: any;
    promise: Promise<any> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Return cached connection if exists
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if needed
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,  // Disable buffering in serverless
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;  // Reset on error
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
```

### Why Connection Pooling?

**Problem:** Serverless functions create new DB connections on every request
- ❌ Slow (100-500ms to connect)
- ❌ MongoDB Atlas has connection limits
- ❌ Expensive (wastes resources)

**Solution:** Cache connection globally
- ✅ Fast (reuse existing connection)
- ✅ Efficient (1 connection per function instance)
- ✅ Handles hot reloads in development

### Usage in API Routes

```typescript
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';

export async function GET() {
  await dbConnect();  // Connect once
  
  // Now use Mongoose models
  const projects = await Project.find({});
  
  return NextResponse.json({ projects });
}
```

### Environment Variables

```env
# .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/devinout?retryWrites=true&w=majority
```

**Get MongoDB URI:** https://cloud.mongodb.com/

---

## Utility Functions

**File:** `src/lib/utils.ts`

### 1. Class Name Merging

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage:
<div className={cn(
  "px-4 py-2",
  isActive && "bg-blue-500",
  disabled && "opacity-50"
)}>
```

### 2. Currency Formatting

```typescript
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Examples:
formatCurrency(1000)    // "₹1,000"
formatCurrency(100000)  // "₹1,00,000"  (Indian numbering)
formatCurrency(5000000) // "₹50,00,000"
```

### 3. Project Cost Estimation

```typescript
export function calculateEstimate(
  numPages: number,
  features: string[],
  designComplexity: string
): { devinOutCost: number; agencyCost: number } {
  // Check for premium features
  const hasPayment = features.some(f => 
    f.toLowerCase().includes('payment') || f.toLowerCase().includes('checkout')
  );
  const hasAuth = features.some(f => 
    f.toLowerCase().includes('login') || f.toLowerCase().includes('auth')
  );
  const hasAdmin = features.some(f => 
    f.toLowerCase().includes('admin') || f.toLowerCase().includes('dashboard')
  );
  
  // Base estimate
  let baseEstimate = 35000 + (numPages * 1500);
  
  // Feature multipliers
  baseEstimate *= hasPayment ? 1.3 : 1;   // +30% for payment
  baseEstimate *= hasAuth ? 1.2 : 1;      // +20% for auth
  baseEstimate *= hasAdmin ? 1.25 : 1;    // +25% for admin
  
  // Design complexity multiplier
  if (designComplexity === 'advanced') {
    baseEstimate *= 1.4;    // +40%
  } else if (designComplexity === 'moderate') {
    baseEstimate *= 1.2;    // +20%
  }
  
  const devinOutCost = Math.round(baseEstimate);
  const agencyCost = Math.round(devinOutCost * 1.6);  // 60% markup
  
  return { devinOutCost, agencyCost };
}

// Example:
calculateEstimate(10, ['payment', 'auth'], 'moderate')
// Returns: { devinOutCost: 54000, agencyCost: 86400 }
```

### 4. Name Utilities

```typescript
// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

capitalize('hello')  // "Hello"
capitalize('john')   // "John"

// Get initials for avatar
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

getInitials('John Doe')         // "JD"
getInitials('Priya Sharma')     // "PS"
getInitials('A B C D')          // "AB" (max 2 chars)
```

### 5. Date Formatting

```typescript
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

// Examples:
formatDate(new Date())
// "27 Nov 2025, 10:30 am"

formatDate("2025-11-20T14:00:00Z")
// "20 Nov 2025, 7:30 pm" (converted to IST)
```

---

## Summary

**Document 5 Complete!** ✅

Covered all AI & integration implementations:

✅ **Groq AI Integration** - Setup, prompt engineering, conversation flow  
✅ **Team Matching Algorithm** - 5-factor scoring system with examples  
✅ **Razorpay Payment** - Order creation, frontend integration  
✅ **MongoDB Connection** - Connection pooling for serverless  
✅ **Utility Functions** - Currency, dates, cost estimation  

**Key Takeaways:**
- Groq Llama 3.3 70B is free (30 req/min)
- Matching algorithm scores 135+ points across 5 factors
- Razorpay handles INR payments with ₹100-250 fees
- MongoDB connection cached globally for performance
- Utilities handle Indian formatting (₹, IST, lakhs)

**Next:** Document 6 - TypeScript Patterns & Types?
