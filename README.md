# DevinOut - AI-Powered Freelance Team Matching Platform

DevinOut is a revolutionary Indian freelance platform that uses AI to create perfect designer-developer teams for each project. Instead of browsing thousands of profiles, businesses get 3 curated teams instantly matched to their needs.

## 🎯 The Problem We Solve

Traditional freelance platforms force you to:
- Browse through hundreds of freelancer profiles
- Interview multiple candidates individually
- Manage separate contracts with designer and developer
- Pay high agency fees (30-50% markup)

**DevinOut's Solution**: AI-powered instant team creation with transparent pricing - pay only ₹100-250 platform fee, negotiate directly with freelancers.

## 🚀 Key Features

### For Business Owners
- **🤖 AI Project Consultant** - Conversational chatbot analyzes your needs and provides detailed cost breakdowns
- **⚡ Instant Team Matching** - Get 3 ranked designer+developer teams in seconds
- **💰 Transparent Pricing** - Platform fee: ₹100-250 | No hidden charges | Direct negotiation with teams
- **💬 3-Way Collaboration Hub** - Real-time chat with your designer and developer
- **🔒 Secure Payments** - Razorpay integration for platform fees
- **📊 Smart Analytics** - Cost comparison vs traditional agencies (save 35-45%)

### For Freelancers  
- **👤 Rich Profile System** - Skills, portfolio, hourly rates, experience level
- **🎯 Smart Matching** - AI pairs you with complementary designers/developers
- **🔔 Instant Notifications** - Get alerted when selected for projects
- **⭐ Reputation Building** - Ratings, reviews, and completed project tracking
- **💼 Availability Toggle** - Control when you're open for new projects
- **📈 Dashboard Analytics** - Track ongoing, pending, and completed projects

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with custom royal theme
- **UI Components**: Lucide React icons
- **State Management**: React Hooks

### Backend & Database
- **API**: Next.js Route Handlers (Server Components)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: Clerk (Google OAuth, Email)
- **Middleware**: Custom role-based routing

### AI & Payments
- **AI Chatbot**: Groq (Llama 3.3 70B model)
- **Payment Gateway**: Razorpay (Test & Live modes)
- **Real-time**: Polling-based chat updates (3s interval)

### Deployment
- **Hosting**: Vercel (recommended)
- **Database**: MongoDB Atlas (Cloud)
- **Environment**: Node.js 18+

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- MongoDB Atlas account (free tier works)
- Clerk account (free tier available)
- Groq API account (free tier available)
- Razorpay account (test mode free)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Niteshagarwal01/DevinOut.git
cd DevinOut
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/devinout

# Groq AI (Free tier: 30 requests/min)
GROQ_API_KEY=gsk_xxxxx

# Razorpay (Test Mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### 4. Get Your API Keys

