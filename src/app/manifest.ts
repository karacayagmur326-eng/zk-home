import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZK Home",
    short_name: "ZKHome",
    description: "ZK Home Mobil Alışveriş Uygulaması",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#C98484",
    icons: [
      {
        src: "/brand/zkhome-favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
