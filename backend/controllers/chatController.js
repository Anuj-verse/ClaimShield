const RAG_RESPONSES = [
  { keywords: ['risk', 'score', 'why'], response: 'The risk score of **{score}** is driven primarily by **claim amount**, **phone number reuse** across 4 other claims, and a **suspicious timing pattern** — all 3 claims were filed within 72 hours of each other. XGBoost confidence: 94.2%.' },
  { keywords: ['shap', 'feature', 'important'], response: 'The top SHAP contributors are: **claim_amount** (+0.31), **phone_reuse** (+0.28), and **address_cluster** (+0.24). These three features alone account for 83% of the risk score elevation.' },
  { keywords: ['ring', 'network', 'connected', 'fraud ring'], response: 'This claimant belongs to **Fraud Ring FR-007** — a network of 11 individuals sharing 4 phone numbers and 3 addresses. The ring has collectively filed ₹12.4M in claims this quarter.' },
  { keywords: ['document', 'tampering', 'cv', 'image'], response: 'CV document analysis flagged **metadata mismatch**: the document was last modified 3 days after the purported incident date. ELA (Error Level Analysis) shows manipulation artifacts in the top-right quadrant.' },
  { keywords: ['recommend', 'action', 'next', 'should'], response: 'Recommended actions: 1) **Escalate** to senior investigator. 2) **Flag** for in-person verification. 3) **Cross-check** phone number against national fraud registry. 4) Request **original documents** from claimant.' },
  { keywords: ['amount', 'money', 'value', 'how much'], response: 'The claimed amount of **₹{amount}** is **2.3x above** the average for this claim category. Historically, 78% of claims above this threshold in the Auto Insurance segment with similar profiles are fraudulent.' },
  { keywords: ['history', 'previous', 'past', 'before'], response: 'The claimant has **3 prior claims** in the past 18 months, totaling ₹8.7M. Two were flagged for suspicious activity and are currently under investigation.' }
];

const DEFAULT_RESPONSE = 'I analyzed the claim data across **12 risk dimensions**. Key findings: elevated risk due to network connections, document anomalies, and behavioral patterns inconsistent with legitimate claims. Would you like details on any specific aspect?';

const chat = async (req, res) => {
  const { message, claimId, claimContext } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const lowerMsg = message.toLowerCase();

  // Find best matching response
  let response = DEFAULT_RESPONSE;
  for (const item of RAG_RESPONSES) {
    if (item.keywords.some(kw => lowerMsg.includes(kw))) {
      response = item.response;
      break;
    }
  }

  // Inject context values
  if (claimContext) {
    response = response
      .replace('{score}', claimContext.riskScore || '87')
      .replace('{amount}', claimContext.amount ? `₹${Number(claimContext.amount).toLocaleString('en-IN')}` : '₹4,50,000');
  }

  // Simulate processing delay
  await new Promise(r => setTimeout(r, 800 + Math.random() * 700));

  res.json({
    message: response,
    timestamp: new Date().toISOString(),
    model: 'ClaimShield-RAG-v2',
    confidence: (0.85 + Math.random() * 0.12).toFixed(2)
  });
};

module.exports = { chat };
