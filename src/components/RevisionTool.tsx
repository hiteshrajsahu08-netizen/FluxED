import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  BookOpen, 
  Layers, 
  MessageSquare, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

interface RevisionToolProps {
  userName: string;
}

type Step = 'topic' | 'modes' | 'summary' | 'flashcards' | 'questions' | 'evaluation';
type Mode = 'summary' | 'flashcards' | 'questions';

const RevisionTool: React.FC<RevisionToolProps> = ({ userName }) => {
  const [currentStep, setCurrentStep] = useState<Step>('topic');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Mode Data
  const [summary, setSummary] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [activeFlashcard, setActiveFlashcard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [evaluation, setEvaluation] = useState<any[] | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const handleTopicSubmit = () => {
    if (topic.trim()) {
      setCurrentStep('modes');
    }
  };

  const generateSummary = async () => {
    setIsGenerating(true);
    setCurrentStep('summary');
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Generate a one-minute summary for the topic: "${topic}". 
        Include:
        - Core Concept
        - Key Formula or Rule (if applicable)
        - Important Point to Remember
        Keep it concise, structured, and readable within one minute.`,
      });
      setSummary(response.text || "Failed to generate summary.");
    } catch (error) {
      console.error("Summary Error:", error);
      setSummary("Error generating summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFlashcards = async () => {
    setIsGenerating(true);
    setCurrentStep('flashcards');
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Generate 6-8 flashcards for the topic: "${topic}". 
        Each flashcard should have a "front" (Question/Keyword) and a "back" (Short Answer/Definition).
        Return as a JSON array of objects.`,
        config: { responseMimeType: "application/json" }
      });
      const cards = JSON.parse(response.text || "[]");
      setFlashcards(cards);
      setActiveFlashcard(0);
      setIsFlipped(false);
    } catch (error) {
      console.error("Flashcards Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuestions = async () => {
    setIsGenerating(true);
    setCurrentStep('questions');
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Generate exactly 5 revision questions for the topic: "${topic}". 
        Mix conceptual and application-based questions. 
        Return as a JSON array of objects with: text, type (mcq), options, correctAnswer (index).`,
        config: { responseMimeType: "application/json" }
      });
      const qs = JSON.parse(response.text || "[]");
      setQuestions(qs);
      setUserAnswers({});
      setEvaluation(null);
    } catch (error) {
      console.error("Questions Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const evaluateQuestions = () => {
    const results = questions.map((q, idx) => {
      const isCorrect = parseInt(userAnswers[idx]) === q.correctAnswer;
      return {
        isCorrect,
        correctAnswer: q.options[q.correctAnswer],
        explanation: `The correct answer is ${q.options[q.correctAnswer]}.`
      };
    });
    setEvaluation(results);
    setCurrentStep('evaluation');
  };

  const reset = () => {
    setCurrentStep('topic');
    setTopic('');
    setSummary(null);
    setFlashcards([]);
    setQuestions([]);
    setUserAnswers({});
    setEvaluation(null);
  };

  const goBack = () => {
    if (currentStep === 'modes') setCurrentStep('topic');
    else if (['summary', 'flashcards', 'questions'].includes(currentStep)) setCurrentStep('modes');
    else if (currentStep === 'evaluation') setCurrentStep('questions');
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
            <Zap size={24} />
          </div>
          <h2 className="text-2xl font-bold">Quick Revision</h2>
        </div>
        {currentStep !== 'topic' && (
          <button 
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <AnimatePresence mode="wait">
          {currentStep === 'topic' && (
            <motion.div 
              key="topic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 space-y-6 flex-1 flex flex-col justify-center"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">Which topic would you like to revise?</h3>
                <p className="text-gray-500">I'll help you reinforce your memory quickly!</p>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl focus:border-orange-200 outline-none transition-all text-lg font-medium"
                  placeholder="e.g., Photosynthesis, Fractions, Sense Organs..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTopicSubmit()}
                />
              </div>
              <button 
                onClick={handleTopicSubmit}
                disabled={!topic.trim()}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Start Revision <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {currentStep === 'modes' && (
            <motion.div 
              key="modes"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 space-y-8 flex-1 flex flex-col justify-center"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Choose Revision Mode</h3>
                <p className="text-gray-500">Topic: <span className="text-orange-600 font-bold">{topic}</span></p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <ModeButton 
                  icon={<BookOpen size={24} />} 
                  label="One-Minute Summary" 
                  desc="Concise theory for fast reading"
                  onClick={generateSummary}
                />
                <ModeButton 
                  icon={<Layers size={24} />} 
                  label="Flashcards" 
                  desc="Interactive cards for memory recall"
                  onClick={generateFlashcards}
                />
                <ModeButton 
                  icon={<MessageSquare size={24} />} 
                  label="Quick Question Session" 
                  desc="5 questions to check your clarity"
                  onClick={generateQuestions}
                />
              </div>
            </motion.div>
          )}

          {currentStep === 'summary' && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 space-y-6 flex-1 flex flex-col"
            >
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Fluxy is summarizing...</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 prose prose-orange max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed bg-orange-50/30 p-8 rounded-3xl border border-orange-100 overflow-y-auto max-h-[400px]">
                    {summary}
                  </div>
                  <button 
                    onClick={reset}
                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all"
                  >
                    Done Revision
                  </button>
                </>
              )}
            </motion.div>
          )}

          {currentStep === 'flashcards' && (
            <motion.div 
              key="flashcards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 space-y-8 flex-1 flex flex-col"
            >
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Creating flashcards...</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 flex items-center justify-center">
                    <div 
                      className="w-full max-w-sm aspect-[4/3] relative cursor-pointer group"
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      <motion.div 
                        className="w-full h-full relative"
                        initial={false}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        {/* Front */}
                        <div 
                          className="absolute inset-0 bg-white border-2 border-orange-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Question</span>
                          <h4 className="text-xl font-bold text-gray-800">{flashcards[activeFlashcard]?.front}</h4>
                          <p className="text-xs text-gray-400 mt-8">Click to flip</p>
                        </div>
                        {/* Back */}
                        <div 
                          className="absolute inset-0 bg-orange-600 border-2 border-orange-600 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl text-white"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                          <span className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-4">Answer</span>
                          <p className="text-lg font-medium">{flashcards[activeFlashcard]?.back}</p>
                          <p className="text-xs text-orange-200 mt-8">Click to flip back</p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button 
                      disabled={activeFlashcard === 0}
                      onClick={() => { setActiveFlashcard(prev => prev - 1); setIsFlipped(false); }}
                      className="p-3 bg-gray-100 rounded-xl disabled:opacity-30"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <span className="font-bold text-gray-400">{activeFlashcard + 1} / {flashcards.length}</span>
                    <button 
                      disabled={activeFlashcard === flashcards.length - 1}
                      onClick={() => { setActiveFlashcard(prev => prev + 1); setIsFlipped(false); }}
                      className="p-3 bg-gray-100 rounded-xl disabled:opacity-30"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                  {activeFlashcard === flashcards.length - 1 && (
                    <button 
                      onClick={reset}
                      className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all"
                    >
                      Finish Revision
                    </button>
                  )}
                </>
              )}
            </motion.div>
          )}

          {currentStep === 'questions' && (
            <motion.div 
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 space-y-8 flex-1 flex flex-col"
            >
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Preparing questions...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-8 flex-1 overflow-y-auto">
                    {questions.map((q, idx) => (
                      <div key={idx} className="space-y-4">
                        <p className="text-lg font-bold">{idx + 1}. {q.text}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt: string, optIdx: number) => (
                            <button 
                              key={optIdx}
                              onClick={() => setUserAnswers(prev => ({ ...prev, [idx]: optIdx.toString() }))}
                              className={cn(
                                "p-4 rounded-2xl text-left transition-all border-2",
                                userAnswers[idx] === optIdx.toString() ? "border-orange-500 bg-orange-50 text-orange-700 font-bold" : "border-gray-100 hover:border-orange-200"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={evaluateQuestions}
                    disabled={Object.keys(userAnswers).length < questions.length}
                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all disabled:opacity-50"
                  >
                    Submit Answers
                  </button>
                </>
              )}
            </motion.div>
          )}

          {currentStep === 'evaluation' && (
            <motion.div 
              key="evaluation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 space-y-8 flex-1 flex flex-col overflow-y-auto"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-500">
                  <Sparkles size={48} />
                </div>
                <h3 className="text-2xl font-bold">Revision Summary</h3>
              </div>

              <div className="space-y-4">
                {evaluation?.map((res, idx) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-2xl border flex items-start gap-4",
                    res.isCorrect ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                  )}>
                    {res.isCorrect ? <CheckCircle2 className="text-green-500 mt-1" size={20} /> : <XCircle className="text-red-500 mt-1" size={20} />}
                    <div>
                      <p className="font-bold text-sm">Question {idx + 1}: {res.isCorrect ? "Excellent recall!" : "Almost there!"}</p>
                      <p className="text-xs text-gray-600 mt-1">{res.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={reset}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all"
              >
                Finish Revision
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ModeButton = ({ icon, label, desc, onClick }: any) => (
  <button 
    onClick={onClick}
    className="p-6 bg-gray-50 border border-gray-100 rounded-3xl text-left hover:border-orange-200 hover:bg-orange-50 transition-all group flex items-center gap-6"
  >
    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-orange-600 shadow-sm transition-colors flex-shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-gray-800">{label}</h4>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </div>
  </button>
);

export default RevisionTool;
