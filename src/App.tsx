/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlannerProvider, usePlanner } from './context/PlannerContext';
import DashboardTab from './components/DashboardTab';
import PlannerTab from './components/PlannerTab';
import AssignmentsTab from './components/AssignmentsTab';
import CalendarTab from './components/CalendarTab';
import NotesTab from './components/NotesTab';
import TimerTab from './components/TimerTab';
import GpaTab from './components/GpaTab';
import HomeworkHelperTab from './components/HomeworkHelperTab';
import OnboardingScreen from './components/OnboardingScreen';

import { 
  Sparkles, LayoutDashboard, Calendar, BookOpen, Clock, 
  GraduationCap, Flame, Star, Trophy, ClipboardList, Mic, CheckCircle2, LogOut
} from 'lucide-react';

function DashboardShell() {
  const { activeTab, setActiveTab, user, updateUser } = usePlanner();

  if (!user.isOnboarded) {
    return <OnboardingScreen />;
  }

  // Mapping of active tab name to React node
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'planner':
        return <PlannerTab />;
      case 'assignments':
        return <AssignmentsTab />;
      case 'calendar':
        return <CalendarTab />;
      case 'notes':
        return <NotesTab />;
      case 'timer':
        return <TimerTab />;
      case 'gpa':
        return <GpaTab />;
      case 'homework':
        return <HomeworkHelperTab />;
      default:
        return <DashboardTab />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'AI Smart Planner', icon: Sparkles },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'calendar', label: 'Academic Calendar', icon: Calendar },
    { id: 'notes', label: 'Lecture Notes', icon: BookOpen },
    { id: 'timer', label: 'Pomodoro Timer', icon: Clock },
    { id: 'gpa', label: 'GPA Calculator', icon: GraduationCap },
    { id: 'homework', label: 'AI Revision Studio', icon: Mic },
  ];

  return (
    <div className="h-screen w-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row overflow-hidden antialiased select-none">
      
      {/* Sidebar for medium/large desktop screens */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 space-y-6 shrink-0 h-full">
        {/* Brand identity header */}
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase text-slate-900 leading-tight">StudentHub</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syllabus Co-Pilot</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isSelected ? 'text-indigo-700' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User profile */}
        <div className="pt-4 border-t border-slate-200 px-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
              {user.name ? user.name.substring(0,2).toUpperCase() : 'ST'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[125px]">{user.name || 'Student'}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-1 truncate max-w-[125px]">{user.email || 'Click to register'}</p>
            </div>
          </div>
          <button
            onClick={() => updateUser({ isOnboarded: false })}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer shrink-0"
            title="Reset & Re-register Syllabus"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile top/bottom responsive navigation */}
      <div className="md:hidden flex flex-col w-full shrink-0">
        {/* Brand/User header on mobile */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold tracking-tight text-slate-900 text-xs leading-none uppercase">StudentHub</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-orange-50 border border-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
              <Flame className="w-3.5 h-3.5 fill-orange-500/10" /> {user.streak}d
            </div>
            <button
              onClick={() => updateUser({ isOnboarded: false })}
              className="w-7 h-7 rounded-full bg-indigo-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center font-bold text-indigo-700 text-[10px] border border-indigo-100 hover:border-red-100 transition cursor-pointer shrink-0"
              title="Reset & Re-register Syllabus"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Scrollable navigation rail for mobile */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 overflow-x-auto flex gap-1 scrollbar-none shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold shrink-0 transition-colors ${
                  isSelected ? 'bg-indigo-50 text-indigo-700' : 'bg-transparent text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Desktop Header panel */}
        <header className="hidden md:flex h-20 bg-white border-b border-slate-200 px-8 items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Welcome back, {user.name}!</h2>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {user.streak} study streak days
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">
              <Flame className="w-4 h-4 fill-orange-500/10 animate-pulse" />
              {user.streak} Study Streak
            </div>
          </div>
        </header>

        {/* Render Tab Component */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto">
          {renderActiveTab()}
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <PlannerProvider>
      <DashboardShell />
    </PlannerProvider>
  );
}
