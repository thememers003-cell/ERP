'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  ShieldAlert,
  Printer,
  Filter,
  CheckCircle2,
  Users,
  BookOpen,
  MapPin,
  RefreshCw,
  Info
} from 'lucide-react';
import SubstituteModal from '@/components/SubstituteModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const PERIOD_HEADERS = [
  { num: 1, time: '08:30 - 09:15' },
  { num: 2, time: '09:15 - 10:00' },
  { num: 3, time: '10:15 - 11:00' },
  { num: 4, time: '11:00 - 11:45' },
  { num: 5, time: '12:30 - 01:15' },
  { num: 6, time: '01:15 - 02:00' },
  { num: 7, time: '02:15 - 03:00' },
  { num: 8, time: '03:00 - 03:45' }
];

export default function TimetablePage() {
  const [viewMode, setViewMode] = useState<'CLASS' | 'TEACHER'>('CLASS');
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<'ALL' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('ALL');

  const [slots, setSlots] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<string[]>(['10-A', '10-B', '9-A', '9-B']);
  const [isLoading, setIsLoading] = useState(true);

  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      let url = '/api/timetable';
      if (viewMode === 'CLASS') {
        url += `?className=${selectedClass}`;
      } else if (selectedTeacherId) {
        url += `?teacherId=${selectedTeacherId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setSlots(data.slots || []);
      setTeachers(data.teachers || []);
      setClassesList(data.classes || ['10-A', '10-B', '9-A', '9-B']);
      if (!selectedTeacherId && data.teachers && data.teachers.length > 0) {
        setSelectedTeacherId(data.teachers[0].id);
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [viewMode, selectedClass, selectedTeacherId]);

  const handleSubstitutionsApplied = () => {
    fetchTimetable();
    setSuccessToast('Substitute assignments updated across all active period schedules!');
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const getSlot = (day: string, periodNum: number) => {
    return slots.find(s => s.day === day && s.periodNumber === periodNum);
  };

  const displayedDays = selectedDayFilter === 'ALL' ? DAYS : [selectedDayFilter];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Calendar className="w-3.5 h-3.5" /> Academic Master Schedule
            </span>
            <span className="text-xs text-slate-400">Term II • 2026-27</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Smart Timetable & Auto-Substitute Dispatch
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time visual schedule matrix with instant conflict-free teacher substitution resolver.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Schedule
          </button>
          <button
            onClick={() => setIsSubstituteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-lg shadow-amber-600/30"
          >
            <ShieldAlert className="w-4 h-4" />
            Report Absence & Dispatch Substitutes
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 backdrop-blur flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('CLASS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'CLASS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> By Class
            </button>
            <button
              onClick={() => setViewMode('TEACHER')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'TEACHER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> By Teacher
            </button>
          </div>

          {/* Class or Teacher Select */}
          {viewMode === 'CLASS' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Select Class:</span>
              <div className="flex gap-1.5">
                {classesList.map(cls => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedClass === cls
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Grade {cls}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Faculty Member:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Day Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Day:</span>
          <select
            value={selectedDayFilter}
            onChange={(e) => setSelectedDayFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Full Week (Mon–Fri)</option>
            {DAYS.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timetable Grid Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          {/* Header Row: Periods */}
          <thead>
            <tr className="border-b border-slate-800">
              <th className="p-3 bg-slate-950/80 text-xs font-bold text-slate-400 uppercase tracking-wider w-32 rounded-tl-xl">
                Day / Time
              </th>
              {PERIOD_HEADERS.map(ph => (
                <th key={ph.num} className="p-3 bg-slate-950/80 text-center border-l border-slate-800/80">
                  <span className="text-xs font-bold text-slate-200 block">Period {ph.num}</span>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{ph.time}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {displayedDays.map(day => (
              <tr key={day} className="hover:bg-slate-900/40 transition-colors">
                {/* Day Header Column */}
                <td className="p-4 bg-slate-950/50 font-bold text-sm text-slate-200 border-r border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {day}
                  </div>
                </td>

                {/* 8 Periods */}
                {PERIOD_HEADERS.map(ph => {
                  const slot = getSlot(day, ph.num);

                  return (
                    <td key={ph.num} className="p-2 border-l border-slate-800/60 align-top min-w-[120px] max-w-[140px]">
                      {slot ? (
                        <div
                          className={`p-3 rounded-xl border text-xs flex flex-col justify-between h-28 transition-all ${
                            slot.isSubstituted
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-md shadow-amber-500/10'
                              : 'bg-slate-950/80 border-slate-800/90 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-white truncate">{slot.subject}</span>
                              {slot.isSubstituted && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold uppercase tracking-wider">
                                  SUB
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                              <span className="truncate">{slot.room}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80">
                            {slot.isSubstituted ? (
                              <div>
                                <span className="text-[10px] text-amber-400 font-semibold block truncate">
                                  ★ {slot.teacherName}
                                </span>
                                <span className="text-[9px] text-slate-500 line-through block truncate">
                                  {slot.originalTeacherName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-300 font-medium block truncate">
                                {slot.teacherName}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 rounded-xl border border-dashed border-slate-800/60 flex items-center justify-center text-[11px] text-slate-600">
                          Free Slot
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Emergency Substitute Modal */}
      <SubstituteModal
        isOpen={isSubstituteModalOpen}
        onClose={() => setIsSubstituteModalOpen(false)}
        teachers={teachers}
        onSubstitutionsApplied={handleSubstitutionsApplied}
      />
    </div>
  );
}
