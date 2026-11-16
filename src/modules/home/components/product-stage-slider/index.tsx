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

  const isPreview = Boolean(onFieldClick || slide)
  const isUsingDefaultScenes = !slides && !slide
  const fallback = isUsingDefaultScenes
    ? (DEFAULT_SCENES[activeIndex % DEFAULT_SCENES.length] || DEFAULT_SCENES[0])
    : null

  const rawBadge = plainCopy(currentSlide.badge_text)
  const badge = rawBadge || (isPreview ? "+ Rozet Ekle" : (fallback?.badge_text || ""))

  const rawHeading = currentSlide.heading || ""
  const titleLines = rawHeading.split("\n").map(plainCopy).filter(Boolean)
  const isHeadingBlank = titleLines.length === 0
  const title = !isHeadingBlank
    ? titleLines
    : isPreview
      ? ["+ 1. Satır Başlık", "+ 2. Satır Vurgulu Başlık", "+ 3. Satır Başlık"]
      : (fallback?.heading ? fallback.heading.split("\n").map(plainCopy).filter(Boolean) : [])

  const rawDescription =
    plainCopy(currentSlide.subheading) ||
    plainCopy(currentSlide.description) ||
    ""
  const description = rawDescription || (isPreview ? "+ Açıklama metni eklemek için tıklayın..." : (fallback?.subheading || ""))

  const rawPrimaryText = plainCopy(currentSlide.button_text)
  const primaryText = rawPrimaryText || (isPreview ? "+ 1. Buton Ekle" : (fallback?.button_text || ""))
  const primaryHref = currentSlide.button_link || fallback?.button_link || "/dekorasyon"

  const rawSecondaryText = plainCopy(currentSlide.button2_text)
  const secondaryText = rawSecondaryText || (isPreview ? "+ 2. Buton Ekle" : "")
  const secondaryHref = currentSlide.button2_link || ""

  const rawProductTitle = currentSlide.product_title || ""
  const productTitle = rawProductTitle || (isPreview ? "+ Öne Çıkan Ürün Kartı Ekle" : (fallback?.product_title || ""))
  const productDetail = currentSlide.product_detail || (fallback?.product_detail || "")
  const productHref = currentSlide.product_url || fallback?.product_url || "/dekorasyon"

  const theme =
    currentSlide.theme === "gold" || currentSlide.theme === "butterfly" || currentSlide.theme === "warm"
      ? currentSlide.theme
      : fallback?.theme || "warm"

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
          const itemSrc = item.image_url || fallback?.image_url || ""
          const itemAlt = plainCopy(item.heading) || plainCopy(item.title) || "ZK Home Vitrini"
          return (
            <div
              key={item.id || (itemSrc || "empty-slide") + index}
              className={styles.photoLayer}
              data-active={index === activeIndex}
              aria-hidden={index !== activeIndex}
            >
              {itemSrc ? (
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
              ) : isPreview ? (
                <div
                  onClick={onFieldClick ? () => onFieldClick("image_url") : undefined}
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer select-none bg-stone-900/40 text-stone-300 p-8 text-center"
                  title="Arka plan sahne fotoğrafı seçmek veya yüklemek için tıkla"
                >
                  <div className="w-14 h-14 rounded-2xl bg-black/20 border border-white/20 flex items-center justify-center mb-2.5 text-white shadow-sm">
                    <span className="text-2xl">🖼️</span>
                  </div>
                  <p className="text-sm font-extrabold text-white">Sahne Fotoğrafı Seçilmedi</p>
                  <p className="text-xs text-white/70 mt-1 max-w-xs">
                    Görsel yüklemek veya medya kütüphanesinden seçmek için tıklayın
                  </p>
                </div>
              ) : null}
            </div>
          )
        })}
        <span className={styles.copyShade} aria-hidden="true" />
      </div>

      <div
        className={styles.scene}
        key={scene + ":" + activeIndex}
        data-ready={Boolean(!activeSlides[activeIndex]?.image_url || (loadedImages & (1 << activeIndex)))}
      >
        <div className={styles.copy}>
          {(rawBadge || isPreview) && (
            <span
              className={styles.badge}
              onClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick("badge_text") } : undefined}
              title={onFieldClick ? "Rozet metnini düzenlemek için tıkla ✎" : undefined}
              style={!rawBadge && isPreview ? { opacity: 0.65, borderStyle: "dashed" } : undefined}
            >
              {badge}
            </span>
          )}
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
                  style={isHeadingBlank && isPreview ? { opacity: 0.5, fontStyle: "italic" } : undefined}
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
          {(rawDescription || isPreview) && (
            <p
              className={styles.description}
              onClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick("subheading") } : undefined}
              title={onFieldClick ? "Açıklama metnini düzenlemek için tıkla ✎" : undefined}
              style={!rawDescription && isPreview ? { opacity: 0.5, fontStyle: "italic", cursor: "pointer" } : undefined}
            >
              {description}
            </p>
          )}
          <div className={styles.buttons}>
            {(rawPrimaryText || isPreview) && (
              onFieldClick ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFieldClick("button_text") }}
                  className={styles.primary}
                  title="1. butonu düzenlemek için tıkla ✎"
                  style={!rawPrimaryText && isPreview ? { opacity: 0.6, borderStyle: "dashed" } : undefined}
                >
                  {primaryText}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              ) : (
                <LocalizedClientLink href={primaryHref} className={styles.primary}>
                  {primaryText}
                  <ArrowRight size={17} aria-hidden="true" />
                </LocalizedClientLink>
              )
            )}

            {(rawSecondaryText || isPreview) && (
              onFieldClick ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFieldClick("button2_text") }}
                  className={styles.secondary}
                  title="2. butonu düzenlemek için tıkla ✎"
                  style={!rawSecondaryText && isPreview ? { opacity: 0.5, borderStyle: "dashed" } : undefined}
                >
                  {secondaryText}
                </button>
              ) : secondaryHref && rawSecondaryText ? (
                <LocalizedClientLink href={secondaryHref} className={styles.secondary}>
                  {secondaryText}
                </LocalizedClientLink>
              ) : null
            )}
          </div>
          {(rawProductTitle || isPreview) && (
            onFieldClick ? (
              <div
                onClick={(e) => { e.stopPropagation(); onFieldClick("product_title") }}
                className={styles.productLink}
                title="Öne çıkan ürün kartını düzenlemek için tıkla ✎"
                style={!rawProductTitle && isPreview ? { opacity: 0.55, borderStyle: "dashed" } : undefined}
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
