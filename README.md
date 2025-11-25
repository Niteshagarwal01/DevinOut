# DevinOut - AI-Powered Freelance Team Matching Platform

DevinOut is an innovative platform that simplifies freelance hiring by using AI to match businesses with perfect designer-developer teams. Unlike traditional platforms, teams are **dynamically created** for each project based on requirements, skills, and availability.

## 🚀 Features

### For Business Owners
- **AI Chat Assistant** - Conversational interface to gather project requirements
- **Smart Budget Estimation** - Get instant cost estimates (Agency vs DevinOut)
- **Dynamic Team Matching** - Receive 3 ranked team options (Premium, Pro, Freemium)
- **3-Way Collaboration** - Real-time chat with your designer and developer
- **Secure Payments** - Integrated Razorpay payment system

### For Freelancers
- **Profile Management** - Showcase skills, portfolio, and experience
- **Dynamic Team Formation** - Get matched with complementary freelancers
- **Project Notifications** - Instant alerts when selected for a team
- **Reputation Building** - Rating and review system

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Authentication**: Clerk (with Google Sign-In)
- **Database**: MongoDB with Mongoose
- **AI Chatbot**: OpenAI API (GPT-3.5-turbo)
- **Payments**: Razorpay
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Clerk account
- OpenAI API account
- Razorpay account

## 🔧 Installation & Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd minorproject
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables (see `.env.example`):

```env
# Clerk Authentication (Get from https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# MongoDB (Get from https://www.mongodb.com/cloud/atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/devinout

# OpenAI (Get from https://platform.openai.com)
OPENAI_API_KEY=sk-your_openai_key_here

# Razorpay (Get from https://razorpay.com)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

### 4. Get API Keys

#### Clerk Setup (Authentication + Google Sign-In)
1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Navigate to **Configure → Social Connections**
4. Enable **Google** as a social login provider
5. Copy your **Publishable Key** and **Secret Key** from the API Keys section
6. Add them to `.env.local`

#### MongoDB Setup
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user (Database Access → Add New Database User)
3. Whitelist your IP address (Network Access → Add IP Address)
4. Click "Connect" → "Connect your application"
5. Copy the connection string and add to `.env.local`

#### OpenAI Setup
1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Go to API Keys section
3. Create a new API key
4. Add it to `.env.local`
5. **Important**: OpenAI charges per API call. Add billing method and monitor usage.

#### Razorpay Setup
1. Sign up at [Razorpay](https://razorpay.com)
2. Switch to **Test Mode** (for development)
3. Go to Settings → API Keys
4. Copy **Key ID** and **Key Secret**
5. Add them to `.env.local`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with ClerkProvider
│   ├── page.tsx                 # Landing page
│   ├── sign-in/[[...sign-in]]/  # Clerk sign-in page
│   ├── sign-up/[[...sign-up]]/  # Clerk sign-up page
│   ├── onboarding/              # Role selection page
│   └── api/                     # API routes (to be created)
├── lib/                         # Utility functions
│   ├── mongodb.ts               # MongoDB connection
│   ├── openai.ts                # OpenAI client
│   ├── razorpay.ts              # Razorpay client
│   └── utils.ts                 # Helper functions
├── models/                      # Mongoose schemas
│   ├── User.ts
│   ├── FreelancerProfile.ts
│   ├── Project.ts
│   ├── ChatRoom.ts
│   └── Notification.ts
└── middleware.ts                # Clerk authentication middleware
```

## 🔄 User Flow

### Business Owner Journey
1. Sign Up → Choose "Business Owner"
2. Chat with AI → Describe project
3. Get Budget → Receive cost estimation
4. Create Team → Click "Create My Team"
5. View Teams → See 3 ranked options
6. Select Team → Choose and pay (if needed)
7. Collaborate → Start 3-way chat

### Freelancer Journey
1. Sign Up → Choose "Freelancer" (Designer/Developer)
2. Complete Profile → Add skills, portfolio
3. Set Availability → Mark as available
4. Get Matched → Included in team recommendations
5. Receive Notification → Alerted when selected
6. Join Project → Collaborate in 3-way chat

## 🧮 Team Matching Algorithm

```javascript
Score = Experience Points + Skill Match + (Rating × 10) 
        + Completed Projects + Collaboration Bonus

Premium Team: Highest combined score
Pro Team: Second highest
Freemium Team: Third highest
```

## 🚧 Development Status

### ✅ Completed
- [x] Project setup with Next.js + TypeScript + Tailwind
- [x] Clerk authentication with Google Sign-In
- [x] MongoDB models and connection
- [x] OpenAI and Razorpay integration setup
- [x] Landing page
- [x] Sign-in/Sign-up pages
- [x] Onboarding page

### 🔨 To Build Next
- [ ] API routes for onboarding
- [ ] Business dashboard with AI chatbot
- [ ] Freelancer profile creation page
- [ ] Team matching algorithm implementation
- [ ] 3-way chat system
- [ ] Payment integration
- [ ] Notifications system

## 🌐 Deployment to Vercel

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add all environment variables from `.env.local`
5. Deploy!

## 🐛 Troubleshooting

**Clerk not working?**
- Verify keys in `.env.local` start with `pk_test_` and `sk_test_`
- Check middleware.ts is in the src directory

**MongoDB connection error?**
- Verify connection string format
- Check IP whitelist in MongoDB Atlas
- Ensure database user has read/write permissions

**OpenAI errors?**
- Confirm API key is valid
- Check you have billing setup
- Monitor usage limits

**Razorpay issues?**
- Use Test Mode keys during development
- Verify both Key ID and Secret are set

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [MongoDB Mongoose Guide](https://mongoosejs.com/docs/guide.html)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Razorpay Documentation](https://razorpay.com/docs)

## 📄 License

Educational project for Minor Project submission.

---

**Built with ❤️ using Next.js, Clerk, MongoDB, OpenAI & Razorpay**

