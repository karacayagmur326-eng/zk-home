import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { getBaseURL } from "@lib/util/env"
import { isPrivatePath } from "@lib/seo/indexing"
import { plainText } from "@lib/seo/entity"
export const maxDuration = 60

function safePath(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.length > 2048
  )
    return null
  const url = new URL(value, getBaseURL())
  return url.origin === new URL(getBaseURL()).origin &&
    !isPrivatePath(url.pathname)
    ? url
    : null
}
async function inspect(path: string) {
  let url = safePath(path)!,
    redirects = 0
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 12000)
  try {
    let response: Response
    do {
      response = await fetch(url, {
        cache: "no-store",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "ZK-Home-SEO-Audit/1.0" },
      })
      if (![301, 302, 303, 307, 308].includes(response.status)) break
      const next = new URL(response.headers.get("location") || "", url)
      if (next.origin !== url.origin || isPrivatePath(next.pathname))
        return {
          path,
          status: response.status,
          finalUrl: next.href,
          issues: ["Harici veya özel sayfaya yönleniyor"],
          links: [],
        }
      url = next
    } while (++redirects < 5)
    const html = await response!.text(),
      document = html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    const title = plainText(
        document.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      ),
      h1 = [...document.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(
        (match) => plainText(match[1])
      )
    const metaTags = [...document.matchAll(/<meta\b[^>]*>/gi)].map(
      (match) => match[0]
    )
    const content = (name: string) =>
      metaTags
        .find((tag) => new RegExp(`name=["']${name}["']`, "i").test(tag))
        ?.match(/content=["']([^"']*)["']/i)?.[1] || ""
    const canonical =
      [...document.matchAll(/<link\b[^>]*>/gi)]
        .map((match) => match[0])
        .find((tag) => /rel=["']canonical["']/i.test(tag))
        ?.match(/href=["']([^"']*)["']/i)?.[1] || ""
    const links = Array.from(
      new Set(
        [...document.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
          .map((match) => {
            try {
              const target = new URL(match[1].replace(/&amp;/g, "&"), url)
              target.hash = ""
              return target.origin === url.origin &&
                !isPrivatePath(target.pathname) &&
                !/\.[a-z0-9]{2,8}$/i.test(target.pathname) &&
                !target.search
                ? target.pathname
                : ""
            } catch {
              return ""
            }
          })
          .filter(Boolean)
      )
    )
    const issues: string[] = []
    if (response!.status !== 200) issues.push(`HTTP ${response!.status}`)
    if (redirects >= 5) issues.push("Yönlendirme zinciri çok uzun")
    if (response!.status === 200) {
      if (!title) issues.push("Title eksik")
      if (h1.length !== 1) issues.push(`H1 sayısı: ${h1.length}`)
      if (!content("description")) issues.push("Meta açıklaması eksik")
      if (!canonical) issues.push("Canonical eksik")
    }
    let schemaCount = 0
    for (const match of html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )) {
      try {
        JSON.parse(match[1])
        schemaCount++
      } catch {
        issues.push("JSON-LD geçersiz")
      }
    }
    return {
      path,
      status: response!.status,
      finalUrl: url.href,
      redirects,
      title,
      h1,
      description: content("description"),
      robots: content("robots"),
      canonical,
      schemaCount,
      links,
      issues,
    }
  } catch {
    return {
      path,
      status: 0,
      issues: ["Sayfa alınamadı veya süre aşıldı"],
      links: [],
    }
  } finally {
    clearTimeout(timeout)
  }
}
export async function POST(request: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (
    !Array.isArray(body?.paths) ||
    !body.paths.length ||
    body.paths.length > 10 ||
    body.paths.some((path: unknown) => !safePath(path))
  )
    return NextResponse.json(
      { error: "En fazla 10 genel site yolu gönderin." },
      { status: 400 }
    )
  const rows = []
  for (let offset = 0; offset < body.paths.length; offset += 5)
    rows.push(
      ...(await Promise.all(body.paths.slice(offset, offset + 5).map(inspect)))
    )
  return NextResponse.json(
    { rows, checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "private, no-store" } }
  )
}
