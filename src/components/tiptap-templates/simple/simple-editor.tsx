"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import { createPortal } from "react-dom"
import type { Editor as TiptapEditor, JSONContent } from "@tiptap/core"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Link } from "@tiptap/extension-link"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableCell } from "@tiptap/extension-table-cell"
import { CharacterCount } from "@tiptap/extension-character-count"
import { Focus } from "@tiptap/extension-focus"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { Collaboration } from "@tiptap/extension-collaboration"
import { FileHandler } from "@tiptap/extension-file-handler"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { Selection } from "@tiptap/extensions"
import { common, createLowlight } from "lowlight"
import type { Doc as YDoc } from "yjs"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"
import { Markdown } from "tiptap-markdown"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import content from "@/components/tiptap-templates/simple/data/content.json"

const lowlight = createLowlight(common)
const TEXT_LIKE_TYPES = [
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/json",
  "application/xml",
  "text/xml",
]

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

interface SimpleEditorProps {
  pageId: string
  toolbarContainer?: HTMLElement | null
  ydoc?: YDoc
  initialContent?: JSONContent
  onSelectionChange?: (position: number) => void
  onLocalContentChange?: (content: JSONContent) => void
  onEditorReady?: (editor: TiptapEditor | null) => void
}

export function SimpleEditor({
  pageId,
  toolbarContainer,
  ydoc,
  initialContent,
  onSelectionChange,
  onLocalContentChange,
  onEditorReady,
}: SimpleEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
  const lastReadyEditorRef = useRef<TiptapEditor | null>(null)
  const onSelectionChangeRef = useRef(onSelectionChange)
  const onLocalContentChangeRef = useRef(onLocalContentChange)
  const localStorageKey = `lexis:editor-content:${pageId}`

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  useEffect(() => {
    onLocalContentChangeRef.current = onLocalContentChange
  }, [onLocalContentChange])

  const localStoredContent = useMemo(() => {
    if (typeof window === "undefined") {
      return content
    }

    const storedContent = localStorage.getItem(localStorageKey)
    if (!storedContent) {
      return content
    }

    try {
      return JSON.parse(storedContent)
    } catch {
      return content
    }
  }, [localStorageKey])

  const resolvedInitialContent = initialContent ?? localStoredContent

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        undoRedo: ydoc ? false : {},
        horizontalRule: false,
        link: false,
        codeBlock: false,
        dropcursor: false,
        gapcursor: false,
        hardBreak: false,
      }),
      Placeholder.configure({
        placeholder: "Start typing...",
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      Link.configure({
        openOnClick: false,
        enableClickSelection: true,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
      }),
      HorizontalRule,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
      CharacterCount,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Selection,
      ...(ydoc
        ? [
            Collaboration.configure({
              document: ydoc,
            }),
          ]
        : []),
      FileHandler.configure({
        onDrop: (editor, files, pos) => {
          files.forEach(async (file) => {
            if (file.type.startsWith("image/")) {
              try {
                const src = await handleImageUpload(file)
                editor.chain().focus().insertContentAt(pos, { type: "image", attrs: { src } }).run()
              } catch (error) {
                console.error("Image drop failed:", error)
              }
              return
            }

            if (TEXT_LIKE_TYPES.includes(file.type) || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
              const text = await file.text()
              if (!text.trim()) return
              editor.chain().focus().insertContent(`\n${text}\n`).run()
            }
          })
        },
        onPaste: (editor, files) => {
          files.forEach(async (file) => {
            if (file.type.startsWith("image/")) {
              try {
                const src = await handleImageUpload(file)
                editor.chain().focus().setImage({ src }).run()
              } catch (error) {
                console.error("Image paste failed:", error)
              }
              return
            }

            if (TEXT_LIKE_TYPES.includes(file.type) || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
              const text = await file.text()
              if (!text.trim()) return
              editor.chain().focus().insertContent(`\n${text}\n`).run()
            }
          })
        },
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    [ydoc]
  )

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions,
    content: ydoc ? undefined : resolvedInitialContent,
    onSelectionUpdate: ({ editor }) => {
      onSelectionChangeRef.current?.(editor.state.selection.from)
    },
    onUpdate: ({ editor }) => {
      onLocalContentChangeRef.current?.(editor.getJSON())
      if (ydoc) {
        return
      }
      if (typeof window === "undefined") {
        return
      }
      localStorage.setItem(localStorageKey, JSON.stringify(editor.getJSON()))
    },
  }, [ydoc, resolvedInitialContent])

  const rect = { y: height }

  useEffect(() => {
    if (lastReadyEditorRef.current === (editor ?? null)) {
      return
    }
    lastReadyEditorRef.current = editor ?? null
    onEditorReady?.(editor ?? null)
  }, [editor, onEditorReady])

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        {toolbarContainer
          ? createPortal(
              <Toolbar
                variant="floating"
                data-plain="true"
                className="lexis-editor-toolbar"
                ref={toolbarRef}
                style={{
                  ...(isMobile
                    ? {
                        bottom: `calc(100% - ${height - rect.y}px)`,
                      }
                    : {}),
                }}
              >
                {mobileView === "main" ? (
                  <MainToolbarContent
                    onHighlighterClick={() => setMobileView("highlighter")}
                    onLinkClick={() => setMobileView("link")}
                    isMobile={isMobile}
                  />
                ) : (
                  <MobileToolbarContent
                    type={mobileView === "highlighter" ? "highlighter" : "link"}
                    onBack={() => setMobileView("main")}
                  />
                )}
              </Toolbar>,
              toolbarContainer
            )
          : (
            <Toolbar
              variant="floating"
              data-plain="true"
              className="lexis-editor-toolbar"
              ref={toolbarRef}
              style={{
                ...(isMobile
                  ? {
                      bottom: `calc(100% - ${height - rect.y}px)`,
                    }
                  : {}),
              }}
            >
              {mobileView === "main" ? (
                <MainToolbarContent
                  onHighlighterClick={() => setMobileView("highlighter")}
                  onLinkClick={() => setMobileView("link")}
                  isMobile={isMobile}
                />
              ) : (
                <MobileToolbarContent
                  type={mobileView === "highlighter" ? "highlighter" : "link"}
                  onBack={() => setMobileView("main")}
                />
              )}
            </Toolbar>
          )}

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}
