"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Phone } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useLocation } from "~/lib/location-context";
import { WhatsAppIcon } from "~/components/ui/whatsapp-icon";

const contacts = [
  {
    name: "Front Desk",
    phone: "+91 98765 43210",
  },
  {
    name: "Ground Manager",
    phone: "+91 91234 56780",
  },
];

const whatsappNumber = "919123456780";

const MotionCard = motion(Card);
const MotionButton = motion(Button);

export default function ContactPage() {
  const { coords } = useLocation();
  return (
    <motion.div
      className="space-y-6 pb-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.header
        className="space-y-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          We are one call away
        </p>
        <h1 className="text-2xl font-semibold">Contact</h1>
      </motion.header>

      <MotionCard
        className="gap-4 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div>
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Management contacts
          </h2>
          <ul className="mt-3 space-y-3 text-sm">
            {contacts.map((contact, index) => (
              <li key={contact.phone}>
                <motion.div
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
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
                      Call
                    </Link>
                  </MotionButton>
                </motion.div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-foreground font-semibold">Email</p>
          <Link
            href="mailto:hello@pitchperfect.turf"
            className="text-muted-foreground hover:text-primary"
          >
            hello@pitchperfect.turf
          </Link>
        </div>
        {/* <div className="space-y-2 text-sm">
          <p className="text-foreground font-semibold">Business hours</p>
          <p className="text-muted-foreground">
            Monday – Sunday · 05:00 AM – 11:00 PM
          </p>
        </div> */}
      </MotionCard>

      <MotionCard
        className="overflow-hidden p-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
      >
        <div className="aspect-video">
          <iframe
            title="Pitch Perfect map"
            src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=17&output=embed`}
            className="h-full w-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>
        <div className="text-muted-foreground p-4 text-sm">
          <p>12/4A, Pitch Perfect Turf, Aruppukottai Main Road, Tamil Nadu.</p>
        </div>
      </MotionCard>

      <MotionCard
        className="items-start gap-4 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <div>
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            WhatsApp
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Reach us instantly for slot checks, reschedules and quick
            clarifications.
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
            Chat on WhatsApp
          </Link>
        </MotionButton>
      </MotionCard>
    </motion.div>
  );
}
