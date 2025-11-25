'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { 
  Sparkles, Trophy, Award, Gift, Star, Briefcase, 
  IndianRupee, Check, Loader2, ChevronDown, LogOut, ArrowLeft,
  CheckCircle, FileText, Calendar, Zap, Crown, User
} from 'lucide-react';

// Declare Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface TeamMember {
  id: string;
  name: string;
  experienceLevel: string;
  skills: string[];
  rating: number;
  completedProjects: number;
  hourlyRate?: number;
  portfolioLink?: string;
  bio?: string;
}

interface Team {
  teamType: 'premium' | 'pro' | 'freemium';
  score: number;
  designer: TeamMember;
  developer: TeamMember;
  platformFee: number;
  estimatedHours: number;
  estimatedProjectCost: number;
}

interface Project {
  _id: string;
  projectDetails: {
    websiteType: string;
    designComplexity: string;
    features: string[];
    numPages: number;
    timeline: string;
    budgetRange: string;
  };
}

export default function TeamsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [teams, setTeams] = useState<Team[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const projectId = params.projectId as string;

  useEffect(() => {
    generateTeams();
    
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const generateTeams = async () => {
    try {
      const response = await fetch('/api/teams/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate teams');
      }

      setTeams(data.teams);
      setProject(data.project);
    } catch (error: any) {
      console.error('Error generating teams:', error);
      alert(error.message || 'Failed to generate teams');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (team: Team) => {
    setProcessingPayment(true);
    try {
      // Create Razorpay order for platform fee only
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: team.platformFee,
          projectId,
          teamType: team.teamType,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: team.platformFee * 100, // Razorpay expects paise
        currency: 'INR',
        name: 'DevinOut',
        description: `${team.teamType.charAt(0).toUpperCase() + team.teamType.slice(1)} Team Access Fee`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Payment successful, select team
          await selectTeamAfterPayment(team, response);
        },
        prefill: {
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.primaryEmailAddress?.emailAddress,
        },
        theme: {
          color: '#8B0000',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Failed to initiate payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const selectTeamAfterPayment = async (team: Team, paymentResponse: any) => {
    try {
      const response = await fetch('/api/teams/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          designerId: team.designer.id,
          developerId: team.developer.id,
          teamType: team.teamType,
          paymentDetails: paymentResponse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to select team');
      }

      alert('Payment successful! Team selected. Chat room created.');
      router.push(`/chat/${data.chatRoomId}`);
    } catch (error: any) {
      console.error('Error selecting team:', error);
      alert(error.message || 'Failed to select team');
    }
  };

  const selectTeam = async (team: Team) => {
    if (team.teamType !== 'freemium') {
      initiatePayment(team);
      return;
    }

    // Freemium team - no payment needed
    setSelecting(true);
    try {
      const response = await fetch('/api/teams/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          designerId: team.designer.id,
          developerId: team.developer.id,
          teamType: team.teamType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to select team');
      }

      alert('Team selected! Invitations sent to freelancers. You will be notified when they respond.');
      router.push('/dashboard/business');
    } catch (error: any) {
      console.error('Error selecting team:', error);
      alert(error.message || 'Failed to select team');
    } finally {
      setSelecting(false);
    }
  };

  const getTeamIcon = (teamType: string) => {
    switch (teamType) {
      case 'premium': return <Trophy className="w-8 h-8" />;
      case 'pro': return <Award className="w-8 h-8" />;
      case 'freemium': return <Gift className="w-8 h-8" />;
    }
  };

  const getTeamColor = (teamType: string) => {
    switch (teamType) {
      case 'premium': return 'from-[#D4AF37] to-[#FFD700]';
      case 'pro': return 'from-[#8B0000] to-[#DC143C]';
      case 'freemium': return 'from-[#8B0000] to-[#DC143C]';
    }
  };

  const getTeamBorder = (teamType: string) => {
    switch (teamType) {
      case 'premium': return 'border-[#D4AF37]';
      case 'pro': return 'border-[#8B0000]';
      case 'freemium': return 'border-[#8B0000]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-[#8B0000] mx-auto mb-4" />
          <h2 className="text-2xl lg:text-3xl font-bold font-montserrat text-[#2C1810] mb-2">Finding Your Perfect Teams</h2>
          <p className="text-gray-600">Our AI is matching the best designer + developer combinations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark font-poppins">
      {/* Header */}
      <div className="bg-white border-b border-[#8B0000]/10 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/business')}
                className="p-2 hover:bg-cream-light rounded-lg transition"
              >
                <ArrowLeft className="w-6 h-6 text-[#8B0000]" />
              </button>
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-[#8B0000]" />
                <div>
                  <h1 className="text-2xl font-bold font-montserrat text-royal-gradient">
                    DevinOut
                  </h1>
                  <p className="text-sm text-gray-600">Premium Team Matching</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 relative">
              <div className="text-right hidden sm:block">
                <p className="text-gray-700 font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">Business Account</p>
              </div>
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2 hover:bg-cream-light rounded-lg px-2 py-1 transition"
              >
                <div className="w-11 h-11 bg-royal-gradient rounded-full flex items-center justify-center text-white font-bold shadow-royal">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:block" />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-royal-lg border border-[#8B0000]/10 py-2 z-50">
                  <button
                    onClick={() => signOut(() => router.push('/'))}
                    className="w-full px-4 py-3 text-left hover:bg-[#8B0000]/5 flex items-center gap-3 text-[#8B0000] font-semibold transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Project Summary - REAL DATA */}
        {project && (
          <div className="bg-white rounded-2xl shadow-royal-lg p-6 lg:p-8 mb-8 border border-[#8B0000]/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#8B0000]/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#8B0000]" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold font-montserrat text-[#2C1810]">Your Project Plan</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-[#FFF8DC] rounded-xl p-4 lg:p-5 border border-[#8B0000]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#8B0000]" />
                  <p className="text-sm font-bold text-[#2C1810]">Project Type</p>
                </div>
                <p className="text-lg font-bold text-gray-900 capitalize">{project.projectDetails.websiteType}</p>
              </div>

              <div className="bg-[#8B0000]/5 rounded-xl p-4 lg:p-5 border border-[#8B0000]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-[#DC143C]" />
                  <p className="text-sm font-bold text-[#2C1810]">Design Style</p>
                </div>
                <p className="text-lg font-bold text-gray-900 capitalize">{project.projectDetails.designComplexity}</p>
              </div>

              <div className="bg-[#D4AF37]/10 rounded-xl p-4 lg:p-5 border border-[#D4AF37]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  <p className="text-sm font-bold text-[#2C1810]">Timeline</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{project.projectDetails.timeline}</p>
              </div>

              <div className="bg-[#FFF8DC] rounded-xl p-4 lg:p-5 border border-[#8B0000]/20">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-[#8B0000]" />
                  <p className="text-sm font-bold text-[#2C1810]">Pages</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{project.projectDetails.numPages} pages</p>
              </div>

              <div className="bg-[#8B0000]/5 rounded-xl p-4 lg:p-5 border border-[#8B0000]/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-[#8B0000]" />
                  <p className="text-sm font-bold text-[#2C1810]">Features</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{project.projectDetails.features.length} custom features</p>
              </div>

              <div className="bg-[#D4AF37]/10 rounded-xl p-4 lg:p-5 border border-[#D4AF37]/30">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="w-5 h-5 text-[#D4AF37]" />
                  <p className="text-sm font-bold text-[#2C1810]">Your Budget</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{project.projectDetails.budgetRange}</p>
              </div>
            </div>

            {/* Features List */}
            <div className="mt-6 pt-6 border-t border-[#8B0000]/10">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#8B0000]" />
                Required Features:
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.projectDetails.features.map((feature, i) => (
                  <span key={i} className="px-4 py-2 bg-royal-gradient text-white rounded-lg text-sm font-semibold shadow-md">
                    ✓ {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold font-montserrat text-[#2C1810] mb-4">
            Your Matched Teams
          </h1>
          <p className="text-lg lg:text-xl text-gray-600">
            AI-matched designer + developer combinations based on your requirements
          </p>
        </div>

        {/* Teams - REAL DATA */}
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {teams.map((team, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-royal-lg border-4 ${getTeamBorder(team.teamType)} overflow-hidden transform hover:-translate-y-2 transition-all`}
            >
              {/* Team Header */}
              <div className={`bg-gradient-to-r ${getTeamColor(team.teamType)} text-white p-6 lg:p-8 text-center`}>
                <div className="flex justify-center mb-4">
                  {getTeamIcon(team.teamType)}
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold font-montserrat capitalize mb-3">
                  {team.teamType} Team
                </h3>
                {team.teamType === 'freemium' ? (
                  <div>
                    <p className="text-4xl lg:text-5xl font-bold font-montserrat mb-2">FREE</p>
                    <p className="text-sm opacity-90">Try our platform risk-free</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-4xl lg:text-5xl font-bold font-montserrat mb-2">₹{team.platformFee}</p>
                    <p className="text-sm opacity-90">Platform Access Fee</p>
                    <p className="text-xs opacity-75 mt-1">Estimated Project: ₹{team.estimatedProjectCost.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>

              {/* Team Members - REAL DATA */}
              <div className="p-6 lg:p-8 space-y-6">
                {/* Designer */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-xl flex items-center justify-center shadow-md">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{team.designer.name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        Designer • {team.designer.experienceLevel} level
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#D4AF37]" />
                      <span className="font-bold text-gray-900">{team.designer.rating.toFixed(1)}</span>
                      <span className="text-gray-600">• {team.designer.completedProjects} projects done</span>
                    </div>
                    {team.designer.hourlyRate && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <IndianRupee className="w-5 h-5 text-[#8B0000]" />
                        <span>₹{team.designer.hourlyRate}/hour</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {team.designer.skills.slice(0, 4).map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#FFF8DC] text-[#8B0000] text-xs rounded-lg font-semibold border border-[#8B0000]/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                    {team.designer.bio && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2 leading-relaxed">{team.designer.bio}</p>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#8B0000]/10"></div>

                {/* Developer */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-xl flex items-center justify-center shadow-md">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{team.developer.name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        Developer • {team.developer.experienceLevel} level
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#D4AF37]" />
                      <span className="font-bold text-gray-900">{team.developer.rating.toFixed(1)}</span>
                      <span className="text-gray-600">• {team.developer.completedProjects} projects done</span>
                    </div>
                    {team.developer.hourlyRate && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <IndianRupee className="w-5 h-5 text-[#8B0000]" />
                        <span>₹{team.developer.hourlyRate}/hour</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {team.developer.skills.slice(0, 4).map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#FFF8DC] text-[#8B0000] text-xs rounded-lg font-semibold border border-[#8B0000]/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                    {team.developer.bio && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2 leading-relaxed">{team.developer.bio}</p>
                    )}
                  </div>
                </div>

                {/* Match Score */}
                <div className="bg-[#FFF8DC] rounded-xl p-4 border border-[#8B0000]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 font-semibold">AI Match Score</span>
                    <span className="text-xl font-bold font-montserrat text-[#8B0000]">{Math.round(team.score)}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-royal-gradient h-3 rounded-full transition-all shadow-sm"
                      style={{ width: `${Math.min(team.score, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={() => selectTeam(team)}
                  disabled={selecting || processingPayment}
                  className={`w-full py-4 rounded-xl font-bold text-lg font-montserrat transition-all transform hover:scale-105 ${
                    team.teamType === 'freemium'
                      ? 'bg-royal-gradient text-white hover:shadow-royal-lg'
                      : 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#2C1810] hover:shadow-royal-lg'
                  } disabled:opacity-50 disabled:cursor-not-allowed shadow-royal`}
                >
                  {selecting || processingPayment ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : team.teamType === 'freemium' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Select FREE Team
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <IndianRupee className="w-5 h-5" />
                      Unlock for ₹{team.platformFee}
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-12 max-w-5xl mx-auto bg-white border-2 border-[#8B0000]/20 rounded-2xl p-6 lg:p-8 shadow-md">
          <h3 className="text-2xl font-bold font-montserrat text-[#2C1810] mb-6 flex items-center gap-2">
            <Crown className="w-7 h-7 text-[#D4AF37]" />
            What Happens Next?
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-royal-gradient text-white rounded-xl flex items-center justify-center font-bold font-montserrat flex-shrink-0 shadow-md">1</div>
              <div>
                <p className="font-bold text-gray-900 mb-1">Choose Your Team</p>
                <p className="text-sm text-gray-600">Select based on skills, experience, and budget</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-royal-gradient text-white rounded-xl flex items-center justify-center font-bold font-montserrat flex-shrink-0 shadow-md">2</div>
              <div>
                <p className="font-bold text-gray-900 mb-1">Pay Platform Fee</p>
                <p className="text-sm text-gray-600">₹100 (Pro) or ₹250 (Premium) to unlock team access</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-royal-gradient text-white rounded-xl flex items-center justify-center font-bold font-montserrat flex-shrink-0 shadow-md">3</div>
              <div>
                <p className="font-bold text-gray-900 mb-1">3-Way Chat Created</p>
                <p className="text-sm text-gray-600">Collaborate with your designer and developer</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-royal-gradient text-white rounded-xl flex items-center justify-center font-bold font-montserrat flex-shrink-0 shadow-md">4</div>
              <div>
                <p className="font-bold text-gray-900 mb-1">Negotiate & Build</p>
                <p className="text-sm text-gray-600">Discuss project cost directly with your team</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
