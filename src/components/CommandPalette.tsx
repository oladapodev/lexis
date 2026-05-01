import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Command, Search, FileText, Settings, User, History, Share2, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useAuth } from '../lib/AuthWrapper';
import { cn } from '../lib/utils';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query_text, setQueryText] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQueryText('');
      setResults([]);
      return;
    }

    const searchPages = async () => {
      if (!user || query_text.length < 2) {
        setResults([]);
        return;
      }
      const q = query(
        collection(db, 'pages'),
        where('ownerId', '==', user.uid),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((d: any) => d.title.toLowerCase().includes(query_text.toLowerCase()));
      setResults(docs);
    };

    const timer = setTimeout(searchPages, 300);
    return () => clearTimeout(timer);
  }, [query_text, isOpen, user]);

  const handleSelect = (item: any) => {
    if (item.type === 'action') {
      item.action();
    } else {
      navigate(`/p/${item.id}`);
    }
    setIsOpen(false);
  };

  const actions = [
    { id: 'new', title: 'Create New Page', icon: Plus, type: 'action', action: () => window.dispatchEvent(new CustomEvent('new-page')) },
    { id: 'settings', title: 'Open Settings', icon: Settings, type: 'action', action: () => window.dispatchEvent(new CustomEvent('open-settings')) },
    { id: 'history', title: 'View History', icon: History, type: 'action', action: () => window.dispatchEvent(new CustomEvent('open-history')) },
  ];

  const filteredActions = actions.filter(a => a.title.toLowerCase().includes(query_text.toLowerCase()));
  const allItems = [...filteredActions, ...results];

  useEffect(() => {
    if (selectedIndex >= allItems.length) setSelectedIndex(0);
  }, [allItems.length, selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) handleSelect(allItems[selectedIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-xl bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden relative flex flex-col font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center px-4 border-b border-neutral-100 dark:border-neutral-800 h-14 bg-neutral-50/50 dark:bg-neutral-900/50">
              <Search className="text-neutral-400 mr-3" size={18} />
              <input
                autoFocus
                className="flex-1 bg-transparent border-none focus:outline-none text-sm h-full font-medium"
                placeholder="Search notes, commands, or tools... (Cmd+K)"
                value={query_text}
                onChange={e => setQueryText(e.target.value)}
              />
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-400 font-mono">ESC</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {allItems.length === 0 && query_text && (
                <div className="py-12 text-center text-neutral-500">
                  <p className="text-sm">No results found for "{query_text}"</p>
                </div>
              )}

              {filteredActions.length > 0 && (
                <div className="mb-2">
                  <h3 className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Commands</h3>
                  <div className="space-y-0.5">
                    {filteredActions.map((item, i) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                          i === selectedIndex ? "bg-black text-white dark:bg-white dark:text-black shadow-lg scale-[1.02]" : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                        )}
                      >
                        <item.icon size={16} className={cn(i === selectedIndex ? "text-white dark:text-black" : "text-neutral-400")} />
                        <span className="text-sm font-medium">{item.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Recent Notes</h3>
                  <div className="space-y-0.5">
                    {results.map((item, i) => {
                      const actualIndex = i + filteredActions.length;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(actualIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                            actualIndex === selectedIndex ? "bg-black text-white dark:bg-white dark:text-black shadow-lg scale-[1.02]" : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                          )}
                        >
                          <FileText size={16} className={cn(actualIndex === selectedIndex ? "text-white dark:text-black" : "text-neutral-400")} />
                          <span className="text-sm font-medium truncate">{item.title || 'Untitled'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-neutral-400">Navigate:</span>
                  <div className="flex gap-0.5">
                    <span className="px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-400 font-mono">↑</span>
                    <span className="px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-400 font-mono">↓</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-neutral-400">Select:</span>
                  <span className="px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-400 font-mono">↵</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-neutral-400">
                <Command size={12} />
                <span className="text-[10px] font-bold">SONAR COMMANDS</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
