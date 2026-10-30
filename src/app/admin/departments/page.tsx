'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import Modal from '@/components/Modal';
import { Building2, Plus, Users, Shield, RefreshCw } from 'lucide-react';
import { AuthUser } from '@/types';

export default function DepartmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Create Department Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    description: '',
  });

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

      const res = await fetch('/api/schools/departments');
      if (res.ok) {
        const d = await res.json();
        setDepartments(d.data);
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

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');

    try {
      const res = await fetch('/api/schools/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDept),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || 'Failed to create department');

      setIsCreateOpen(false);
      setNewDept({ name: '', code: '', description: '' });
      loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Departments & Faculties"
          subtitle="Institutional Governance"
        />

        <div className="page-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Department Directory
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Organize academic faculties, designate Heads of Department (HOD), and scope staff workflows.
              </p>
            </div>
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Create Department</span>
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Code</th>
                  <th>Head of Department (HOD)</th>
                  <th>Faculty Members</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--brand-primary-light)',
                            color: 'var(--brand-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Building2 size={16} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{d.name}</span>
                      </div>
                    </td>
                    <td><span className="command-kbd">{d.code}</span></td>
                    <td>
                      <span className="badge badge-info">{d.hodName}</span>
                    </td>
                    <td><strong>{d.teachersCount} Faculty</strong></td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{d.description || '—'}</td>
                    <td>
                      <span className="badge badge-success">{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Department Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Department"
      >
        <form onSubmit={handleCreateDept}>
          {formError && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '13px', marginBottom: 16 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Department Name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Computer Science & AI"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Code *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. DEPT-CS"
                value={newDept.code}
                onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Algorithms, Coding Labs, and Emerging Technologies"
              value={newDept.description}
              onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Saving...' : 'Create Department'}
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
