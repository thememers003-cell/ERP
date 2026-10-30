'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap, Users, CalendarCheck, FileText, Award, CreditCard, Settings, Shield, Clock, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
}

export default function CommandPalette({ isOpen, onClose, isSuperAdmin }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = [
    { label: 'Dashboard Overview', path: isSuperAdmin ? '/super-admin' : '/admin', icon: GraduationCap, category: 'Navigation' },
    { label: 'Weekly Timetable Builder & Slots', path: '/admin/timetable', icon: Clock, category: 'Academics' },
    { label: 'Student Weekly Class Timetable', path: '/student/timetable', icon: Clock, category: 'Academics' },
    { label: 'Faculty Course Allocation & Subject Assignments', path: '/admin/timetable?tab=allocations', icon: Users, category: 'Academics' },
    { label: 'Classes, Sections & Subjects Curriculum', path: '/admin/classes', icon: GraduationCap, category: 'Academics' },
    { label: 'Student Directory & Admissions', path: '/students', icon: Users, category: 'People' },
    { label: 'Teacher & Staff Directory', path: '/teachers', icon: Users, category: 'People' },
    { label: 'Attendance Roll Call Register', path: '/attendance', icon: CalendarCheck, category: 'Operations' },
    { label: 'Student Attendance Profile & Slip', path: '/student/attendance', icon: CalendarCheck, category: 'Academics' },
    { label: 'Homework & Assignments Center', path: '/homework', icon: FileText, category: 'Academics' },
    { label: 'Exams & Digital Gradebook', path: '/exams', icon: Award, category: 'Academics' },
    { label: 'Fees Invoicing & Payments', path: '/fees', icon: CreditCard, category: 'Finance' },
    { label: 'Departments & HODs', path: '/admin/departments', icon: GraduationCap, category: 'Academics' },
    { label: 'Dynamic Role Builder & Permission Matrix', path: '/admin/roles', icon: Shield, category: 'Security' },
    { label: 'School Brand & Modules Settings', path: '/admin/settings', icon: Settings, category: 'Settings' },
  ];

  if (isSuperAdmin) {
    commands.unshift(
      { label: 'Super Admin Portal', path: '/super-admin', icon: Shield, category: 'Platform' },
      { label: 'All Schools & Tenants', path: '/super-admin', icon: GraduationCap, category: 'Platform' }
    );
  }

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setSelectedIndex(0);
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(filtered[selectedIndex].path);
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-input-wrap">
          <Search size={20} color="var(--text-muted)" />
          <input
            type="text"
            className="command-input"
            placeholder="Type a command or jump to module..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
          />
          <button onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="var(--text-subtle)" />
          </button>
        </div>

        <div className="command-list">
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No commands matching "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`command-item ${selectedIndex === index ? 'active' : ''}`}
                  onClick={() => {
                    router.push(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Icon size={18} />
                  <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
                  <span className="command-kbd">{item.category}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
