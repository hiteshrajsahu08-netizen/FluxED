import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  User, 
  LayoutDashboard, 
  Library, 
  ClipboardList, 
  Calendar, 
  LogOut, 
  Play, 
  Star, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight, 
  Search,
  Menu,
  X,
  Bell,
  Award,
  BookMarked,
  Lightbulb,
  ArrowRight,
  Plus,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QUESTIONS, LIBRARY_PDFS, Question } from './data/mockData';
import { cn } from './lib/utils';
import Chatbot from './components/Chatbot';
import LearningModule from './components/LearningModule';
import DoubtSolver from './components/DoubtSolver';
import RevisionTool from './components/RevisionTool';

// --- Types ---
type Mode = 'school' | 'individual' | null;
type Role = 'teacher' | 'student';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  picture?: string;
}

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' }) => {
  const variants = {
    primary: 'bg-[#e3f2fd] text-blue-700 hover:bg-blue-100',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'border-2 border-[#e3f2fd] text-blue-600 hover:bg-[#e3f2fd]/50',
    ghost: 'hover:bg-gray-100 text-gray-600',
    success: 'bg-[#e8f5e9] text-green-700 hover:bg-green-100'
  };

  return (
    <button 
      className={cn(
        'px-6 py-3 rounded-2xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void, key?: React.Key }) => (
  <motion.div 
    whileHover={onClick ? { y: -4, scale: 1.02 } : {}}
    onClick={onClick}
    className={cn(
      'bg-white p-6 rounded-3xl shadow-sm border border-gray-100',
      onClick && 'cursor-pointer hover:shadow-md transition-shadow',
      className
    )}
  >
    {children}
  </motion.div>
);

// --- Auth Context Mock ---
const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fluxed_token');
    if (token) {
      // Simulate fetching user from token
      const savedUser = localStorage.getItem('fluxed_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (role: Role, name: string) => {
    const mockUser: UserProfile = {
      id: 'user-' + Date.now(),
      name,
      email: name.toLowerCase().replace(' ', '.') + '@fluxed.edu',
      role,
      picture: `https://picsum.photos/seed/${name}/100/100`
    };
    setUser(mockUser);
    localStorage.setItem('fluxed_token', 'mock-jwt-token');
    localStorage.setItem('fluxed_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fluxed_token');
    localStorage.removeItem('fluxed_user');
    localStorage.removeItem('fluxed_mode');
  };

  return { user, login, logout, loading };
};

// --- Main App ---

export default function App() {
  const { user, login, logout, loading } = useAuth();
  const [mode, setMode] = useState<Mode>(null);
  const [view, setView] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const savedMode = localStorage.getItem('fluxed_mode') as Mode;
    if (savedMode) setMode(savedMode);
  }, []);

  const handleModeSelect = (selectedMode: Mode) => {
    setMode(selectedMode);
    localStorage.setItem('fluxed_mode', selectedMode || '');
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading FluxED...</div>;

  if (!user) return <LoginScreen onLogin={login} />;

  if (!mode) return <ModeSwitcher onSelect={handleModeSelect} userName={user.name} />;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-gray-100 flex flex-col z-50"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e3f2fd] rounded-xl flex items-center justify-center">
            <BookOpen className="text-blue-600" size={24} />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">FluxED</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Home" 
            active={view === 'home'} 
            onClick={() => setView('home')} 
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={mode === 'school' ? <ClipboardList size={20} /> : <Play size={20} />} 
            label={mode === 'school' ? 'Quizzes' : 'Practice'} 
            active={view === 'quiz'} 
            onClick={() => setView('quiz')} 
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<Library size={20} />} 
            label="Library" 
            active={view === 'library'} 
            onClick={() => setView('library')} 
            collapsed={!isSidebarOpen}
          />
          {mode === 'school' ? (
            <>
              <SidebarItem 
                icon={<ClipboardList size={20} />} 
                label="Assignments" 
                active={view === 'assignments'} 
                onClick={() => setView('assignments')} 
                collapsed={!isSidebarOpen}
              />
              <SidebarItem 
                icon={<Calendar size={20} />} 
                label="Planner" 
                active={view === 'planner'} 
                onClick={() => setView('planner')} 
                collapsed={!isSidebarOpen}
              />
            </>
          ) : (
            <SidebarItem 
              icon={<TrendingUp size={20} />} 
              label="My Progress" 
              active={view === 'progress'} 
              onClick={() => setView('progress')} 
              collapsed={!isSidebarOpen}
            />
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <SidebarItem 
            icon={<LogOut size={20} />} 
            label="Logout" 
            onClick={logout} 
            collapsed={!isSidebarOpen}
            className="text-red-500 hover:bg-red-50"
          />
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-bottom border-gray-100 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-semibold capitalize">{view}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {user.name[0]}
              </div>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'home' && (mode === 'school' ? <TeacherHome userName={user.name} /> : <StudentHome setView={setView} userName={user.name} />)}
              {view === 'quiz' && (mode === 'school' ? <TeacherQuiz /> : <AdaptiveQuiz />)}
              {view === 'library' && <LibraryView />}
              {view === 'progress' && <StudentProgress />}
              {view === 'planner' && <TeacherPlanner />}
              {view === 'assignments' && <TeacherAssignments />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Chatbot 
        mode={mode as 'school' | 'individual'} 
        userName={user.name} 
        currentView={view} 
        onNavigate={setView}
        progressData={{ stars: 124, level: 1 }}
      />
    </div>
  );
}

// --- Sub-Views ---

function SidebarItem({ icon, label, active, onClick, collapsed, className }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
        active ? 'bg-[#e3f2fd] text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
        collapsed && 'justify-center',
        className
      )}
    >
      {icon}
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );
}

