'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import Modal from '@/components/Modal';
import { Shield, Plus, Check, X, Users, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { AuthUser } from '@/types';

export default function RolesAndPermissionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Create Custom Role Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [newRole, setNewRole] = useState({
    name: 'Junior Maths Teacher',
    code: 'JUNIOR_MATH_TEACHER',
    description: 'Faculty handling Grade 6-8 Mathematics with attendance and homework authority',
    departmentId: '',
    permissionIds: [] as string[],
  });

  // Selected Role for Matrix inspection
  const [selectedRole, setSelectedRole] = useState<any>(null);

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

      const res = await fetch('/api/schools/roles');
      if (res.ok) {
        const d = await res.json();
        setRoles(d.data.roles);
        setCatalog(d.data.catalog);
        if (d.data.roles.length > 0 && !selectedRole) {
          setSelectedRole(d.data.roles[0]);
        }
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

  // Group permission catalog by moduleKey
  const groupedCatalog = catalog.reduce((acc: any, p: any) => {
    if (!acc[p.moduleKey]) acc[p.moduleKey] = [];
    acc[p.moduleKey].push(p);
    return acc;
  }, {});

  const handleTogglePermission = (permissionId: string) => {
    if (newRole.permissionIds.includes(permissionId)) {
      setNewRole({
        ...newRole,
        permissionIds: newRole.permissionIds.filter((id) => id !== permissionId),
      });
    } else {
      setNewRole({
        ...newRole,
        permissionIds: [...newRole.permissionIds, permissionId],
      });
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');

    try {
      const res = await fetch('/api/schools/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || 'Failed to create role');

      setIsCreateOpen(false);
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
          title="Dynamic Role Builder & Granular Matrix"
          subtitle="Odoo & Frappe-Style Security Profiles"
        />

        <div className="page-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Role & Permission Matrix
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Construct custom operational roles with granular Module-Action capabilities and scoped restrictions.
              </p>
            </div>
            <button
              onClick={() => {
                // Preset with initial permission IDs for Junior Maths Teacher
                const mathPerms = catalog
                  .filter((p) =>
                    (p.moduleKey === 'students' && p.action === 'VIEW') ||
                    (p.moduleKey === 'attendance' && ['VIEW', 'MARK'].includes(p.action)) ||
                    (p.moduleKey === 'homework') ||
                    (p.moduleKey === 'examinations' && ['VIEW', 'ENTER_MARKS'].includes(p.action))
                  )
                  .map((p) => p.id);
                setNewRole({
                  name: 'Junior Maths Teacher',
                  code: 'JUNIOR_MATH_TEACHER',
                  description: 'Faculty handling Grade 6-8 Mathematics with attendance and homework authority',
                  departmentId: '',
                  permissionIds: mathPerms,
                });
                setIsCreateOpen(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Create Custom Role</span>
            </button>
          </div>

          {/* Master-Detail Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
            {/* Roles Sidebar List */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12, padding: '0 8px' }}>
                Configured Roles ({roles.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {roles.map((r) => {
                  const isSelected = selectedRole?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRole(r)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? 'var(--brand-primary-light)' : 'transparent',
                        borderColor: isSelected ? 'var(--brand-primary-border)' : 'transparent',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: isSelected ? 'var(--brand-primary)' : 'var(--text-main)' }}>
                          {r.name}
                        </span>
                        {r.isSystem ? (
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>System</span>
                        ) : (
                          <span className="badge badge-info" style={{ fontSize: '10px' }}>Custom</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        <span>{r.usersCount} Assigned Users</span>
                        <span>•</span>
                        <span>{r.grantedPermissionsCount} Grants</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Role Permission Matrix View */}
            <div className="card">
              {selectedRole ? (
                <div>
                  <div className="card-header" style={{ marginBottom: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 className="card-title">{selectedRole.name}</h2>
                        <span className="command-kbd">{selectedRole.code}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>
                        {selectedRole.description || 'Custom institutional role profile'}
                      </p>
                    </div>
                    <div>
                      <span className="badge badge-success">
                        {selectedRole.grantedPermissionsCount} Active Permissions
                      </span>
                    </div>
                  </div>

                  {/* Matrix Table */}
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Module Resource</th>
                          <th>Capability Action</th>
                          <th>Action Name & Scope</th>
                          <th style={{ textAlign: 'center' }}>Granted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalog.map((perm) => {
                          const isGranted = selectedRole.grantedPermissionIds?.includes(perm.id);
                          return (
                            <tr key={perm.id}>
                              <td style={{ fontWeight: 600 }}>
                                <span className="command-kbd">{perm.moduleKey}</span>
                              </td>
                              <td>
                                <span className="badge badge-neutral">{perm.action}</span>
                              </td>
                              <td>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>{perm.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{perm.description}</div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {isGranted ? (
                                  <div
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--status-success-bg)',
                                      color: 'var(--status-success)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Check size={16} />
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--bg-surface-subtle)',
                                      color: 'var(--text-subtle)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <X size={14} />
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Select a role from the left pane to view its permission matrix.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Custom Role Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Custom Role & Permission Matrix Builder"
        maxWidth="800px"
      >
        <form onSubmit={handleCreateRole}>
          {formError && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '13px', marginBottom: 16 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Role Title *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Junior Maths Teacher"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">System Code *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. JUNIOR_MATH_TEACHER"
                value={newRole.code}
                onChange={(e) => setNewRole({ ...newRole, code: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role Description & Responsibilities</label>
            <input
              type="text"
              className="input"
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
            />
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Select Granular Permissions ({newRole.permissionIds.length} Granted)
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                Toggle module actions for this operational profile
              </span>
            </div>

            <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>Grant</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((p) => {
                    const checked = newRole.permissionIds.includes(p.id);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleTogglePermission(p.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="checkbox-toggle"
                            checked={checked}
                            onChange={() => handleTogglePermission(p.id)}
                          />
                        </td>
                        <td><span className="command-kbd">{p.moduleKey}</span></td>
                        <td><span className="badge badge-neutral">{p.action}</span></td>
                        <td style={{ fontSize: '13px' }}>{p.name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Saving Role...' : 'Save & Publish Role'}
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
