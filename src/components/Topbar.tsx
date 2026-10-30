'use client';

import React, { useState } from 'react';
import { Search, Moon, Sun, Bell, Command, ChevronDown, MessageSquare, Shield, Sparkles } from 'lucide-react';
import { AuthUser } from '@/types';

interface TopbarProps {
  user: AuthUser | null;
  onOpenCommand: () => void;
  title?: string;
  subtitle?: string;
}

export default function Topbar({ user, onOpenCommand, title, subtitle }: TopbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const roleLabel = user?.isSuperAdmin
    ? 'Super Admin'
    : user?.roles?.includes('STUDENT')
    ? 'Student'
    : user?.roles?.includes('TEACHER') || user?.roles?.includes('SUBJECT_TEACHER')
    ? 'Faculty'
    : user?.roles?.[0]?.replace(/_/g, ' ') || 'Admin';

  return (
    <header className="topbar" style={{ height: '72px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
      {/* Left: Location / Scope Pill Dropdown (matching reference screenshot) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
          }}
          title="Campus Location and Academic Session"
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>{user?.schoolName ? `${user.schoolName.slice(0, 24)}...` : 'Campus Demonstration 1'}</span>
          <ChevronDown size={14} color="var(--text-muted)" />
        </div>

        {title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px' }}>
            <span style={{ color: 'var(--text-subtle)' }}>/</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{title}</span>
          </div>
        )}
      </div>

      {/* Right: User Greeting & Badges (exact luxury layout from screenshot) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* User Greeting Block */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            Hello, {user?.firstName || 'Aarav'}! 👋
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Signed in to <strong style={{ color: 'var(--text-main)' }}>{user?.schoolName || 'NEXEDU ERP NETWORK'}</strong>
          </div>
        </div>

        {/* Dual Notification Action Badges from Screenshot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Messages Badge (Amber) */}
          <button
            onClick={onOpenCommand}
            title="Messages & Communication"
            style={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.2s ease',
            }}
          >
            <MessageSquare size={17} color="#d97706" />
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: '#f59e0b',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                width: 17,
                height: 17,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #fff',
              }}
            >
              3
            </span>
          </button>

          {/* Alerts Badge (Cyan) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              title="System Alerts & Notifications"
              style={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.2s ease',
              }}
            >
              <Bell size={17} color="#0284c7" />
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#0ea5e9',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 800,
                  width: 17,
                  height: 17,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                }}
              >
                2
              </span>
            </button>

            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  width: 320,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '16px',
                  zIndex: 50,
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span>System Notifications</span>
                  <span className="badge badge-info" style={{ fontSize: '10px' }}>2 new</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: '12px', padding: '10px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 8, borderLeft: '3px solid #10b981' }}>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>Attendance Recorded</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>Class 8-A attendance roster synced successfully.</div>
                  </div>
                  <div style={{ fontSize: '12px', padding: '10px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 8, borderLeft: '3px solid #0ea5e9' }}>
                    <div style={{ fontWeight: 700, color: '#0ea5e9' }}>Receipt Issued</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>Term 2 tuition fee paid and official voucher verified.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Find (Command+K) */}
          <button
            onClick={onOpenCommand}
            title="Search shortcuts (Ctrl+K)"
            style={{
              height: 38,
              padding: '0 12px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <Search size={14} />
            <span style={{ fontSize: '11px', padding: '1px 5px', backgroundColor: 'var(--bg-surface)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>⌘K</span>
          </button>

          {/* Theme Mode */}
          <button
            onClick={toggleTheme}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            style={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)',
            }}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Rounded Avatar from Screenshot */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              backgroundColor: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
              color: '#334155',
              border: '2px solid #fff',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {user?.firstName ? user.firstName[0] : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
