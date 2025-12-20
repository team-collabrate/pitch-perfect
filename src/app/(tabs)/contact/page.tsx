"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";
import { Instagram, Phone } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { LocationWidget } from "~/components/location-widget";
import { WhatsAppIcon } from "~/components/ui/whatsapp-icon";

const whatsappNumber = "+917358848765";
const instagramUrl = "https://www.instagram.com/+917358848765/?hl=en";

const MotionCard = motion(Card);
const MotionButton = motion(Button);

export default function ContactPage() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.contact[language], [language]);

  const contacts = useMemo(
    () => [
      {
        name: strings.frontDesk,
        phone: "+91 73588 48765",
      },
    ],
    [strings],
  );

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.header
        className="space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {strings.subtitle}
        </p>
        <h1 className="text-2xl font-semibold">{strings.title}</h1>
      </motion.header>

      <MotionCard
        className="gap-4 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div>
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {strings.managementTitle}
          </h2>
          <ul className="mt-3 space-y-3 text-sm">
            {contacts.map((contact, index) => (
              <li key={contact.phone}>
                <motion.div
                  className="flex items-center justify-between"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div>
                    <p className="text-foreground font-medium">
                      {contact.name}
                    </p>
                    <Link
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {contact.phone}
                    </Link>
                  </div>
                  <MotionButton
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Link
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="flex items-center gap-1"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {strings.callButton}
                    </Link>
                  </MotionButton>
                </motion.div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-foreground font-semibold">{strings.emailLabel}</p>
          <Link
            href="mailto:support@pitchperfectapk.com"
            className="text-muted-foreground hover:text-primary"
          >
            {strings.emailAddress}
          </Link>
        </div>
        {/* <div className="space-y-2 text-sm">
          <p className="text-foreground font-semibold">Business hours</p>
          <p className="text-muted-foreground">
            Monday – Sunday · 05:00 AM – 11:00 PM
          </p>
        </div> */}
      </MotionCard>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
      >
        <LocationWidget />
      </motion.div>

      <MotionCard
        className="items-start gap-4 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
      >
        <div>
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {strings.instagramTitle}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {strings.instagramDesc}
          </p>
        </div>
        <MotionButton
          asChild
          className="w-full rounded-full"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        >
          <Link
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <Instagram className="h-5 w-5" />
            {strings.instagramCTA}
          </Link>
        </MotionButton>
      </MotionCard>

      <MotionCard
        className="items-start gap-4 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <div>
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {strings.whatsappTitle}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {strings.whatsappDesc}
          </p>
        </div>
        <MotionButton
          asChild
          className="w-full rounded-full"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        >
          <Link
            href={`https://wa.me/${whatsappNumber}?text=Hi%20Pitch%20Perfect%2C%20I%20need%20help%20with%20a%20booking.`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {strings.whatsappCTA}
          </Link>
        </MotionButton>
      </MotionCard>
    </motion.div>
  );
}
