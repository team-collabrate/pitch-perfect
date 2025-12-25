"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  GalleryHorizontal,
  Instagram,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Ticket,
  Timer,
} from "lucide-react";

import { LocationWidget } from "~/components/location-widget";
import { FooterBranding } from "~/components/footer-branding";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { WhatsAppIcon } from "~/components/ui/whatsapp-icon";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

type GalleryItemPreview = {
  id: number;
  title: string | null;
  altText: string | null;
  mediaType: "image" | "video";
  cloudinaryUrl: string;
  thumbnailUrl: string | null;
};

const whatsappNumber = "+917358848765";
const whatsappDigits = whatsappNumber.replace(/\D/g, "");
const instagramUrl = "https://www.instagram.com/+917358848765/?hl=en";
const supportEmail = "support@pitchperfectapk.com";
const mapUrl = "https://maps.app.goo.gl/GtWnLZFP5PJL9cwb8";

export function LandingPageClient({
  galleryItems,
}: {
  galleryItems: GalleryItemPreview[];
}) {
  const { language } = useLanguage();
  const homeStrings = useMemo(() => allTranslations.home[language], [language]);
  const contactStrings = useMemo(
    () => allTranslations.contact[language],
    [language],
  );
  const galleryStrings = useMemo(
    () => allTranslations.gallery[language],
    [language],
  );
  const landingStrings = useMemo(
    () => allTranslations.landing[language],
    [language],
  );

  const galleryPreview = useMemo(() => {
    const items = galleryItems.slice(0, 6);
    return items.map((item) => ({
      id: item.id,
      src:
        item.mediaType === "video" && item.thumbnailUrl
          ? item.thumbnailUrl
          : item.cloudinaryUrl,
      alt: item.altText ?? item.title ?? "Gallery item",
      mediaType: item.mediaType,
    }));
  }, [galleryItems]);

  const featureCards = useMemo(
    () => [
      {
        title: landingStrings.fastBooking,
        desc: landingStrings.fastBookingDesc,
        Icon: CalendarCheck,
      },
      {
        title: landingStrings.instantTicket,
        desc: landingStrings.instantTicketDesc,
        Icon: Ticket,
      },
      {
        title: landingStrings.clearTimings,
        desc: landingStrings.clearTimingsDesc,
        Icon: Timer,
      },
      {
        title: landingStrings.trustedSupport,
        desc: landingStrings.trustedSupportDesc,
        Icon: ShieldCheck,
      },
    ],
    [landingStrings],
  );

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full px-4 py-6">
        <div className="space-y-10">
          <header className="space-y-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {landingStrings.subtitle}
            </p>
            <div className="space-y-2">
              <h1 className="bbh-hegarty-regular text-2xl tracking-[0.08em] uppercase">
                {landingStrings.title}
              </h1>
              <p className="text-muted-foreground text-sm">
                {landingStrings.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="rounded-full">
                <Link
                  href="/book"
                  className="flex items-center justify-center gap-2"
                >
                  <CalendarCheck className="h-4 w-4" />
                  {homeStrings.bookTicket}
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link
                  href="/view"
                  className="flex items-center justify-center gap-2"
                >
                  <Ticket className="h-4 w-4" />
                  {homeStrings.viewTicket}
                </Link>
              </Button>
            </div>

            <Card className="border-border/60 overflow-hidden rounded-2xl p-0">
              <div className="relative h-36 w-full">
                <Image
                  src="/highlights/1-apurkotai-turf-highlights.jpeg"
                  alt={landingStrings.title}
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/55 to-black/0" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="bg-background/85 border-border/60 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
                    <Sparkles className="text-primary h-3.5 w-3.5" />
                    <span className="text-muted-foreground">
                      {landingStrings.location}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between">
              <Button asChild variant="link" className="px-0">
                <Link href="/home" className="flex items-center gap-1">
                  {landingStrings.openApp} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                >
                  <Link href="/gallery" aria-label={galleryStrings.title}>
                    <GalleryHorizontal className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                >
                  <Link href="/contact" aria-label={contactStrings.title}>
                    <Phone className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold">
                {landingStrings.features}
              </h2>
              <p className="text-muted-foreground text-xs">
                {landingStrings.featuresSub}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {featureCards.map(({ title, desc, Icon }) => (
                <Card key={title} className="border-border/60 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Icon className="h-10 w-10" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold">
                        {title}
                      </p>
                      <p className="text-muted-foreground text-xs">{desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold">
                {landingStrings.details}
              </h2>
              <Button asChild variant="link" className="px-0">
                <Link
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1"
                >
                  {landingStrings.directions}{" "}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Card className="border-border/60 overflow-hidden rounded-3xl p-0">
              <div className="divide-border/60 divide-y">
                <div className="flex items-start gap-4 p-5">
                  <span className="bg-accent text-accent-foreground flex h-10 w-10 items-center justify-center rounded-2xl">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-semibold">
                      {landingStrings.address}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {landingStrings.addressText}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        <Link
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4" />
                          {landingStrings.openMaps}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        <Link
                          href="/contact"
                          className="flex items-center gap-2"
                        >
                          {landingStrings.more}{" "}
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5">
                  <span className="bg-accent text-accent-foreground flex h-10 w-10 items-center justify-center rounded-2xl">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-semibold">
                      {landingStrings.callWhatsApp}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {contactStrings.frontDesk} {"•"} {"+91 73588 48765"}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button asChild size="sm" className="rounded-full">
                        <Link
                          href={`tel:${whatsappNumber}`}
                          className="flex items-center justify-center gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          {landingStrings.call}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        <Link
                          href={`https://wa.me/${whatsappDigits}?text=Hi%20Pitch%20Perfect%2C%20I%20need%20help%20with%20a%20booking.`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <WhatsAppIcon className="h-5 w-5" />
                          {landingStrings.whatsApp}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5">
                  <span className="bg-accent text-accent-foreground flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold">
                    {"@"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-semibold">
                      {landingStrings.email}
                    </p>
                    <Link
                      href={`mailto:${supportEmail}`}
                      className="text-muted-foreground hover:text-primary mt-1 block text-sm break-all"
                    >
                      {supportEmail}
                    </Link>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        <Link
                          href={`mailto:${supportEmail}`}
                          className="flex items-center justify-center gap-2"
                        >
                          {landingStrings.sendMail}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        <Link
                          href={instagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <Instagram className="h-4 w-4" />
                          {landingStrings.instagram}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold">{galleryStrings.title}</h2>
              <Button asChild variant="link" className="px-0">
                <Link href="/gallery" className="flex items-center gap-1">
                  {galleryStrings.view} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {galleryPreview.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {galleryPreview.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden rounded-2xl p-0"
                  >
                    <div className="relative aspect-square w-full">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        className="object-cover"
                      />
                      {item.mediaType === "video" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <span className="bg-background/85 text-muted-foreground rounded-full px-2 py-1 text-[10px]">
                            {landingStrings.video}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {[
                  "/highlights/1-apurkotai-turf-highlights.jpeg",
                  "/highlights/2-apurkotai-turf-highlights.jpeg",
                  "/highlights/3-apurkotai-turf-highlights.jpeg",
                  "/highlights/4-apurkotai-turf-highlights.jpeg",
                ].map((src, idx) => (
                  <Card key={src} className="overflow-hidden rounded-2xl p-0">
                    <div className="relative aspect-video w-full">
                      <Image
                        src={src}
                        alt={`Highlight ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              {homeStrings.locationTitle}
            </h2>
            <LocationWidget />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{contactStrings.title}</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <Link
                  href={`https://wa.me/${whatsappDigits}?text=Hi%20Pitch%20Perfect%2C%20I%20need%20help%20with%20a%20booking.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  {landingStrings.whatsApp}
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Instagram className="h-4 w-4" />
                  {landingStrings.instagram}
                </Link>
              </Button>
            </div>

            <Button asChild className="w-full rounded-full">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2"
              >
                <Phone className="h-4 w-4" />
                {landingStrings.openContactPage}
              </Link>
            </Button>
          </section>

          <FooterBranding className="rounded-xl" />
        </div>
      </div>
    </main>
  );
}
