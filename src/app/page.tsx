"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  MapPin,
  Phone,
  Instagram,
  Zap,
  Star,
  MessageCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { LocationWidget } from "~/components/location-widget";
import { api } from "~/trpc/react";
import { WhatsAppIcon } from "~/components/ui/whatsapp-icon";

const whatsappNumber = "+917358848765";
const instagramUrl = "https://www.instagram.com/search?q=pitchperfecturniture";
const contactPhone = "+91 73588 48765";

export default function LandingPage() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.landing[language], [language]);

  const { data: galleryItems } = api.gallery.getAll.useQuery();
  const { data: bannerItems } = api.banner.getAll.useQuery();

  const features = useMemo(
    () => [
      {
        key: "booking",
        icon: Zap,
        title: strings.feature1Title,
        desc: strings.feature1Desc,
        color: "from-blue-500/20 to-blue-600/20",
      },
      {
        key: "location",
        icon: MapPin,
        title: strings.feature2Title,
        desc: strings.feature2Desc,
        color: "from-green-500/20 to-green-600/20",
      },
      {
        key: "amenities",
        icon: Star,
        title: strings.feature3Title,
        desc: strings.feature3Desc,
        color: "from-yellow-500/20 to-yellow-600/20",
      },
      {
        key: "support",
        icon: MessageCircle,
        title: strings.feature4Title,
        desc: strings.feature4Desc,
        color: "from-purple-500/20 to-purple-600/20",
      },
    ],
    [strings],
  );

  const heroSlides = useMemo(() => {
    return (
      bannerItems
        ?.filter((item) => item.mediaType === "image")
        .slice(0, 3)
        .map((item) => ({
          id: String(item.id),
          src: item.cloudinaryUrl,
          alt: item.altText ?? item.title ?? "Pitch Perfect",
        })) ?? []
    );
  }, [bannerItems]);

  const galleryPreview = useMemo(() => {
    return galleryItems?.slice(0, 3) ?? [];
  }, [galleryItems]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      className="from-background via-background to-secondary/10 min-h-screen bg-linear-to-b"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-12">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Hero Image/Banner */}
          {heroSlides?.[0] && (
            <motion.div
              className="relative h-64 w-full overflow-hidden rounded-3xl"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Image
                src={heroSlides[0].src}
                alt={heroSlides[0].alt}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
            </motion.div>
          )}

          {/* Hero Text */}
          <motion.div className="space-y-4">
            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                {strings.headline}
              </h1>
              <p className="text-muted-foreground text-lg">
                {strings.subheadline}
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col gap-3 pt-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Link href="/(tabs)/book" className="block">
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Button className="h-12 w-full gap-2 rounded-xl text-base font-semibold">
                    {strings.bookNow}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>

              <Link
                href={`https://wa.me/${whatsappNumber.replace(/\s/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Button
                    variant="outline"
                    className="h-12 w-full gap-2 rounded-xl text-base font-semibold"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    Chat with us
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-12">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div className="space-y-2">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {strings.featureSectionTitle}
            </p>
            <h2 className="text-2xl font-bold">{strings.featuresTitle}</h2>
          </motion.div>

          <motion.div
            className="grid gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map(({ key, icon: Icon, title, desc, color }) => (
              <motion.div key={key} variants={itemVariants}>
                <Card className="group border-border/60 hover:border-primary/50 relative overflow-hidden p-4 transition-all duration-300">
                  <div
                    className={`absolute inset-0 bg-linear-to-r ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="relative z-10 flex gap-4">
                    <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                      <Icon className="text-primary h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-muted-foreground text-sm">{desc}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Location Section */}
      <section className="px-4 py-12">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div className="space-y-2">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {strings.locationSectionTitle}
            </p>
            <h2 className="text-2xl font-bold">
              {strings.locationSectionTitle}
            </h2>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="overflow-hidden p-0">
              <LocationWidget />
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Gallery Preview Section */}
      {galleryPreview.length > 0 && (
        <section className="px-4 py-12">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div className="space-y-2">
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {strings.galleryTitle}
              </p>
              <h2 className="text-2xl font-bold">{strings.visitGallery}</h2>
            </motion.div>

            <motion.div
              className="grid grid-cols-3 gap-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {galleryPreview.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link href="/(tabs)/gallery" className="block">
                    <div className="group relative h-32 w-full cursor-pointer overflow-hidden rounded-2xl">
                      <Image
                        src={item.cloudinaryUrl}
                        alt={item.title ?? "Gallery"}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <Link href="/(tabs)/gallery" className="block">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl font-semibold"
                >
                  {strings.viewGallery}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </section>
      )}

      {/* Contact Section */}
      <section className="px-4 py-12">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div className="space-y-2">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {strings.contactSectionTitle}
            </p>
            <h2 className="text-2xl font-bold">
              {strings.contactSectionTitle}
            </h2>
          </motion.div>

          <motion.div
            className="grid gap-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Call Button */}
            <motion.div variants={itemVariants}>
              <a
                href={`tel:${contactPhone.replace(/\s/g, "")}`}
                className="block"
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="group border-border/60 hover:border-primary/50 flex cursor-pointer items-center gap-4 p-4 transition-all">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                      <Phone className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {allTranslations.contact[language].callButton}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {contactPhone}
                      </p>
                    </div>
                    <ArrowRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                  </Card>
                </motion.div>
              </a>
            </motion.div>

            {/* WhatsApp Button */}
            <motion.div variants={itemVariants}>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\s/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="group border-border/60 hover:border-primary/50 flex cursor-pointer items-center gap-4 p-4 transition-all">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                      <WhatsAppIcon className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">WhatsApp</h3>
                      <p className="text-muted-foreground text-sm">
                        {allTranslations.contact[language].whatsappDesc}
                      </p>
                    </div>
                    <ArrowRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                  </Card>
                </motion.div>
              </a>
            </motion.div>

            {/* Instagram Button */}
            <motion.div variants={itemVariants}>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="group border-border/60 hover:border-primary/50 flex cursor-pointer items-center gap-4 p-4 transition-all">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10">
                      <Instagram className="h-6 w-6 text-pink-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {allTranslations.contact[language].instagramTitle}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {allTranslations.contact[language].instagramDesc}
                      </p>
                    </div>
                    <ArrowRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                  </Card>
                </motion.div>
              </a>
            </motion.div>
          </motion.div>

          <Link href="/(tabs)/contact" className="block">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl font-semibold"
              >
                {allTranslations.contact[language].title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-12">
        <motion.div
          className="from-primary/10 via-primary/5 space-y-6 rounded-3xl bg-linear-to-r to-transparent p-8 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div className="space-y-3">
            <h2 className="text-2xl font-bold">Ready to Play?</h2>
            <p className="text-muted-foreground">
              Book your premium turf slot today and experience the difference.
            </p>
          </motion.div>

          <Link href="/(tabs)/book" className="block">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Button className="h-12 gap-2 rounded-xl px-8 text-base font-semibold">
                {strings.bookNow}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* Footer Spacing */}
      <div className="h-8" />
    </motion.div>
  );
}
