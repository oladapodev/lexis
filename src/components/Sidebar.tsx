import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthWrapper';
import { PageMetadata } from '../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Settings, 
  ChevronLeft, 
  Trash2,
  Clock,
  LogOut,
  LogIn,
  User as UserIcon,
  Link2,
  Globe,
  Lock,
  Moon,
  Sun,
  Menu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { toast } from 'sonner';

interface SidebarProps {
  activePageId: string | null;
  activeView: string;
  onSelectPage: (id: string) => void;
  onSelectView: (view: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activePageId, 
  activeView,
  onSelectPage, 
  onSelectView,
  isCollapsed, 
  setIsCollapsed 
 }) => {
  const { user, profile, signIn, signOut, theme, setTheme } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState<PageMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'private' | 'public'>('private');
  const [workspaceName, setWorkspaceName] = useState(() => localStorage.getItem('workspaceName') || 'Lexis Space');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    localStorage.setItem('workspaceName', workspaceName);
  }, [workspaceName]);

  useEffect(() => {
    if (!user) return;

    const path = 'pages';
    const q = query(
      collection(db, path),
      where('ownerId', '==', user.uid),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PageMetadata[];
      setPages(pageList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [user]);

  const filteredPages = pages.filter(p => {
    const matchesTab = activeTab === 'public' ? p.isPublished : !p.isPublished;
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const createPage = async () => {
    if (!user) return;
    const path = 'pages';
    try {
      const docRef = await addDoc(collection(db, path), {
        title: 'Untitled',
        ownerId: user.uid,
        workspaceId: 'default',
        isArchived: false,
        isPublished: activeTab === 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onSelectPage(docRef.id);
      toast.success("New page created");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deletePage = async (id: string) => {
    const path = `pages/${id}`;
    try {
      await updateDoc(doc(db, path), {
        isArchived: true,
        updatedAt: serverTimestamp(),
      });
      toast.success("Page moved to trash");
      if (activePageId === id) {
        onSelectPage(null as any);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const copyPageLink = (id: string) => {
    const url = `${window.location.origin}/page/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? 0 : 260,
          x: isCollapsed && window.innerWidth < 768 ? -260 : 0
        }}
        className={cn(
          "fixed md:relative h-screen bg-[#f7f7f5] dark:bg-[#191919] border-r border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col group/sidebar transition-colors duration-300 z-[100]",
          isCollapsed && "border-r-0"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="pt-2 p-4 flex flex-col gap-4 shrink-0">
            <div className="flex items-center justify-between px-1 mb-2">
              {!isCollapsed && (
                <div 
                  className="flex items-center gap-2 flex-1 cursor-pointer overflow-hidden p-1 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
                  onClick={() => navigate('/dashboard')}
                >
                  <UserAvatar 
                    photoURL={profile?.photoURL || user?.photoURL}
                    displayName={profile?.displayName || user?.displayName}
                    avatarSeed={profile?.avatarSeed}
                    size={24}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium text-sm text-neutral-700 dark:text-neutral-300 truncate leading-none mb-0.5">
                      {user ? (profile?.displayName || user?.displayName || 'Signed In') : 'Welcome'}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium leading-none flex items-center gap-1">
                      <div className={cn("w-1 h-1 rounded-full", user ? "bg-green-500" : "bg-neutral-300")} />
                      {user ? (user.isAnonymous ? 'Guest session' : 'Authenticated') : 'Not signed in'}
                    </span>
                  </div>
                </div>
              )}
              
              {!isCollapsed && (
                <button 
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer text-neutral-400 shrink-0 transition-opacity ml-auto"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center p-0.5 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-lg relative">
                  <button
                    onClick={() => setActiveTab('private')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-1 px-2 text-[11px] font-medium rounded-md transition-all relative z-10",
                      activeTab === 'private' ? "text-neutral-900 dark:text-white" : "text-neutral-500"
                    )}
                  >
                    <Lock size={12} />
                    Private
                  </button>
                  <button
                    onClick={() => setActiveTab('public')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-1 px-2 text-[11px] font-medium rounded-md transition-all relative z-10",
                      activeTab === 'public' ? "text-neutral-900 dark:text-white" : "text-neutral-500"
                    )}
                  >
                    <Globe size={12} />
                    Public
                  </button>
                  <motion.div
                    layoutId="sidebar-tab-indicator"
                    className="absolute inset-0.5 w-[calc(50%-2px)] bg-white dark:bg-neutral-700 rounded-md shadow-sm pointer-events-none"
                    initial={false}
                    animate={{ x: activeTab === 'private' ? 0 : '100%' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                  <input 
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-lg py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-neutral-200 dark:focus:ring-neutral-700 transition-all outline-none text-neutral-600 dark:text-neutral-300 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Note List */}
          {!isCollapsed && (
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 mb-2">
              <div className="px-2 py-1 mb-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider flex items-center justify-between group">
                Notes
                <button 
                  onClick={createPage}
                  className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-0.5">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredPages.length > 0 ? filteredPages.map(page => (
                    <motion.div 
                      key={page.id} 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                      className="group/item relative"
                    >
                      <SidebarItem 
                        icon={<FileText size={16} />}
                        label={page.title || "Untitled"}
                        active={activePageId === page.id}
                        onClick={() => onSelectPage(page.id)}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded shadow-sm">
                        <button 
                           onClick={(e) => { e.stopPropagation(); copyPageLink(page.id); }}
                           className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400"
                        >
                          <Link2 size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  )) : (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-4 py-8 text-center text-xs text-neutral-400 italic"
                    >
                      {searchTerm ? 'No matches found' : `No ${activeTab} notes yet`}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Footer */}
          {!isCollapsed && (
            <div className="mt-auto border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0 flex flex-col gap-1">
               <SidebarItem 
                 icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} 
                 label={theme === 'dark' ? "Light Mode" : "Dark Mode"} 
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
               />
               {user && !user.isAnonymous && (
                 <SidebarItem icon={<UserIcon size={16} />} label="Account" active={activeView === 'account'} onClick={() => onSelectView('account')} />
               )}
               {user ? (
                 <SidebarItem icon={<LogOut size={16} />} label="Log out" onClick={() => {
                   signOut();
                   toast.success("Logged out successfully");
                   navigate('/');
                 }} />
               ) : (
                 <SidebarItem icon={<LogIn size={16} />} label="Sign In" onClick={() => {
                   signIn().then(() => toast.success("Signed in successfully")).catch(() => toast.error("Sign in failed"));
                 }} />
               )}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50",
      active && "bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
    )}
  >
    <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);
