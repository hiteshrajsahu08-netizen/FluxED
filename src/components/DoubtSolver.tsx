import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Mic, 
  Image as ImageIcon, 
  Send, 
  Play, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  Video, 
  Layout, 
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Camera,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

interface DoubtSolverProps {
  userName: string;
  mode: 'school' | 'individual';
}

type Step = 'input' | 'format' | 'explanation' | 'confirmation' | 'practice' | 'evaluation' | 'completed';
type Format = 'step-by-step' | 'real-life' | 'diagram' | 'story' | 'video';

const DoubtSolver: React.FC<DoubtSolverProps> = ({ userName, mode }) => {
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [doubt, setDoubt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Practice State
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [evaluation, setEvaluation] = useState<any>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Input (STT)
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDoubt(prev => prev + ' ' + transcript);
    };

    recognition.start();
  };

  // Image Input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDoubtSubmit = async () => {
    if (!doubt && !image) return;
    setCurrentStep('format');
  };

  const generateExplanation = async (format: Format) => {
    setSelectedFormat(format);
    setViewMode('back');
    setIsProcessing(true);
    setCurrentStep('explanation');

    try {
      let prompt = `You are an expert AI tutor. A student named ${userName} has a doubt: "${doubt}". `;
      if (image) prompt += "The student has also provided an image for context. ";
      
      switch(format) {
        case 'step-by-step': prompt += "Provide a clear, structured step-by-step explanation."; break;
        case 'real-life': prompt += "Explain this concept using a relatable real-life example."; break;
        case 'diagram': prompt += "Provide a text-based diagram (using ASCII or clear structure) and explain it."; break;
        case 'story': prompt += "Explain this concept using a simple and engaging story."; break;
        case 'video': prompt += "Provide a script for a short explanatory video and summarize the key points clearly."; break;
      }

      prompt += " Use simple language and avoid unnecessary complexity.";

      const parts: any[] = [{ text: prompt }];
      if (image) {
        parts.push({
          inlineData: {
            data: image.split(',')[1],
            mimeType: "image/png"
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: { parts },
      });

      setExplanation(response.text || "I'm sorry, I couldn't generate an explanation.");
    } catch (error) {
      console.error("Doubt Solver Error:", error);
      setExplanation("Oops! I had trouble understanding that. Could you try rephrasing?");
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePractice = async () => {
    setIsProcessing(true);
    setCurrentStep('practice');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Based on the previous explanation of "${doubt}", generate 3 practice questions. 
        Mix conceptual and application-based questions. 
        Return as a JSON array of objects with: text, type (mcq/text), options (if mcq), correctAnswer.`,
        config: { responseMimeType: "application/json" }
      });

      const questions = JSON.parse(response.text || "[]");
      setPracticeQuestions(questions);
    } catch (error) {
      console.error("Practice Generation Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const evaluatePractice = async () => {
    setIsProcessing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Evaluate these answers for the questions generated earlier.
        Questions: ${JSON.stringify(practiceQuestions)}
        User Answers: ${JSON.stringify(userAnswers)}
        Provide a JSON response with: isCorrect (boolean), feedback (string), corrections (if any).`,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      setEvaluation(result);
      setCurrentStep('evaluation');
    } catch (error) {
      console.error("Evaluation Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'format') setCurrentStep('input');
    else if (currentStep === 'explanation') setCurrentStep('format');
    else if (currentStep === 'confirmation') setCurrentStep('explanation');
    else if (currentStep === 'practice') setCurrentStep('confirmation');
    else if (currentStep === 'evaluation') setCurrentStep('practice');
    else if (currentStep === 'completed') setCurrentStep('input');
  };

  const [viewMode, setViewMode] = useState<'front' | 'back'>('back');

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <HelpCircle size={24} />
          </div>
          <h2 className="text-2xl font-bold">Doubt Solver AI</h2>
        </div>
        
        {currentStep !== 'input' && currentStep !== 'completed' && (
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {/* Front/Back Toggle for Explanation Step */}
        {currentStep === 'explanation' && !isProcessing && (
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setViewMode('front')}
              className={cn(
                "flex-1 py-4 font-bold text-sm transition-all border-b-2",
                viewMode === 'front' ? "border-blue-600 text-blue-600 bg-blue-50/30" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Front (Your Doubt)
            </button>
            <button 
              onClick={() => setViewMode('back')}
              className={cn(
                "flex-1 py-4 font-bold text-sm transition-all border-b-2",
                viewMode === 'back' ? "border-blue-600 text-blue-600 bg-blue-50/30" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Back (Solution)
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 'input' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 space-y-6 flex-1 flex flex-col justify-center"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">What's on your mind?</h3>
                <p className="text-gray-500">Type, speak, or snap a photo of your doubt.</p>
              </div>

              <div className="relative">
                <textarea 
                  className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl focus:border-blue-200 outline-none transition-all min-h-[150px] text-lg"
                  placeholder="Type your doubt here..."
                  value={doubt}
                  onChange={(e) => setDoubt(e.target.value)}
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button 
                    onClick={startListening}
                    className={cn(
                      "p-3 rounded-2xl transition-all",
                      isListening ? "bg-red-500 text-white animate-pulse" : "bg-white text-gray-500 hover:bg-gray-100 shadow-sm"
                    )}
                  >
                    <Mic size={20} />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-white text-gray-500 hover:bg-gray-100 rounded-2xl shadow-sm transition-all"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {image && (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-blue-100">
                  <img src={image} className="w-full h-full object-cover" alt="Doubt" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}

              <button 
                onClick={handleDoubtSubmit}
                disabled={!doubt && !image}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Solve My Doubt <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {currentStep === 'format' && (
            <motion.div 
              key="format"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 space-y-8 flex-1 flex flex-col justify-center"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">How should I explain it?</h3>
                <p className="text-gray-500">Choose your favorite way to learn.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormatButton 
                  icon={<Layout size={24} />} 
                  label="Step-by-Step" 
                  desc="Clear and structured"
                  onClick={() => generateExplanation('step-by-step')}
                />
                <FormatButton 
                  icon={<Sparkles size={24} />} 
                  label="Real-Life Example" 
                  desc="Relatable and practical"
                  onClick={() => generateExplanation('real-life')}
                />
                <FormatButton 
                  icon={<ImageIcon size={24} />} 
                  label="Diagram-Based" 
                  desc="Visual and easy to see"
                  onClick={() => generateExplanation('diagram')}
                />
                <FormatButton 
                  icon={<BookOpen size={24} />} 
                  label="Story Mode" 
                  desc="Engaging and simple"
                  onClick={() => generateExplanation('story')}
                />
                <FormatButton 
                  icon={<Video size={24} />} 
                  label="AI Video Script" 
                  desc="Concise and focused"
                  onClick={() => generateExplanation('video')}
                />
              </div>
            </motion.div>
          )}

          {currentStep === 'explanation' && (
            <motion.div 
              key="explanation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 space-y-6 flex-1 flex flex-col"
            >
              {isProcessing ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Fluxy is thinking...</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto max-h-[400px]">
                    {viewMode === 'back' ? (
                      <div className="prose prose-blue max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        {explanation}
                      </div>
                    ) : (
                      <div className="space-y-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Your Question</h4>
                          <p className="text-lg text-gray-700 font-medium">{doubt}</p>
                        </div>
                        {image && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Attached Image</h4>
                            <img src={image} className="max-w-full h-auto rounded-2xl border border-gray-200" alt="Doubt Context" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                    <p className="font-bold text-blue-900 text-center">Is your doubt solved? Did you understand the topic?</p>
                    <div className="flex gap-4 justify-center">
                      <button 
                        onClick={() => setCurrentStep('confirmation')}
                        className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
                      >
                        <ThumbsUp size={18} /> Yes, I got it!
                      </button>
                      <button 
                        onClick={() => setCurrentStep('format')}
                        className="px-8 py-3 bg-white text-gray-500 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center gap-2"
                      >
                        <ThumbsDown size={18} /> Not quite yet
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {currentStep === 'confirmation' && (
            <motion.div 
              key="confirmation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center space-y-8 flex-1 flex flex-col justify-center"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Great work, {userName}!</h3>
                <p className="text-gray-500 text-lg">Would you like to try a few practice questions to test your understanding?</p>
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={generatePractice}
                  className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all"
                >
                  Yes, let's practice!
                </button>
                <button 
                  onClick={() => setCurrentStep('completed')}
                  className="px-12 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
                >
                  No, I'm good
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'practice' && (
            <motion.div 
              key="practice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 space-y-8 flex-1 flex flex-col"
            >
              {isProcessing ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Generating practice questions...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-8 flex-1 overflow-y-auto">
                    {practiceQuestions.map((q, idx) => (
                      <div key={idx} className="space-y-4">
                        <p className="text-lg font-bold">{idx + 1}. {q.text}</p>
                        {q.type === 'mcq' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt: string, optIdx: number) => (
                              <button 
                                key={optIdx}
                                onClick={() => setUserAnswers(prev => ({ ...prev, [idx]: opt }))}
                                className={cn(
                                  "p-4 rounded-2xl text-left transition-all border-2",
                                  userAnswers[idx] === opt ? "border-blue-500 bg-blue-50 text-blue-700 font-bold" : "border-gray-100 hover:border-blue-200"
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea 
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                            placeholder="Type your answer..."
                            value={userAnswers[idx] || ''}
                            onChange={(e) => setUserAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={evaluatePractice}
                    disabled={Object.keys(userAnswers).length < practiceQuestions.length}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    Check My Answers
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
              className="p-12 text-center space-y-8 flex-1 flex flex-col justify-center"
            >
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                evaluation?.isCorrect ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
              )}>
                {evaluation?.isCorrect ? <ThumbsUp size={48} /> : <RefreshCw size={48} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  {evaluation?.isCorrect ? "Good work! You’ve understood the concept well." : "Almost there! Let's clarify a few things."}
                </h3>
                <p className="text-gray-500 text-lg">{evaluation?.feedback}</p>
                {evaluation?.corrections && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl text-left text-sm text-gray-600 italic">
                    {evaluation.corrections}
                  </div>
                )}
              </div>
              <button 
                onClick={() => setCurrentStep('completed')}
                className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all"
              >
                Finish
              </button>
            </motion.div>
          )}

          {currentStep === 'completed' && (
            <motion.div 
              key="completed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center space-y-6 flex-1 flex flex-col justify-center"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <Sparkles size={48} />
              </div>
              <h3 className="text-2xl font-bold">You're all set!</h3>
              <p className="text-gray-500">I'm always here if you have more doubts. Keep learning!</p>
              <button 
                onClick={() => {
                  setCurrentStep('input');
                  setViewMode('back');
                  setDoubt('');
                  setImage(null);
                  setExplanation(null);
                  setPracticeQuestions([]);
                  setUserAnswers({});
                  setEvaluation(null);
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                Ask another doubt
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const FormatButton = ({ icon, label, desc, onClick }: any) => (
  <button 
    onClick={onClick}
    className="p-6 bg-gray-50 border border-gray-100 rounded-3xl text-left hover:border-blue-200 hover:bg-blue-50 transition-all group"
  >
    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-blue-600 shadow-sm mb-4 transition-colors">
      {icon}
    </div>
    <h4 className="font-bold text-gray-800">{label}</h4>
    <p className="text-xs text-gray-500 mt-1">{desc}</p>
  </button>
);

export default DoubtSolver;
