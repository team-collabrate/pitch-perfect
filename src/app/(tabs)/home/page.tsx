"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { useLanguage } from "~/lib/language-context";

const copy = {
  en: {
    headline: "Game on at Pitch Perfect",
    sub: "Book premium turf slots in seconds and focus on the match, not the admin.",
    cta: "Book Now",
    highlightsTitle: "Turf Highlights",
    locationTitle: "Where we play",
    instructionsTitle: "Quick Booking Tips",
    instructionsCardTitle: "Need detailed instructions?",
    instructionsCardSubtitle: "Tap to view a step-by-step guide.",
  },
  ta: {
    headline: "பிட்ச் பர்ஃபெக்டில் உங்கள் ஆட்டம் தயாராக",
    sub: "சில நொடிகளில் டர்ஃப் ஸ்லாட்டை பதிவு செய்து, உங்கள் விளையாட்டில் கவனம் செலுத்துங்கள்.",
    cta: "இப்போது பதிவு செய்ய",
    highlightsTitle: "டர்ஃப் சிறப்பம்சங்கள்",
    locationTitle: "நாங்கள் விளையாடும் இடம்",
    instructionsTitle: "விரைவான பதிவு குறிப்புகள்",
    instructionsCardTitle: "வழிமுறைகள் தேவைப்படுகிறதா?",
    instructionsCardSubtitle: "படி படியாக உள்ள வழிகாட்டியை பார்க்கத் தொடுக.",
  },
} satisfies Record<string, Record<string, string>>;

const bookingInstructions = [
  {
    title: "Check slot availability",
    detail: "Only real-time open slots are shown on the booking screen.",
  },
  {
    title: "Pick your sport",
    detail: "Choose between cricket or football before confirming.",
  },
  {
    title: "Secure your payment",
    detail: "Pay ₹100 to block or ₹800 for full payment, instantly.",
  },
  {
    title: "Share contact details",
    detail: "Add an alternate number so our team can coordinate easily.",
  },
];

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
  const [instructionIndex, setInstructionIndex] = useState(0);

  const strings = useMemo(() => copy[language], [language]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setInstructionIndex((prev) => (prev + 1) % bookingInstructions.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 pb-6">
      <header className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Pitch Perfect
          </p>
          <h1 className="text-2xl font-semibold">{strings.headline}</h1>
        </div>
        <motion.section
          layout
          className="relative overflow-hidden rounded-3xl border border-border/40 bg-linear-to-br from-primary/10 via-background to-secondary p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-16 right-0 h-48 w-48 rounded-full bg-primary/30 blur-[110px]"
            animate={{ scale: [1, 0.92, 1], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 7, repeat: Infinity }}
          />
          <div className="relative z-10 space-y-3">
            <p className="text-sm text-muted-foreground">{strings.sub}</p>
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/book">{strings.cta}</Link>
            </Button>
          </div>
          <div className="relative mt-6 flex h-44 items-end overflow-hidden rounded-2xl">
            <Image
              src="https://picsum.photos/seed/pitch-hero/600/320"
              alt="Turf hero"
              fill
              className="object-cover"
              priority
            />
          </div>
        </motion.section>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{strings.instructionsTitle}</h2>
          <span className="text-xs text-muted-foreground">Auto-scroll tips</span>
        </div>
        <Card className="overflow-hidden border border-border/50 p-0">
          <div className="relative h-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={instructionIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col justify-center gap-2 p-4"
              >
                <h3 className="text-base font-medium">
                  {bookingInstructions[instructionIndex]?.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {bookingInstructions[instructionIndex]?.detail}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex justify-center gap-2 pb-3">
            {bookingInstructions.map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  instructionIndex === index
                    ? "bg-primary"
                    : "bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
        </Card>
        <Link href="/instructions" className="block" aria-label={strings.instructionsCardTitle}>
          <Card className="group flex items-center justify-between border border-dashed border-border/70 p-4 transition-all hover:border-primary">
            <div>
              <h3 className="text-base font-medium">{strings.instructionsCardTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {strings.instructionsCardSubtitle}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Card>
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{strings.locationTitle}</h2>
        <Card className="overflow-hidden p-0">
          <div className="aspect-video">
            <iframe
              title="Pitch Perfect map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.1740533169855!2d78.103!3d10.998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU5JzUyLjgiTiA3OMKwMDYnMTAuOCJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              className="h-full w-full border-0"
              loading="lazy"
              allowFullScreen
            />
          </div>
          <div className="p-4 text-sm text-muted-foreground">
            <p>12/4A, Pitch Perfect Turf, Aruppukottai Main Road, Tamil Nadu.</p>
            <p className="mt-2 font-medium text-foreground">Open 5 AM – 11 PM</p>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{strings.highlightsTitle}</h2>
        <div className="grid grid-cols-2 gap-3">
          {highlights.map((item) => (
            <Card key={item.label} className="overflow-hidden p-0">
              <div className="relative h-28 w-full">
                <Image
                  src={item.src}
                  alt={item.label}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {item.label}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
