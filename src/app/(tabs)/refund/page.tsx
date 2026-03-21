"use client";

import { motion } from "framer-motion";
import {
  RotateCcw,
  Clock,
  AlertCircle,
  Phone,
  FileText,
  Info,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { WhatsAppIcon } from "~/components/ui/whatsapp-icon";
import { Card } from "~/components/ui/card";
import { FooterBranding } from "~/components/footer-branding";

const s = {
  en: {
    title: "Refund & Cancellation Policy",
    subtitle: "Our refund terms",
    intro:
      "At Pitch Perfect Turf, we strive to provide the best possible service. This policy outlines our refund and cancellation terms.",
    cancellationTitle: "Cancellation Terms",
    cancellationDesc:
      "You may cancel your booking at least 24 hours before your scheduled slot time to receive a full refund.",
    refundTimeTitle: "Refund Processing Time",
    refundTimeDesc:
      "Refunds, once approved, will be processed within 5-7 business days and credited to your original payment method.",
    noRefundTitle: "No Refund Conditions",
    noRefundDesc:
      "No refunds will be provided for cancellations made less than 1 hour before the scheduled slot time. No-shows will not be eligible for any refund.",
    contactTitle: "Contact for Refunds",
    contactDesc: "For refund requests or queries, please contact us.",
    phoneLabel: "Call Us",
    phoneNumber: "+91 73588 48765",
    emailLabel: "Email Us",
    emailAddress: "support@pitchperfectapk.com",
    whatsappLabel: "WhatsApp",
    whatsappCTA: "Chat on WhatsApp",
    howToTitle: "How to Request a Refund",
    howToDesc:
      "To request a refund, contact our support team with your booking details including your booking code and phone number used for the booking.",
    noteTitle: "Important Note",
    noteDesc:
      "All refunds are subject to verification. Please ensure you have your booking confirmation code ready when requesting a refund.",
  },
  ta: {
    title: "திரும்பப் பணம் & ரத்துக் கொள்கை",
    subtitle: "எங்கள் திரும்பப் பணம் விதிமுறைகள்",
    intro: "பிட்ச் பெர்பெக்டில், சிறந்த சேவையை வழங்க முயற்சிக்கிறோம்.",
    cancellationTitle: "ரத்து விதிமுறைகள்",
    cancellationDesc:
      "முழு திரும்பப் பணத்தைப் பெற உங்கள் திட்டமிடப்பட்ட நேரத்திற்கு 24 மணி முன்னதாக உங்கள் முன்பதிவை ரத்து செய்யலாம.",
    refundTimeTitle: "திரும்பப் பணம் செயலாக்க நேரம்",
    refundTimeDesc:
      "ஒரு முறை அனுமதிக்கப்பட்டதுமிருந்து, 5-7 வணிக நாட்களுக்குள் செயலாக்கப்படு உங்கள் அசல் கட்டண முறைக்கு வரவு வைக்கப்படும்.",
    noRefundTitle: "திரும்பப் பணம் கிடைக்காது",
    noRefundDesc:
      "திட்டமிடப்பட்ட நேரத்திற்கு 1 மணி முன்னதாக ரத்து செய்தவர்களுக்கு திரும்பப் பணம் கிடைக்காது. வராதவர்களுக்கு எந்தத் திரும்பப் பணமும் கிடைக்காது.",
    contactTitle: "திரும்பப் பணத்திற்கு தொடர்பு",
    contactDesc:
      "திரும்பப் பண கோரிக்கைகள் அல்லது வினவல்களுக்கு, எங்களைத் தொடர்புக்கொள்ளவும்.",
    howToTitle: "திரும்பப் பணம் கோருவது எப்படி",
    howToDesc:
      "திரும்பப் பணம் கோர,உங்கள் முன்பதிவு குறியீடு மற்றும் முன்பதிவுக்கு பயன்படுத்திய தொலைபேசி எண் உட்பட உங்கள் முன்பதிவு விவரங்களுடன் எங்கள் ஆதரவு குழுவைத் தொடர்புக்கொள்ளவும்.",
    noteTitle: "முக்கிய குறிப்பு",
    noteDesc: "எல்லாத் திரும்பப் பணமும் சரிபார்ப்புக்கு உட்பட.",
  },
};

const sections = [
  { icon: RotateCcw, key: "cancellation" },
  { icon: Clock, key: "refundTime" },
  { icon: AlertCircle, key: "noRefund" },
  { icon: FileText, key: "howTo" },
];

export default function RefundPage() {
  return (
    <div className="space-y-6 p-6 pb-24">
      <motion.header
        className="space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {s.en.subtitle}
        </p>
        <h1 className="text-2xl font-semibold">{s.en.title}</h1>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          {s.en.intro}
        </p>
      </motion.div>

      {sections.map((section, index) => {
        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}
          >
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <section.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {(s.en as any)[`${section.key}Title` as keyof typeof s.en]}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {(s.en as any)[`${section.key}Desc` as keyof typeof s.en]}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{s.en.phoneLabel}</h3>
                <Link
                  href={`tel:${s.en.phoneNumber.replace(/\s+/g, "")}`}
                  className="text-muted-foreground hover:text-primary mt-1 block text-sm"
                >
                  {s.en.phoneNumber}
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{s.en.emailLabel}</h3>
                <Link
                  href={`mailto:${s.en.emailAddress}`}
                  className="text-muted-foreground hover:text-primary mt-1 block text-sm"
                >
                  {s.en.emailAddress}
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <WhatsAppIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{s.en.whatsappLabel}</h3>
                <Link
                  href={`https://wa.me/917358848765?text=Hi%20Pitch%20Perfect%2C%20I%20have%20a%20question%20about%20refunds.`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary mt-1 block text-sm"
                >
                  {s.en.whatsappCTA}
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card className="border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amber-600 dark:text-amber-400">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{s.en.noteTitle}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {s.en.noteDesc}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <FooterBranding className="mt-8 rounded-xl" />
    </div>
  );
}
