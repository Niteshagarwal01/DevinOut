'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Send, Bot, User, Loader2, Sparkles, LogOut, ChevronDown, FolderOpen, Clock, DollarSign, FileText, ArrowRight, Crown, Award, MessageCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Project {
  _id: string;
  websiteType: string;
  designComplexity: string;
  features: string[];
  numPages: number;
  timeline: string;
  budgetRange: string;
  status: 'chatting' | 'team_presented' | 'awaiting_acceptance' | 'team_accepted' | 'team_selected';
  selectedTeamType?: 'premium' | 'pro' | 'freemium';
  chatRoomId?: string;
  createdAt: string;
  updatedAt: string;
  selectedTeam?: {
    designerAccepted?: boolean;
    developerAccepted?: boolean;
    designerRejected?: boolean;
    developerRejected?: boolean;
  };
}

export default function BusinessDashboard() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'new' | 'projects'>('new');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome! I'm your AI project concierge. Let's create something extraordinary together.\n\nWhat type of website are you envisioning?\n\nExamples: e-commerce, portfolio, blog, business website, landing page, SaaS platform"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'projects') {
      fetchProjects();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch('/api/projects/my-projects');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages, projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

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
        content: 'My apologies, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      chatting: { label: 'Planning', color: 'bg-[#FFF8DC] text-[#8B0000] border border-[#8B0000]/20' },
      team_presented: { label: 'Teams Ready', color: 'bg-[#8B0000]/10 text-[#8B0000] border border-[#8B0000]/30' },
      awaiting_acceptance: { label: 'Awaiting Response', color: 'bg-[#FFD700]/20 text-[#8B0000] border border-[#D4AF37]' },
      team_accepted: { label: 'Team Ready', color: 'bg-green-100 text-green-700 border border-green-300' },
      team_selected: { label: 'Active', color: 'bg-gradient-to-r from-[#8B0000] to-[#DC143C] text-white' },
      in_progress: { label: 'In Progress', color: 'bg-[#D4AF37]/20 text-[#8B0000] border border-[#D4AF37]' },
      completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700 border border-gray-300' }
    };
    const badge = badges[status as keyof typeof badges] || badges.chatting;
    return <span className={`px-4 py-1.5 rounded-full text-xs font-bold font-montserrat ${badge.color}`}>{badge.label}</span>;
  };

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
                <p className="text-sm text-gray-600">Premium Team Matching</p>
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

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-6 py-3 rounded-xl font-bold font-montserrat transition-all ${
                activeTab === 'new'
                  ? 'bg-royal-gradient text-white shadow-royal'
                  : 'bg-white text-gray-700 hover:bg-cream-light border border-[#8B0000]/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                New Project
              </div>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-6 py-3 rounded-xl font-bold font-montserrat transition-all ${
                activeTab === 'projects'
                  ? 'bg-royal-gradient text-white shadow-royal'
                  : 'bg-white text-gray-700 hover:bg-cream-light border border-[#8B0000]/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                My Projects ({projects.length})
              </div>
            </button>
          </div>

          {/* New Project Tab */}
          {activeTab === 'new' && (
            <>
              {/* Chat Header */}
              <div className="bg-royal-gradient rounded-t-2xl p-6 lg:p-8 text-white shadow-royal">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold font-montserrat">AI Project Concierge</h2>
                    <p className="text-white/90">Describe your vision and I'll curate the perfect team</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="bg-white rounded-b-2xl shadow-royal-lg border border-[#8B0000]/10">
                <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                        message.role === 'user'
                          ? 'bg-royal-gradient text-white'
                          : 'bg-cream-light text-[#8B0000]'
                      }`}>
                        {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>

                      <div className={`max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-royal-gradient text-white'
                          : 'bg-cream-light text-gray-800 border border-[#8B0000]/10'
                      } rounded-2xl px-5 py-3 shadow-sm`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-cream-light flex items-center justify-center text-[#8B0000]">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="bg-cream-light rounded-2xl px-5 py-3 border border-[#8B0000]/10">
                        <Loader2 className="w-5 h-5 animate-spin text-[#8B0000]" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-[#8B0000]/10 p-4 lg:p-6 bg-cream-light/30">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Share your project vision..."
                      disabled={loading}
                      className="flex-1 px-5 py-3 border-2 border-gray-200 focus:border-[#8B0000] rounded-xl focus:ring-2 focus:ring-[#8B0000]/20 focus:outline-none disabled:opacity-50 transition"
                    />
                    <button
                      onClick={handleSend}
                      disabled={loading || !input.trim()}
                      className="px-6 py-3 bg-royal-gradient text-white rounded-xl font-bold shadow-royal hover:shadow-royal-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>

                  {showCreateTeam && projectId && (
                    <div className="mt-4">
                      <button
                        onClick={() => router.push(`/dashboard/business/teams/${projectId}`)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#2C1810] rounded-xl font-bold font-montserrat shadow-royal-lg hover:shadow-royal transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 text-lg"
                      >
                        <Award className="w-6 h-6" />
                        View Your Curated Teams
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className="mt-8 bg-white border-2 border-[#8B0000]/20 rounded-2xl p-6 lg:p-8 shadow-md">
                <h3 className="text-lg lg:text-xl font-bold font-montserrat text-[#2C1810] mb-4 flex items-center gap-2">
                  <Crown className="w-6 h-6 text-[#D4AF37]" />
                  The Premium Experience
                </h3>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-[#8B0000] font-montserrat">1.</span>
                    <span>Share your project vision with our AI concierge</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#8B0000] font-montserrat">2.</span>
                    <span>Receive instant estimates and expert recommendations</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#8B0000] font-montserrat">3.</span>
                    <span>Review 3 bespoke teams (Premium, Pro, Freemium)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#8B0000] font-montserrat">4.</span>
                    <span>Select your team and begin your journey to excellence</span>
                  </li>
                </ol>
              </div>
            </>
          )}

          {/* My Projects Tab */}
          {activeTab === 'projects' && (
            <div>
              {loadingProjects ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-[#8B0000]" />
                </div>
              ) : projects.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-royal-lg p-12 text-center border border-[#8B0000]/10">
                  <FolderOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold font-montserrat text-[#2C1810] mb-3">No Projects Yet</h3>
                  <p className="text-gray-600 mb-8">Begin your journey by creating your first project</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="px-8 py-4 bg-royal-gradient text-white rounded-xl font-bold font-montserrat shadow-royal hover:shadow-royal-lg transition-all transform hover:-translate-y-1"
                  >
                    Create New Project
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {projects.map((project) => (
                    <div key={project._id} className="bg-white rounded-2xl shadow-royal hover:shadow-royal-lg transition-all p-6 lg:p-8 border border-[#8B0000]/10">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-xl lg:text-2xl font-bold font-montserrat text-[#2C1810] capitalize">
                              {project.websiteType ? `${project.websiteType} Website` : 'Project'}
                            </h3>
                            {getStatusBadge(project.status)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Created {new Date(project.createdAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (project.chatRoomId) {
                              // Chat room exists - open it
                              router.push(`/chat/${project.chatRoomId}`);
                            } else {
                              // Go to teams page
                              router.push(`/dashboard/business/teams/${project._id}`);
                            }
                          }}
                          className="px-6 py-3 bg-royal-gradient text-white rounded-xl font-bold shadow-royal hover:shadow-royal-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                        >
                          {project.chatRoomId ? (
                            <>
                              <MessageCircle className="w-5 h-5" />
                              Open Chat
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-5 h-5" />
                              View Details
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                        {project.designComplexity && (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#8B0000]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-semibold mb-1">Design Style</p>
                              <p className="font-bold text-gray-900 capitalize">{project.designComplexity}</p>
                            </div>
                          </div>
                        )}
                        {project.numPages > 0 && (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#DC143C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-[#DC143C]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-semibold mb-1">Pages</p>
                              <p className="font-bold text-gray-900">{project.numPages} pages</p>
                            </div>
                          </div>
                        )}
                        {project.timeline && (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Clock className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-semibold mb-1">Timeline</p>
                              <p className="font-bold text-gray-900">{project.timeline}</p>
                            </div>
                          </div>
                        )}
                        {project.budgetRange && (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#FFD700]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-5 h-5 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-semibold mb-1">Budget</p>
                              <p className="font-bold text-gray-900">{project.budgetRange}</p>
                            </div>
                          </div>
                        )}
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
                          <p className="text-xs text-gray-500 font-semibold mb-2">Selected Team</p>
                          <span className="inline-flex items-center gap-2 px-5 py-2 bg-royal-gradient text-white rounded-lg font-bold font-montserrat uppercase shadow-md">
                            <Award className="w-4 h-4" />
                            {project.selectedTeamType}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
