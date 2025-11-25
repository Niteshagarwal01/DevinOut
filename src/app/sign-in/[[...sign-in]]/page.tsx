import { SignIn } from '@clerk/nextjs';
import { Crown } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark flex flex-col items-center justify-center p-4 gap-6">
      <Link href="/" className="inline-flex items-center gap-2 group">
        <Crown className="w-8 h-8 text-[#8B0000] group-hover:text-[#DC143C] transition-colors" />
        <span className="text-3xl font-bold font-montserrat text-royal-gradient">
          DevinOut
        </span>
      </Link>

      <SignIn
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
        signUpUrl="/sign-up"
        afterSignInUrl="/onboarding"
      />
    </div>
  );
}
