"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, Calendar, HelpCircle, Ticket } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "~/components/ui/card";
import { Carousel } from "~/components/ui/carousel";
import { useLanguage } from "~/lib/language-context";
import { LocationWidget } from "~/components/location-widget";
import { api } from "~/trpc/react";

const copy = {
  en: {
    headline: "Game on at Pitch Perfect",
    sub: "Book premium turf slots in seconds and focus on the match, not the admin.",
    cta: "Book Now",
    highlightsTitle: "Turf Highlights",
    locationTitle: "Where we play",
    bookTicket: "Book Ticket",
    viewTicket: "View Ticket",
    bookTicketDesc: "Reserve a slot in seconds",
    viewTicketDesc: "Pull up your ticket",
    instructionsTitle: "How to Book",
    instructionsDesc:
      "Learn the simple steps to book your perfect turf session",
  },
  ta: {
    headline: "பிட்ச் பர்ஃபெக்டில் உங்கள் ஆட்டம் தயாராக",
    sub: "சில நொடிகளில் டர்ஃப் ஸ்லாட்டை பதிவு செய்து, உங்கள் விளையாட்டில் கவனம் செலுத்துங்கள்.",
    cta: "இப்போது பதிவு செய்ய",
    highlightsTitle: "டர்ஃப் சிறப்பம்சங்கள்",
    locationTitle: "நாங்கள் விளையாடும் இடம்",
    bookTicket: "டிக்கெட் பதிவு செய்ய",
    viewTicket: "டிக்கெட்டைப் பார்க்கவும்",
    bookTicketDesc: "சில நொடிகளில் ஸ்லாட் பதிவு",
    viewTicketDesc: "உங்கள் ticket-ஐ உடனே காண்க",
    instructionsTitle: "பதிவு செய்வது எப்படி",
    instructionsDesc:
      "உங்கள் சரியான டர்ஃப் சேஷனை பதிவு செய்வதற்கான எளிய படிகளைக் கற்றுக்கொள்ளுங்கள்",
  },
} as const satisfies Record<string, Record<string, string>>;

const highlights = [
  {
    src: "https://picsum.photos/seed/turf-1/400/300",
    label: "Evening glow lighting",
  },
  {
    src: "https://picsum.photos/seed/turf-2/400/300",
    label: "Pro turf maintenance",
  },
  {
    src: "https://picsum.photos/seed/turf-3/400/300",
    label: "Dedicated players lounge",
  },
  {
    src: "https://picsum.photos/seed/turf-4/400/300",
    label: "On-site refreshment bar",
  },
];

export default function HomePage() {
  const { language } = useLanguage();
  const { data: bannerItems } = api.banner.getAll.useQuery();

  const strings = useMemo(() => copy[language], [language]);
  const slides = useMemo(() => {
    return (
      bannerItems?.filter((item) => item.mediaType === "image").map((item) => ({
        id: String(item.id),
        src: item.cloudinaryUrl,
        alt: item.altText || item.title || "Banner",
      })) ?? []
    );
  }, [bannerItems]);
  const quickActions = [
    {
      key: "book",
      href: "/book",
      label: strings.bookTicket,
      desc: strings.bookTicketDesc,
      Icon: Ticket,
      cardGlow: "bg-primary/30",
    },
    {
      key: "view",
      href: "/view",
      label: strings.viewTicket,
      desc: strings.viewTicketDesc,
      Icon: Calendar,
      cardGlow: "bg-secondary/30",
    },
  ];

  return (
    <motion.div
      className="space-y-8 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {slides.length > 0 ? (
        <Carousel slides={slides} autoPlayInterval={4000} />
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map(({ key, href, label, desc, Icon, cardGlow }) => (
          <motion.div
            key={key}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Link href={href} className="block">
              <Card
                className={`group border-border/60 shadow-primary/5 relative overflow-hidden rounded-2xl border p-4 shadow-lg transition-all duration-300`}
              >
                <div
                  className={`absolute inset-0 ${cardGlow} opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-60`}
                />
                <div className="relative z-10 flex items-center gap-3">
                  <span className="bg-background/70 text-foreground/80 group-hover:text-primary border-border/40 flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex-1">
                    <p className="text-foreground text-base font-semibold">
                      {label}
                    </p>
                    <p className="text-muted-foreground text-xs">{desc}</p>
                  </div>
                  <ArrowUpRight
                    className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors"
                    aria-hidden="true"
                  />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{strings.locationTitle}</h2>
        <LocationWidget />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{strings.highlightsTitle}</h2>
        <div className="grid grid-cols-2 gap-3">
          {highlights.map((item) => (
            <Card key={item.src} className="overflow-hidden p-0">
              <div className="relative h-28 w-full">
                <Image
                  src={item.src}
                  alt={item.label}
                  fill
                  className="object-cover"
                />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Link href="/instructions" className="block">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="group border-border/70 hover:border-primary/50 flex flex-col gap-3 border p-4 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-foreground text-base font-semibold">
                    {strings.instructionsTitle}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {strings.instructionsDesc}
                  </p>
                </div>
                <HelpCircle className="text-muted-foreground group-hover:text-primary h-5 w-5 shrink-0 transition-colors" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  Tap to learn more →
                </span>
              </div>
            </Card>
          </motion.div>
        </Link>
      </section>
    </motion.div>
  );
}
