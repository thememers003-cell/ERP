'use client';

import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, MapPin, Clock, AlertCircle, FileCheck, DollarSign, User } from 'lucide-react';
import { SchoolNotice } from '@/app/api/notices/route';

interface ParentConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: SchoolNotice | null;
  onConsentSubmitted: () => void;
}

export default function ParentConsentModal({
  isOpen,
  onClose,
  notice,
  onConsentSubmitted
}: ParentConsentModalProps) {
  const [parentName, setParentName] = useState('Dr. Arvind Sen');
  const [studentName, setStudentName] = useState('Aarav Sen (10-A, Roll 09)');
  const [phone, setPhone] = useState('+91 98450 12345');
  const [medicalNotes, setMedicalNotes] = useState('No pre-existing conditions. Vegetarian meal preferred.');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !notice || !notice.consentDetails) return null;

  const { consentDetails } = notice;

  const handleSubmit = async (status: 'APPROVED' | 'DECLINED') => {
    if (status === 'APPROVED' && !agreedTerms) {
      alert('Please check the digital consent agreement checkbox.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/notices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noticeId: notice.id,
          parentName,
          studentName,
          phone,
          medicalNotes,
          status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit consent');

      onConsentSubmitted();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Digital Parent Consent & Permission Slip</h3>
              <p className="text-xs text-slate-400">{notice.circularNumber} • {notice.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Excursion Logistics Box */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 text-xs space-y-3">
            <h4 className="font-semibold text-purple-400 uppercase tracking-wider text-[11px]">
              Excursion & Event Parameters
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Destination</span>
                <span className="font-semibold text-white">{consentDetails.destination}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Event Date</span>
                <span className="font-semibold text-white">{consentDetails.eventDate}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Transit Window</span>
                <span className="font-semibold text-white">{consentDetails.departureTime} - {consentDetails.returnTime}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Excursion Fee</span>
                <span className="font-semibold text-emerald-400">
                  {consentDetails.feeAmount === 0 ? 'Free / Sponsored' : `₹${consentDetails.feeAmount}`}
                </span>
              </div>
            </div>

            {/* Safety Guidelines */}
            <div className="pt-2">
              <span className="font-semibold text-slate-300 block mb-1">Safety Protocols & Accompanying Staff:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                {consentDetails.safetyGuidelines.map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Form for Parent */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-purple-400" /> Guardian Authorization Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Parent / Legal Guardian Full Name</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Student Name & Grade / Roll</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Emergency Contact Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Medical / Allergy Disclosures</label>
                <input
                  type="text"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="e.g. Asthma, Peanut allergy, None..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Checkbox agreement */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-0"
                />
                <span>
                  I give full consent for my ward to participate in this educational activity. I confirm the emergency contact info is accurate and authorize the school medical squad to render emergency care if required.
                </span>
              </label>
            </div>
          </div>

          {/* Audit Log of Signed Consents */}
          {consentDetails.signatures && consentDetails.signatures.length > 0 && (
            <div className="pt-2">
              <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Recent Guardian Signatures Received:
              </h5>
              <div className="space-y-2">
                {consentDetails.signatures.slice(0, 3).map((sig, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-200">{sig.parentName}</span>
                      <span className="text-slate-400 ml-2">({sig.studentName})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">{sig.signedAt}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px]">
                        VERIFIED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => handleSubmit('DECLINED')}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            Decline Participation
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit('APPROVED')}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              {isSubmitting ? 'Signing...' : 'Digitally Sign & Approve Consent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
