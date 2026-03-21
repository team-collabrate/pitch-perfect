"use client";

import { motion } from "framer-motion";
import {
  FileText,
  CalendarCheck,
  CreditCard,
  Shield,
  Gavel,
  Clock,
  Phone,
  Mail,
  Copyright,
} from "lucide-react";
import Link from "next/link";
import { WhatsAppIcon } from "~/components/ui/whatsapp-icon";
import { Card } from "~/components/ui/card";
import { FooterBranding } from "~/components/footer-branding";

const s = {
  en: {
    title: "Terms and Conditions",
    subtitle: "Please read carefully",
    intro:
      "Welcome to Pitch Perfect Turf. By accessing and using our mobile application and services, you agree to be bound by these Terms and Conditions.",
    acceptanceTitle: "Acceptance of Terms",
    acceptanceDesc:
      "By downloading, installing, or using the Pitch Perfect Turf app, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.",
    bookingTitle: "Booking Terms",
    bookingDesc:
      "All bookings are subject to availability. A booking is confirmed only after successful payment. You agree to provide accurate and complete information during the booking process.",
    paymentTitle: "Payment Terms",
    paymentDesc:
      "We accept payments through secure payment gateways. All payments are processed in Indian Rupees (INR). Prices are subject to change without prior notice.",
    cancellationTitle: "Cancellation & Refund Policy",
    cancellationDesc:
      "Cancellations must be made at least 24 hours before the booked slot time for a full refund. Refunds are not available for cancellations made less than 1 hour before the slot time. Please refer to our Refund Policy for more details.",
    conductTitle: "Code of Conduct",
    conductDesc:
      "Users must conduct themselves in a respectful manner. Any form of abuse, harassment, or violation of facility rules will result in immediate termination of booking without refund.",
    liabilityTitle: "Limitation of Liability",
    liabilityDesc:
      "Pitch Perfect Turf shall not be liable for any indirect, incidental, or consequential damages arising out of the use of our services.",
    ipTitle: "Intellectual Property",
    ipDesc:
      "All content, logos, designs, and materials on our app and website are the intellectual property of Pitch Perfect Turf. Unauthorized reproduction, distribution, or use of these materials is strictly prohibited and may result in legal action.",
    changesTitle: "Changes to Terms",
    changesDesc:
      "We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.",
    contactTitle: "Contact Information",
    contactDesc:
      "For questions about these Terms and Conditions, please contact us at support@pitchperfectapk.com.",
    phoneLabel: "Call Us",
    phoneNumber: "+91 73588 48765",
    emailLabel: "Email Us",
    emailAddress: "support@pitchperfectapk.com",
    whatsappLabel: "WhatsApp",
    whatsappCTA: "Chat on WhatsApp",
  },
  ta: {
    title: "விதிமுறைகள் மற்றும் நிபந்தனைகள்",
    subtitle: "தயவுசெய்து கவனமாக படிக்கவும்",
    intro: "பிட்ச் பெர்பெக்டுக்கு வரவேற்கிறோம்.",
    acceptanceTitle: "விதிமுறைகளை ஏற்க",
    acceptanceDesc:
      "பிட்ச் பெர்பெக்ட் பயன்பாட்டைப் பதிவிறக்கம் செய்வதன் மூலம்,நீங்கள் இந்த விதிமுறைகளைப் படித்து,புரிந்து,ஏற்க ஒப்புக்கொள்கிறீர்கள்.",
    bookingTitle: "முன்பதிவு விதிமுறைகள்",
    bookingDesc:
      "எல்லாமுன்பதிவுகளும் கிடைக்கக் கூடியதற்கு உட்பட. முன்பதிவு வெற்றிகரமான கட்டணத்திற்குப் பிறகுதான் உறுதிப்படுத்தப்படும்.",
    paymentTitle: "கட்டண விதிமுறைகள்",
    paymentDesc:
      "நாங்கள் பாதுகாப்பான கட்டண நுழைவு வழியாக கட்டணங்களை ஏற்கிறோம்.",
    cancellationTitle: "ரத்து & திரும்பப் பணம் கொள்கை",
    cancellationDesc:
      "முழு திரும்பப் பணத்திற்கு, முன்பதிவு செய்த நேரத்திற்கு 24 மணி முன்னதாக ரத்து செய்ய வேண்டும்.",
    conductTitle: "நடத்தை விதிமுறைகள்",
    conductDesc: "பயனர்கள் மரியாதையான முறையில் நடந்துகொள்ள வேண்டும்.",
    liabilityTitle: "பொறுப்பு வரம்பு",
    liabilityDesc:
      "எங்கள் சேவைகளின் பயன்பாட்டின் விளைவாக ஏதேனும் பொறுப்புகளுக்கு பிட்ச் பெர்பெக்ட் பொறுப்பாகாது.",
    changesTitle: "விதிமுறைகளில் மாற்றங்கள்",
    changesDesc: "இந்த விதிமுறைகளைஎந்த நேரத்திலும் மாற்ற உரிமை உண்டு.",
    contactTitle: "தொடர்பு தகவல்",
    contactDesc:
      "இந்த விதிமுறைகள் மற்றும் நிபந்தனைகள் பற்றி கேள்விகள் இருந்தால்,எங்களைத் தொடர்புக்கொள்ளவும்.",
  },
};

const sections = [
  { icon: FileText, key: "acceptance" },
  { icon: CalendarCheck, key: "booking" },
  { icon: CreditCard, key: "payment" },
  { icon: Shield, key: "cancellation" },
  { icon: Gavel, key: "conduct" },
  { icon: Shield, key: "liability" },
  { icon: Copyright, key: "ip" },
  { icon: Clock, key: "changes" },
];

export default function TermsPage() {
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
        transition={{ duration: 0.4, delay: 0.35 }}
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
                  href={`https://wa.me/917358848765?text=Hi%20Pitch%20Perfect%2C%20I%20have%20a%20question%20about%20the%20terms%20and%20conditions.`}
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

      <FooterBranding className="mt-8 rounded-xl" />
    </div>
  );
}
