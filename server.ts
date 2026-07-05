/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization helper for Gemini AI client
let aiInstance: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing. Please add it under Settings > Secrets in AI Studio.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Middleware to check API key availability
const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured. Please open Settings > Secrets and add your Gemini API key to run this feature.',
    });
  }
  next();
};

// 0. AI Search-Grounded Syllabus & Curriculum Generator Endpoint
app.post('/api/ai/syllabus', checkApiKey, async (req, res) => {
  try {
    const { name, email, phone, standard, board, customPreferences } = req.body;
    const ai = getAIClient();

    const prompt = `You are an expert academic advisor and school curriculum specialist.
    The student is completing their onboarding/registration on StudentHub.
    Student Profile:
    - Name: ${name || 'Student'}
    - Email: ${email || ''}
    - Phone: ${phone || ''}
    - Standard/Grade: ${standard} (Up to 12th)
    - School Board: ${board} (e.g. CBSE, ICSE, State Board)
    - Custom Learning Preferences/Directives: "${customPreferences || 'None'}"

    YOUR TASK:
    1. Search Google for the official syllabus, standard curriculum, core subjects, and high-yield topics of the school board "${board}" for "${standard}".
    2. Extract the standard academic subjects taught in this board and standard (e.g., Mathematics, Science/Physics, Social Studies/History, English, etc.). Assign unique IDs like "sub-1", "sub-2", "sub-3", and assign beautiful, high-contrast visual colors (like "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4") to each.
    3. Design a personalized study curriculum including:
       - Core Subjects
       - A balanced weekly timetable (7 days a week, 1 for Monday, ..., 7 for Sunday) matching these subjects.
       - A set of realistic study assignments (2-3 items) with "dueDateOffset" (integer representing number of days from today, e.g. 2 for 2 days from now).
       - A set of realistic upcoming school exams (1-2 items) with "examDateOffset" (integer representing number of days from today, e.g. 10 for 10 days from now).
       - Initial study notes (2 items) summarizing important textbook chapters from the curriculum.

    IMPORTANT: Respect the user's specific directives or custom preferences. If they request particular subjects to be included or excluded, or ask for certain focus areas, adjust the curriculum accordingly.

    Return a JSON response conforming strictly to this format:
    {
      "subjects": [
        {
          "id": "sub-1",
          "name": "Mathematics",
          "color": "#3B82F6",
          "credits": 4
        }
      ],
      "timetable": [
        {
          "subjectId": "sub-1",
          "title": "Algebra & Calculus Study",
          "dayOfWeek": 1,
          "startTime": "14:00",
          "endTime": "15:30",
          "type": "study"
        }
      ],
      "assignments": [
        {
          "subjectId": "sub-1",
          "title": "Solve Quadratic Equations",
          "dueDateOffset": 3,
          "priority": "high",
          "status": "pending",
          "notes": "Exercises 4.1 to 4.3 in standard board textbook."
        }
      ],
      "exams": [
        {
          "subjectId": "sub-1",
          "title": "Unit Test: Algebra",
          "examDateOffset": 8,
          "notes": "Covers quadratic equations, arithmetic progressions, and matrices."
        }
      ],
      "notes": [
        {
          "subjectId": "sub-1",
          "title": "Quadratic Equations Formula Proof",
          "content": "A quadratic equation is of the form ax^2 + bx + c = 0. The quadratic formula is x = (-b ± \\u221a(b^2 - 4ac)) / (2a).",
          "summary": "Explains quadratic equation standard forms and proves the root solution using completing the square.",
          "keyPoints": [
            "Discriminant D = b^2 - 4ac determines nature of roots",
            "D > 0: Real and distinct roots",
            "D = 0: Real and equal roots",
            "D < 0: Complex roots"
          ],
          "formulas": [
            "x = (-b \\u00b1 \\u221a(b^2 - 4ac)) / (2a)",
            "D = b^2 - 4ac"
          ]
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }],
      },
    });

    const result = JSON.parse(response.text?.trim() || '{}');
    res.json(result);
  } catch (error: any) {
    console.error('AI Syllabus Search Error:', error);
    res.status(500).json({ error: error.message || 'Failed to search board syllabus.' });
  }
});

// 1. AI Study Planner Endpoint
app.post('/api/ai/planner', checkApiKey, async (req, res) => {
  try {
    const { subjects, hoursPerDay, examDate, targetGrade } = req.body;
    const ai = getAIClient();

    const prompt = `Create a highly structured personalized study planner for a student preparing for exams.
    Details:
    - Subjects: ${JSON.stringify(subjects)}
    - Available Study Hours Per Day: ${hoursPerDay} hours
    - Key Exam Target Date: ${examDate}
    - Target Grade Goal: ${targetGrade || 'Excellent (A/A+)'}
    
    You must output a valid JSON response strictly matching this TypeScript-like schema:
    {
      "timetable": Array of {
        "subjectName": string (must match one of the student's subjects),
        "title": string (e.g. "Calculus Limits & Integrals Review"),
        "dayOfWeek": number (1 for Monday, 2 for Tuesday, ..., 7 for Sunday),
        "startTime": string ("HH:MM" 24h format),
        "endTime": string ("HH:MM" 24h format),
        "type": "study" | "revision" | "break"
      },
      "revisionSchedule": Array of {
        "date": string ("YYYY-MM-DD" e.g., leading up to the exam date),
        "subject": string,
        "topic": string,
        "tasks": string[]
      },
      "tips": string[] (3-5 actionable exam preparation and study methodology tips)
    }

    Keep the hours per day balanced and respect the available study hours of ${hoursPerDay}. Give a mix of active learning, revision cycles, and break slots.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text?.trim() || '{}');
    res.json(result);
  } catch (error: any) {
    console.error('AI Study Planner Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate study plan.' });
  }
});

