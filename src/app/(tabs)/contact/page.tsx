"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
                    <p className="font-medium text-foreground">{contact.name}</p>
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
                    <Link href={`tel:${contact.phone.replace(/\s+/g, "")}`}>Call</Link>
                  </MotionButton>
                </motion.div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-foreground">Email</p>
          <Link
            href="mailto:hello@pitchperfect.turf"
            className="text-muted-foreground hover:text-primary"
          >
            hello@pitchperfect.turf
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-foreground">Business hours</p>
          <p className="text-muted-foreground">Monday – Sunday · 05:00 AM – 11:00 PM</p>
        </div>
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
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.1740533169855!2d78.103!3d10.998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU5JzUyLjgiTiA3OMKwMDYnMTAuOCJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            className="h-full w-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>
        <div className="p-4 text-sm text-muted-foreground">
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            WhatsApp
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reach us instantly for slot checks, reschedules and quick clarifications.
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
          >
            Chat on WhatsApp
          </Link>
        </MotionButton>
      </MotionCard>
    </motion.div>
  );
}
