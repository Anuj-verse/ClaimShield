import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-void)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '14px', letterSpacing: '0.1em' }}>
          INITIALIZING SYSTEM...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Sidebar />
      <main style={{
        marginLeft: '72px',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)'
      }}>
        <Topbar />
        <div className="content" style={{ padding: '28px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
