"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, Calendar, HelpCircle, Ticket } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "~/components/ui/card";
//import Carousel from "~/components/ui/carousel";
import { Carousel } from "~/components/ui/carousel";
import { useLanguage } from "~/lib/language-context";
import { LocationWidget } from "~/components/location-widget";
import { api } from "~/trpc/react";
import allTranslations from "~/lib/translations/all";

export default function HomePage() {
  const { language } = useLanguage();
  const { data: bannerItems } = api.banner.getAll.useQuery();

  const strings = useMemo(() => allTranslations.home[language], [language]);

  const highlights = useMemo(
    () => [
      {
        src: "https://picsum.photos/seed/turf-1/400/300",
        label: strings.highlight1,
      },
      {
        src: "https://picsum.photos/seed/turf-2/400/300",
        label: strings.highlight2,
      },
      {
        src: "https://picsum.photos/seed/turf-3/400/300",
        label: strings.highlight3,
      },
      {
        src: "https://picsum.photos/seed/turf-4/400/300",
        label: strings.highlight4,
      },
    ],
    [strings],
  );

  const slides = useMemo(() => {
    return (
      bannerItems
        ?.filter((item) => item.mediaType === "image")
        .map((item) => ({
          id: String(item.id),
          src: item.cloudinaryUrl,
          alt: item.altText ?? item.title ?? "Banner",
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
      className="space-y-8 lg:space-y-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {slides.length > 0 ? (
        <Carousel slides={slides} autoPlayInterval={4000} />
      ) : null}

      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
        {quickActions.map(({ key, href, label, desc, Icon, cardGlow }) => (
          <motion.div
            key={key}
            className="h-full"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Link href={href} className="block h-full">
              <Card
                className={`group border-border/60 shadow-primary/5 relative h-full overflow-hidden rounded-2xl border p-4 shadow-lg transition-all duration-300 md:p-6`}
              >
                <div
                  className={`absolute inset-0 ${cardGlow} opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-60`}
                />
                <div className="relative z-10 flex h-full items-center gap-3">
                  <span className="bg-background/70 text-foreground/80 group-hover:text-primary border-border/40 flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex-1">
                    <p className="text-foreground text-base font-semibold">
                      {label}
                    </p>
                    <p className="text-muted-foreground text-xs md:text-sm">
                      {desc}
                    </p>
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {highlights.map((item) => (
            <Card key={item.src} className="overflow-hidden p-0">
              <div className="relative h-28 w-full sm:h-36 lg:h-44">
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
