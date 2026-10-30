'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  FileCheck,
  Printer,
  Send,
  Copy,
  Clock,
  Layers,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  GraduationCap,
  Award,
  Calendar
} from 'lucide-react';
import WorksheetModal from '@/components/WorksheetModal';

const SUBJECT_OPTIONS = [
  'General Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science & AI',
  'English Literature',
  'Social Studies'
];

const GRADE_OPTIONS = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'Cambridge IGCSE', 'IB MYP/DP'];

const SAMPLE_TOPICS = [
  'Photosynthesis and Cellular Respiration',
  'Quadratic Equations & Parabolic Roots',
  'Newton\'s Laws of Motion & Momentum',
  'The French Revolution & Democratic Ideals',
  'Python Data Structures & Algorithm Complexity',
  'Atomic Structure and Chemical Bonding'
];

export default function EduAIPage() {
  const [selectedSubject, setSelectedSubject] = useState('Biology');
  const [selectedGrade, setSelectedGrade] = useState('Grade 10');
  const [selectedBoard, setSelectedBoard] = useState('CBSE');
  const [topicInput, setTopicInput] = useState('Photosynthesis and Cellular Respiration');
  const [generationMode, setGenerationMode] = useState<'LESSON_PLAN' | 'QUIZ'>('LESSON_PLAN');
  
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlanData, setLessonPlanData] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Modals
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [assignClass, setAssignClass] = useState('10-A');
  const [assignDueDate, setAssignDueDate] = useState('2026-10-30');
  const [isPublishing, setIsPublishing] = useState(false);

  const handleGenerate = async () => {
    if (!topicInput.trim()) {
      setErrorMsg('Please enter a lesson topic to generate.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/edu-ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          grade: selectedGrade,
          board: selectedBoard,
          topic: topicInput,
          mode: generationMode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      if (generationMode === 'LESSON_PLAN') {
        setLessonPlanData(data.data);
      } else {
        setQuizData(data.data);
      }

      setSuccessToast(`Successfully generated ${generationMode === 'LESSON_PLAN' ? 'Lesson Plan' : 'Quiz Assessment'}!`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during AI generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishAssignment = async () => {
    setIsPublishing(true);
    try {
      const title = generationMode === 'LESSON_PLAN' 
        ? lessonPlanData?.homeworkRecommendation?.title || `Homework: ${topicInput}`
        : quizData?.title || `Quiz: ${topicInput}`;
        
      const description = generationMode === 'LESSON_PLAN'
        ? lessonPlanData?.homeworkRecommendation?.prompt || `Study and complete synthesis for ${topicInput}`
        : `Complete the diagnostic mastery quiz on ${topicInput} (${quizData?.totalMarks || 25} Marks).`;

      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          subject: selectedSubject,
          className: assignClass,
          dueDate: assignDueDate,
          entryType: 'HOMEWORK',
          classwork: generationMode === 'LESSON_PLAN' ? lessonPlanData?.timeline?.map((t: any) => `${t.phase}: ${t.studentActivity}`).join(' | ') : 'Quiz completed in class',
          parentNotice: 'Please review and verify student assignment completion.'
        })
      });

      if (!res.ok) throw new Error('Failed to push assignment into Homework Hub');

      setIsPublishModalOpen(false);
      setSuccessToast('Assignment published directly to Homework Hub!');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyClipboard = () => {
    const textToCopy = generationMode === 'LESSON_PLAN' 
      ? JSON.stringify(lessonPlanData, null, 2)
      : JSON.stringify(quizData, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setSuccessToast('Copied curriculum content to clipboard!');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Assistant
            </span>
            <span className="text-xs text-slate-400">NEP 2020 & Cambridge Aligned</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            EduAI Curriculum & Assessment Studio
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate 45-minute structured inquiry lesson plans, cognitive rubrics, and printable mastery quizzes in seconds.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl self-start">
          <button
            onClick={() => setGenerationMode('LESSON_PLAN')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              generationMode === 'LESSON_PLAN'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Lesson Plan
          </button>
          <button
            onClick={() => setGenerationMode('QUIZ')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              generationMode === 'QUIZ'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Quiz & Rubric
          </button>
        </div>
      </div>

      {/* Input Studio Card */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 mb-8 backdrop-blur shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Discipline / Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Target Grade / Standard
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {GRADE_OPTIONS.map((grd) => (
                <option key={grd} value={grd}>{grd}</option>
              ))}
            </select>
          </div>

          {/* Board */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Curriculum Board / Standard
            </label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {BOARD_OPTIONS.map((brd) => (
                <option key={brd} value={brd}>{brd}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Topic Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Lesson Topic or Learning Theme
          </label>
          <div className="relative">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Photosynthesis and Light Reactions, Quadratic Equations, Circular Motion..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-32 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="absolute right-2 top-2 bottom-2 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <span className="text-xs text-slate-500 mr-2">Try sample topics:</span>
          <div className="inline-flex flex-wrap gap-2 mt-1">
            {SAMPLE_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => setTopicInput(topic)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Empty State before Generation */}
      {!lessonPlanData && !quizData && !isLoading && (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">No Content Generated Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Select a subject, grade, and topic above, then click &quot;Generate&quot; to synthesize an inquiry lesson plan or printable assessment quiz.
          </p>
          <button
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-purple-600/20"
          >
            Generate Sample Lesson Plan
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-200">EduAI is Synthesizing Curriculum...</h3>
          <p className="text-xs text-slate-400 mt-1">Applying Bloom&apos;s Taxonomy verbs, structuring timelines, and formatting assessment rubrics.</p>
        </div>
      )}

      {/* RENDER LESSON PLAN RESULTS */}
      {generationMode === 'LESSON_PLAN' && lessonPlanData && !isLoading && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{lessonPlanData.title}</h3>
                <span className="text-xs text-slate-400">{lessonPlanData.duration} • {lessonPlanData.pedagogyFramework}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy JSON
              </button>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" /> Publish to Assignments
              </button>
            </div>
          </div>

          {/* Objectives & Vocabulary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learning Objectives */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Award className="w-4 h-4" /> Targeted Learning Objectives
              </h4>
              <ul className="space-y-3">
                {lessonPlanData.learningObjectives?.map((obj: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Vocabulary & Terminology */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Key Terminology & Domain Lexicon
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lessonPlanData.vocabulary?.map((v: any, i: number) => (
                  <div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    <span className="text-xs font-semibold text-purple-300 block">{v.term}</span>
                    <p className="text-xs text-slate-400 mt-1">{v.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 45-Minute Period Breakdown Timeline */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> 45-Minute Classroom Pedagogical Timeline
            </h4>
            <div className="space-y-4">
              {lessonPlanData.timeline?.map((step: any, i: number) => (
                <div key={i} className="relative pl-6 pb-4 border-l-2 border-slate-800 last:border-l-0 last:pb-0">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-purple-600 border-2 border-slate-950"></div>
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-white">{step.phase}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {step.duration}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 mt-2">
                      <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="font-semibold text-purple-400 block mb-1">Teacher Action:</span>
                        <p>{step.teacherActivity}</p>
                      </div>
                      <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="font-semibold text-emerald-400 block mb-1">Student Role:</span>
                        <p>{step.studentActivity}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scaffolding & Homework Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
                Differentiated Scaffolding
              </h4>
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  <span className="font-semibold text-amber-300 block mb-1">Support Strategy (Intervention):</span>
                  <p className="text-slate-400">{lessonPlanData.differentiatedInstruction?.support}</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  <span className="font-semibold text-emerald-300 block mb-1">Extension Strategy (Accelerated):</span>
                  <p className="text-slate-400">{lessonPlanData.differentiatedInstruction?.extension}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
                Recommended Homework / Follow-Up Task
              </h4>
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">{lessonPlanData.homeworkRecommendation?.title}</span>
                  <span className="text-slate-400">{lessonPlanData.homeworkRecommendation?.estimatedTime}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{lessonPlanData.homeworkRecommendation?.prompt}</p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsPublishModalOpen(true)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30 transition-all"
                  >
                    Publish to Students Now →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER QUIZ & RUBRIC RESULTS */}
      {generationMode === 'QUIZ' && quizData && !isLoading && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{quizData.title}</h3>
                <span className="text-xs text-slate-400">
                  {quizData.totalMarks} Marks • {quizData.estimatedTime} • {quizData.questions?.length} Questions
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWorksheetOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Worksheet
              </button>
              <button
                onClick={handleCopyClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-purple-600/20"
              >
                <Send className="w-3.5 h-3.5" /> Publish to Assignments
              </button>
            </div>
          </div>

          {/* Questions Bank */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-400" /> Generated Question Bank with Answer Keys
            </h4>
            <div className="space-y-6">
              {quizData.questions?.map((q: any, i: number) => (
                <div key={q.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h5 className="text-sm font-medium text-slate-100">
                      <span className="font-bold text-purple-400 mr-2">Q{i + 1}.</span>
                      {q.prompt}
                    </h5>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold whitespace-nowrap">
                      {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                  </div>

                  {/* Multiple Choice Options */}
                  {q.type === 'MCQ' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 mb-3">
                      {q.options.map((opt: string, optIdx: number) => (
                        <div
                          key={optIdx}
                          className={`text-xs p-2.5 rounded-lg border ${
                            opt === q.correctAnswer
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer Key & Explanation */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs space-y-1">
                    <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Correct Answer: <span className="text-slate-200">{q.correctAnswer}</span>
                    </p>
                    <p className="text-slate-400 pl-5">
                      <span className="font-medium text-slate-500">Teacher Note:</span> {q.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grading Rubric Matrix */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" /> Scoring & Evaluation Rubric
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Evaluation Criterion</th>
                    <th className="p-3 font-semibold text-emerald-400">Exemplary (Full Marks)</th>
                    <th className="p-3 font-semibold text-blue-400">Proficient (Passing)</th>
                    <th className="p-3 font-semibold text-amber-400">Developing (Remediation)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {quizData.gradingRubric?.map((rub: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="p-3 font-medium text-white">{rub.criterion}</td>
                      <td className="p-3 text-slate-300">{rub.exemplary}</td>
                      <td className="p-3 text-slate-400">{rub.proficient}</td>
                      <td className="p-3 text-slate-500">{rub.developing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Worksheet Modal */}
      <WorksheetModal
        isOpen={isWorksheetOpen}
        onClose={() => setIsWorksheetOpen(false)}
        quizData={quizData}
      />

      {/* Direct Publish to Homework Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-400" /> Publish Directly to Assignments Hub
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Push this AI-generated curriculum item to the school homework & diary roster.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Target Class</label>
                <select
                  value={assignClass}
                  onChange={(e) => setAssignClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="10-A">Grade 10-A</option>
                  <option value="10-B">Grade 10-B</option>
                  <option value="9-A">Grade 9-A</option>
                  <option value="9-B">Grade 9-B</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Submission Deadline</label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishAssignment}
                disabled={isPublishing}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isPublishing ? 'Publishing...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
