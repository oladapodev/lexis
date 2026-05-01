import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import CharacterCount from '@tiptap/extension-character-count';
import Dropcursor from '@tiptap/extension-dropcursor';
import Focus from '@tiptap/extension-focus';
import Gapcursor from '@tiptap/extension-gapcursor';
import HardBreak from '@tiptap/extension-hard-break';
import { common, createLowlight } from 'lowlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import FloatingMenuExtension from '@tiptap/extension-floating-menu';
import { Extension } from '@tiptap/core';
import * as Y from 'yjs';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  setDoc, 
  deleteDoc,
  addDoc,
  query,
  orderBy,
  getDocs,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { PageMetadata } from '../types';
import { useAuth } from '../lib/AuthWrapper';
import { 
  Loader2, 
  Smile, 
  Users, 
  Share2, 
  Check, 
  X, 
  QrCode, 
  Trash2, 
  AlertCircle,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code as CodeIcon,
  Quote,
  List,
  ListOrdered,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  CheckSquare,
  Minus,
  ChevronDown,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronLeft as ChevronLeftIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  History,
  RotateCcw,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { cn } from '../lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Markdown } from 'tiptap-markdown';
import tippy from 'tippy.js';

const lowlight = createLowlight(common);

interface EditorProps {
  pageId: string;
}

interface Presence {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  avatarSeed?: string;
  lastActive: any;
  cursorPos?: number;
}

export const Editor: React.FC<EditorProps> = ({ pageId }) => {
  if (!pageId || pageId === 'null' || pageId === '') {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#191919]">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin text-neutral-400" size={32} />
          <p className="text-sm text-neutral-500 font-medium font-sans">Connecting to workspace...</p>
        </motion.div>
      </div>
    );
  }

  const { user, profile, toolbarPosition, showFloatingMenu, showBubbleMenu, autoSave } = useAuth();
  const [page, setPage] = useState<PageMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [presences, setPresences] = useState<Presence[]>([]);
  const [copied, setCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const deletedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerManualSave = () => {
    if (saveStatus === 'saved') {
      toast.info("No new changes to sync.");
      return;
    }
    window.dispatchEvent(new CustomEvent('sonar-force-sync'));
  };

  // Yjs Initialization
  const ydoc = useMemo(() => new Y.Doc(), [pageId]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        history: false,
        gapcursor: false,
        hardBreak: false,
        dropCursor: {
          color: '#3b82f6',
          width: 2,
        }
      } as any),
      Placeholder.configure({
        placeholder: "Start typing...",
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      CharacterCount,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Subscript,
      Superscript,
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-600 underline underline-offset-4 transition-colors cursor-pointer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 my-8 max-w-full hover:ring-2 hover:ring-blue-500 transition-all cursor-zoom-in',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    onSelectionUpdate: ({ editor }) => {
      const pos = editor.state.selection.from;
      updateCursor(pos);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[70vh] pb-64 transition-colors duration-300',
      },
    },
  }, [ydoc]);

  const updateCursor = useMemo(() => {
    return (pos: number) => {
      if (!pageId || pageId === 'null' || !user || !page) return;
        const presenceDoc = doc(db, `pages/${pageId}/presences`, user.uid);
        const displayName = profile?.displayName || user.displayName || (user.isAnonymous ? 'Guest' : 'User');
        setDoc(presenceDoc, { 
          cursorPos: pos,
          displayName,
          photoURL: profile?.photoURL || user.photoURL,
          ownerId: page.ownerId,
          isPublished: page.isPublished,
          lastActive: serverTimestamp()
        }, { merge: true }).catch(() => {});
    };
  }, [pageId, user, page, profile]);

  const getCursorCoords = (pos: number) => {
    if (!editor || !editor.view) return null;
    try {
      const coords = editor.view.coordsAtPos(pos);
      if (!editorContainerRef.current) return null;
      const rect = editorContainerRef.current.getBoundingClientRect();
      const parent = editorContainerRef.current;
      return {
        top: coords.top - rect.top + parent.scrollTop,
        left: coords.left - rect.left,
      };
    } catch {
      return null;
    }
  };

    // Sync Content via Yjs-Firestore Update Buffer
    useEffect(() => {
      if (!pageId || pageId === 'null' || pageId === '') {
        setLoading(false);
        return;
      }

      // We need either metadata or a user to even know if we can sync
      // But we can start the metadata subscription regardless
      if (!page && !user) return; 

      const updatesCollection = collection(db, `pages/${pageId}/updates`);
      setLoading(true);

      // Simple local buffer to batch updates
      let updateBuffer: Uint8Array[] = [];
      let timeout: any = null;

      const pushBuffer = () => {
        if (!user || updateBuffer.length === 0 || !page) return;
        setSaveStatus('saving');
        const merged = Y.mergeUpdates(updateBuffer);
        updateBuffer = [];
        
        const startTime = Date.now();
        addDoc(updatesCollection, {
          update: Array.from(merged),
          timestamp: serverTimestamp(),
          seq: Date.now(),
          userId: user.uid,
          ownerId: page.ownerId,
          isPublished: page.isPublished
        }).then(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 800 - elapsed);
          
          setTimeout(() => {
            setSaveStatus('saved');
            toast.success("Sonar sync successful", {
              description: "Changes pushed to shared workspace",
              duration: 2000,
              className: "sonar-toast",
              icon: <Check size={14} className="text-green-500" />
            });
          }, remaining);
        }).catch(err => {
          console.error("Failed to push update", err);
          setSaveStatus('idle');
          toast.error("Sonar sync failed", {
            description: "Permissions restricted or network error"
          });
        });
      };

      // Local -> Remote: Push local updates to Firestore (only if logged in)
      const handleUpdate = (update: Uint8Array, origin: any) => {
        if (origin === 'remote' || !user) return;
        
        setSaveStatus('idle');
        updateBuffer.push(update);
        if (!timeout) {
          timeout = setTimeout(() => {
            pushBuffer();
            timeout = null;
          }, 50);
        }
      };
      ydoc.on('update', handleUpdate);

      // Remote -> Local: Pull updates from others
      const updatesPath = `pages/${pageId}/updates`;
      const q = query(
        updatesCollection, 
        orderBy('timestamp', 'asc'), 
        orderBy('seq', 'asc'),
        limit(2000)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docChanges = snapshot.docChanges();
        if (docChanges.length === 0) {
          if (loading) setLoading(false);
          return;
        }

        ydoc.transact(() => {
          docChanges.forEach(change => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (!user || data.userId !== user.uid) {
                const updateArr = data.update instanceof Uint8Array 
                  ? data.update 
                  : new Uint8Array(data.update); 
                Y.applyUpdate(ydoc, updateArr, 'remote');
              }
            }
          });
        }, 'remote');
        
        if (loading) setLoading(false);
      }, (error) => {
        // If it's a public page, don't show full error to guests
        if (!user && error.message.includes('permission')) {
          console.warn("Read-only access for guest");
        } else {
           handleFirestoreError(error, OperationType.LIST, updatesPath);
        }
        setLoading(false);
      });

      const handleForceSync = () => pushBuffer();
      window.addEventListener('sonar-force-sync', handleForceSync);

      return () => {
        ydoc.off('update', handleUpdate);
        window.removeEventListener('sonar-force-sync', handleForceSync);
        if (timeout) clearTimeout(timeout);
        unsubscribe();
      };
    }, [pageId, ydoc, user, page]);

  // Presence Tracking
  useEffect(() => {
    if (!pageId || pageId === 'null' || pageId === '' || !user) return;

    const presenceDoc = doc(db, `pages/${pageId}/presences`, user.uid);
    const updatePresence = async () => {
      if (!page) return;
      try {
        const displayName = profile?.displayName || user.displayName || (user.isAnonymous ? 'Guest' : 'User');
        await setDoc(presenceDoc, {
          uid: user.uid,
          displayName,
          photoURL: profile?.photoURL || user.photoURL,
          avatarSeed: profile?.avatarSeed || null,
          lastActive: serverTimestamp(),
          ownerId: page.ownerId,
          isPublished: page.isPublished
        }, { merge: true });
      } catch {}
    };

    updatePresence();
    const interval = setInterval(updatePresence, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        deleteDoc(presenceDoc).catch(() => {});
      } else {
        updatePresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const q = collection(db, `pages/${pageId}/presences`);
    const presencesPath = `pages/${pageId}/presences`;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const p = snapshot.docs.map(d => d.data() as Presence);
      
      // Filter out self and stale presences (older than 2 minutes)
      const activePresences = p.filter(x => {
        if (x.uid === user.uid) return false;
        if (!x.lastActive) return true; // Firestore serverTimestamp might be null momentarily
        const lastActiveTime = x.lastActive.toMillis?.() || x.lastActive;
        return (now - lastActiveTime) < 120000; // 2 minutes threshold
      });
      
      setPresences(activePresences);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, presencesPath);
    });

    const handleBeforeUnload = () => {
      deleteDoc(presenceDoc).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      deleteDoc(presenceDoc).catch(() => {});
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribe();
    };
  }, [pageId, user, profile]);

  useEffect(() => {
    if (!pageId || pageId === 'null') return;
    const unsub = onSnapshot(doc(db, 'pages', pageId), (s) => {
      if (s.exists()) {
        const data = s.data() as PageMetadata;
        
        // If not owner and not published, redirect
        if (user && data.ownerId !== user.uid && !data.isPublished) {
          toast.error("You don't have permission to view this page.");
          navigate('/dashboard');
          return;
        }

        if (data.isArchived && !deletedRef.current) {
          deletedRef.current = true;
          toast.error("This page has been archived.");
          navigate('/dashboard');
          return;
        }
        setPage({ id: s.id, ...data } as PageMetadata);
      } else if (!deletedRef.current) {
        // Only error if we actually had a reason to expect it existed
        if (user || pageId.length > 5) {
          deletedRef.current = true;
          toast.error("This page was not found or was deleted.");
          navigate('/dashboard');
        }
      }
    }, (error) => {
      if (!user && error.message.includes('permission')) {
        console.warn("Guest access restricted by rules");
      } else {
        handleFirestoreError(error, OperationType.GET, `pages/${pageId}`);
      }
    });
    return () => unsub();
  }, [pageId, user]);

  const updateTitle = async (e: React.FocusEvent<HTMLHeadingElement>) => {
    const newTitle = e.target.innerText;
    if (newTitle === page?.title || !pageId) return;
    try {
      const docRef = doc(db, 'pages', pageId);
      await updateDoc(docRef, { title: newTitle, updatedAt: serverTimestamp() });
      toast.success("Title updated", { duration: 1000 });
    } catch (error) {
      toast.error("Failed to update title");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        editor.chain().focus().setImage({ src: result }).run();
      };
      reader.readAsDataURL(file);
    }
  };
  const sharePage = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setShowQRCode(true);
    toast.success("Share link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const saveVersion = async () => {
    if (!editor || !pageId || !user || !page) return;
    setIsSavingVersion(true);
    try {
      const content = Y.encodeStateAsUpdate(ydoc);
      await addDoc(collection(db, `pages/${pageId}/versions`), {
        content: Array.from(content),
        timestamp: serverTimestamp(),
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'User'
      });
      toast.success("Version saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save version");
    } finally {
      setIsSavingVersion(false);
    }
  };

  const loadVersions = async () => {
    if (!pageId) return;
    try {
      const q = query(
        collection(db, `pages/${pageId}/versions`),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const s = await getDocs(q);
      setVersions(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
    }
  };

  const restoreVersion = (versionContent: number[]) => {
    if (!editor) return;
    try {
      const update = new Uint8Array(versionContent);
      Y.applyUpdate(ydoc, update, 'restore');
      toast.success("Version restored");
      setShowHistory(false);
    } catch (error) {
      toast.error("Failed to restore version");
    }
  };

  useEffect(() => {
    if (showHistory) loadVersions();
  }, [showHistory]);

  useEffect(() => {
    const handleOpenHistory = () => setShowHistory(true);
    window.addEventListener('editor-open-history', handleOpenHistory);
    return () => window.removeEventListener('editor-open-history', handleOpenHistory);
  }, []);

  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const togglePublicStatus = async () => {
    if (!pageId || !page || page.ownerId !== user?.uid) return;
    try {
      await updateDoc(doc(db, 'pages', pageId), { 
        isPublished: !page.isPublished,
        updatedAt: serverTimestamp() 
      });
      toast.success(page.isPublished ? "Page is now private" : "Page is now public");
      setShowPrivacyDialog(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `pages/${pageId}`);
    }
  };

  const renderToolbarContent = () => (
    <div className="flex items-center gap-1 py-1 px-1 flex-nowrap whitespace-nowrap min-w-max">
      <div className="flex items-center gap-1 pr-2 border-r border-neutral-100 dark:border-neutral-800 shrink-0">
        <button 
          onClick={() => editor?.chain().focus().undo().run()} 
          disabled={!editor?.can().undo()}
          className="p-1.5 rounded transition-all text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().redo().run()} 
          disabled={!editor?.can().redo()}
          className="p-1.5 rounded transition-all text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-neutral-100 dark:border-neutral-800 shrink-0">
        <button 
          onClick={() => editor?.chain().focus().toggleBold().run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('bold') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleItalic().run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('italic') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleUnderline().run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('underline') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleStrike().run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('strike') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-neutral-100 dark:border-neutral-800 shrink-0">
        <button 
          onClick={() => editor?.chain().focus().setTextAlign('left').run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive({ textAlign: 'left' }) ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().setTextAlign('center').run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive({ textAlign: 'center' }) ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().setTextAlign('right').run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive({ textAlign: 'right' }) ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-neutral-100 dark:border-neutral-800 shrink-0">
         <button 
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('heading', { level: 1 }) ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('heading', { level: 2 }) ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-neutral-100 dark:border-neutral-800 shrink-0">
        <button 
          onClick={() => editor?.chain().focus().toggleBulletList().run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('bulletList') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleOrderedList().run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('orderedList') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleTaskList().run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('taskList') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Task List"
        >
          <CheckSquare size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-neutral-100 dark:border-neutral-800 shrink-0">
        <button 
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('codeBlock') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Code Block"
        >
          <CodeIcon size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleBlockquote().run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('blockquote') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Quote"
        >
          <Quote size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-neutral-100 dark:border-neutral-800 shrink-0">
        <button 
          onClick={() => editor?.chain().focus().toggleSubscript().run()} 
          className={cn("p-1.5 rounded transition-all font-bold", editor?.isActive('subscript') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Subscript"
        >
          <span className="text-sm">T₂</span>
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleSuperscript().run()} 
          className={cn("p-1.5 rounded transition-all font-bold", editor?.isActive('superscript') ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Superscript"
        >
          <span className="text-sm">T²</span>
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleHighlight().run()} 
          className={cn("p-1.5 rounded transition-all", editor?.isActive('highlight') ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Highlight"
        >
          <Highlighter size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 shrink-0">
        <button 
          onClick={() => {
            const url = window.prompt('Enter URL');
            if (url) editor?.chain().focus().setLink({ href: url }).run();
          }}
          className={cn("p-1.5 rounded transition-all", editor?.isActive('link') ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
          title="Add Link"
        >
          <LinkIcon size={16} />
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="p-1.5 rounded text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          title="Upload Image"
        >
          <ImageIcon size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
          className="p-1.5 rounded text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          title="Insert Table"
        >
          <TableIcon size={16} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} 
          className="p-1.5 rounded text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          title="Clear Formatting"
        >
          <Type size={16} className="opacity-50" />
        </button>
      </div>

      {editor?.isActive('table') && (
        <div className="flex items-center gap-0.5 pl-2 border-l border-neutral-100 dark:border-neutral-800 px-1">
           <button onClick={() => editor?.chain().focus().addColumnAfter().run()} className="p-1 px-2 text-[10px] bg-neutral-100 dark:bg-neutral-800 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">Col+</button>
           <button onClick={() => editor?.chain().focus().deleteColumn().run()} className="p-1 px-2 text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Col-</button>
           <button onClick={() => editor?.chain().focus().addRowAfter().run()} className="p-1 px-2 text-[10px] bg-neutral-100 dark:bg-neutral-800 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">Row+</button>
           <button onClick={() => editor?.chain().focus().deleteRow().run()} className="p-1 px-2 text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Row-</button>
           <button onClick={() => editor?.chain().focus().deleteTable().run()} className="p-1 px-2 text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"><Trash2 size={10} /></button>
        </div>
      )}
    </div>
  );

  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const progress = (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;
    setScrollProgress(progress);
  };

  const toolbarSlotId = toolbarPosition === 'top' ? 'editor-toolbar-slot' : 'editor-toolbar-slot-bottom';

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col min-w-0 bg-white dark:bg-[#191919] transition-colors duration-300 overflow-hidden relative">
      <div 
        className="absolute top-0 left-0 h-0.5 bg-blue-500 z-[60] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />
      
      <AnimatePresence>
        {saveStatus === 'saving' && (
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-green-500 z-[65] origin-left pointer-events-none"
          />
        )}
      </AnimatePresence>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {editor && document.getElementById(toolbarSlotId) && createPortal(
        renderToolbarContent(),
        document.getElementById(toolbarSlotId)!
      )}

      {document.getElementById('editor-actions-slot') && createPortal(
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-2">
            <AnimatePresence>
              {presences.map((p) => (
                <motion.div
                  key={p.uid}
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  title={p.displayName || 'Collaborator'}
                >
                  <UserAvatar 
                    photoURL={p.photoURL} 
                    displayName={p.displayName} 
                    avatarSeed={p.avatarSeed}
                    size={24}
                    className="border-2 border-white dark:border-neutral-900 shadow-sm"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1.5 h-7">
            {page?.ownerId === user?.uid && (
              <>
                <button 
                  onClick={() => setShowHistory(true)} 
                  className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors h-full"
                  title="Version History"
                >
                  <History size={14} />
                </button>
                <button 
                  onClick={triggerManualSave}
                  disabled={isSavingVersion || (saveStatus === 'saving')}
                  className={cn(
                    "p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-all h-full relative",
                    saveStatus === 'saved' && "text-green-500"
                  )}
                  title={autoSave ? "Auto-saving enabled" : "Save Changes"}
                >
                  <AnimatePresence mode="wait">
                    {saveStatus === 'saving' || isSavingVersion ? (
                      <motion.div
                        key="saving"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Loader2 size={14} className="animate-spin" />
                      </motion.div>
                    ) : saveStatus === 'saved' ? (
                      <motion.div
                        key="saved"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Check size={14} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Save size={14} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1" />
                <button 
                  onClick={() => setShowPrivacyDialog(true)} 
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors h-full",
                    page?.isPublished 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 secondary-button"
                  )}
                >
                  {page?.isPublished ? <Check size={10} /> : <AlertCircle size={10} />}
                  <span>{page?.isPublished ? 'Public' : 'Private'}</span>
                </button>
              </>
            )}
            <button 
              onClick={sharePage} 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all h-full active:scale-95 primary-action-button"
            >
              {copied ? <Check size={10} /> : <Share2 size={10} />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>,
        document.getElementById('editor-actions-slot')!
      )}

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onClick={() => {
          if (window.innerWidth < 768) {
            window.dispatchEvent(new CustomEvent('close-sidebar'));
          }
        }}
        className="flex-1 h-full overflow-y-auto custom-scrollbar flex flex-col items-center pt-12 pb-32"
      >
        <div className="w-full max-w-3xl px-12 mt-4 relative z-10" ref={editorContainerRef}>
        {/* Remote Cursors Overlay */}
        {presences.map(p => {
          if (p.cursorPos === undefined) return null;
          const coords = getCursorCoords(p.cursorPos);
          if (!coords) return null;
          return (
            <motion.div 
              key={`cursor-${p.uid}`}
              className="absolute pointer-events-none z-50 flex flex-col items-start transition-all duration-200 ease-out"
              style={{ top: coords.top, left: coords.left }}
            >
              <div className="w-[2px] h-5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <div className="bg-blue-500 text-white text-[9px] px-1 py-0.5 rounded-sm whitespace-nowrap -mt-6 opacity-80 backdrop-blur-sm">
                {p.displayName || 'Guest'}
              </div>
            </motion.div>
          );
        })}

        <div className="flex items-center gap-4 mb-4">
          <UserAvatar 
            photoURL={page?.ownerId === user?.uid ? profile?.photoURL : null} 
            displayName={page?.ownerId === user?.uid ? profile?.displayName : 'Page Owner'} 
            avatarSeed={page?.ownerId === user?.uid ? profile?.avatarSeed : 'owner'}
            size={48}
            className="rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800"
          />
          <div className="flex flex-col">
            <span className="text-xs text-neutral-400 font-medium">Page Title</span>
            <h1 contentEditable suppressContentEditableWarning onBlur={updateTitle} className="text-4xl font-bold text-neutral-900 dark:text-neutral-50 focus:outline-none empty:before:content-['Untitled'] tracking-tight transition-colors duration-300">
              {page?.title}
            </h1>
          </div>
        </div>

        {editor && showBubbleMenu && (
          <BubbleMenu 
            editor={editor} 
            tippyOptions={{ duration: 100 }}
            shouldShow={({ state }) => {
              const { selection } = state;
              const { empty } = selection;
              return !empty;
            }}
          >
            <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl p-1 animate-in fade-in zoom-in duration-200">
              <button onClick={() => editor.chain().focus().toggleBold().run()} className={cn("p-1.5 rounded", editor.isActive('bold') ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800")}>
                <Bold size={14} />
              </button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("p-1.5 rounded", editor.isActive('italic') ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800")}>
                <Italic size={14} />
              </button>
              <button onClick={() => editor.chain().focus().toggleLink({ href: '' }).run()} className={cn("p-1.5 rounded", editor.isActive('link') ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-800")}>
                <LinkIcon size={14} />
              </button>
              <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1" />
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn("p-1.5 rounded", editor.isActive('heading', { level: 1 }) ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800")}>
                <Heading1 size={14} />
              </button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("p-1.5 rounded", editor.isActive('heading', { level: 2 }) ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800")}>
                <Heading2 size={14} />
              </button>
              <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1" />
              <button onClick={() => editor.chain().focus().setColor('#ef4444').run()} className="p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Red">
                <div className="w-3 h-3 rounded-full bg-red-500" />
              </button>
              <button onClick={() => editor.chain().focus().setColor('#3b82f6').run()} className="p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Blue">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              </button>
              <button onClick={() => editor.chain().focus().unsetColor().run()} className="p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Clear Color">
                <X size={14} className="opacity-50" />
              </button>
            </div>
          </BubbleMenu>
        )}

        {editor && showFloatingMenu && (
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl p-1 animate-in fade-in zoom-in duration-200 ml-[-40px]">
              <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Bullet List">
                <List size={14} />
              </button>
              <button onClick={() => editor.chain().focus().toggleTaskList().run()} className="p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Task List">
                <CheckSquare size={14} />
              </button>
              <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Code Block">
                <CodeIcon size={14} />
              </button>
            </div>
          </FloatingMenu>
        )}

        <EditorContent editor={editor} />
      </div>
    </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-[#191919] border-l border-neutral-200 dark:border-neutral-800 z-[110] shadow-2xl flex flex-col font-sans"
          >
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <History size={18} />
                History
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-2">
                  <RotateCcw size={32} className="opacity-20" />
                  <p className="text-sm">No versions saved yet.</p>
                </div>
              ) : versions.map((v) => (
                <div key={v.id} className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 bg-neutral-50/50 dark:bg-neutral-900/50 group transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {v.userName}
                    </span>
                    <button 
                      onClick={() => restoreVersion(v.content)}
                      className="text-[10px] uppercase font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Restore
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    {v.timestamp?.toMillis ? new Date(v.timestamp.toMillis()).toLocaleString() : 'Just now'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowQRCode(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-2xl relative max-w-xs w-full flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowQRCode(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="w-full text-center space-y-2">
                <h3 className="text-xl font-bold dark:text-white">Share Page</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Scan this code to join in real-time</p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-inner border border-neutral-100">
                <QRCodeSVG 
                  value={window.location.href} 
                  size={180} 
                  includeMargin={true}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <div className="w-full grid grid-cols-1 gap-2">
                <button 
                  onClick={sharePage}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {copied ? <Check size={18} /> : <Share2 size={18} />}
                  {copied ? 'Link Copied!' : 'Copy Share Link'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showPrivacyDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPrivacyDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-2xl relative max-w-sm w-full flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold dark:text-white">
                  {page?.isPublished ? 'Make Private?' : 'Make Public?'}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {page?.isPublished 
                    ? "Only you and those you explicitly invite will be able to see this note." 
                    : "Anyone with the link will be able to view this note. Collaborative editing still requires authorization."}
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setShowPrivacyDialog(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={togglePublicStatus}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl font-medium text-white transition-opacity hover:opacity-90",
                    page?.isPublished ? "bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white" : "bg-blue-600"
                  )}
                >
                  {page?.isPublished ? 'Make Private' : 'Make Public'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
