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
                src: "/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
