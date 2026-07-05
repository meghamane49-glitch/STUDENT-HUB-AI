/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Subject, Assignment, Exam, Note, StudySession, TimetableEvent } from '../types';

interface PlannerContextType {
  user: User;
  subjects: Subject[];
  assignments: Assignment[];
  exams: Exam[];
  notes: Note[];
  studySessions: StudySession[];
  timetableEvents: TimetableEvent[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // User Actions
  updateUser: (user: Partial<User>) => void;
  resetUserProgress: () => void;
  initializeOnboardedData: (
    user: User,
    subjects: Subject[],
    timetable: TimetableEvent[],
    assignments: Assignment[],
    exams: Exam[],
    notes: Note[]
  ) => void;
  
  // Subject Actions
  addSubject: (name: string, color: string, credits: number) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  
  // Assignment Actions
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  
  // Exam Actions
  addExam: (exam: Omit<Exam, 'id'>) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  
  // Note Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  // Study Session Actions
  logStudySession: (subjectId: string, durationMinutes: number, notes?: string) => void;
  
  // Timetable Actions
  setTimetableEvents: (events: TimetableEvent[]) => void;
  addTimetableEvent: (event: Omit<TimetableEvent, 'id'>) => void;
  clearTimetable: () => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

// High-quality mock data for initialization
const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Calculus III', color: '#3B82F6', credits: 4, grade: 'A' },
  { id: 'sub-2', name: 'Computer Architecture', color: '#10B981', credits: 3, grade: 'B+' },
  { id: 'sub-3', name: 'Organic Chemistry', color: '#F59E0B', credits: 4, grade: 'A-' },
  { id: 'sub-4', name: 'Academic English', color: '#8B5CF6', credits: 2, grade: 'A' },
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-1',
    subjectId: 'sub-1',
    title: 'Multivariable Integration Problem Set',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
    priority: 'high',
    status: 'pending',
    notes: 'Focus heavily on polar coordinates and spherical transformations. Questions 4 to 12.',
  },
  {
    id: 'asg-2',
    subjectId: 'sub-2',
    title: 'Cache Simulator in C++',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days from now
    priority: 'high',
    status: 'pending',
    notes: 'Implement LRU and FIFO replacement policies. Ensure compile flags are configured for clean run.',
  },
  {
    id: 'asg-3',
    subjectId: 'sub-3',
    title: 'Synthesis Mechanism Report',
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    priority: 'medium',
    status: 'completed',
    notes: 'Detailed mechanism for electrophilic aromatic substitution of substituted benzenes.',
  },
];

const INITIAL_EXAMS: Exam[] = [
  {
    id: 'ex-1',
    subjectId: 'sub-1',
    title: 'Midterm II: Vector Calculus',
    examDate: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0], // 6 days from now
    notes: 'Covers Green\'s Theorem, Stokes\' Theorem, and Divergence Theorem. Highly conceptual.',
  },
  {
    id: 'ex-2',
    subjectId: 'sub-3',
    title: 'Organic Synthesis Assessment',
    examDate: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0], // 12 days from now
    notes: 'Major exam covering stereochemistry, carbonyl additions, and retrosynthetic analysis.',
  },
];