#### 🔐 Clerk (Authentication)
1. Visit [clerk.com](https://clerk.com) → Create application
2. Enable **Google** in Social Connections
3. Copy Publishable Key & Secret Key
4. Add to `.env.local`
5. Configure redirect URLs:
   - Sign-in: `/sign-in`
   - Sign-up: `/sign-up`
   - After sign-in: `/onboarding`

#### 🍃 MongoDB Atlas
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster
3. Database Access → Add user with read/write
4. Network Access → Allow access from anywhere (0.0.0.0/0)
5. Connect → Drivers → Copy connection string
6. Replace `<password>` and `<dbname>` in connection string

#### 🤖 Groq (AI Chatbot)
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create API key (free tier: 30 req/min, 14,400/day)
3. Model used: `llama-3.3-70b-versatile`
4. Add to `.env.local`

#### 💳 Razorpay (Payments)
1. Sign up at [razorpay.com](https://razorpay.com)
2. Switch to **Test Mode** (top-right toggle)
3. Settings → API Keys → Generate Test Keys
4. Copy Key ID (starts with `rzp_test_`) and Secret
5. For production: Complete KYC and use Live keys

### 5. Seed Database (Optional)

```bash
npm run seed
```
This creates sample freelancer profiles for testing team matching.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
DevinOut/
├── src/
│   ├── app/                      # Next.js 16 App Router
│   │   ├── layout.tsx           # Root layout with Clerk
│   │   ├── page.tsx             # Landing page
│   │   ├── about/               # About page
│   │   ├── sign-in/             # Clerk auth pages
│   │   ├── sign-up/
│   │   ├── onboarding/          # Role selection
│   │   ├── dashboard/
│   │   │   ├── business/        # Business dashboard + AI chat
│   │   │   │   └── teams/[id]/  # Team selection page
│   │   │   └── freelancer/      # Freelancer dashboard
│   │   ├── chat/[chatRoomId]/   # 3-way chat room
│   │   └── api/                 # Backend routes
│   │       ├── chatbot/         # AI conversation
│   │       ├── teams/           # Team generation & selection
│   │       ├── chat/            # Chat operations
│   │       ├── payment/         # Razorpay integration
│   │       └── projects/        # Project management
│   ├── components/
│   │   ├── Navbar.tsx           # Main navigation
│   │   └── Footer.tsx           # Site footer
│   ├── lib/
│   │   ├── mongodb.ts           # DB connection
│   │   ├── razorpay.ts          # Payment client
│   │   └── utils.ts             # Utilities
│   ├── models/                  # Mongoose schemas
│   │   ├── User.ts              # User accounts
│   │   ├── FreelancerProfile.ts # Freelancer details
│   │   ├── Project.ts           # Project data
│   │   ├── ChatRoom.ts          # Chat rooms
│   │   └── Notification.ts      # User notifications
│   └── middleware.ts            # Auth & routing
├── scripts/
│   └── seedFreelancers.ts       # Sample data
├── public/                       # Static assets
├── tailwind.config.ts           # Tailwind + custom theme
└── next.config.ts               # Next.js config
```

## 🔄 Complete User Flows

### 💼 Business Owner Journey

1. **Sign Up** → Google/Email → Select "Business Owner"
2. **AI Consultation** → 6-question chat about project needs
3. **Project Analysis** → AI provides:
   - Feature breakdown
   - Cost estimation (Agency vs DevinOut)
   - Timeline recommendations
   - Smart suggestions
4. **Team Creation** → Click "Create My Team"
5. **View Options** → See 3 matched teams:
   - **Premium** (₹250) - Top 5% talent
   - **Pro** (₹100) - Experienced professionals
   - **Freemium** (FREE) - Try platform
6. **Select Team** → Pay platform fee (₹100-250) via Razorpay
7. **3-Way Chat** → Collaborate with designer + developer
8. **Negotiate** → Discuss project cost directly with team
9. **Build** → Track progress in dashboard

### 👨‍💻 Freelancer Journey

1. **Sign Up** → Choose "Freelancer" → Select Designer/Developer
2. **Create Profile** → Add:
   - Skills & technologies
   - Experience level (Junior/Mid/Senior)
   - Hourly rate (₹/hour)
   - Portfolio link
   - Bio
3. **Set Availability** → Toggle ON to be matched
4. **Get Matched** → AI includes you in team recommendations
5. **Notification** → Alerted when selected for project
6. **Join Chat** → Access 3-way collaboration room
7. **Negotiate** → Discuss scope and pricing with client
8. **Deliver** → Build project and earn reputation

## 🎯 AI Team Matching Algorithm

```javascript
// Score calculation for each team combination
function calculateMatchScore(designer, developer, project) {
  let score = 0;
  
  // Experience scoring (15 points each)
  score += experiencePoints[designer.experienceLevel] * 15;
  score += experiencePoints[developer.experienceLevel] * 15;
  
  // Rating (max 50 points)
  score += designer.rating * 10;
  score += developer.rating * 10;
  
  // Completed projects (max 40 points)
  score += Math.min(designer.completedProjects * 2, 20);
  score += Math.min(developer.completedProjects * 2, 20);
  
  // Design complexity match (15 points)
  if (matchesComplexity(designer, project.designComplexity)) {
    score += 15;
  }
  
  // Skills match (max 30 points)
  score += calculateSkillsMatch(developer.skills, project.features);
  
  return score; // Max: ~150 points
}

// Top 3 teams assigned tiers
teams.sort((a, b) => b.score - a.score);
teams[0].teamType = 'premium';  // Highest score
teams[1].teamType = 'pro';      // Second
teams[2].teamType = 'freemium'; // Third
```

## 💰 Pricing Model

### Platform Fees (What Users Pay)
- **Premium Team**: ₹250 (unlock elite professionals)
- **Pro Team**: ₹100 (unlock experienced devs)
- **Freemium Team**: FREE (try platform risk-free)

### What Happens After
1. Pay platform fee → Unlock team access
2. Join 3-way chat room
3. Negotiate project cost directly with team
4. Payment to freelancers is direct (not through platform)

**Savings**: 35-45% compared to traditional agencies

## 🚧 Development Status

### ✅ Fully Implemented
- [x] Authentication system (Clerk + Google OAuth)
- [x] Role-based onboarding
- [x] AI chatbot with Groq (Llama 3.3)
- [x] MongoDB data models
- [x] Business dashboard with AI chat
- [x] Freelancer profile management
- [x] Team matching algorithm
- [x] Team selection & payment (Razorpay)
- [x] 3-way chat rooms
- [x] Real-time messaging (polling)
- [x] Project tracking
- [x] Notification system
- [x] Responsive UI (mobile-first)
- [x] About page with team section

### 🔨 Future Enhancements
- [ ] WebSocket for real-time chat
- [ ] File sharing in chat
- [ ] Milestone-based payments
- [ ] Freelancer verification system
- [ ] Advanced filters for team selection
- [ ] Video call integration
- [ ] Mobile app (React Native)

## 🌐 Deployment Guide

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add all environment variables from `.env.local`
   - Deploy!

3. **Update Clerk URLs**
   - In Clerk dashboard, add production URLs
   - Update allowed origins and redirect URLs

4. **MongoDB Atlas**
   - Add Vercel IP to whitelist (or use 0.0.0.0/0)

5. **Razorpay**
   - Switch to Live mode for production
   - Update keys in Vercel environment

## 🐛 Common Issues & Solutions

**Chat not loading?**
- Check chatRoomId in URL is valid
- Verify User model is registered in API routes
- Check Next.js 16 params are awaited

**Team matching not working?**
- Run `npm run seed` to create sample freelancers
- Check MongoDB connection
- Verify freelancers have `availabilityStatus: true`

**Payment failing?**
- Use Razorpay test cards in test mode
- Verify both RAZORPAY_KEY_ID and SECRET are set
- Check amount is passed correctly (in ₹, not paise)

**AI chatbot errors?**
- Verify Groq API key is valid
- Check rate limits (30 req/min on free tier)
- Monitor console for specific error messages

## 📚 Tech Documentation

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [MongoDB + Mongoose](https://mongoosejs.com/docs/)
- [Groq AI](https://console.groq.com/docs)
- [Razorpay Integration](https://razorpay.com/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 👥 Team

- **Nitesh Agarwal** - Full Stack Developer
- Built for Minor Project 2025

## 📄 License

MIT License - Educational project for academic submission.

---

**🎨 Built with passion using Next.js 16, Groq AI, MongoDB, Clerk & Razorpay**

**⭐ Star this repo if you find it useful!**

