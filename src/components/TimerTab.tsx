/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { 
  Play, Pause, RotateCcw, Timer as TimerIcon, BookOpen, 
  Check, Award, MessageSquare, AlertCircle, Coffee 
} from 'lucide-react';

export default function TimerTab() {
  const { subjects, logStudySession } = usePlanner();

  // Mode: 'focus' (25m), 'shortBreak' (5m), 'longBreak' (15m)
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  // Custom states
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [sessionNotes, setSessionNotes] = useState('');
  const [loggedToday, setLoggedToday] = useState<Array<{ subject: string, duration: number }>>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to switch modes
  const handleModeChange = (newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setIsActive(false);
    setMode(newMode);
    if (newMode === 'focus') setSecondsLeft(25 * 60);
    else if (newMode === 'shortBreak') setSecondsLeft(5 * 60);
    else if (newMode === 'longBreak') setSecondsLeft(15 * 60);
  };

  // Timer Tick implementation
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    if (timerRef.current) clearInterval(timerRef.current);

    if (mode === 'focus') {
      const minutesCompleted = 25;
      logStudySession(selectedSubjectId, minutesCompleted, sessionNotes);
      
      const subName = subjects.find(s => s.id === selectedSubjectId)?.name || 'General study';
      setLoggedToday(prev => [...prev, { subject: subName, duration: minutesCompleted }]);
      
      alert(`🎉 Fantastic job! You focused for ${minutesCompleted} minutes. Your session has been added to your study analytics!`);
      
      // Auto toggle to break
      handleModeChange('shortBreak');
    } else {
      alert(`☕ Break time is over! Ready to focus again?`);
      handleModeChange('focus');
    }
    
    setSessionNotes('');
  };

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    handleModeChange(mode);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  const progressPercent = () => {
    const total = mode === 'focus' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
    return ((total - secondsLeft) / total) * 100;
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Focus Pomodoro Timer</h1>
        <p className="text-xs text-slate-500">Block distractions, trigger structured focus phases, and log study accomplishments dynamically</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main interactive timer circle panel (Left 2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
          
          {/* Mode Selector pills */}
          <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-2xl z-10">
            <button
              onClick={() => handleModeChange('focus')}
              className={`text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer ${
                mode === 'focus' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Focus Session (25m)
            </button>
            <button
              onClick={() => handleModeChange('shortBreak')}
              className={`text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer ${
                mode === 'shortBreak' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Short Break (5m)
            </button>
            <button
              onClick={() => handleModeChange('longBreak')}
              className={`text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer ${
                mode === 'longBreak' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Huge Circular Timer display */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Background circular border */}
            <svg className="absolute w-full h-full rotate-270 transform">
              <circle
                cx="128"
                cy="128"
                r="116"
                stroke="#F1F5F9"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="128"
                cy="128"
                r="116"
                stroke={mode === 'focus' ? '#4F46E5' : mode === 'shortBreak' ? '#10B981' : '#334155'}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="728"
                strokeDashoffset={728 - (728 * progressPercent()) / 100}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>

            {/* Core digits */}
            <div className="text-center space-y-1">
              <p className="text-5xl font-black font-mono tracking-tighter text-slate-900">
                {formatTime(secondsLeft)}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {mode === 'focus' ? 'Focus Interval' : 'Rest Interval'}
              </p>
            </div>
          </div>

          {/* Core controls buttons */}
          <div className="flex gap-4 items-center z-10">
            <button
              onClick={handleReset}
              className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-full transition cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleToggle}
              className={`p-5 text-white rounded-full transition transform hover:scale-105 cursor-pointer shadow-md ${
                isActive 
                  ? 'bg-rose-600 hover:bg-rose-700' 
                  : mode === 'focus' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              title={isActive ? 'Pause' : 'Start'}
            >
              {isActive ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
            </button>
            <div className="w-11"></div> {/* Spacer balance */}
          </div>

        </div>

        {/* Focus setting logging panel (Right Column) */}
        <div className="space-y-6">
          
          {/* Active session checklist */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Focus Task Config
            </h3>

            <div className="space-y-3.5">
              {/* Select subject */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focus Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={isActive}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none cursor-pointer"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Achievement Note */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Aim / Notes</label>
                <textarea
                  placeholder="e.g. Study double integrals and practice problem set"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none resize-none"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Today's Focus accomplishments ticker */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/50 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Award className="w-4 h-4 text-emerald-600" />
              Accomplished Today
            </h3>

            {loggedToday.length === 0 ? (
              <div className="text-center py-6 bg-white rounded-2xl border border-slate-100">
                <Coffee className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-[11px] text-slate-500">No sessions logged today.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Let's finish a 25-minute study cycle!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {loggedToday.map((sess, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-3 border border-slate-100 flex items-center justify-between gap-3 shadow-xs">
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{sess.subject}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Pomodoro block completed</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg shrink-0">
                      +{sess.duration}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
