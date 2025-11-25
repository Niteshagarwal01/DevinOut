'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  Send, Loader2, ArrowLeft, Crown, User, Sparkles, 
  CheckCircle, MessageCircle 
} from 'lucide-react';

interface Message {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface Participant {
  userId: string;
  clerkId: string;
  role: 'business' | 'designer' | 'developer';
  name: string;
}

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatRoomId = params.chatRoomId as string;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [chatRoomId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${chatRoomId}/messages`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
        setParticipants(data.participants || []);
      } else if (response.status === 404) {
        alert('Chat room not found. Redirecting to dashboard...');
        router.push('/dashboard/business');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    const messageText = input.trim();
    setInput('');

    try {
      const response = await fetch(`/api/chat/${chatRoomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      if (data.success) {
        // Immediately add the message to UI
        setMessages([...messages, data.message]);
      } else {
        alert(data.error || 'Failed to send message');
        setInput(messageText); // Restore input
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      setInput(messageText); // Restore input
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'business':
        return <Crown className="w-4 h-4" />;
      case 'designer':
        return <Sparkles className="w-4 h-4" />;
      case 'developer':
        return <Crown className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'business':
        return 'bg-gradient-to-r from-[#8B0000] to-[#DC143C] text-white';
      case 'designer':
        return 'bg-[#8B0000]/10 text-[#8B0000] border border-[#8B0000]/20';
      case 'developer':
        return 'bg-[#D4AF37]/20 text-[#8B0000] border border-[#D4AF37]';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#8B0000] mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark font-poppins flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#8B0000]/10 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-cream-light rounded-lg transition"
              >
                <ArrowLeft className="w-6 h-6 text-[#8B0000]" />
              </button>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-[#8B0000]" />
                <div>
                  <h1 className="text-xl font-bold font-montserrat text-[#2C1810]">
                    Project Chat
                  </h1>
                  <p className="text-xs text-gray-600">
                    {participants.length} participants
                  </p>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-2">
              {participants.map((participant, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 ${getRoleBadgeColor(participant.role)}`}
                >
                  {getRoleIcon(participant.role)}
                  <span className="capitalize hidden sm:inline">{participant.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold font-montserrat text-[#2C1810] mb-2">
                No messages yet
              </h3>
              <p className="text-gray-600">
                Start the conversation by sending a message below
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = participants.find(p => p.clerkId === user?.id)?.name === msg.senderName;
              const sender = participants.find(p => p.name === msg.senderName);

              return (
                <div
                  key={index}
                  className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                    isMe 
                      ? 'bg-royal-gradient text-white' 
                      : sender?.role === 'designer'
                      ? 'bg-[#8B0000]/10 text-[#8B0000]'
                      : 'bg-[#D4AF37]/20 text-[#8B0000]'
                  }`}>
                    {getRoleIcon(sender?.role || 'user')}
                  </div>

                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${isMe ? 'text-[#8B0000]' : 'text-gray-700'}`}>
                        {msg.senderName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isMe
                        ? 'bg-royal-gradient text-white'
                        : 'bg-white text-gray-800 border border-[#8B0000]/10'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-[#8B0000]/10 p-4 lg:p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 px-4 py-3 border-2 border-gray-200 focus:border-[#8B0000] rounded-xl focus:ring-2 focus:ring-[#8B0000]/20 focus:outline-none disabled:opacity-50 transition"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="px-6 py-3 bg-royal-gradient text-white rounded-xl font-bold shadow-royal hover:shadow-royal-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
