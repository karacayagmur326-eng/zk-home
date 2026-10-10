"use client"
import { useEffect, useState } from "react"
import {
  changeFrequencies,
  normalizeSitemapSettings,
  sitemapKinds,
  sitemapLabels,
  type SitemapKind,
} from "@lib/seo/google-settings"

export default function GoogleSeoSettings({
  onSaved,
}: {
  onSaved?: () => void
}) {
  const [values, setValues] = useState({
    verification: "",
    ga4: "",
    gtm: "",
    headScripts: "",
    bodyScripts: "",
    sitemap: normalizeSitemapSettings(),
    baseUrl: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => {
    fetch("/api/admin/google-settings", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setValues((previous) => ({ ...previous, ...result }))
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false))
  }, [])
  async function save() {
    setSaving(true)
    setMessage("")
    setErrors({})
    try {
      const response = await fetch("/api/admin/google-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const result = await response.json()
      if (!response.ok) {
        setErrors(result.errors || {})
        throw new Error(result.error)
      }
      setMessage("Google, sitemap ve özel kod ayarları kaydedildi.")
      onSaved?.()
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }
  function changeSection(
    kind: SitemapKind,
    key: string,
    value: string | number | boolean
  ) {
    setValues((previous) => ({
      ...previous,
      sitemap: {
        ...previous.sitemap,
        sections: {
          ...previous.sitemap.sections,
          [kind]: { ...previous.sitemap.sections[kind], [key]: value },
        },
      },
    }))
  }
  return (
    <section
      className="admin-card space-y-5 rounded-xl border bg-white p-5"
      id="google-sitemap-settings"
    >
      <div>
        <h2 className="text-lg font-bold">
          Search Console, Google Analytics ve Sitemap
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Google kodlarını, site haritasını ve özel kod entegrasyonlarını buradan yönetin.
        </p>
      </div>
      {loading ? (
        <p>Ayarlar yükleniyor…</p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {(
              [
                [
                  "verification",
                  "Google Search Console doğrulama kodu",
                  "Doğrulama kodu / google-site-verification=…",
                  "Kodun tamamını veya HTML meta etiketini yapıştırabilirsiniz.",
                ],
                [
                  "ga4",
                  "Google Analytics 4 (GA4) ölçüm kimliği",
                  "G-…",
                  "Analytics → Yönetici → Veri akışları → Ölçüm kimliği.",
                ],
                [
                  "gtm",
                  "Google Tag Manager (isteğe bağlı)",
                  "GTM-…",
                  "GTM kullanıyorsanız konteyner kimliğini girin.",
                ],
              ] as const
            ).map(([key, label, placeholder, help]) => (
              <div key={key} className="min-w-0">
                <label
                  htmlFor={`google-${key}`}
                  className="mb-2 block text-sm font-semibold"
                >
                  {label}
                </label>
                <input
                  id={`google-${key}`}
                  value={values[key]}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                  placeholder={placeholder}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={`google-${key}-help`}
                  className={`admin-input w-full ${
                    errors[key] ? "!border-red-500" : ""
                  }`}
                />
                <p
                  id={`google-${key}-help`}
                  className={`mt-2 text-xs ${
                    errors[key] ? "text-red-700" : "text-slate-500"
                  }`}
                >
                  {errors[key] || help}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-xl border bg-slate-50 p-5">
            <div>
              <h3 className="font-bold">
                Özel Kod Entegrasyonları (&lt;head&gt; ve &lt;body&gt;)
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Meta Pixel, TikTok Pixel, Yandex Metrika ve canlı destek gibi
                servislerin kodlarını ekleyebilirsiniz. GA4 ve GTM için yukarıdaki
                kimlik alanlarını kullanmanız yeterlidir.
              </p>
            </div>
            {([
              ["headScripts", "<head> Bölümüne Eklenecek Kodlar (Header Scripts)", 7],
              ["bodyScripts", "<body> Bölümüne Eklenecek Kodlar (Body / Footer Scripts)", 4],
            ] as const).map(([key, label, rows]) => (
              <div key={key}>
                <label htmlFor={`google-${key}`} className="mb-2 block text-sm font-semibold">
                  {label}
                </label>
                <textarea
                  id={`google-${key}`}
                  rows={rows}
                  value={values[key]}
                  onChange={(event) => setValues({ ...values, [key]: event.target.value })}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `google-${key}-error` : undefined}
                  placeholder="Servisin sağladığı kodu buraya yapıştırın."
                  className={`admin-input w-full resize-y bg-white font-mono text-xs ${errors[key] ? "!border-red-500" : ""}`}
                />
                {errors[key] && (
                  <p id={`google-${key}-error`} className="mt-2 text-xs text-red-700">
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-4 border-t pt-5">
            <h3 className="font-bold">Sitemap ayarları</h3>
            <div className="flex flex-wrap gap-5">
              {(
                [
                  ["enabled", "Sitemap yayınla"],
                  ["home", "Ana sayfayı dahil et"],
                  ["images", "Ürün görsellerini dahil et"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values.sitemap[key]}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        sitemap: {
                          ...values.sitemap,
                          [key]: event.target.checked,
                        },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Yayınlı kayıtlar otomatik güncellenir. Taslak ve noindex sayfalar
              dahil edilmez. Sayfa bazında dahil etme seçeneği SEO
              düzenleyicisindedir.
            </p>
            <div className="grid gap-3">
              <div className="grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr]">
                <span className="text-sm font-semibold">Ana sayfa</span>
                <label className="text-xs">
                  Güncelleme sıklığı
                  <select
                    aria-label="Ana sayfa güncelleme sıklığı"
                    className="admin-input mt-1 w-full"
                    value={values.sitemap.homeChangefreq}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        sitemap: {
                          ...values.sitemap,
                          homeChangefreq: event.target.value,
                        },
                      })
                    }
                  >
                    {changeFrequencies.map((frequency, index) => (
                      <option key={frequency} value={frequency}>
                        {
                          [
                            "Her zaman",
                            "Saatlik",
                            "Günlük",
                            "Haftalık",
                            "Aylık",
                            "Yıllık",
                            "Hiçbir zaman",
                          ][index]
                        }
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  Öncelik (0–1)
                  <input
                    aria-label="Ana sayfa öncelik"
                    className="admin-input mt-1 w-full"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={values.sitemap.homePriority}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        sitemap: {
                          ...values.sitemap,
                          homePriority: Number(event.target.value),
                        },
                      })
                    }
                  />
                </label>
              </div>
              {sitemapKinds.map((kind) => (
                <div
                  key={kind}
                  className="grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr]"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={values.sitemap.sections[kind].enabled}
                      onChange={(event) =>
                        changeSection(kind, "enabled", event.target.checked)
                      }
                    />
                    {sitemapLabels[kind]}
                  </label>
                  <label className="text-xs">
                    Güncelleme sıklığı
                    <select
                      aria-label={`${sitemapLabels[kind]} güncelleme sıklığı`}
                      className="admin-input mt-1 w-full"
                      value={values.sitemap.sections[kind].changefreq}
                      onChange={(event) =>
                        changeSection(kind, "changefreq", event.target.value)
                      }
                    >
                      {changeFrequencies.map((frequency, index) => (
                        <option key={frequency} value={frequency}>
                          {
                            [
                              "Her zaman",
                              "Saatlik",
                              "Günlük",
                              "Haftalık",
                              "Aylık",
                              "Yıllık",
                              "Hiçbir zaman",
                            ][index]
                          }
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs">
                    Öncelik (0–1)
                    <input
                      aria-label={`${sitemapLabels[kind]} öncelik`}
                      className="admin-input mt-1 w-full"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={values.sitemap.sections[kind].priority}
                      onChange={(event) =>
                        changeSection(
                          kind,
                          "priority",
                          Number(event.target.value)
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
            {values.baseUrl && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <span className="font-semibold">
                  Search Console’a gönderilecek sitemap:
                </span>
                <a
                  href={`${values.baseUrl}/sitemap.xml`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-blue-700"
                >
                  {values.baseUrl}/sitemap.xml
                </a>
                <div className="mt-2 flex flex-wrap gap-3">
                  {sitemapKinds
                    .filter((kind) => values.sitemap.sections[kind].enabled)
                    .map((kind) => (
                      <a
                        key={kind}
                        href={`${values.baseUrl}/sitemap-${kind}.xml`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700"
                      >
                        {sitemapLabels[kind]}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={saving || loading || !values.baseUrl}
              onClick={save}
            >
              {saving ? "Kaydediliyor…" : "Google, Sitemap ve Kod Ayarlarını Kaydet"}
            </button>
            <p role="status" className="text-sm">
              {message}
            </p>
          </div>
        </>
      )}
      {!loading && !values.baseUrl && (
        <p role="alert" className="text-red-700">
          {message}
        </p>
      )}
    </section>
  )
}
