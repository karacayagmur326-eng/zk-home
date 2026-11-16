"use client"

import { useState, type CSSProperties } from "react"
import SmartImage from "@components/common/SmartImage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowLeft, ArrowRight, Pause, Play } from "@lib/icons"
import useFadeSlider from "../use-fade-slider"
import { RotateCcw } from "lucide-react"
import styles from "./stage.module.css"

export type SlideItem = {
  id?: string
  title?: string
  image_url?: string
  heading?: string
  subheading?: string
  description?: string
  badge_text?: string
  button_text?: string
  button_link?: string
  button2_text?: string
  button2_link?: string
  product_title?: string
  product_detail?: string
  product_url?: string
  theme?: "warm" | "gold" | "butterfly" | string
}

const DEFAULT_SCENES: SlideItem[] = [
  {
    image_url: "/hero/vase-room-complete-v1.webp",
    badge_text: "ZK HOME",
    heading: "Evinize\nİyi Gelen\nDokunuşlar",
    subheading: "Dekorasyon, sofra ve ev tekstili için ilham veren kategorileri keşfedin.",
    button_text: "Dekorasyonu Keşfet",
    button_link: "/dekorasyon",
    button2_text: "Mutfak & Sofra",
    button2_link: "/mutfak-sofra",
    product_title: "Ağaç Dalı Vazo Serisi",
    product_detail: "İki boy, birbiriyle uyumlu bir sunum.",
    product_url: "/urunler/agac-dali-desenli-ince-agizli-vazo-buyuk-boy",
    theme: "warm",
  },
  {
    image_url: "/hero/gold-table-panorama-v1.webp",
    badge_text: "SİYAH & ALTIN",
    heading: "Zarafetin\nAltın\nYansıması.",
    subheading: "Altın tonları, aynalı yüzeyler ve özenli detaylarla yaşam alanınızda etkileyici bir sunum oluşturun.",
    button_text: "Sunumu Keşfet",
    button_link: "/dekorasyon",
    button2_text: "Dekoratif Objeler",
    button2_link: "/dekorasyon/dekoratif-objeler",
    product_title: "Siyah & Altın Sunum",
    product_detail: "Aynalı yüzeyler, özenli detaylar.",
    product_url: "/dekorasyon/dekoratif-objeler",
    theme: "gold",
  },
  {
    image_url: "/hero/butterfly-room-panorama-v1.webp",
    badge_text: "KELEBEK DOKUNUŞU",
    heading: "Baharın\nEn Zarif\nHali.",
    subheading: "Pastel kelebekler, zarif seramikler ve çiçeklerin uyumu. Yaşam alanınıza baharın hafifliğini taşıyan detayları keşfedin.",
    button_text: "Koleksiyonu Keşfet",
    button_link: "/dekorasyon/dekoratif-objeler",
    button2_text: "Çiçekleri Keşfet",
    button2_link: "/yapay-cicek-bitki/yapay-cicekler",
    product_title: "Kelebek Dokunuşu",
    product_detail: "Pastel renklerle zarif bir birliktelik.",
    product_url: "/dekorasyon/dekoratif-objeler",
    theme: "butterfly",
  },
]

function plainCopy(value: string | undefined) {
  return (value || "").split("|")[0].replace(/\*\*/g, "").trim()
}

