import Link from "next/link"
import { ArrowRight } from "@lib/icons"

const departments = [
  { title: "Dekorasyon", href: "/dekorasyon", text: "Vazolar, dekoratif objeler, mumluklar ve duvar aksesuarlarıyla yaşam alanınızı tamamlayın." },
  { title: "Mutfak & Sofra", href: "/mutfak-sofra", text: "Günlük sofralar ve misafir sunumları için tabak, kase, tepsi ve servis parçalarını inceleyin." },
  { title: "Ev Tekstili", href: "/tekstil", text: "Yatak odası, sofra ve oturma alanı için tekstil seçkilerine göz atın." },
  { title: "Banyo", href: "/banyo", text: "Banyo setleri, havlu ve paspas kategorilerinden ihtiyacınıza uygun seçenekleri keşfedin." },
]

export default function HomeBrandIntro() {
  return (
    <section aria-labelledby="home-brand-title" className="border-b border-[#eee6e2] bg-[#fffdfb]">
      <div className="content-container py-8 sm:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#a86568]">ZK Home online mağaza</p>
            <h1 id="home-brand-title" className="text-2xl font-semibold leading-tight tracking-tight text-[#302b2a] sm:text-3xl">
              ZK Home: Ev dekorasyonu, sofra ve yaşam ürünleri
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#665e5a]">
              Eviniz için seçtiğiniz parçaları ZK Home’da bir arada keşfedin. Dekoratif vazolardan
              sunum tepsilerine, sofra ürünlerinden ev tekstiline uzanan seçkimizde modelleri
              görselleri, ölçüleri ve kullanım bilgileriyle karşılaştırabilir; güncel fiyat ve
              stok durumunu ürün sayfalarında inceleyebilirsiniz.
            </p>
          </div>
          <Link prefetch={false} href="/magaza" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-[#C98484] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#a95e62]">
            Tüm ürünleri keşfet <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((department) => (
            <Link prefetch={false} key={department.href} href={department.href} className="group rounded-2xl border border-[#eee6e2] bg-white p-4 transition-colors hover:border-[#C98484]">
              <h2 className="flex items-center justify-between gap-3 text-base font-semibold text-[#302b2a]">
                {department.title}<ArrowRight className="h-4 w-4 shrink-0 text-[#C98484]" />
              </h2>
              <p className="mt-2 text-xs leading-6 text-[#756b67]">{department.text}</p>
            </Link>
          ))}
        </div>
        <p className="mt-5 text-xs leading-6 text-[#756b67]">
          Mağazamızı <Link prefetch={false} href="/hakkimizda" className="font-semibold text-[#a86568] underline underline-offset-4">Hakkımızda</Link> sayfasında
          tanıyabilir, ürün ve sipariş sorularınız için <Link prefetch={false} href="/iletisim" className="font-semibold text-[#a86568] underline underline-offset-4">bizimle iletişime geçebilirsiniz</Link>.
        </p>
      </div>
    </section>
  )
}
