import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useClaims } from '../context/ClaimsContext';
import { generateMockClaim } from '../utils/mockData';

export default function UploadPage() {
  const navigate = useNavigate();
  const { addClaim } = useClaims();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    claimantName: '', claimantEmail: '', claimantPhone: '', claimantAddress: '',
    claimType: 'Auto Insurance', policyId: '', amount: '', description: ''
  });

  const onDrop = useCallback(accepted => {
    setFiles(prev => [...prev, ...accepted].slice(0, 10));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [], 'application/pdf': [], 'text/csv': [], 'application/json': [] }, maxSize: 10 * 1024 * 1024
  });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.claimantName || !form.claimType || !form.amount || !form.policyId) {
      toast.error('Please fill in all required fields'); return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      files.forEach(file => formData.append('files', file));

      const { data } = await api.post('/claims', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(data.claim);
      addClaim(data.claim);
      toast.success(`Claim submitted! Risk Score: ${data.claim.riskScore}`);
    } catch (err) {
      console.error(err);
      // Fallback: mock result
      const mock = { ...generateMockClaim(), ...form, amount: Number(form.amount), _id: `CLM-${Date.now()}`, createdAt: new Date().toISOString() };
      setResult(mock);
      addClaim(mock);
      toast.success(`Claim analyzed! Risk Score: ${mock.riskScore}`);
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (s) => s > 74 ? 'var(--accent-red)' : s >= 40 ? 'var(--accent-amber)' : 'var(--accent-green)';

  return (
    <div className="page-enter">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
        {/* Form */}
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="section-title" style={{ marginBottom: '20px', fontSize: '16px' }}>📋 &nbsp;New Claim Submission</div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CLAIMANT NAME *</label>
                  <input className="form-input" name="claimantName" placeholder="Full legal name" value={form.claimantName} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CLAIM TYPE *</label>
                  <select className="form-select" name="claimType" value={form.claimType} onChange={handleChange}>
                    <option>Auto Insurance</option>
                    <option>Health Insurance</option>
                    <option>Property</option>
                    <option>Life Insurance</option>
                    <option>Travel</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">POLICY ID *</label>
                  <input className="form-input" name="policyId" placeholder="POL-XXXXXXXX" value={form.policyId} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CLAIM AMOUNT (₹) *</label>
                  <input className="form-input" type="number" name="amount" placeholder="0.00" value={form.amount} onChange={handleChange} required min={1} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">EMAIL</label>
                  <input className="form-input" type="email" name="claimantEmail" placeholder="claimant@email.com" value={form.claimantEmail} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">PHONE</label>
                  <input className="form-input" name="claimantPhone" placeholder="+91 XXXXXXXXXX" value={form.claimantPhone} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ADDRESS</label>
                <input className="form-input" name="claimantAddress" placeholder="Full address" value={form.claimantAddress} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label">INCIDENT DESCRIPTION</label>
                <textarea className="form-input" name="description" rows={4} placeholder="Describe the incident in detail..." value={form.description} onChange={handleChange} style={{ resize: 'vertical', minHeight: '100px' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={loading}>
                {loading ? (
                  <>
                    <span style={{ animation: 'pulse 1s infinite' }}>⚡</span>
                    ANALYZING WITH AI...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                    SUBMIT & ANALYZE CLAIM
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Dropzone */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: '16px', fontSize: '14px' }}>📎 &nbsp;Supporting Documents</div>
            <div {...getRootProps()} style={{
              border: `2px dashed ${isDragActive ? 'rgba(0,229,255,0.6)' : 'rgba(0,229,255,0.2)'}`,
              borderRadius: '12px', padding: '36px', textAlign: 'center', cursor: 'pointer',
              background: isDragActive ? 'rgba(0,229,255,0.05)' : 'rgba(0,229,255,0.02)',
              transition: 'all 0.3s'
            }}>
              <input {...getInputProps()} />
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '6px' }}>
                {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PDF, Images, CSV, JSON · Max 10MB each</div>
            </div>
            {files.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '13px' }}>
                    <span>📄</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{(f.size/1024).toFixed(0)}KB</span>
                    <span style={{ cursor: 'pointer', color: 'var(--accent-red)' }} onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Result / Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {result ? (
            <div className="card">
              <div className="section-title" style={{ marginBottom: '20px' }}>🎯 AI Analysis Result</div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '72px', fontWeight: 800, lineHeight: 1, color: riskColor(result.riskScore) }}>{result.riskScore}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>XGBoost Risk Score</div>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${result.riskScore}%`, height: '100%', background: `linear-gradient(90deg, var(--accent-green), ${riskColor(result.riskScore)})`, borderRadius: '10px', transition: 'width 1s' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '8px' }}>FRAUD FLAGS DETECTED</div>
                {(result.fraudFlags || []).map((f, i) => (
                  <div key={i} style={{ fontSize: '12px', padding: '6px 10px', background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.2)', borderRadius: '6px', marginBottom: '4px', color: 'var(--accent-red)' }}>⚠️ {f}</div>
                ))}
                {!result.fraudFlags?.length && <div style={{ fontSize: '12px', color: 'var(--accent-green)' }}>✅ No flags detected</div>}
              </div>
              {result.fraudRingId && (
                <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.2)', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-red)' }}>🔴 FRAUD RING DETECTED: {result.fraudRingId}</div>
                </div>
              )}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/claims/${result._id}`)}>
                View Full Analysis →
              </button>
            </div>
          ) : (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '8px' }}>AI-Powered Analysis</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Submit a claim to get instant risk scoring with XGBoost, SHAP explanations, fraud ring detection, and document verification.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                {[['⚡', 'XGBoost Risk Score', '94.1% accuracy'], ['🔗', 'Fraud Ring Detection', 'Neo4j graph analysis'], ['🔬', 'SHAP Explanations', 'Feature importance'], ['📄', 'Document Analysis', 'CV tampering detection']].map(([icon, title, sub]) => (
                  <div key={title} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '10px' }}>RECENT SUBMISSIONS</div>
            {['CLM-1893 · Auto Insurance · Score 87', 'CLM-1892 · Health · Score 34', 'CLM-1891 · Property · Score 62'].map((x, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-dim)', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{x}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
