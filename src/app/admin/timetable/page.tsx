'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import Modal from '@/components/Modal';
import {
  Calendar,
  Clock,
  GraduationCap,
  Users,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Printer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Building,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { AuthUser } from '@/types';

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
];

const DEFAULT_PERIODS = [
  { period: 1, label: 'Period 1', start: '08:30 AM', end: '09:15 AM' },
  { period: 2, label: 'Period 2', start: '09:15 AM', end: '10:00 AM' },
  { period: 3, label: 'Period 3', start: '10:00 AM', end: '10:45 AM' },
  { isBreak: true, label: 'Recess Break', start: '10:45 AM', end: '11:00 AM' },
  { period: 4, label: 'Period 4', start: '11:00 AM', end: '11:45 AM' },
  { period: 5, label: 'Period 5', start: '11:45 AM', end: '12:30 PM' },
  { isBreak: true, label: 'Lunch Break', start: '12:30 PM', end: '01:15 PM' },
  { period: 6, label: 'Period 6', start: '01:15 PM', end: '02:00 PM' },
  { period: 7, label: 'Period 7', start: '02:00 PM', end: '02:45 PM' },
  { period: 8, label: 'Period 8', start: '02:45 PM', end: '03:30 PM' },
];

function AdminTimetableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'TIMETABLE' | 'ALLOCATIONS'>('TIMETABLE');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Core Data
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);

  // Selection Filters for Timetable View
  const [viewMode, setViewMode] = useState<'CLASS' | 'TEACHER'>('CLASS');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  // Allocation Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState('ALL');
  const [filterTeacherStatus, setFilterTeacherStatus] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');

  // Messages & Alerts
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [slotForm, setSlotForm] = useState({
    id: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 'MONDAY',
    periodNumber: 1,
    startTime: '08:30 AM',
    endTime: '09:15 AM',
    roomNumber: '',
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    classId: '',
    sectionId: '',
    subjectId: '',
    teacherId: '',
  });

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyForm, setCopyForm] = useState({
    sourceClassId: '',
    sourceSectionId: '',
    targetClassId: '',
    targetSectionId: '',
  });

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'allocations') {
      setActiveTab('ALLOCATIONS');
    }
  }, [searchParams]);

  // Initial Load
  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        if (meData.data.roles?.includes('STUDENT')) {
          router.replace('/student');
          return;
        }
        setUser(meData.data);

        await refreshAllData();
      } catch (err) {
        console.error('Failed to initialize page:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const refreshAllData = async () => {
    try {
      const [assignRes, timeRes] = await Promise.all([
        fetch('/api/academics/assignments'),
        fetch('/api/academics/timetable'),
      ]);

      if (assignRes.ok) {
        const aData = await assignRes.json();
        setAssignments(aData.data.assignments || []);
        setClasses(aData.data.classes || []);
        setSubjects(aData.data.subjects || []);
        setTeachers(aData.data.teachers || []);

        // Pre-select first class and section if none selected
        if (!selectedClassId && aData.data.classes?.length > 0) {
          const firstClass = aData.data.classes[0];
          setSelectedClassId(firstClass.id);
          if (firstClass.sections?.length > 0) {
            setSelectedSectionId(firstClass.sections[0].id);
          }
        }
      }

      if (timeRes.ok) {
        const tData = await timeRes.json();
        setTimetableSlots(tData.data.slots || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage(null);
    }, 6000);
  };

  // Find currently selected class & section details
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentSection = currentClass?.sections?.find((s: any) => s.id === selectedSectionId);

  // When class changes, adjust section
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classes.find((c) => c.id === classId);
    if (cls && cls.sections?.length > 0) {
      setSelectedSectionId(cls.sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  // Open Add/Edit Slot Modal
  const openSlotModal = (day?: string, periodNumber?: number, existingSlot?: any) => {
    if (existingSlot) {
      setEditingSlot(existingSlot);
      setSlotForm({
        id: existingSlot.id,
        classId: existingSlot.classId,
        sectionId: existingSlot.sectionId,
        subjectId: existingSlot.subjectId,
        teacherId: existingSlot.teacherId || '',
        dayOfWeek: existingSlot.dayOfWeek,
        periodNumber: existingSlot.periodNumber,
        startTime: existingSlot.startTime,
        endTime: existingSlot.endTime,
        roomNumber: existingSlot.roomNumber || '',
      });
    } else {
      setEditingSlot(null);
      const defaultPeriod = DEFAULT_PERIODS.find((p) => p.period === periodNumber);
      setSlotForm({
        id: '',
        classId: selectedClassId,
        sectionId: selectedSectionId,
        subjectId: subjects[0]?.id || '',
        teacherId: '',
        dayOfWeek: day || 'MONDAY',
        periodNumber: periodNumber || 1,
        startTime: defaultPeriod?.start || '08:30 AM',
        endTime: defaultPeriod?.end || '09:15 AM',
        roomNumber: currentSection?.roomNumber || '',
      });
    }
    setIsSlotModalOpen(true);
  };

  // Automatically pre-fill teacher for the selected subject in slotForm
  const handleSlotSubjectChange = (subId: string) => {
    const matchingAssignment = assignments.find(
      (a) =>
        a.classId === slotForm.classId &&
        a.sectionId === slotForm.sectionId &&
        a.subjectId === subId &&
        a.teacherId
    );
    setSlotForm((prev) => ({
      ...prev,
      subjectId: subId,
      teacherId: matchingAssignment ? matchingAssignment.teacherId : prev.teacherId,
    }));
  };

  // Save Timetable Slot
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/academics/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        triggerAlert('error', data.error?.message || 'Failed to save timetable slot');
        return;
      }

      triggerAlert('success', editingSlot ? 'Period slot updated.' : 'Period slot added successfully.');
      setIsSlotModalOpen(false);
      await refreshAllData();
    } catch (err: any) {
      triggerAlert('error', err.message || 'Network error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Timetable Slot
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to remove this timetable period slot?')) return;
    try {
      const res = await fetch(`/api/academics/timetable?id=${slotId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        triggerAlert('success', 'Timetable slot removed.');
        await refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear entire section schedule
  const handleClearSection = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    if (!confirm(`Clear all scheduled periods for ${currentClass?.name} - ${currentSection?.name}?`)) return;
    try {
      const res = await fetch(
        `/api/academics/timetable?classId=${selectedClassId}&sectionId=${selectedSectionId}&action=CLEAR_SECTION`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        triggerAlert('success', 'Section timetable cleared.');
        await refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-generate standard schedule
  const handleAutoPopulate = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    if (
      !confirm(
        `Auto-populate standard 8-period weekly schedule for ${currentClass?.name} - ${currentSection?.name}? This will replace existing slots for this section.`
      )
    )
      return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/academics/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'POPULATE_DEFAULT',
          classId: selectedClassId,
          sectionId: selectedSectionId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerAlert('success', data.message || 'Weekly timetable generated!');
        await refreshAllData();
      } else {
        triggerAlert('error', data.error?.message || 'Failed to auto-populate');
      }
    } catch (e: any) {
      triggerAlert('error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Copy timetable from section to section
  const handleCopySection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/academics/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COPY_SECTION',
          ...copyForm,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerAlert('success', data.message || 'Schedule copied successfully.');
        setIsCopyModalOpen(false);
        await refreshAllData();
      } else {
        triggerAlert('error', data.error?.message || 'Failed to copy timetable');
      }
    } catch (err: any) {
      triggerAlert('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save Faculty-Subject Allocation
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/academics/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerAlert('success', 'Faculty course allocation saved.');
        setIsAssignModalOpen(false);
        await refreshAllData();
      } else {
        triggerAlert('error', data.error?.message || 'Failed to allocate faculty');
      }
    } catch (err: any) {
      triggerAlert('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick inline re-assignment of teacher
  const handleInlineAssignTeacher = async (classId: string, sectionId: string, subjectId: string, teacherId: string) => {
    try {
      const res = await fetch('/api/academics/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, sectionId, subjectId, teacherId }),
      });
      if (res.ok) {
        triggerAlert('success', 'Assigned teacher updated.');
        await refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered timetable slots for current view
  const currentSlots = useMemo(() => {
    if (viewMode === 'CLASS') {
      return timetableSlots.filter(
        (s) => s.classId === selectedClassId && s.sectionId === selectedSectionId
      );
    } else {
      return timetableSlots.filter((s) => s.teacherId === selectedTeacherId);
    }
  }, [timetableSlots, viewMode, selectedClassId, selectedSectionId, selectedTeacherId]);

  // Compute metrics
  const totalSlotsCount = timetableSlots.length;
  const totalAssignedTeachers = new Set(assignments.filter((a) => a.teacherId).map((a) => a.teacherId)).size;
  const unassignedCourseCount = assignments.filter((a) => !a.teacherId).length;

  // Filtered Allocations Table Data
  const filteredAllocations = useMemo(() => {
    // Generate all expected Class + Section + Subject matrix rows
    const matrix: any[] = [];

    classes.forEach((c) => {
      if (filterClassId !== 'ALL' && c.id !== filterClassId) return;

      c.sections.forEach((sec: any) => {
        subjects.forEach((sub: any) => {
          const match = assignments.find(
            (a) => a.classId === c.id && a.sectionId === sec.id && a.subjectId === sub.id
          );

          const teacher = teachers.find((t) => t.id === match?.teacherId);

          const row = {
            id: match?.id || `${c.id}-${sec.id}-${sub.id}`,
            classId: c.id,
            className: c.name,
            classCode: c.code,
            sectionId: sec.id,
            sectionName: sec.name,
            roomNumber: sec.roomNumber || 'Room unassigned',
            subjectId: sub.id,
            subjectName: sub.name,
            subjectCode: sub.code,
            subjectType: sub.type,
            teacherId: match?.teacherId || '',
            teacherName: teacher ? teacher.name : 'Unassigned',
            teacherDesignation: teacher?.designation || '',
            isAssigned: Boolean(match?.teacherId),
          };

          if (
            filterTeacherStatus === 'ASSIGNED' && !row.isAssigned ||
            filterTeacherStatus === 'UNASSIGNED' && row.isAssigned
          ) {
            return;
          }

          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const hit =
              row.className.toLowerCase().includes(q) ||
              row.sectionName.toLowerCase().includes(q) ||
              row.subjectName.toLowerCase().includes(q) ||
              row.subjectCode.toLowerCase().includes(q) ||
              row.teacherName.toLowerCase().includes(q);
            if (!hit) return;
          }

          matrix.push(row);
        });
      });
    });

    return matrix;
  }, [classes, subjects, assignments, teachers, filterClassId, filterTeacherStatus, searchQuery]);

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Timetable & Course Allocation"
          subtitle="Assign faculty to classes & subjects and manage conflict-free weekly schedules"
        />

        <div className="page-body">
          {/* Top Notification / Alert */}
          {alertMessage && (
            <div
              style={{
                marginBottom: 20,
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: alertMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${alertMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                color: alertMessage.type === 'error' ? '#ef4444' : '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {alertMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{alertMessage.text}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* LUXURY METRIC KPI CARDS                                   */}
          {/* ======================================================== */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                }}
              >
                <Clock size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>SCHEDULED SLOTS</div>
                <div style={{ fontSize: '22px', fontWeight: 800 }}>{totalSlotsCount} Periods</div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE TEACHERS</div>
                <div style={{ fontSize: '22px', fontWeight: 800 }}>{totalAssignedTeachers} / {teachers.length} Faculty</div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: unassignedCourseCount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: unassignedCourseCount > 0 ? '#f59e0b' : '#10b981',
                }}
              >
                <BookOpen size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>UNASSIGNED SUBJECTS</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: unassignedCourseCount > 0 ? '#f59e0b' : 'inherit' }}>
                  {unassignedCourseCount} Needing Faculty
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1',
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>CONFLICT ENGINE</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                  Active & Guarded
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TOP TABS NAVIGATION                                      */}
          {/* ======================================================== */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 12,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setActiveTab('TIMETABLE')}
                className={`btn ${activeTab === 'TIMETABLE' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Calendar size={17} />
                <span>Weekly Timetable Builder</span>
              </button>

              <button
                onClick={() => setActiveTab('ALLOCATIONS')}
                className={`btn ${activeTab === 'ALLOCATIONS' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Users size={17} />
                <span>Faculty Course Allocation</span>
                {unassignedCourseCount > 0 && (
                  <span className="badge badge-warning" style={{ fontSize: '11px', padding: '1px 6px' }}>
                    {unassignedCourseCount}
                  </span>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {activeTab === 'TIMETABLE' ? (
                <>
                  <button
                    onClick={() => window.print()}
                    className="btn btn-secondary"
                    title="Print weekly timetable"
                  >
                    <Printer size={15} />
                    <span>Print</span>
                  </button>

                  <button
                    onClick={() => {
                      setCopyForm({
                        sourceClassId: selectedClassId,
                        sourceSectionId: selectedSectionId,
                        targetClassId: selectedClassId,
                        targetSectionId: '',
                      });
                      setIsCopyModalOpen(true);
                    }}
                    className="btn btn-secondary"
                    title="Copy timetable to another section"
                  >
                    <Copy size={15} />
                    <span>Clone to Section</span>
                  </button>

                  <button
                    onClick={handleAutoPopulate}
                    className="btn btn-secondary"
                    disabled={actionLoading}
                    title="Auto-fill 8 periods for this section"
                  >
                    <Sparkles size={15} color="#eab308" />
                    <span>Auto-Generate</span>
                  </button>

                  <button
                    onClick={() => openSlotModal()}
                    className="btn btn-primary"
                  >
                    <Plus size={16} />
                    <span>Add Period Slot</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setAssignForm({
                      classId: classes[0]?.id || '',
                      sectionId: classes[0]?.sections[0]?.id || '',
                      subjectId: subjects[0]?.id || '',
                      teacherId: teachers[0]?.id || '',
                    });
                    setIsAssignModalOpen(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  <span>Assign Faculty to Course</span>
                </button>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: WEEKLY TIMETABLE BUILDER                          */}
          {/* ======================================================== */}
          {activeTab === 'TIMETABLE' && (
            <div>
              {/* Filter Controls Bar */}
              <div
                className="card"
                style={{
                  padding: '16px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>View By:</span>
                    <div style={{ display: 'flex', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
                      <button
                        onClick={() => setViewMode('CLASS')}
                        style={{
                          border: 'none',
                          background: viewMode === 'CLASS' ? 'var(--brand-primary)' : 'transparent',
                          color: viewMode === 'CLASS' ? '#fff' : 'var(--text-muted)',
                          padding: '4px 10px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                      >
                        Class Section
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('TEACHER');
                          if (!selectedTeacherId && teachers.length > 0) {
                            setSelectedTeacherId(teachers[0].id);
                          }
                        }}
                        style={{
                          border: 'none',
                          background: viewMode === 'TEACHER' ? 'var(--brand-primary)' : 'transparent',
                          color: viewMode === 'TEACHER' ? '#fff' : 'var(--text-muted)',
                          padding: '4px 10px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                      >
                        Faculty Workload
                      </button>
                    </div>
                  </div>

                  {viewMode === 'CLASS' ? (
                    <>
                      {/* Class Grade Select */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Class:</span>
                        <select
                          className="form-control"
                          style={{ minWidth: 150, height: 36, padding: '4px 10px', fontSize: 13 }}
                          value={selectedClassId}
                          onChange={(e) => handleClassChange(e.target.value)}
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Section Select */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Section:</span>
                        <select
                          className="form-control"
                          style={{ minWidth: 160, height: 36, padding: '4px 10px', fontSize: 13 }}
                          value={selectedSectionId}
                          onChange={(e) => setSelectedSectionId(e.target.value)}
                        >
                          {currentClass?.sections?.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.roomNumber ? `(${s.roomNumber})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    /* Faculty Workload Select */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Faculty:</span>
                      <select
                        className="form-control"
                        style={{ minWidth: 220, height: 36, padding: '4px 10px', fontSize: 13 }}
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                      >
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.employeeCode}) - {t.designation}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {viewMode === 'CLASS' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-info">
                      {currentSlots.length} Scheduled Periods
                    </span>
                    <button
                      onClick={handleClearSection}
                      className="btn btn-secondary"
                      style={{ height: 34, padding: '0 10px', fontSize: 12, color: '#ef4444' }}
                      title="Clear Section Timetable"
                    >
                      <Trash2 size={13} />
                      <span>Clear Section</span>
                    </button>
                  </div>
                )}
              </div>

              {/* TIMETABLE GRID MATRIX */}
              <div
                className="card"
                style={{
                  padding: '16px',
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: '8px',
                    minWidth: '980px',
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          width: '120px',
                          textAlign: 'center',
                          padding: '10px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Period / Time
                      </th>
                      {DAYS_OF_WEEK.map((day) => (
                        <th
                          key={day.key}
                          style={{
                            textAlign: 'center',
                            padding: '12px 14px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-surface-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            borderBottom: '2px solid var(--brand-primary)',
                          }}
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEFAULT_PERIODS.map((periodRow, pIdx) => {
                      if (periodRow.isBreak) {
                        return (
                          <tr key={`break-${pIdx}`}>
                            <td
                              colSpan={7}
                              style={{
                                textAlign: 'center',
                                padding: '8px',
                                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                border: '1px dashed rgba(245, 158, 11, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                color: '#d97706',
                                fontSize: '12px',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                              }}
                            >
                              ☕ {periodRow.label.toUpperCase()} ({periodRow.start} – {periodRow.end})
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={`p-${periodRow.period}`}>
                          {/* Period Header Column */}
                          <td
                            style={{
                              backgroundColor: 'var(--bg-surface-subtle)',
                              padding: '10px 8px',
                              borderRadius: 'var(--radius-sm)',
                              textAlign: 'center',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: '13px' }}>{periodRow.label}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                              {periodRow.start}
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-subtle)' }}>
                              to {periodRow.end}
                            </div>
                          </td>

                          {/* Days Cells */}
                          {DAYS_OF_WEEK.map((day) => {
                            const slot = currentSlots.find(
                              (s) => s.dayOfWeek === day.key && s.periodNumber === periodRow.period
                            );

                            return (
                              <td
                                key={`${day.key}-${periodRow.period}`}
                                style={{
                                  verticalAlign: 'top',
                                  minHeight: 110,
                                  height: '100%',
                                }}
                              >
                                {slot ? (
                                  <div
                                    style={{
                                      backgroundColor: 'var(--bg-surface)',
                                      border: '1px solid var(--border-subtle)',
                                      borderLeft: '4px solid var(--brand-primary)',
                                      borderRadius: 'var(--radius-sm)',
                                      padding: '10px 12px',
                                      minHeight: '105px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      boxShadow: 'var(--shadow-sm)',
                                      position: 'relative',
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    <div>
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          justifyContent: 'space-between',
                                          gap: 6,
                                          marginBottom: 4,
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontWeight: 700,
                                            fontSize: '13px',
                                            lineHeight: 1.25,
                                            color: 'var(--text-primary)',
                                          }}
                                        >
                                          {slot.subjectName}
                                        </span>
                                        <span
                                          className="command-kbd"
                                          style={{ fontSize: '10px', padding: '1px 4px' }}
                                        >
                                          {slot.subjectCode}
                                        </span>
                                      </div>

                                      {viewMode === 'TEACHER' ? (
                                        <div
                                          style={{
                                            fontSize: '11.5px',
                                            color: 'var(--brand-primary)',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            marginTop: 3,
                                          }}
                                        >
                                          <GraduationCap size={13} />
                                          <span>{slot.className} - {slot.sectionName}</span>
                                        </div>
                                      ) : (
                                        <div
                                          style={{
                                            fontSize: '11.5px',
                                            color: 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            marginTop: 3,
                                          }}
                                        >
                                          <Users size={12} />
                                          <span>{slot.teacherName}</span>
                                        </div>
                                      )}
                                    </div>

                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginTop: 8,
                                        paddingTop: 6,
                                        borderTop: '1px dashed var(--border-subtle)',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: '10.5px',
                                          backgroundColor: 'var(--bg-surface-subtle)',
                                          padding: '2px 6px',
                                          borderRadius: 3,
                                          color: 'var(--text-subtle)',
                                        }}
                                      >
                                        🏛️ {slot.roomNumber || 'Room 101'}
                                      </span>

                                      <div style={{ display: 'flex', gap: 4 }}>
                                        <button
                                          onClick={() => openSlotModal(day.key, periodRow.period, slot)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 3,
                                            color: 'var(--text-muted)',
                                          }}
                                          title="Edit period slot"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSlot(slot.id)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 3,
                                            color: '#ef4444',
                                          }}
                                          title="Delete slot"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Empty cell button */
                                  <button
                                    onClick={() => openSlotModal(day.key, periodRow.period)}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      minHeight: '105px',
                                      border: '1px dashed var(--border-subtle)',
                                      borderRadius: 'var(--radius-sm)',
                                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 6,
                                      color: 'var(--text-subtle)',
                                      transition: 'all 0.15s ease',
                                    }}
                                    className="hover-slot"
                                  >
                                    <Plus size={16} />
                                    <span style={{ fontSize: '11px', fontWeight: 500 }}>Add Class</span>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: FACULTY COURSE ALLOCATION MATRIX                  */}
          {/* ======================================================== */}
          {activeTab === 'ALLOCATIONS' && (
            <div>
              {/* Filter and Search Bar */}
              <div
                className="card"
                style={{
                  padding: '16px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', flex: 1 }}>
                  {/* Search input */}
                  <div style={{ position: 'relative', minWidth: 240 }}>
                    <Search
                      size={16}
                      color="var(--text-muted)"
                      style={{ position: 'absolute', left: 12, top: 11 }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
                      placeholder="Search class, subject, or faculty..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filter by Grade */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Class:</span>
                    <select
                      className="form-control"
                      style={{ minWidth: 150, height: 38, fontSize: 13 }}
                      value={filterClassId}
                      onChange={(e) => setFilterClassId(e.target.value)}
                    >
                      <option value="ALL">All Grades</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                    <select
                      className="form-control"
                      style={{ minWidth: 160, height: 38, fontSize: 13 }}
                      value={filterTeacherStatus}
                      onChange={(e: any) => setFilterTeacherStatus(e.target.value)}
                    >
                      <option value="ALL">All Status</option>
                      <option value="ASSIGNED">Assigned Only</option>
                      <option value="UNASSIGNED">Unassigned Only</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge badge-info">{filteredAllocations.length} Course Pairings</span>
                </div>
              </div>

              {/* Course Allocations Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Class & Section</th>
                        <th>Subject & Curriculum</th>
                        <th>Subject Type</th>
                        <th>Classroom</th>
                        <th>Assigned Faculty Member</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllocations.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                            No courses match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredAllocations.map((row) => (
                          <tr key={`${row.classId}-${row.sectionId}-${row.subjectId}`}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <GraduationCap size={18} color="var(--brand-primary)" />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{row.className}</div>
                                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                                    {row.sectionName}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BookOpen size={16} color="var(--text-muted)" />
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13 }}>{row.subjectName}</div>
                                  <div className="command-kbd" style={{ fontSize: 10, display: 'inline-block' }}>
                                    {row.subjectCode}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className={`badge ${row.subjectType === 'PRACTICAL' ? 'badge-warning' : 'badge-neutral'}`}>
                                {row.subjectType}
                              </span>
                            </td>

                            <td>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                🏛️ {row.roomNumber}
                              </span>
                            </td>

                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <select
                                  className="form-control"
                                  style={{
                                    height: 36,
                                    fontSize: 13,
                                    minWidth: 200,
                                    border: row.isAssigned
                                      ? '1px solid var(--border-subtle)'
                                      : '1px dashed #f59e0b',
                                  }}
                                  value={row.teacherId || ''}
                                  onChange={(e) =>
                                    handleInlineAssignTeacher(
                                      row.classId,
                                      row.sectionId,
                                      row.subjectId,
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">-- Unassigned (Select Faculty) --</option>
                                  {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name} ({t.employeeCode})
                                    </option>
                                  ))}
                                </select>

                                {row.isAssigned ? (
                                  <span className="badge badge-success" title="Faculty Active">
                                    <Check size={11} style={{ marginRight: 3 }} />
                                    Assigned
                                  </span>
                                ) : (
                                  <span className="badge badge-warning" title="Awaiting Faculty Allocation">
                                    Vacant
                                  </span>
                                )}
                              </div>
                            </td>

                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  setAssignForm({
                                    classId: row.classId,
                                    sectionId: row.sectionId,
                                    subjectId: row.subjectId,
                                    teacherId: row.teacherId || '',
                                  });
                                  setIsAssignModalOpen(true);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: 12 }}
                              >
                                Edit Allocation
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT PERIOD SLOT                          */}
      {/* ======================================================== */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title={editingSlot ? 'Edit Timetable Period Slot' : 'Add Timetable Period Slot'}
      >
        <form onSubmit={handleSaveSlot}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="form-label">Day of Week</label>
              <select
                className="form-control"
                value={slotForm.dayOfWeek}
                onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value })}
                required
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Period Number (1 - 8)</label>
              <select
                className="form-control"
                value={slotForm.periodNumber}
                onChange={(e) => {
                  const pNum = parseInt(e.target.value, 10);
                  const matched = DEFAULT_PERIODS.find((p) => p.period === pNum);
                  setSlotForm({
                    ...slotForm,
                    periodNumber: pNum,
                    startTime: matched?.start || slotForm.startTime,
                    endTime: matched?.end || slotForm.endTime,
                  });
                }}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Period {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="form-label">Start Time</label>
              <input
                type="text"
                className="form-control"
                value={slotForm.startTime}
                onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                placeholder="e.g. 08:30 AM"
                required
              />
            </div>

            <div>
              <label className="form-label">End Time</label>
              <input
                type="text"
                className="form-control"
                value={slotForm.endTime}
                onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                placeholder="e.g. 09:15 AM"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Subject</label>
            <select
              className="form-control"
              value={slotForm.subjectId}
              onChange={(e) => handleSlotSubjectChange(e.target.value)}
              required
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code}) - {sub.type}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Assigned Faculty (Teacher)</label>
            <select
              className="form-control"
              value={slotForm.teacherId}
              onChange={(e) => setSlotForm({ ...slotForm, teacherId: e.target.value })}
            >
              <option value="">-- None / Self Study / Unassigned --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.employeeCode}) - {t.designation}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 4 }}>
              * System automatically prevents double-booking this teacher in another class at the same time.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Classroom / Room Number</label>
            <input
              type="text"
              className="form-control"
              value={slotForm.roomNumber}
              onChange={(e) => setSlotForm({ ...slotForm, roomNumber: e.target.value })}
              placeholder="e.g. Room 201 or Physics Lab"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setIsSlotModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Saving Slot...' : editingSlot ? 'Update Period Slot' : 'Add Period Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: ASSIGN FACULTY TO COURSE (ALLOCATION)           */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Faculty to Class Subject"
      >
        <form onSubmit={handleSaveAssignment}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Class & Grade</label>
            <select
              className="form-control"
              value={assignForm.classId}
              onChange={(e) => {
                const clsId = e.target.value;
                const cls = classes.find((c) => c.id === clsId);
                setAssignForm({
                  ...assignForm,
                  classId: clsId,
                  sectionId: cls?.sections[0]?.id || '',
                });
              }}
              required
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Section</label>
            <select
              className="form-control"
              value={assignForm.sectionId}
              onChange={(e) => setAssignForm({ ...assignForm, sectionId: e.target.value })}
              required
            >
              {classes
                .find((c) => c.id === assignForm.classId)
                ?.sections?.map((sec: any) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} {sec.roomNumber ? `(${sec.roomNumber})` : ''}
                  </option>
                ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Subject</label>
            <select
              className="form-control"
              value={assignForm.subjectId}
              onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
              required
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Assigned Faculty Member</label>
            <select
              className="form-control"
              value={assignForm.teacherId}
              onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
            >
              <option value="">-- Unassigned --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.employeeCode}) - {t.designation}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Course Allocation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: CLONE TIMETABLE TO ANOTHER SECTION              */}
      {/* ======================================================== */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Clone Weekly Schedule to Another Section"
      >
        <form onSubmit={handleCopySection}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Source Section (Copy From)</label>
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {currentClass?.name} - {currentSection?.name} ({currentSlots.length} Slots)
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Target Class</label>
            <select
              className="form-control"
              value={copyForm.targetClassId}
              onChange={(e) => {
                const clsId = e.target.value;
                const cls = classes.find((c) => c.id === clsId);
                setCopyForm({
                  ...copyForm,
                  targetClassId: clsId,
                  targetSectionId: cls?.sections[0]?.id || '',
                });
              }}
              required
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Target Section (Copy Into)</label>
            <select
              className="form-control"
              value={copyForm.targetSectionId}
              onChange={(e) => setCopyForm({ ...copyForm, targetSectionId: e.target.value })}
              required
            >
              <option value="">-- Choose Target Section --</option>
              {classes
                .find((c) => c.id === copyForm.targetClassId)
                ?.sections?.filter((s: any) => s.id !== copyForm.sourceSectionId)
                .map((sec: any) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
            </select>
            <p style={{ fontSize: '11.5px', color: '#ef4444', marginTop: 4 }}>
              * Warning: Any existing timetable slots in the target section will be overwritten.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setIsCopyModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading || !copyForm.targetSectionId}>
              {actionLoading ? 'Cloning...' : 'Clone Schedule'}
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

export default function AdminTimetablePage() {
  return (
    <React.Suspense fallback={<div style={{ padding: 32, textAlign: 'center' }}>Loading Timetable...</div>}>
      <AdminTimetableContent />
    </React.Suspense>
  );
}
