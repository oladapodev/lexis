import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Share2, Users } from "lucide-react";
import * as Y from "yjs";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../lib/AuthWrapper";
import { cn } from "../lib/utils";
import { PageMetadata } from "../types";
import { UserAvatar } from "./UserAvatar";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

interface EditorProps {
  pageId: string;
}

interface Presence {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  avatarSeed?: string | null;
  lastActive?: any;
  cursorPos?: number;
}

export const Editor: React.FC<EditorProps> = ({ pageId }) => {
  const { user, profile, toolbarPosition } = useAuth();
  const navigate = useNavigate();

  const [toolbarContainer, setToolbarContainer] = useState<HTMLElement | null>(
    null,
  );
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(null);
  const [page, setPage] = useState<PageMetadata | null>(null);
  const [title, setTitle] = useState("Untitled");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "saved",
  );
  const [copied, setCopied] = useState(false);
  const [presences, setPresences] = useState<Presence[]>([]);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<PageMetadata | null>(null);
  const cursorRef = useRef<number>(0);
  const lastCursorPushRef = useRef(0);
  const initialStateAppliedRef = useRef(false);
  const lastSnapshotPersistRef = useRef(0);
  const sessionClientId = useMemo(
    () => Math.floor(Math.random() * 1_000_000).toString(),
    [],
  );
  const ydoc = useMemo(() => new Y.Doc(), [pageId]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    initialStateAppliedRef.current = false;
    lastSnapshotPersistRef.current = 0;
  }, [pageId]);

  useEffect(() => {
    const slotId =
      toolbarPosition === "top"
        ? "editor-toolbar-slot"
        : "editor-toolbar-slot-bottom";
    setToolbarContainer(document.getElementById(slotId));
  }, [toolbarPosition, pageId]);

  useEffect(() => {
    if (!pageId || pageId === "null" || !user) {
      setPage(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setPage(null);
    const pagePath = `pages/${pageId}`;
    const unsubscribe = onSnapshot(
      doc(db, pagePath),
      (snapshot) => {
        setLoading(false);
        if (!snapshot.exists()) {
          setPage(null);
          navigate("/dashboard");
          return;
        }

        const pageData = { id: snapshot.id, ...snapshot.data() } as PageMetadata;
        if (pageData.ownerId !== user.uid && !pageData.isPublished) {
          setPage(null);
          navigate("/dashboard");
          return;
        }

        if (pageData.isArchived) {
          setPage(null);
          navigate("/dashboard");
          return;
        }

        setPage(pageData);
        setTitle(pageData.title || "Untitled");
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, pagePath);
      },
    );

    return () => unsubscribe();
  }, [pageId, user, navigate]);

  useEffect(() => {
    if (!pageId || !user || !page || page.id !== pageId) return;

    setSyncing(true);
    const updatesCollection = collection(db, `pages/${pageId}/updates`);
    let updateBuffer: Uint8Array[] = [];
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let initialized = false;
    let seq = 0;

    const fallbackState = (page as any).yState;
    if (!initialStateAppliedRef.current && Array.isArray(fallbackState) && fallbackState.length > 0) {
      Y.applyUpdate(ydoc, new Uint8Array(fallbackState), "remote");
      initialStateAppliedRef.current = true;
    }

    const flushBuffer = () => {
      if (!user || updateBuffer.length === 0) return;
      const currentPage = pageRef.current;
      if (!currentPage) return;

      const merged = Y.mergeUpdates(updateBuffer);
      updateBuffer = [];
      setSaveStatus("saving");

      addDoc(updatesCollection, {
        update: Array.from(merged),
        timestamp: serverTimestamp(),
        seq: Date.now() * 1000 + ++seq,
        userId: user.uid,
        clientId: sessionClientId,
        ownerId: currentPage.ownerId,
        isPublished: currentPage.isPublished,
      })
        .then(() => {
          setSaveStatus("saved");
          const now = Date.now();
          if (now - lastSnapshotPersistRef.current < 1200) return;
          lastSnapshotPersistRef.current = now;
          updateDoc(doc(db, "pages", pageId), {
            yState: Array.from(Y.encodeStateAsUpdate(ydoc)),
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        })
        .catch(() => setSaveStatus("idle"));
    };

    const onLocalUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === "remote" || !initialized) return;
      updateBuffer.push(update);
      setSaveStatus("idle");

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        flushBuffer();
        timeout = null;
      }, 25);
    };

    ydoc.on("update", onLocalUpdate);

    const updatesQuery = query(updatesCollection, orderBy("seq", "asc"));

    const unsubscribe = onSnapshot(
      updatesQuery,
      (snapshot) => {
        if (!initialized) {
          initialized = true;
          setSyncing(false);
          if (!initialStateAppliedRef.current) {
            initialStateAppliedRef.current = true;
          }
        }

        ydoc.transact(() => {
          snapshot.docChanges().forEach((change) => {
            if (change.type !== "added") return;
            const data = change.doc.data();
            if (data.clientId === sessionClientId) return;

            const update =
              data.update instanceof Uint8Array
                ? data.update
                : new Uint8Array(data.update);
            Y.applyUpdate(ydoc, update, "remote");
          });
        }, "remote");
      },
      (error) => {
        setSyncing(false);
        handleFirestoreError(error, OperationType.LIST, `pages/${pageId}/updates`);
      },
    );

    const forceSync = () => flushBuffer();
    window.addEventListener("sonar-force-sync", forceSync);

    return () => {
      window.removeEventListener("sonar-force-sync", forceSync);
      ydoc.off("update", onLocalUpdate);
      if (timeout) {
        clearTimeout(timeout);
        flushBuffer();
      }
      unsubscribe();
    };
  }, [pageId, user, page, ydoc, sessionClientId]);

  useEffect(() => {
    if (!pageId || !user || !page) return;

    const presenceRef = doc(db, `pages/${pageId}/presences`, user.uid);
    const displayName =
      profile?.displayName ||
      user.displayName ||
      (user.isAnonymous ? "Guest" : "User");

    const publishPresence = (cursorPos?: number) =>
      setDoc(
        presenceRef,
        {
          uid: user.uid,
          displayName,
          photoURL: profile?.photoURL || user.photoURL,
          avatarSeed: profile?.avatarSeed || `avataaars:${user.uid}`,
          ownerId: page.ownerId,
          isPublished: page.isPublished,
          cursorPos,
          lastActive: serverTimestamp(),
        },
        { merge: true },
      ).catch(() => {});

    publishPresence(cursorRef.current);
    const heartbeat = setInterval(() => publishPresence(cursorRef.current), 15000);

    const unsubscribe = onSnapshot(
      collection(db, `pages/${pageId}/presences`),
      (snapshot) => {
        const now = Date.now();
        const remote = snapshot.docs
          .map((docSnapshot) => docSnapshot.data() as Presence)
          .filter((presence) => {
            if (presence.uid === user.uid) return false;
            if (!presence.lastActive) return true;
            const activeAt = presence.lastActive.toMillis?.() || presence.lastActive;
            return now - activeAt < 120000;
          });
        setPresences(remote);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          `pages/${pageId}/presences`,
        );
      },
    );

    const cleanupPresence = () => deleteDoc(presenceRef).catch(() => {});
    window.addEventListener("beforeunload", cleanupPresence);

    return () => {
      window.removeEventListener("beforeunload", cleanupPresence);
      clearInterval(heartbeat);
      cleanupPresence();
      unsubscribe();
    };
  }, [pageId, user, page, profile]);

  const sharePage = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onCursorMove = (pos: number) => {
    cursorRef.current = pos;
    if (!user || !page) return;
    const now = Date.now();
    if (now - lastCursorPushRef.current < 40) return;
    lastCursorPushRef.current = now;

    setDoc(
      doc(db, `pages/${pageId}/presences`, user.uid),
      {
        cursorPos: pos,
        lastActive: serverTimestamp(),
      },
      { merge: true },
    ).catch(() => {});
  };

  const updateTitle = async (nextTitle: string) => {
    const normalized = nextTitle.trim() || "Untitled";
    setTitle(normalized);
    if (!page || normalized === page.title) return;

    await updateDoc(doc(db, "pages", pageId), {
      title: normalized,
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  };

  const getCursorCoords = (pos: number) => {
    if (!editorInstance?.view || !editorContainerRef.current) return null;
    try {
      const maxPos = Math.max(1, editorInstance.state.doc.content.size);
      const safePos = Math.min(Math.max(pos, 1), maxPos);
      const coords = editorInstance.view.coordsAtPos(safePos);
      const rect = editorContainerRef.current.getBoundingClientRect();
      const scrollParent = editorContainerRef.current;
      return {
        top: coords.top - rect.top + scrollParent.scrollTop,
        left: coords.left - rect.left,
      };
    } catch {
      return null;
    }
  };

  if (!pageId || pageId === "null" || pageId === "") {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#191919]">
        <Loader2
          className="animate-spin text-neutral-300 dark:text-neutral-700"
          size={32}
          strokeWidth={1.5}
        />
      </div>
    );
  }

  const actionsSlot = document.getElementById("editor-actions-slot");

  return (
    <>
      {actionsSlot &&
        createPortal(
          <div className="flex items-center gap-2 h-7">
            <div className="flex items-center gap-1 px-2 h-full rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
              <Users size={11} />
              <span>{presences.length > 0 ? `${presences.length + 1} live` : "Solo"}</span>
            </div>
            <div className="flex -space-x-2 mr-1">
              {presences.slice(0, 4).map((presence) => (
                <UserAvatar
                  key={presence.uid}
                  uid={presence.uid}
                  photoURL={presence.photoURL}
                  displayName={presence.displayName}
                  avatarSeed={presence.avatarSeed || undefined}
                  size={20}
                  className="ring-2 ring-white dark:ring-neutral-900"
                />
              ))}
            </div>
            <button
              className={cn(
                "p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-all h-full",
                saveStatus === "saved" && "text-green-500",
              )}
              title={saveStatus === "saving" ? "Syncing..." : "Synced"}
            >
              {saveStatus === "saving" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
            </button>
            <button
              onClick={sharePage}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all h-full active:scale-95 primary-action-button"
            >
              {copied ? <Check size={10} /> : <Share2 size={10} />}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>
          </div>,
          actionsSlot,
        )}

      <div
        className="flex-1 h-full overflow-y-auto custom-scrollbar relative z-0"
        onClick={() => {
          if (window.innerWidth < 768) {
            window.dispatchEvent(new CustomEvent("close-sidebar"));
          }
        }}
      >
        <div className="w-full max-w-3xl mx-auto px-12 mt-2 pb-28">
          {(loading || syncing) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <Loader2
                className="animate-spin text-neutral-300 dark:text-neutral-700"
                size={32}
                strokeWidth={1.5}
              />
            </div>
          )}

          <h1
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => setTitle(event.currentTarget.innerText)}
            onBlur={(event) => updateTitle(event.currentTarget.innerText)}
            className={cn(
              "text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 focus:outline-none",
              "tracking-tighter leading-tight mb-6 transition-colors duration-300",
            )}
          >
            {title}
          </h1>

          <div className="relative" ref={editorContainerRef}>
            {presences.map((presence) => {
              if (presence.cursorPos === undefined) return null;
              const coords = getCursorCoords(presence.cursorPos);
              if (!coords) return null;

              return (
                <div
                  key={`cursor-${presence.uid}`}
                  className="absolute pointer-events-none z-50 flex flex-col items-start"
                  style={{ top: coords.top, left: coords.left }}
                >
                  <div className="w-[2px] h-5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <div className="bg-blue-500 text-white text-[9px] px-1 py-0.5 rounded-sm whitespace-nowrap -mt-6 opacity-80">
                    {presence.displayName || "Guest"}
                  </div>
                </div>
              );
            })}

            <SimpleEditor
              key={pageId}
              pageId={pageId}
              ydoc={ydoc}
              toolbarContainer={toolbarContainer}
              onSelectionChange={onCursorMove}
              onEditorReady={setEditorInstance}
            />
          </div>
        </div>
      </div>
    </>
  );
};
