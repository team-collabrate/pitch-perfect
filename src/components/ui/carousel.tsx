"use client";

/* eslint-disable react/no-inline-styles */

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue } from "motion/react";
import type { PanInfo } from "motion/react";

interface CarouselSlide {
  id: string;
  src: string;
  alt: string;
}

interface CarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
  scrollable?: boolean;
  loop?: boolean;
}

export function Carousel({
  slides,
  autoPlayInterval = 4000,
  scrollable = false,
  loop = true,
}: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  const itemsForRender =
    loop && slides.length > 0
      ? [slides[slides.length - 1]!, ...slides, slides[0]!]
      : slides;
  const startPosition = loop ? 1 : 0;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    setCurrent(startPosition);
    x.set(-startPosition * containerWidth);
  }, [startPosition, containerWidth, x]);

  useEffect(() => {
    if (scrollable) return;

    const timer = setInterval(() => {
      if (!dragging) {
        setCurrent((prev) => {
          const next = prev + 1;
          if (loop && next === itemsForRender.length - 1) return 1;
          if (!loop && next === itemsForRender.length) return 0;
          return next;
        });
      }
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [itemsForRender.length, autoPlayInterval, scrollable, dragging, loop]);

  useEffect(() => {
    if (scrollable) return;
    x.set(-current * containerWidth);
  }, [current, containerWidth, scrollable]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    setDragging(false);
    const currentX = x.get();
    const index = Math.round(-currentX / containerWidth);
    let newIndex = index;
    if (loop) {
      if (index === 0) {
        newIndex = slides.length;
        x.set(-newIndex * containerWidth);
      } else if (index === itemsForRender.length - 1) {
        newIndex = 1;
        x.set(-newIndex * containerWidth);
      }
    } else {
      newIndex = Math.max(0, Math.min(itemsForRender.length - 1, index));
    }
    setCurrent(newIndex);
  };

  const goToSlide = (index: number) => {
    const newIndex = loop ? index + 1 : index;
    setCurrent(newIndex);
    if (!scrollable) {
      x.set(-newIndex * containerWidth);
    }
  };

  // If scrollable, observe scroll position and update `current`
  useEffect(() => {
    if (!scrollable) return;
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const width = el.clientWidth || 1;
        const idx = Math.round(el.scrollLeft / width);
        setCurrent(Math.max(0, Math.min(slides.length - 1, idx)));
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [slides.length, scrollable]);

  return (
    <div className="bg-muted relative w-full overflow-hidden rounded-2xl">
      <div
        ref={containerRef}
        className={
          scrollable
            ? "relative flex h-56 w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [-webkit-overflow-scrolling:touch] md:h-72 lg:h-80"
            : "relative h-56 w-full overflow-hidden md:h-72 lg:h-80"
        }
      >
        {scrollable ? (
          slides.map((slide) => (
            <div
              key={slide.id}
              className="relative h-56 w-full shrink-0 snap-center md:h-72 lg:h-80"
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover"
                draggable={false}
                priority
              />
            </div>
          ))
        ) : (
          <motion.div
            className="flex h-56 md:h-72 lg:h-80"
            style={{ x }}
            drag="x"
            dragConstraints={{
              left: -(itemsForRender.length - 1) * containerWidth,
              right: 0,
            }}
            onDragStart={() => setDragging(true)}
            onDragEnd={handleDragEnd}
          >
            {itemsForRender.map((slide) => (
              <div
                key={slide.id}
                className="relative h-56 w-full shrink-0 md:h-72 lg:h-80"
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  draggable={false}
                  priority
                />
              </div>
            ))}
          </motion.div>
        )}

        {/* Dots indicator */}
        <div className="absolute right-0 bottom-4 left-0 flex justify-center gap-2">
          {slides.map((_, index) => {
            const activeIndex = loop
              ? (current - 1 + slides.length) % slides.length
              : current;
            return (
              <button
                key={index}
                onClick={() => {
                  const el = containerRef.current;
                  if (scrollable && el) {
                    el.scrollTo({
                      left: index * el.clientWidth,
                      behavior: "smooth",
                    });
                  } else {
                    goToSlide(index);
                  }
                }}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-6 bg-white"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
