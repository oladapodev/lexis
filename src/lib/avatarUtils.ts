
export const getRandomAvatarSeed = (uid?: string) => {
  const styles = ['adventurer', 'avataars', 'bottts', 'pixel-art', 'lorelei', 'notionists'];
  const style = styles[Math.floor(Math.random() * styles.length)];
  const randomStr = Math.random().toString(36).substring(7);
  return `${style}:${uid || randomStr}`;
};
