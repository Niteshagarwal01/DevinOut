'use client';

import { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Edit, Briefcase, LogOut, ChevronDown, Clock, DollarSign, FileText, Bell, ArrowRight, Loader2, FolderOpen, Crown, Award, Sparkles, User, MessageCircle } from 'lucide-react';

interface FreelancerProfile {
  freelancerType: string;
  skills: string[];
  experienceLevel: string;
  portfolioLink?: string;
  availabilityStatus: boolean;
  rating: number;
  completedProjects: number;
  hourlyRate?: number;
  bio?: string;
}

interface Project {
  _id: string;
  websiteType: string;
  designComplexity: string;
  features: string[];
  numPages: number;
  timeline: string;
  budgetRange: string;
  status: 'chatting' | 'team_presented' | 'awaiting_acceptance' | 'team_accepted' | 'team_selected' | 'completed';
  selectedTeamType?: 'premium' | 'pro' | 'freemium';
  chatRoomId?: string;
  createdAt: string;
  updatedAt: string;
  myRole?: 'designer' | 'developer';
  myAcceptance?: boolean;
  myRejection?: boolean;
  invitationSentAt?: string;
}

export default function FreelancerDashboard() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'ongoing' | 'completed'>('overview');
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [projects, setProjects] = useState<{
    pending: Project[];
    ongoing: Project[];
    completed: Project[];
    all: Project[];
  }>({ pending: [], ongoing: [], completed: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch('/api/projects/freelancer-projects');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/freelancer/profile');
      const data = await response.json();
      
      if (data.profile) {
        setProfile(data.profile);
      } else {
        // No profile yet, redirect to create one
        router.push('/dashboard/freelancer/profile');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await fetch('/api/freelancer/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availabilityStatus: !profile?.availabilityStatus,
        }),
      });

      if (response.ok) {
        fetchProfile();
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const handleInvitationResponse = async (projectId: string, response: 'accept' | 'reject') => {
    setRespondingTo(projectId);
    try {
      const res = await fetch('/api/projects/invitation/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          response
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Refresh projects
        await fetchProjects();
        
        // Show success message based on status
        if (data.status === 'both_accepted') {
          alert('🎉 Project accepted! Chat room is ready. Both team members accepted!');
          if (data.chatRoomId) {
            router.push(`/chat/${data.chatRoomId}`);
          }
        } else if (data.status === 'partial_acceptance') {
          alert(`✅ You ${response}ed the project. ${data.message}`);
          if (response === 'accept' && data.chatRoomId) {
            router.push(`/chat/${data.chatRoomId}`);
          }
        } else if (data.status === 'waiting') {
          alert(`✅ You ${response}ed the invitation. Waiting for the other freelancer to respond.`);
        } else if (data.status === 'both_rejected') {
          alert('Both freelancers rejected the project.');
        }
      } else {
        alert(data.error || 'Failed to respond to invitation');
      }
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
      alert('Failed to respond to invitation');
    } finally {
      setRespondingTo(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      chatting: { label: 'In Progress', color: 'bg-[#FFF8DC] text-[#8B0000] border border-[#8B0000]/20' },
      team_presented: { label: 'Pending', color: 'bg-[#8B0000]/10 text-[#8B0000] border border-[#8B0000]/30' },
      awaiting_acceptance: { label: 'Invitation Pending', color: 'bg-[#FFD700]/20 text-[#8B0000] border border-[#D4AF37]' },
      team_accepted: { label: 'Active', color: 'bg-gradient-to-r from-[#8B0000] to-[#DC143C] text-white' },
      team_selected: { label: 'Active', color: 'bg-gradient-to-r from-[#8B0000] to-[#DC143C] text-white' },
      completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700 border border-gray-300' }
    };
    const badge = badges[status as keyof typeof badges] || badges.chatting;
    return <span className={`px-4 py-1.5 rounded-full text-xs font-bold font-montserrat ${badge.color}`}>{badge.label}</span>;
  };

  const renderProjectCard = (project: Project, showAcceptButton = false) => (
    <div key={project._id} className="bg-white rounded-2xl shadow-royal hover:shadow-royal-lg transition-all p-6 lg:p-8 border border-[#8B0000]/10">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="text-xl lg:text-2xl font-bold font-montserrat text-[#2C1810] capitalize">
              {project.websiteType || 'Untitled Project'}
            </h3>
            {getStatusBadge(project.status)}
            {project.myRole && (
              <span className="px-3 py-1 bg-[#8B0000]/10 text-[#8B0000] text-xs rounded-lg font-semibold border border-[#8B0000]/20">
                Your Role: {project.myRole}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Created {new Date(project.createdAt).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
        {showAcceptButton && (
          <div className="flex gap-3">
            <button
              onClick={() => handleInvitationResponse(project._id, 'accept')}
              disabled={respondingTo === project._id}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {respondingTo === project._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Accept
            </button>
            <button
              onClick={() => handleInvitationResponse(project._id, 'reject')}
              disabled={respondingTo === project._id}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {respondingTo === project._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
              Reject
            </button>
          </div>
        )}
        {!showAcceptButton && project.chatRoomId && (
          <button
            onClick={() => router.push(`/chat/${project.chatRoomId}`)}
            className="px-6 py-3 bg-royal-gradient text-white rounded-xl font-bold shadow-royal hover:shadow-royal-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <MessageCircle className="w-5 h-5" />
            Open Chat
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#8B0000]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-[#8B0000]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">Design Style</p>
            <p className="font-bold text-gray-900 capitalize">{project.designComplexity || 'Not specified'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#DC143C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-[#DC143C]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">Pages</p>
            <p className="font-bold text-gray-900">{project.numPages || 0} pages</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">Timeline</p>
            <p className="font-bold text-gray-900">{project.timeline || 'Not set'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#FFD700]/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-[#8B0000]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">Budget</p>
            <p className="font-bold text-gray-900">{project.budgetRange || 'Not set'}</p>
          </div>
        </div>
      </div>

      {project.features && project.features.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[#8B0000]/10">
          <p className="text-xs text-gray-500 font-semibold mb-3">Features</p>
          <div className="flex flex-wrap gap-2">
            {project.features.slice(0, 5).map((feature, idx) => (
              <span key={idx} className="px-4 py-2 bg-[#FFF8DC] text-[#8B0000] rounded-lg text-sm font-semibold border border-[#8B0000]/20">
                {feature}
              </span>
            ))}
            {project.features.length > 5 && (
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">
                +{project.features.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {project.selectedTeamType && (
        <div className="mt-6 pt-6 border-t border-[#8B0000]/10">
          <p className="text-xs text-gray-500 font-semibold mb-2">Team Type</p>
          <span className="inline-flex items-center gap-2 px-5 py-2 bg-royal-gradient text-white rounded-lg font-bold font-montserrat uppercase shadow-md">
            <Award className="w-4 h-4" />
            {project.selectedTeamType}
          </span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#8B0000] mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark font-poppins">
      {/* Header */}
      <div className="bg-white border-b border-[#8B0000]/10 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-[#8B0000]" />
              <div>
                <h1 className="text-2xl font-bold font-montserrat text-royal-gradient">
                  DevinOut
                </h1>
                <p className="text-sm text-gray-600">Freelancer Network</p>
              </div>
            </div>
            <div className="flex items-center gap-4 relative">
              <div className="text-right hidden sm:block">
                <p className="text-gray-700 font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">Freelancer Account</p>
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

              {/* Account Menu Dropdown */}
              {showAccountMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-royal-lg border border-[#8B0000]/10 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      router.push('/dashboard/freelancer/profile');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-[#8B0000]/5 flex items-center gap-3 text-gray-700 font-semibold transition"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  <div className="border-t border-[#8B0000]/10 my-1"></div>
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
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar with Profile and Tabs */}
          <div className="md:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-royal p-6 lg:p-8 border border-[#8B0000]/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-montserrat text-[#2C1810]">Your Profile</h2>
                <button
                  onClick={() => router.push('/dashboard/freelancer/profile')}
                  className="p-2 hover:bg-cream-light rounded-lg transition"
                >
                  <Edit className="w-5 h-5 text-[#8B0000]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold font-montserrat ${
                    profile.freelancerType === 'designer' 
                      ? 'bg-gradient-to-r from-[#8B0000] to-[#DC143C] text-white shadow-royal' 
                      : 'bg-gradient-to-r from-[#8B0000] to-[#DC143C] text-white shadow-royal'
                  }`}>
                    {profile.freelancerType === 'designer' ? (
                      <><Sparkles className="w-4 h-4" /> Designer</>
                    ) : (
                      <><Crown className="w-4 h-4" /> Developer</>
                    )}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Experience Level</p>
                  <p className="font-bold text-gray-900 capitalize text-lg">{profile.experienceLevel}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(0, 6).map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-[#FFF8DC] text-[#8B0000] text-xs rounded-lg font-semibold border border-[#8B0000]/20">
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 6 && (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg font-semibold border border-gray-300">
                        +{profile.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Rating</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold font-montserrat text-[#8B0000]">{profile.rating.toFixed(1)}</span>
                    <Award className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Projects Completed</p>
                  <p className="text-3xl font-bold font-montserrat text-[#8B0000]">{profile.completedProjects}</p>
                </div>

                {profile.hourlyRate && (
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-2">Hourly Rate</p>
                    <p className="text-2xl font-bold font-montserrat text-[#8B0000]">₹{profile.hourlyRate}/hr</p>
                  </div>
                )}

                {/* Availability Toggle */}
                <div className="pt-4 border-t border-[#8B0000]/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Availability</span>
                    <button
                      onClick={toggleAvailability}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition shadow-md ${
                        profile.availabilityStatus ? 'bg-gradient-to-r from-[#8B0000] to-[#DC143C]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${
                          profile.availabilityStatus ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {profile.availabilityStatus 
                      ? 'Available for new projects' 
                      : 'Not available for matching'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl shadow-royal p-4 border border-[#8B0000]/10">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold font-montserrat transition-all ${
                    activeTab === 'overview'
                      ? 'bg-royal-gradient text-white shadow-royal'
                      : 'text-gray-700 hover:bg-cream-light border border-transparent hover:border-[#8B0000]/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5" />
                    Overview
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold font-montserrat transition-all ${
                    activeTab === 'pending'
                      ? 'bg-royal-gradient text-white shadow-royal'
                      : 'text-gray-700 hover:bg-cream-light border border-transparent hover:border-[#8B0000]/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5" />
                      Pending Invites
                    </div>
                    {projects.pending.length > 0 && (
                      <span className="px-2.5 py-1 bg-[#D4AF37] text-white text-xs rounded-full font-bold">
                        {projects.pending.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('ongoing')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold font-montserrat transition-all ${
                    activeTab === 'ongoing'
                      ? 'bg-royal-gradient text-white shadow-royal'
                      : 'text-gray-700 hover:bg-cream-light border border-transparent hover:border-[#8B0000]/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5" />
                      Ongoing Projects
                    </div>
                    {projects.ongoing.length > 0 && (
                      <span className="px-2.5 py-1 bg-[#D4AF37] text-white text-xs rounded-full font-bold">
                        {projects.ongoing.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold font-montserrat transition-all ${
                    activeTab === 'completed'
                      ? 'bg-royal-gradient text-white shadow-royal'
                      : 'text-gray-700 hover:bg-cream-light border border-transparent hover:border-[#8B0000]/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5" />
                      Completed
                    </div>
                    {projects.completed.length > 0 && (
                      <span className="px-2.5 py-1 bg-[#D4AF37] text-white text-xs rounded-full font-bold">
                        {projects.completed.length}
                      </span>
                    )}
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
            {/* Status Card */}
            <div className="bg-royal-gradient rounded-2xl shadow-royal p-6 lg:p-8 text-white">
              <div className="flex items-center gap-4">
                {profile.availabilityStatus ? (
                  <CheckCircle className="w-10 h-10" />
                ) : (
                  <XCircle className="w-10 h-10" />
                )}
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold font-montserrat">
                    {profile.availabilityStatus ? 'You\'re Live!' : 'You\'re Offline'}
                  </h2>
                  <p className="text-white/90">
                    {profile.availabilityStatus 
                      ? 'You can be matched with new teams' 
                      : 'Turn on availability to get matched'}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-royal p-4 lg:p-5 border border-[#8B0000]/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FFF8DC] rounded-xl flex items-center justify-center border border-[#8B0000]/20">
                    <Bell className="w-6 h-6 text-[#8B0000]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-montserrat text-[#8B0000]">{projects.pending.length}</p>
                    <p className="text-sm text-gray-600 font-semibold">Pending</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-royal p-4 lg:p-5 border border-[#8B0000]/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#8B0000]/10 rounded-xl flex items-center justify-center border border-[#8B0000]/20">
                    <Clock className="w-6 h-6 text-[#8B0000]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-montserrat text-[#8B0000]">{projects.ongoing.length}</p>
                    <p className="text-sm text-gray-600 font-semibold">Ongoing</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-royal p-4 lg:p-5 border border-[#8B0000]/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-300">
                    <CheckCircle className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-montserrat text-gray-900">{projects.completed.length}</p>
                    <p className="text-sm text-gray-600 font-semibold">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white border-2 border-[#8B0000]/20 rounded-2xl p-6 lg:p-8 shadow-md">
              <h3 className="text-lg lg:text-xl font-bold font-montserrat text-[#2C1810] mb-4 flex items-center gap-2">
                <Crown className="w-6 h-6 text-[#D4AF37]" />
                How DevinOut Works
              </h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="font-bold text-[#8B0000] font-montserrat">1.</span>
                  <span>Keep your <strong>availability ON</strong> to be included in team matching</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-[#8B0000] font-montserrat">2.</span>
                  <span>When a business creates a project, our AI matches <strong>1 designer + 1 developer</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-[#8B0000] font-montserrat">3.</span>
                  <span>If selected, you'll get a <strong>notification</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-[#8B0000] font-montserrat">4.</span>
                  <span>Join the <strong>3-way chat</strong> with the business owner and your team partner</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-[#8B0000] font-montserrat">5.</span>
                  <span>Collaborate, deliver, and build your reputation!</span>
                </li>
              </ol>
            </div>
              </>
            )}

            {/* Pending Invites Tab */}
            {activeTab === 'pending' && (
              <div>
                {loadingProjects ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#8B0000]" />
                  </div>
                ) : projects.pending.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-royal-lg p-12 text-center border border-[#8B0000]/10">
                    <Bell className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold font-montserrat text-[#2C1810] mb-3">No Pending Invites</h3>
                    <p className="text-gray-600">
                      {profile?.availabilityStatus 
                        ? 'You\'ll be notified when you\'re matched to a team' 
                        : 'Turn on availability to receive project invitations'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-[#FFF8DC] border-2 border-[#8B0000]/20 rounded-xl p-4 lg:p-5">
                      <div className="flex items-start gap-3">
                        <Bell className="w-6 h-6 text-[#8B0000] mt-0.5" />
                        <div>
                          <p className="font-bold font-montserrat text-[#2C1810]">You have {projects.pending.length} pending invite(s)</p>
                          <p className="text-sm text-gray-700">Review and accept projects to start working</p>
                        </div>
                      </div>
                    </div>
                    {projects.pending.map(project => renderProjectCard(project, true))}
                  </div>
                )}
              </div>
            )}

            {/* Ongoing Projects Tab */}
            {activeTab === 'ongoing' && (
              <div>
                {loadingProjects ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#8B0000]" />
                  </div>
                ) : projects.ongoing.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-royal-lg p-12 text-center border border-[#8B0000]/10">
                    <Briefcase className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold font-montserrat text-[#2C1810] mb-3">No Ongoing Projects</h3>
                    <p className="text-gray-600">Accept a pending invite to start working on projects</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {projects.ongoing.map(project => renderProjectCard(project))}
                  </div>
                )}
              </div>
            )}

            {/* Completed Projects Tab */}
            {activeTab === 'completed' && (
              <div>
                {loadingProjects ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#8B0000]" />
                  </div>
                ) : projects.completed.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-royal-lg p-12 text-center border border-[#8B0000]/10">
                    <CheckCircle className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold font-montserrat text-[#2C1810] mb-3">No Completed Projects</h3>
                    <p className="text-gray-600">Your completed projects will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {projects.completed.map(project => renderProjectCard(project))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