export default function ProductStageSlider({
  slides,
  slide,
  forceIndex,
  autoplay = true,
  onFieldClick,
}: {
  slides?: SlideItem[]
  slide?: SlideItem
  forceIndex?: number
  autoplay?: boolean
  onFieldClick?: (field: string) => void
}) {
  const activeSlides: SlideItem[] =
    slides && slides.length > 0
      ? slides
      : slide
        ? [slide]
        : DEFAULT_SCENES

  const count = activeSlides.length
  const [scene, setScene] = useState(0)
  const [loadedImages, setLoadedImages] = useState(0)
  const fadeAutoplay = autoplay && forceIndex === undefined
  const { activeIndex: rawActiveIndex, select, paused, toggle, gestures } = useFadeSlider(
    count,
    fadeAutoplay && loadedImages === (1 << count) - 1,
    11000
  )

  const activeIndex = forceIndex !== undefined ? Math.max(0, Math.min(forceIndex, count - 1)) : rawActiveIndex
  const currentSlide = activeSlides[activeIndex] || activeSlides[0] || DEFAULT_SCENES[0]
  const fallback = DEFAULT_SCENES[activeIndex % DEFAULT_SCENES.length] || DEFAULT_SCENES[0]

  const badge = plainCopy(currentSlide.badge_text) || fallback.badge_text || "ZK HOME"
  const rawTitle = currentSlide.heading || fallback.heading || "Evinize\nİyi Gelen\nDokunuşlar"
  const title = rawTitle.split("\n").map(plainCopy).filter(Boolean)
  const description =
    plainCopy(currentSlide.subheading) ||
    plainCopy(currentSlide.description) ||
    fallback.subheading ||
    ""

  const primaryText = plainCopy(currentSlide.button_text) || fallback.button_text || "Keşfet"
  const primaryHref = currentSlide.button_link || fallback.button_link || "/dekorasyon"
  const secondaryText = plainCopy(currentSlide.button2_text)
  const secondaryHref = currentSlide.button2_link || ""

  const productTitle = currentSlide.product_title || fallback.product_title || "Öne Çıkan Seri"
  const productDetail = currentSlide.product_detail || fallback.product_detail || "Özenle seçilmiş yaşam alanı detayları."
  const productHref = currentSlide.product_url || fallback.product_url || "/dekorasyon"

  const theme =
    currentSlide.theme === "gold" || currentSlide.theme === "butterfly" || currentSlide.theme === "warm"
      ? currentSlide.theme
      : fallback.theme || "warm"

  return (
    <section
      className={styles.hero}
      aria-label="ZK Home koleksiyon vitrini"
      data-theme={theme}
      data-paused={paused}
      data-interactive={Boolean(onFieldClick)}
      {...gestures}
    >
      <div
        className={styles.backdrop}
        onClick={onFieldClick ? () => onFieldClick("image_url") : undefined}
        title={onFieldClick ? "Arka plan görselini veya temasını değiştirmek için tıkla ✎" : undefined}
      >
        {activeSlides.map((item, index) => {
          const itemSrc = item.image_url || DEFAULT_SCENES[index % DEFAULT_SCENES.length].image_url || ""
          const itemAlt = plainCopy(item.heading) || plainCopy(item.title) || "ZK Home Vitrini"
          return (
            <div
              key={item.id || itemSrc + index}
              className={styles.photoLayer}
              data-active={index === activeIndex}
              aria-hidden={index !== activeIndex}
            >
              <SmartImage
                src={itemSrc}
                alt={itemAlt}
                fill
                sizes="100vw"
                priority={index === 0}
                loading={index === 0 ? undefined : "eager"}
                onLoad={() => setLoadedImages((value) => value | (1 << index))}
                className={styles.roomImage}
              />
            </div>
          )
        })}
        <span className={styles.copyShade} aria-hidden="true" />
      </div>

      <div
        className={styles.scene}
        key={scene + ":" + activeIndex}
        data-ready={Boolean(loadedImages & (1 << activeIndex))}
      >
        <div className={styles.copy}>
          <span
            className={styles.badge}
            onClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick("badge_text") } : undefined}
            title={onFieldClick ? "Rozet metnini düzenlemek için tıkla ✎" : undefined}
          >
            {badge}
          </span>
          <h2 className={styles.heading} aria-label={title.join(" ")}>
            {title.map((line, lineIndex) => {
              const fieldKey = lineIndex === 0 ? "heading_line1" : lineIndex === 1 ? "heading_line2" : "heading_line3"
              return (
                <span
                  key={lineIndex}
                  onClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick(fieldKey) } : undefined}
                  title={onFieldClick ? `${lineIndex + 1}. satır başlığı düzenlemek için tıkla ✎` : undefined}
                  className={
                    styles.titleLine + (lineIndex === 1 ? " " + styles.highlight : "")
                  }
                  aria-hidden="true"
                >
                  {line.split(/\s+/).map((word, wordIndex) => (
                    <span
                      key={wordIndex}
                      className={styles.titleWord}
                      style={
                        {
                          "--reveal-delay":
                            lineIndex * 0.16 + wordIndex * 0.075 + "s",
                        } as CSSProperties
                      }
                    >
                      {word}
                      {wordIndex < line.split(/\s+/).length - 1 ? "\u00a0" : ""}
                    </span>
                  ))}
                </span>
              )
            })}
          </h2>
          {description && (
            <p
              className={styles.description}
              onClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick("subheading") } : undefined}
              title={onFieldClick ? "Açıklama metnini düzenlemek için tıkla ✎" : undefined}
            >
              {description}
            </p>
          )}
          <div className={styles.buttons}>
            {onFieldClick ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onFieldClick("button_text") }}
                className={styles.primary}
                title="1. butonu düzenlemek için tıkla ✎"
              >
                {primaryText}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            ) : (
              <LocalizedClientLink href={primaryHref} className={styles.primary}>
                {primaryText}
                <ArrowRight size={17} aria-hidden="true" />
              </LocalizedClientLink>
            )}

            {secondaryText && (
              onFieldClick ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFieldClick("button2_text") }}
                  className={styles.secondary}
                  title="2. butonu düzenlemek için tıkla ✎"
                >
                  {secondaryText}
                </button>
              ) : secondaryHref ? (
                <LocalizedClientLink href={secondaryHref} className={styles.secondary}>
                  {secondaryText}
                </LocalizedClientLink>
              ) : null
            )}
          </div>
          {productTitle && (
            onFieldClick ? (
              <div
                onClick={(e) => { e.stopPropagation(); onFieldClick("product_title") }}
                className={styles.productLink}
                title="Öne çıkan ürün kartını düzenlemek için tıkla ✎"
              >
                <span className={styles.productRule} aria-hidden="true" />
                <span>
                  <strong>{productTitle}</strong>
                  {productDetail && <small>{productDetail}</small>}
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </div>
            ) : (
              <LocalizedClientLink href={productHref} className={styles.productLink}>
                <span className={styles.productRule} aria-hidden="true" />
                <span>
                  <strong>{productTitle}</strong>
                  {productDetail && <small>{productDetail}</small>}
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </LocalizedClientLink>
            )
          )}
        </div>
        <div className={styles.products} aria-hidden="true" />
      </div>

      <div className={styles.footer}>
        <div className={styles.navigation} aria-label="Slider kontrolleri">
          <button
            type="button"
            aria-label="Önceki sunum"
            onClick={() => select(activeIndex - 1)}
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          {activeSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              className={styles.dot}
              aria-label={index + 1 + ". sunuma git"}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => select(index)}
            />
          ))}
          <button
            type="button"
            aria-label="Sonraki sunum"
            onClick={() => select(activeIndex + 1)}
          >
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          {count > 1 && (
            <button
              type="button"
              aria-label={paused ? "Sunumu oynat" : "Sunumu duraklat"}
              onClick={toggle}
            >
              {paused ? (
                <Play size={13} aria-hidden="true" />
              ) : (
                <Pause size={13} aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (paused) toggle()
            setScene((value) => value + 1)
          }}
          className={styles.replay}
          aria-label="Slider animasyonunu yeniden oynat"
        >
          <RotateCcw size={15} aria-hidden="true" /> Yeniden izle
        </button>
      </div>
    </section>
  )
}
