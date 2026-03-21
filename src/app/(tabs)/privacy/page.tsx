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
} from "lucide-react";
import Link from "next/link";
import { WhatsAppIcon } from "~/components/ui/whatsapp-icon";
import { Card } from "~/components/ui/card";
import { FooterBranding } from "~/components/footer-branding";

const s = {
  en: {
    title: "Privacy Policy",
    subtitle: "Your privacy matters",
    intro:
      "At Pitch Perfect Turf, we are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information.",
    collectionTitle: "Information We Collect",
    collectionDesc:
      "We collect personal information that you voluntarily provide to us when you register on the app, express an interest in obtaining information about us or our products and services, when you participate in activities on the app, or otherwise when you contact us.",
    usageTitle: "How We Use Your Information",
    usageDesc:
      "We use personal information collected via our app for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.",
    sharingTitle: "Information Sharing",
    sharingDesc:
      "We only share information with the following third parties: payment processors, data analytics services, and cloud storage services.",
    securityTitle: "How We Protect Your Information",
    securityDesc:
      "We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.",
    rightsTitle: "Your Rights",
    rightsDesc:
      "You have the right to access, correct, or delete your personal information. You may also request restriction of processing or object to processing of your personal data. To exercise these rights, please contact us.",
    changesTitle: "Changes to This Policy",
    changesDesc:
      "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page. You are advised to review this Privacy Policy periodically for any changes.",
    contactTitle: "Contact Us",
    contactDesc:
      "If you have questions or comments about this policy, you may email us at support@pitchperfectapk.com.",
    phoneLabel: "Call Us",
    phoneNumber: "+91 73588 48765",
    emailLabel: "Email Us",
    emailAddress: "support@pitchperfectapk.com",
    whatsappLabel: "WhatsApp",
    whatsappCTA: "Chat on WhatsApp",
  },
  ta: {
    title: "தனியுரிமைக் கொள்கை",
    subtitle: "உங்கள் தனியுரிமை முக்கியம்",
    intro:
      "பிட்ச் பெர்பெக்ட் டர்ப்பில், உங்கள் தனிப்பட்ட தகவலைப் பாதுகாப்பதற்கும் உங்கள் தனியுரிமை உரிமையைப் பாதுகாப்பதற்கும் நாங்கள் அர்ப்பணித்துள்ளோம்.",
    collectionTitle: "நாங்கள் சேகரித்த தகவல்",
    collectionDesc:
      "நீங்கள் பதிவு செய்யும்போது,எங்கள் பற்றி அல்லது எங்கள் தயாரிப்புகள் மற்றும் சேவைகள் பற்றி தகவல் பெற தெரிவித்தும்போது, பயன்பாட்டில் நடவடிக்கைகளில் பங்கேர்க்கும்போது, அல்லதுநீங்கள் எங்களைத் தொடர்புக்கொள்ளும்போது உங்கள் விருப்பத்தின் பேரில் வழங்கும் தனிப்பட்ட தகவலை நாங்கள் சேகரிக்கிறோம்.",
    usageTitle: "உங்கள் தகவலை எவ்வாறு பயன்படுத்துகிறோம்",
    usageDesc:
      "கீழே விவரிக்கப்பட்டுள்ள வணிக நோக்கங்களுக்காக பயன்பாட்டின் மூலம் சேகரிக்கப்பட்ட தனிப்பட்ட தகவலை நாங்கள் பல்வேறு வகையான பயன்படுத்துகிறோம்.",
    sharingTitle: "தகவல் பகிர்வு",
    sharingDesc:
      "நாங்கள் பின்வரும் மூன்றாவத் தரப்பினருடன் மட்டுமே தகவலைப் பகிர்கிறோம்: கட்டணம் செயலி, தரவு பகுப்பாய்வு சேவைகள், மேக சேமிப்பு சேவைகள்.",
    securityTitle: "உங்கள் தகவலை எவ்வாறு பாதுகாக்கிறோம்",
    securityDesc:
      "நாங்கள் செயலாக்கம் செய்யக்கூடிய தனிப்பட்ட தகவல்களின் பாதுகாப்பைப் பாதுகாப்பதற்கு பொருத்தமான தொழில் நுட்ப மற்றும் நிறுவன பாதுகாப்பு நடவடிக்கைகளை செயலாக்கியுள்ளோம்.",
    rightsTitle: "உங்கள் உரிமைகள்",
    rightsDesc:
      "உங்கள் தனிப்பட்ட தகவலை அணுக, சரி செய்ய அல்லது நீக்க உங்களுக்கு உரிமை உள்ளது. உங்கள் தனிப்பட்ட தகவலின் செயலாக்கத்தைக் கோரவோ எதிர்க்கவோ நீங்கள் கோரலாம். இந்த உரிமைகளைச் செலுத்த, தயவுசெய்து எங்களைத் தொடர்புக்கொள்ளவும்.",
    changesTitle: "இந்தக் கொள்கையில் மாற்றங்கள்",
    changesDesc:
      "இந்தத் தனியுரிமைக் கொள்கையை நாங்கள் времяம் தோறும் புதுப்பிக்கலாம். மாற்றங்களை இந்தப் பக்கத்தில் பதிவிடுவதன் மூலம் உங்களுக்குத் தெரிவிப்போம்.எந்த மாற்றங்களுக்கும் இந்தத் தனியுரிமைக் கொள்கையைக் கூடுதலாகப் படிக்க உங்களைக் கேட்டுக்கொள்கிறோம்.",
    contactTitle: "எங்களைத் தொடர்புக்கொள்ள",
    contactDesc:
      "இந்தக் கொள்கை பற்றி கேள்விகள் அல்லது கருத்துகள் இருந்தால், நீங்கள் support@pitchperfectapk.comஇல் மின்னஞ்சல் அனுப்பலாம்.",
  },
};

const sections = [
  { icon: Database, key: "collection" },
  { icon: Share2, key: "usage" },
  { icon: Share2, key: "sharing" },
  { icon: Lock, key: "security" },
  { icon: User, key: "rights" },
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
        const sectionKey = section.key as keyof typeof s.en;
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
                    {(s.en as any)[`${sectionKey}Title` as keyof typeof s.en]}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {(s.en as any)[`${sectionKey}Desc` as keyof typeof s.en]}
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
                  href={`https://wa.me/917358848765?text=Hi%20Pitch%20Perfect%2C%20I%20have%20a%20question%20about%20the%20privacy%20policy.`}
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
