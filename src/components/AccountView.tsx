import React from 'react';
import { useAuth } from '../lib/AuthWrapper';
import { UserAvatar } from './UserAvatar';
import { Mail, Shield, User as UserIcon, Calendar, BadgeCheck, Sun, Moon, Monitor, Bell, Eye, Database, MousePointer2, TextCursorInput, Save, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const AccountView: React.FC = () => {
  const { 
    user, 
    profile, 
    theme, 
    setTheme, 
    toolbarPosition, 
    setToolbarPosition,
    showFloatingMenu,
    setShowFloatingMenu,
    showBubbleMenu,
    setShowBubbleMenu,
    autoSave,
    setAutoSave,
    setAvatarSeed
  } = useAuth();

  const randomizeAvatar = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let seed = '';
    for (let i = 0; i < 8; i++) seed += chars.charAt(Math.floor(Math.random() * chars.length));
    setAvatarSeed(seed);
  };

  const SettingRow = ({ icon: Icon, label, description, children }: any) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 font-sans gap-3 sm:gap-4 group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500 transition-colors">
          <Icon size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{label}</h4>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-[200px] sm:max-w-[240px]">{description}</p>
        </div>
      </div>
      <div className="flex justify-start sm:justify-end shrink-0 pl-[52px] sm:pl-0">
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#191919] p-8 font-sans custom-scrollbar">
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-12"
        >
          <header className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-neutral-100 dark:border-neutral-800 text-center sm:text-left">
            <div className="relative group">
              <UserAvatar 
                uid={user?.uid}
                photoURL={profile?.photoURL}
                displayName={profile?.displayName}
                avatarSeed={profile?.avatarSeed || (user ? `avataaars:${user.uid}` : undefined)}
                size={96}
              />
              <button 
                onClick={randomizeAvatar}
                className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
                title="Randomize Avatar"
              >
                <RefreshCw size={16} className="text-neutral-500" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white truncate">
                {profile?.displayName || 'User Profile'}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <p className="text-sm text-neutral-500 font-medium">
                  {user?.isAnonymous ? 'Guest Account' : 'Verified Member'}
                </p>
                {!user?.isAnonymous && <BadgeCheck size={16} className="text-blue-500 fill-current" />}
              </div>
              <button 
                onClick={randomizeAvatar}
                className="mt-4 text-xs font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 uppercase tracking-widest sm:hidden"
              >
                Change Avatar
              </button>
            </div>
          </header>

          <div className="grid gap-10">
            <section>
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.1em] mb-6">Account Settings</h2>
              <div className="bg-neutral-50/50 dark:bg-neutral-900/30 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <UserIcon size={18} className="text-neutral-400" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Display Name</p>
                      <p className="text-sm font-medium">{profile?.displayName}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Mail size={18} className="text-neutral-400" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Email Address</p>
                      <p className="text-sm font-medium">{profile?.email || 'No email connected'}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 mt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-4">
                  <Shield size={18} className="text-neutral-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Security ID</p>
                    <p className="text-[11px] font-mono text-neutral-500">{user?.uid}</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-[0.1em] mb-6">App Preferences</h2>
              <div className="space-y-2">
                <SettingRow 
                  icon={Monitor} 
                  label="Appearance" 
                  description="Choose how Lexis looks on your screen."
                >
                  <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                    <button 
                      onClick={() => setTheme('light')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                        theme === 'light' ? "bg-white text-black shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                      )}
                    >
                      <Sun size={12} /> Light
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                        theme === 'dark' ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      <Moon size={12} /> Dark
                    </button>
                    <button 
                      onClick={() => setTheme('system')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                        theme === 'system' ? "bg-white dark:bg-neutral-600 text-black dark:text-white shadow-sm" : "text-neutral-500"
                      )}
                    >
                      <Monitor size={12} /> System
                    </button>
                  </div>
                </SettingRow>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                <SettingRow 
                  icon={BadgeCheck} 
                  label="Toolbar Position" 
                  description="Move the editor toolbar to the top or bottom."
                >
                  <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                    <button 
                      onClick={() => setToolbarPosition('top')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                        toolbarPosition === 'top' ? "bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm" : "text-neutral-500"
                      )}
                    >
                      Top
                    </button>
                    <button 
                      onClick={() => setToolbarPosition('bottom')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                        toolbarPosition === 'bottom' ? "bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm" : "text-neutral-500"
                      )}
                    >
                      Bottom
                    </button>
                  </div>
                </SettingRow>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                <SettingRow 
                  icon={Save} 
                  label="Auto-Save" 
                  description="Changes are synced instantly. Turn off to sync manually."
                >
                  <button 
                    onClick={() => setAutoSave(!autoSave)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      autoSave ? "bg-black dark:bg-white" : "bg-neutral-200 dark:bg-neutral-800"
                    )}
                  >
                    <motion.div 
                      animate={{ x: autoSave ? 20 : 2 }}
                      initial={false}
                      className="absolute top-1 w-3 h-3 rounded-full bg-white dark:bg-black shadow-sm"
                    />
                  </button>
                </SettingRow>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                <SettingRow 
                  icon={MousePointer2} 
                  label="Floating Menu" 
                  description="Show menu when hovering over an empty line."
                >
                  <button 
                    onClick={() => setShowFloatingMenu(!showFloatingMenu)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      showFloatingMenu ? "bg-black dark:bg-white" : "bg-neutral-200 dark:bg-neutral-800"
                    )}
                  >
                    <motion.div 
                      animate={{ x: showFloatingMenu ? 20 : 2 }}
                      initial={false}
                      className="absolute top-1 w-3 h-3 rounded-full bg-white dark:bg-black shadow-sm"
                    />
                  </button>
                </SettingRow>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                <SettingRow 
                  icon={TextCursorInput} 
                  label="Bubble Menu" 
                  description="Show menu when text is selected."
                >
                  <button 
                    onClick={() => setShowBubbleMenu(!showBubbleMenu)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      showBubbleMenu ? "bg-black dark:bg-white" : "bg-neutral-200 dark:bg-neutral-800"
                    )}
                  >
                    <motion.div 
                      animate={{ x: showBubbleMenu ? 20 : 2 }}
                      initial={false}
                      className="absolute top-1 w-3 h-3 rounded-full bg-white dark:bg-black shadow-sm"
                    />
                  </button>
                </SettingRow>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
                
                <SettingRow 
                  icon={Bell} 
                  label="Notifications" 
                  description="Manage push and desktop alerts."
                >
                  <span className="text-[10px] text-neutral-400 font-medium">Inactive</span>
                </SettingRow>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                <SettingRow 
                  icon={Database} 
                  label="Storage" 
                  description="View your workspace data usage."
                >
                  <div className="flex flex-col items-end gap-1">
                    <div className="w-24 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="w-1/4 h-full bg-black dark:bg-white rounded-full" />
                    </div>
                    <p className="text-[9px] text-neutral-400 font-bold">12.4 MB / 5 GB</p>
                  </div>
                </SettingRow>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