// 2. AI Homework Helper & Doubt Solver Endpoint
app.post(['/api/ai/homework', '/api/ai/helper'], checkApiKey, async (req, res) => {
  try {
    const { subject, question, notes } = req.body;
    const ai = getAIClient();

    const prompt = `Solve this academic doubt or explain the topic requested.
    Subject: ${subject}
    Question: "${question}"
    ${notes ? `Additional Context/Student Notes: "${notes}"` : ''}

    Explain the concept in simple, engaging, student-friendly language. 
    If the question is a programming problem or involves calculations, provide clear, step-by-step solutions and clean, well-commented code snippets or mathematical proofs where appropriate.

    Return a JSON response conforming strictly to this format:
    {
      "explanation": string (markdown-friendly explanation of the core concept),
      "steps": Array of strings (step-by-step breakdown),
      "formulasUsed": Array of strings (formulas applied),
      "similarProblems": Array of strings (similar practice problems)
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text?.trim() || '{}');
    res.json(result);
  } catch (error: any) {
    console.error('AI Homework Helper Error:', error);
    res.status(500).json({ error: error.message || 'Failed to get answer.' });
  }
});

// 3. AI Notes Summarizer Endpoint
app.post('/api/ai/summarize', checkApiKey, async (req, res) => {
  try {
    const { noteTitle, content } = req.body;
    const ai = getAIClient();

    const prompt = `Act as an expert academic summarizer. Summarize this student note:
    Title: ${noteTitle}
    Content:
    "${content}"

    Extract:
    - A concise, punchy high-level summary paragraph.
    - Bullet points of key facts and critical takeaways.
    - A list of important formulas, theorems, definitions, or code signatures (if applicable).

    Return a JSON response conforming strictly to this format:
    {
      "summary": string (Markdown summary),
      "keyPoints": Array of strings,
      "formulas": Array of strings (math formulas or key definitions/rules)
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text?.trim() || '{}');
    res.json(result);
  } catch (error: any) {
    console.error('AI Notes Summarizer Error:', error);
    res.status(500).json({ error: error.message || 'Failed to summarize notes.' });
  }
});

// 4. AI Quiz Generator Endpoint
app.post('/api/ai/quiz', checkApiKey, async (req, res) => {
  try {
    const { noteTitle, content } = req.body;
    const ai = getAIClient();

    const prompt = `From the student note below, create a comprehensive revision quiz consisting of 5 high-quality questions:
    - 2 Multiple Choice Questions (MCQ)
    - 2 True/False Questions
    - 1 Short Answer Question

    Title: ${noteTitle}
    Content:
    "${content}"

    Return a JSON array of questions conforming strictly to this structure:
    [
      {
        "id": string (unique slug like "q1", "q2"),
        "type": "mcq" | "true-false" | "short-answer",
        "question": string,
        "options": Array of strings (required only for "mcq" type, otherwise empty/omitted),
        "correctAnswer": string (e.g. choice value, "true", "false", or a concise key answer sentence),
        "explanation": string (why this is correct, highlighting the note's reference)
      }
    ]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text?.trim() || '[]');
    res.json(result);
  } catch (error: any) {
    console.error('AI Quiz Generator Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz.' });
  }
});

// 5. AI Flashcards Generator Endpoint
app.post('/api/ai/flashcards', checkApiKey, async (req, res) => {
  try {
    const { noteTitle, content } = req.body;
    const ai = getAIClient();

    const prompt = `Based on the following study note, generate 6 active-recall revision flashcards (front-and-back) covering the absolute most important formulas, terms, definitions, and concepts:
    Title: ${noteTitle}
    Content:
    "${content}"

    Return a JSON array of flashcards conforming strictly to this structure:
    [
      {
        "id": string (e.g. "fc-1", "fc-2"),
        "front": string (clear question, term, or prompt, e.g. "What is Newton's Second Law?"),
        "back": string (concise, high-impact answer, e.g. "F = ma (Force equals mass times acceleration).")
      }
    ]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text?.trim() || '[]');
    res.json(result);
  } catch (error: any) {
    console.error('AI Flashcards Generator Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate flashcards.' });
  }
});

