import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://musicniteshagarwal_db_user:jUnS8WQp33RCWrKa@cluster0.pzygozk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check users collection
    const users = await db.collection('users').find({ email: 'techniteshgamer@gmail.com' }).toArray();
    console.log('\n=== USERS ===');
    console.log(JSON.stringify(users, null, 2));

    // Check freelancer profiles
    const profiles = await db.collection('freelancerprofiles').find({}).toArray();
    console.log('\n=== FREELANCER PROFILES ===');
    console.log(JSON.stringify(profiles, null, 2));

    // Check projects
    const projects = await db.collection('projects').find({}).toArray();
    console.log('\n=== PROJECTS ===');
    console.log(JSON.stringify(projects, null, 2));

    // Check chat rooms
    const chatRooms = await db.collection('chatrooms').find({}).toArray();
    console.log('\n=== CHAT ROOMS ===');
    console.log(JSON.stringify(chatRooms, null, 2));

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n=== ALL COLLECTIONS ===');
    collections.forEach(c => console.log(c.name));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
