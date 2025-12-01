"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

interface CarouselSlide {
  id: string;
  src: string;
  alt: string;
}

interface CarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
}

export function Carousel({ slides, autoPlayInterval = 4000 }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  // `displayed` is the index currently being rendered. We only update it
  // after the next image has finished loading which prevents a white flash
  // when switching slides.
  const [displayed, setDisplayed] = useState(0);

  if (!slides || slides.length === 0) return null;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval]);

  // Preload the target `current` slide, and only update `displayed` when
  // the image has loaded. This keeps the previous image visible until the
  // next one is ready to render, eliminating the white flash.
  useEffect(() => {
    if (!slides || slides.length === 0) return;

    let cancelled = false;
    const src = slides[current]?.src;
    if (!src) return;

    const img = document.createElement("img") as HTMLImageElement;
    img.src = src;
    img.onload = () => {
      if (!cancelled) setDisplayed(current);
    };

    // In case of an error, still switch after a short timeout so the
    // carousel stays responsive.
    img.onerror = () => {
      if (!cancelled) {
        // small delay to avoid abrupt changes if many errors
        setTimeout(() => {
          if (!cancelled) setDisplayed(current);
        }, 200);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [current, slides]);

  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  return (
    <div className="bg-muted relative w-full overflow-hidden rounded-2xl">
      <div className="relative h-56 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayed}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <Image
              src={slides[displayed]!.src}
              alt={slides[displayed]!.alt}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      <div className="absolute right-0 bottom-4 left-0 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              index === current
                ? "w-6 bg-white"
                : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
