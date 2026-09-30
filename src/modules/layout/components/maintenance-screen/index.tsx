import Image from "next/image"
import Link from "next/link"
import { getContactInfo } from "@lib/content/contact-info"

export default async function MaintenanceScreen({ message }: { message?: string }) {
  const contact = await getContactInfo()
  const customMessage = message || "Mağazamıza küçük bir yenilik dokunuşu yapıyoruz. Hazırlıklarımız tamamlandığında yeniden burada buluşacağız."

  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#faf7f4] px-5 py-10 text-[#453b36] sm:px-8 sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[540px] w-[540px] rounded-full bg-[#ead5cc]/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-48 h-[520px] w-[520px] rounded-full bg-[#c98484]/10 blur-3xl" />

      <header className="relative mb-8 text-center sm:mb-11">
        <Image src="/brand/zkhome-logo.svg" alt="ZK Home" width={200} height={40} priority className="mx-auto h-auto w-40 sm:w-48" />
        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.24em] text-[#8b756c] sm:text-xs">Evinize iyi gelen dokunuşlar</p>
      </header>

      <section aria-labelledby="maintenance-title" className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#e9ded7] bg-white shadow-[0_20px_80px_-35px_rgba(95,65,50,0.22)] md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative flex min-h-[220px] items-center justify-center bg-[#f3ebe5] px-8 py-6 sm:min-h-[280px] md:min-h-[450px] md:p-10">
          <div aria-hidden="true" className="absolute h-44 w-44 rounded-full border border-white/70 bg-[#faf6f2]/60 sm:h-60 sm:w-60 md:h-72 md:w-72" />
          <Image src="/category-images/dekoratif-objeler.webp" alt="Krem ve pudra tonlarında dekoratif objeler ve zarif yapraklar" width={420} height={420} priority sizes="(max-width: 767px) 240px, 380px" className="relative h-auto w-52 drop-shadow-[0_16px_16px_rgba(112,83,66,0.10)] sm:w-60 md:w-full md:max-w-[360px]" />
          <span aria-hidden="true" className="absolute bottom-6 h-px w-14 bg-[#c98484]/50 md:bottom-10" />
        </div>

        <div className="flex flex-col justify-center px-7 py-9 sm:px-10 sm:py-11 md:px-12">
          <div className="mb-5 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#a45d5d]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#c98484]" />
            Kısa bir hazırlık molası
          </div>
          <h1 id="maintenance-title" className="max-w-md font-serif text-[32px] leading-[1.2] tracking-[-0.025em] sm:text-[40px]">Evinize <span className="text-[#b97777]">güzel şeyler</span> hazırlıyoruz.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#75675f] sm:text-[15px]">{customMessage}</p>
          <p className="mt-4 text-sm font-medium text-[#a45d5d]">Yeniden buluşmak için sabırsızlanıyoruz.</p>

          {contact.email && (
            <div className="mt-8 border-t border-[#eee5de] pt-6">
              <p className="mb-3 text-xs text-[#75675f]">Bize ulaşmak isterseniz</p>
              <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center rounded-full border border-[#e4c8c4] bg-[#fcf7f5] px-5 py-2 text-sm font-medium text-[#9c5858] transition-colors hover:border-[#c98484] hover:bg-[#f5e7e3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a45d5d]">{contact.email}</a>
            </div>
          )}
        </div>
      </section>

      <footer className="relative mt-7 flex w-full max-w-5xl flex-col items-center justify-between gap-4 text-[11px] text-[#8b756c] sm:flex-row sm:mt-9">
        <p>© {new Date().getFullYear()} ZK Home. Tüm hakları saklıdır.</p>
        <Link href="/admin" prefetch={false} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 transition-colors hover:text-[#a45d5d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a45d5d]">Yönetici girişi <span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  )
}
