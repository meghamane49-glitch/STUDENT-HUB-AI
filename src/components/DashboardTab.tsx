/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { 
  Sparkles, Flame, CheckCircle, Clock, BookOpen, AlertCircle, 
  ChevronRight, Trophy, Play, Star, RefreshCw 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DashboardTab() {
  const { 
    user, subjects, assignments, exams, studySessions, 
    timetableEvents, updateAssignment, logStudySession, setActiveTab 
  } = usePlanner();

  const [motivation, setMotivation] = useState<{
    speech: string;
    challenges: string[];
    coachingTips: string[];
  } | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Load motivation coaches
  const fetchMotivation = async () => {
    setLoadingCoach(true);
    setCoachError(null);
    try {
      const completed = assignments.filter(a => a.status === 'completed').length;
      const pending = assignments.filter(a => a.status === 'pending').length;
      
      const response = await fetch('/api/ai/motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streak: user.streak,
          hoursStudied: user.totalHoursStudied,
          completedAssignments: completed,
          pendingAssignments: pending
        })
      });
      if (!response.ok) {
        throw new Error('Could not contact your AI Motivation Coach');
      }
      const data = await response.json();
      setMotivation(data);
    } catch (err: any) {
      setCoachError(err.message || 'Failed to fetch inspiration.');
    } finally {
      setLoadingCoach(false);
    }
  };

  useEffect(() => {
    fetchMotivation();
  }, [user.streak, user.totalHoursStudied]);

  // Aggregate focus session minutes by day for the last 7 days for the chart
  const getChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap: { [key: string]: number } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];
      dataMap[dateString] = 0;
    }

    studySessions.forEach(session => {
      if (dataMap[session.date] !== undefined) {
        dataMap[session.date] += session.duration;
      }
    });

    return Object.entries(dataMap).map(([dateStr, duration]) => {
      const date = new Date(dateStr);
      return {
        day: days[date.getDay()],
        minutes: duration,
        hours: parseFloat((duration / 60).toFixed(1)),
      };
    });
  };

  const chartData = getChartData();

  // Find assignments due in the next 3 days
  const upcomingAssignments = assignments
    .filter(a => a.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Find exams occurring in the next 7 days
  const upcomingExams = exams
    .filter(e => {
      const diffTime = new Date(e.examDate).getTime() - Date.now();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  // Get current day of week (1-7 matching our state)
  const getTodayEvents = () => {
    const day = new Date().getDay();
    const normalizedDay = day === 0 ? 7 : day; // map Sunday to 7
    return timetableEvents
      .filter(ev => ev.dayOfWeek === normalizedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const todayEvents = getTodayEvents();

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-indigo-950 rounded-2xl p-6 text-white relative overflow-hidden border border-indigo-500/40 shadow-sm animate-fadeIn">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              AI Student Hub Active
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-200">{user.name}</span>!
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              You are on a roll. Track your revision schedules, organize lecture notes, and study with the AI homework assistant.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="bg-orange-500/20 p-2.5 rounded-xl border border-orange-500/30 text-orange-400">
                <Flame className="w-6 h-6 fill-orange-500/10" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Focus Streak</p>
                <p className="text-xl font-bold text-orange-300">{user.streak} Days</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-300">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Studied</p>
                <p className="text-xl font-bold text-indigo-300">{user.totalHoursStudied} hrs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Progress Analytics chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide flex items-center gap-2 text-slate-900">
                  <span className="w-2 h-5 bg-indigo-600 rounded-full shrink-0"></span>
                  Weekly Productivity
                </h3>
                <p className="text-xs text-slate-500 mt-1">Focus hours logged over the last 7 days</p>
              </div>
              <button 
                onClick={() => setActiveTab('analytics')}
                className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
              >
                More Analytics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', border: 'none', color: '#fff' }}
                    labelStyle={{ fontWeight: 'bold', color: '#818CF8' }}
                    formatter={(value: any) => [`${value} hours`, 'Studied']}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Schedule & Quick Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide flex items-center gap-2 text-slate-900 mb-4">
                  <span className="w-2 h-5 bg-indigo-600 rounded-full shrink-0"></span>
                  Today's Timeline
                </h3>
                {todayEvents.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200/50">
                    <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 font-medium">No study sessions scheduled</p>
                    <p className="text-xs text-slate-400 mt-1">Use the AI Planner to build a timetable</p>
                    <button 
                      onClick={() => setActiveTab('planner')}
                      className="mt-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-md transition"
                    >
                      Plan Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {todayEvents.map((ev) => {
                      const sub = subjects.find(s => s.id === ev.subjectId);
                      return (
                        <div key={ev.id} className="flex gap-3 items-start border-l-4 pl-3 py-1" style={{ borderLeftColor: sub?.color || '#CBD5E1' }}>
                          <div className="min-w-[70px] text-xs font-mono font-bold text-slate-500">
                            {ev.startTime}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{ev.title}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider" style={{ color: sub?.color }}>
                              {sub?.name || 'Break / Free Time'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {todayEvents.length > 0 && (
                <button 
                  onClick={() => setActiveTab('timer')}
                  className="mt-4 w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                  Launch Focus Timer
                </button>
              )}
            </div>

            {/* Upcoming Assignments */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold uppercase tracking-wide flex items-center gap-2 text-slate-900 mb-4">
                <span className="w-2 h-5 bg-indigo-600 rounded-full shrink-0"></span>
                Deadlines This Week
              </h3>
              {upcomingAssignments.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200/50">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">No pending assignments due soon</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAssignments.map((asg) => {
                    const sub = subjects.find(s => s.id === asg.subjectId);
                    return (
                      <div key={asg.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: `${sub?.color}15`, color: sub?.color }}>
                            {sub?.name || 'General'}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{asg.title}</h4>
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Due: {new Date(asg.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <button 
                          onClick={() => updateAssignment(asg.id, { status: 'completed' })}
                          className="text-slate-400 hover:text-emerald-600 transition-colors p-1 bg-white rounded-md shadow-xs border border-slate-200"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Sidebar: AI Motivation Coach & Upcoming Exams */}
        <div className="space-y-6">
          
          {/* AI Motivation Coach */}
          <div className="bg-indigo-600 text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Star className="w-32 h-32 text-white" />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-indigo-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">AI Motivation Coach</span>
                <button 
                  onClick={fetchMotivation} 
                  disabled={loadingCoach}
                  className="text-white/80 hover:text-white transition"
                  title="Refresh inspiration"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCoach ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingCoach ? (
                <div className="py-8 space-y-3">
                  <div className="h-3 bg-white/20 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-white/20 rounded animate-pulse w-5/6"></div>
                  <div className="h-3 bg-white/20 rounded animate-pulse w-2/3"></div>
                </div>
              ) : coachError ? (
                <p className="text-xs text-red-100 bg-red-900/20 p-3 rounded-xl">{coachError}</p>
              ) : motivation ? (
                <div className="space-y-4">
                  <p className="text-base font-medium leading-tight italic">
                    "{motivation.speech}"
                  </p>
                  
                  {/* Challenges */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <h4 className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Daily Micro Challenges:</h4>
                    <div className="space-y-1.5">
                      {motivation.challenges.map((ch, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-xs text-white/90">
                          <span className="w-4 h-4 rounded bg-white/10 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">{idx+1}</span>
                          <span className="leading-tight">{ch}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/70">Initialize motivation tips by clicking refresh.</p>
              )}
            </div>
          </div>

          {/* Upcoming Exams widget */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold uppercase tracking-wide flex items-center gap-2 text-slate-900 mb-4">
              <span className="w-2 h-5 bg-rose-600 rounded-full shrink-0"></span>
              Exams this week
            </h3>
            {upcomingExams.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200/50">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">No major exams this week</p>
                <p className="text-xs text-slate-400 mt-1">Keep studying regularly!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map((ex) => {
                  const sub = subjects.find(s => s.id === ex.subjectId);
                  const diffTime = new Date(ex.examDate).getTime() - Date.now();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return (
                    <div key={ex.id} className="border border-rose-100 bg-rose-50/20 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          {diffDays === 0 ? 'Today' : `${diffDays} Days Left`}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {new Date(ex.examDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{ex.title}</h4>
                      <p className="text-[11px] text-slate-400" style={{ color: sub?.color }}>
                        {sub?.name || 'General'}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight italic">
                        "{ex.notes}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
