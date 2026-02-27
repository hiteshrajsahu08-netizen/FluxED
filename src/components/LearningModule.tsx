import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  Video, 
  FileText, 
  CheckCircle, 
  ChevronRight, 
  Download, 
  Play, 
  Star, 
  Award,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Info,
  Sparkles,
  ClipboardList,
  Lightbulb
} from 'lucide-react';
import { CURRICULUM } from '../data/mockData';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

interface LearningModuleProps {
  userName: string;
}

const LearningModule: React.FC<LearningModuleProps> = ({ userName }) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'test' | 'performance'>('content');
  
  // Content State
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Test State
  const [testStarted, setTestStarted] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState(0);

  // Performance State (Mocked persistence in localStorage)
  const [completionData, setCompletionData] = useState<Record<string, { notes: boolean, video: boolean, testScore: number | null }>>({});

  // Chapter View State
  const [videoRatings, setVideoRatings] = useState<Record<string, { avg: number, count: number }>>({});
  const [videoFilter, setVideoFilter] = useState<'top' | 'short' | 'beginner'>('top');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [chapterTest, setChapterTest] = useState<any[] | null>(null);
  const [isGeneratingChapterTest, setIsGeneratingChapterTest] = useState(false);
  const [chapterTab, setChapterTab] = useState<'resources' | 'videos' | 'test'>('resources');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    const saved = localStorage.getItem('fluxed_completion');
    if (saved) setCompletionData(JSON.parse(saved));
    
    // Initialize mock ratings if not present
    const savedRatings = localStorage.getItem('fluxed_video_ratings');
    if (savedRatings) setVideoRatings(JSON.parse(savedRatings));
  }, []);

  const handleRateVideo = (videoId: string, rating: number) => {
    const current = videoRatings[videoId] || { avg: 4.5, count: 10 };
    const newCount = current.count + 1;
    const newAvg = Number(((current.avg * current.count + rating) / newCount).toFixed(1));
    const newRatings = { ...videoRatings, [videoId]: { avg: newAvg, count: newCount } };
    setVideoRatings(newRatings);
    localStorage.setItem('fluxed_video_ratings', JSON.stringify(newRatings));
  };

  const generateChapterTest = async () => {
    setIsGeneratingChapterTest(true);
    
    // Calculate overall chapter performance for adaptive difficulty
    const chapterTopics = selectedChapter.topics;
    let totalScore = 0;
    let attemptedCount = 0;
    chapterTopics.forEach((t: any) => {
      const data = completionData[t.id];
      if (data && data.testScore !== null) {
        totalScore += data.testScore;
        attemptedCount++;
      }
    });
    const avgScore = attemptedCount > 0 ? totalScore / attemptedCount : 50;
    const difficulty = avgScore > 80 ? "Challenging" : avgScore > 50 ? "Moderate" : "Easy/Foundational";

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Generate a comprehensive ${difficulty} level chapter test for "${selectedChapter.name}" in ${selectedSubject}.
        The user's average performance in this chapter is ${avgScore.toFixed(0)}%.
        Include 5 questions:
        - 2 MCQs
        - 2 Conceptual (True/False or short)
        - 1 Application-based problem.
        Return as a JSON array of objects with: text, options (if MCQ), correctAnswer (index or string), explanation.`,
        config: { responseMimeType: "application/json" }
      });
      const test = JSON.parse(response.text || "[]");
      setChapterTest(test);
    } catch (error) {
      console.error("Chapter Test Error:", error);
    } finally {
      setIsGeneratingChapterTest(false);
    }
  };

  const getFilteredVideos = (videos: any[]) => {
    let filtered = [...videos].map(v => ({
      ...v,
      rating: videoRatings[v.title]?.avg || v.rating,
      totalRatings: videoRatings[v.title]?.count || v.totalRatings
    }));

    if (videoFilter === 'top') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (videoFilter === 'short') {
      filtered = filtered.filter(v => parseInt(v.duration) <= 4);
    } else if (videoFilter === 'beginner') {
      filtered = filtered.filter(v => v.tags?.includes('Beginner Friendly'));
    }
    return filtered;
  };

  const saveProgress = (topicId: string, updates: Partial<{ notes: boolean, video: boolean, testScore: number | null }>) => {
    const newData = {
      ...completionData,
      [topicId]: {
        notes: false,
        video: false,
        testScore: null,
        ...(completionData[topicId] || {}),
        ...updates
      }
    };
    setCompletionData(newData);
    localStorage.setItem('fluxed_completion', JSON.stringify(newData));
  };

  const generateAIContent = async (topicName: string, topicId: string) => {
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Generate a structured learning note for the topic "${topicName}". 
        Include:
        1. Concept Explanation (simple for kids)
        2. 2-3 Examples
        3. Key Points/Formulas
        4. A short Summary.
        Format it nicely with headers.`,
      });
      setAiContent(response.text || "Failed to generate content.");
      saveProgress(topicId, { notes: true });
    } catch (error) {
      console.error("AI Generation Error:", error);
      setAiContent("Error generating content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestSubmit = () => {
    let score = 0;
    selectedTopic.questions.forEach((q: any, idx: number) => {
      if (testAnswers[idx] === q.correctAnswer) score++;
    });
    const finalScore = (score / selectedTopic.questions.length) * 100;
    setTestScore(finalScore);
    setTestSubmitted(true);
    saveProgress(selectedTopic.id, { testScore: finalScore });
  };

  const getPerformance = (topicId: string) => {
    const data = completionData[topicId] || { notes: false, video: false, testScore: null };
    const { notes, video, testScore } = data;
    
    let percentage = 0;
    let remark = "Requires More Practice";
    
    const isFullCompletion = notes && video && testScore !== null;
    
    if (testScore === 100) {
      percentage = 100;
      if (isFullCompletion) {
        remark = "Excellent Mastery 🎯";
      } else {
        remark = "Test Mastered – Consider Reviewing Notes for Reinforcement.";
      }
    } else {
      if (notes) percentage += 33.33;
      if (video) percentage += 33.33;
      if (testScore !== null) percentage += (testScore / 100) * 33.34;
      
      percentage = Math.min(100, Math.round(percentage));
      
      if (percentage === 100) remark = "Excellent Mastery 🎯";
      else if (percentage >= 80) remark = "Strong Understanding";
      else if (percentage >= 50) remark = "Good Progress, Needs Revision";
      else remark = "Requires More Practice";
    }
    
    return { percentage, remark };
  };

  const downloadPDF = () => {
    if (!aiContent) return;
    const blob = new Blob([aiContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTopic.name}_Notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Curriculum Hub</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.keys(CURRICULUM).map(subject => (
            <button 
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-center group"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Book className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold">{subject}</h3>
              <p className="text-sm text-gray-500 mt-2">{CURRICULUM[subject].length} Chapters</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedSubject(null)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold">{selectedSubject} Chapters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CURRICULUM[selectedSubject].map(chapter => (
            <button 
              key={chapter.id}
              onClick={() => setSelectedChapter(chapter)}
              className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex justify-between items-center group"
            >
              <div>
                <h3 className="text-lg font-bold">{chapter.name}</h3>
                <p className="text-sm text-gray-500">{chapter.topics.length} Topics</p>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedTopic) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedChapter(null)} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{selectedSubject}</p>
              <h2 className="text-3xl font-bold">{selectedChapter.name}</h2>
            </div>
          </div>
        </div>

        {/* Chapter Tabs */}
        <div className="flex gap-4 border-b border-gray-100 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'resources', label: 'Books & Notes', icon: Book },
            { id: 'videos', label: 'Video Lectures', icon: Video },
            { id: 'test', label: 'Chapter Test', icon: ClipboardList },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setChapterTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap",
                chapterTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {chapterTab === 'resources' && (
            <motion.div 
              key="resources"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Books Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Download className="text-blue-500" size={24} /> Download Books PDF
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedChapter.pdfs?.map((pdf: any, idx: number) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold">{pdf.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{pdf.desc}</p>
                      </div>
                      <button 
                        onClick={() => window.open(pdf.url, '_blank')}
                        className="w-full py-2 bg-gray-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={16} /> Download
                      </button>
                    </div>
                  ))}
                  {/* AI Quick Notes Card */}
                  <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-purple-600">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900">AI Quick Notes</h4>
                      <p className="text-xs text-purple-700 mt-1">Personalized summary of the entire chapter.</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedTopic({ id: 'chapter_summary', name: `${selectedChapter.name} Summary`, videos: [], questions: [] }); setActiveTab('content'); generateAIContent(`${selectedChapter.name} Summary`, 'chapter_summary'); }}
                      className="w-full py-2 bg-white text-purple-600 rounded-xl font-bold text-sm hover:bg-purple-100 transition-all"
                    >
                      Generate Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Topics List (Collapsible) */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Chapter Topics</h3>
                <div className="space-y-3">
                  {selectedChapter.topics.map((topic: any) => {
                    const { percentage } = getPerformance(topic.id);
                    const isExpanded = expandedTopics[topic.id];
                    return (
                      <div key={topic.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button 
                          onClick={() => setExpandedTopics(prev => ({ ...prev, [topic.id]: !prev[topic.id] }))}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              percentage === 100 ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                            )}>
                              {percentage === 100 ? <CheckCircle size={20} /> : <Book size={20} />}
                            </div>
                            <div className="text-left">
                              <h3 className="font-bold">{topic.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${percentage}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{percentage}%</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className={cn("text-gray-300 transition-transform", isExpanded && "rotate-90")} />
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="px-4 pb-4 bg-gray-50/50 space-y-3"
                            >
                              <div className="pt-2 flex gap-2">
                                <button 
                                  onClick={() => { setSelectedTopic(topic); setActiveTab('content'); }}
                                  className="flex-1 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:border-blue-300 transition-all"
                                >
                                  Study Topic
                                </button>
                                <button 
                                  onClick={() => { setSelectedTopic(topic); setActiveTab('test'); }}
                                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                                >
                                  Take Test
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {chapterTab === 'videos' && (
            <motion.div 
              key="videos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Filters */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Structured Video Lectures</h3>
                <div className="flex gap-2">
                  {[
                    { id: 'top', label: 'Top Rated' },
                    { id: 'short', label: 'Short' },
                    { id: 'beginner', label: 'Beginner' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setVideoFilter(f.id as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        videoFilter === f.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video List Topic-wise */}
              <div className="space-y-8">
                {selectedChapter.topics.map((topic: any) => {
                  const filteredVideos = getFilteredVideos(topic.videos);
                  if (filteredVideos.length === 0) return null;
                  
                  return (
                    <div key={topic.id} className="space-y-4">
                      <h4 className="font-bold text-gray-400 uppercase text-xs tracking-widest">{topic.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredVideos.map((video: any, idx: number) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 group">
                            <div className="w-32 aspect-video bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0">
                              <img src={`https://picsum.photos/seed/${video.title}/200/120`} className="w-full h-full object-cover opacity-80" alt="" />
                              <button 
                                onClick={() => { window.open(video.url, '_blank'); saveProgress(topic.id, { video: true }); }}
                                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all"
                              >
                                <Play className="text-white fill-white" size={24} />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="font-bold truncate text-sm">{video.title}</h4>
                              <p className="text-[10px] text-gray-500 line-clamp-2">{video.desc}</p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1">
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                      <Star 
                                        key={s} 
                                        size={10} 
                                        className={cn("cursor-pointer transition-colors", s <= Math.round(video.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200")}
                                        onClick={() => handleRateVideo(video.title, s)}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-400">{video.rating} ({video.totalRatings})</span>
                                </div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase">{video.platform} • {video.duration}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {chapterTab === 'test' && (
            <motion.div 
              key="test"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {!chapterTest ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center space-y-6">
                  <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-purple-500">
                    <Sparkles size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">AI Chapter Test</h3>
                    <p className="text-gray-500">Generate a comprehensive adaptive test covering all topics in {selectedChapter.name}.</p>
                  </div>
                  <button 
                    onClick={generateChapterTest}
                    disabled={isGeneratingChapterTest}
                    className="bg-purple-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 disabled:opacity-50"
                  >
                    {isGeneratingChapterTest ? <RefreshCw className="animate-spin" size={24} /> : "Generate Test"}
                  </button>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="text-xl font-bold">Chapter Test: {selectedChapter.name}</h3>
                    <button onClick={() => setChapterTest(null)} className="text-sm text-gray-400 hover:text-gray-600">Reset</button>
                  </div>
                  <div className="space-y-8">
                    {chapterTest.map((q: any, idx: number) => (
                      <div key={idx} className="space-y-4">
                        <p className="text-lg font-bold">{idx + 1}. {q.text}</p>
                        {q.options ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt: string, optIdx: number) => (
                              <button 
                                key={optIdx}
                                className="p-4 rounded-2xl text-left transition-all border-2 border-gray-100 hover:border-blue-200"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea 
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                            placeholder="Type your answer here..."
                          />
                        )}
                      </div>
                    ))}
                    <div className="pt-8 border-t">
                      <button 
                        onClick={() => alert("Chapter test submitted! (Demo logic: Results would show here)")}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all"
                      >
                        Submit Chapter Test
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedTopic(null); setAiContent(null); setTestStarted(false); setTestSubmitted(false); }} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold">{selectedTopic.name}</h2>
            <p className="text-sm text-gray-500">{selectedSubject} • {selectedChapter.name}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('content')}
          className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'content' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700")}
        >
          Learn
        </button>
        <button 
          onClick={() => setActiveTab('test')}
          className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'test' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700")}
        >
          Test
        </button>
        <button 
          onClick={() => setActiveTab('performance')}
          className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'performance' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700")}
        >
          Performance
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'content' && (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* AI Notes Section */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-xl font-bold">AI Study Notes</h3>
                </div>
                {aiContent ? (
                  <button onClick={downloadPDF} className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
                    <Download size={18} /> Download PDF
                  </button>
                ) : (
                  <button 
                    onClick={() => generateAIContent(selectedTopic.name, selectedTopic.id)} 
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    Generate Notes
                  </button>
                )}
              </div>

              {isGenerating ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 font-medium">Fluxy is crafting your personalized notes...</p>
                </div>
              ) : aiContent ? (
                <div className="prose prose-blue max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {aiContent}
                </div>
              ) : (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400">Click "Generate Notes" to get AI-powered study material!</p>
                </div>
              )}
            </div>

            {/* Video Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Video className="text-red-500" size={24} /> Video Learning
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTopic.videos.map((video: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 group">
                    <div className="w-32 aspect-video bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      <img src={`https://picsum.photos/seed/${video.title}/200/120`} className="w-full h-full object-cover opacity-80" alt="" />
                      <button 
                        onClick={() => { window.open(video.url, '_blank'); saveProgress(selectedTopic.id, { video: true }); }}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all"
                      >
                        <Play className="text-white fill-white" size={24} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{video.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{video.desc}</p>
                      <span className="text-[10px] font-bold text-blue-600 mt-2 block uppercase">{video.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'test' && (
          <motion.div 
            key="test"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {!testStarted ? (
              <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center space-y-6">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-500">
                  <ClipboardList size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Topic Test: {selectedTopic.name}</h3>
                  <p className="text-gray-500">Test your understanding with {selectedTopic.questions.length} quick questions.</p>
                </div>
                <button 
                  onClick={() => setTestStarted(true)}
                  className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Start Test
                </button>
              </div>
            ) : testSubmitted ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                    <Award size={48} />
                  </div>
                  <h3 className="text-3xl font-bold">Test Completed!</h3>
                  <p className="text-5xl font-black text-blue-600">{testScore}%</p>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xl font-bold border-b pb-2">Review Answers</h4>
                  {selectedTopic.questions.map((q: any, idx: number) => (
                    <div key={idx} className="p-6 rounded-2xl border border-gray-100 bg-gray-50 space-y-3">
                      <p className="font-bold">{idx + 1}. {q.text}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className={cn(
                            "p-3 rounded-xl text-sm border",
                            optIdx === q.correctAnswer ? "bg-green-50 border-green-200 text-green-700 font-bold" : 
                            optIdx === testAnswers[idx] ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-100 text-gray-500"
                          )}>
                            {opt}
                            {optIdx === q.correctAnswer && " ✓"}
                            {optIdx === testAnswers[idx] && optIdx !== q.correctAnswer && " ✗"}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl flex gap-3">
                        <Info className="text-blue-500 flex-shrink-0" size={18} />
                        <p className="text-sm text-blue-700 italic">{q.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-6">
                  <button 
                    onClick={() => { setTestStarted(false); setTestSubmitted(false); setTestAnswers({}); }}
                    className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Retake Test
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                {selectedTopic.questions.map((q: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                    <p className="text-lg font-bold">{idx + 1}. {q.text}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt: string, optIdx: number) => (
                        <button 
                          key={optIdx}
                          onClick={() => setTestAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                          className={cn(
                            "p-4 rounded-2xl text-left transition-all border-2",
                            testAnswers[idx] === optIdx ? "border-blue-500 bg-blue-50 text-blue-700 font-bold" : "border-gray-100 hover:border-blue-200"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="pt-8 border-t">
                  <button 
                    onClick={handleTestSubmit}
                    disabled={Object.keys(testAnswers).length < selectedTopic.questions.length}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    Submit Test
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div 
            key="performance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                  <BarChart3 size={20} />
                </div>
                <h3 className="text-xl font-bold">Topic Performance</h3>
              </div>

              {(() => {
                const { percentage, remark } = getPerformance(selectedTopic.id);
                const data = completionData[selectedTopic.id] || { notes: false, video: false, testScore: null };
                
                return (
                  <div className="space-y-8">
                    <div className="text-center space-y-2">
                      <p className="text-5xl font-black text-blue-600">{percentage}%</p>
                      <p className="text-xl font-bold text-gray-800">{remark}</p>
                    </div>

                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={cn("h-full", percentage === 100 ? "bg-green-500" : "bg-blue-500")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={cn("p-4 rounded-2xl border flex items-center gap-3", data.notes ? "bg-green-50 border-green-100 text-green-700" : "bg-gray-50 border-gray-100 text-gray-400")}>
                        <CheckCircle size={20} className={data.notes ? "text-green-500" : "text-gray-300"} />
                        <span className="font-bold">Notes Read</span>
                      </div>
                      <div className={cn("p-4 rounded-2xl border flex items-center gap-3", data.video ? "bg-green-50 border-green-100 text-green-700" : "bg-gray-50 border-gray-100 text-gray-400")}>
                        <CheckCircle size={20} className={data.video ? "text-green-500" : "text-gray-300"} />
                        <span className="font-bold">Video Watched</span>
                      </div>
                      <div className={cn("p-4 rounded-2xl border flex items-center gap-3", data.testScore !== null ? "bg-green-50 border-green-100 text-green-700" : "bg-gray-50 border-gray-100 text-gray-400")}>
                        <CheckCircle size={20} className={data.testScore !== null ? "text-green-500" : "text-gray-300"} />
                        <span className="font-bold">Test Attempted</span>
                      </div>
                    </div>

                    {percentage < 100 && (
                      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                          <Lightbulb size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-blue-900">Revision Tip</p>
                          <p className="text-sm text-blue-700">
                            {percentage < 50 ? "Try watching the video again and reading the notes carefully before retaking the test." : 
                             "You're almost there! Review the incorrect answers in your test to reach 100% mastery."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearningModule;
