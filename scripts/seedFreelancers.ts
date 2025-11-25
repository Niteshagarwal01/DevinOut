import mongoose from 'mongoose';
import User from '../src/models/User';
import FreelancerProfile from '../src/models/FreelancerProfile';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://musicniteshagarwal_db_user:jUnS8WQp33RCWrKa@cluster0.pzygozk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const freelancers = [
  {
    email: 'musicniteshagarwal@gmail.com',
    name: 'Nitesh Agarwal',
    freelancerType: 'designer',
    experienceLevel: 'senior',
    skills: ['Figma', 'Adobe XD', 'UI/UX Design', 'Prototyping', 'Wireframing'],
    hourlyRate: 1500,
    bio: 'Senior UI/UX Designer with 5+ years of experience creating beautiful, user-friendly interfaces for web and mobile applications.',
    portfolioLink: 'https://behance.net/niteshagarwal',
    rating: 4.8,
    completedProjects: 45,
    availabilityStatus: true
  },
  {
    email: 'officalnitesh@gmail.com',
    name: 'Nitesh Kumar',
    freelancerType: 'developer',
    experienceLevel: 'senior',
    skills: ['React', 'Next.js', 'Node.js', 'TypeScript', 'MongoDB', 'Tailwind CSS'],
    hourlyRate: 1800,
    bio: 'Full-stack developer specializing in modern web applications. Expert in React, Next.js, and building scalable solutions.',
    portfolioLink: 'https://github.com/niteshkumar',
    rating: 4.9,
    completedProjects: 52,
    availabilityStatus: true
  },
  {
    email: 'restfree.in@gmail.com',
    name: 'Raj Sharma',
    freelancerType: 'designer',
    experienceLevel: 'mid',
    skills: ['Illustrator', 'Photoshop', 'Branding', 'Logo Design', 'UI Design'],
    hourlyRate: 1000,
    bio: 'Creative designer focused on branding and visual identity. Love bringing ideas to life through clean, modern designs.',
    portfolioLink: 'https://dribbble.com/rajsharma',
    rating: 4.5,
    completedProjects: 28,
    availabilityStatus: true
  },
  {
    email: 'hackthonwinner001@gmail.com',
    name: 'Arjun Patel',
    freelancerType: 'developer',
    experienceLevel: 'mid',
    skills: ['JavaScript', 'React', 'Python', 'Django', 'PostgreSQL', 'AWS'],
    hourlyRate: 1200,
    bio: 'Award-winning hackathon developer with expertise in building MVPs quickly. Passionate about clean code and scalable architecture.',
    portfolioLink: 'https://github.com/arjunpatel',
    rating: 4.6,
    completedProjects: 31,
    availabilityStatus: true
  }
];

async function seedFreelancers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const freelancer of freelancers) {
      // Create or find user
      let user = await User.findOne({ email: freelancer.email });
      
      if (!user) {
        user = await User.create({
          clerkId: `seed_${freelancer.email.split('@')[0]}`,
          email: freelancer.email,
          name: freelancer.name,
          role: 'freelancer'
        });
        console.log(`✅ Created user: ${freelancer.name}`);
      } else {
        console.log(`ℹ️  User already exists: ${freelancer.name}`);
      }

      // Create or update freelancer profile
      const existingProfile = await FreelancerProfile.findOne({ userId: user._id });
      
      if (!existingProfile) {
        await FreelancerProfile.create({
          userId: user._id,
          clerkId: user.clerkId,
          freelancerType: freelancer.freelancerType,
          experienceLevel: freelancer.experienceLevel,
          skills: freelancer.skills,
          hourlyRate: freelancer.hourlyRate,
          bio: freelancer.bio,
          portfolioLink: freelancer.portfolioLink,
          rating: freelancer.rating,
          completedProjects: freelancer.completedProjects,
          availabilityStatus: freelancer.availabilityStatus,
          toolsUsed: freelancer.skills
        });
        console.log(`✅ Created profile for: ${freelancer.name} (${freelancer.freelancerType})`);
      } else {
        await FreelancerProfile.findOneAndUpdate(
          { userId: user._id },
          {
            freelancerType: freelancer.freelancerType,
            experienceLevel: freelancer.experienceLevel,
            skills: freelancer.skills,
            hourlyRate: freelancer.hourlyRate,
            bio: freelancer.bio,
            portfolioLink: freelancer.portfolioLink,
            rating: freelancer.rating,
            completedProjects: freelancer.completedProjects,
            availabilityStatus: freelancer.availabilityStatus,
            toolsUsed: freelancer.skills
          }
        );
        console.log(`✅ Updated profile for: ${freelancer.name}`);
      }
    }

    console.log('\n🎉 All freelancers seeded successfully!');
    console.log('\nCreated:');
    console.log('- 2 Designers: Nitesh Agarwal (Senior), Raj Sharma (Mid)');
    console.log('- 2 Developers: Nitesh Kumar (Senior), Arjun Patel (Mid)');
    console.log('\nAll are available for matching! ✨');

  } catch (error) {
    console.error('❌ Error seeding freelancers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedFreelancers();
