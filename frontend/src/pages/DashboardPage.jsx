import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useClaims } from '../context/ClaimsContext';
import { ANALYTICS_DATA } from '../utils/mockData';
import api from '../api/axios';

const riskColor = (score) => score > 74 ? 'var(--accent-red)' : score >= 40 ? 'var(--accent-amber)' : 'var(--accent-green)';
const riskClass = (score) => score > 74 ? 'high-risk' : score >= 40 ? 'med-risk' : 'low-risk';
const riskTag = (score) => score > 74 ? 'HIGH' : score >= 40 ? 'MED' : 'LOW';
const fmt = (n) => n >= 1000000 ? `₹${(n/1000000).toFixed(1)}M` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;

function useCounter(target, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const isNum = typeof target === 'number';
    const end = isNum ? target : parseInt(target.replace(/[^0-9]/g, ''));
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setVal(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return val;
}

function MetricCard({ type, icon, label, target, delta, prefix = '', suffix = '' }) {
  const val = useCounter(typeof target === 'number' ? target : parseInt(String(target).replace(/[^0-9]/g, '')));
  return (
    <div className={`metric-card ${type}`} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: '16px', padding: '20px',
      position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'all 0.3s'
    }}>
      <div className="metric-glow" style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ marginBottom: '10px', fontSize: '20px' }}>{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, lineHeight: 1, marginBottom: '6px',
        color: type === 'danger' ? 'var(--accent-red)' : type === 'success' ? 'var(--accent-green)' : type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-cyan)'
      }}>{prefix}{val.toLocaleString()}{suffix}</div>
      <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: delta.startsWith('↑') ? 'var(--accent-red)' : delta.startsWith('↓') ? 'var(--accent-green)' : 'var(--text-secondary)' }}>{delta}</div>
    </div>
  );
}

function ClaimItem({ claim, onClick }) {
  const score = claim.riskScore;
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
      borderLeft: `3px solid ${riskColor(score)}`,
      borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px',
      cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden', marginBottom: '8px'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.15)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.transform = 'none'; }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', flexShrink: 0,
        background: score > 74 ? 'rgba(255,23,68,0.15)' : score >= 40 ? 'rgba(255,171,0,0.12)' : 'rgba(0,230,118,0.1)',
        color: riskColor(score)
      }}>
        {claim.claimantName?.split(' ').map(n => n[0]).join('').slice(0,2) || 'XX'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>{claim._id} · {claim.claimType}</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {claim.claimantName}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(claim.fraudFlags || []).slice(0,2).map((f, i) => (
            <span key={i} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,23,68,0.3)', background: 'rgba(255,23,68,0.08)', color: 'var(--accent-red)' }}>{f}</span>
          ))}
          {claim.fraudRingId && <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,23,68,0.3)', background: 'rgba(255,23,68,0.08)', color: 'var(--accent-red)' }}>🔴 {claim.fraudRingId}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, lineHeight: 1, color: riskColor(score) }}>{score}</div>
        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{riskTag(score)} RISK</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>{fmt(claim.amount)}</div>
      </div>
    </div>
  );
}

// Mini network canvas
function MiniNetwork() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const nodes = [
      { x: W/2, y: H/2, r: 14, color: '#ff1744', label: 'PRIMARY' },
      { x: W*0.2, y: H*0.3, r: 9, color: '#ffab00', label: 'C1' },
      { x: W*0.8, y: H*0.3, r: 9, color: '#ff1744', label: 'C2' },
      { x: W*0.15, y: H*0.7, r: 9, color: '#ffab00', label: 'C3' },
      { x: W*0.85, y: H*0.7, r: 9, color: '#ffab00', label: 'C4' },
      { x: W*0.5, y: H*0.15, r: 8, color: '#7c4dff', label: 'C5' },
      { x: W*0.35, y: H*0.82, r: 8, color: '#ff1744', label: 'C6' },
      { x: W*0.65, y: H*0.82, r: 8, color: '#2979ff', label: 'C7' }
    ];
    const edges = [[0,1],[0,2],[0,3],[0,4],[1,2],[2,4],[3,6],[4,7],[5,0],[5,2],[6,7]];

    let angle = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      edges.forEach(([a, b]) => {
        const na = nodes[a], nb = nodes[b];
        const grad = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
        grad.addColorStop(0, 'rgba(0,229,255,0.25)');
        grad.addColorStop(1, 'rgba(255,23,68,0.2)');
        ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
      });
      nodes.forEach((node, i) => {
        const pulse = Math.sin(angle + i * 0.8) * 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + pulse, 0, Math.PI * 2);
        ctx.fillStyle = node.color + '20';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = node.color + '40';
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.5;
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 8px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i === 0 ? '●' : '○', node.x, node.y);
      });
      angle += 0.03;
      requestAnimationFrame(draw);
    };
    const raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas ref={canvasRef} width={340} height={220}
      style={{ width: '100%', height: '220px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)' }} />
  );
}

