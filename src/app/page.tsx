import Link from 'next/link';
import { ArrowRight, Users, Sparkles, Zap, CheckCircle, Crown, Shield, Award } from 'lucide-react';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function Home() {
  const user = await currentUser();
  
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
    <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark font-poppins">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 lg:px-8 py-12 lg:py-20 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#8B0000]/20 rounded-full text-[#8B0000] text-sm font-semibold mb-6 lg:mb-8 shadow-sm">
            <Sparkles className="w-4 h-4" />
            AI-Powered Premium Matching
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-montserrat text-[#2C1810] mb-6 lg:mb-8 leading-tight">
            Find Your Perfect
            <span className="block mt-2 text-royal-gradient">
              Designer + Developer
            </span>
            Team
          </h1>
          
          <p className="text-lg lg:text-xl text-gray-700 mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience luxury in freelancing. Our AI creates bespoke teams—one elite designer, one expert developer—perfectly matched to your vision.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center">
            <Link
              href="/sign-up"
              className="px-8 lg:px-10 py-4 lg:py-5 bg-royal-gradient text-white rounded-xl font-bold shadow-royal hover:shadow-royal-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 text-base lg:text-lg"
            >
              Start Your Project
              <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </Link>
            <Link
              href="/sign-up?type=freelancer"
              className="px-8 lg:px-10 py-4 lg:py-5 bg-white text-[#8B0000] rounded-xl font-bold border-2 border-[#8B0000] hover:bg-[#8B0000] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-md text-base lg:text-lg"
            >
              Join as Freelancer
              <Users className="w-5 h-5 lg:w-6 lg:h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-montserrat text-center text-[#2C1810] mb-12 lg:mb-20">
          The Royal Experience
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-royal hover:shadow-royal-lg transition-all duration-300 hover:-translate-y-1 border border-[#8B0000]/10">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-xl flex items-center justify-center mb-5 lg:mb-6 shadow-lg">
              <Sparkles className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold font-montserrat text-[#2C1810] mb-3 lg:mb-4">AI Chat Concierge</h3>
            <p className="text-gray-700 leading-relaxed">
              Sophisticated AI understands your vision. Provides instant estimates with premium accuracy.
            </p>
          </div>

          <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-royal hover:shadow-royal-lg transition-all duration-300 hover:-translate-y-1 border border-[#8B0000]/10">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-xl flex items-center justify-center mb-5 lg:mb-6 shadow-lg">
              <Zap className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold font-montserrat text-[#2C1810] mb-3 lg:mb-4">Bespoke Team Creation</h3>
            <p className="text-gray-700 leading-relaxed">
              Three curated tiers—Premium, Pro, and Freemium. Each team handpicked by our intelligent algorithm.
            </p>
          </div>

          <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-royal hover:shadow-royal-lg transition-all duration-300 hover:-translate-y-1 border border-[#8B0000]/10 sm:col-span-2 lg:col-span-1">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-xl flex items-center justify-center mb-5 lg:mb-6 shadow-lg">
              <CheckCircle className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold font-montserrat text-[#2C1810] mb-3 lg:mb-4">Elite Collaboration</h3>
            <p className="text-gray-700 leading-relaxed">
              Seamless 3-way communication. Premium workspace for your vision to flourish.
            </p>
          </div>
        </div>
      </section>

      {/* Premium Benefits */}
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-royal-lg border-2 border-[#D4AF37]/30">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="w-8 h-8 lg:w-10 lg:h-10 text-[#D4AF37]" />
              <h3 className="text-2xl lg:text-3xl font-bold font-montserrat text-[#2C1810]">Premium Advantages</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
              {[
                'Verified Elite Freelancers',
                'AI-Powered Smart Matching',
                'Real-Time Collaboration',
                'Secure Payment Integration',
                'Quality Assurance Guarantee',
                'Priority Support'
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-cream-light border border-[#8B0000]/10">
                  <Award className="w-5 h-5 lg:w-6 lg:h-6 text-[#8B0000] flex-shrink-0" />
                  <span className="font-semibold text-gray-800">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="bg-royal-gradient rounded-3xl p-8 lg:p-16 text-center text-white max-w-5xl mx-auto shadow-royal-lg">
          <Crown className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-6 lg:mb-8" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-montserrat mb-4 lg:mb-6 leading-tight">
            Ready to Build Your Legacy?
          </h2>
          <p className="text-lg lg:text-xl opacity-95 mb-8 lg:mb-10 max-w-2xl mx-auto leading-relaxed">
            Join an exclusive community of visionaries creating extraordinary digital experiences
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-3 px-10 lg:px-12 py-4 lg:py-5 bg-white text-[#8B0000] rounded-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-base lg:text-lg"
          >
            Begin Your Journey
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
