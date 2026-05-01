export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  avatarSeed?: string;
  theme: 'light' | 'dark' | 'system';
  toolbarPosition?: 'top' | 'bottom';
  showFloatingMenu?: boolean;
  showBubbleMenu?: boolean;
  autoSave?: boolean;
};

export type PageMetadata = {
  id: string;
  title: string;
  icon?: string;
  coverImage?: string;
  ownerId: string;
  workspaceId: string;
  isArchived: boolean;
  isPublished: boolean;
  createdAt: any;
  updatedAt: any;
};

export type BlockType = 
  | 'paragraph' 
  | 'heading1' 
  | 'heading2' 
  | 'heading3' 
  | 'bulletList' 
  | 'orderedList' 
  | 'todoList' 
  | 'image' 
  | 'code' 
  | 'audio';

export type Block = {
  id: string;
  pageId: string;
  type: BlockType;
  content: any;
  position: number;
  updatedAt: any;
  updatedBy: string;
};
