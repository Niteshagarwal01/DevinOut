import Link from 'next/link';
import { Crown, Target, Eye, Heart, Users, Award, Zap, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark font-poppins">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#8B0000]/20 rounded-full text-[#8B0000] text-sm font-semibold mb-6 shadow-sm">
            <Crown className="w-4 h-4" />
            Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-montserrat text-[#2C1810] mb-6 leading-tight">
            Redefining
            <span className="block mt-2 text-royal-gradient">
              Freelance Collaboration
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-gray-700 leading-relaxed">
            DevinOut is a premium AI-powered platform that connects visionary businesses with elite design and development talent. We believe in the power of perfect partnerships.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Mission */}
          <div className="bg-white rounded-2xl p-8 shadow-royal hover:shadow-royal-lg transition-all duration-300 border border-[#8B0000]/10">
            <div className="w-16 h-16 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold font-montserrat text-[#2C1810] mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To revolutionize freelancing by leveraging AI to create perfectly matched designer-developer teams, ensuring every project achieves excellence.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-2xl p-8 shadow-royal hover:shadow-royal-lg transition-all duration-300 border border-[#8B0000]/10">
            <div className="w-16 h-16 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold font-montserrat text-[#2C1810] mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To become the global standard for premium freelance collaboration, where quality, speed, and perfect team chemistry are guaranteed.
            </p>
          </div>

          {/* Values */}
          <div className="bg-white rounded-2xl p-8 shadow-royal hover:shadow-royal-lg transition-all duration-300 border border-[#8B0000]/10">
            <div className="w-16 h-16 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold font-montserrat text-[#2C1810] mb-4">Our Values</h2>
            <p className="text-gray-700 leading-relaxed">
              Excellence, innovation, transparency, and human connection. We believe technology should enhance, not replace, the creative human spirit.
            </p>
          </div>
        </div>
      </section>

      {/* How We're Different */}
      <section className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-montserrat text-center text-[#2C1810] mb-12 lg:mb-16">
            The DevinOut Difference
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-md hover:shadow-royal transition-all duration-300 border border-[#8B0000]/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-montserrat text-[#2C1810] mb-2">AI-Powered Matching</h3>
                  <p className="text-gray-700">
                    Our proprietary algorithm analyzes project requirements, skill sets, and working styles to create teams with unmatched chemistry.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-md hover:shadow-royal transition-all duration-300 border border-[#8B0000]/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-montserrat text-[#2C1810] mb-2">Perfect Pairs</h3>
                  <p className="text-gray-700">
                    Every team consists of one designer and one developer—the ideal combination for modern digital projects.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-md hover:shadow-royal transition-all duration-300 border border-[#8B0000]/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-montserrat text-[#2C1810] mb-2">Vetted Talent</h3>
                  <p className="text-gray-700">
                    All freelancers undergo rigorous screening. Only the top 10% join our exclusive network of elite professionals.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-md hover:shadow-royal transition-all duration-300 border border-[#8B0000]/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-montserrat text-[#2C1810] mb-2">Quality Guarantee</h3>
                  <p className="text-gray-700">
                    We stand behind every project with milestone tracking, secure payments, and dedicated support throughout your journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        <div className="bg-royal-gradient rounded-3xl p-8 lg:p-16 text-white max-w-6xl mx-auto shadow-royal-lg">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-montserrat text-center mb-12 lg:mb-16">
            DevinOut By The Numbers
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold font-montserrat mb-2">500+</div>
              <div className="text-lg opacity-90">Elite Freelancers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold font-montserrat mb-2">1,000+</div>
              <div className="text-lg opacity-90">Projects Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold font-montserrat mb-2">98%</div>
              <div className="text-lg opacity-90">Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold font-montserrat mb-2">24/7</div>
              <div className="text-lg opacity-90">Premium Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#8B0000]/20 rounded-full text-[#8B0000] text-sm font-semibold mb-6 shadow-sm">
              <Users className="w-4 h-4" />
              Our Leadership
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-montserrat text-[#2C1810] mb-4">
              Meet the Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The visionaries behind DevinOut, dedicated to revolutionizing the freelance industry
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Team Member 1 - Shruti Bhargav */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-royal hover:shadow-royal-lg transition-all duration-300 hover:-translate-y-1 border border-[#8B0000]/10 text-center">
              <div className="w-24 h-24 lg:w-28 lg:h-28 mx-auto mb-4 rounded-full overflow-hidden shadow-royal">
                <img 
                  src="/Shruti Bhargav.png" 
                  alt="Shruti Bhargav"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold font-montserrat text-[#2C1810] mb-1">
                Shruti Bhargav
              </h3>
              <p className="text-xs text-gray-500 mb-2">Enroll: 07115602722</p>
              <p className="text-sm text-[#8B0000] font-semibold mb-3">Frontend & Design</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Crafting beautiful and intuitive user interfaces with expertise in modern frontend technologies.
              </p>
            </div>

            {/* Team Member 2 - Navodya Jain */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-royal hover:shadow-royal-lg transition-all duration-300 hover:-translate-y-1 border border-[#8B0000]/10 text-center">
              <div className="w-24 h-24 lg:w-28 lg:h-28 mx-auto mb-4 rounded-full overflow-hidden shadow-royal">
                <img 
                  src="/Navodyajain.png" 
                  alt="Navodya Jain"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold font-montserrat text-[#2C1810] mb-1">
                Navodya Jain
              </h3>
              <p className="text-xs text-gray-500 mb-2">Enroll: 09815602722</p>
              <p className="text-sm text-[#8B0000] font-semibold mb-3">Product Management & Research</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Leading product strategy and conducting in-depth research to drive innovation and user satisfaction.
              </p>
            </div>

            {/* Team Member 3 - Simoni Jain */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-royal hover:shadow-royal-lg transition-all duration-300 hover:-translate-y-1 border border-[#8B0000]/10 text-center">
              <div className="w-24 h-24 lg:w-28 lg:h-28 mx-auto mb-4 rounded-full overflow-hidden shadow-royal">
                <img 
                  src="/Simoni Jain.png" 
                  alt="Simoni Jain"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold font-montserrat text-[#2C1810] mb-1">
                Simoni Jain
              </h3>
              <p className="text-xs text-gray-500 mb-2">Enroll: 06615602722</p>
              <p className="text-sm text-[#8B0000] font-semibold mb-3">Frontend & Design</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Creating seamless user experiences with a keen eye for design aesthetics and functionality.
              </p>
            </div>

            {/* Team Member 4 - Mohd Nebeel */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-royal hover:shadow-royal-lg transition-all duration-300 hover:-translate-y-1 border border-[#8B0000]/10 text-center">
              <div className="w-24 h-24 lg:w-28 lg:h-28 mx-auto mb-4 rounded-full overflow-hidden shadow-royal">
                <img 
                  src="/Mohd Nebeel .png" 
                  alt="Mohd Nebeel"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold font-montserrat text-[#2C1810] mb-1">
                Mohd Nebeel
              </h3>
              <p className="text-xs text-gray-500 mb-2">Enroll: 08715602722</p>
              <p className="text-sm text-[#8B0000] font-semibold mb-3">Backend Development</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Building robust and scalable backend systems that power seamless digital experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-montserrat text-[#2C1810] mb-6">
            Ready to Experience Excellence?
          </h2>
          <p className="text-lg lg:text-xl text-gray-700 mb-8">
            Join the community of visionaries building extraordinary projects
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="px-8 lg:px-10 py-4 lg:py-5 bg-royal-gradient text-white rounded-xl font-bold shadow-royal hover:shadow-royal-lg transition-all duration-300 transform hover:-translate-y-1 text-base lg:text-lg"
            >
              Start Your Project
            </Link>
            <Link
              href="/sign-up?type=freelancer"
              className="px-8 lg:px-10 py-4 lg:py-5 bg-white text-[#8B0000] rounded-xl font-bold border-2 border-[#8B0000] hover:bg-[#8B0000] hover:text-white transition-all duration-300 shadow-md text-base lg:text-lg"
            >
              Join as Freelancer
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
