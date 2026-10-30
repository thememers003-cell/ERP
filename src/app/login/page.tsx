'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Shield, UserCheck, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('superadmin@nexedu.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const targetEmail = customEmail || email;
    const targetPassword = customPass || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      if (data.data.redirectUrl) {
        router.push(data.data.redirectUrl);
      } else if (data.data.isSuperAdmin) {
        router.push('/super-admin');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    { label: 'Super Admin', email: 'superadmin@nexedu.com', pass: 'admin123', role: 'Platform Global', icon: Shield, color: '#3b82f6' },
    { label: 'School Owner', email: 'owner@greenvalley.edu', pass: 'password123', role: 'GVIS Full Access', icon: Building2, color: '#10b981' },
    { label: 'Maths HOD', email: 'dr.sharma@greenvalley.edu', pass: 'password123', role: 'Head of Mathematics', icon: GraduationCap, color: '#8b5cf6' },
    { label: 'Junior Maths Teacher', email: 'rahul.verma@greenvalley.edu', pass: 'password123', role: 'Custom Role (Scoped)', icon: UserCheck, color: '#f59e0b' },
    { label: 'Accountant', email: 'accountant@greenvalley.edu', pass: 'password123', role: 'Finance & Fees', icon: Sparkles, color: '#ec4899' },
    { label: 'Student', email: 'aarav.patel@student.greenvalley.edu', pass: 'password123', role: 'Learner Portal', icon: GraduationCap, color: '#06b6d4' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '24px',
        backgroundImage: 'radial-gradient(ellipse at 50% -20%, var(--brand-primary-light), transparent 70%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--brand-primary)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              marginBottom: '16px',
            }}
          >
            <GraduationCap size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            NexEdu OS
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Next-Generation Multi-Tenant Education SaaS Platform
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={(e) => handleLogin(e)}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@school.edu"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-subtle)',
              marginBottom: '14px',
              textAlign: 'center',
            }}
          >
            Instant 1-Click Role Switcher (Seeded Demo Data)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {quickLogins.map((ql, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setEmail(ql.email);
                  setPassword(ql.pass);
                  handleLogin(undefined, ql.email, ql.pass);
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  height: 'auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                  <ql.icon size={13} color={ql.color} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {ql.label}
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
                  {ql.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
