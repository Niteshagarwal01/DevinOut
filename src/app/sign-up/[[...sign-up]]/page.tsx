'use client';

import { SignUp } from '@clerk/nextjs';
import { useState } from 'react';
import { Building2, Users, ArrowRight, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') as 'business' | 'freelancer' | null;
  const [selectedType, setSelectedType] = useState<'business' | 'freelancer' | null>(initialType);

  if (selectedType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark flex flex-col items-center justify-center p-4 gap-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <Crown className="w-8 h-8 text-[#8B0000] group-hover:text-[#DC143C] transition-colors" />
          <span className="text-3xl font-bold font-montserrat text-royal-gradient">
            DevinOut
          </span>
        </Link>

        <SignUp
          appearance={{
            elements: {
              rootBox: 'w-full flex justify-center',
              card: 'bg-white shadow-royal-lg rounded-2xl border border-[#8B0000]/10',
              headerTitle: 'text-2xl font-bold font-montserrat text-[#2C1810]',
              headerSubtitle: 'text-gray-600 text-sm',
              socialButtonsBlockButton: 'bg-white border-2 border-gray-200 hover:border-[#8B0000] text-gray-700 hover:text-[#8B0000] transition-all',
              formButtonPrimary: 'bg-royal-gradient hover:shadow-royal-lg transition-all',
              formFieldInput: 'border-2 border-gray-200 focus:border-[#8B0000] rounded-lg',
              footerActionLink: 'text-[#8B0000] hover:text-[#DC143C]',
              identityPreviewText: 'font-poppins',
              formFieldLabel: 'text-gray-700 font-semibold',
            },
            layout: {
              socialButtonsPlacement: 'top',
              socialButtonsVariant: 'blockButton',
            },
          }}
          signInUrl="/sign-in"
          afterSignUpUrl="/onboarding"
          unsafeMetadata={{
            role: selectedType,
          }}
        />

        <button
          onClick={() => setSelectedType(null)}
          className="text-[#8B0000] hover:text-[#DC143C] font-semibold transition-colors"
        >
          ← Change account type
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <Crown className="w-10 h-10 text-[#8B0000] group-hover:text-[#DC143C] transition-colors" />
            <span className="text-4xl font-bold font-montserrat text-royal-gradient">
              DevinOut
            </span>
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-montserrat text-[#2C1810] mb-4">
            Choose Your Path
          </h1>
          <p className="text-lg text-gray-700">
            Select how you'd like to experience DevinOut
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Business Card */}
          <div
            onClick={() => setSelectedType('business')}
            className="group cursor-pointer transition-all duration-300 hover:scale-105"
          >
            <div className="relative bg-white rounded-3xl p-8 lg:p-10 shadow-royal hover:shadow-royal-lg transition-all border-2 border-[#8B0000]/20 hover:border-[#8B0000]">
              <div className="w-20 h-20 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold font-montserrat text-[#2C1810] mb-4">
                I'm a Business
              </h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Launch your project and get matched with elite designer + developer teams curated by our AI
              </p>
              
              <ul className="space-y-3 mb-8">
                {[
                  'AI-powered team matching',
                  'Premium talent selection',
                  'Real-time collaboration',
                  'Secure payment system',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-700">
                    <div className="w-5 h-5 bg-[#8B0000]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-[#8B0000]" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="flex items-center justify-between text-[#8B0000] font-bold group-hover:text-[#DC143C] transition-colors">
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>

          {/* Freelancer Card */}
          <div
            onClick={() => setSelectedType('freelancer')}
            className="group cursor-pointer transition-all duration-300 hover:scale-105"
          >
            <div className="relative bg-white rounded-3xl p-8 lg:p-10 shadow-royal hover:shadow-royal-lg transition-all border-2 border-[#8B0000]/20 hover:border-[#8B0000]">
              <div className="w-20 h-20 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold font-montserrat text-[#2C1810] mb-4">
                I'm a Freelancer
              </h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Join our exclusive network and get matched with high-quality projects that fit your expertise
              </p>
              
              <ul className="space-y-3 mb-8">
                {[
                  'Curated premium projects',
                  'Perfect partner matching',
                  'Competitive compensation',
                  'Professional community',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-700">
                    <div className="w-5 h-5 bg-[#8B0000]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-[#8B0000]" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="flex items-center justify-between text-[#8B0000] font-bold group-hover:text-[#DC143C] transition-colors">
                <span>Join Network</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-[#8B0000] hover:text-[#DC143C] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}