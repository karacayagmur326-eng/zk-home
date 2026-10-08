"use client"

type Category = { id: string; name: string; parent_category_id: string | null }

export default function ProductCategoryPicker({ categories, selected, onToggle }: {
  categories: Category[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  const byId = new Map(categories.map(category => [category.id, category]))
  const visited = new Set<string>()
  const rows: Array<{ category: Category; depth: number; path: string }> = []
  function visit(category: Category, depth: number, ancestors: string[]) {
    if (visited.has(category.id)) return
    visited.add(category.id)
    rows.push({ category, depth, path: ancestors.join(" › ") })
    categories.filter(child => child.parent_category_id === category.id)
      .forEach(child => visit(child, depth + 1, [...ancestors, category.name]))
  }
  categories.filter(category => !category.parent_category_id || !byId.has(category.parent_category_id))
    .forEach(category => visit(category, 0, []))
  categories.forEach(category => visit(category, 0, []))

  return (
    <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1" aria-label="Ürün kategori ağacı">
      {!categories.length && <p className="text-xs text-slate-400">Kategori yükleniyor...</p>}
      {rows.map(({ category, depth, path }) => (
        <label key={category.id} title={path ? `${path} › ${category.name}` : category.name}
          className={`flex items-start gap-2.5 py-2.5 pr-3 rounded-lg border border-transparent cursor-pointer transition-colors ${selected.includes(category.id) ? "bg-[#faf3f1] border-[#ead5cf] text-slate-900" : depth === 0 ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50"}`}
          style={{ paddingLeft: 8 + Math.min(depth, 4) * 16 }}>
          <input type="checkbox" checked={selected.includes(category.id)} onChange={() => onToggle(category.id)}
            className="accent-[#C98484] h-4 w-4 mt-0.5 shrink-0" />
          <span className="min-w-0 text-xs">
            <span className={depth === 0 ? "font-semibold" : "font-semibold"}>{depth > 0 && <span aria-hidden="true" className="text-[#C98484] mr-1">↳</span>}{category.name}</span>
            <span className="block truncate text-[10px] text-slate-400 mt-0.5">{depth === 0 ? "Ana kategori" : `Alt kategori · ${path}`}</span>
          </span>
        </label>
      ))}
    </div>
  )
}
