"use client"

import { useState, type CSSProperties } from "react"
import SmartImage from "@components/common/SmartImage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowLeft, ArrowRight, Pause, Play } from "@lib/icons"
import useFadeSlider from "../use-fade-slider"
import { RotateCcw } from "lucide-react"
import styles from "./stage.module.css"

const PRODUCT_URL = "/urunler/agac-dali-desenli-ince-agizli-vazo-buyuk-boy"
const VISUALS = [
  { src: "/hero/vase-room-complete-v1.webp", alt: "Ağaç Dalı vazolar, sehpa, çiçekler ve aynayla birlikte doğal ışık alan mermer zeminli mekânda" },
  { src: "/hero/gold-table-panorama-v1.webp", alt: "Siyah mermer üzerinde altın aynalı tepsi, şamdanlar, kristal objeler ve çiçekli vazo" },
  { src: "/hero/butterfly-room-panorama-v1.webp", alt: "Gün ışığı alan ahşap konsolda pastel kelebek detaylı seramik vazolar ve mavi beyaz çiçek aranjmanı" },
]

type SlideCopy = {
  heading?: string
  subheading?: string
  badge_text?: string
  button_text?: string
  button_link?: string
  button2_text?: string
  button2_link?: string
}

function plainCopy(value: string | undefined) {
  return (value || "").split("|")[0].replace(/\*\*/g, "").trim()
}

export default function ProductStageSlider({ slide }: { slide?: SlideCopy }) {
  const [scene, setScene] = useState(0)
  const [loadedImages, setLoadedImages] = useState(0)
  const { activeIndex, select, paused, toggle, gestures } = useFadeSlider(VISUALS.length, loadedImages === (1 << VISUALS.length) - 1, 11000)
  const originalTitle = (slide?.heading || "Evinize\nİyi Gelen\nDokunuşlar")
    .split("\n").map(plainCopy).filter(Boolean)
  const gold = activeIndex === 1
  const butterfly = activeIndex === 2
  const title = butterfly ? ["Baharın", "En Zarif", "Hali."] : gold ? ["Zarafetin", "Altın", "Yansıması."] : originalTitle
  const content = butterfly ? {
    badge: "KELEBEK DOKUNUŞU",
    description: "Pastel kelebekler, zarif seramikler ve çiçeklerin uyumu. Yaşam alanınıza baharın hafifliğini taşıyan detayları keşfedin.",
    primaryText: "Koleksiyonu Keşfet", primaryHref: "/dekorasyon/dekoratif-objeler",
    secondaryText: "Çiçekleri Keşfet", secondaryHref: "/yapay-cicek-bitki/yapay-cicekler",
    productTitle: "Kelebek Dokunuşu", productDetail: "Pastel renklerle zarif bir birliktelik.", productHref: "/dekorasyon/dekoratif-objeler",
  } : gold ? {
    badge: "SİYAH & ALTIN",
    description: "Altın tonları, aynalı yüzeyler ve özenli detaylarla yaşam alanınızda etkileyici bir sunum oluşturun.",
    primaryText: "Sunumu Keşfet", primaryHref: "/dekorasyon",
    secondaryText: "Dekoratif Objeler", secondaryHref: "/dekorasyon/dekoratif-objeler",
    productTitle: "Siyah & Altın Sunum", productDetail: "Aynalı yüzeyler, özenli detaylar.", productHref: "/dekorasyon/dekoratif-objeler",
  } : {
    badge: plainCopy(slide?.badge_text) || "ZK HOME",
    description: plainCopy(slide?.subheading) || "Dekorasyon, sofra ve ev tekstili için ilham veren kategorileri keşfedin.",
    primaryText: plainCopy(slide?.button_text) || "Dekorasyonu Keşfet", primaryHref: slide?.button_link || "/dekorasyon",
    secondaryText: plainCopy(slide?.button2_text) || "Mutfak & Sofra", secondaryHref: slide?.button2_link || "/mutfak-sofra",
    productTitle: "Ağaç Dalı Vazo Serisi", productDetail: "İki boy, birbiriyle uyumlu bir sunum.", productHref: PRODUCT_URL,
  }

  return (
    <section className={styles.hero} aria-label="ZK Home koleksiyon vitrini" data-theme={butterfly ? "butterfly" : gold ? "gold" : "warm"} data-paused={paused} {...gestures}>
      <div className={styles.backdrop}>
        {VISUALS.map((visual, index) => (
          <div key={visual.src} className={styles.photoLayer} data-active={index === activeIndex} aria-hidden={index !== activeIndex}>
            <SmartImage src={visual.src} alt={visual.alt} fill sizes="100vw" priority={index === 0} loading={index === 0 ? undefined : "eager"} onLoad={() => setLoadedImages(value => value | (1 << index))} className={styles.roomImage} />
          </div>
        ))}
        <span className={styles.copyShade} aria-hidden="true" />
      </div>
      <div className={styles.scene} key={scene + ":" + activeIndex} data-ready={Boolean(loadedImages & (1 << activeIndex))}>
        <div className={styles.copy}>
          <span className={styles.badge}>{content.badge}</span>
          <h2 className={styles.heading} aria-label={title.join(" ")}>
            {title.map((line, lineIndex) => (
              <span key={lineIndex} className={styles.titleLine + (lineIndex === 1 ? " " + styles.highlight : "")} aria-hidden="true">
                {line.split(/\s+/).map((word, wordIndex) => (
                  <span key={wordIndex} className={styles.titleWord} style={{ "--reveal-delay": (lineIndex * .16 + wordIndex * .075) + "s" } as CSSProperties}>
                    {word}{wordIndex < line.split(/\s+/).length - 1 ? "\u00a0" : ""}
                  </span>
                ))}
              </span>
            ))}
          </h2>
          <p className={styles.description}>{content.description}</p>
          <div className={styles.buttons}>
            <LocalizedClientLink href={content.primaryHref} className={styles.primary}>
              {content.primaryText}<ArrowRight size={17} aria-hidden="true" />
            </LocalizedClientLink>
            <LocalizedClientLink href={content.secondaryHref} className={styles.secondary}>
              {content.secondaryText}
            </LocalizedClientLink>
          </div>
          <LocalizedClientLink href={content.productHref} className={styles.productLink}>
            <span className={styles.productRule} aria-hidden="true" />
            <span><strong>{content.productTitle}</strong><small>{content.productDetail}</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </LocalizedClientLink>
        </div>
        <div className={styles.products} aria-hidden="true" />
      </div>
      <div className={styles.footer}>
        <div className={styles.navigation} aria-label="Slider kontrolleri">
          <button type="button" aria-label="Önceki sunum" onClick={() => select(activeIndex - 1)}><ArrowLeft size={16} aria-hidden="true" /></button>
          {VISUALS.map((_, index) => <button key={index} type="button" className={styles.dot} aria-label={(index + 1) + ". sunuma git"} aria-current={index === activeIndex ? "true" : undefined} onClick={() => select(index)} />)}
          <button type="button" aria-label="Sonraki sunum" onClick={() => select(activeIndex + 1)}><ArrowRight size={16} aria-hidden="true" /></button>
          <button type="button" aria-label={paused ? "Sunumu oynat" : "Sunumu duraklat"} onClick={toggle}>{paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}</button>
        </div>
        <button type="button" onClick={() => { if (paused) toggle(); setScene(value => value + 1) }} className={styles.replay} aria-label="Slider animasyonunu yeniden oynat"><RotateCcw size={15} aria-hidden="true" /> Yeniden izle</button>
      </div>
    </section>
  )
}
