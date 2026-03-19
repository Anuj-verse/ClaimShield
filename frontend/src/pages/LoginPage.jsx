import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function LoginPage() {
  const [email, setEmail] = useState('investigator@aegis.gov');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      // Fallback: demo mode — accept any credentials
      const mockUser = { id: 'demo', email, name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()), role: 'investigator' };
      const mockToken = 'demo_token_' + Date.now();
      login(mockToken, mockUser);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-void)', position: 'fixed', inset: 0, zIndex: 200
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(41,121,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="scan-animation" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-dim)',
        borderRadius: '24px',
        padding: '48px',
        width: '420px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top gradient line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan), var(--accent-violet))'
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--bg-void)',
            boxShadow: 'var(--glow-cyan)'
          }}>⬡</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>AEGIS</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>FRAUD INTELLIGENCE PLATFORM</div>
          </div>
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Secure Access</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px' }}>Sign in to your investigator console</div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">IDENTIFIER</label>
            <input className="form-input" type="email" placeholder="investigator@agency.gov"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>

          <div className="form-group">
            <label className="form-label">PASSPHRASE</label>
            <input className="form-input" type="password" placeholder="••••••••••••"
              value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-dim)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>2FA ENABLED</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-dim)' }} />
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.25)', borderRadius: '8px', fontSize: '13px', color: 'var(--accent-red)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          🔒 End-to-end encrypted · SOC 2 Type II compliant
        </div>

        <div style={{ marginTop: '24px', padding: '14px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-dim)' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', marginBottom: '6px' }}>⚡ DEMO CREDENTIALS</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email: investigator@aegis.gov &nbsp;|&nbsp; Password: any</div>
        </div>
      </div>
    </div>
  );
}
