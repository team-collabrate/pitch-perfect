import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pitch Perfect Turf",
    short_name: "PitchPerfect",
    description: "Mobile-first turf booking experience for Aruppukottai players.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050505",
    theme_color: "#25ff00",
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
