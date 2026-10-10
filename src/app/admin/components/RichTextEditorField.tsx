"use client"
import AdminTabs from "@components/admin/AdminTabs"

import React, { useRef, useState, useEffect, useMemo } from "react"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Undo,
  Redo,
  Quote,
  Minus,
  Strikethrough,
  Palette,
  Eraser,
  HelpCircle,
  Maximize2,
  Minimize2,
  FileText,
  Sliders,
  Table as TableIcon,
} from "lucide-react"
import MediaSelectorModal from "./MediaSelectorModal"
import { formatProductLabels } from "@lib/util/format-product-labels"

interface RichTextEditorFieldProps {
  label?: string
  value: string
  onChange: (val: string) => void
  rows?: number
  placeholder?: string
  helpText?: string
  minHeight?: number
  boldColonLabels?: boolean
}

const PRESET_COLORS = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#C98484", // Brand Orange
  "#A95E5E",
  "#dc2626", // Red
  "#ea580c", // Orange
  "#d97706", // Amber
  "#16a34a", // Green
  "#0284c7", // Blue
  "#2563eb", // Royal Blue
  "#7c3aed", // Purple
  "#db2777", // Pink
]

const SPECIAL_CHARS = [
  "©", "®", "™", "‰", "§", "¶", "†", "‡", "•", "–", "—",
  "€", "$", "₺", "£", "¥", "°", "±", "×", "÷", "≠", "≤", "≥",
  "∞", "√", "µ", "Ω", "π", "α", "β", "γ", "✓", "✔", "★", "☆", "⚡", "🔥"
]

