'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import MetricCard from '@/components/MetricCard';
import Modal from '@/components/Modal';
import {
  Building2,
  Users,
  GraduationCap,
  CreditCard,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { AuthUser } from '@/types';

export default function SuperAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [newSchool, setNewSchool] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    schoolType: 'K12',
    primaryColor: '#1d4ed8',
    accentColor: '#059669',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPassword: 'password123',
  });

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.data);

      if (!meData.data.isSuperAdmin) {
        if (meData.data.roles?.includes('STUDENT')) {
          router.replace('/student');
        } else {
          router.replace('/admin');
        }
        return;
      }

      // Fetch stats and schools
      const [statsRes, schoolsRes] = await Promise.all([
        fetch('/api/super-admin/stats'),
        fetch(`/api/super-admin/schools?search=${encodeURIComponent(search)}&status=${statusFilter}`),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s.data);
      }

      if (schoolsRes.ok) {
        const sc = await schoolsRes.json();
        setSchools(sc.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');

    try {
      const res = await fetch('/api/super-admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchool),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create school');

      setIsModalOpen(false);
      setNewSchool({
        name: '',
        code: '',
        email: '',
        phone: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        schoolType: 'K12',
        primaryColor: '#1d4ed8',
        accentColor: '#059669',
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: '',
        ownerPassword: 'password123',
      });
      loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (schoolId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await fetch(`/api/super-admin/schools/${schoolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImpersonate = async (schoolId: string) => {
    try {
      const res = await fetch(`/api/super-admin/schools/${schoolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'IMPERSONATE' }),
      });
      if (res.ok) {
        router.push('/admin');
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
          title="Super Admin Platform"
          subtitle="Multi-Tenant Control Plane"
        />

        <div className="page-body">
          {/* Header Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Platform Control Center
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Global multi-tenant governance, subscription licensing, and cross-tenant health metrics.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Onboard New School</span>
            </button>
          </div>

          {/* Metric KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <MetricCard
              label="Total Schools"
              value={stats?.kpis?.totalSchools ?? '-'}
              subtext={`${stats?.kpis?.activeSchools ?? 0} active institutions`}
              icon={Building2}
              trend="+12%"
              trendPositive={true}
            />
            <MetricCard
              label="Enrolled Students"
              value={stats?.kpis?.totalStudents ?? '-'}
              subtext="Across all tenants"
              icon={Users}
            />
            <MetricCard
              label="Faculty & Staff"
              value={stats?.kpis?.totalTeachers ?? '-'}
              subtext="Active instructors"
              icon={GraduationCap}
            />
            <MetricCard
              label="Monthly SaaS Revenue"
              value={`$${stats?.kpis?.monthlyRevenue ?? 0}`}
              subtext="Platform recurring billings"
              icon={CreditCard}
              trend="+18.4%"
              trendPositive={true}
            />
          </div>

          {/* Filter & Search Bar */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
                <Search size={18} color="var(--text-subtle)" />
                <input
                  type="text"
                  placeholder="Search by school name, code, or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input"
                  style={{ border: 'none', backgroundColor: 'transparent', padding: '6px 0' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="TRIAL">Trial</option>
                </select>

                <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* School Directory Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>School Institution</th>
                  <th>Code</th>
                  <th>Location</th>
                  <th>Students</th>
                  <th>Teachers</th>
                  <th>Plan Tier</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No school institutions match the current filters.
                    </td>
                  </tr>
                ) : (
                  schools.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '6px',
                              backgroundColor: s.primaryColor || 'var(--brand-primary)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px',
                            }}
                          >
                            {s.code.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{s.slug}.nexedu.io</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="command-kbd">{s.code}</span>
                      </td>
                      <td>{s.city ? `${s.city}, ${s.country}` : s.country}</td>
                      <td><strong>{s.studentsCount}</strong></td>
                      <td><strong>{s.teachersCount}</strong></td>
                      <td>
                        <span className="badge badge-info">{s.planName}</span>
                      </td>
                      <td>
                        <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleImpersonate(s.id)}
                            className="btn btn-secondary btn-sm"
                            title="Enter Tenant Context as Owner"
                          >
                            <ExternalLink size={13} />
                            <span>Impersonate</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(s.id, s.status)}
                            className={`btn btn-sm ${s.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'}`}
                          >
                            {s.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Onboarding Wizard Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard New School Institution"
      >
        <form onSubmit={handleCreateSchool}>
          {formError && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '13px', marginBottom: 16 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">School Name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. St. Xavier International Academy"
                value={newSchool.name}
                onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">School Code *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. SXIA"
                value={newSchool.code}
                onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Official Email</label>
              <input
                type="email"
                className="input"
                placeholder="admin@school.edu"
                value={newSchool.email}
                onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Official Phone</label>
              <input
                type="text"
                className="input"
                placeholder="+91 98765 43210"
                value={newSchool.phone}
                onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="input"
                value={newSchool.city}
                onChange={(e) => setNewSchool({ ...newSchool, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                className="input"
                value={newSchool.state}
                onChange={(e) => setNewSchool({ ...newSchool, state: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                type="text"
                className="input"
                value={newSchool.country}
                onChange={(e) => setNewSchool({ ...newSchool, country: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
              Institution Owner Credentials
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Owner First Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="First Name"
                  value={newSchool.ownerFirstName}
                  onChange={(e) => setNewSchool({ ...newSchool, ownerFirstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Last Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Last Name"
                  value={newSchool.ownerLastName}
                  onChange={(e) => setNewSchool({ ...newSchool, ownerLastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Owner Login Email *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="owner@school.edu"
                  value={newSchool.ownerEmail}
                  onChange={(e) => setNewSchool({ ...newSchool, ownerEmail: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Password *</label>
                <input
                  type="password"
                  className="input"
                  value={newSchool.ownerPassword}
                  onChange={(e) => setNewSchool({ ...newSchool, ownerPassword: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Provisioning...' : 'Provision School Tenant'}
            </button>
          </div>
        </form>
      </Modal>

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={user?.isSuperAdmin}
      />
    </div>
  );
}
