"use client"

import { Bold, Italic, List, ListOrdered, Redo2, Undo2 } from "@lib/icons"
import clsx from "clsx"
import { MouseEvent, useEffect, useRef } from "react"

// Converts plain text lines or <p> paragraphs into <ul><li> list items.
export const convertTextToList = (html: string): string => {
  if (!html) return ""
  // If already contains <ul> or <li> tags, just return as is (will be enhanced by enhanceListFormatting)
  if (/<ul|<li/i.test(html)) return html

  // Split on <p>, <br>, or newlines; wrap each non-empty trimmed line as <li>
  const lines = html
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((l) => l.replace(/^[\s\u2022\u00b7*\-]+/, "").trim())
    .filter(Boolean)

  if (lines.length === 0) return html
  return `<ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`
}

export const enhanceListFormatting = (html: string) => {
  if (!html) return ""

  let cleanHtml = html

  // SSR-safe: convert <p> elements with leading bullet chars to rich-list-item divs
  cleanHtml = cleanHtml.replace(
    /<p[^>]*>\s*(?:[•·*]|&bull;|&#8226;)\s*([\s\S]*?)<\/p>/gi,
    (_, content) => {
      const trimmed = content.replace(/<br\s*\/?>/gi, "").trim()
      if (!trimmed) return ""
      return `<div class="rich-list-item"><span class="rich-list-icon"></span><span class="rich-list-content">${trimmed}</span></div>`
    }
  )

  // Catch bare bullet lines not wrapped in <p>
  cleanHtml = cleanHtml.replace(
    /(?:^|(?:(?=<\/div>|<\/p>|<br\s*\/?>)))[\s]*(?:[•·*]|&bull;|&#8226;)\s*([^\n<]{1,500})/gi,
    (match, content) => {
      const trimmed = content.trim()
      if (!trimmed) return match
      return `<div class="rich-list-item"><span class="rich-list-icon"></span><span class="rich-list-content">${trimmed}</span></div>`
    }
  )

  if (typeof window !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(cleanHtml, "text/html")

      // Process <li> elements — wrap each in rich-list-item structure
      const listItems = doc.querySelectorAll("li")
      listItems.forEach((li) => {
        if (!li.querySelector(".rich-list-icon")) {
          let inner = li.innerHTML.trim()
          inner = inner.replace(/^\s*(?:[•·*]|&bull;|&#8226;)\s*/i, "")
          li.innerHTML = `<div class="rich-list-item"><span class="rich-list-icon"></span><span class="rich-list-content">${inner}</span></div>`
          li.style.listStyleType = "none"
        }
      })

      // Strip any remaining bullet at start of content spans
      const contentNodes = doc.querySelectorAll(".rich-list-content")
      contentNodes.forEach((node) => {
        if (/^\s*[•·*]\s*/.test(node.innerHTML)) {
          node.innerHTML = node.innerHTML.replace(/^\s*[•·*]\s*/, "")
        }
      })

      return doc.body.innerHTML
    } catch {
      return cleanHtml
    }
  }

  return cleanHtml
}

export const sanitizeRichTextHtml = (html: string) => {
  if (!html) return ""
  if (typeof window === "undefined") {
    const sansScript = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    return enhanceListFormatting(sansScript)
  }
  const documentNode = new DOMParser().parseFromString(html, "text/html")
  documentNode
    .querySelectorAll("script,style,iframe,object,embed")
    .forEach((node) => node.remove())
  documentNode.querySelectorAll("*").forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()
      if (
        name.startsWith("on") ||
        (name === "href" && value.startsWith("javascript:"))
      ) {
        node.removeAttribute(attribute.name)
      }
    })
  })
  return enhanceListFormatting(documentNode.body.innerHTML)
}

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  label?: string
  placeholder?: string
  minHeight?: number
  className?: string
}

const commands = [
  { command: "bold", label: "Kalın", icon: Bold },
  { command: "italic", label: "İtalik", icon: Italic },
  { command: "insertUnorderedList", label: "Madde işaretli liste", icon: List },
  { command: "insertOrderedList", label: "Numaralı liste", icon: ListOrdered },
  { command: "undo", label: "Geri al", icon: Undo2 },
  { command: "redo", label: "Yinele", icon: Redo2 },
] as const

export default function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = "İçeriği yazın...",
  minHeight = 180,
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const selectionRef = useRef<Range | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = sanitizeRichTextHtml(value)
    }
  }, [value])

  const saveSelection = () => {
    const selection = window.getSelection()
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null
    if (range && editorRef.current?.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange()
    }
  }

  const runCommand = (
    event: MouseEvent<HTMLButtonElement>,
    command: string,
  ) => {
    event.preventDefault()
    editorRef.current?.focus()
    if (selectionRef.current) {
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(selectionRef.current)
    }
    document.execCommand(command)
    saveSelection()
    onChange(sanitizeRichTextHtml(editorRef.current?.innerHTML ?? ""))
  }

  const handleConvertToList = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (!editorRef.current) return
    const currentHtml = editorRef.current.innerHTML
    const converted = convertTextToList(currentHtml)
    const sanitized = sanitizeRichTextHtml(converted)
    editorRef.current.innerHTML = sanitized
    onChange(sanitized)
  }

  return (
    <div className={clsx("space-y-1.5", className)}>
      {label && (
        <span className="block text-ui-sm font-medium text-foreground">
          {label}
        </span>
      )}
      <div className="overflow-hidden rounded-rounded border border-border bg-input focus-within:ring-2 focus-within:ring-ring">
        <div className="flex flex-wrap gap-1 border-b border-border bg-subtle p-2">
          {commands.map(({ command, label: commandLabel, icon: Icon }) => (
            <button
              key={command}
              type="button"
              aria-label={commandLabel}
              title={commandLabel}
              onMouseDown={(event) => runCommand(event, command)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-base text-muted hover:bg-card hover:text-foreground"
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
            </button>
          ))}
          {/* Convert plain text / paragraphs → unordered list with orange icons */}
          <button
            type="button"
            aria-label="Satırları listeye çevir"
            title="Tüm satırları turuncu ikonlu listeye çevir"
            onMouseDown={handleConvertToList}
            className="inline-flex h-8 items-center gap-1 rounded-base px-2 text-[10px] font-semibold text-[#C98484] hover:bg-rose-50 border border-rose-200 hover:border-rose-400 transition-colors ml-1"
          >
            <List aria-hidden="true" className="h-3.5 w-3.5" />
            Listeye Çevir
          </button>
        </div>
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label={label ?? "Zengin metin editörü"}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onFocus={saveSelection}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onInput={(event) => {
            saveSelection()
            onChange(sanitizeRichTextHtml(event.currentTarget.innerHTML))
          }}
          className="prose prose-sm max-w-none overflow-y-auto px-4 py-3 text-foreground outline-none empty:before:pointer-events-none empty:before:text-muted empty:before:content-[attr(data-placeholder)]"
          style={{ minHeight }}
        />
      </div>
    </div>
  )
}