const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    subjectId: 'sub-1',
    title: 'Understand Green\'s Theorem',
    content: `Green's Theorem relates a line integral around a simple closed curve C to a double integral over the plane region D bounded by C.

The mathematical formula is:
∮_C (P dx + Q dy) = ∬_D (∂Q/∂x - ∂P/∂y) dA

Key conditions for Green's Theorem:
1. C must be a positively oriented, piecewise-smooth, simple closed curve.
2. D is the region bounded by C.
3. P and Q have continuous partial derivatives on an open region containing D.

This theorem is immensely useful because line integrals are often difficult to calculate directly, whereas double integrals over nice circular or rectangular domains are much simpler.`,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    summary: "Green's Theorem bridges vector line integrals around closed curves to double integrals over plane regions, easing calculations.",
    keyPoints: [
      "Relates closed line integral of vector fields to regional double integral",
      "Curve C must be positively oriented (counter-clockwise) and simple closed",
      "Functions P and Q must have continuous first-order partial derivatives"
    ],
    formulas: [
      "∮_C (P dx + Q dy) = ∬_D (∂Q/∂x - ∂P/∂y) dA"
    ]
  },
  {
    id: 'note-2',
    subjectId: 'sub-2',
    title: 'Cache Direct Mapping vs Set Associative',
    content: `In Computer Architecture, cache memory placement policy determines where memory blocks reside in cache.

1. Direct Mapped Cache:
Each memory block is mapped to exactly one cache line.
Formula: Index = (Block Address) mod (Number of Cache Lines)
Pros: Extremely fast lookup, simple hardware design.
Cons: High conflict miss rate if multiple active variables map to the same index.

2. Fully Associative Cache:
A block can reside in any cache line.
Pros: Zero conflict misses, highest hit rate.
Cons: Slow lookup because it requires parallel search of all tags, complex hardware.

3. N-Way Set Associative Cache:
Cache is divided into sets. Each block maps to a specific set, and can go into any of the N lines in that set.
Formula: Set Index = (Block Address) mod (Number of Sets)
This is the standard trade-off used in modern CPUs.`,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    summary: "Explains direct, associative, and set-associative cache placement policies, highlighting speed vs hit-rate trade-offs.",
    keyPoints: [
      "Direct mapped has unique index mapping, prone to conflict misses",
      "Fully associative allows placement anywhere but demands complex hardware search",
      "N-way set associative balances lookup speed and conflict miss prevention"
    ],
    formulas: [
      "Direct Index = Block Address % Cache Lines",
      "Set Index = Block Address % Sets"
    ]
  },
];

const INITIAL_SESSIONS: StudySession[] = [
  { id: 'sess-1', subjectId: 'sub-1', duration: 50, date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], notes: 'Completed Green\'s Theorem notes.' },
  { id: 'sess-2', subjectId: 'sub-2', duration: 25, date: new Date(Date.now() - 86400000).toISOString().split('T')[0], notes: 'Focused on Cache architecture.' },
  { id: 'sess-3', subjectId: 'sub-3', duration: 45, date: new Date(Date.now() - 86400000).toISOString().split('T')[0], notes: 'Worked on carbonyl reaction pathways.' },
];

