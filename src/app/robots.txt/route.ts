import { env } from "~/env";

export async function GET() {
    const siteUrl = (env.NEXT_PUBLIC_BASE_URL ?? "https://pitchperfect.turf").replace(/\/$/, "");

    const lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "Disallow: /api/admin/",
        "Disallow: /api/auth/",
        "Disallow: /forgot-password",
        "Disallow: /reset-password",
        "",
        "# Sitemap location (generated)",
        `Sitemap: ${siteUrl}/sitemap.xml`,
        "",
        "# Recommended crawl delay for polite crawling (seconds)",
        "Crawl-delay: 10",
    ];

    return new Response(lines.join("\n"), {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}
