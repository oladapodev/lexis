import React from 'react';
import { useAuth } from '../lib/AuthWrapper';
import { UserAvatar } from './UserAvatar';
import { Mail, Shield, User as UserIcon, Calendar, BadgeCheck, Sun, Moon, Monitor, Bell, Eye, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const AccountView: React.FC = () => {
  const { user, profile, theme, setTheme } = useAuth();

  const SettingRow = ({ icon: Icon, label, description, children }: any) => (
    <div className="flex items-center justify-between py-4 font-sans">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-500 shrink-0">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white">{label}</h3>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
      </div>
      <div>{children}</div>
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
          <header className="flex items-center gap-6 pb-8 border-b border-neutral-100 dark:border-neutral-800">
            <UserAvatar 
              photoURL={profile?.photoURL}
              displayName={profile?.displayName}
              avatarSeed={profile?.avatarSeed}
              size={80}
            />
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                {profile?.displayName || 'User Profile'}
              </h1>
              <p className="text-neutral-500 flex items-center gap-2 mt-1">
                {user?.isAnonymous ? 'Guest Account' : 'Verified Member'}
                {!user?.isAnonymous && <BadgeCheck size={16} className="text-blue-500 fill-current" />}
              </p>
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
