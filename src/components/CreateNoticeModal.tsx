'use client';

import React, { useState } from 'react';
import { X, Megaphone, Send, ShieldCheck, Calendar, DollarSign, MapPin } from 'lucide-react';

interface CreateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoticeCreated: () => void;
}

export default function CreateNoticeModal({
  isOpen,
  onClose,
  onNoticeCreated
}: CreateNoticeModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'FIELD_TRIP' | 'EXAM_SCHEDULE' | 'GENERAL_POLICY' | 'EMERGENCY' | 'SPORTS'>('GENERAL_POLICY');
  const [priority, setPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [targetAudience, setTargetAudience] = useState('All Parents & Students');
  const [content, setContent] = useState('');
  
  // Consent toggle
  const [requiresConsent, setRequiresConsent] = useState(false);
  const [destination, setDestination] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [feeAmount, setFeeAmount] = useState('0');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and circular text content.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          priority,
          targetAudience,
          content,
          requiresConsent,
          destination: requiresConsent ? destination : undefined,
          eventDate: requiresConsent ? eventDate : undefined,
          feeAmount: requiresConsent ? Number(feeAmount) : 0
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish notice');

      onNoticeCreated();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Publish Official School Circular</h3>
              <p className="text-xs text-slate-400">Broadcast institutional notices to students, parents, and faculty</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Circular Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Science Exhibition & Innovation Fair 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="GENERAL_POLICY">General Policy</option>
                <option value="FIELD_TRIP">Field Trip / Excursion</option>
                <option value="EXAM_SCHEDULE">Exam Schedule</option>
                <option value="SPORTS">Sports & Athletics</option>
                <option value="EMERGENCY">Emergency Advisory</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Advisory</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Target Audience</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Grade 10 Parents"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Circular Content / Directives</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write detailed instructions, reporting timings, guidelines, and context..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed"
              required
            />
          </div>

          {/* Toggle Consent Slip */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={requiresConsent}
                onChange={(e) => setRequiresConsent(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0"
              />
              <span>Require Digital Parent Consent Slip (for Excursions & Events)</span>
            </label>

            {requiresConsent && (
              <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
                <div>
                  <label className="block text-slate-400 mb-1">Destination / Venue</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Science City"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cost / Fee (₹)</label>
                  <input
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Publishing...' : 'Publish Circular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
