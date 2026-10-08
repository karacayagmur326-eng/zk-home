import { getThemeSettings } from "@lib/content/theme-settings"
import { getSiteSeoMetadata } from "@lib/seo/templates"
import { ImageResponse } from "next/og"

export const alt = "Mağaza — Yaşam alanlarınıza zarafet"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage() {
  const site = getSiteSeoMetadata(await getThemeSettings())
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 78% 30%, rgba(201,132,132,.34), transparent 30%), linear-gradient(120deg, #fffdfc 0%, #f7efed 58%, #edd8d5 100%)",
          color: "#312727",
          padding: "72px 84px",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ display: "flex", gap: 7, height: 62 }}>
              {[34, 46, 54, 62].map((height, index) => (
                <div
                  key={height}
                  style={{
                    width: 13,
                    height,
                    marginTop: 62 - height,
                    background: index === 3 ? "#a95e5e" : "#c98484",
                    borderRadius: 5,
                  }}
                />
              ))}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 64 }}>
              {site.siteName}
            </div>
          </div>
          <div
            style={{
              maxWidth: 790,
              fontFamily: "Georgia, serif",
              fontSize: 70,
              lineHeight: 1.05,
            }}
          >
            {site.title}
          </div>
          <div style={{ fontSize: 28, color: "#6c5b5b" }}>
            {site.description}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
