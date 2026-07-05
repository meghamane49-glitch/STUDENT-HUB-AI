/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  standard?: string;
  board?: string;
  isOnboarded?: boolean;
  profileImage?: string;
  school?: string;
  major?: string;
  streak: number;
  lastActiveDate?: string;
  totalHoursStudied: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  credits: number;
  grade?: string; // e.g. "A", "B+", etc.
}

export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  notes: string;
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  examDate: string;
  notes: string;
}

export interface Note {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  createdAt: string;
  // AI Generated fields
  summary?: string;
  keyPoints?: string[];
  formulas?: string[];
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true-false' | 'short-answer';
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string;
  explanation?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  duration: number; // in minutes
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface TimetableEvent {
  id: string;
  subjectId: string;
  title: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday...
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: 'study' | 'revision' | 'break';
}

export interface GPACourse {
  id: string;
  name: string;
  credits: number;
  grade: string;
}
