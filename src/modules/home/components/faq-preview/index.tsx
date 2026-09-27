import { ChevronDown, CircleHelp } from "@lib/icons"

export type FaqItem = {
  id: string
  question: string
  answer: string
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "warranty",
    question: "Ürünler garanti kapsamında mı?",
    answer:
      "Garanti süresi ürüne göre değişmekle birlikte uygun ürünlerde resmi garanti bilgisi ürün sayfasında ve faturada belirtilir.",
  },
  {
    id: "shipping",
    question: "Siparişim ne zaman kargoya verilir?",
    answer:
      "Stokta bulunan ürünler ödeme onayından sonra en kısa sürede hazırlanır; güncel teslimat bilgisi sipariş ekranında gösterilir.",
  },
  {
    id: "product-selection",
    question: "İşime uygun ürünü nasıl seçebilirim?",
    answer:
      "Ürün teknik özelliklerini karşılaştırabilir veya kullanım alanınızı belirterek destek ekibimizden öneri isteyebilirsiniz.",
  },
  {
    id: "returns",
    question: "İade ve değişim süreci nasıl işler?",
    answer:
      "İade koşullarına uygun ürünler için hesabınız veya iletişim kanallarımız üzerinden talep oluşturabilirsiniz.",
  },
]

export default function FaqPreview({
  items = DEFAULT_FAQS,
}: {
  items?: FaqItem[]
}) {
  if (!items.length) return null

  return (
    <section
      aria-labelledby="home-faq-title"
      className="bg-surface py-12 sm:py-16"
    >
      <div className="content-container grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12">
        <div>
          <CircleHelp aria-hidden="true" className="h-10 w-10 text-primary" />
          <p className="mt-5 text-xs font-black tracking-[0.16em] text-primary">
            MERAK ETTİKLERİNİZ
          </p>
          <h2
            id="home-faq-title"
            className="mt-2 text-3xl font-black text-foreground sm:text-4xl"
          >
            Sık Sorulan Sorular
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Sipariş, ürün seçimi, garanti ve teslimat hakkında en sık sorulan
            soruların kısa yanıtları.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <details
              key={item.id}
              open={index === 0}
              className="group rounded-rounded border border-border bg-card shadow-soft"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                {item.question}
                <ChevronDown
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
