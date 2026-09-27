import Link from "next/link"

export default function MaintenanceScreen({ message }: { message?: string }) {
  const customMessage = message || "Sitemiz şu anda planlı bakım ve altyapı çalışması sebebiyle geçici olarak hizmet verememektedir. Kısa süre sonra daha güçlü bir performans ile tekrar hizmetinizde olacağız."

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      {/* Background Subtle Gradient & Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C98484]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl space-y-6">
        {/* Brand Logo / Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#C98484] to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.9 6.91a2.12 2.12 0 01-3-3l6.91-6.9a6 6 0 017.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[#C98484] text-xs font-black tracking-widest uppercase mb-3">
            Planlı Bakım Çalışması
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Şu Anda Bakıımdayız
          </h1>
        </div>

        {/* Explanation Message */}
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
          {customMessage}
        </p>

        {/* Informative Divider */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col items-center gap-3">
          <p className="text-[11px] text-slate-500 font-semibold">
            Acil destek ve sipariş takibi için müşteri hizmetlerimiz aktif durumdadır.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-300">
            <a href="mailto:info@zk-home.com" className="hover:text-[#C98484] transition-colors">
              ✉️ info@zk-home.com
            </a>
          </div>
        </div>

        {/* Admin Link for Operator */}
        <div className="pt-2">
          <Link href="/admin" className="text-[10px] text-slate-600 hover:text-slate-400 underline transition-colors">
            Yönetici Girişi (Admin)
          </Link>
        </div>
      </div>

      {/* Footer copyright */}
      <p className="relative z-10 text-[11px] text-slate-600 mt-8">
        © {new Date().getFullYear()} ZK HOME. Tüm hakları saklıdır.
      </p>
    </div>
  )
}
