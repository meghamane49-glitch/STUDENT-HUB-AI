/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { 
  Sparkles, BookOpen, Volume2, HelpCircle, GraduationCap, 
  RefreshCw, Check, Lightbulb, Play, AlertCircle, Award 
} from 'lucide-react';

export default function HomeworkHelperTab() {
  const { subjects, user } = usePlanner();

  // AI Homework states
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [homeworkQuestion, setHomeworkQuestion] = useState('');
  const [solving, setSolving] = useState(false);
  const [solution, setSolution] = useState<{
    explanation: string;
    steps: string[];
    formulasUsed: string[];
    similarProblems: string[];
  } | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);

  // Voice assistant state
  const [voiceQuery, setVoiceQuery] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState('');
  const [loadingVoice, setLoadingVoice] = useState(false);

  // Exam Predictor state
  const [studiedHours, setStudiedHours] = useState(15);
  const [assignmentsDone, setAssignmentsDone] = useState(8);
  const [historicalScore, setHistoricalScore] = useState(85);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<{
    predictedGrade: string;
    successProbability: string;
    strengths: string[];
    gapAnalysis: string[];
    recomendedStudyHours: number;
  } | null>(null);

  // Solve Homework action
  const handleSolveHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkQuestion) return;

    setSolving(true);
    setSolveError(null);
    setSolution(null);
    try {
      const response = await fetch('/api/ai/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjects.find(s => s.id === selectedSubjectId)?.name || 'General',
          question: homeworkQuestion,
        })
      });

      if (!response.ok) {
        throw new Error('Homework Helper server endpoint responded with error.');
      }

      const data = await response.json();
      setSolution(data);
    } catch (err: any) {
      setSolveError(err.message || 'Failed to solve homework question.');
    } finally {
      setSolving(false);
    }
  };

  // voice query helper
  const handleVoiceQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceQuery) return;

    setLoadingVoice(true);
    setAssistantResponse('');
    try {
      const response = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: voiceQuery }),
      });

      if (!response.ok) {
        throw new Error('Voice assistant query failed.');
      }

      const data = await response.json();
      setAssistantResponse(data.responseText);

      // Trigger standard browser SpeechSynthesis read-out!
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop prior speeches
        const utterance = new SpeechSynthesisUtterance(data.speakText);
        utterance.rate = 1.0;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      setAssistantResponse('Failed to fetch voice feedback.');
    } finally {
      setLoadingVoice(false);
    }
  };

  // Exam grade prediction action
  const handlePredictExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    setPrediction(null);
    try {
      const response = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studiedHours,
          assignmentsDone,
          historicalScore,
        })
      });

      if (!response.ok) {
        throw new Error('Could not contact Exam Predictor AI engine.');
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Revision Studio</h1>
        <p className="text-xs text-slate-500">Accelerate revision with homework solvers, interactive exam predictive engines, and simulated voice assistants</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Homework Helper & Voice assistant */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Homework Solver */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              AI Homework Helper
            </h2>

            <form onSubmit={handleSolveHomework} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none cursor-pointer"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Paste your specific question, math equation, or concept inquiry..."
                  value={homeworkQuestion}
                  onChange={(e) => setHomeworkQuestion(e.target.value)}
                  required
                  className="sm:col-span-3 text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={solving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {solving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Solving Question...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Solve Assignment Question
                  </>
                )}
              </button>
            </form>

            {solveError && (
              <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl">{solveError}</p>
            )}

            {solution && (
              <div className="bg-indigo-50/20 border border-indigo-100/60 rounded-2xl p-5 space-y-4 animate-fadeIn">
                
                {/* Executive solution summary */}
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Solution Concept</h3>
                  <p className="text-xs text-slate-700 leading-relaxed italic">"{solution.explanation}"</p>
                </div>

                {/* Steps */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Step-by-step breakdown</h3>
                  <div className="space-y-2">
                    {solution.steps.map((st, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-slate-700 items-start">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">{idx+1}</span>
                        <span className="leading-snug">{st}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulas / Definitions used */}
                {solution.formulasUsed && solution.formulasUsed.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Formulas applied</h3>
                    <div className="flex flex-wrap gap-2">
                      {solution.formulasUsed.map((frm, idx) => (
                        <code key={idx} className="bg-white border border-indigo-100 text-indigo-800 text-[10px] px-2.5 py-1 rounded-lg font-mono font-bold">
                          {frm}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {/* Similar practice equations */}
                {solution.similarProblems && solution.similarProblems.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-indigo-100/50">
                    <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Similar Practice Problems</h3>
                    <ul className="space-y-1 list-disc pl-4 text-[11px] text-slate-500">
                      {solution.similarProblems.map((prob, idx) => (
                        <li key={idx}>{prob}</li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Voice Assistant / Smart dictation simulator */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              AI Interactive Voice Companion
            </h2>

            <form onSubmit={handleVoiceQuerySubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a quick voice query (e.g. explain dark matter in 1 sentence)..."
                  value={voiceQuery}
                  onChange={(e) => setVoiceQuery(e.target.value)}
                  className="flex-1 text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none"
                />
                <button
                  type="submit"
                  disabled={loadingVoice}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold px-4 rounded-xl transition cursor-pointer"
                >
                  {loadingVoice ? 'Consulting...' : 'Ask Assistant'}
                </button>
              </div>
            </form>

            {assistantResponse && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start animate-fadeIn">
                <div className={`p-2 rounded-xl border shrink-0 ${speaking ? 'bg-indigo-500 border-indigo-400 text-white animate-bounce' : 'bg-white border-slate-100 text-slate-400'}`}>
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Syllabus voice coach</p>
                  <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{assistantResponse}</p>
                  {speaking && (
                    <span className="text-[9px] text-indigo-500 font-semibold animate-pulse mt-1.5 block">
                      🔊 Reading solution aloud...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Exam predictor */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-rose-500" />
              Exam Grade Predictor
            </h2>

            <form onSubmit={handlePredictExam} className="space-y-3.5">
              {/* Studied hours */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hours Studied</label>
                  <span className="text-xs font-bold text-slate-700">{studiedHours} hrs</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={studiedHours}
                  onChange={(e) => setStudiedHours(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              {/* Assignment complete count */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Homeworks</label>
                  <span className="text-xs font-bold text-slate-700">{assignmentsDone} Items</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={assignmentsDone}
                  onChange={(e) => setAssignmentsDone(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              {/* Class average */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prior Exam Average</label>
                  <span className="text-xs font-bold text-slate-700">{historicalScore}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={historicalScore}
                  onChange={(e) => setHistoricalScore(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={predicting}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl flex justify-center items-center gap-1.5 transition cursor-pointer"
              >
                {predicting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}
                Predict Exam Standing
              </button>
            </form>

            {prediction && (
              <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-4 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-rose-100/50">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Projected Grade</span>
                    <p className="text-2xl font-black text-rose-600 font-mono mt-0.5">{prediction.predictedGrade}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-rose-100/50">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Confidence</span>
                    <p className="text-xl font-black text-slate-800 font-mono mt-1">{prediction.successProbability}</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-2 bg-white rounded-xl p-3 border border-rose-100/40">
                  <h4 className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-rose-500" /> Recommended revision Focus
                  </h4>
                  <p className="text-xs text-slate-600">
                    Studies show practicing similar exams under mock settings will boost score stability. Aim for <strong className="text-rose-600 font-bold">{prediction.recomendedStudyHours} hours</strong> of focused revision.
                  </p>
                </div>

                {/* Strengths / Gap items */}
                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-700">Identified Strengths:</span>
                    {prediction.strengths.map((str, idx) => (
                      <p key={idx} className="text-[11px] text-slate-600 flex gap-1.5 items-center">
                        <Check className="w-3 h-3 text-emerald-500" /> {str}
                      </p>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-rose-700">Risk Factors:</span>
                    {prediction.gapAnalysis.map((gap, idx) => (
                      <p key={idx} className="text-[11px] text-slate-600 flex gap-1.5 items-center">
                        <AlertCircle className="w-3 h-3 text-rose-400" /> {gap}
                      </p>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
