'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, UserCheck, ShieldAlert, Clock, ArrowRight, Loader2 } from 'lucide-react';

interface TeacherItem {
  id: string;
  name: string;
  department: string;
  periodsThisWeek: number;
}

interface SubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherItem[];
  onSubstitutionsApplied: () => void;
}

export default function SubstituteModal({
  isOpen,
  onClose,
  teachers,
  onSubstitutionsApplied
}: SubstituteModalProps) {
  const [absentTeacherId, setAbsentTeacherId] = useState(teachers[0]?.id || 't-1');
  const [targetDay, setTargetDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [reason, setReason] = useState('Medical Sick Leave');

  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<{ [slotId: string]: string }>({});

  if (!isOpen) return null;

  const handleScanSubstitutes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FIND_SUBSTITUTES',
          absentTeacherId,
          targetDay
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scan schedule');

      setRecommendations(data.recommendations || []);

      // Auto pre-select the #1 recommended teacher for each slot
      const initialMap: { [slotId: string]: string } = {};
      data.recommendations?.forEach((rec: any) => {
        if (rec.freeTeachers && rec.freeTeachers.length > 0) {
          initialMap[rec.slotId] = rec.freeTeachers[0].id;
        }
      });
      setSelectedSubstitutes(initialMap);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!recommendations || recommendations.length === 0) return;
    setIsApplying(true);

    try {
      const assignments = recommendations.map(rec => ({
        slotId: rec.slotId,
        substituteTeacherId: selectedSubstitutes[rec.slotId],
        reason
      }));

      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPLY_SUBSTITUTION',
          assignments
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply substitutions');

      onSubstitutionsApplied();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const absentTeacherObj = teachers.find(t => t.id === absentTeacherId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Emergency Teacher Absence & Substitute Dispatch</h3>
              <p className="text-xs text-slate-400">Resolve period scheduling conflicts without classroom downtime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5">
          {/* Step 1: Absence Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Absent Faculty Member
              </label>
              <select
                value={absentTeacherId}
                onChange={(e) => {
                  setAbsentTeacherId(e.target.value);
                  setRecommendations(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Absence Day
              </label>
              <select
                value={targetDay}
                onChange={(e) => {
                  setTargetDay(e.target.value as any);
                  setRecommendations(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Absence Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Medical Sick Leave"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end">
            <button
              onClick={handleScanSubstitutes}
              disabled={isLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing Conflict Clashes...
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Find Free Qualified Substitutes
                </>
              )}
            </button>
          </div>

          {/* Recommendations List */}
          {recommendations && (
            <div className="space-y-4 pt-3 border-t border-slate-800 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Affected Periods for {absentTeacherObj?.name} on {targetDay}: ({recommendations.length} Classes)
                </span>
                <span className="text-xs text-slate-400">Zero period clash verified</span>
              </div>

              {recommendations.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 text-center text-xs text-slate-400 border border-slate-800">
                  No classes scheduled for {absentTeacherObj?.name} on {targetDay}.
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div key={rec.slotId} className="bg-slate-950 border border-slate-800/90 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                            Period {rec.periodNumber} ({rec.timeRange})
                          </span>
                          <span className="text-xs font-bold text-white">{rec.subject}</span>
                          <span className="text-xs text-slate-400">• {rec.className}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Location: {rec.room}</p>
                      </div>
                      <span className="text-xs text-amber-400 font-medium">Substitute Needed</span>
                    </div>

                    {/* Free Teachers Selector */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">
                        Assign Recommended Substitute:
                      </label>
                      {rec.freeTeachers.length === 0 ? (
                        <p className="text-xs text-red-400">Critical: All faculty members are occupied in Period {rec.periodNumber}.</p>
                      ) : (
                        <select
                          value={selectedSubstitutes[rec.slotId] || ''}
                          onChange={(e) => setSelectedSubstitutes({ ...selectedSubstitutes, [rec.slotId]: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        >
                          {rec.freeTeachers.map((ft: any) => (
                            <option key={ft.id} value={ft.id}>
                              ★ {ft.name} — {ft.department} (Current Load: {ft.periodsThisWeek} periods/wk)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!recommendations || recommendations.length === 0 || isApplying}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {isApplying ? 'Updating...' : 'Confirm & Dispatch Substitutes'}
          </button>
        </div>
      </div>
    </div>
  );
}
