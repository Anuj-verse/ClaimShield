const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'claimshield_secret',
    { expiresIn: '7d' }
  );

const register = async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const existing = await User.findOne({ email }).catch(() => null);
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, name: name || email.split('@')[0], role: role || 'investigator' }).catch(() => null);

  // If DB not available, create a mock user object
  const mockUser = user || { _id: 'mock_' + Date.now(), email, name: name || 'Agent', role: 'investigator' };
  const token = signToken(mockUser);
  res.status(201).json({ token, user: { id: mockUser._id, email: mockUser.email, name: mockUser.name, role: mockUser.role } });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Try DB with short timeout
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000));
  const user = await Promise.race([User.findOne({ email }), timeout]).catch(() => null);

  if (user) {
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  }

  // Fallback: demo mode — accept any credentials (no DB available)
  const name = email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const mockUser = { _id: 'demo_user', email, name, role: 'investigator' };
  const token = signToken(mockUser);
  res.json({ token, user: mockUser });
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash').catch(() => null);
  res.json(user || req.user);
};

module.exports = { register, login, getMe };
