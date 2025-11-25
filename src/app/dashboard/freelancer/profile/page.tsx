'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Sparkles, Crown, Palette, Code } from 'lucide-react';

const designSkills = [
  'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',
  'Wireframing', 'Prototyping', 'Branding', 'Logo Design', 'Web Design', 'Mobile Design'
];

const developerSkills = [
  'React', 'Next.js', 'Node.js', 'TypeScript', 'JavaScript', 'Python',
  'MongoDB', 'PostgreSQL', 'Express.js', 'Tailwind CSS', 'HTML/CSS', 'Git'
];

export default function FreelancerProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
  }, []);

  const [formData, setFormData] = useState({
    freelancerType: '',
    skills: [] as string[],
    experienceLevel: '',
    portfolioLink: '',
    toolsUsed: [] as string[],
    hourlyRate: '',
    bio: '',
  });

  const availableSkills = formData.freelancerType === 'designer' ? designSkills : developerSkills;

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/freelancer/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    <div className="min-h-screen bg-gradient-to-br from-cream-light via-cream to-cream-dark py-12 px-4 font-poppins">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-royal-lg p-8 border border-[#8B0000]/10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-[#8B0000]" />
              <h1 className="text-3xl font-bold font-montserrat text-royal-gradient">
                Complete Your Freelancer Profile
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Tell us about yourself so we can match you with perfect projects
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Freelancer Type */}
            <div>
              <label className="block text-sm font-bold text-[#2C1810] mb-3">
                I am a *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, freelancerType: 'designer', skills: [] })}
                  className={`p-6 border-3 rounded-xl font-bold font-montserrat transition-all transform hover:-translate-y-1 ${
                    formData.freelancerType === 'designer'
                      ? 'border-[#8B0000] bg-royal-gradient text-white shadow-royal-lg'
                      : 'border-[#8B0000]/20 bg-white hover:border-[#8B0000] hover:shadow-royal'
                  }`}
                >
                  <Palette className="w-8 h-8 mx-auto mb-2" />
                  Designer
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, freelancerType: 'developer', skills: [] })}
                  className={`p-6 border-3 rounded-xl font-bold font-montserrat transition-all transform hover:-translate-y-1 ${
                    formData.freelancerType === 'developer'
                      ? 'border-[#8B0000] bg-royal-gradient text-white shadow-royal-lg'
                      : 'border-[#8B0000]/20 bg-white hover:border-[#8B0000] hover:shadow-royal'
                  }`}
                >
                  <Code className="w-8 h-8 mx-auto mb-2" />
                  Developer
                </button>
              </div>
            </div>

            {/* Skills */}
            {formData.freelancerType && (
              <div>
                <label className="block text-sm font-bold text-[#2C1810] mb-3">
                  Your Skills * (Select at least 3)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSkills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all transform hover:-translate-y-0.5 ${
                        formData.skills.includes(skill)
                          ? 'bg-royal-gradient text-white shadow-royal'
                          : 'bg-[#FFF8DC] text-[#8B0000] border-2 border-[#8B0000]/20 hover:border-[#8B0000] hover:shadow-md'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-3 font-semibold">
                  Selected: {formData.skills.length} skills
                </p>
              </div>
            )}

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-bold text-[#2C1810] mb-3">
                Experience Level *
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['junior', 'mid', 'senior'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, experienceLevel: level })}
                    className={`p-4 border-3 rounded-xl font-bold font-montserrat capitalize transition-all transform hover:-translate-y-1 ${
                      formData.experienceLevel === level
                        ? 'border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#2C1810] shadow-royal-lg'
                        : 'border-[#8B0000]/20 bg-white hover:border-[#8B0000] hover:shadow-royal'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio Link */}
            <div>
              <label className="block text-sm font-bold text-[#2C1810] mb-3">
                Portfolio Link (Optional)
              </label>
              <input
                type="url"
                value={formData.portfolioLink}
                onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })}
                placeholder="https://yourportfolio.com"
                className="w-full px-4 py-3 border-2 border-[#8B0000]/20 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] transition"
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-bold text-[#2C1810] mb-3">
                Hourly Rate (₹) (Optional)
              </label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="500"
                min="0"
                className="w-full px-4 py-3 border-2 border-[#8B0000]/20 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] transition"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-bold text-[#2C1810] mb-3">
                Bio (Optional)
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border-2 border-[#8B0000]/20 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] transition"
              />
              <p className="text-sm text-gray-600 mt-2 font-semibold">
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !formData.freelancerType || formData.skills.length < 3 || !formData.experienceLevel}
                className="w-full px-8 py-5 bg-royal-gradient text-white rounded-xl font-bold font-montserrat text-lg hover:shadow-royal-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-royal flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Crown className="w-6 h-6 animate-pulse" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Create Profile & Continue
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
