import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthWrapper';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { AccountView } from './components/AccountView';
import { Zap, Menu, Moon, Sun, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

function Dashboard() {
  const { user, signInAnon, theme, setTheme } = useAuth();
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = window.location.pathname;

  const currentView = pageId ? 'editor' : 
                    location === '/account' ? 'account' : 'dashboard';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) {
      signInAnon();
    }
  }, [user, signInAnon]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300">
      <Toaster 
        position="bottom-center" 
        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
        toastOptions={{
          className: 'font-sans',
        }} 
      />
      <Sidebar 
        activePageId={pageId || null} 
        activeView={currentView}
        onSelectPage={(id) => navigate(`/page/${id}`)}
        onSelectView={(view) => navigate(`/${view}`)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Navigation / Header */}
        <header className="h-12 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-4 shrink-0 transition-colors bg-white/80 dark:bg-[#191919]/80 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-4 h-full">
            <AnimatePresence mode="wait">
              {isSidebarCollapsed && (
                <motion.button
                  key="open-sidebar"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-all active:scale-95 shrink-0"
                  title="Open sidebar"
                >
                  <Menu size={18} />
                </motion.button>
              )}
            </AnimatePresence>
            
            {currentView === 'editor' && (
              <div id="editor-toolbar-slot" className="flex-1 h-full min-w-0 overflow-x-auto no-scrollbar flex items-center" />
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div id="editor-actions-slot" className="flex items-center gap-2" />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {currentView === 'editor' && pageId ? (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden">
              <Editor pageId={pageId} />
            </motion.div>
          ) : currentView === 'account' ? (
            <AccountView key="account" />
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center text-neutral-400 dark:text-neutral-600 flex-col gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                <Zap size={24} className="opacity-20" />
              </div>
              <p className="text-sm">Select a page to start working</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Landing() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50 dark:bg-[#191919]">
        <Loader2 className="animate-spin text-neutral-300" size={32} />
      </div>
    );
  }

  if (user && !user.isAnonymous) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#121212] px-4 transition-colors">
      <div className="max-w-md w-full flex flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center">
            <Zap className="text-white dark:text-black fill-current" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">Lexis Workspace</h1>
        </div>
        
        <div className="w-full bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 dark:text-white">Welcome to Lexis</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">A collaborative space for your thoughts and documents.</p>
          </div>
          
          <button 
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors dark:text-white"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Continue with Google
          </button>

          <button 
            onClick={() => navigate('/dashboard')}
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors"
          >
            Or try it out as a guest
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/page/:pageId" element={<Dashboard />} />
          <Route path="/account" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

