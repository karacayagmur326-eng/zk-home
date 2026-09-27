import { Fragment, ReactNode } from "react"

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return parts.map((part, index) => part.startsWith("**") && part.endsWith("**")
    ? <strong key={`${part}-${index}`} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>
    : <Fragment key={`${part}-${index}`}>{part}</Fragment>)
}

export default function ChatbotRichText({ children }: { children: string }) {
  const blocks: Array<{ type: "paragraph" | "list"; content: string | string[] }> = []
  let list: string[] = []

  const flushList = () => {
    if (!list.length) return
    blocks.push({ type: "list", content: list })
    list = []
  }

  for (const rawLine of children.split("\n")) {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      continue
    }
    if (/^[-•]\s+/.test(line)) {
      list.push(line.replace(/^[-•]\s+/, ""))
      continue
    }
    flushList()
    blocks.push({ type: "paragraph", content: line })
  }
  flushList()

  return (
    <div className="space-y-2.5 text-[13px] leading-[1.62] tracking-[-0.01em]">
      {blocks.map((block, index) => block.type === "list" ? (
        <ul key={index} className="space-y-1.5 pl-1">
          {(block.content as string[]).map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-[0.58em] h-1.5 w-1.5 flex-none rounded-full bg-rose-500" aria-hidden="true" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p key={index}>{renderInline(block.content as string)}</p>
      ))}
    </div>
  )
}
