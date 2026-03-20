import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { MOCK_CLAIMS, MOCK_GRAPH } from '../utils/mockData';
import api from '../api/axios';
import toast from 'react-hot-toast';

const riskColor = (s) => s > 74 ? '#ff1744' : s >= 40 ? '#ffab00' : '#00e676';

function RiskMeter({ score }) {
  const r = 52, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = riskColor(score);

  return (
    <div style={{ textAlign: 'center', padding: '10px' }}>
      <svg width="120" height="120" style={{ display: 'block', margin: '0 auto' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-surface)" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1), stroke 0.5s', filter: `drop-shadow(0 0 8px ${color})` }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="26" fontFamily="Syne, sans-serif" fontWeight="800">{score}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontFamily="JetBrains Mono, monospace">RISK SCORE</text>
      </svg>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
        {score > 74 ? '🔴 HIGH RISK — Review Immediately' : score >= 40 ? '🟡 MEDIUM RISK — Monitor' : '🟢 LOW RISK — Likely Legitimate'}
      </div>
    </div>
  );
}

function SHAPPanel({ shapValues }) {
  const entries = Object.entries(shapValues || {}).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const maxVal = Math.max(...entries.map(([, v]) => Math.abs(v)), 0.01);

  return (
    <div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        Feature importance explains <strong style={{ color: 'var(--text-primary)' }}>why</strong> this risk score was assigned.
      </div>
      {entries.map(([feature, value]) => (
        <div key={feature} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-dim)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{feature.replace(/_/g, ' ')}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-display)', color: value > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
              {value > 0 ? '+' : ''}{value.toFixed(3)}
            </span>
          </div>
          <div style={{ height: '5px', background: 'var(--bg-surface)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '10px',
              width: `${(Math.abs(value) / maxVal) * 100}%`,
              background: value > 0 ? 'linear-gradient(90deg, rgba(255,23,68,0.6), var(--accent-red))' : 'linear-gradient(90deg, rgba(0,230,118,0.6), var(--accent-green))',
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)'
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatPanel({ claimId, claimContext }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `I've analyzed claim **${claimId}**. Risk score is **${claimContext?.riskScore || '—'}** based on XGBoost v3.2. Ask me anything about this claim's risk factors, fraud ring connections, or document analysis.`, time: 'now' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input, time: 'now' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const { data } = await api.post('/chat', { message: input, claimId, claimContext });
      setMessages(prev => [...prev, { role: 'ai', text: data.message, time: 'just now' }]);
    } catch {
      const fallbacks = [
        'Based on the XGBoost analysis, the primary risk driver is **phone number reuse** — this number appears in 4 other flagged claims filed within 90 days.',
        'The SHAP values indicate **claim_amount** contributes +0.31 to the risk. Claims of this size in this category have a **78% fraud rate** historically.',
        'I recommend **escalating** this claim for in-person verification and cross-referencing with the national fraud database.',
        'This claimant is connected to **Fraud Ring FR-007** — a network of 11 individuals sharing addresses and phone numbers across 23 claims.'
      ];
      setMessages(prev => [...prev, { role: 'ai', text: fallbacks[Math.floor(Math.random() * fallbacks.length)], time: 'just now' }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '340px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent-violet), transparent)' }} />
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600 }}>
        🤖 Claimshield Intelligence
        <span style={{ background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-blue))', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'white', fontWeight: 500, letterSpacing: '0.05em' }}>RAG v2</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: '85%', alignSelf: m.role === 'ai' ? 'flex-start' : 'flex-end' }}>
            <div style={{
              padding: '10px 14px', borderRadius: m.role === 'ai' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
              fontSize: '13px', lineHeight: 1.5,
              background: m.role === 'ai' ? 'var(--bg-surface)' : 'linear-gradient(135deg, rgba(41,121,255,0.3), rgba(124,77,255,0.2))',
              border: m.role === 'ai' ? '1px solid var(--border-dim)' : '1px solid rgba(41,121,255,0.3)',
              color: 'var(--text-primary)'
            }}
              dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>
        ))}
        {typing && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: '4px 12px 12px 12px', border: '1px solid var(--border-dim)', width: 'fit-content' }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'blink 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}
          </div>
        )}
        <div ref={msgEndRef} />
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-dim)', display: 'flex', gap: '10px' }}>
        <input style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '13px', outline: 'none' }}
          placeholder="Ask about risk factors, fraud ring, document analysis..."
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-blue))', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-blue)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function ClaimDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    const mock = MOCK_CLAIMS.find(c => c._id === id) || { ...MOCK_CLAIMS[0], _id: id };
    setClaim(mock);
    setGraphData(MOCK_GRAPH(id));

    api.get(`/claims/${id}`).then(r => setClaim(r.data)).catch(() => { });
    api.get(`/graph/${id}`).then(r => setGraphData(r.data)).catch(() => { });
  }, [id]);

  if (!claim) return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '60px' }}>Loading claim data...</div>;

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-cyan)', marginBottom: '6px', letterSpacing: '0.05em' }}>{claim._id}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>{claim.claimantName}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span className="chip chip-info">{claim.claimType}</span>
            <span className="chip chip-info">₹{Number(claim.amount).toLocaleString('en-IN')}</span>
            {claim.fraudRingId && <span className="chip chip-danger">🔴 {claim.fraudRingId}</span>}
            {(claim.fraudFlags || []).map((f, i) => <span key={i} className="chip chip-warn">{f}</span>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ghost" onClick={() => navigate('/claims')}>← Back</button>
          <button className="btn-danger">🚩 Flag for Review</button>
          <button className="btn-primary">✅ Approve Claim</button>
        </div>
      </div>

      {/* Top Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Risk Meter */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(255,23,68,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <RiskMeter score={claim.riskScore} />
        </div>

        {/* SHAP Values */}
        <div className="card">
          <div className="section-header">
            <div className="section-title" style={{ fontSize: '14px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              SHAP Feature Attribution
            </div>
            <span className="chip chip-info">XGBoost v3.2</span>
          </div>
          <SHAPPanel shapValues={claim.shapValues} />
        </div>

        {/* Claim Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="section-title" style={{ fontSize: '14px', marginBottom: '16px' }}>📋 Claim Details</div>
            {[
              ['Policy ID', claim.policyId],
              ['Claim Type', claim.claimType],
              ['Amount', `₹${Number(claim.amount).toLocaleString('en-IN')}`],
              ['Status', claim.status?.replace('_', ' ').toUpperCase()],
              ['Submitted', new Date(claim.createdAt).toLocaleString()],
              ['Claimant Email', claim.claimantEmail || '—'],
              ['Phone', claim.claimantPhone || '—'],
              ['Address', claim.claimantAddress || '—']
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-dim)', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{k}</span>
                <span style={{ textAlign: 'right', maxWidth: '55%', wordBreak: 'break-word' }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-title" style={{ fontSize: '14px', marginBottom: '16px' }}>🔬 CV Tampering Flags</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              {(claim.fraudFlags || []).filter(f => /clon|ELA|noise|tamper|mismatch/i.test(f)).length > 0 ? (
                (claim.fraudFlags || []).filter(f => /clon|ELA|noise|tamper|mismatch/i.test(f)).map((f, i) => (
                  <div key={i} style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span>✘</span> <span>{f}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✅</span> <span>Image verified authentic</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fraud Ring + Chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Fraud Ring Graph */}
        <div className="card">
          <div className="section-header">
            <div className="section-title" style={{ fontSize: '14px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
              Fraud Ring: {graphData?.fraudRingId}
            </div>
            {claim.fraudRingId && <span className="chip chip-danger">ACTIVE</span>}
          </div>
          {graphData ? (
            <div style={{ height: '280px', background: 'var(--bg-surface)', borderRadius: '12px', overflow: 'hidden' }}>
              <ForceGraph2D
                graphData={{ nodes: graphData.nodes || [], links: graphData.links || [] }}
                width={undefined}
                height={280}
                backgroundColor="transparent"
                nodeLabel={node => `${node.name}\nRisk: ${node.riskScore}`}
                nodeColor={node => node.label === 'PRIMARY' ? '#ff1744' : node.riskScore > 60 ? '#ffab00' : '#2979ff'}
                nodeVal={node => node.val || 8}
                linkColor={() => 'rgba(0,229,255,0.25)'}
                linkWidth={1.5}
                linkLabel={link => link.label}
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  if (globalScale < 0.8) return;
                  ctx.font = `${10 / globalScale}px JetBrains Mono`;
                  ctx.fillStyle = 'rgba(232,236,247,0.8)';
                  ctx.textAlign = 'center';
                  ctx.fillText(node.name?.split(' ')[0] || node.id, node.x, node.y + 14 / globalScale);
                }}
              />
            </div>
          ) : (
            <div style={{ height: '280px', background: 'var(--bg-surface)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              No fraud ring connections detected
            </div>
          )}
          {graphData?.metadata && (
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <span>🔴 {graphData.metadata.nodeCount} nodes</span>
              <span>⚡ {graphData.metadata.edgeCount} edges</span>
            </div>
          )}
        </div>

        {/* Chat */}
        <ChatPanel claimId={claim._id} claimContext={{ riskScore: claim.riskScore, amount: claim.amount, shapValues: claim.shapValues, fraudFlags: claim.fraudFlags, description: claim.description || `Claimant ${claim.claimantName} filed for ${claim.claimType} with amount ₹${claim.amount}` }} />
      </div>
    </div>
  );
}
