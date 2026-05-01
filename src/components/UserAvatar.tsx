import React from 'react';

interface UserAvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  avatarSeed?: string;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  photoURL, 
  displayName, 
  avatarSeed, 
  size = 32,
  className = ""
}) => {
  let avatarUrl = photoURL;
  
  if (!avatarUrl && avatarSeed) {
    const [style, seed] = avatarSeed.includes(':') ? avatarSeed.split(':') : ['avataars', avatarSeed];
    avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  }

  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        alt={displayName || 'User'} 
        className={`rounded-full object-cover bg-neutral-100 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 ${className}`}
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Fallback to initial
  return (
    <div 
      className={`rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="text-[10px] font-bold text-neutral-500">
        {(displayName || 'G')[0].toUpperCase()}
      </span>
    </div>
  );
};
