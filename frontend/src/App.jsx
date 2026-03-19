import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClaimsFeedPage from './pages/ClaimsFeedPage';
import UploadPage from './pages/UploadPage';
import ClaimDetailPage from './pages/ClaimDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-dim)',
            borderRadius: '12px',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          },
          success: {
            iconTheme: { primary: 'var(--accent-green)', secondary: 'var(--bg-card)' },
            style: { borderColor: 'rgba(0,230,118,0.3)' }
          },
          error: {
            iconTheme: { primary: 'var(--accent-red)', secondary: 'var(--bg-card)' },
            style: { borderColor: 'rgba(255,23,68,0.3)' }
          }
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/claims" element={<ClaimsFeedPage />} />
          <Route path="/claims/:id" element={<ClaimDetailPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