export default function DashboardPage() {
  const { recentClaims } = useClaims();
  const navigate = useNavigate();

  return (
    <div className="page-enter">
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }} className="metrics-grid">
        <MetricCard type="danger" icon="🚨" label="HIGH RISK CLAIMS" target={147} delta="↑ +23 since yesterday" />
        <MetricCard type="success" icon="🛡️" label="FRAUD BLOCKED" target={4200000} prefix="₹" suffix="" delta="↓ 12% fraud rate" />
        <MetricCard type="warning" icon="🔗" label="RING NETWORKS" target={18} delta="↑ 3 new detected" />
        <MetricCard type="info" icon="⚡" label="CLAIMS TODAY" target={892} delta="↔ Processing 12/sec" />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', marginBottom: '24px' }} className="main-grid">
        {/* Live Claim Feed */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Live Claim Feed
            </div>
            <span className="section-action" onClick={() => navigate('/claims')}>View All →</span>
          </div>
          {recentClaims.slice(0, 6).map(claim => (
            <ClaimItem key={claim._id} claim={claim} onClick={() => navigate(`/claims/${claim._id}`)} />
          ))}
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Ring Network */}
          <div className="card">
            <div className="section-header">
              <div className="section-title" style={{ fontSize: '14px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Fraud Ring #FR-007
              </div>
              <span className="chip chip-danger">CRITICAL</span>
            </div>
            <MiniNetwork />
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <span>🔴 8 nodes</span>
              <span>⚡ 11 edges</span>
              <span style={{ color: 'var(--accent-red)' }}>Shared phone: 4</span>
            </div>
          </div>

          {/* Alerts */}
          <div className="card">
            <div className="section-header">
              <div className="section-title" style={{ fontSize: '14px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                System Alerts
              </div>
              <span className="chip chip-danger">3 NEW</span>
            </div>
            {[
              { type: 'critical', emoji: '🚨', title: 'Ring Network Expansion', desc: 'FR-007 added 3 new claimants', time: '2 min ago' },
              { type: 'warning', emoji: '⚠️', title: 'Document Tampering', desc: 'CLM-4892: CV metadata mismatch', time: '14 min ago' },
              { type: 'info', emoji: 'ℹ️', title: 'Model Retrained', desc: 'XGBoost v3.2 deployed (94.1% acc)', time: '1 hr ago' }
            ].map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px',
                borderRadius: '10px', marginBottom: '8px',
                border: `1px solid ${a.type === 'critical' ? 'rgba(255,23,68,0.25)' : a.type === 'warning' ? 'rgba(255,171,0,0.2)' : 'rgba(0,229,255,0.15)'}`,
                background: a.type === 'critical' ? 'rgba(255,23,68,0.05)' : a.type === 'warning' ? 'rgba(255,171,0,0.04)' : 'rgba(0,229,255,0.03)'
              }}>
                <span style={{ fontSize: '16px' }}>{a.emoji}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{a.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.desc}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            7-Day Fraud Activity
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--accent-red)' }}>■ High Risk</span>
            <span style={{ color: 'var(--accent-amber)' }}>■ Medium Risk</span>
            <span style={{ color: 'var(--accent-green)' }}>■ Cleared</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={ANALYTICS_DATA.weeklyTrend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }} />
            <Line type="monotone" dataKey="high" stroke="var(--accent-red)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="medium" stroke="var(--accent-amber)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="low" stroke="var(--accent-green)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
