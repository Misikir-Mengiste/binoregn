"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { richTextClass } from "@/components/rich-text";

const COLORS = [
  "#1e1b2e",
  "#4bbcd4",
  "#1e3a5f",
  "#dc2626",
  "#16a34a",
  "#7c3aed",
  "#6b7280",
];

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialised = useRef(false);

  // Seed the initial HTML once — after that the div is uncontrolled so the
  // caret doesn't jump on each keystroke.
  useEffect(() => {
    if (initialised.current) return;
    if (editorRef.current) {
      editorRef.current.innerHTML = value || "";
      initialised.current = true;
    }
  }, [value]);

  function sync() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  function exec(command: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    sync();
  }

  function heading(tag: "H2" | "H3") {
    exec("formatBlock", tag);
  }

  function addLink() {
    const url = window.prompt("Link URL", "https://");
    if (url) exec("createLink", url);
  }

  function clearContent() {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      sync();
    }
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-100 p-2">
        <ToolButton onClick={() => exec("undo")} label="Undo">
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("redo")} label="Redo">
          <Redo2 className="h-4 w-4" />
        </ToolButton>
        <Divider />
        <ToolButton onClick={() => heading("H2")} label="Heading 2">
          <span className="text-xs font-bold">H2</span>
        </ToolButton>
        <ToolButton onClick={() => heading("H3")} label="Heading 3">
          <span className="text-xs font-bold">H3</span>
        </ToolButton>
        <Divider />
        <ToolButton onClick={() => exec("bold")} label="Bold">
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("italic")} label="Italic">
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("underline")} label="Underline">
          <Underline className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("strikeThrough")} label="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolButton>
        <Divider />
        <ToolButton
          onClick={() => exec("insertUnorderedList")}
          label="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onClick={() => exec("insertOrderedList")}
          label="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          onClick={() => exec("formatBlock", "BLOCKQUOTE")}
          label="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolButton>
        <Divider />
        <ToolButton onClick={() => exec("justifyLeft")} label="Align left">
          <AlignLeft className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("justifyCenter")} label="Align center">
          <AlignCenter className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("justifyRight")} label="Align right">
          <AlignRight className="h-4 w-4" />
        </ToolButton>
        <Divider />
        <ToolButton onClick={addLink} label="Insert link">
          <Link2 className="h-4 w-4" />
        </ToolButton>

        {/* Colours + clear */}
        <div className="mt-1 flex w-full items-center gap-1.5">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Text colour ${color}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => exec("foreColor", color)}
              className="h-6 w-6 rounded-full border border-black/10"
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => exec("removeFormat")}
            className="rounded-[8px] border border-border bg-card px-2 py-1 text-xs font-medium text-ink-600 hover:bg-surface-100"
          >
            clear
          </button>
          <Divider />
          <ToolButton onClick={clearContent} label="Clear all">
            <X className="h-4 w-4" />
          </ToolButton>
        </div>
      </div>

      {/* Editable surface */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        role="textbox"
        aria-multiline="true"
        aria-label="Product description"
        className={cn(
          richTextClass,
          "min-h-[180px] px-4 py-3 outline-none",
          "empty:before:text-ink-400 empty:before:content-[attr(data-placeholder)]",
        )}
        data-placeholder="Write the product description…"
      />
    </div>
  );
}

function ToolButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex h-8 min-w-8 items-center justify-center rounded-[8px] px-1.5 text-ink-600 transition-colors hover:bg-card"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-border" />;
}
