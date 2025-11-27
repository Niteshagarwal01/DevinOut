# ⚛️ React Components & Frontend - DevinOut

## Table of Contents
1. [Overview](#overview)
2. [Client vs Server Components](#client-vs-server-components)
3. [Page Components](#page-components)
4. [Reusable Components](#reusable-components)
5. [React Hooks Usage](#react-hooks-usage)
6. [State Management Patterns](#state-management-patterns)
7. [Event Handling](#event-handling)
8. [Real-Time Updates](#real-time-updates)
9. [Form Handling](#form-handling)
10. [Navigation Patterns](#navigation-patterns)

---

## Overview

DevinOut uses **React 19** with **Next.js 16 App Router**, featuring:
- **13 Page Components** (.tsx files)
- **2 Reusable Components** (Navbar, Footer)
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **Clerk** for authentication
- **Client-side hooks** for interactivity

### Component File Structure

```
src/
├── app/                           # Pages (App Router)
│   ├── layout.tsx                # Root layout (Server Component)
│   ├── page.tsx                  # Landing page (Server Component)
│   ├── about/page.tsx            # About page (Server Component)
│   ├── sign-in/[[...sign-in]]/page.tsx    # Clerk sign-in (Client)
│   ├── sign-up/[[...sign-up]]/page.tsx    # Clerk sign-up (Client)
│   ├── onboarding/page.tsx       # Role selection (Client)
│   ├── dashboard/
│   │   ├── business/page.tsx     # Business dashboard (Client)
│   │   ├── business/teams/[projectId]/page.tsx  # Team selection (Client)
│   │   ├── freelancer/page.tsx   # Freelancer dashboard (Client)
│   │   └── freelancer/profile/page.tsx  # Profile form (Client)
│   └── chat/[chatRoomId]/page.tsx  # Chat room (Client)
│
└── components/                    # Reusable components
    ├── Navbar.tsx                # Navigation (Client)
    └── Footer.tsx                # Footer (Server Component)
```

---

## Client vs Server Components

### Server Components (Default)

```typescript
// app/page.tsx - Server Component (no 'use client')
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await currentUser();  // Server-side auth check
  
  // If user is signed in, redirect to appropriate dashboard
  if (user) {
    const role = user.unsafeMetadata?.role as string | undefined;
    if (role === 'freelancer') {
      redirect('/dashboard/freelancer');
    } else {
      redirect('/dashboard/business');
    }
  }

  return (
    <div className="min-h-screen">
      {/* Static JSX - no interactivity needed */}
      <h1>Welcome to DevinOut</h1>
    </div>
  );
}
```

**Benefits of Server Components:**
- ✅ **No JavaScript sent to client** (faster page loads)
- ✅ **Direct database/API access** (no extra API route needed)
- ✅ **SEO-friendly** (fully rendered HTML)
- ✅ **Automatic code splitting**

**When to use:**
- Static pages (Landing, About)
- SEO-critical content
- Pages that don't need user interaction

---

### Client Components ('use client')

```typescript
// app/dashboard/business/page.tsx - Client Component
'use client';  // REQUIRED for hooks/interactivity

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function BusinessDashboard() {
  // Hooks only work in Client Components
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Side effects
  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div>
      {/* Interactive UI */}
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)}  // Event handler
      />
      <button onClick={handleSend}>Send</button>  {/* onClick handler */}
    </div>
  );
}
```

**When to use Client Components:**
- Hooks needed (useState, useEffect, useRef)
- Event handlers (onClick, onChange, onSubmit)
- Browser APIs (localStorage, window)
- Third-party interactive libraries

---

## Page Components

### 1. Landing Page (Server Component)

**File:** `app/page.tsx`

```typescript
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function Home() {
  // Server-side auth check
  const user = await currentUser();
  
  if (user) {
    const role = user.unsafeMetadata?.role as string | undefined;
    if (role === 'freelancer') {
      redirect('/dashboard/freelancer');  // Server-side redirect
    } else {
      redirect('/dashboard/business');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        <h1 className="text-7xl font-bold text-royal-gradient">
          Find Your Perfect Designer + Developer Team
        </h1>
        <Link href="/sign-up">Start Your Project</Link>
      </section>
      
      <Footer />
    </div>
  );
}
```

**Key Features:**
- **async component** (server-side data fetching)
- **currentUser()** from Clerk (server-only)
- **redirect()** for navigation (server-side)
- **No useState** (no interactivity)
- **Static JSX** (fast loading)

---

### 2. Business Dashboard (Client Component)

**File:** `app/dashboard/business/page.tsx`

**Complete Implementation:**

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Project {
  _id: string;
  websiteType: string;
  status: 'chatting' | 'team_presented' | 'team_selected';
  createdAt: string;
}

export default function BusinessDashboard() {
  // HOOKS - Authentication
  const { user } = useUser();              // Get current user
  const { signOut } = useClerk();          // Sign out function
  const router = useRouter();              // Navigation

  // HOOKS - Local State
  const [activeTab, setActiveTab] = useState<'new' | 'projects'>('new');
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome! What type of website are you envisioning?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // HOOK - DOM Reference
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // HOOK - Side Effect (Auto-scroll)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);  // Runs when messages change

  // HOOK - Side Effect (Fetch projects on mount)
  useEffect(() => {
    if (activeTab === 'projects') {
      fetchProjects();
    }
  }, [activeTab]);  // Runs when activeTab changes

  // API CALL - Fetch projects
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/my-projects');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // EVENT HANDLER - Send message
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');  // Clear input immediately
    
    // Optimistic update (update UI before API response)
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // API call
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Update state with AI response
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);

      if (data.projectId) {
        setProjectId(data.projectId);
      }

      if (data.showCreateTeam) {
        setShowCreateTeam(true);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'My apologies, I encountered an error.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // EVENT HANDLER - Keyboard shortcut
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark">
      {/* Header */}
      <div className="bg-white border-b border-[#8B0000]/10 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-royal-gradient">DevinOut</h1>
            <button
              onClick={() => signOut(() => router.push('/'))}
              className="px-4 py-2 bg-[#8B0000] text-white rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('new')}
          className={activeTab === 'new' ? 'bg-royal-gradient text-white' : 'bg-white'}
        >
          New Project
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={activeTab === 'projects' ? 'bg-royal-gradient text-white' : 'bg-white'}
        >
          My Projects ({projects.length})
        </button>
      </div>

      {/* New Project Tab */}
      {activeTab === 'new' && (
        <>
          {/* Chat Messages */}
          <div className="bg-white rounded-2xl shadow-royal-lg">
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={message.role === 'user' ? 'bg-royal-gradient text-white' : 'bg-cream-light'}>
                    {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  <div className="max-w-[80%] rounded-2xl px-5 py-3">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[#8B0000]" />
                </div>
              )}

              {/* Auto-scroll target */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share your project vision..."
                  disabled={loading}
                  className="flex-1 px-5 py-3 border-2 rounded-xl"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-royal-gradient text-white rounded-xl"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Create Team Button */}
              {showCreateTeam && projectId && (
                <button
                  onClick={() => router.push(`/dashboard/business/teams/${projectId}`)}
                  className="w-full mt-4 px-6 py-4 bg-[#D4AF37] text-[#2C1810] rounded-xl"
                >
                  View Your Curated Teams
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* My Projects Tab */}
      {activeTab === 'projects' && (
        <div className="grid gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-2xl shadow-royal p-6">
              <h3 className="text-2xl font-bold capitalize">
                {project.websiteType} Website
              </h3>
              <p className="text-sm text-gray-500">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => router.push(`/dashboard/business/teams/${project._id}`)}
                className="mt-4 px-6 py-3 bg-royal-gradient text-white rounded-xl"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Key React Patterns:**

1. **Multiple useState Hooks**
   ```typescript
   const [messages, setMessages] = useState<Message[]>([]);  // Chat messages
   const [input, setInput] = useState('');                   // Input field
   const [loading, setLoading] = useState(false);            // Loading state
   const [activeTab, setActiveTab] = useState<'new' | 'projects'>('new');
   ```

2. **useEffect for Side Effects**
   ```typescript
   // Auto-scroll when messages change
   useEffect(() => {
     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages]);

   // Fetch data when tab changes
   useEffect(() => {
     if (activeTab === 'projects') {
       fetchProjects();
     }
   }, [activeTab]);
   ```

3. **useRef for DOM Access**
   ```typescript
   const messagesEndRef = useRef<HTMLDivElement>(null);
   
   // Later in JSX:
   <div ref={messagesEndRef} />  // Auto-scroll target
   ```

4. **Optimistic Updates**
   ```typescript
   setInput('');  // Clear input immediately (before API call)
   const newMessages = [...messages, userMessage];
   setMessages(newMessages);  // Update UI immediately
   
   // Then make API call
   const response = await fetch('/api/chatbot', {...});
   ```

5. **Conditional Rendering**
   ```typescript
   {loading && <Loader2 className="animate-spin" />}
   {showCreateTeam && projectId && <button>Create Team</button>}
   {activeTab === 'new' && <ChatInterface />}
   {activeTab === 'projects' && <ProjectList />}
   ```

---

### 3. Team Selection Page (Client Component)

**File:** `app/dashboard/business/teams/[projectId]/page.tsx`

**Dynamic Route Parameter:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Team {
  teamType: 'premium' | 'pro' | 'freemium';
  designer: TeamMember;
  developer: TeamMember;
  platformFee: number;
}

export default function TeamsPage() {
  // Get dynamic route parameter
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;  // From URL: /teams/[projectId]

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateTeams();
    
    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const generateTeams = async () => {
    try {
      const response = await fetch('/api/teams/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();
      setTeams(data.teams);
    } catch (error) {
      console.error('Error generating teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (team: Team) => {
    try {
      // Create Razorpay order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: team.platformFee,
          projectId,
          teamType: team.teamType,
        }),
      });

      const orderData = await orderResponse.json();

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: team.platformFee * 100,  // Convert to paise
        currency: 'INR',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Payment successful
          await selectTeamAfterPayment(team, response);
        },
        theme: { color: '#8B0000' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  if (loading) {
    return <div>Loading teams...</div>;
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {teams.map((team, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-royal p-6">
          <h3 className="text-2xl font-bold capitalize">{team.teamType} Team</h3>
          
          {/* Designer */}
          <div>
            <p className="font-bold">{team.designer.name}</p>
            <p className="text-sm">Designer • {team.designer.experienceLevel}</p>
            <p>Rating: {team.designer.rating}</p>
            <p>₹{team.designer.hourlyRate}/hour</p>
          </div>

          {/* Developer */}
          <div>
            <p className="font-bold">{team.developer.name}</p>
            <p className="text-sm">Developer • {team.developer.experienceLevel}</p>
            <p>Rating: {team.developer.rating}</p>
            <p>₹{team.developer.hourlyRate}/hour</p>
          </div>

          {/* Select Button */}
          <button
            onClick={() => initiatePayment(team)}
            className="w-full py-4 bg-royal-gradient text-white rounded-xl"
          >
            {team.teamType === 'freemium' 
              ? 'Select FREE Team' 
              : `Unlock for ₹${team.platformFee}`}
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Key Concepts:**

1. **Dynamic Routes with useParams**
   ```typescript
   const params = useParams();
   const projectId = params.projectId;  // /teams/123abc → "123abc"
   ```

2. **Razorpay Integration**
   ```typescript
   // Load external script
   const script = document.createElement('script');
   script.src = 'https://checkout.razorpay.com/v1/checkout.js';
   document.body.appendChild(script);

   // Open payment modal
   const razorpay = new window.Razorpay(options);
   razorpay.open();
   ```

3. **TypeScript Interfaces**
   ```typescript
   interface Team {
     teamType: 'premium' | 'pro' | 'freemium';  // Literal types
     designer: TeamMember;
     developer: TeamMember;
     platformFee: number;
   }
   ```

---

### 4. Chat Room (Client Component)

**File:** `app/chat/[chatRoomId]/page.tsx`

**Real-Time Polling Pattern:**

```typescript
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export default function ChatRoomPage() {
  const params = useParams();
  const chatRoomId = params.chatRoomId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // POLLING - Fetch messages every 3 seconds
  useEffect(() => {
    fetchMessages();  // Initial fetch
    
    const interval = setInterval(fetchMessages, 3000);  // Poll every 3s
    
    return () => clearInterval(interval);  // Cleanup on unmount
  }, [chatRoomId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${chatRoomId}/messages`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    const messageText = input.trim();
    setInput('');  // Optimistic update

    try {
      const response = await fetch(`/api/chat/${chatRoomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      if (data.success) {
        // Immediately add message to UI
        setMessages([...messages, data.message]);
      } else {
        setInput(messageText);  // Restore input on failure
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setInput(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.map((msg, index) => (
          <div key={index} className="flex gap-3 mb-4">
            <div className="rounded-2xl px-4 py-3">
              <p className="font-semibold">{msg.senderName}</p>
              <p className="whitespace-pre-wrap">{msg.message}</p>
              <p className="text-xs text-gray-500">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1 px-4 py-3 border-2 rounded-xl"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="px-6 py-3 bg-royal-gradient text-white rounded-xl"
          >
            {sending ? <Loader2 className="animate-spin" /> : <Send />}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Real-Time Update Pattern:**

```typescript
// Polling-based real-time (simple, works everywhere)
useEffect(() => {
  fetchMessages();  // Fetch immediately
  
  const interval = setInterval(fetchMessages, 3000);  // Poll every 3s
  
  return () => clearInterval(interval);  // Cleanup
}, [chatRoomId]);
```

**Why Polling over WebSockets?**
- ✅ Simpler implementation
- ✅ Works on all serverless platforms
- ✅ No connection management
- ✅ Good enough for 3-person chats
- ⚠️ 3-second delay (acceptable tradeoff)

---

### 5. Freelancer Dashboard (Client Component)

**File:** `app/dashboard/freelancer/page.tsx`

**Complex State Management:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface FreelancerProfile {
  freelancerType: 'designer' | 'developer';
  skills: string[];
  experienceLevel: 'junior' | 'mid' | 'senior';
  rating: number;
  availabilityStatus: boolean;
}

interface Project {
  _id: string;
  websiteType: string;
  status: string;
  myRole?: 'designer' | 'developer';
  myAcceptance?: boolean;
}

export default function FreelancerDashboard() {
  const { user } = useUser();
  
  // Multiple state slices
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'ongoing'>('overview');
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [projects, setProjects] = useState<{
    pending: Project[];
    ongoing: Project[];
    completed: Project[];
  }>({ pending: [], ongoing: [], completed: [] });
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchProjects();
  }, []);

  const toggleAvailability = async () => {
    try {
      const response = await fetch('/api/freelancer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availabilityStatus: !profile?.availabilityStatus,
        }),
      });

      if (response.ok) {
        fetchProfile();  // Re-fetch updated profile
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const handleInvitationResponse = async (projectId: string, response: 'accept' | 'reject') => {
    setRespondingTo(projectId);  // Show loading on specific project
    
    try {
      const res = await fetch('/api/projects/invitation/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, response }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchProjects();  // Refresh project list
        
        if (data.status === 'both_accepted') {
          alert('Project accepted! Chat room is ready.');
          router.push(`/chat/${data.chatRoomId}`);
        }
      }
    } catch (error) {
      console.error('Failed to respond:', error);
    } finally {
      setRespondingTo(null);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Sidebar */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-xl font-bold">Your Profile</h2>
          
          {/* Availability Toggle */}
          <button
            onClick={toggleAvailability}
            className={`relative inline-flex h-7 w-12 items-center rounded-full ${
              profile?.availabilityStatus ? 'bg-[#8B0000]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                profile?.availabilityStatus ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Tab Navigation */}
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'bg-royal-gradient text-white' : 'text-gray-700'}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={activeTab === 'pending' ? 'bg-royal-gradient text-white' : 'text-gray-700'}
          >
            Pending Invites ({projects.pending.length})
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="md:col-span-2">
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {projects.pending.map(project => (
              <div key={project._id} className="bg-white rounded-2xl p-6">
                <h3 className="text-2xl font-bold">{project.websiteType}</h3>
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleInvitationResponse(project._id, 'accept')}
                    disabled={respondingTo === project._id}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl"
                  >
                    {respondingTo === project._id ? <Loader2 className="animate-spin" /> : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleInvitationResponse(project._id, 'reject')}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Advanced Patterns:**

1. **Nested State Object**
   ```typescript
   const [projects, setProjects] = useState<{
     pending: Project[];
     ongoing: Project[];
     completed: Project[];
   }>({ pending: [], ongoing: [], completed: [] });
   ```

2. **Loading State per Item**
   ```typescript
   const [respondingTo, setRespondingTo] = useState<string | null>(null);
   
   // In render:
   disabled={respondingTo === project._id}  // Only disable specific button
   ```

3. **Toggle Switch Component**
   ```typescript
   <button
     onClick={toggleAvailability}
     className={`relative inline-flex h-7 w-12 rounded-full ${
       isActive ? 'bg-[#8B0000]' : 'bg-gray-300'
     }`}
   >
     <span className={`h-5 w-5 rounded-full bg-white transition ${
       isActive ? 'translate-x-6' : 'translate-x-1'
     }`} />
   </button>
   ```

---

### 6. Freelancer Profile Form (Client Component)

**File:** `app/dashboard/freelancer/profile/page.tsx`

**Form Handling with TypeScript:**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const designSkills = ['UI/UX Design', 'Figma', 'Adobe XD', 'Sketch'];
const developerSkills = ['React', 'Next.js', 'TypeScript', 'MongoDB'];

export default function FreelancerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    freelancerType: '',
    skills: [] as string[],
    experienceLevel: '',
    portfolioLink: '',
    hourlyRate: '',
    bio: '',
  });

  // Dynamic skills based on freelancer type
  const availableSkills = formData.freelancerType === 'designer' 
    ? designSkills 
    : developerSkills;

  // Toggle skill selection
  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)  // Remove
        : [...prev.skills, skill]                // Add
    }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/freelancer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }

      router.push('/dashboard/freelancer');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-light to-cream-dark py-12 px-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-8">Complete Your Freelancer Profile</h1>

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Freelancer Type Selection */}
        <div className="mb-6">
          <label className="block font-bold mb-3">I am a *</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, freelancerType: 'designer', skills: [] })}
              className={`p-6 border-3 rounded-xl ${
                formData.freelancerType === 'designer'
                  ? 'border-[#8B0000] bg-royal-gradient text-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              Designer
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, freelancerType: 'developer', skills: [] })}
              className={`p-6 border-3 rounded-xl ${
                formData.freelancerType === 'developer'
                  ? 'border-[#8B0000] bg-royal-gradient text-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              Developer
            </button>
          </div>
        </div>

        {/* Skills Selection (Multi-select) */}
        {formData.freelancerType && (
          <div className="mb-6">
            <label className="block font-bold mb-3">
              Your Skills * (Select at least 3)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold ${
                    formData.skills.includes(skill)
                      ? 'bg-royal-gradient text-white'
                      : 'bg-[#FFF8DC] text-[#8B0000] border-2 border-[#8B0000]/20'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Selected: {formData.skills.length} skills
            </p>
          </div>
        )}

        {/* Experience Level */}
        <div className="mb-6">
          <label className="block font-bold mb-3">Experience Level *</label>
          <div className="grid grid-cols-3 gap-4">
            {['junior', 'mid', 'senior'].map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData({ ...formData, experienceLevel: level })}
                className={`p-4 border-3 rounded-xl capitalize ${
                  formData.experienceLevel === level
                    ? 'border-[#D4AF37] bg-[#D4AF37] text-[#2C1810]'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Text Inputs */}
        <div className="mb-6">
          <label className="block font-bold mb-3">Portfolio Link</label>
          <input
            type="url"
            value={formData.portfolioLink}
            onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })}
            placeholder="https://yourportfolio.com"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
          />
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-3">Hourly Rate (₹)</label>
          <input
            type="number"
            value={formData.hourlyRate}
            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
            placeholder="500"
            min="0"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
          />
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-3">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself..."
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
          />
          <p className="text-sm text-gray-600 mt-2">
            {formData.bio.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.freelancerType || formData.skills.length < 3 || !formData.experienceLevel}
          className="w-full px-8 py-5 bg-royal-gradient text-white rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? 'Creating Profile...' : 'Create Profile & Continue'}
        </button>
      </form>
    </div>
  );
}
```

**Form Patterns:**

1. **Controlled Inputs**
   ```typescript
   <input
     value={formData.portfolioLink}
     onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })}
   />
   ```

2. **Multi-Select (Array State)**
   ```typescript
   const handleSkillToggle = (skill: string) => {
     setFormData(prev => ({
       ...prev,
       skills: prev.skills.includes(skill)
         ? prev.skills.filter(s => s !== skill)
         : [...prev.skills, skill]
     }));
   };
   ```

3. **Form Validation**
   ```typescript
   disabled={
     loading || 
     !formData.freelancerType || 
     formData.skills.length < 3 || 
     !formData.experienceLevel
   }
   ```

4. **Character Counter**
   ```typescript
   <textarea maxLength={500} value={formData.bio} />
   <p>{formData.bio.length}/500 characters</p>
   ```

---

### 7. Onboarding Page (Client Component)

**File:** `app/onboarding/page.tsx`

**Automatic Role Detection & Redirect:**

```typescript
'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;  // Wait for Clerk to load

    // Check if user has role in Clerk metadata
    const role = user?.unsafeMetadata?.role as string;
    
    if (role && ['business', 'freelancer'].includes(role)) {
      // Role exists - save to database and redirect
      saveRole(role);
    } else {
      // No role found - redirect back to sign-up
      router.push('/sign-up');
    }
  }, [isLoaded, user]);

  const saveRole = async (role: string) => {
    if (saving) return;
    setSaving(true);

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (response.ok && data.redirectTo) {
        router.push(data.redirectTo);  // Navigate to appropriate dashboard
      } else {
        router.push('/sign-up');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      router.push('/sign-up');
    }
  };

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#8B0000] mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Setting up your account...</h2>
      </div>
    </div>
  );
}
```

**Key Concepts:**

1. **useEffect Dependencies**
   ```typescript
   useEffect(() => {
     if (!isLoaded) return;  // Guard clause
     // ... rest of logic
   }, [isLoaded, user]);  // Re-run when these change
   ```

2. **Clerk Metadata Access**
   ```typescript
   const role = user?.unsafeMetadata?.role as string;  // Optional chaining
   ```

3. **Automatic Redirect**
   ```typescript
   if (role && ['business', 'freelancer'].includes(role)) {
     saveRole(role);  // Automatic - no user interaction
   }
   ```

---

## Reusable Components

### 1. Navbar (Client Component)

**File:** `components/Navbar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { Crown, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);  // Mobile menu state
  const { isSignedIn } = useUser();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Crown className="w-9 h-9 text-[#8B0000]" />
            <span className="text-3xl font-bold text-royal-gradient">DevinOut</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-[#8B0000]">Home</Link>
            <Link href="/about" className="text-gray-700 hover:text-[#8B0000]">About</Link>
            
            {isSignedIn ? (
              <>
                <Link href="/dashboard/business">Dashboard</Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link href="/sign-in">Login</Link>
                <Link href="/sign-up">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4">
            <Link href="/" onClick={() => setIsOpen(false)}>Home</Link>
            <Link href="/about" onClick={() => setIsOpen(false)}>About</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
```

**Mobile Menu Pattern:**
```typescript
const [isOpen, setIsOpen] = useState(false);

// Toggle button
<button onClick={() => setIsOpen(!isOpen)}>
  {isOpen ? <X /> : <Menu />}
</button>

// Conditional rendering
{isOpen && <div>Mobile Menu</div>}

// Close on link click
<Link onClick={() => setIsOpen(false)}>Home</Link>
```

---

### 2. Footer (Server Component)

**File:** `components/Footer.tsx`

```typescript
import Link from 'next/link';
import { Crown } from 'lucide-react';

export default function Footer() {
  // No 'use client' - Server Component
  // No hooks - just static JSX
  
  return (
    <footer className="bg-gradient-to-br from-[#2C1810] to-[#1a0f0a] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Crown className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-2xl font-bold">DevinOut</span>
            <p className="text-gray-300 mt-4">
              Premium AI-powered platform connecting elite designers and developers.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <Link href="/" className="text-gray-300 hover:text-white">Features</Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/10 text-center text-gray-400">
          <p>&copy; 2025 DevinOut. Crafted with excellence.</p>
        </div>
      </div>
    </footer>
  );
}
```

**Server vs Client Component Decision:**
- **Navbar**: Client Component (needs useState for mobile menu)
- **Footer**: Server Component (static links, no interactivity)

---

## React Hooks Usage

### useState - Local State

```typescript
// Simple value
const [loading, setLoading] = useState(false);

// Array
const [messages, setMessages] = useState<Message[]>([]);

// Object
const [formData, setFormData] = useState({
  name: '',
  email: '',
});

// Enum/Union type
const [activeTab, setActiveTab] = useState<'new' | 'projects'>('new');
```

### useEffect - Side Effects

```typescript
// Run once on mount
useEffect(() => {
  fetchData();
}, []);  // Empty deps = mount only

// Run when dependency changes
useEffect(() => {
  if (activeTab === 'projects') {
    fetchProjects();
  }
}, [activeTab]);  // Re-run when activeTab changes

// Cleanup function
useEffect(() => {
  const interval = setInterval(fetchMessages, 3000);
  
  return () => clearInterval(interval);  // Cleanup on unmount
}, [chatRoomId]);
```

### useRef - DOM Reference

```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

// Access DOM element
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

// JSX
<div ref={messagesEndRef} />
```

### useRouter - Navigation

```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

// Navigate
router.push('/dashboard/business');

// Go back
router.back();

// Replace (no history entry)
router.replace('/sign-in');
```

### useParams - Dynamic Routes

```typescript
import { useParams } from 'next/navigation';

const params = useParams();
const projectId = params.projectId as string;  // From URL: /teams/[projectId]
```

### useUser - Clerk Authentication

```typescript
import { useUser, useClerk } from '@clerk/nextjs';

const { user, isSignedIn, isLoaded } = useUser();
const { signOut } = useClerk();

// Access user data
console.log(user?.firstName);
console.log(user?.emailAddresses[0].emailAddress);

// Sign out
signOut(() => router.push('/'));
```

---

## State Management Patterns

### 1. Lifting State Up

```typescript
// Parent component
function Dashboard() {
  const [activeTab, setActiveTab] = useState('new');

  return (
    <>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <Content activeTab={activeTab} />
    </>
  );
}

// Child receives state as props
function Tabs({ activeTab, setActiveTab }) {
  return (
    <button onClick={() => setActiveTab('new')}>
      New
    </button>
  );
}
```

### 2. Optimistic Updates

```typescript
// Update UI immediately, then call API
const sendMessage = async () => {
  setInput('');  // Clear input immediately
  setMessages([...messages, userMessage]);  // Show message immediately
  
  // Then make API call
  const response = await fetch('/api/chat/messages', {...});
  
  if (!response.ok) {
    setInput(userMessage);  // Restore on failure
  }
};
```

### 3. Loading States

```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await fetch('/api/data');
    setData(data);
  } finally {
    setLoading(false);  // Always reset loading
  }
};

// In JSX
{loading ? <Loader /> : <Content />}
```

### 4. Error Handling

```typescript
const [error, setError] = useState('');

const handleSubmit = async () => {
  setError('');  // Clear previous error
  
  try {
    const response = await fetch('/api/submit', {...});
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed');
    }
  } catch (err: any) {
    setError(err.message);  // Show error to user
  }
};

// In JSX
{error && (
  <div className="bg-red-50 text-red-700 px-6 py-4 rounded-xl">
    {error}
  </div>
)}
```

---

## Event Handling

### onClick Events

```typescript
// Simple handler
<button onClick={() => setActive(true)}>Click</button>

// Call function
<button onClick={handleSubmit}>Submit</button>

// With parameter
<button onClick={() => handleDelete(item.id)}>Delete</button>

// Prevent default
<a href="#" onClick={(e) => {
  e.preventDefault();
  handleClick();
}}>Click</a>
```

### onChange Events

```typescript
// Text input
<input
  value={input}
  onChange={(e) => setInput(e.target.value)}
/>

// Checkbox
<input
  type="checkbox"
  checked={isChecked}
  onChange={(e) => setIsChecked(e.target.checked)}
/>

// Select dropdown
<select
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
>
  <option value="option1">Option 1</option>
</select>
```

### onKeyPress Events

```typescript
const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

<input onKeyPress={handleKeyPress} />
```

### onSubmit Events

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();  // Prevent page reload
  
  // Form logic
  const formData = new FormData(e.target as HTMLFormElement);
  const data = Object.fromEntries(formData);
};

<form onSubmit={handleSubmit}>
  <input name="email" />
  <button type="submit">Submit</button>
</form>
```

---

## Real-Time Updates

### Polling Pattern (Used in Chat)

```typescript
useEffect(() => {
  fetchMessages();  // Initial fetch
  
  const interval = setInterval(fetchMessages, 3000);  // Poll every 3s
  
  return () => clearInterval(interval);  // Cleanup
}, [chatRoomId]);
```

**Pros:**
- ✅ Simple implementation
- ✅ Works everywhere (serverless-friendly)
- ✅ No connection management

**Cons:**
- ⚠️ 3-second delay
- ⚠️ Unnecessary API calls if no updates

---

## Form Handling

### Controlled Components

```typescript
// Form state
const [formData, setFormData] = useState({
  email: '',
  password: '',
});

// Input binding
<input
  name="email"
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
/>

// Submit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await fetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
};
```

### Multi-Step Forms

```typescript
const [step, setStep] = useState(1);

return (
  <>
    {step === 1 && <Step1 onNext={() => setStep(2)} />}
    {step === 2 && <Step2 onNext={() => setStep(3)} />}
    {step === 3 && <Step3 onSubmit={handleSubmit} />}
  </>
);
```

---

## Navigation Patterns

### Programmatic Navigation

```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

// After successful action
const handleSuccess = () => {
  router.push('/dashboard');
};

// With query params
router.push(`/teams/${projectId}`);

// Replace (no back button)
router.replace('/sign-in');
```

### Link Component

```typescript
import Link from 'next/link';

// Simple link
<Link href="/about">About</Link>

// With styling
<Link href="/sign-up" className="btn-primary">
  Get Started
</Link>

// Dynamic route
<Link href={`/chat/${chatRoomId}`}>Open Chat</Link>
```

---

## Summary

**DevinOut React Architecture:**

✅ **13 Page Components** (mix of Server & Client)  
✅ **Client Components** for interactivity (useState, useEffect)  
✅ **Server Components** for static content (SEO, performance)  
✅ **Clerk Hooks** for authentication (useUser, useClerk)  
✅ **Next.js Hooks** for navigation (useRouter, useParams)  
✅ **TypeScript** for type safety throughout  
✅ **Tailwind CSS** for rapid UI development  
✅ **Polling** for real-time chat updates  
✅ **Optimistic Updates** for better UX  
✅ **Form Handling** with controlled components  

**Next Document**: API Routes & Backend - Deep dive into all API endpoints with complete request/response examples and database operations.