// 6. AI Exam Predictor Endpoint
app.post('/api/ai/predict', checkApiKey, async (req, res) => {
  try {
    const { subjects, notes, assignments } = req.body;
    const ai = getAIClient();

    const prompt = `Act as an expert academic examiner and mentor. Analyze the student's study inputs and predict the high-yield topics and FAQs likely to appear in upcoming exams:
    - Subjects: ${JSON.stringify(subjects)}
    - Existing Study Notes Topics: ${JSON.stringify(notes ? notes.map((n: any) => ({ title: n.title, subject: n.subject })) : [])}
    - Assignment Deliverables: ${JSON.stringify(assignments ? assignments.map((a: any) => ({ title: a.title, notes: a.notes })) : [])}

    Formulate a strategic prediction profile.
    Return a JSON response conforming strictly to this format:
    {
      "predictedTopics": Array of {
        "subject": string,
        "topic": string (e.g., "Mendelian Genetics Punnett Squares"),
        "probability": "High" | "Medium",
        "reason": string (why this is high yield based on academic standards and study history),
        "faq": string (a sample question of how this topic is typically asked)
      },
      "studyFocusTips": string[] (3 helpful strategies for scoring high in these specific domains)
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text?.trim() || '{}');
    res.json(result);
  } catch (error: any) {
    console.error('AI Exam Predictor Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate predictions.' });
  }
});

// 7. AI Motivation Coach Endpoint
app.post('/api/ai/motivation', checkApiKey, async (req, res) => {
  try {
    const { streak, hoursStudied, completedAssignments, pendingAssignments } = req.body;
    const ai = getAIClient();

    const prompt = `Act as an encouraging, empathetic, and inspiring student motivation coach.
    Current Stats:
    - Active Study Streak: ${streak} days
    - Total Hours Studied This Week: ${hoursStudied} hours
    - Completed Deliverables: ${completedAssignments} assignments
    - Pending Deliverables: ${pendingAssignments} assignments

    Write a high-impact personalized coaching message.
    - If the streak is 0 or stats are low, be highly encouraging and suggest tiny steps to rebuild habits.
    - If stats are high, praise their focus and remind them to take healthy breaks.
    
    Return a JSON response conforming strictly to this format:
    {
      "speech": string (inspirational, energetic coaching feedback),
      "challenges": Array of strings (3 bite-sized daily challenge goals, e.g. "Focus for 15 minutes on your hardest subject"),
      "coachingTips": Array of strings (3 tactical tips on beating procrastination, spacing study sessions, or maintaining energy)
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text?.trim() || '{}');
    res.json(result);
  } catch (error: any) {
    console.error('AI Motivation Coach Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate motivation.' });
  }
});

// 8. AI Voice / Text Assistant Endpoint
app.post('/api/ai/voice', checkApiKey, async (req, res) => {
  try {
    const { command, query, currentSubjects } = req.body;
    const finalCommand = command || query || '';
    const ai = getAIClient();

    const prompt = `You are the StudentHub AI Voice & Command Assistant. You help students plan their studies, manage focus, and access material through voice-style commands.
    
    Command: "${finalCommand}"
    Student's Current Subjects: ${JSON.stringify(currentSubjects || [])}

    Determine if the command represents a structural action that the planner should perform.
    Support these actions:
    1. "ADD_ASSIGNMENT" (e.g. "add homework math homework due tomorrow", "remind me to submit physics paper on friday")
    2. "START_POMODORO" (e.g. "start study timer", "start pomodoro", "time to focus")
    3. "GENERATE_PLAN" (e.g. "plan my studies", "make a timetable", "organize my weekly schedule")
    4. "NAVIGATE" (e.g. "go to calendar", "open gpa calculator", "show my progress", "show flashcards")
    5. "NONE" (for generic questions, study chat, or unrecognized requests)

    Formulate a natural, vocal, enthusiastic assistant response that speaks directly to the student, along with the structured payload to perform.
    
    Return a JSON response conforming strictly to this format:
    {
      "responseText": string (vocal, friendly, rich assistant feedback, e.g. "You got it! I'm scheduling a new assignment for Math due tomorrow. Let's crush this!"),
      "speakText": string (a concise, 100% clean-text version of the responseText without any markdown symbols or stars, optimized for text-to-speech synthesis),
      "action": "ADD_ASSIGNMENT" | "START_POMODORO" | "GENERATE_PLAN" | "NAVIGATE" | "NONE",
      "actionPayload": {
        // For ADD_ASSIGNMENT:
        "title": string (title of task),
        "subject": string (closest match from current subjects or new subject name),
        "daysFromToday": number (relative offset, e.g. tomorrow is 1, wednesday is offset, or 0 if unspecified),
        "priority": "low" | "medium" | "high",
        // For NAVIGATE:
        "tab": "dashboard" | "assignments" | "planner" | "calendar" | "notes" | "timer" | "gpa" | "analytics"
      }
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text?.trim() || '{}');
    res.json(result);
  } catch (error: any) {
    console.error('AI Voice Assistant Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process voice command.' });
  }
});


// Vite Dev Server / Static Asset setup
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
