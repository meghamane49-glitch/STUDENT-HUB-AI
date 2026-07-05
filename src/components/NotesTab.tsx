/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { 
  Sparkles, BookOpen, Trash2, Edit3, Plus, Search, 
  ChevronRight, RefreshCw, Eye, Lightbulb, FileText, 
  HelpCircle, EyeOff, Check, X, ShieldAlert 
} from 'lucide-react';
import { Note, QuizQuestion, Flashcard } from '../types';

export default function NotesTab() {
  const { subjects, notes, addNote, updateNote, deleteNote } = usePlanner();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  const [activeNote, setActiveNote] = useState<Note | null>(notes[0] || null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [content, setContent] = useState('');

  // AI features states
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [learnedCardsCount, setLearnedCardsCount] = useState(0);

  // Active note helper
  const handleNoteSelect = (note: Note) => {
    setActiveNote(note);
    // Reset AI States
    setQuizQuestions(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setFlashcards(null);
    setIsFlipped(false);
    setCurrentCardIdx(0);
    setLearnedCardsCount(0);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !subjectId || !content) return;

    addNote({
      title: noteTitle,
      subjectId,
      content,
    });

    setIsFormOpen(false);
    // reset form fields
    setNoteTitle('');
    setSubjectId('');
    setContent('');
  };

  const startEditNote = () => {
    if (!activeNote) return;
    setNoteTitle(activeNote.title);
    setSubjectId(activeNote.subjectId);
    setContent(activeNote.content);
    setIsEditing(true);
  };

  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !noteTitle || !subjectId || !content) return;

    updateNote(activeNote.id, {
      title: noteTitle,
      subjectId,
      content,
    });

    setIsEditing(false);
    // update local active note reference
    setActiveNote(prev => prev ? {
      ...prev,
      title: noteTitle,
      subjectId,
      content,
    } : null);
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    setActiveNote(notes.find(n => n.id !== id) || null);
  };

  // AI Summarize handler
  const handleAISummarize = async () => {
    if (!activeNote) return;
    setSummarizing(true);
    setSummaryError(null);
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteTitle: activeNote.title,
          content: activeNote.content,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error occurred during note summarization.');
      }

      const summaryData = await response.json();
      
      // Save summaries to the active note
      updateNote(activeNote.id, {
        summary: summaryData.summary,
        keyPoints: summaryData.keyPoints,
        formulas: summaryData.formulas
      });

      setActiveNote(prev => prev ? {
        ...prev,
        ...summaryData
      } : null);
    } catch (err: any) {
      setSummaryError(err.message || 'Failed to generate summary.');
    } finally {
      setSummarizing(false);
    }
  };

  // AI Quiz handler
  const handleAIGenerateQuiz = async () => {
    if (!activeNote) return;
    setGeneratingQuiz(true);
    setQuizError(null);
    setQuizQuestions(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteTitle: activeNote.title,
          content: activeNote.content,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate revision quiz.');
      }

      const questions = await response.json();
      setQuizQuestions(questions);
    } catch (err: any) {
      setQuizError(err.message || 'Quiz generation failed.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // AI Flashcard handler
  const handleAIGenerateFlashcards = async () => {
    if (!activeNote) return;
    setGeneratingFlashcards(true);
    setFlashcardError(null);
    setFlashcards(null);
    setIsFlipped(false);
    setCurrentCardIdx(0);
    setLearnedCardsCount(0);
    try {
      const response = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteTitle: activeNote.title,
          content: activeNote.content,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate active-recall flashcards.');
      }

      const cards = await response.json();
      setFlashcards(cards);
    } catch (err: any) {
      setFlashcardError(err.message || 'Flashcards generation failed.');
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || n.subjectId === filterSubject;

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lecture & Study Notes</h1>
          <p className="text-xs text-slate-500">Organize class notes, synthesize revision files, and let AI generate active recall quizzes</p>
        </div>
        <button
          onClick={() => { setIsFormOpen(true); setIsEditing(false); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column: notes directory index */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-2">Notebooks</h2>
            
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-8.5 pr-3 py-2 outline-none"
              />
            </div>

            {/* Subject Dropdown */}
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Note index list */}
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {filteredNotes.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">No notes found.</p>
              ) : (
                filteredNotes.map((note) => {
                  const sub = subjects.find(s => s.id === note.subjectId);
                  const isSelected = activeNote?.id === note.id;

                  return (
                    <button
                      key={note.id}
                      onClick={() => handleNoteSelect(note)}
                      className={`w-full text-left p-3 rounded-2xl flex flex-col gap-1 transition border cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                          : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-max ${
                        isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sub?.name || 'General'}
                      </span>
                      <p className="text-xs font-bold truncate">{note.title}</p>
                      <p className={`text-[10px] line-clamp-1 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {note.content}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Right Columns: Note Editor & AI Revision Studio */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Note Form Modal */}
          {isFormOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">Create New Study Note</h3>
                  <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateNote} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Note Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Green's Theorem derivation"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        required
                        className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                      <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        required
                        className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none cursor-pointer"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notes Content</label>
                    <textarea
                      placeholder="Type or paste your study material, lecture transcript, or textbook notes here..."
                      rows={12}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none resize-none font-sans"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2.5 px-4 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 px-4 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      Save Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeNote ? (
            <div className="space-y-6">
              
              {/* Active Note Content Viewer/Editor */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                
                {isEditing ? (
                  <form onSubmit={handleUpdateNote} className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <h3 className="font-bold text-slate-800 text-sm">Editing Note</h3>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setIsEditing(false)} 
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="text-xs font-bold bg-indigo-600 text-white py-1.5 px-3.5 rounded-lg hover:bg-indigo-700 transition"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        required
                        className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                      />
                      <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        required
                        className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none resize-none font-mono"
                    />
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start pb-4 border-b border-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: subjects.find(s => s.id === activeNote.subjectId)?.color || '#CBD5E1' }}></span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {subjects.find(s => s.id === activeNote.subjectId)?.name || 'General'}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-950 mt-1">{activeNote.title}</h2>
                      </div>
                      
                      {/* Note tools */}
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={startEditNote}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                          title="Edit Note"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(activeNote.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-sans max-h-96 overflow-y-auto pr-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      {activeNote.content}
                    </div>

                    {/* AI Quick buttons bar */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={handleAISummarize}
                        disabled={summarizing}
                        className="bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-100 font-bold text-[11px] py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {summarizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        AI Summarize Note
                      </button>
                      <button
                        onClick={handleAIGenerateQuiz}
                        disabled={generatingQuiz}
                        className="bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-100 font-bold text-[11px] py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {generatingQuiz ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
                        AI Generate Revision Quiz
                      </button>
                      <button
                        onClick={handleAIGenerateFlashcards}
                        disabled={generatingFlashcards}
                        className="bg-purple-50 hover:bg-purple-100/80 text-purple-800 border border-purple-100 font-bold text-[11px] py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {generatingFlashcards ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                        AI Generate Revision Flashcards
                      </button>
                    </div>
                  </>
                )}

              </div>

              {/* AI Summarization result panel */}
              {(activeNote.summary || summarizing || summaryError) && (
                <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    AI Note Synthesis & Formulas
                  </h3>

                  {summarizing ? (
                    <div className="space-y-3">
                      <div className="h-3 bg-indigo-100/60 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-indigo-100/60 rounded animate-pulse w-5/6"></div>
                      <div className="h-3 bg-indigo-100/60 rounded animate-pulse w-2/3"></div>
                    </div>
                  ) : summaryError ? (
                    <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl">{summaryError}</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <h4 className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">Executive Summary:</h4>
                        <p className="text-xs text-slate-700 leading-relaxed italic">{activeNote.summary}</p>
                      </div>

                      {activeNote.keyPoints && activeNote.keyPoints.length > 0 && (
                        <div className="space-y-1.5">
                          <h4 className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">Core Takeaways:</h4>
                          <ul className="space-y-1 list-disc pl-4 text-xs text-slate-600">
                            {activeNote.keyPoints.map((kp, idx) => (
                              <li key={idx}>{kp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeNote.formulas && activeNote.formulas.length > 0 && (
                        <div className="space-y-1.5">
                          <h4 className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">Formulas & Definitions:</h4>
                          <div className="flex flex-wrap gap-2">
                            {activeNote.formulas.map((frm, idx) => (
                              <code key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold">
                                {frm}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI Quiz Panel */}
              {(quizQuestions || generatingQuiz || quizError) && (
                <div className="bg-amber-50/20 border border-amber-200/60 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-amber-100/50">
                    <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4 text-amber-600 animate-pulse" />
                      Active-Recall Revision Quiz
                    </h3>
                    {quizQuestions && (
                      <button 
                        onClick={handleAIGenerateQuiz}
                        className="text-amber-700 hover:text-amber-900 text-xs font-semibold flex items-center gap-1 hover:underline"
                      >
                        Regenerate Quiz <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {generatingQuiz ? (
                    <div className="py-8 space-y-3 text-center">
                      <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs text-slate-500 animate-pulse font-medium">Extracting concept quiz items from your syllabus content...</p>
                    </div>
                  ) : quizError ? (
                    <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl">{quizError}</p>
                  ) : quizQuestions ? (
                    <div className="space-y-5">
                      {quizQuestions.map((q, qIdx) => {
                        const isSelected = quizAnswers[q.id] !== undefined;
                        return (
                          <div key={q.id} className="space-y-2 bg-white rounded-2xl p-4 border border-amber-100/40 shadow-xs">
                            <p className="text-xs font-bold text-slate-800 flex gap-2">
                              <span>{qIdx + 1}.</span>
                              <span>{q.question}</span>
                            </p>

                            {/* Options for MCQ */}
                            {q.type === 'mcq' && q.options && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {q.options.map((opt) => {
                                  const isChecked = quizAnswers[q.id] === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      disabled={quizSubmitted}
                                      onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                      className={`text-left text-xs p-2.5 rounded-xl border transition ${
                                        isChecked ? 'bg-amber-50 border-amber-500 font-bold text-amber-900' : 'bg-transparent border-slate-100 hover:bg-slate-50'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* True False options */}
                            {q.type === 'true-false' && (
                              <div className="flex gap-2 mt-2">
                                {['True', 'False'].map((opt) => {
                                  const isChecked = quizAnswers[q.id]?.toLowerCase() === opt.toLowerCase();
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      disabled={quizSubmitted}
                                      onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt.toLowerCase() }))}
                                      className={`text-xs px-4 py-2 rounded-xl border transition font-medium ${
                                        isChecked ? 'bg-amber-50 border-amber-500 font-bold text-amber-900' : 'bg-transparent border-slate-100 hover:bg-slate-50'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Short Answer text field */}
                            {q.type === 'short-answer' && (
                              <input
                                type="text"
                                placeholder="Type your concise revision answer..."
                                disabled={quizSubmitted}
                                value={quizAnswers[q.id] || ''}
                                onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl p-2 mt-2 outline-none"
                              />
                            )}

                            {/* Feedback */}
                            {quizSubmitted && (
                              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                  {quizAnswers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase() || 
                                   (q.type === 'short-answer' && quizAnswers[q.id]?.trim() !== '') ? (
                                    <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Graded</span>
                                  ) : (
                                    <span className="text-rose-600 font-bold flex items-center gap-1"><X className="w-3.5 h-3.5" /> Review Needed</span>
                                  )}
                                </p>
                                <p className="text-[11px] font-medium"><span className="font-bold text-slate-700">Answer:</span> {q.correctAnswer}</p>
                                <p className="text-[11px] text-slate-500 italic">"{q.explanation}"</p>
                              </div>
                            )}

                          </div>
                        );
                      })}

                      {/* Submit Quiz actions */}
                      <div className="flex gap-2 justify-end pt-2">
                        {!quizSubmitted ? (
                          <button
                            type="button"
                            onClick={() => setQuizSubmitted(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
                          >
                            Grade Quiz Response
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
                          >
                            Reset Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* AI Flashcards Revise Game Panel */}
              {(flashcards || generatingFlashcards || flashcardError) && (
                <div className="bg-purple-50/20 border border-purple-200/60 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-purple-100/50">
                    <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Active-Recall Revision Flashcards
                    </h3>
                    {flashcards && (
                      <span className="text-xs text-slate-500 font-bold font-mono">
                        {currentCardIdx + 1} / {flashcards.length}
                      </span>
                    )}
                  </div>

                  {generatingFlashcards ? (
                    <div className="py-8 space-y-3 text-center">
                      <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs text-slate-500 animate-pulse font-medium">Drafting active recall flashcards...</p>
                    </div>
                  ) : flashcardError ? (
                    <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl">{flashcardError}</p>
                  ) : flashcards ? (
                    <div className="space-y-6 flex flex-col items-center">
                      
                      {/* Active Flashcard Card view */}
                      <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className={`w-full max-w-md h-56 rounded-2xl border text-center p-8 flex flex-col justify-center items-center gap-3 relative cursor-pointer shadow-sm hover:shadow-md transition duration-300 transform ${
                          isFlipped 
                            ? 'bg-purple-600 text-white border-purple-600 rotate-y-180' 
                            : 'bg-white text-slate-800 border-purple-200/50'
                        }`}
                      >
                        <span className={`text-[9px] uppercase tracking-wider font-bold absolute top-4 ${isFlipped ? 'text-purple-200' : 'text-purple-500'}`}>
                          {isFlipped ? 'Answer View (Click to flip back)' : 'Question View (Click to flip)'}
                        </span>
                        
                        <p className={`text-sm leading-relaxed font-bold font-sans`}>
                          {isFlipped ? flashcards[currentCardIdx].back : flashcards[currentCardIdx].front}
                        </p>

                        <span className="text-[10px] text-slate-400 font-semibold italic flex items-center gap-1 absolute bottom-4">
                          <Eye className="w-3.5 h-3.5 text-purple-400" /> Click anywhere to flip
                        </span>
                      </button>

                      {/* Card Control Actions */}
                      <div className="flex gap-3 justify-center w-full max-w-md">
                        <button
                          onClick={() => {
                            setIsFlipped(false);
                            setCurrentCardIdx(prev => (prev - 1 + flashcards.length) % flashcards.length);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => {
                            setLearnedCardsCount(prev => prev + 1);
                            setIsFlipped(false);
                            setCurrentCardIdx(prev => (prev + 1) % flashcards.length);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition shadow-xs cursor-pointer"
                        >
                          Knew it! Next
                        </button>
                      </div>

                    </div>
                  ) : null}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h2 className="text-base font-bold text-slate-800">No notes cataloged</h2>
              <p className="text-xs text-slate-400 max-w-xs leading-normal">
                Click "New Note" to record summaries of your classes, lectures, or homework guidelines to study smarter!
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
