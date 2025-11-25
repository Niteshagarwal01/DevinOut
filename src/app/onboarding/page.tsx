'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    // Check if user has role in metadata
    const role = user?.unsafeMetadata?.role as string;
    
    if (role && ['business', 'freelancer'].includes(role)) {
      // Automatically save to database and redirect
      saveRole(role);
    } else {
      // No role found, redirect back to signup
      router.push('/sign-up');
    }
  }, [isLoaded, user]);

  const saveRole = async (role: string) => {
    if (saving) return;
    setSaving(true);

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (response.ok && data.redirectTo) {
        router.push(data.redirectTo);
      } else {
        console.error('Failed to save role:', data.error);
        router.push('/sign-up');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      router.push('/sign-up');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Setting up your account...</h2>
        <p className="text-gray-600 mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}
