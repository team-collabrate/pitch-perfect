"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export default function GalleryPage() {
  const { data: galleryItems, isLoading } = api.gallery.getAll.useQuery();
  const [active, setActive] = useState<(typeof galleryItems)[number] | null>(
    null,
  );
  const [zoomed, setZoomed] = useState(false);

  const columns = useMemo(() => {
    if (!galleryItems) return [[], [], []];
    const grouped: (typeof galleryItems)[] = [[], [], []];
    galleryItems.forEach((item, index) => {
      grouped[index % 3]?.push(item);
    });
    return grouped;
  }, [galleryItems]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-6">
        <header className="space-y-1">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Highlight reel
          </p>
          <h1 className="text-2xl font-semibold">Gallery</h1>
        </header>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!galleryItems || galleryItems.length === 0) {
    return (
      <div className="space-y-6 pb-6">
        <header className="space-y-1">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Highlight reel
          </p>
          <h1 className="text-2xl font-semibold">Gallery</h1>
        </header>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No gallery items yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          Highlight reel
        </p>
        <h1 className="text-2xl font-semibold">Gallery</h1>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {columns.map((column, columnIndex) => (
          <div key={`column-${columnIndex}`} className="flex flex-col gap-2">
            {column.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item);
                  setZoomed(false);
                }}
                aria-label={`View ${item.title}`}
                className="relative overflow-hidden rounded-2xl focus:outline-none"
              >
                <Image
                  src={
                    item.mediaType === "video" && item.thumbnailUrl
                      ? item.thumbnailUrl
                      : item.cloudinaryUrl
                  }
                  alt={item.altText || item.title}
                  width={400}
                  height={400}
                  className="aspect-square w-full object-cover transition hover:scale-[1.02]"
                />
                {item.mediaType === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg
                      className="h-12 w-12 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              layout
              className="relative flex w-full max-w-md flex-col items-stretch gap-3"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="relative overflow-hidden rounded-3xl">
                <motion.div
                  animate={{ scale: zoomed ? 1.25 : 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  {active.mediaType === "video" ? (
                    <video
                      src={active.cloudinaryUrl}
                      className="h-full w-full object-cover"
                      controls
                      autoPlay
                    />
                  ) : (
                    <Image
                      src={active.cloudinaryUrl}
                      alt={active.altText || active.title}
                      width={900}
                      height={1200}
                      className="h-full w-full object-cover"
                    />
                  )}
                </motion.div>
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                  <Button
                    variant="ghost"
                    onClick={() => setActive(null)}
                    className="rounded-full bg-black/40 text-white"
                  >
                    Close
                  </Button>
                  {active.mediaType === "image" && (
                    <Button
                      variant="ghost"
                      onClick={() => setZoomed((value) => !value)}
                      className="rounded-full bg-black/40 text-white"
                    >
                      {zoomed ? "Reset" : "Zoom"}
                    </Button>
                  )}
                </div>
              </div>
              <div className="bg-background/90 text-muted-foreground rounded-3xl p-4 text-sm">
                <p className="text-foreground font-semibold">{active.title}</p>
                {active.description && <p>{active.description}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
