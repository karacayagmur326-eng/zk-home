import { MetadataRoute } from "next"
import { getThemeSettings } from "@lib/content/theme-settings"
import { getSiteSeoMetadata } from "@lib/seo/templates"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getThemeSettings()
  const site = getSiteSeoMetadata(settings)
  return {
    name: site.siteName, short_name: site.siteName, description: site.description,
    start_url: "/", display: "standalone", orientation: "portrait",
    background_color: "#ffffff", theme_color: settings?.primary_color || "#C98484",
    icons: settings?.favicon_url ? [{ src: settings.favicon_url, sizes: "any" }] : [],
  }
}
