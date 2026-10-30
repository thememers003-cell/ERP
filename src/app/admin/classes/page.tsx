'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import Modal from '@/components/Modal';
import { GraduationCap, Plus, BookOpen, Layers, Download, Upload, FileSpreadsheet, CheckCircle2, Clock, UserCheck } from 'lucide-react';
import { AuthUser } from '@/types';
import { exportToExcel, parseExcelOrCSV } from '@/lib/excel';

export default function ClassesAndSubjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Assign Class Teacher Modal
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [assigningTeacher, setAssigningTeacher] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');

  // Create Class Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', code: '', numericLevel: 8 });

  // Create Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', code: '', type: 'THEORY' });

  // Import Subjects Modal
  const [isSubjectImportOpen, setIsSubjectImportOpen] = useState(false);
  const [importingSubjects, setImportingSubjects] = useState(false);
  const [subjectRows, setSubjectRows] = useState<any[]>([]);
  const [importSubResult, setImportSubResult] = useState<any>(null);

  // Subject Teacher Allocation Modal
  const [isSubjectAllocOpen, setIsSubjectAllocOpen] = useState(false);
  const [selectedClassForAlloc, setSelectedClassForAlloc] = useState<any>(null);
  const [allocSectionId, setAllocSectionId] = useState<string>('ALL');
  const [subjectAllocations, setSubjectAllocations] = useState<any[]>([]);
  const [allocLoading, setAllocLoading] = useState(false);
  const [savingAllocSubjectId, setSavingAllocSubjectId] = useState<string | null>(null);
  const [allocMessage, setAllocMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      const [cRes, sRes, tRes] = await Promise.all([
        fetch('/api/academics/classes'),
        fetch('/api/academics/subjects'),
        fetch('/api/teachers'),
      ]);

      if (cRes.ok) setClasses((await cRes.json()).data);
      if (sRes.ok) setSubjects((await sRes.json()).data);
      if (tRes.ok) setTeachers((await tRes.json()).data || []);
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

  const openAssignTeacherModal = (section: any, className: string) => {
    setSelectedSection({ ...section, className });
    setSelectedTeacherId(section.classTeacherId || '');
    setAssignMessage('');
    setIsTeacherModalOpen(true);
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection) return;
    setAssigningTeacher(true);
    setAssignMessage('');

    try {
      const res = await fetch(`/api/academics/sections/${selectedSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classTeacherId: selectedTeacherId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to assign class teacher');

      setIsTeacherModalOpen(false);
      loadData();
    } catch (err: any) {
      setAssignMessage(err.message);
    } finally {
      setAssigningTeacher(false);
    }
  };

  const loadSubjectAllocations = async (classId: string, sectionId?: string) => {
    setAllocLoading(true);
    setAllocMessage(null);
    try {
      const secParam = sectionId && sectionId !== 'ALL' ? `&sectionId=${sectionId}` : '';
      const res = await fetch(`/api/academics/class-subjects?classId=${classId}${secParam}`);
      const data = await res.json();
      if (res.ok) {
        setSubjectAllocations(data.data || []);
      } else {
        setAllocMessage({ type: 'error', text: data.error?.message || 'Failed to load allocations' });
      }
    } catch (err: any) {
      setAllocMessage({ type: 'error', text: err.message });
    } finally {
      setAllocLoading(false);
    }
  };

  const openSubjectAllocModal = (classObj: any) => {
    setSelectedClassForAlloc(classObj);
    setAllocSectionId('ALL');
    setIsSubjectAllocOpen(true);
    loadSubjectAllocations(classObj.id, 'ALL');
  };

  const handleUpdateSubjectTeacher = async (subjectId: string, teacherId: string) => {
    if (!selectedClassForAlloc) return;
    setSavingAllocSubjectId(subjectId);
    setAllocMessage(null);
    try {
      const res = await fetch('/api/academics/class-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassForAlloc.id,
          sectionId: allocSectionId === 'ALL' ? null : allocSectionId,
          subjectId,
          teacherId: teacherId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to assign teacher to subject');

      setSubjectAllocations((prev) =>
        prev.map((item) => {
          if (item.subjectId === subjectId) {
            const foundTeacher = teachers.find((t) => t.id === teacherId);
            return {
              ...item,
              teacherId: teacherId || null,
              teacherName: foundTeacher ? `${foundTeacher.firstName} ${foundTeacher.lastName}` : null,
              teacherCode: foundTeacher?.employeeCode || null,
            };
          }
          return item;
        })
      );
      setAllocMessage({ type: 'success', text: 'Subject teacher updated successfully!' });
    } catch (err: any) {
      setAllocMessage({ type: 'error', text: err.message });
    } finally {
      setSavingAllocSubjectId(null);
    }
  };


  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academics/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass),
      });
      if (res.ok) {
        setIsClassModalOpen(false);
        setNewClass({ name: '', code: '', numericLevel: 8 });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academics/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject),
      });
      if (res.ok) {
        setIsSubjectModalOpen(false);
        setNewSubject({ name: '', code: '', type: 'THEORY' });
        loadData();
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
          title="Academic Structure"
          subtitle="Classes, Sections & Subjects"
        />

        <div className="page-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Academic Structure
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Configure classes, section divisions, classroom allocations, and subject catalog.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                href="/admin/timetable"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              >
                <Clock size={15} color="var(--brand-primary)" />
                <span>Timetable & Faculty Allocations</span>
              </Link>
              <button
                onClick={() => {
                  const exportData = subjects.map((s) => ({
                    'Subject Name': s.name,
                    'Code': s.code,
                    'Type': s.type,
                  }));
                  exportToExcel(exportData, `Subjects_Curriculum_${new Date().toISOString().split('T')[0]}`);
                }}
                className="btn btn-secondary"
                title="Export Subjects to Excel"
              >
                <Download size={15} />
                <span>Export Subjects</span>
              </button>
              <button
                onClick={() => setIsSubjectImportOpen(true)}
                className="btn btn-secondary"
              >
                <Upload size={15} />
                <span>Import Subjects</span>
              </button>
              <button onClick={() => setIsSubjectModalOpen(true)} className="btn btn-secondary">
                <BookOpen size={16} />
                <span>Add Subject</span>
              </button>
              <button onClick={() => setIsClassModalOpen(true)} className="btn btn-primary">
                <Plus size={16} />
                <span>Add Class / Grade</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            {/* Classes & Sections Card */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Classes & Sections</h2>
                <span className="badge badge-info">{classes.length} Grades</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {classes.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <GraduationCap size={20} color="var(--brand-primary)" />
                        <div>
                          <span style={{ fontSize: '15px', fontWeight: 700 }}>{c.name}</span>
                          <span className="command-kbd" style={{ marginLeft: 8 }}>{c.code}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => openSubjectAllocModal(c)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11.5px', gap: 5 }}
                          title="Assign subject teachers for this class"
                        >
                          <BookOpen size={13} />
                          <span>Subject Teachers</span>
                        </button>
                        <span className="badge badge-neutral">{c.totalStudents} Enrolled Learners</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                      {c.sections.map((sec: any) => (
                        <div
                          key={sec.id}
                          style={{
                            padding: '12px 14px',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '12.5px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{sec.name}</div>
                            <button
                              type="button"
                              onClick={() => openAssignTeacherModal(sec, c.name)}
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px', height: 'auto', gap: 4 }}
                              title="Assign or update Class Teacher"
                            >
                              <UserCheck size={12} />
                              <span>{sec.classTeacherName ? 'Change' : 'Assign'}</span>
                            </button>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {sec.roomNumber || 'Room unassigned'} • {sec.studentsCount} students
                          </div>

                          <div style={{ marginTop: 4 }}>
                            {sec.classTeacherName ? (
                              <span
                                className="badge badge-success"
                                style={{
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  width: '100%',
                                  padding: '4px 8px',
                                }}
                              >
                                <UserCheck size={13} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  Class Teacher: <strong>{sec.classTeacherName}</strong>
                                </span>
                              </span>
                            ) : (
                              <span
                                className="badge badge-neutral"
                                style={{
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  color: 'var(--text-subtle)',
                                  width: '100%',
                                  padding: '4px 8px',
                                }}
                              >
                                <span>No Class Teacher assigned</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects Catalog */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Subject Curriculum</h2>
                <span className="badge badge-info">{subjects.length} Subjects</span>
              </div>

              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Code</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 600 }}>{sub.name}</td>
                        <td><span className="command-kbd">{sub.code}</span></td>
                        <td>
                          <span className={`badge ${sub.type === 'PRACTICAL' ? 'badge-warning' : 'badge-neutral'}`}>
                            {sub.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Class Modal */}
      <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Add Class / Grade">
        <form onSubmit={handleCreateClass}>
          <div className="form-group">
            <label className="form-label">Class Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Grade 11"
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Code *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. G11"
              value={newClass.code}
              onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsClassModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Class</button>
          </div>
        </form>
      </Modal>

      {/* Add Subject Modal */}
      <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Add Subject">
        <form onSubmit={handleCreateSubject}>
          <div className="form-group">
            <label className="form-label">Subject Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Environmental Science"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Subject Code *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. EVS-101"
              value={newSubject.code}
              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="select"
              value={newSubject.type}
              onChange={(e) => setNewSubject({ ...newSubject, type: e.target.value })}
            >
              <option value="THEORY">Theory</option>
              <option value="PRACTICAL">Practical / Lab</option>
              <option value="ELECTIVE">Elective</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Subject</button>
          </div>
        </form>
      </Modal>

      {/* Import Subjects Modal */}
      <Modal
        isOpen={isSubjectImportOpen}
        onClose={() => setIsSubjectImportOpen(false)}
        title="Import Subjects via Excel / CSV"
      >
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 16 }}>
            Upload a spreadsheet (<strong>.xlsx</strong> or <strong>.csv</strong>) with columns: <code>Subject Name</code>, <code>Code</code>, <code>Type</code> (THEORY/PRACTICAL).
          </p>
          <div style={{ padding: 20, border: '2px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: 16 }}>
            <FileSpreadsheet size={32} color="var(--brand-primary)" style={{ margin: '0 auto 8px' }} />
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const rows = await parseExcelOrCSV(f);
                  setSubjectRows(rows);
                  setImportSubResult(null);
                }
              }}
            />
          </div>

          {subjectRows.length > 0 && !importSubResult && (
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 16 }}>
              ✓ {subjectRows.length} subject rows parsed and ready to import.
            </div>
          )}

          {importSubResult && (
            <div style={{ padding: 12, backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', borderRadius: 6, fontSize: '13px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} />
              <span>Imported {importSubResult.imported} subjects into curriculum!</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setIsSubjectImportOpen(false)} className="btn btn-secondary">
              {importSubResult ? 'Close' : 'Cancel'}
            </button>
            {subjectRows.length > 0 && !importSubResult && (
              <button
                onClick={async () => {
                  setImportingSubjects(true);
                  try {
                    const res = await fetch('/api/import/subjects', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ rows: subjectRows }),
                    });
                    if (res.ok) {
                      const d = await res.json();
                      setImportSubResult(d.data);
                      loadData();
                    }
                  } finally {
                    setImportingSubjects(false);
                  }
                }}
                className="btn btn-primary"
                disabled={importingSubjects}
              >
                {importingSubjects ? 'Importing...' : `Import ${subjectRows.length} Subjects`}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Assign Class Teacher Modal */}
      <Modal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        title={`Assign Class Teacher: ${selectedSection?.className || ''} - ${selectedSection?.name || ''}`}
      >
        <form onSubmit={handleAssignTeacher}>
          {assignMessage && (
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '12.5px', marginBottom: 14 }}>
              {assignMessage}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Select Faculty Member</label>
            <select
              className="select"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
            >
              <option value="">-- No Class Teacher (Unassigned) --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} ({t.employeeCode}) {t.designation ? `• ${t.designation}` : ''}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 6 }}>
              The assigned faculty member will be designated as the primary Class Teacher with attendance and learner oversight privileges for this section.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsTeacherModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={assigningTeacher}>
              {assigningTeacher ? 'Saving Assignment...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Subject Teacher Allocation Modal */}
      <Modal
        isOpen={isSubjectAllocOpen}
        onClose={() => setIsSubjectAllocOpen(false)}
        title={`Subject Teacher Allocations: ${selectedClassForAlloc?.name || ''}`}
      >
        <div style={{ minWidth: '550px', maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Map teachers to subjects for this grade. Permissions and timetable scopes will sync automatically.
            </div>
            {selectedClassForAlloc?.sections?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Section:</label>
                <select
                  className="select"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                  value={allocSectionId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAllocSectionId(val);
                    if (selectedClassForAlloc) {
                      loadSubjectAllocations(selectedClassForAlloc.id, val);
                    }
                  }}
                >
                  <option value="ALL">All Sections (Class-wide)</option>
                  {selectedClassForAlloc.sections.map((sec: any) => (
                    <option key={sec.id} value={sec.id}>
                      Section {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {allocMessage && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: allocMessage.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                color: allocMessage.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
                borderRadius: 6,
                fontSize: '12.5px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {allocMessage.type === 'success' ? <CheckCircle2 size={15} /> : null}
              <span>{allocMessage.text}</span>
            </div>
          )}

          {allocLoading ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading subject allocations...
            </div>
          ) : subjectAllocations.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No subjects found. Please add subjects to curriculum first.
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th style={{ minWidth: '220px' }}>Assigned Faculty</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectAllocations.map((alloc) => (
                    <tr key={alloc.subjectId}>
                      <td style={{ fontWeight: 600, fontSize: '13px' }}>{alloc.subjectName}</td>
                      <td><span className="command-kbd">{alloc.subjectCode}</span></td>
                      <td>
                        <span className={`badge ${alloc.subjectType === 'PRACTICAL' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                          {alloc.subjectType}
                        </span>
                      </td>
                      <td>
                        <select
                          className="select"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                          value={alloc.teacherId || ''}
                          disabled={savingAllocSubjectId === alloc.subjectId}
                          onChange={(e) => handleUpdateSubjectTeacher(alloc.subjectId, e.target.value)}
                        >
                          <option value="">-- No Teacher (Unassigned) --</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.firstName} {t.lastName} ({t.employeeCode})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsSubjectAllocOpen(false)} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </Modal>

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={user?.isSuperAdmin}
      />
    </div>
  );
}
