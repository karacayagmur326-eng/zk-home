import Link from "next/link"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"

export const dynamic = "force-dynamic"

export default async function NewsletterSubscribers({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!(await getAdminSession())) return null
  const params = await searchParams
  const page = Math.max(1, Math.min(100000, Number.parseInt(params.page || "1", 10) || 1))
  await query("CREATE TABLE IF NOT EXISTS newsletter_subscribers (email TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())")
  const [counts, subscribers] = await Promise.all([
    query<{ count: string }>("SELECT COUNT(*)::text AS count FROM newsletter_subscribers"),
    query<{ email: string; created_at: string }>("SELECT email, created_at FROM newsletter_subscribers ORDER BY created_at DESC, email LIMIT 25 OFFSET $1", [(page - 1) * 25]),
  ])
  const count = Number(counts[0]?.count || 0)
  return <div className="space-y-6 p-5 sm:p-8">
    <div><h1 className="text-xl font-semibold text-slate-900">E-posta Bülteni</h1><p className="mt-1 text-sm text-slate-500">Bülten kayıtları ve footer kontrolleri.</p></div>
    <div className="flex flex-wrap gap-3"><Link href="/admin/anasayfa-vitrini" className="admin-btn admin-btn-secondary">Bülten kutularını aç / kapat</Link><Link href="/admin/tema-ayarlari" className="admin-btn admin-btn-secondary">Sosyal medya ve footer metinleri</Link></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <h2 className="border-b border-slate-200 p-4 font-semibold">Aboneler ({count})</h2>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">E-posta</th><th className="p-4">Kayıt Tarihi</th></tr></thead><tbody>{subscribers.map((subscriber) => <tr key={subscriber.email} className="border-t border-slate-100"><td className="p-4">{subscriber.email}</td><td className="whitespace-nowrap p-4">{new Date(subscriber.created_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</td></tr>)}</tbody></table></div>
      {!subscribers.length && <p className="p-6 text-sm text-slate-500">Henüz bülten kaydı yok.</p>}
      <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm">{page > 1 ? <Link href={`/admin/bulten?page=${page - 1}`}>Önceki</Link> : <span />}<span>Sayfa {page}</span>{page * 25 < count ? <Link href={`/admin/bulten?page=${page + 1}`}>Sonraki</Link> : <span />}</div>
    </section>
  </div>
}
