'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import { Settings, Palette, Layers, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthUser, ModuleDefinition } from '@/types';

export default function SchoolSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'modules'>('branding');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Branding State
  const [branding, setBranding] = useState({
    name: '',
    phone: '',
    email: '',
    primaryColor: '#1d4ed8',
    accentColor: '#059669',
    city: '',
    address: '',
  });

  // Modules State
  const [modules, setModules] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      const roles = meData.data?.roles || [];
      if (roles.includes('STUDENT') || roles.includes('PARENT')) {
        router.replace('/student');
        return;
      }
      const isFaculty = roles.some((r: string) =>
        ['TEACHER', 'SUBJECT_TEACHER', 'JUNIOR_MATH_TEACHER', 'HOD', 'FACULTY'].includes(r)
      );
      if (isFaculty) {
        router.replace('/faculty');
        return;
      }
      setUser(meData.data);

      const [schoolRes, modRes] = await Promise.all([
        fetch('/api/schools/settings'),
        fetch('/api/schools/modules'),
      ]);

      if (schoolRes.ok) {
        const s = await schoolRes.json();
        setBranding({
          name: s.data.name || '',
          phone: s.data.phone || '',
          email: s.data.email || '',
          primaryColor: s.data.primaryColor || '#1d4ed8',
          accentColor: s.data.accentColor || '#059669',
          city: s.data.city || '',
          address: s.data.address || '',
        });
      }

      if (modRes.ok) {
        const m = await modRes.json();
        setModules(m.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/schools/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });

      if (res.ok) {
        // Dynamically update CSS custom properties immediately
        document.documentElement.style.setProperty('--brand-primary', branding.primaryColor);
        document.documentElement.style.setProperty('--brand-accent', branding.accentColor);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleModule = async (moduleKey: string, currentEnabled: boolean) => {
    try {
      const res = await fetch('/api/schools/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleKey, isEnabled: !currentEnabled }),
      });

      if (res.ok) {
        setModules((prev) =>
          prev.map((m) => (m.key === moduleKey ? { ...m, isEnabled: !currentEnabled } : m))
        );
        // Refresh meData session modules
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="School Customizer & Modules"
          subtitle="Branding & Pluggable Architecture"
        />

        <div className="page-body">
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Institutional Settings & Modules
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Tailor school themes, institutional colors, and toggle modular capabilities.
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-subtle)', marginBottom: 24 }}>
            <button
              onClick={() => setActiveTab('branding')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                fontSize: '13.5px',
                fontWeight: 600,
                color: activeTab === 'branding' ? 'var(--brand-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'branding' ? '2px solid var(--brand-primary)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              <Palette size={16} />
              <span>Theme & White-Label Branding</span>
            </button>

            <button
              onClick={() => setActiveTab('modules')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                fontSize: '13.5px',
                fontWeight: 600,
                color: activeTab === 'modules' ? 'var(--brand-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'modules' ? '2px solid var(--brand-primary)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              <Layers size={16} />
              <span>Pluggable ERP Modules ({modules.filter((m) => m.isEnabled).length} Active)</span>
            </button>
          </div>

          {activeTab === 'branding' ? (
            <div style={{ maxWidth: '800px' }}>
              <div className="card">
                <form onSubmit={handleSaveBranding}>
                  {savedSuccess && (
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--status-success-bg)',
                        color: 'var(--status-success)',
                        borderRadius: 6,
                        fontSize: '13px',
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Institutional branding and color theme successfully updated!</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">School Name</label>
                    <input
                      type="text"
                      className="input"
                      value={branding.name}
                      onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Primary Brand Color</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                          type="color"
                          value={branding.primaryColor}
                          onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                          style={{ width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          className="input"
                          value={branding.primaryColor}
                          onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Secondary Accent Color</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                          type="color"
                          value={branding.accentColor}
                          onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                          style={{ width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          className="input"
                          value={branding.accentColor}
                          onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Official Contact Phone</label>
                      <input
                        type="text"
                        className="input"
                        value={branding.phone}
                        onChange={(e) => setBranding({ ...branding, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Official Contact Email</label>
                      <input
                        type="email"
                        className="input"
                        value={branding.email}
                        onChange={(e) => setBranding({ ...branding, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary">
                      <Save size={16} />
                      <span>Save Branding Preferences</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {modules.map((m) => (
                <div key={m.key} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: m.isEnabled ? 'var(--brand-primary-light)' : 'var(--bg-surface-subtle)',
                            color: m.isEnabled ? 'var(--brand-primary)' : 'var(--text-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Layers size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {m.name}
                          </h3>
                          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                            {m.category}
                          </span>
                        </div>
                      </div>

                      {m.isCore ? (
                        <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                          Core (Mandatory)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleModule(m.key, m.isEnabled)}
                          className={`btn btn-sm ${m.isEnabled ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          {m.isEnabled ? 'Active' : 'Disabled'}
                        </button>
                      )}
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {m.description}
                    </p>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Key: {m.key}</span>
                    <span>Status: {m.isEnabled ? 'Active in Nav & APIs' : 'Inactive'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={user?.isSuperAdmin}
      />
    </div>
  );
}
