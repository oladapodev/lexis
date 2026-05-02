import React, { useEffect, useMemo, useState } from 'react';

interface UserAvatarProps {
  uid?: string | null;
  photoURL?: string | null;
  displayName?: string | null;
  avatarSeed?: string;
  size?: number;
  className?: string;
}

const buildDicebearUrl = (seedInput: string) => {
  const [styleCandidate, rawSeed] = seedInput.includes(':')
    ? seedInput.split(':', 2)
    : ['avataaars', seedInput];
  const style = styleCandidate || 'avataaars';
  const seed = rawSeed || 'guest';
  return `https://api.dicebear.com/7.x/${encodeURIComponent(style)}/svg?seed=${encodeURIComponent(seed)}`;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  uid,
  photoURL,
  displayName,
  avatarSeed,
  size = 32,
  className = '',
}) => {
  const fallbackIdentity = uid || displayName || 'guest';
  const primarySeed = avatarSeed || `avataaars:${fallbackIdentity}`;
  const secondarySeed = `bottts:${fallbackIdentity}`;

  const imageSources = useMemo(() => {
    const sources = [photoURL || null, buildDicebearUrl(primarySeed), buildDicebearUrl(secondarySeed)];
    return [...new Set(sources.filter(Boolean) as string[])];
  }, [photoURL, primarySeed, secondarySeed]);

  const [sourceIndex, setSourceIndex] = useState(imageSources.length > 0 ? 0 : -1);

  useEffect(() => {
    setSourceIndex(imageSources.length > 0 ? 0 : -1);
  }, [imageSources]);

  if (sourceIndex >= 0 && imageSources[sourceIndex]) {
    return (
      <img
        src={imageSources[sourceIndex]}
        alt={displayName || 'User'}
        className={`rounded-full object-cover bg-neutral-100 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 ${className}`}
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
        onError={() => {
          if (sourceIndex < imageSources.length - 1) {
            setSourceIndex(sourceIndex + 1);
            return;
          }
          setSourceIndex(-1);
        }}
      />
    );
  }

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