const INITIAL_TIMETABLE: TimetableEvent[] = [
  { id: 'tt-1', subjectId: 'sub-1', title: 'Calculus Revision', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', type: 'study' },
  { id: 'tt-2', subjectId: 'sub-2', title: 'Cache Design Work', dayOfWeek: 1, startTime: '14:00', endTime: '15:30', type: 'study' },
  { id: 'tt-3', subjectId: 'sub-3', title: 'Organic Chemistry Review', dayOfWeek: 2, startTime: '10:00', endTime: '11:30', type: 'revision' },
  { id: 'tt-4', subjectId: 'sub-4', title: 'English Writing Practice', dayOfWeek: 3, startTime: '16:00', endTime: '17:00', type: 'study' },
];

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('sh_user');
    if (saved) return JSON.parse(saved);
    return {
      id: 'usr-1',
      name: '',
      email: '',
      phone: '',
      standard: '',
      board: '',
      isOnboarded: false,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      school: 'Pacific Tech Academy',
      major: '',
      streak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      totalHoursStudied: 0,
    };
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('sh_subjects');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('sh_assignments');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('sh_exams');
    return saved ? JSON.parse(saved) : INITIAL_EXAMS;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('sh_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [studySessions, setStudySessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem('sh_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [timetableEvents, setTimetableEventsState] = useState<TimetableEvent[]>(() => {
    const saved = localStorage.getItem('sh_timetable');
    return saved ? JSON.parse(saved) : INITIAL_TIMETABLE;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('sh_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('sh_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('sh_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('sh_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('sh_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('sh_sessions', JSON.stringify(studySessions));
    
    // Recalculate total study hours based on sessions
    const totalMin = studySessions.reduce((acc, s) => acc + s.duration, 0);
    setUser(prev => ({
      ...prev,
      totalHoursStudied: parseFloat((totalMin / 60).toFixed(1))
    }));
  }, [studySessions]);

  useEffect(() => {
    localStorage.setItem('sh_timetable', JSON.stringify(timetableEvents));
  }, [timetableEvents]);

  // Check and update streak
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate !== today) {
      setUser(prev => {
        let newStreak = prev.streak;
        if (prev.lastActiveDate) {
          const lastDate = new Date(prev.lastActiveDate);
          const currDate = new Date(today);
          const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1; // streak reset but active today
          }
        } else {
          newStreak = 1;
        }
        return {
          ...prev,
          streak: newStreak,
          lastActiveDate: today,
        };
      });
    }
  }, []);

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const resetUserProgress = () => {
    setSubjects(INITIAL_SUBJECTS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setExams(INITIAL_EXAMS);
    setNotes(INITIAL_NOTES);
    setStudySessions(INITIAL_SESSIONS);
    setTimetableEventsState(INITIAL_TIMETABLE);
    setUser({
      id: 'usr-1',
      name: 'Alex Mercer',
      email: 'meghamane49@gmail.com',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      school: 'Pacific Tech University',
      major: 'Computer Science & Bio-engineering',
      streak: 4,
      lastActiveDate: new Date().toISOString().split('T')[0],
      totalHoursStudied: 12.5,
    });
  };

  const addSubject = (name: string, color: string, credits: number) => {
    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name,
      color,
      credits,
    };
    setSubjects(prev => [...prev, newSub]);
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setAssignments(prev => prev.filter(a => a.subjectId !== id));
    setExams(prev => prev.filter(e => e.subjectId !== id));
  };

  const addAssignment = (asg: Omit<Assignment, 'id'>) => {
    const newAsg: Assignment = {
      ...asg,
      id: `asg-${Date.now()}`,
    };
    setAssignments(prev => [...prev, newAsg]);
  };

  const updateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const addExam = (ex: Omit<Exam, 'id'>) => {
    const newEx: Exam = {
      ...ex,
      id: `ex-${Date.now()}`,
    };
    setExams(prev => [...prev, newEx]);
  };

  const updateExam = (id: string, updates: Partial<Exam>) => {
    setExams(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const addNote = (nt: Omit<Note, 'id' | 'createdAt'>) => {
    const newNote: Note = {
      ...nt,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [...prev, newNote]);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const logStudySession = (subjectId: string, durationMinutes: number, notes?: string) => {
    const newSess: StudySession = {
      id: `sess-${Date.now()}`,
      subjectId,
      duration: durationMinutes,
      date: new Date().toISOString().split('T')[0],
      notes,
    };
    setStudySessions(prev => [...prev, newSess]);
    
    // Add user streak activity checking
    const today = new Date().toISOString().split('T')[0];
    setUser(prev => {
      let currentStreak = prev.streak;
      if (prev.lastActiveDate !== today) {
        currentStreak += 1;
      }
      return {
        ...prev,
        streak: currentStreak || 1,
        lastActiveDate: today
      };
    });
  };

  const setTimetableEvents = (events: TimetableEvent[]) => {
    setTimetableEventsState(events);
  };

  const addTimetableEvent = (event: Omit<TimetableEvent, 'id'>) => {
    const newEv: TimetableEvent = {
      ...event,
      id: `tt-${Date.now()}`,
    };
    setTimetableEventsState(prev => [...prev, newEv]);
  };

  const clearTimetable = () => {
    setTimetableEventsState([]);
  };

  const initializeOnboardedData = (
    updatedUser: User,
    newSubjects: Subject[],
    newTimetable: TimetableEvent[],
    newAssignments: Assignment[],
    newExams: Exam[],
    newNotes: Note[]
  ) => {
    setSubjects(newSubjects);
    setTimetableEventsState(newTimetable);
    setAssignments(newAssignments);
    setExams(newExams);
    setNotes(newNotes);
    setStudySessions([]);
    setUser(updatedUser);
  };

  return (
    <PlannerContext.Provider
      value={{
        user,
        subjects,
        assignments,
        exams,
        notes,
        studySessions,
        timetableEvents,
        activeTab,
        setActiveTab,
        updateUser,
        resetUserProgress,
        initializeOnboardedData,
        addSubject,
        updateSubject,
        deleteSubject,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        addExam,
        updateExam,
        deleteExam,
        addNote,
        updateNote,
        deleteNote,
        logStudySession,
        setTimetableEvents,
        addTimetableEvent,
        clearTimetable,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('usePlanner must be used within a PlannerProvider');
  return context;
};
