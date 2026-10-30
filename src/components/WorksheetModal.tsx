'use client';

import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';

interface WorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizData: {
    title: string;
    subject: string;
    grade: string;
    board: string;
    totalMarks: number;
    estimatedTime: string;
    instructions: string[];
    questions: {
      id: string;
      type: 'MCQ' | 'SHORT_ANSWER';
      prompt: string;
      options?: string[];
      correctAnswer: string;
      explanation: string;
      marks: number;
    }[];
  } | null;
}

export default function WorksheetModal({ isOpen, onClose, quizData }: WorksheetModalProps) {
  if (!isOpen || !quizData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header toolbar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Printable Student Worksheet</h2>
              <p className="text-xs text-slate-400">Official Exam / Diagnostic Assessment Sheet</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-purple-600/20"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Worksheet Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-950 print:bg-white print:text-black print:p-0 print:overflow-visible">
          <div id="printable-worksheet" className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 print:border-none print:bg-white print:p-6 print:text-black">
            
            {/* School Header */}
            <div className="border-b-2 border-slate-700 print:border-black pb-4 mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white print:text-black uppercase">NexEdu Global Academy</h1>
                <p className="text-xs text-slate-400 print:text-gray-600">CBSE & Cambridge International Accredited Campus • Examination & Assessment Cell</p>
                <div className="mt-2 text-sm font-semibold text-purple-400 print:text-black">
                  {quizData.title}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400 print:text-gray-600">
                <p><span className="font-semibold text-slate-200 print:text-black">Curriculum:</span> {quizData.board}</p>
                <p><span className="font-semibold text-slate-200 print:text-black">Class/Grade:</span> {quizData.grade}</p>
                <p><span className="font-semibold text-slate-200 print:text-black">Time Allowed:</span> {quizData.estimatedTime}</p>
                <p><span className="font-semibold text-slate-200 print:text-black">Max Marks:</span> {quizData.totalMarks}</p>
              </div>
            </div>

            {/* Student Fill-in Box */}
            <div className="grid grid-cols-3 gap-4 border border-slate-700 print:border-black rounded-lg p-3 mb-6 text-xs bg-slate-800/40 print:bg-gray-50 print:text-black">
              <div>
                <span className="font-semibold text-slate-400 print:text-black">Student Name: </span>
                <span className="border-b border-dotted border-slate-500 print:border-black inline-block w-36"></span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 print:text-black">Roll No / ID: </span>
                <span className="border-b border-dotted border-slate-500 print:border-black inline-block w-28"></span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 print:text-black">Date: </span>
                <span className="border-b border-dotted border-slate-500 print:border-black inline-block w-24"></span>
              </div>
            </div>

            {/* General Instructions */}
            <div className="mb-6 bg-slate-800/20 border border-slate-800 print:border-gray-300 rounded-lg p-3 text-xs text-slate-300 print:text-gray-700">
              <span className="font-semibold text-slate-200 print:text-black uppercase tracking-wider block mb-1">General Instructions:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {quizData.instructions.map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ul>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {quizData.questions.map((q, idx) => (
                <div key={q.id} className="pb-4 border-b border-slate-800/80 print:border-gray-200 last:border-b-0">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <p className="text-sm font-medium text-slate-100 print:text-black">
                      <span className="font-bold text-purple-400 print:text-black mr-2">Q{idx + 1}.</span>
                      {q.prompt}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 print:bg-gray-100 text-slate-300 print:text-black font-semibold whitespace-nowrap">
                      [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                    </span>
                  </div>

                  {/* Multiple Choice Options */}
                  {q.type === 'MCQ' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pl-6">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 text-xs text-slate-300 print:text-black">
                          <div className="w-4 h-4 rounded-full border border-slate-500 print:border-black flex-shrink-0"></div>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Short Answer Blank Lines */}
                  {q.type === 'SHORT_ANSWER' && (
                    <div className="mt-3 pl-6 space-y-2">
                      <div className="border-b border-dashed border-slate-700 print:border-gray-400 h-6"></div>
                      <div className="border-b border-dashed border-slate-700 print:border-gray-400 h-6"></div>
                      <div className="border-b border-dashed border-slate-700 print:border-gray-400 h-6"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Teacher Sign-off Footer */}
            <div className="mt-12 pt-6 border-t border-slate-800 print:border-black flex justify-between text-xs text-slate-400 print:text-black">
              <div>
                <p>Invigilator Signature: _________________________</p>
              </div>
              <div>
                <p>Score Awarded: _____ / {quizData.totalMarks}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
