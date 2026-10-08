import Link from "next/link"
import NewsletterAutoRefresh from "./auto-refresh"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { Mail, Users, Clock, Settings, Search, ChevronLeft, ChevronRight } from "@lib/icons"
import { AdminSectionHeading, AdminMetric, AdminEmptyState } from "@components/admin/AdminContent"

export const dynamic = "force-dynamic"
const PAGE_SIZE = 25

export default async function NewsletterSubscribers({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  if (!(await getAdminSession())) return null
  const params = await searchParams
  const search = (params.q || "").trim().slice(0, 200)
  const requestedPage = Math.max(1, Math.min(100000, Number.parseInt(params.page || "1", 10) || 1))
  await query("CREATE TABLE IF NOT EXISTS newsletter_subscribers (email TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())")
  // Literal substring search: % and _ in an email must not become SQL wildcards.
  const filter = search.replace(/[\\%_]/g, "\\$&")
  const [totals, counts] = await Promise.all([
    query<{ total: string; recent: string; latest: string | null }>("SELECT COUNT(*)::text AS total, COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS recent, MAX(created_at) AS latest FROM newsletter_subscribers"),
    query<{ count: string }>("SELECT COUNT(*)::text AS count FROM newsletter_subscribers WHERE email ILIKE $1", [`%${filter}%`]),
  ])
  const count = Number(counts[0]?.count || 0)
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const page = Math.min(requestedPage, pages)
  const subscribers = await query<{ email: string; created_at: string }>("SELECT email, created_at FROM newsletter_subscribers WHERE email ILIKE $1 ORDER BY created_at DESC, email LIMIT $2 OFFSET $3", [`%${filter}%`, PAGE_SIZE, (page - 1) * PAGE_SIZE])
  const date = (value: string) => new Date(value).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short" })
  const pageHref = (next: number) => `/admin/bulten?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(next) })}`
  return <div className="admin-content-stack">
    <div className="admin-content-toolbar">
      <NewsletterAutoRefresh />
      <div className="admin-content-actions">
        <Link href="/admin/anasayfa-vitrini" className="admin-btn admin-btn-secondary"><Mail size={15} aria-hidden="true" />Abonelik kutusu ayarları</Link>
        <Link href="/admin/tema-ayarlari" className="admin-btn admin-btn-secondary"><Settings size={15} aria-hidden="true" />Footer ve sosyal medya</Link>
      </div>
    </div>
    <div className="admin-metrics-grid">
      <AdminMetric label="Toplam abone" value={Number(totals[0]?.total || 0).toLocaleString("tr-TR")} detail="Tüm bülten kayıtları" icon={<Users size={18} />} />
      <AdminMetric label="Son 30 günde" value={Number(totals[0]?.recent || 0).toLocaleString("tr-TR")} detail="Yeni abonelikler" icon={<Mail size={18} />} />
      <AdminMetric label="Son kayıt" value={totals[0]?.latest ? date(totals[0].latest) : "—"} detail="Türkiye saati" icon={<Clock size={18} />} />
    </div>
    <section className="admin-panel">
      <div className="admin-panel-header"><AdminSectionHeading title="Bülten aboneleri" description="Web sitenizden gelen abonelik kayıtlarını takip edin." icon={<Mail size={16} />} /><span className="admin-status-badge">{count} kayıt</span></div>
      <form method="get" action="/admin/bulten" className="admin-content-toolbar admin-panel-filters">
        <label className="admin-search-field"><Search size={16} aria-hidden="true" /><input key={search} name="q" defaultValue={search} maxLength={200} placeholder="E-posta adresi ara..." aria-label="Abonelerde ara" className="admin-input" /></label>
        <button type="submit" className="admin-btn admin-btn-primary">Ara</button>
        {search && <Link href="/admin/bulten" className="admin-btn admin-btn-secondary">Sıfırla</Link>}
      </form>
      {subscribers.length ? <div className="admin-table-scroll"><table className="admin-table admin-table--embedded"><thead><tr><th scope="col">Abone</th><th scope="col">Kayıt tarihi</th></tr></thead><tbody>{subscribers.map(subscriber => <tr key={subscriber.email}><td><div className="admin-subscriber-cell"><span className="admin-section-icon"><Mail size={16} aria-hidden="true" /></span><span>{subscriber.email}</span></div></td><td className="whitespace-nowrap">{date(subscriber.created_at)}</td></tr>)}</tbody></table></div> : <AdminEmptyState title={search ? "Aramanızla eşleşen abone bulunamadı" : "Henüz bülten abonesi yok"} description={search ? "Başka bir e-posta adresi arayın veya filtreyi sıfırlayın." : "Müşterileriniz bültene abone olduğunda kayıtları burada görünecek."} icon={<Mail size={20} />} />}
      <div className="admin-pagination-bar"><span>{count ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, count)} / ${count} abone` : "0 abone"}</span><nav aria-label="Abone sayfaları" className="admin-content-actions">{page > 1 && <Link href={pageHref(page - 1)} className="admin-btn admin-btn-secondary"><ChevronLeft size={14} aria-hidden="true" />Önceki</Link>}<span>Sayfa {page} / {pages}</span>{page < pages && <Link href={pageHref(page + 1)} className="admin-btn admin-btn-secondary">Sonraki<ChevronRight size={14} aria-hidden="true" /></Link>}</nav></div>
    </section>
  </div>
}
