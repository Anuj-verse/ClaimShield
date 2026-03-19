import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ANALYTICS_DATA } from '../utils/mockData';

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return percent > 0.07 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontFamily="JetBrains Mono">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export default function AnalyticsPage() {
  const totalSaved = ANALYTICS_DATA.monthlySaved.reduce((sum, m) => sum + m.saved, 0);

  return (
    <div className="page-enter">
      {/* Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }} className="metrics-grid">
        {[
          { label: 'TOTAL FRAUD PREVENTED', value: `₹${(totalSaved / 1000000).toFixed(1)}M`, delta: '↑ 18% vs last quarter', type: 'success', icon: '🛡️' },
          { label: 'DETECTION ACCURACY', value: '94.1%', delta: '↑ XGBoost v3.2', type: 'info', icon: '🎯' },
          { label: 'AVG REVIEW TIME', value: '4.2h', delta: '↓ 38% faster', type: 'warning', icon: '⚡' },
          { label: 'FRAUD RINGS BUSTED', value: '7', delta: '↑ This quarter', type: 'danger', icon: '🔗' }
        ].map(m => (
          <div key={m.label} className={`metric-card ${m.type}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ marginBottom: '10px', fontSize: '20px' }}>{m.icon}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: m.type === 'danger' ? 'var(--accent-red)' : m.type === 'success' ? 'var(--accent-green)' : m.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>{m.value}</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: m.delta.startsWith('↑') ? 'var(--accent-green)' : m.delta.startsWith('↓') ? 'var(--accent-green)' : 'var(--text-secondary)' }}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }} className="analytics-grid">
        {/* Weekly Fraud Trend */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="section-header">
            <div className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Weekly Fraud Activity
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ANALYTICS_DATA.weeklyTrend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }} />
              <Bar dataKey="high" fill="var(--accent-red)" radius={[4,4,0,0]} opacity={0.85} name="High Risk" />
              <Bar dataKey="medium" fill="var(--accent-amber)" radius={[4,4,0,0]} opacity={0.85} name="Medium Risk" />
              <Bar dataKey="low" fill="var(--accent-green)" radius={[4,4,0,0]} opacity={0.85} name="Cleared" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fraud Type Pie */}
        <div className="card">
          <div className="section-header">
            <div className="section-title" style={{ fontSize: '14px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
              Fraud by Type
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <PieChart width={140} height={140}>
              <Pie data={ANALYTICS_DATA.fraudTypes} cx={70} cy={70} innerRadius={40} outerRadius={65} dataKey="value" labelLine={false} label={renderCustomLabel}>
                {ANALYTICS_DATA.fraudTypes.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ANALYTICS_DATA.fraudTypes.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '11px' }}>{item.name}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <div className="card">
          <div className="section-header">
            <div className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Monthly Fraud Savings (₹)
            </div>
            <span className="chip chip-success">Total: ₹{(totalSaved / 1000000).toFixed(1)}M</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={ANALYTICS_DATA.monthlySaved} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000000}M`} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }} formatter={v => [`₹${(v/1000000).toFixed(2)}M`, 'Savings']} />
              <Line type="monotone" dataKey="saved" stroke="var(--accent-green)" strokeWidth={2.5} dot={{ fill: 'var(--accent-green)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
