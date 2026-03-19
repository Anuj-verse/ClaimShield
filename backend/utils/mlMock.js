const CLAIM_TYPES = ['Auto Insurance', 'Health Insurance', 'Property', 'Life Insurance', 'Travel'];
const NAMES = ['Priya Sharma', 'Rahul Gupta', 'Anjali Singh', 'Dev Patel', 'Kavita Reddy', 'Arjun Kumar', 'Meera Nair', 'Vikram Joshi'];
const FLAGS = ['Shared phone number', 'Duplicate address', 'Suspicious timing', 'Doc tampering', 'Network fraud ring', 'Unusual claim amount', 'Multiple claims same period'];

/**
 * Deterministic mock ML scorer — simulates XGBoost output
 */
function scoreClaim(claimData) {
  const { amount, claimantPhone, claimantAddress, description } = claimData;
  let score = 20;

  // Amount-based risk
  if (amount > 500000) score += 30;
  else if (amount > 100000) score += 15;
  else if (amount > 50000) score += 8;

  // Phone/address overlap simulation
  if (claimantPhone && claimantPhone.length > 8) score += 12;
  if (claimantAddress && claimantAddress.toLowerCase().includes('mumbai')) score += 8;

  // Text signals
  if (description) {
    const desc = description.toLowerCase();
    if (desc.includes('fire') || desc.includes('theft') || desc.includes('accident')) score += 10;
    if (desc.includes('sudden') || desc.includes('emergency')) score += 5;
  }

  // Add randomness
  score += Math.floor(Math.random() * 20) - 5;
  score = Math.max(5, Math.min(97, score));

  const fraudFlags = [];
  if (score > 75) fraudFlags.push('High-risk claimant profile');
  if (score > 60) fraudFlags.push('Suspicious timing pattern');
  if (amount > 200000) fraudFlags.push('Unusual claim amount');
  if (Math.random() > 0.7) fraudFlags.push('Shared phone number');
  if (Math.random() > 0.8) fraudFlags.push('Network fraud ring');

  const shapValues = {
    claim_amount: +(amount / 1000000).toFixed(3),
    phone_reuse: +(Math.random() * 0.35).toFixed(3),
    address_cluster: +(Math.random() * 0.28).toFixed(3),
    claim_frequency: +(Math.random() * 0.22).toFixed(3),
    doc_integrity: +(-Math.random() * 0.18).toFixed(3),
    claim_age: +(-Math.random() * 0.12).toFixed(3),
    policy_age: +(-Math.random() * 0.1).toFixed(3)
  };

  const fraudRingId = score > 70 ? `FR-${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}` : null;

  return { riskScore: Math.round(score), fraudFlags, shapValues, fraudRingId };
}

/**
 * Generate a random realistic mock claim (for live Socket.io stream)
 */
function generateMockClaim() {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const type = CLAIM_TYPES[Math.floor(Math.random() * CLAIM_TYPES.length)];
  const amount = Math.floor(Math.random() * 800000) + 10000;
  const claimData = {
    amount,
    claimantPhone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    claimantAddress: `${Math.floor(Math.random() * 100) + 1} Main St, Mumbai`,
    description: 'Claim submitted for review'
  };
  const mlResult = scoreClaim(claimData);
  const id = `CLM-${Math.floor(Math.random() * 9000) + 1000}`;
  return {
    _id: id,
    policyId: `POL-${Math.floor(Math.random() * 90000) + 10000}`,
    claimantName: name,
    claimType: type,
    amount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    fraudFlags: mlResult.fraudFlags,
    ...mlResult
  };
}

/**
 * Generate fraud ring graph data for a given claim
 */
function generateFraudRingGraph(claimId, fraudRingId) {
  const nodeCount = Math.floor(Math.random() * 8) + 4;
  const nodes = [];
  const links = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: i === 0 ? claimId : `CLM-${Math.floor(Math.random() * 9000) + 1000}`,
      name: NAMES[i % NAMES.length],
      riskScore: Math.floor(Math.random() * 60) + 30,
      label: i === 0 ? 'PRIMARY' : 'CONNECTED',
      val: i === 0 ? 12 : 7
    });
  }

  // Create a ring-like connection structure
  for (let i = 0; i < nodeCount - 1; i++) {
    links.push({
      source: nodes[i].id,
      target: nodes[i + 1].id,
      label: ['Shared phone', 'Same address', 'Same policy', 'Shared doc'][Math.floor(Math.random() * 4)],
      strength: Math.random()
    });
  }
  // Add cross-links
  if (nodeCount > 3) {
    links.push({ source: nodes[0].id, target: nodes[2].id, label: 'Shared phone', strength: 0.8 });
    links.push({ source: nodes[1].id, target: nodes[3].id, label: 'Same address', strength: 0.6 });
  }

  return {
    fraudRingId: fraudRingId || 'FR-001',
    nodes,
    links,
    metadata: { nodeCount, edgeCount: links.length, sharedPhones: 4, sharedAddresses: 3 }
  };
}

async function analyzeClaimAsync(claimData) {
  try {
    const url = process.env.NLP_API_URL || 'http://localhost:5001';
    const res = await fetch(`${url}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData),
      signal: AbortSignal.timeout(5000) // 5s timeout
    });
    
    if (res.ok) {
      return await res.json();
    }
    throw new Error(`NLP API returned ${res.status}`);
  } catch (err) {
    console.log(`[ML] Python NLP service unreachable/failed (${err.message}), falling back to local deterministic mock array.`);
    return scoreClaim(claimData);
  }
}

module.exports = { scoreClaim, generateMockClaim, generateFraudRingGraph, analyzeClaimAsync };
