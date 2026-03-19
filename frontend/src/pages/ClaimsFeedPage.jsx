import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CLAIMS } from '../utils/mockData';
import api from '../api/axios';

const riskColor = (s) => s > 74 ? 'var(--accent-red)' : s >= 40 ? 'var(--accent-amber)' : 'var(--accent-green)';
const riskLabel = (s) => s > 74 ? 'HIGH' : s >= 40 ? 'MEDIUM' : 'LOW';
const statusColors = {
  pending: { color: 'var(--accent-amber)', bg: 'rgba(255,171,0,0.08)', border: 'rgba(255,171,0,0.3)' },
  under_review: { color: 'var(--accent-blue)', bg: 'rgba(41,121,255,0.08)', border: 'rgba(41,121,255,0.3)' },
  flagged: { color: 'var(--accent-red)', bg: 'rgba(255,23,68,0.08)', border: 'rgba(255,23,68,0.3)' },
  approved: { color: 'var(--accent-green)', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.3)' },
  rejected: { color: 'var(--text-secondary)', bg: 'rgba(107,122,158,0.08)', border: 'rgba(107,122,158,0.3)' }
};

export default function ClaimsFeedPage() {
  const [claims, setClaims] = useState(MOCK_CLAIMS);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/claims', { params: { search, riskLevel: riskFilter, claimType: typeFilter } })
      .then(r => setClaims(r.data.claims || MOCK_CLAIMS))
      .catch(() => {}); // stay with mock
  }, [search, riskFilter, typeFilter]);

  const filtered = claims.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.claimantName?.toLowerCase().includes(q) && !c._id?.toLowerCase().includes(q) && !c.policyId?.toLowerCase().includes(q)) return false;
    if (riskFilter === 'high' && c.riskScore <= 74) return false;
    if (riskFilter === 'medium' && (c.riskScore < 40 || c.riskScore > 74)) return false;
    if (riskFilter === 'low' && c.riskScore >= 40) return false;
    if (typeFilter && c.claimType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="page-enter">
      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '0 0 280px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}>🔍</span>
            <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search claims, IDs, names..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: '160px' }} value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
            <option value="">All Risk Levels</option>
            <option value="high">High Risk (&gt;75)</option>
            <option value="medium">Medium Risk (40-75)</option>
            <option value="low">Low Risk (&lt;40)</option>
          </select>
          <select className="form-select" style={{ width: '180px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Claim Types</option>
            <option>Auto Insurance</option>
            <option>Health Insurance</option>
            <option>Property</option>
            <option>Life Insurance</option>
            <option>Travel</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', alignSelf: 'center' }}>
              {filtered.length} results
            </span>
            <button className="btn-ghost" style={{ fontSize: '13px', padding: '9px 16px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
            <button className="btn-primary" style={{ fontSize: '13px', padding: '9px 16px' }} onClick={() => navigate('/upload')}>
              + New Claim
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>CLAIM ID</th>
              <th>CLAIMANT</th>
              <th>TYPE</th>
              <th>AMOUNT</th>
              <th>RISK SCORE</th>
              <th>FLAGS</th>
              <th>STATUS</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(claim => {
              const sc = statusColors[claim.status] || statusColors.pending;
              return (
                <tr key={claim._id} onClick={() => navigate(`/claims/${claim._id}`)}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-cyan)' }}>{claim._id}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{claim.claimantName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{claim.policyId}</div>
                  </td>
                  <td><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{claim.claimType}</span></td>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{Number(claim.amount).toLocaleString('en-IN')}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '40px', height: '4px', background: 'var(--bg-surface)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${claim.riskScore}%`, height: '100%', background: riskColor(claim.riskScore), borderRadius: '10px' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: riskColor(claim.riskScore), fontSize: '16px' }}>{claim.riskScore}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(claim.fraudFlags || []).slice(0, 1).map((f, i) => (
                        <span key={i} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,23,68,0.3)', background: 'rgba(255,23,68,0.08)', color: 'var(--accent-red)', whiteSpace: 'nowrap' }}>{f}</span>
                      ))}
                      {claim.fraudFlags?.length > 1 && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>+{claim.fraudFlags.length - 1}</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color }}>
                      {claim.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td><span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(claim.createdAt).toLocaleDateString()}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