function LoginScreen({ onLogin }: { onLogin: (role: Role, name: string) => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('student');

  return (
    <div className="h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-[#e3f2fd] rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen size={48} className="text-blue-600" />
          </div>
          {/* Orbiting Icons Simulation */}
          <div className="absolute inset-0 -m-8 border-2 border-dashed border-blue-100 rounded-full animate-spin-slow pointer-events-none"></div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">FluxED</h1>
          <p className="text-gray-500 text-lg">Welcome to the new way to practice & learn</p>
        </div>

        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Enter your name" 
            className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-200 outline-none transition-all text-lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          
          <div className="flex gap-4">
            <button 
              onClick={() => setRole('student')}
              className={cn(
                "flex-1 py-3 rounded-xl border-2 transition-all font-medium",
                role === 'student' ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-500"
              )}
            >
              Student
            </button>
            <button 
              onClick={() => setRole('teacher')}
              className={cn(
                "flex-1 py-3 rounded-xl border-2 transition-all font-medium",
                role === 'teacher' ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-500"
              )}
            >
              Teacher
            </button>
          </div>

          <Button 
            className="w-full py-4 text-lg" 
            disabled={!name}
            onClick={() => onLogin(role, name)}
          >
            <User size={20} />
            Login with FluxID
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400 uppercase tracking-widest">Or</span></div>
          </div>

          <Button variant="outline" className="w-full py-4 text-lg border-gray-200 text-gray-700 hover:bg-gray-50">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </Button>
        </div>

        <div className="fixed bottom-8 right-8 max-w-xs bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex gap-4 animate-bounce-subtle">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-blue-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">Stay informed!</p>
            <p className="text-xs text-gray-500">Get updates from FluxED team.</p>
            <div className="flex gap-2 mt-2">
              <button className="text-xs font-bold text-gray-400">Deny</button>
              <button className="text-xs font-bold text-blue-600">Allow</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeSwitcher({ onSelect, userName }: { onSelect: (mode: Mode) => void, userName: string }) {
  return (
    <div className="h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full space-y-12"
      >
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Namaste, {userName}! 👋</h2>
          <p className="text-gray-500 text-xl">How would you like to use FluxED today?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card 
            onClick={() => onSelect('school')}
            className="p-12 space-y-6 group"
          >
            <div className="w-24 h-24 bg-[#e3f2fd] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <GraduationCap size={48} className="text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">School Mode</h3>
              <p className="text-gray-500">Manage your class, create quizzes, and track student progress.</p>
            </div>
            <div className="pt-4">
              <span className="inline-flex items-center gap-2 text-blue-600 font-bold">
                Teach Class <ChevronRight size={20} />
              </span>
            </div>
          </Card>

          <Card 
            onClick={() => onSelect('individual')}
            className="p-12 space-y-6 group"
          >
            <div className="w-24 h-24 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <User size={48} className="text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Individual Mode</h3>
              <p className="text-gray-500">Personalized practice, earn stars, and learn at your own pace.</p>
            </div>
            <div className="pt-4">
              <span className="inline-flex items-center gap-2 text-green-600 font-bold">
                My Learning <ChevronRight size={20} />
              </span>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

// --- Teacher Components ---

function TeacherHome({ userName }: { userName: string }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Class Overview</h1>
          <p className="text-gray-500">Here's what's happening in your batches.</p>
        </div>
        <Button>
          <Plus size={20} /> New Class
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-gray-500">Average Score</p>
              <h3 className="text-4xl font-bold">78%</h3>
            </div>
            <p className="text-sm text-green-600">+5% from last week</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-gray-500">Active Quizzes</p>
              <h3 className="text-4xl font-bold">3</h3>
            </div>
            <p className="text-sm text-orange-600">Due in 2 days</p>
          </div>
        </Card>
      </div>

      <LearningModule userName={userName} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Weekly Planner</h3>
            <Button variant="ghost" className="text-blue-600">View All</Button>
          </div>
          <div className="space-y-4">
            <PlannerItem day="Monday" topic="Numbers & Shapes" status="Completed" />
            <PlannerItem day="Tuesday" topic="Addition Basics" status="In Progress" />
            <PlannerItem day="Wednesday" topic="Animal Kingdom" status="Upcoming" />
          </div>
        </Card>

        <Card className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Recent Assignments</h3>
            <Button variant="ghost" className="text-blue-600">View All</Button>
          </div>
          <div className="space-y-4">
            <AssignmentItem title="Math Quiz 1" batch="Class 1A" submissions="18/20" />
            <AssignmentItem title="EVS Worksheet" batch="Class 2B" submissions="12/22" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DoubtSolver userName={userName} mode="school" />
        <RevisionTool userName={userName} />
      </div>
    </div>
  );
}

function PlannerItem({ day, topic, status }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="w-12 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase">{day.slice(0, 3)}</p>
        </div>
        <div>
          <p className="font-bold">{topic}</p>
          <p className="text-xs text-gray-500">{status}</p>
        </div>
      </div>
      <div className={cn(
        "w-3 h-3 rounded-full",
        status === 'Completed' ? "bg-green-500" : status === 'In Progress' ? "bg-blue-500" : "bg-gray-300"
      )}></div>
    </div>
  );
}

function AssignmentItem({ title, batch, submissions }: any) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-xs text-gray-500">{batch}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-blue-600">{submissions}</p>
        <p className="text-xs text-gray-400">Submissions</p>
      </div>
    </div>
  );
}

function TeacherQuiz() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Class Quizzes</h1>
        <Button>Create New Quiz</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Math Basics', 'Animal World', 'English Letters'].map((q, i) => (
          <Card key={i} className="space-y-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <BookMarked size={24} />
            </div>
            <h3 className="text-xl font-bold">{q}</h3>
            <div className="flex justify-between text-sm text-gray-500">
              <span>10 Questions</span>
              <span>Class 1A</span>
            </div>
            <Button variant="outline" className="w-full">View Results</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TeacherPlanner() {
  return <div className="p-12 text-center text-gray-500">Planner feature coming soon! 🗓️</div>;
}

function TeacherAssignments() {
  return <div className="p-12 text-center text-gray-500">Assignments feature coming soon! 📝</div>;
}

// --- Student Components ---

function StudentHome({ setView, userName }: { setView: (v: string) => void, userName: string }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-gray-500">Ready to learn something new today?</p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-100">
          <Star className="text-yellow-500 fill-yellow-500" size={20} />
          <span className="font-bold text-yellow-700">124 Stars</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card onClick={() => setView('quiz')} className="bg-blue-50 border-blue-100">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Play size={24} fill="currentColor" />
            </div>
            <h3 className="text-xl font-bold">Play Quiz</h3>
            <p className="text-sm text-blue-600">Practice and earn stars!</p>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
              <Calendar size={24} />
            </div>
            <h3 className="text-xl font-bold">Daily Plan</h3>
            <p className="text-sm text-green-600">3 tasks left for today</p>
          </div>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <Award size={24} />
            </div>
            <h3 className="text-xl font-bold">Rewards</h3>
            <p className="text-sm text-purple-600">New badge unlocked!</p>
          </div>
        </Card>

        <Card onClick={() => setView('library')} className="bg-orange-50 border-orange-100">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
              <Library size={24} />
            </div>
            <h3 className="text-xl font-bold">Library</h3>
            <p className="text-sm text-orange-600">Read your favorite books</p>
          </div>
        </Card>
      </div>

      <LearningModule userName={userName} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="space-y-6">
          <h3 className="text-xl font-bold">Today's Tasks</h3>
          <div className="space-y-4">
            <TaskItem title="Solve 5 Math problems" completed={true} />
            <TaskItem title="Read 'The Hungry Caterpillar'" completed={false} />
            <TaskItem title="Learn 3 new animal names" completed={false} />
          </div>
        </Card>

        <Card className="space-y-6">
          <h3 className="text-xl font-bold">My Progress</h3>
          <div className="h-48 flex items-end gap-4 px-4">
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-100 rounded-t-lg relative group">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  className="bg-blue-500 rounded-t-lg w-full"
                />
                <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-gray-400">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 text-center">
            <p className="text-sm font-medium text-gray-500">You are a <span className="text-blue-600 font-bold">Super Learner Level 1</span>!</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DoubtSolver userName={userName} mode="individual" />
        <RevisionTool userName={userName} />
      </div>
    </div>
  );
}

