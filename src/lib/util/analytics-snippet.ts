/** Only migrate the standard, standalone GA4 snippet. Preserve custom events/tags. */
export function omitStandardGa4Snippet(value: string | undefined, measurementId?: string): string {
  if (!value || !measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) return value || ""

  const snippet = value.trim().replace(/^<!--\s*Google tag \(gtag\.js\)\s*-->\s*/, "")
  const scripts = snippet.match(/^<script\s+async\s+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)["']\s*>\s*<\/script>\s*<script>\s*([\s\S]*?)\s*<\/script>$/i)
  if (!scripts || scripts[1] !== measurementId) return value

  const code = scripts[2].replace(/\s+/g, "").replace(/"/g, "'")
  const standard = `window.dataLayer=window.dataLayer||[];functiongtag(){dataLayer.push(arguments);}gtag('js',newDate());gtag('config','${measurementId}');`
  return code === standard ? "" : value
}
