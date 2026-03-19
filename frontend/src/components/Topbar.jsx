import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_INFO = {
  '/': { title: 'Fraud Intelligence Overview', sub: 'LIVE MONITORING · Q1 2025' },
  '/claims': { title: 'Claims Feed', sub: 'ALL CLAIMS · PAGINATED' },
  '/upload': { title: 'Submit New Claim', sub: 'UPLOAD & ANALYZE' },
  '/analytics': { title: 'Analytics & Reports', sub: 'TREND ANALYSIS · 30 DAYS' },
  '/alerts': { title: 'System Alerts', sub: 'REAL-TIME NOTIFICATIONS' }
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathBase = '/' + location.pathname.split('/')[1];
  const info = PAGE_INFO[pathBase] || PAGE_INFO['/'];

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid var(--border-dim)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: '20px',
      background: 'rgba(6,8,16,0.8)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
        {info.title}
      </div>
      <span style={{
        fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
        background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-dim)'
      }}>
        {info.sub}
      </span>
      <div className="live-indicator">
        <div className="live-dot" />
        LIVE
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="icon-btn" title="System Status" onClick={() => {}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div className="icon-btn" title="Alerts" onClick={() => navigate('/alerts')} style={{ position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-red)', boxShadow: 'var(--glow-red)' }} />
        </div>
      </div>
    </header>
  );
}
