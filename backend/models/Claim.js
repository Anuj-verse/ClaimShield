const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  policyId: { type: String, required: true },
  claimantName: { type: String, required: true },
  claimantEmail: { type: String, default: '' },
  claimantPhone: { type: String, default: '' },
  claimantAddress: { type: String, default: '' },
  claimType: {
    type: String,
    enum: ['Auto Insurance', 'Health Insurance', 'Property', 'Life Insurance', 'Travel'],
    required: true
  },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  fraudFlags: [{ type: String }],
  shapValues: { type: Map, of: Number, default: {} },
  fraudRingId: { type: String, default: null },
  images: [{ type: String }],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);
