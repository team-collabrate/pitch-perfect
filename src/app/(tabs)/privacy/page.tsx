"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Database,
  Share2,
  Lock,
  Phone,
  Mail,
  User,
  Clock,
  Globe,
  Scale,
  MapPin,
  Eye,
  Server,
} from "lucide-react";
import Link from "next/link";
import { WhatsAppIcon } from "~/components/ui/whatsapp-icon";
import { Card } from "~/components/ui/card";
import { FooterBranding } from "~/components/footer-branding";

const s = {
  en: {
    title: "Privacy Policy",
    subtitle: "Your privacy matters",
    effectiveDate: "Effective Date: 30-03-2026",
    intro:
      "At Pitch Perfect (pitchperfect.turf), we value your privacy and are committed to safeguarding your personal information. This Privacy Policy outlines how we collect, use, disclose, and protect your data when you visit or make a purchase from our website.\n\nBy using our website, you agree to the terms described in this policy.",
    collectionTitle: "1. Information We Collect",
    collectionDesc:
      "To provide a seamless booking experience, we may collect the following types of information:\na) Personal Information\n\nWhen you interact with our website (place bookings, sign up, or contact us), we may collect:\n• Full Name\n• Email Address\n• Phone Number\n• Booking Details\n• Payment Details (processed securely via third-party gateways)\n\nb) Non-Personal Information\n\nWe may automatically collect:\n• IP Address\n• Browser Type & Device Information\n• Pages Visited and Time Spent\n• Cookies and Usage Data",
    usageTitle: "2. How We Use Your Information",
    usageDesc:
      "We use the collected data for the following purposes:\n\n• To process and deliver your bookings\n• To provide customer support and respond to queries\n• To send booking updates and service-related notifications\n• To send promotional emails/offers (you can opt out anytime)\n• To improve website performance and user experience\n• To comply with legal obligations",
    cookiesTitle: "3. Cookies and Tracking Technologies",
    usageDesc2:
      "We use cookies and similar technologies to enhance your browsing experience. Cookies help us:\n\n• Remember user preferences\n• Analyze website traffic\n• Improve functionality\n\nYou can disable cookies anytime through your browser settings.",
    securityTitle: "4. Data Security",
    securityDesc:
      "We implement industry-standard security measures to protect your personal data from unauthorized access, misuse, or disclosure.\n\nHowever, please note:\nNo method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
    sharingTitle: "5. Sharing of Information",
    sharingDesc:
      "We do not sell or rent your personal data. However, we may share your information in the following cases:\na) Service Providers\n\nTrusted third parties (such as payment gateways, booking management tools) to complete your bookings.\nb) Legal Requirements\n\nIf required by law or to protect our legal rights and prevent fraud.",
    rightsTitle: "6. Your Rights and Choices",
    rightsDesc:
      "You have the right to:\n\n• Access or update your personal data\n• Request deletion of your data\n• Opt out of marketing emails anytime\n• Withdraw consent for data usage\n\nTo exercise these rights, contact us at: support@pitchperfectapk.com",
    thirdPartyTitle: "7. Third-Party Links",
    thirdPartyDesc:
      "Our website may include links to third-party websites. We are not responsible for their privacy practices. We recommend reviewing their policies before sharing any personal information.",
    childrenTitle: "8. Children's Privacy",
    childrenDesc:
      "Our website is not intended for individuals under the age of 18. We do not knowingly collect data from children. If such data is identified, it will be deleted promptly.",
    changesTitle: "9. Changes to This Policy",
    changesDesc:
      "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated Effective Date.",
    contactTitle: "10. Contact Us",
    contactDesc:
      "If you have any questions or concerns regarding this Privacy Policy, please contact us:",
    phoneLabel: "Call & WhatsApp",
    phoneNumber: "+91 7492982414",
    emailLabel: "Email Us",
    emailAddress: "support@pitchperfectapk.com",
    websiteLabel: "Website",
    websiteUrl: "https://pitchperfectapk.com/contact",
    whatsappCTA: "Chat on WhatsApp",
    addressLabel: "Address",
    address: "Sanskriti Apartment, Poket gh-1, Rohini Sec-28, Delhi 110042",
    consent:
      "By using our website, you consent to this Privacy Policy and agree to its terms.",
  },
};

const sections = [
  { icon: Database, key: "collection" },
  { icon: Share2, key: "usage" },
  { icon: Shield, key: "cookies" },
  { icon: Lock, key: "security" },
  { icon: Share2, key: "sharing" },
  { icon: User, key: "rights" },
  { icon: Globe, key: "thirdParty" },
  { icon: Eye, key: "children" },
  { icon: Clock, key: "changes" },
];

export default function PrivacyPage() {
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
        <p className="text-muted-foreground text-xs">{s.en.effectiveDate}</p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="p-6">
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
            {s.en.intro}
          </p>
        </Card>
      </motion.div>

      {sections.map((section, index) => {
        const sectionKey = section.key as keyof typeof s.en;
        let desc = (s.en as any)[
          `${sectionKey}Desc` as keyof typeof s.en
        ] as string;
        if (section.key === "cookies") {
          desc = s.en.usageDesc2;
        }
        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + index * 0.03 }}
          >
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <section.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {(s.en as any)[`${sectionKey}Title` as keyof typeof s.en]}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm whitespace-pre-line">
                    {desc}
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
          <div className="mb-4 flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{s.en.phoneLabel}</h3>
              <Link
                href={`tel:${s.en.phoneNumber.replace(/\s+/g, "")}`}
                className="text-muted-foreground hover:text-primary mt-1 block text-sm"
              >
                {s.en.phoneNumber}
              </Link>
            </div>
          </div>

          <div className="mb-4 flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{s.en.emailLabel}</h3>
              <Link
                href={`mailto:${s.en.emailAddress}`}
                className="text-muted-foreground hover:text-primary mt-1 block text-sm"
              >
                {s.en.emailAddress}
              </Link>
            </div>
          </div>

          <div className="mb-4 flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{s.en.websiteLabel}</h3>
              <Link
                href={s.en.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary mt-1 block text-sm"
              >
                {s.en.websiteUrl}
              </Link>
            </div>
          </div>

          <div className="mb-4 flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <WhatsAppIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">WhatsApp</h3>
              <Link
                href={`https://wa.me/917358848765?text=Hi%20Pitch%20Perfect%2C%20I%20have%20a%20question%20about%20the%20privacy%20policy.`}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary mt-1 block text-sm"
              >
                {s.en.whatsappCTA}
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{s.en.addressLabel}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {s.en.address}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="p-6">
          <p className="text-muted-foreground text-center text-sm italic">
            {s.en.consent}
          </p>
        </Card>
      </motion.div>

      <FooterBranding className="mt-8 rounded-xl" />
    </div>
  );
}
