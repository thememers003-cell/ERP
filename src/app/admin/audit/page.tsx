'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import { Layers, Shield, Clock, RefreshCw } from 'lucide-react';
import { AuthUser } from '@/types';

export default function AuditTrailPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

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

      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const d = await res.json();
        setLogs(d.data);
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

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Audit Trail & Security Ledger"
          subtitle="Non-Repudiation Security & Entity History"
        />

        <div className="page-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                System Audit Ledger
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Immutable event stream of security events, administrative updates, and institutional mutations.
              </p>
            </div>
            <button onClick={loadData} className="btn btn-secondary">
              <RefreshCw size={14} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Resource Target</th>
                  <th>Actor User</th>
                  <th>Tenant Domain</th>
                  <th>Origin IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-info">{log.action}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.resource}</td>
                    <td>
                      <div>{log.actorName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{log.actorEmail}</div>
                    </td>
                    <td>{log.schoolName}</td>
                    <td><span className="command-kbd">{log.ipAddress}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
