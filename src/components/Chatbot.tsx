import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Lightbulb, 
  HelpCircle, 
  BookOpen, 
  Navigation, 
  Sparkles,
  ArrowRight,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

interface ChatbotProps {
  mode: 'school' | 'individual';
  userName: string;
  currentView: string;
  onNavigate: (view: string) => void;
  progressData?: any;
}

const Chatbot: React.FC<ChatbotProps> = ({ mode, userName, currentView, onNavigate, progressData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [viewHistory, setViewHistory] = useState<string[]>([]);
  const [expression, setExpression] = useState<'neutral' | 'happy' | 'thinking'>('neutral');
  
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // Expression logic
  useEffect(() => {
    if (isOpen) setExpression('happy');
    else if (isTyping) setExpression('thinking');
    else setExpression('neutral');
  }, [isOpen, isTyping]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Inactivity Detection
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        if (!isOpen) setProactiveMessage("You've been here for a while. Need help? 🤔");
      }, 60000); // 1 minute
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [isOpen]);

  // Page Switch Detection
  useEffect(() => {
    setViewHistory(prev => {
      const newHistory = [...prev, currentView].slice(-5);
      if (newHistory.length >= 3 && new Set(newHistory).size >= 3 && !isOpen) {
        setProactiveMessage("Looking for something? I can help you find your way! 🗺️");
      }
      return newHistory;
    });
  }, [currentView, isOpen]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user' as const, text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setProactiveMessage(null);

    try {
      const progressInfo = progressData ? `User has ${progressData.stars} stars and is at Level ${progressData.level}.` : "";
      const systemInstruction = mode === 'school' 
        ? `You are Fluxy, an AI assistant for teachers on the FluxED platform. 
           Your goal is to help teachers manage classes, analyze student performance, and assign homework.
           Current view: ${currentView}. User: ${userName}. ${progressInfo}
           Tone: Professional, helpful, efficient.
           Keep responses short and clear. If the user wants to go to a page, tell them you can help them navigate.`
        : `You are Fluxy, a friendly AI book companion for students on the FluxED platform.
           Your goal is to help students learn, provide homework guidance (step-by-step, don't give answers directly), and motivate them.
           Current view: ${currentView}. User: ${userName}. ${progressInfo}
           Tone: Friendly, encouraging, kid-friendly.
           Keep responses short and clear. Use emojis. If the user wants to go to a page, tell them you can help them navigate.` ;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: text,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const botMsg = { role: 'bot' as const, text: response.text || "I'm sorry, I couldn't process that." };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { role: 'bot', text: "Oops! Something went wrong. Try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const showFact = () => {
    const studentFacts = [
      "Did you know? A group of flamingos is called a 'flamboyance'! 🦩",
      "Math Fact: Zero is the only number that cannot be represented by Roman numerals. 🔢",
      "Science Fact: Honey never spoils. Archaeologists have found edible honey in ancient Egyptian tombs! 🍯",
      progressData?.stars > 100 ? "Wow! You have over 100 stars! That's amazing progress! 🌟" : "Every star you earn makes you smarter! Keep going! ⭐"
    ];
    const teacherFacts = [
      "Teaching Tip: Using 'wait time' (3-5 seconds) after asking a question increases student participation. ⏳",
      "Insight: Students who use adaptive learning tools show 20% faster mastery in core subjects. 📈",
      "Class Fact: 30% of your class struggled with the last Math quiz. Maybe a quick review session? 🏫",
      "Motivation: You're doing a great job managing your batches today! 🌟"
    ];
    const facts = mode === 'school' ? teacherFacts : studentFacts;
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    setMessages(prev => [...prev, { role: 'bot', text: randomFact }]);
    setIsOpen(true);
  };

  const explainPage = () => {
    let explanation = "";
    if (mode === 'school') {
      switch(currentView) {
        case 'home': explanation = "This is your Class Overview. You can see total students, average scores, and active quizzes here."; break;
        case 'quiz': explanation = "Here you can manage your class quizzes and view results for each batch."; break;
        case 'library': explanation = "Access NCERT textbooks and other resources for your classes."; break;
        default: explanation = "This page helps you manage your educational tasks efficiently.";
      }
    } else {
      switch(currentView) {
        case 'home': explanation = "This is your Dashboard! You can start a quiz, check your daily plan, or see your rewards."; break;
        case 'quiz': explanation = "Time to practice! Answer questions to earn stars and level up."; break;
        case 'library': explanation = "Find your favorite books and read them anytime."; break;
        case 'progress': explanation = "See how much you've learned and check your subject mastery bars."; break;
        default: explanation = "This page is part of your learning journey!";
      }
    }
    setMessages(prev => [...prev, { role: 'bot', text: explanation }]);
    setIsOpen(true);
  };

  const quickActions = [
    { label: 'Ask a Question', icon: <HelpCircle size={16} />, action: () => { setIsOpen(true); setMessages(prev => [...prev, { role: 'bot', text: "What would you like to know? I'm here to help!" }]); } },
    { label: 'Show a Fact', icon: <Sparkles size={16} />, action: showFact },
    { label: 'Homework Help', icon: <BookOpen size={16} />, action: () => { setIsOpen(true); setMessages(prev => [...prev, { role: 'bot', text: "Tell me about your homework. I'll guide you step-by-step!" }]); } },
    { label: 'Explain This Page', icon: <Navigation size={16} />, action: explainPage },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {proactiveMessage && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-24 right-0 w-64 bg-white p-4 rounded-2xl shadow-xl border border-blue-100 mb-4"
          >
            <p className="text-sm font-medium text-gray-700">{proactiveMessage}</p>
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => { setIsOpen(true); setProactiveMessage(null); }}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Yes, please!
              </button>
              <button 
                onClick={() => setProactiveMessage(null)}
                className="text-xs font-bold text-gray-400 hover:underline"
              >
                No thanks
              </button>
            </div>
          </motion.div>
        )}

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-24 right-0 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[600px]"
          >
            {/* Chat Header */}
            <div className="p-6 bg-[#e3f2fd] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Fluxy AI</h3>
                  <p className="text-xs text-blue-700 opacity-70">Your learning companion</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-blue-100 rounded-full text-blue-900">
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
              {messages.length === 0 && (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-400">
                    <Smile size={32} />
                  </div>
                  <p className="text-gray-500 text-sm">Hi {userName}! I'm Fluxy. How can I help you today?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, idx) => (
                      <button 
                        key={idx}
                        onClick={action.action}
                        className="p-3 text-xs font-semibold bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded-xl border border-gray-100 transition-colors flex items-center gap-2"
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "max-w-[80%] p-4 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white ml-auto rounded-tr-none" 
                      : "bg-gray-100 text-gray-800 mr-auto rounded-tl-none"
                  )}
                >
                  {msg.text}
                </motion.div>
              ))}
              {isTyping && (
                <div className="bg-gray-100 text-gray-400 p-4 rounded-2xl rounded-tl-none w-16 flex gap-1 items-center">
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask me anything..." 
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-300 text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Icon */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-20 h-20 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden transition-colors",
          isOpen ? "bg-white text-blue-600 border border-gray-100" : "bg-blue-600 text-white"
        )}
      >
        <motion.div
          animate={{ 
            y: [0, -4, 0],
            rotate: [0, -2, 2, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          {isOpen ? <X size={32} /> : <BookOpen size={32} />}
          
          {/* Dynamic Facial Expressions */}
          {!isOpen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
              <div className="flex gap-2">
                <motion.div 
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="w-1.5 h-1.5 bg-white rounded-full"
                />
                <motion.div 
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="w-1.5 h-1.5 bg-white rounded-full"
                />
              </div>
              <motion.div 
                animate={expression === 'happy' ? { borderRadius: '0 0 10px 10px', height: '4px' } : { height: '1px' }}
                className="w-3 bg-white mt-1 rounded-full"
              />
            </div>
          )}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default Chatbot;