function TaskItem({ title, completed }: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
      <div className={cn(
        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
        completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
      )}>
        {completed && <CheckCircle2 size={14} />}
      </div>
      <span className={cn("font-medium", completed && "line-through text-gray-400")}>{title}</span>
    </div>
  );
}

function AdaptiveQuiz() {
  const [currentStep, setCurrentStep] = useState<'subject' | 'start' | 'playing' | 'result' | 'revision'>('subject');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Filter questions based on current difficulty and subject
  const activeQuestions = useMemo(() => {
    return QUESTIONS.filter(q => q.subject === selectedSubject && q.difficulty === difficulty);
  }, [difficulty, selectedSubject]);

  const currentQuestion = activeQuestions[currentQuestionIndex % activeQuestions.length];

  const handleAnswer = (index: number) => {
    if (index === currentQuestion.correctAnswer) {
      setScore(s => s + 10);
      setConsecutiveCorrect(c => c + 1);
      setConsecutiveWrong(0);
      setFeedback({ type: 'success', message: 'Wah! ⭐ Shabaash!' });
      
      // Adapt up
      if (consecutiveCorrect + 1 >= 3) {
        if (difficulty === 'easy') setDifficulty('medium');
        else if (difficulty === 'medium') setDifficulty('hard');
        setConsecutiveCorrect(0);
      }
    } else {
      const newConsecutiveWrong = consecutiveWrong + 1;
      setConsecutiveWrong(newConsecutiveWrong);
      setConsecutiveCorrect(0);
      setFeedback({ type: 'error', message: 'No problem! Dekho hint 😊' });
      setShowHint(true);

      // Adapt down
      if (difficulty === 'hard') setDifficulty('medium');
      else if (difficulty === 'medium') setDifficulty('easy');

      // End quiz if 3-4 questions wrong
      if (newConsecutiveWrong >= 3) {
        setTimeout(() => {
          setCurrentStep('revision');
        }, 2000);
        return;
      }
    }

    setTimeout(() => {
      setFeedback(null);
      setShowHint(false);
      if (currentQuestionIndex >= 9) {
        setCurrentStep('result');
      } else {
        setCurrentQuestionIndex(i => i + 1);
      }
    }, 2000);
  };

  if (currentStep === 'subject') {
    const subjects = Array.from(new Set(QUESTIONS.map(q => q.subject)));
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <h2 className="text-4xl font-bold">Choose a Subject</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(s => (
            <Button 
              key={s} 
              onClick={() => { setSelectedSubject(s); setCurrentStep('start'); }}
              className="py-8 text-xl"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (currentStep === 'start') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
          <Play size={64} className="text-blue-500 ml-2" fill="currentColor" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">Ready for {selectedSubject} Challenge?</h2>
          <p className="text-gray-500 text-xl">Answer 10 questions to earn stars and level up!</p>
        </div>
        <Button onClick={() => setCurrentStep('playing')} className="px-12 py-6 text-2xl">
          Start Quiz
        </Button>
      </div>
    );
  }

  if (currentStep === 'result') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-48 h-48 bg-yellow-50 rounded-full flex items-center justify-center mx-auto"
        >
          <Award size={96} className="text-yellow-500" />
        </motion.div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">Amazing Job! 🌟</h2>
          <p className="text-gray-500 text-xl">You earned <span className="text-blue-600 font-bold">{score}</span> points in {selectedSubject}!</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => {
            setCurrentStep('subject');
            setScore(0);
            setCurrentQuestionIndex(0);
            setDifficulty('easy');
            setConsecutiveWrong(0);
            setConsecutiveCorrect(0);
          }}>Play Again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'revision') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <RefreshCw size={64} />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">Let's Revise! 📚</h2>
          <p className="text-gray-500 text-xl">You've had a few tricky questions. It might be a good time to review the concepts before trying again.</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => {
            setCurrentStep('subject');
            setScore(0);
            setCurrentQuestionIndex(0);
            setDifficulty('easy');
            setConsecutiveWrong(0);
            setConsecutiveCorrect(0);
          }}>Try Another Subject</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-bold">
            Question {currentQuestionIndex + 1}/10
          </div>
          <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-bold capitalize">
            Level: {difficulty}
          </div>
        </div>
        <div className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
          <Star size={24} fill="currentColor" /> {score}
        </div>
      </div>

      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentQuestionIndex / 10) * 100}%` }}
          className="h-full bg-blue-500"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-8"
        >
          <Card className="p-12 text-center">
            <h3 className="text-3xl font-bold leading-tight">{currentQuestion.text}</h3>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, idx) => (
              <Button 
                key={idx} 
                variant="outline" 
                className="py-8 text-xl border-2 hover:border-blue-500 hover:bg-blue-50"
                onClick={() => handleAnswer(idx)}
                disabled={!!feedback}
              >
                {option}
              </Button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl text-white font-bold text-xl z-50",
              feedback.type === 'success' ? "bg-green-500" : "bg-red-500"
            )}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {showHint && currentQuestion.hint && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 flex gap-4 items-center"
        >
          <Lightbulb className="text-yellow-500" size={32} />
          <div>
            <p className="font-bold text-yellow-800">Hint for you:</p>
            <p className="text-yellow-700">{currentQuestion.hint}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function LibraryView() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredPdfs = LIBRARY_PDFS.filter(pdf => {
    const matchesSearch = pdf.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || pdf.subject === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">Library</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search books..." 
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-300 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Math</option>
            <option>English</option>
            <option>EVS</option>
            <option>Science</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPdfs.map(pdf => (
          <Card key={pdf.id} className="flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-full aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://picsum.photos/seed/${pdf.id}/300/400`} 
                  alt={pdf.title} 
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{pdf.subject} • Class {pdf.grade}</span>
                <h3 className="text-lg font-bold mt-1">{pdf.title}</h3>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="mt-6 w-full"
              onClick={() => window.open(pdf.url, '_blank')}
            >
              Read Now <ArrowRight size={16} />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StudentProgress() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">My Progress</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-10">
          <h4 className="text-gray-500 font-medium">Total Stars</h4>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Star className="text-yellow-500 fill-yellow-500" size={32} />
            <span className="text-5xl font-black">124</span>
          </div>
        </Card>
        <Card className="text-center p-10">
          <h4 className="text-gray-500 font-medium">Quizzes Played</h4>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Play className="text-blue-500" size={32} fill="currentColor" />
            <span className="text-5xl font-black">18</span>
          </div>
        </Card>
        <Card className="text-center p-10">
          <h4 className="text-gray-500 font-medium">Current Level</h4>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Award className="text-purple-500" size={32} />
            <span className="text-5xl font-black">1</span>
          </div>
        </Card>
      </div>

      <Card className="p-8">
        <h3 className="text-xl font-bold mb-6">Subject Mastery</h3>
        <div className="space-y-6">
          <MasteryBar subject="Mathematics" percentage={85} color="bg-blue-500" />
          <MasteryBar subject="English" percentage={65} color="bg-purple-500" />
          <MasteryBar subject="EVS" percentage={92} color="bg-green-500" />
        </div>
      </Card>
    </div>
  );
}

function MasteryBar({ subject, percentage, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span>{subject}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn("h-full", color)}
        />
      </div>
    </div>
  );
}
