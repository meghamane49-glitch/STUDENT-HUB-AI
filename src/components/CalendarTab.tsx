/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { ChevronLeft, ChevronRight, Calendar, Plus, BookOpen, Clock, AlertCircle } from 'lucide-react';

export default function CalendarTab() {
  const { subjects, assignments, exams, timetableEvents } = usePlanner();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6) of the 1st of month
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Map Monday first (0=Mon, 6=Sun)

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  // Get items for a specific date in YYYY-MM-DD format
  const getItemsForDate = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayAssignments = assignments.filter(asg => asg.dueDate === formattedDate);
    const dayExams = exams.filter(ex => ex.examDate === formattedDate);

    // Get weekly recurring study events
    const dayOfWeek = new Date(year, month, day).getDay();
    const normalizedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    const dayStudySlots = timetableEvents.filter(ev => ev.dayOfWeek === normalizedDayOfWeek);

    return {
      assignments: dayAssignments,
      exams: dayExams,
      studySlots: dayStudySlots
    };
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Construct calendar grid list of days
  const calendarCells = [];
  // Filler slots for preceding month
  for (let i = 0; i < adjustedFirstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  // Active selected items to display
  const activeItems = selectedDay ? getItemsForDate(selectedDay) : null;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Calendar</h1>
        <p className="text-xs text-slate-500">A unified grid of all deadlines, examinations, and structured review sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Grid (Left 2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          
          {/* Calendar Header controls */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-1">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {weekDays.map(d => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/50 rounded-xl"></div>;
              }

              const isSelected = selectedDay === day;
              const isToday = new Date().getDate() === day && 
                              new Date().getMonth() === month && 
                              new Date().getFullYear() === year;

              const { assignments: dayAsg, exams: dayEx, studySlots: daySlots } = getItemsForDate(day);
              const hasAsg = dayAsg.length > 0;
              const hasEx = dayEx.length > 0;
              const hasSlots = daySlots.length > 0;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-2xl p-2 flex flex-col justify-between items-start transition relative border cursor-pointer hover:border-slate-300 ${
                    isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 
                    isToday ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-transparent border-slate-200'
                  }`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>{day}</span>
                  
                  {/* Indicators */}
                  <div className="flex gap-1 w-full flex-wrap">
                    {hasEx && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`} title="Exam"></span>}
                    {hasAsg && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-200' : 'bg-indigo-500'}`} title="Assignment"></span>}
                    {hasSlots && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-200' : 'bg-emerald-500'}`} title="Scheduled Study"></span>}
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Selected Day Agenda panel (Right Column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[400px]">
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-4 pb-2 border-b border-slate-50 flex items-center justify-between">
                <span>Agenda Details</span>
                {selectedDay && (
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                    {monthNames[month].substring(0,3)} {selectedDay}
                  </span>
                )}
              </h3>

              {!selectedDay ? (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Select a day on the calendar to see schedule and homework assignments.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  
                  {/* Exams Section */}
                  {activeItems?.exams.length === 0 && activeItems?.assignments.length === 0 && activeItems?.studySlots.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200/60">
                      <p className="text-xs text-slate-500 font-medium">Free day!</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Nothing scheduled for this date</p>
                    </div>
                  )}

                  {/* Exams list */}
                  {activeItems && activeItems.exams.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Exams
                      </h4>
                      {activeItems.exams.map((ex) => {
                        const sub = subjects.find(s => s.id === ex.subjectId);
                        return (
                          <div key={ex.id} className="border border-rose-100 bg-rose-50/25 p-3 rounded-xl">
                            <p className="text-xs font-bold text-rose-900 leading-tight">{ex.title}</p>
                            <p className="text-[10px] text-rose-500 font-semibold mt-0.5" style={{ color: sub?.color }}>
                              {sub?.name || 'General'}
                            </p>
                            {ex.notes && <p className="text-[10px] text-slate-500 mt-1 leading-snug">{ex.notes}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Assignments list */}
                  {activeItems && activeItems.assignments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Assignments Due
                      </h4>
                      {activeItems.assignments.map((asg) => {
                        const sub = subjects.find(s => s.id === asg.subjectId);
                        return (
                          <div key={asg.id} className="border border-indigo-100 bg-indigo-50/20 p-3 rounded-xl flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-indigo-950 leading-tight">{asg.title}</p>
                              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: sub?.color }}>
                                {sub?.name || 'General'}
                              </p>
                              <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                asg.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {asg.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Study timetable slot list */}
                  {activeItems && activeItems.studySlots.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Study Slots
                      </h4>
                      {activeItems.studySlots.map((slot) => {
                        const sub = subjects.find(s => s.id === slot.subjectId);
                        const isRevision = slot.type === 'revision';
                        return (
                          <div key={slot.id} className="border border-slate-100 bg-slate-50/50 p-3 rounded-xl flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-tight">{slot.title}</p>
                              <p className="text-[10px] font-medium text-slate-400 mt-0.5" style={{ color: sub?.color }}>
                                {sub?.name || 'Break / Leisure'}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-400">{slot.startTime} - {slot.endTime}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