export function cleanAndFormatHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return ""

  let html = rawHtml

  // 1. Remove tailwind variable CSS injected previously
  html = html.replace(/style="[^"]*--tw-[^"]*"/gi, "")
  html = html.replace(/style='[^']*--tw-[^']*'/gi, "")

  // 2. Remove legacy rich-list-item / rich-list-icon wrapper structures
  html = html.replace(/<span\s+class="rich-list-icon"[^>]*><\/span>/gi, "")
  html = html.replace(/<div\s+class="rich-list-item"[^>]*>([\s\S]*?)<\/div>/gi, "$1")
  html = html.replace(/<span\s+class="rich-list-content"[^>]*>([\s\S]*?)<\/span>/gi, "$1")

  // 3. Remove list-style-type: none from <li> / <ul> if present
  html = html.replace(/style="list-style-type:\s*none;?"/gi, "")
  html = html.replace(/style=""/gi, "")

  // 4. Browser DOMParser based beautiful formatting
  if (typeof window !== "undefined") {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      // Clean up empty spans or useless classes
      doc.body.querySelectorAll("*").forEach((el) => {
        const style = el.getAttribute("style")
        if (style) {
          const cleanedStyle = style
            .replace(/--tw-[^;]+;?/g, "")
            .replace(/list-style-type:\s*none;?/g, "")
            .trim()
          if (!cleanedStyle) {
            el.removeAttribute("style")
          } else {
            el.setAttribute("style", cleanedStyle)
          }
        }
        if (el.getAttribute("class") === "") el.removeAttribute("class")
      })

      function formatElement(node: Node, level: number = 0): string {
        if (node.nodeType === Node.TEXT_NODE) {
          return (node.textContent || "").replace(/\s+/g, " ")
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return ""

        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()
        const indent = "  ".repeat(level)

        // Self closing tags
        if (tag === "hr") return `\n\n${indent}<hr />\n\n`
        if (tag === "br") return `<br />\n${indent}`
        if (tag === "img") {
          let attrs = ""
          for (let i = 0; i < el.attributes.length; i++) {
            attrs += ` ${el.attributes[i].name}="${el.attributes[i].value}"`
          }
          return `\n${indent}<img${attrs} />\n`
        }

        let attrs = ""
        for (let i = 0; i < el.attributes.length; i++) {
          attrs += ` ${el.attributes[i].name}="${el.attributes[i].value}"`
        }

        // Containers with nested child blocks
        if (["ul", "ol", "table", "thead", "tbody", "blockquote"].includes(tag)) {
          let inner = ""
          for (let i = 0; i < el.childNodes.length; i++) {
            const childFormatted = formatElement(el.childNodes[i], level + 1)
            if (childFormatted.trim()) {
              inner += childFormatted
            }
          }
          return `\n\n${indent}<${tag}${attrs}>${inner}\n${indent}</${tag}>\n\n`
        }

        // List item
        if (tag === "li") {
          let inner = ""
          for (let i = 0; i < el.childNodes.length; i++) {
            inner += formatElement(el.childNodes[i], level)
          }
          return `\n${indent}<li${attrs}>${inner.trim()}</li>`
        }

        // Table row
        if (tag === "tr") {
          let inner = ""
          for (let i = 0; i < el.childNodes.length; i++) {
            inner += formatElement(el.childNodes[i], level + 1)
          }
          return `\n${indent}<tr${attrs}>${inner}\n${indent}</tr>`
        }

        // Table header or data cell
        if (tag === "th" || tag === "td") {
          let inner = ""
          for (let i = 0; i < el.childNodes.length; i++) {
            inner += formatElement(el.childNodes[i], level)
          }
          return `\n${indent}<${tag}${attrs}>${inner.trim()}</${tag}>`
        }

        // Block elements like p, h1-h6
        if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "pre", "div"].includes(tag)) {
          let inner = ""
          for (let i = 0; i < el.childNodes.length; i++) {
            inner += formatElement(el.childNodes[i], level)
          }
          const trimmedInner = inner.trim()
          if (!trimmedInner && tag === "p") return ""
          return `\n\n${indent}<${tag}${attrs}>${trimmedInner}</${tag}>\n\n`
        }

        // Inline elements (strong, b, em, i, u, s, a, code, span)
        let inner = ""
        for (let i = 0; i < el.childNodes.length; i++) {
          inner += formatElement(el.childNodes[i], level)
        }
        return `<${tag}${attrs}>${inner}</${tag}>`
      }

      let formatted = ""
      for (let i = 0; i < doc.body.childNodes.length; i++) {
        formatted += formatElement(doc.body.childNodes[i], 0)
      }

      return formatted
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^\s*\n/gm, "")
        .replace(/^\n+/, "")
        .replace(/\n+$/, "")
    } catch (e) {
      console.warn("DOMParser error", e)
    }
  }

  // Regex fallback
  return html
    .replace(/(<\/(?:p|h[1-6]|ul|ol|blockquote|table|pre|div)>)/gi, "$1\n\n")
    .replace(/(<(?:p|h[1-6]|ul|ol|blockquote|table|pre|div)[^>]*>)/gi, "\n$1")
    .replace(/(<li[^>]*>)/gi, "  $1")
    .replace(/(<\/li>)/gi, "$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export default function RichTextEditorField({
  label,
  value,
  onChange,
  rows = 8,
  placeholder = "Detaylı açıklama ve metin girin...",
  helpText,
  minHeight = 220,
  boldColonLabels = false,
}: RichTextEditorFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editableRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<Range | null>(null)

  const [activeTab, setActiveTab] = useState<"visual" | "code">("visual")
  const [showToolbarRow2, setShowToolbarRow2] = useState(true)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isSpecialCharOpen, setIsSpecialCharOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("https://")
  const [linkText, setLinkText] = useState("")

  const [currentFormat, setCurrentFormat] = useState("p")

  // Word count calculation
  const wordCount = useMemo(() => {
    if (!value) return 0
    const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    if (!text) return 0
    return text.split(/\s+/).filter(Boolean).length
  }, [value])

  function saveSelection() {
    if (typeof window === "undefined" || activeTab !== "visual") return
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      if (editableRef.current && editableRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange()
      }
    }
  }

  function restoreSelection() {
    if (typeof window === "undefined" || !savedSelectionRef.current || activeTab !== "visual") return
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(savedSelectionRef.current)
    }
  }

  function updateCurrentFormat() {
    if (typeof window === "undefined" || !editableRef.current) return
    saveSelection()
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return

    let node: Node | null = selection.getRangeAt(0).startContainer
    while (node && node !== editableRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = (node as HTMLElement).tagName.toLowerCase()
        if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"].includes(tagName)) {
          setCurrentFormat(tagName)
          return
        }
      }
      node = node.parentNode
    }
    setCurrentFormat("p")
  }

  useEffect(() => {
    if (activeTab === "visual" && editableRef.current) {
      if (document.activeElement === editableRef.current) return
      const html = boldColonLabels
        ? formatProductLabels(/<[^>]+>/.test(value || "") ? value : (value || "").replace(/\r\n?|\n/g, "<br />"))
        : value || ""
      if (editableRef.current.innerHTML !== html) {
        editableRef.current.innerHTML = html
      }
    }
  }, [value, activeTab, boldColonLabels])

  function updateValue(newValue: string) {
    onChange(newValue)
  }

  function execCommand(command: string, val: string | undefined = undefined) {
    if (activeTab === "visual") {
      restoreSelection()
      if (editableRef.current) {
        editableRef.current.focus()
      }
      document.execCommand(command, false, val)
      if (editableRef.current) {
        updateValue(editableRef.current.innerHTML)
      }
    } else {
      if (command === "bold") insertFormat("<strong>", "</strong>")
      else if (command === "italic") insertFormat("<em>", "</em>")
      else if (command === "underline") insertFormat("<u>", "</u>")
      else if (command === "strikeThrough") insertFormat("<del>", "</del>")
      else if (command === "insertUnorderedList") insertFormat("<ul>\n  <li>", "</li>\n</ul>")
      else if (command === "insertOrderedList") insertFormat("<ol>\n  <li>", "</li>\n</ol>")
      else if (command === "justifyLeft") insertFormat('<p style="text-align: left;">', "</p>")
      else if (command === "justifyCenter") insertFormat('<p style="text-align: center;">', "</p>")
      else if (command === "justifyRight") insertFormat('<p style="text-align: right;">', "</p>")
      else if (command === "justifyFull") insertFormat('<p style="text-align: justify;">', "</p>")
      else if (command === "insertHorizontalRule") insertFormat("\n<hr />\n")
      else if (command === "insertHTML" && val) insertFormat(val)
    }
  }

  function insertFormat(startTag: string, endTag: string = "") {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const replacement = `${startTag}${selectedText || ""}${endTag}`

    const newValue = value.substring(0, start) + replacement + value.substring(end)
    updateValue(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + startTag.length,
        start + startTag.length + selectedText.length
      )
    }, 50)
  }

  function handleHeadingSelect(tag: string) {
    setCurrentFormat(tag)
    if (activeTab === "visual") {
      restoreSelection()
      if (tag === "blockquote") {
        document.execCommand("formatBlock", false, "<blockquote>")
      } else if (tag === "pre") {
        document.execCommand("formatBlock", false, "<pre>")
      } else if (tag === "p") {
        document.execCommand("formatBlock", false, "<p>")
      } else {
        document.execCommand("formatBlock", false, `<${tag}>`)
      }
      if (editableRef.current) {
        updateValue(editableRef.current.innerHTML)
      }
    } else {
      insertFormat(`<${tag}>`, `</${tag}>`)
    }
  }

  function handleInsertLink() {
    if (!linkUrl || linkUrl === "https://") {
      setIsLinkModalOpen(false)
      return
    }

    if (activeTab === "visual") {
      restoreSelection()
      if (linkText) {
        const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
        execCommand("insertHTML", linkHtml)
      } else {
        execCommand("createLink", linkUrl)
      }
    } else {
      const textToUse = linkText || "Bağlantı Metni"
      insertFormat(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${textToUse}</a>`)
    }
    setIsLinkModalOpen(false)
    setLinkUrl("https://")
    setLinkText("")
  }

  function handleInsertTable() {
    const tableHtml = `
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background: #f8fafc;">
      <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: 700;">Özellik</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: 700;">Değer</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Voltaj</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">21V Li-Ion</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Garanti</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">2 Yıl Resmi Garanti</td>
    </tr>
  </tbody>
</table>`
    if (activeTab === "visual") {
      execCommand("insertHTML", tableHtml)
    } else {
      insertFormat(tableHtml)
    }
  }

  function handleInsertForm(formCode: string) {
    if (activeTab === "visual") {
      execCommand("insertHTML", formCode)
    } else {
      insertFormat(formCode)
    }
    setIsFormModalOpen(false)
  }

  function handleVisualInput() {
    saveSelection()
    if (editableRef.current) {
      updateValue(editableRef.current.innerHTML)
    }
  }

  function handleSwitchToCode() {
    const currentHtml = activeTab === "visual" && editableRef.current
      ? editableRef.current.innerHTML
      : value || ""
    const formatted = cleanAndFormatHtml(currentHtml)
    updateValue(formatted)
    setActiveTab("code")
  }

  function handleSwitchToVisual() {
    const currentHtml = textareaRef.current ? textareaRef.current.value : value || ""
    const cleaned = cleanAndFormatHtml(currentHtml)
    updateValue(cleaned)
    setActiveTab("visual")
    if (editableRef.current) {
      editableRef.current.innerHTML = cleaned
    }
  }

  function handleFormatCode() {
    const currentHtml = textareaRef.current ? textareaRef.current.value : value || ""
    const formatted = cleanAndFormatHtml(currentHtml)
    updateValue(formatted)
    if (textareaRef.current) {
      textareaRef.current.value = formatted
    }
  }

  const containerClasses = isFullScreen
    ? "fixed inset-0 z-50 bg-white flex flex-col p-6 overflow-y-auto"
    : "border border-[#dcdcde] rounded-lg overflow-hidden bg-white shadow-2xs focus-within:border-[#2271b1] transition-all"

  return (
    <div className="space-y-1.5 w-full font-sans">
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* ── WordPress Classic Editor Window ── */}
      <div className={containerClasses}>
        
        {/* TOP BAR: Ortam Ekle + Form Ekle + [Görsel] / [Kod] Tabs */}
        <div className="flex flex-wrap items-center justify-between bg-[#f0f0f1] border-b border-[#dcdcde] px-3 pt-2.5 pb-0 select-none">
          
          {/* Action Buttons (Left) */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                saveSelection()
                setIsMediaModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#2271b1] text-[#2271b1] font-bold text-xs rounded hover:bg-[#2271b1] hover:text-white transition-all cursor-pointer shadow-2xs"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Ortam ekle</span>
            </button>

            <button
              type="button"
              onClick={() => {
                saveSelection()
                setIsFormModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Form Ekle</span>
            </button>

            {activeTab === "code" && (
              <button
                type="button"
                onClick={handleFormatCode}
                title="HTML Kodunu Düzenle ve Satır Satır Formatla"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-xs rounded hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-2xs"
              >
                <span>✨ Kodu Formatla (Alt Alta Diz)</span>
              </button>
            )}
          </div>

          {/* Editor Mode Tabs (Right - Classic WordPress Style) */}
          <AdminTabs label="Düzenleyici modu"
            value={activeTab}
            onChange={(value) => value === "visual" ? handleSwitchToVisual() : handleSwitchToCode()}
            items={[{ value: "visual", label: "Görsel" }, { value: "code", label: "Kod" }]}/>
        </div>

        {/* ── TOOLBAR: VISUAL MODE (Classic TinyMCE) ── */}
        {activeTab === "visual" && (
          <>
            <div className="bg-[#f6f7f7] border-b border-[#dcdcde] px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1 text-[#2c3338] select-none">
              <div className="flex flex-wrap items-center gap-0.5 text-xs">
                {/* Format Dropdown */}
                <select
                  value={currentFormat}
                  onChange={(e) => handleHeadingSelect(e.target.value)}
                  className="h-7 px-2 text-xs font-semibold bg-white border border-[#c3c4c7] rounded outline-none cursor-pointer text-[#2c3338] hover:border-[#8c8f94] mr-1"
                >
                  <option value="p">Paragraf</option>
                  <option value="h1">Başlık 1 (H1)</option>
                  <option value="h2">Başlık 2 (H2)</option>
                  <option value="h3">Başlık 3 (H3)</option>
                  <option value="h4">Başlık 4 (H4)</option>
                  <option value="h5">Başlık 5 (H5)</option>
                  <option value="h6">Başlık 6 (H6)</option>
                  <option value="blockquote">Alıntı (Blockquote)</option>
                  <option value="pre">Önceden Biçimlendirilmiş</option>
                </select>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                {/* Bold */}
                <button
                  type="button"
                  onClick={() => execCommand("bold")}
                  title="Kalın (Ctrl+B)"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <Bold className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() => execCommand("italic")}
                  title="İtalik (Ctrl+I)"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <Italic className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>

                {/* Unordered List */}
                <button
                  type="button"
                  onClick={() => execCommand("insertUnorderedList")}
                  title="Madde İşaretli Liste"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <List className="h-3.5 w-3.5" />
                </button>

                {/* Ordered List */}
                <button
                  type="button"
                  onClick={() => execCommand("insertOrderedList")}
                  title="Numaralı Liste"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>

                {/* Blockquote */}
                <button
                  type="button"
                  onClick={() => handleHeadingSelect("blockquote")}
                  title="Alıntı Ekle"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <Quote className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                {/* Align Left */}
                <button
                  type="button"
                  onClick={() => execCommand("justifyLeft")}
                  title="Sola Hizala"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                </button>

                {/* Align Center */}
                <button
                  type="button"
                  onClick={() => execCommand("justifyCenter")}
                  title="Ortala"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <AlignCenter className="h-3.5 w-3.5" />
                </button>

                {/* Align Right */}
                <button
                  type="button"
                  onClick={() => execCommand("justifyRight")}
                  title="Sağa Hizala"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <AlignRight className="h-3.5 w-3.5" />
                </button>

                {/* Align Justify */}
                <button
                  type="button"
                  onClick={() => execCommand("justifyFull")}
                  title="İki Yana Yasla"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <AlignJustify className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                {/* Link */}
                <button
                  type="button"
                  onClick={() => {
                    saveSelection()
                    setIsLinkModalOpen(true)
                  }}
                  title="Bağlantı Ekle (Ctrl+K)"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </button>

                {/* Unlink */}
                <button
                  type="button"
                  onClick={() => execCommand("unlink")}
                  title="Bağlantıyı Kaldır"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <Unlink className="h-3.5 w-3.5" />
                </button>

                {/* Read More Tag */}
                <button
                  type="button"
                  onClick={() => insertFormat("\n<!--more-->\n")}
                  title="Devamını Oku Etiketi Ekle"
                  className="px-1.5 py-0.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] text-[11px] font-bold cursor-pointer"
                >
                  ☵ Devamını Oku
                </button>

                {/* Table */}
                <button
                  type="button"
                  onClick={handleInsertTable}
                  title="Tablo Ekle"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                {/* Toolbar Toggle */}
                <button
                  type="button"
                  onClick={() => setShowToolbarRow2(!showToolbarRow2)}
                  title="Araç Çubuğunu Aç/Kapat"
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    showToolbarRow2 ? "bg-[#dcdcde] text-slate-900" : "hover:bg-[#e0e0e0]"
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Fullscreen Toggle (Far Right) */}
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Tam Ekrandan Çık" : "Tam Ekran Modu"}
                className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
              >
                {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* ── TOOLBAR ROW 2 (Expandable) ── */}
            {showToolbarRow2 && (
              <div className="bg-[#f6f7f7] border-b border-[#dcdcde] px-2.5 py-1 flex flex-wrap items-center gap-1 text-[#2c3338] text-xs select-none">
                {/* Strikethrough */}
                <button
                  type="button"
                  onClick={() => execCommand("strikeThrough")}
                  title="Üstü Çizili (Strikethrough)"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </button>

                {/* Underline */}
                <button
                  type="button"
                  onClick={() => execCommand("underline")}
                  title="Altı Çizili (Ctrl+U)"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                >
                  <Underline className="h-3.5 w-3.5" />
                </button>

                {/* Horizontal Line */}
                <button
                  type="button"
                  onClick={() => execCommand("insertHorizontalRule")}
                  title="Yatay Çizgi Ekle"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>

                {/* Text Color Picker */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                    title="Metin Rengi"
                    className="p-1.5 rounded hover:bg-[#e0e0e0] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Palette className="h-3.5 w-3.5 text-[#C98484]" />
                    <span className="text-[10px] font-bold">▼</span>
                  </button>

                  {isColorPickerOpen && (
                    <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-300 rounded-lg shadow-xl p-2.5 grid grid-cols-7 gap-1.5 w-48">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            execCommand("foreColor", c)
                            setIsColorPickerOpen(false)
                          }}
                          style={{ backgroundColor: c }}
                          className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition cursor-pointer"
                          title={c}
                        />
                      ))}
                      <div className="col-span-7 pt-1 border-t border-slate-100 flex items-center gap-1">
                        <input
                          type="color"
                          onChange={(e) => {
                            execCommand("foreColor", e.target.value)
                            setIsColorPickerOpen(false)
                          }}
                          className="w-full h-6 rounded cursor-pointer"
                          title="Özel Renk Seç"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                {/* Special Characters */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setIsSpecialCharOpen(!isSpecialCharOpen)}
                    title="Özel Karakter Ekle (Omega Ω)"
                    className="px-2 py-1 rounded hover:bg-[#e0e0e0] font-serif font-bold text-xs cursor-pointer"
                  >
                    Ω
                  </button>

                  {isSpecialCharOpen && (
                    <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-300 rounded-lg shadow-xl p-3 grid grid-cols-6 gap-1.5 w-56 text-sm">
                      {SPECIAL_CHARS.map((char) => (
                        <button
                          key={char}
                          type="button"
                          onClick={() => {
                            if (activeTab === "visual") {
                              execCommand("insertHTML", char)
                            } else {
                              insertFormat(char)
                            }
                            setIsSpecialCharOpen(false)
                          }}
                          className="p-1 hover:bg-rose-50 hover:text-[#C98484] rounded font-mono font-bold text-center border border-slate-100 cursor-pointer"
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clear Formatting */}
                <button
                  type="button"
                  onClick={() => execCommand("removeFormat")}
                  title="Biçimlendirmeyi Temizle"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                >
                  <Eraser className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                {/* Outdent */}
                <button
                  type="button"
                  onClick={() => execCommand("outdent")}
                  title="Girintiyi Azalt"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                >
                  <span className="text-[10px] font-extrabold">◀|</span>
                </button>

                {/* Indent */}
                <button
                  type="button"
                  onClick={() => execCommand("indent")}
                  title="Girintiyi Artır"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                >
                  <span className="text-[10px] font-extrabold">|▶</span>
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                {/* Undo */}
                <button
                  type="button"
                  onClick={() => execCommand("undo")}
                  title="Geri Al (Ctrl+Z)"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                >
                  <Undo className="h-3.5 w-3.5" />
                </button>

                {/* Redo */}
                <button
                  type="button"
                  onClick={() => execCommand("redo")}
                  title="Yinele (Ctrl+Y)"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                >
                  <Redo className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                {/* Help */}
                <button
                  type="button"
                  onClick={() => alert("WordPress Klasik Editör Klavye Kısayolları:\n\n• Ctrl + B: Kalın\n• Ctrl + I: İtalik\n• Ctrl + U: Altı Çizili\n• Ctrl + K: Bağlantı Ekle\n• Ctrl + Z: Geri Al\n• Ctrl + Y: Yinele\n• Görsel ve Kod sekmeleri arasında geçiş yapabilirsiniz.")}
                  title="Klavye Kısayolları ve Yardım"
                  className="p-1.5 rounded hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ── TOOLBAR: CODE MODE (WordPress Quicktags) ── */}
        {activeTab === "code" && (
          <div className="bg-[#f6f7f7] border-b border-[#dcdcde] px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1 text-[#2c3338] select-none">
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => insertFormat("<strong>", "</strong>")}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-bold font-mono"
                title="strong (Kalın)"
              >
                b
              </button>
              <button
                type="button"
                onClick={() => insertFormat("<em>", "</em>")}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-italic font-mono italic"
                title="em (İtalik)"
              >
                i
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = prompt("Bağlantı URL Adresi:", "https://")
                  if (url) insertFormat(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, "</a>")
                }}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-mono text-[#2271b1] underline font-bold"
                title="link (Bağlantı)"
              >
                link
              </button>
              <button
                type="button"
                onClick={() => insertFormat("<blockquote>", "</blockquote>")}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-mono"
                title="b-quote (Alıntı)"
              >
                b-quote
              </button>
              <button
                type="button"
                onClick={() => insertFormat("<del>", "</del>")}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-mono line-through"
                title="del (Üstü Çizili)"
              >
                del
              </button>
              <button
                type="button"
                onClick={() => insertFormat("<ul>\n  <li>", "</li>\n</ul>")}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-mono"
                title="ul (Madde İşaretli Liste)"
              >
                ul
              </button>
              <button
                type="button"
                onClick={() => insertFormat("<ol>\n  <li>", "</li>\n</ol>")}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-mono"
                title="ol (Numaralı Liste)"
              >
                ol
              </button>
              <button
                type="button"
                onClick={() => insertFormat("<li>", "</li>")}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-mono"
                title="li (Liste Maddesi)"
              >
                li
              </button>
              <button
                type="button"
                onClick={() => insertFormat("<code>", "</code>")}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-mono text-rose-600"
                title="code (Kod)"
              >
                code
              </button>
              <button
                type="button"
                onClick={() => insertFormat("\n<!--more-->\n")}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-mono font-bold"
                title="more (Devamını Oku)"
              >
                more
              </button>
              <button
                type="button"
                onClick={() => insertFormat("\n<hr />\n")}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-mono"
                title="hr (Yatay Çizgi)"
              >
                hr
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="px-2 py-1 bg-white border border-[#c3c4c7] hover:bg-slate-100 rounded text-xs font-mono"
                title="table (Tablo Ekle)"
              >
                table
              </button>
            </div>

            {/* Fullscreen Toggle (Far Right) */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Tam Ekrandan Çık" : "Tam Ekran Modu"}
              className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#2c3338] transition-colors cursor-pointer"
            >
              {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        {/* ── EDITOR BODY (Visual WYSIWYG vs Code HTML) ── */}
        <div className="relative">
          {activeTab === "visual" ? (
            <div
              ref={editableRef}
              contentEditable
              onInput={() => {
                handleVisualInput()
                updateCurrentFormat()
              }}
              onBlur={() => {
                if (boldColonLabels && editableRef.current) {
                  editableRef.current.innerHTML = formatProductLabels(editableRef.current.innerHTML)
                }
                handleVisualInput()
              }}
              onKeyUp={updateCurrentFormat}
              onMouseUp={updateCurrentFormat}
              onClick={updateCurrentFormat}
              className="wp-editor-content w-full bg-white p-5 text-[#2c3338] leading-relaxed focus:outline-none resize-y overflow-y-auto"
              style={{
                minHeight: isFullScreen ? "calc(100vh - 180px)" : `${Math.max(minHeight, rows * 26)}px`,
              }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              rows={isFullScreen ? 25 : rows}
              value={value}
              onChange={(e) => updateValue(e.target.value)}
              placeholder={placeholder}
              spellCheck={false}
              className="w-full bg-[#0f172a] p-4 text-[13px] font-mono text-[#38bdf8] leading-6 focus:outline-none resize-y border-0 block whitespace-pre-wrap selection:bg-[#1e3a8a] selection:text-white"
              style={{
                minHeight: isFullScreen ? "calc(100vh - 180px)" : `${Math.max(minHeight, rows * 26)}px`,
                tabSize: 2,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              }}
            />
          )}
        </div>

        {/* ── BOTTOM STATUS BAR: Sözcük Sayısı & Resize ── */}
        <div className="bg-[#f6f7f7] border-t border-[#dcdcde] px-3 py-1.5 flex items-center justify-between text-[11px] text-[#646970] select-none">
          <div>
            <span>Sözcük sayısı: <strong>{wordCount}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>{activeTab === "visual" ? "Görsel WYSIWYG Modu" : "HTML Kaynak Kodu"}</span>
          </div>
        </div>
      </div>

      {helpText && <p className="text-[11px] text-slate-500 font-normal mt-1">{helpText}</p>}

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(selectedItems) => {
          if (selectedItems.length > 0) {
            const item = selectedItems[0]
            let insertStr = ""

            if (item.startsWith("/") || item.startsWith("http")) {
              insertStr = `<img src="${item}" alt="Ürün Görseli" style="max-width: 100%; height: auto; display: inline-block; margin: 12px 0; border-radius: 8px;" />`
            } else {
              insertStr = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; background: #fcf7f6; color: #C98484; border: 1px solid #fed7aa; margin-right: 6px;">${item}</span>`
            }

            if (activeTab === "visual") {
              execCommand("insertHTML", insertStr)
            } else {
              insertFormat(insertStr)
            }
          }
          setIsMediaModalOpen(false)
        }}
        multi={false}
      />

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#2271b1]" />
              Bağlantı Ekle / Düzenle
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Adresi</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://www.example.com"
                  className="w-full border border-slate-300 rounded p-2 text-xs outline-none focus:border-[#2271b1]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bağlantı Metni (Opsiyonel)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Tıklayınız..."
                  className="w-full border border-slate-300 rounded p-2 text-xs outline-none focus:border-[#2271b1]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-bold hover:bg-slate-200"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-4 py-1.5 bg-[#2271b1] text-white rounded text-xs font-bold hover:bg-[#135e96]"
              >
                Bağlantıyı Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Selector Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2271b1]" />
              Form Ekle (WordPress Stil)
            </h3>
            <p className="text-xs text-slate-600">
              İçeriğe eklenecek hazır formu seçin:
            </p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => handleInsertForm('<div class="site-form-box" style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; background: #f8fafc; margin: 16px 0;"><h4 style="margin: 0 0 12px 0; font-weight: 700;">📬 İletişim Formu</h4><form style="display: flex; flex-direction: column; gap: 10px;"><input type="text" placeholder="Adınız Soyadınız" style="padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px;" /><input type="email" placeholder="E-Posta Adresiniz" style="padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px;" /><textarea placeholder="Mesajınız..." rows="3" style="padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px;"></textarea><button type="button" style="background: #C98484; color: #fff; padding: 8px 16px; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">Gönder</button></form></div>')}
                className="w-full text-left p-3 border border-slate-200 hover:border-[#2271b1] hover:bg-slate-50 rounded-lg transition font-bold text-slate-800 flex items-center justify-between"
              >
                <span>📬 İletişim Destek Formu</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Ekle</span>
              </button>

              <button
                type="button"
                onClick={() => handleInsertForm('<div class="site-quote-box" style="border: 1px solid #fed7aa; padding: 20px; border-radius: 12px; background: #fcf7f6; margin: 16px 0;"><h4 style="margin: 0 0 12px 0; font-weight: 700; color: #c2410c;">🏢 Toptan & Kurumsal Satış Teklif Formu</h4><form style="display: flex; flex-direction: column; gap: 10px;"><input type="text" placeholder="Firma Ünvanı" style="padding: 8px 12px; border: 1px solid #fed7aa; border-radius: 6px;" /><input type="tel" placeholder="Telefon Numarası" style="padding: 8px 12px; border: 1px solid #fed7aa; border-radius: 6px;" /><textarea placeholder="Talep ettiğiniz ürünler ve adetler..." rows="3" style="padding: 8px 12px; border: 1px solid #fed7aa; border-radius: 6px;"></textarea><button type="button" style="background: #C98484; color: #fff; padding: 8px 16px; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">Teklif İsteyin</button></form></div>')}
                className="w-full text-left p-3 border border-slate-200 hover:border-[#2271b1] hover:bg-slate-50 rounded-lg transition font-bold text-slate-800 flex items-center justify-between"
              >
                <span>🏢 Toptan & Kurumsal Teklif Formu</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Ekle</span>
              </button>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
