/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { 
  Plus, Calendar, AlertCircle, Trash2, Edit3, Check, Search, 
  Filter, Clock, CheckSquare, Square, Eye, X, BookOpen 
} from 'lucide-react';
import { Assignment } from '../types';

export default function AssignmentsTab() {
  const { subjects, assignments, addAssignment, updateAssignment, deleteAssignment } = usePlanner();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterPriority, setFilterPriority] = useState('all');

  // Form states for Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');

  // Submit hander for creation and update
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !title || !dueDate) return;

    const payload = {
      subjectId,
      title,
      dueDate,
      priority,
      status: 'pending' as const,
      notes,
    };

    if (editingId) {
      updateAssignment(editingId, payload);
    } else {
      addAssignment(payload);
    }

    // Reset Form
    resetForm();
  };

  const startEdit = (asg: Assignment) => {
    setEditingId(asg.id);
    setSubjectId(asg.subjectId);
    setTitle(asg.title);
    setDueDate(asg.dueDate);
    setPriority(asg.priority);
    setNotes(asg.notes);
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setSubjectId('');
    setTitle('');
    setDueDate('');
    setPriority('medium');
    setNotes('');
    setIsFormOpen(false);
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((asg) => {
    const matchesSearch = asg.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asg.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || asg.subjectId === filterSubject;
    const matchesStatus = filterStatus === 'all' || asg.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || asg.priority === filterPriority;

    return matchesSearch && matchesSubject && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignment Manager</h1>
          <p className="text-xs text-slate-500">Add, track, and complete homework and exam prep items</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-md flex items-center gap-1.5 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Assignment
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignments or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 outline-none transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs text-slate-700 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none cursor-pointer transition"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="all">All Statuses</option>
          </select>

          {/* Subject Filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="text-xs text-slate-700 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none cursor-pointer transition"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs text-slate-700 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none cursor-pointer transition"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? 'Edit Assignment' : 'Add New Assignment'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Subject Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none cursor-pointer"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assignment Title</label>
                <input
                  type="text"
                  placeholder="e.g. Linear Algebra Homework 2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none"
                />
              </div>

              {/* Grid (Due Date & Priority) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notes & Guidelines</label>
                <textarea
                  placeholder="Add formulas, book pages, or instruction details..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 px-4 rounded-xl transition shadow-xs cursor-pointer"
                >
                  {editingId ? 'Update Assignment' : 'Add Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid List of assignments */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">No assignments found</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting filters or add a new school task</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((asg) => {
            const sub = subjects.find(s => s.id === asg.subjectId);
            const isHigh = asg.priority === 'high';
            const isMedium = asg.priority === 'medium';
            const isOverdue = new Date(asg.dueDate).getTime() < Date.now() && asg.status === 'pending';

            return (
              <div 
                key={asg.id} 
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition duration-200 relative group"
              >
                {/* Priority / Subject Pill Header */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: `${sub?.color}15`, color: sub?.color }}>
                    {sub?.name || 'General'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isHigh ? 'bg-rose-100 text-rose-700' : 
                      isMedium ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {asg.priority} priority
                    </span>
                    {isOverdue && (
                      <span className="text-[9px] font-bold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <AlertCircle className="w-2.5 h-2.5" /> Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignment Body */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-start gap-2">
                    <button 
                      onClick={() => updateAssignment(asg.id, { status: asg.status === 'completed' ? 'pending' : 'completed' })}
                      className="mt-0.5 shrink-0 hover:scale-105 transition cursor-pointer"
                    >
                      {asg.status === 'completed' ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                      )}
                    </button>
                    <h3 className={`text-xs font-bold text-slate-800 ${asg.status === 'completed' ? 'line-through text-slate-400 font-medium' : ''}`}>
                      {asg.title}
                    </h3>
                  </div>
                  {asg.notes && (
                    <p className="text-[11px] text-slate-500 line-clamp-3 bg-slate-50 rounded-lg p-2.5 border border-slate-100/50">
                      {asg.notes}
                    </p>
                  )}
                </div>

                {/* Assignment Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-4">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due: {new Date(asg.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  
                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(asg)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                      title="Edit Assignment"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteAssignment(asg.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
