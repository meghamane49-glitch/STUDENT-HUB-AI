/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { 
  GraduationCap, Plus, Trash2, Award, BookOpen, 
  ChevronRight, Star, AlertCircle, RefreshCw 
} from 'lucide-react';
import { GPACourse } from '../types';

export default function GpaTab() {
  const { subjects, updateSubject } = usePlanner();

  const GRADE_SCALE: { [key: string]: number } = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
  };

  // State to hold courses (derived initially from subjects)
  const [courses, setCourses] = useState<GPACourse[]>(() => {
    return subjects.map(sub => ({
      id: sub.id,
      name: sub.name,
      credits: sub.credits || 3,
      grade: sub.grade || 'A'
    }));
  });

  // Keep state synchronized with subjects
  useEffect(() => {
    setCourses(subjects.map(sub => ({
      id: sub.id,
      name: sub.name,
      credits: sub.credits || 3,
      grade: sub.grade || 'A'
    })));
  }, [subjects]);

  // State for adding a temporary/custom course
  const [customName, setCustomName] = useState('');
  const [customCredits, setCustomCredits] = useState(3);
  const [customGrade, setCustomGrade] = useState('A');

  // Input fields for cumulative calculations
  const [priorCredits, setPriorCredits] = useState(30);
  const [priorGPA, setPriorGPA] = useState(3.4);

  const addCustomCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName) return;

    const newCourse: GPACourse = {
      id: `custom-${Date.now()}`,
      name: customName,
      credits: customCredits,
      grade: customGrade
    };

    setCourses(prev => [...prev, newCourse]);
    setCustomName('');
  };

  const deleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const handleGradeChange = (id: string, grade: string) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, grade } : c));
    // Persist if it is a main subject course
    if (!id.startsWith('custom-')) {
      updateSubject(id, { grade });
    }
  };

  const handleCreditsChange = (id: string, credits: number) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, credits } : c));
    if (!id.startsWith('custom-')) {
      updateSubject(id, { credits });
    }
  };

  // Calculation logic
  const calculateGPA = () => {
    let totalGradePoints = 0;
    let totalCredits = 0;

    courses.forEach(c => {
      const gPoints = GRADE_SCALE[c.grade] !== undefined ? GRADE_SCALE[c.grade] : 4.0;
      totalGradePoints += (gPoints * c.credits);
      totalCredits += c.credits;
    });

    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0.0;
    return {
      gpa: parseFloat(gpa.toFixed(2)),
      credits: totalCredits
    };
  };

  const { gpa: semesterGpa, credits: semesterCredits } = calculateGPA();

  const calculateCGPA = () => {
    const semGPA = semesterGpa;
    const semCredits = semesterCredits;

    const priorPts = priorCredits * priorGPA;
    const semPts = semCredits * semGPA;

    const totalCredits = priorCredits + semCredits;
    const cgpa = totalCredits > 0 ? (priorPts + semPts) / totalCredits : 0.0;

    return parseFloat(cgpa.toFixed(2));
  };

  const cgpa = calculateCGPA();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">GPA & CGPA Calculator</h1>
        <p className="text-xs text-slate-500">Log course achievements, compute GPA projections, and align transcripts with academic targets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Course grades list (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Active Semester Courses
            </h2>

            {courses.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-500 font-medium">No courses listed.</p>
                <p className="text-[10px] text-slate-400 mt-1">Configure subjects in State to auto-load semester trackers.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div 
                    key={course.id} 
                    className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 truncate max-w-xs">{course.name}</h4>
                      <p className="text-[10px] text-slate-400">Course Identifier: {course.id}</p>
                    </div>

                    <div className="flex gap-3 items-center w-full sm:w-auto justify-between sm:justify-end">
                      {/* Credits selection */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Credits:</span>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={course.credits}
                          onChange={(e) => handleCreditsChange(course.id, parseInt(e.target.value) || 3)}
                          className="w-12 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-1 text-center outline-none"
                        />
                      </div>

                      {/* Grade selection */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Grade:</span>
                        <select
                          value={course.grade}
                          onChange={(e) => handleGradeChange(course.id, e.target.value)}
                          className="text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-1 outline-none cursor-pointer"
                        >
                          {Object.keys(GRADE_SCALE).map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      {/* Delete custom course */}
                      {course.id.startsWith('custom-') && (
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add extra custom course form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Add Projected Course / Transfer Credits</h3>
            <form onSubmit={addCustomCourse} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Course name (e.g. Physics Lab)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="sm:col-span-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none"
              />
              <select
                value={customCredits}
                onChange={(e) => setCustomCredits(parseInt(e.target.value))}
                className="text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none cursor-pointer"
              >
                {[1,2,3,4,5,6].map(c => (
                  <option key={c} value={c}>{c} Credits</option>
                ))}
              </select>
              <select
                value={customGrade}
                onChange={(e) => setCustomGrade(e.target.value)}
                className="text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none cursor-pointer"
              >
                {Object.keys(GRADE_SCALE).map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
              <button
                type="submit"
                className="sm:col-span-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Projected Course
              </button>
            </form>
          </div>
        </div>

        {/* Calculations / CGPA Targets panel (Right Column) */}
        <div className="space-y-6">
          
          {/* Semester & CGPA scoreboards */}
          <div className="bg-indigo-950 text-white rounded-2xl p-6 border border-indigo-900/50 shadow-lg space-y-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5">
              <GraduationCap className="w-40 h-40" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/10 z-10 relative">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">Semester GPA</span>
                <p className="text-4xl font-black text-white font-mono">{semesterGpa.toFixed(2)}</p>
                <span className="text-[10px] text-slate-400 font-medium">Credits: {semesterCredits}</span>
              </div>
              <div className="space-y-1 border-l border-white/10 pl-4">
                <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">Cumulative CGPA</span>
                <p className="text-4xl font-black text-emerald-400 font-mono">{cgpa.toFixed(2)}</p>
                <span className="text-[10px] text-slate-400 font-medium">Total: {semesterCredits + priorCredits} credits</span>
              </div>
            </div>

            {/* Visual target progress bar */}
            <div className="space-y-2 z-10 relative">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Academic Standing Target</span>
                <span className="text-indigo-300">{Math.min(100, Math.round((cgpa / 4.0) * 100))}% toward 4.0 GP</span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (cgpa / 4.0) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Cumulative configuration */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              Prior History (CGPA Weights)
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Previously Earned Credits</label>
                <input
                  type="number"
                  value={priorCredits}
                  onChange={(e) => setPriorCredits(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cumulative Prior GPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={priorGPA}
                  onChange={(e) => setPriorGPA(Math.min(4.0, Math.max(0, parseFloat(e.target.value) || 0.0)))}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
