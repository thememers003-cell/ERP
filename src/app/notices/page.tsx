'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileCheck,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  Users,
  Compass,
  ArrowRight
} from 'lucide-react';
import ParentConsentModal from '@/components/ParentConsentModal';
import CreateNoticeModal from '@/components/CreateNoticeModal';
import { SchoolNotice } from '@/app/api/notices/route';

export default function NoticesPage() {
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [activeNoticeForConsent, setActiveNoticeForConsent] = useState<SchoolNotice | null>(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notices');
      const data = await res.json();
      setNotices(data.notices || []);
    } catch (err) {
      console.error('Failed to load circulars:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleConsentSubmitted = () => {
    fetchNotices();
    setSuccessToast('Parent digital consent signature logged and verified successfully!');
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleNoticeCreated = () => {
    fetchNotices();
    setSuccessToast('Official circular broadcasted to the school portal!');
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const filteredNotices = notices.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.circularNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || n.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalConsentPending = notices.reduce(
    (acc, curr) => acc + (curr.consentDetails?.pendingCount || 0),
    0
  );
  const totalTrips = notices.filter(n => n.requiresConsent).length;

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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Megaphone className="w-3.5 h-3.5" /> Institutional Communications
            </span>
            <span className="text-xs text-slate-400">Digital Dispatch & Consent Hub</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            School Circulars & Parent Consent Slips
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Publish official academic directives, event circulars, and track digital parent approvals in real time.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-600/30 self-start"
        >
          <Plus className="w-4 h-4" />
          Publish New Circular
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Active Circulars
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{notices.length}</span>
            <span className="text-xs text-emerald-400">Live in portal</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block mb-1">
            Excursions & Events
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalTrips}</span>
            <span className="text-xs text-slate-400">Consent slips active</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
            Pending Parent Approvals
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300">{totalConsentPending}</span>
            <span className="text-xs text-amber-500/80">Follow-up needed</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            Avg Consent Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">92.4%</span>
            <span className="text-xs text-emerald-400">Digital verification</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circular title, number or keywords..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {['ALL', 'FIELD_TRIP', 'EXAM_SCHEDULE', 'GENERAL_POLICY', 'SPORTS', 'EMERGENCY'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Notices' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => {
          const consent = notice.consentDetails;
          const consentPercent = consent
            ? Math.round((consent.consentedCount / consent.totalEligibleParents) * 100)
            : 0;

          return (
            <div
              key={notice.id}
              className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 hover:border-slate-700 transition-all shadow-xl"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                    {notice.circularNumber}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {notice.category.replace('_', ' ')}
                  </span>
                  {notice.priority === 'URGENT' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/40">
                      URGENT
                    </span>
                  )}
                  {notice.priority === 'HIGH' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                      HIGH
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Issued: {notice.issueDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" /> {notice.targetAudience}
                  </span>
                </div>
              </div>

              {/* Title & Body */}
              <h3 className="text-base font-bold text-white mb-2">{notice.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{notice.content}</p>

              {/* Consent Slip Tracking Panel */}
              {notice.requiresConsent && consent && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Parent Consent Progress</span>
                      <span className="text-xs text-slate-400">
                        ({consent.consentedCount} of {consent.totalEligibleParents} Parents Consented)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-400 font-semibold">✓ {consent.consentedCount} Approved</span>
                      <span className="text-amber-400 font-semibold">⏳ {consent.pendingCount} Pending</span>
                      <span className="text-rose-400 font-semibold">✕ {consent.declinedCount} Declined</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden mb-3 border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${consentPercent}%` }}
                    ></div>
                  </div>

                  {/* Footer Action */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Venue: <strong className="text-slate-200">{consent.destination}</strong></span>
                      <span>• Date: <strong className="text-slate-200">{consent.eventDate}</strong></span>
                      <span>• Fee: <strong className="text-emerald-400">{consent.feeAmount === 0 ? 'Free' : `₹${consent.feeAmount}`}</strong></span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveNoticeForConsent(notice);
                        setIsConsentModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-600/20"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Sign Parent Consent Slip
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredNotices.length === 0 && (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No circulars match your current filter.</p>
          </div>
        )}
      </div>

      {/* Parent Consent Modal */}
      <ParentConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        notice={activeNoticeForConsent}
        onConsentSubmitted={handleConsentSubmitted}
      />

      {/* Create Notice Modal */}
      <CreateNoticeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onNoticeCreated={handleNoticeCreated}
      />
    </div>
  );
}
