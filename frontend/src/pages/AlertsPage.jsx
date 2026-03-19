import React, { useState } from 'react';

const ALERTS = [
  { id: 1, type: 'critical', emoji: '🚨', title: 'Ring Network Expansion Detected', desc: 'FR-007 added 3 new claimants sharing addresses in Mumbai North district. Total network size: 14 individuals, 32 claims.', time: '2 minutes ago', action: 'View Ring' },
  { id: 2, type: 'warning', emoji: '⚠️', title: 'Document Tampering Flagged', desc: 'Claim #CLM-4892: ELA analysis detected metadata mismatch in medical bill. Document modification timestamp inconsistent with incident date.', time: '14 minutes ago', action: 'Review Claim' },
  { id: 3, type: 'critical', emoji: '🚨', title: 'High-Risk Claim Surge', desc: 'Mumbai region showing 47% increase in high-risk auto insurance claims this week. Possible coordinated fraudulent activity.', time: '1 hour ago', action: 'Analytics' },
  { id: 4, type: 'info', emoji: '🤖', title: 'XGBoost Model Retrained', desc: 'Model v3.2 deployed with 94.1% accuracy (+1.8% improvement). Trained on 2.4M claims with new fraud ring features.', time: '3 hours ago', action: null },
  { id: 5, type: 'warning', emoji: '⚠️', title: 'Shared Phone Number Alert', desc: 'Phone +91-98XXXXXX47 detected in 6 separate claims filed by different claimants within 45 days. Pattern matches known fraud signature.', time: '5 hours ago', action: 'Investigate' },
  { id: 6, type: 'info', emoji: 'ℹ️', title: 'Weekly Fraud Report Ready', desc: 'Q1 2025 Week 11 report generated. 892 claims processed, 147 flagged, ₹4.2M in fraud prevented. Full report available for download.', time: '8 hours ago', action: 'Download' },
  { id: 7, type: 'critical', emoji: '🚨', title: 'Identity Theft Pattern', desc: 'Five separate claimants using variations of the same identity documents detected across different regions. Forwarded to cyber crime unit.', time: '1 day ago', action: 'View Cases' },
  { id: 8, type: 'info', emoji: 'ℹ️', title: 'System Backup Completed', desc: 'Daily database backup completed successfully. All claim data, audit logs, and ML model checkpoints archived securely.', time: '1 day ago', action: null }
];

const bgColor = t => t === 'critical' ? 'rgba(255,23,68,0.05)' : t === 'warning' ? 'rgba(255,171,0,0.04)' : 'rgba(0,229,255,0.03)';
const borderColor = t => t === 'critical' ? 'rgba(255,23,68,0.25)' : t === 'warning' ? 'rgba(255,171,0,0.2)' : 'rgba(0,229,255,0.15)';
const lineColor = t => t === 'critical' ? 'var(--accent-red)' : t === 'warning' ? 'var(--accent-amber)' : 'var(--accent-cyan)';

export default function AlertsPage() {
  const [filter, setFilter] = useState('all');
  const [dismissed, setDismissed] = useState([]);

  const filtered = ALERTS.filter(a => {
    if (dismissed.includes(a.id)) return false;
    if (filter !== 'all' && a.type !== filter) return false;
    return true;
  });

  return (
    <div className="page-enter">
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }} className="metrics-grid">
        {[
          { label: 'CRITICAL', count: ALERTS.filter(a => a.type === 'critical').length, color: 'var(--accent-red)' },
          { label: 'WARNINGS', count: ALERTS.filter(a => a.type === 'warning').length, color: 'var(--accent-amber)' },
          { label: 'INFO', count: ALERTS.filter(a => a.type === 'info').length, color: 'var(--accent-cyan)' },
          { label: 'RESOLVED', count: dismissed.length, color: 'var(--accent-green)' }
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.08em' }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {['all', 'critical', 'warning', 'info'].map(t => (
          <div key={t} className={`tab ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'all' ? 'All Alerts' : t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(alert => (
          <div key={alert.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px',
            borderRadius: '14px', border: `1px solid ${borderColor(alert.type)}`,
            background: bgColor(alert.type), position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: lineColor(alert.type), boxShadow: alert.type === 'critical' ? 'var(--glow-red)' : 'none' }} />
            <div style={{ fontSize: '20px', marginTop: '2px', flexShrink: 0 }}>{alert.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{alert.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>{alert.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{alert.time}</div>
                <span style={{
                  fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: '20px', border: `1px solid ${borderColor(alert.type)}`,
                  color: lineColor(alert.type), background: bgColor(alert.type)
                }}>{alert.type.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {alert.action && (
                <button style={{ fontSize: '12px', padding: '6px 12px', background: 'transparent', border: `1px solid ${lineColor(alert.type)}`, borderRadius: '8px', color: lineColor(alert.type), cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                  {alert.action}
                </button>
              )}
              <button onClick={() => setDismissed(prev => [...prev, alert.id])}
                style={{ fontSize: '12px', padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-dim)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                Dismiss
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
            No active alerts in this category
          </div>
        )}
      </div>
    </div>
  );
}
