const NAMES = ['Priya Sharma', 'Rahul Gupta', 'Anjali Singh', 'Dev Patel', 'Kavita Reddy', 'Arjun Kumar', 'Meera Nair', 'Vikram Joshi', 'Sunita Verma', 'Amit Khanna'];
const TYPES = ['Auto Insurance', 'Health Insurance', 'Property', 'Life Insurance', 'Travel'];
const FLAGS = ['Shared phone', 'Duplicate address', 'Doc tampering', 'Network ring', 'Suspicious timing', 'Unusual amount'];
const STATUSES = ['pending', 'under_review', 'flagged', 'approved', 'rejected'];

let _counter = 1000;

export function generateMockClaim(seed = null) {
  const idx = seed !== null ? seed : Math.floor(Math.random() * 100);
  const riskScore = Math.floor(Math.random() * 80) + 15;
  const amount = Math.floor(Math.random() * 800000) + 10000;
  const name = NAMES[idx % NAMES.length];
  const type = TYPES[idx % TYPES.length];

  const flags = [];
  if (riskScore > 75) flags.push('High-risk claimant profile');
  if (riskScore > 60) flags.push('Suspicious timing pattern');
  if (amount > 300000) flags.push('Unusual claim amount');
  if (Math.random() > 0.6) flags.push(FLAGS[Math.floor(Math.random() * FLAGS.length)]);

  return {
    _id: `CLM-${++_counter}`,
    policyId: `POL-${10000 + idx}`,
    claimantName: name,
    claimType: type,
    amount,
    status: STATUSES[idx % STATUSES.length],
    riskScore,
    fraudFlags: flags,
    fraudRingId: riskScore > 75 ? `FR-${(idx % 12) + 1}` : null,
    shapValues: {
      claim_amount: +(amount / 1000000).toFixed(3),
      phone_reuse: +(Math.random() * 0.35).toFixed(3),
      address_cluster: +(Math.random() * 0.28).toFixed(3),
      claim_frequency: +(Math.random() * 0.22).toFixed(3),
      doc_integrity: +(-Math.random() * 0.18).toFixed(3),
      claim_age: +(-Math.random() * 0.12).toFixed(3),
      policy_age: +(-Math.random() * 0.1).toFixed(3)
    },
    createdAt: new Date(Date.now() - idx * 1800000).toISOString()
  };
}

export const MOCK_CLAIMS = Array.from({ length: 25 }, (_, i) => generateMockClaim(i));

export const MOCK_GRAPH = (claimId) => {
  const nodeNames = NAMES.slice(0, 6);
  const nodes = nodeNames.map((name, i) => ({
    id: i === 0 ? claimId : `CLM-${1100 + i}`,
    name,
    riskScore: Math.floor(Math.random() * 50) + 40,
    label: i === 0 ? 'PRIMARY' : 'CONNECTED',
    val: i === 0 ? 14 : 8
  }));
  const links = [
    { source: nodes[0].id, target: nodes[1].id, label: 'Shared phone' },
    { source: nodes[1].id, target: nodes[2].id, label: 'Same address' },
    { source: nodes[2].id, target: nodes[3].id, label: 'Shared doc' },
    { source: nodes[0].id, target: nodes[3].id, label: 'Same policy' },
    { source: nodes[3].id, target: nodes[4].id, label: 'Shared phone' },
    { source: nodes[4].id, target: nodes[5].id, label: 'Same address' },
    { source: nodes[0].id, target: nodes[5].id, label: 'Shared phone' }
  ];
  return { nodes, links, fraudRingId: 'FR-007', metadata: { nodeCount: nodes.length, edgeCount: links.length } };
};

export const ANALYTICS_DATA = {
  weeklyTrend: [
    { day: 'Mon', high: 24, medium: 38, low: 67 },
    { day: 'Tue', high: 31, medium: 42, low: 71 },
    { day: 'Wed', high: 19, medium: 35, low: 83 },
    { day: 'Thu', high: 45, medium: 29, low: 54 },
    { day: 'Fri', high: 38, medium: 51, low: 62 },
    { day: 'Sat', high: 27, medium: 44, low: 78 },
    { day: 'Sun', high: 22, medium: 31, low: 89 }
  ],
  fraudTypes: [
    { name: 'Auto Insurance', value: 34, color: '#ff1744' },
    { name: 'Health Insurance', value: 28, color: '#7c4dff' },
    { name: 'Property', value: 19, color: '#ffab00' },
    { name: 'Life Insurance', value: 13, color: '#2979ff' },
    { name: 'Travel', value: 6, color: '#00e676' }
  ],
  monthlySaved: [
    { month: 'Oct', saved: 2800000 },
    { month: 'Nov', saved: 3400000 },
    { month: 'Dec', saved: 2900000 },
    { month: 'Jan', saved: 4100000 },
    { month: 'Feb', saved: 3700000 },
    { month: 'Mar', saved: 4200000 }
  ]
};
