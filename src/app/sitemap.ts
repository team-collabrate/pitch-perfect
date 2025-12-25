import type { MetadataRoute } from "next";
import { env } from "~/env";

export default function sitemap(): MetadataRoute.Sitemap {
    const siteUrl = (env.NEXT_PUBLIC_BASE_URL ?? "https://pitchperfect.turf").replace(/\/$/, "");

    const pages = [
        "",
        "home",
        "book",
        "contact",
        "gallery",
        "instructions",
        "view",
    ];

    return pages.map((p) => ({
        url: `${siteUrl}/${p}`.replace(/\/$/, ""),
        lastModified: new Date(),
        changeFrequency: (p === "" ? "daily" : "weekly"),
        priority: p === "" ? 1 : 0.7,
    }));
}
