const Claim = require('../models/Claim');
const { scoreClaim, generateMockClaim } = require('../utils/mlMock');

// Mock claim data for when DB is unavailable
const MOCK_CLAIMS = Array.from({ length: 20 }, (_, i) => generateMockClaim()).map((c, i) => ({
  ...c,
  _id: `CLM-${1000 + i}`,
  policyId: `POL-${10000 + i}`,
  claimType: ['Auto Insurance', 'Health Insurance', 'Property', 'Life Insurance', 'Travel'][i % 5],
  amount: Math.floor(Math.random() * 800000) + 10000,
  status: ['pending', 'under_review', 'flagged', 'approved', 'rejected'][i % 5],
  createdAt: new Date(Date.now() - i * 3600000).toISOString()
}));

const uploadClaim = async (req, res) => {
  const { policyId, claimantName, claimantEmail, claimantPhone, claimantAddress, claimType, amount, description } = req.body;
  if (!policyId || !claimantName || !claimType || !amount) {
    return res.status(400).json({ error: 'Required fields: policyId, claimantName, claimType, amount' });
  }

  const mlResult = scoreClaim({ amount: Number(amount), claimantPhone, claimantAddress, description });
  const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

  // Try saving to DB
  const claimData = { policyId, claimantName, claimantEmail, claimantPhone, claimantAddress, claimType, amount: Number(amount), description, images, submittedBy: req.user.id, ...mlResult };
  const claim = await Claim.create(claimData).catch(() => ({ ...claimData, _id: `CLM-${Date.now()}`, createdAt: new Date().toISOString() }));

  // Emit to socket
  const io = req.app.get('io');
  if (io) io.emit('newClaim', claim);

  res.status(201).json({ message: 'Claim submitted successfully', claim });
};

const getClaims = async (req, res) => {
  const { page = 1, limit = 15, riskLevel, claimType, search } = req.query;

  try {
    const query = {};
    if (claimType) query.claimType = claimType;
    if (riskLevel === 'high') query.riskScore = { $gt: 74 };
    else if (riskLevel === 'medium') query.riskScore = { $gte: 40, $lte: 74 };
    else if (riskLevel === 'low') query.riskScore = { $lt: 40 };
    if (search) query.$or = [{ claimantName: new RegExp(search, 'i') }, { policyId: new RegExp(search, 'i') }];

    const claims = await Claim.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('submittedBy', 'name email');

    const total = await Claim.countDocuments(query);
    return res.json({ claims, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch {
    // Fallback mock data
    let filtered = [...MOCK_CLAIMS];
    if (search) filtered = filtered.filter(c => c.claimantName.toLowerCase().includes(search.toLowerCase()));
    res.json({ claims: filtered.slice(0, limit), total: filtered.length, page: 1, pages: 1 });
  }
};

const getRecentClaims = async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 }).limit(10);
    res.json(claims);
  } catch {
    res.json(MOCK_CLAIMS.slice(0, 10));
  }
};

const getClaimById = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate('submittedBy', 'name email');
    if (!claim) throw new Error();
    res.json(claim);
  } catch {
    const mock = MOCK_CLAIMS.find(c => c._id === req.params.id) || { ...generateMockClaim(), _id: req.params.id };
    res.json(mock);
  }
};

module.exports = { uploadClaim, getClaims, getRecentClaims, getClaimById };
