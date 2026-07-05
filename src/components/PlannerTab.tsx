/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { 
  Sparkles, Calendar, BookOpen, Clock, Lightbulb, Check, 
  RefreshCw, ListPlus, GraduationCap, CalendarClock 
} from 'lucide-react';

export default function PlannerTab() {
  const { subjects, setTimetableEvents, addTimetableEvent, clearTimetable } = usePlanner();

  // Inputs
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(subjects.map(s => s.name));
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [examDate, setExamDate] = useState('');
  const [targetGrade, setTargetGrade] = useState('Excellent (A/A+)');

  // API States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<{
    timetable: Array<{
      subjectName: string;
      title: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      type: 'study' | 'revision' | 'break';
    }>;
    revisionSchedule: Array<{
      date: string;
      subject: string;
      topic: string;
      tasks: string[];
    }>;
    tips: string[];
  } | null>(null);

  const toggleSubject = (name: string) => {
    setSelectedSubjects(prev => 
      prev.includes(name) 
        ? prev.filter(s => s !== name) 
        : [...prev, name]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubjects.length === 0 || !examDate) {
      setError('Please select at least one subject and enter your exam target date.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: selectedSubjects,
          hoursPerDay,
          examDate,
          targetGrade,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error occurred while creating study plan.');
      }

      const plan = await response.json();
      setGeneratedPlan(plan);
    } catch (err: any) {
      setError(err.message || 'Failed to connect with the AI Planner. Please make sure your API key is correctly initialized.');
    } finally {
      setLoading(false);
    }
  };

  const applyToTimetable = () => {
    if (!generatedPlan) return;
    
    clearTimetable();

    generatedPlan.timetable.forEach((slot, index) => {
      // Find subject ID
      const matchingSub = subjects.find(s => s.name.toLowerCase() === slot.subjectName.toLowerCase());
      const subjectId = matchingSub ? matchingSub.id : 'general';

      addTimetableEvent({
        subjectId,
        title: slot.title,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        type: slot.type,
      });
    });

    alert('AI study planner successfully synced with your active weekly schedule!');
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Smart Planner</h1>
        <p className="text-xs text-slate-500">Provide your exam constraints and let our Gemini AI model formulate a balanced study timetable</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Parameters Form (Left) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <CalendarClock className="w-4 h-4 text-indigo-600" />
              Planner Input
            </h2>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              
              {/* Exam Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none"
                />
              </div>

              {/* Focus Hours Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Study Hours / Day</label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{hoursPerDay} hrs</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 hr</span>
                  <span>6 hrs</span>
                  <span>12 hrs</span>
                </div>
              </div>

              {/* Target Grade Option */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target Academic Goal</label>
                <select
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none cursor-pointer"
                >
                  <option value="Excellent (A/A+)">Excellent (A/A+)</option>
                  <option value="Very Good (B/B+)">Very Good (B/B+)</option>
                  <option value="Pass & Consolidate (C)">Pass & Consolidate (C)</option>
                </select>
              </div>

              {/* Subject Select checkboxes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Include Subjects</label>
                {subjects.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-100">Please configure subjects first.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                    {subjects.map((sub) => {
                      const isChecked = selectedSubjects.includes(sub.name);
                      return (
                        <label 
                          key={sub.id} 
                          className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs border transition ${
                            isChecked ? 'bg-white border-indigo-200 shadow-xs' : 'bg-transparent border-transparent hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSubject(sub.name)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }}></span>
                          <span className="font-medium text-slate-700">{sub.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Formulating Planner...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" /> Generate Study Schedule
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Output Planner view (Right 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 text-xs text-rose-600">
              <Lightbulb className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Generation Error</p>
                <p className="mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {!generatedPlan && !loading && (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
              <div className="bg-indigo-50 p-4 rounded-full border border-indigo-100/50 text-indigo-600">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Ready to synthesize your study routine?</h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Enter your exams, study capacities, and preferred targets on the left, and let Gemini compile a dynamic, high-yield timetable.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <h3 className="font-bold text-slate-800 text-base">Gemini is designing your planner</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Structuring active recall segments, inserting cognitive restoration breaks, and aligning syllabus workloads...
              </p>
            </div>
          )}

          {generatedPlan && !loading && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Timetable Panel */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Weekly Timetable Draft</h3>
                    <p className="text-xs text-slate-500">Proposed weekly focus chunks</p>
                  </div>
                  <button
                    onClick={applyToTimetable}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <ListPlus className="w-4 h-4" /> Apply to Weekly Schedule
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {dayNames.map((dayName, idx) => {
                    const dayNum = idx + 1;
                    const slotsForDay = generatedPlan.timetable.filter(s => s.dayOfWeek === dayNum);

                    return (
                      <div key={dayName} className="border-b border-slate-50 pb-3 last:border-b-0">
                        <h4 className="text-xs font-bold text-slate-900 mb-2">{dayName}</h4>
                        {slotsForDay.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No study slots allocated for this day.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {slotsForDay.map((slot, sIdx) => {
                              const isStudy = slot.type === 'study';
                              const isRevision = slot.type === 'revision';
                              return (
                                <div 
                                  key={sIdx} 
                                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                    isStudy ? 'bg-indigo-50/50 border-indigo-100/50' : 
                                    isRevision ? 'bg-amber-50/40 border-amber-100/50' : 'bg-slate-50 border-slate-200/50'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-2 h-2 rounded-full ${isStudy ? 'bg-indigo-500' : isRevision ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                                      <p className="text-xs font-bold text-slate-800 leading-tight">{slot.title}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{slot.subjectName}</p>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 font-bold">{slot.startTime} - {slot.endTime}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revision Calendar Schedule */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Milestone Exam Revision Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {generatedPlan.revisionSchedule.map((rev, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{rev.date}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{rev.subject}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{rev.topic}</h4>
                        <div className="space-y-1">
                          {rev.tasks.map((task, tIdx) => (
                            <div key={tIdx} className="flex gap-2 items-start text-[11px] text-slate-600">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Tips */}
              <div className="bg-indigo-950 text-white rounded-3xl p-6 border border-indigo-900/50 shadow-md">
                <h3 className="text-sm font-bold flex items-center gap-1.5 uppercase tracking-wider text-indigo-300 mb-3">
                  <Lightbulb className="w-4 h-4 text-indigo-400" />
                  Actionable AI Study Hacks
                </h3>
                <ul className="space-y-2.5">
                  {generatedPlan.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-indigo-100">
                      <span className="font-bold text-indigo-400 shrink-0">0{idx+1}.</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
