require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Claim = require('./models/Claim');
const { generateMockClaim } = require('./utils/mlMock');
const bcrypt = require('bcryptjs');

const seedDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not set in .env');
      process.exit(1);
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Claim.deleteMany({});

    console.log('Creating demo user...');
    const hashed = await bcrypt.hash('demo1234', 10);
    const demoUser = await User.create({
      name: 'Investigator Demo',
      email: 'investigator@aegis.gov',
      passwordHash: hashed,
      role: 'investigator'
    });

    console.log('Generating 25 mock claims...');
    const claims = Array.from({ length: 25 }, () => {
      const mock = generateMockClaim();
      delete mock._id;
      return {
        ...mock,
        submittedBy: demoUser._id,
        status: mock.riskScore > 74 ? 'flagged' : mock.riskScore >= 40 ? 'under_review' : 'pending',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // random date in last 30 days
      };
    });

    await Claim.insertMany(claims);
    console.log(`Successfully seeded ${claims.length} claims.`);
    
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
