"use client";

import { useLanguage } from "~/lib/language-context";
import { motion } from "framer-motion";
import {
  Target,
  Eye,
  MapPin,
  CheckCircle2,
  Building2,
  User,
  Award,
} from "lucide-react";
import { Card } from "~/components/ui/card";
import { FooterBranding } from "~/components/footer-branding";

const s = {
  en: {
    title: "About Us",
    subtitle: "Who we are",
    description:
      "Welcome to Pitch Perfect Turf, the premier sports turf booking destination in Virudhunagar. We provide world-class turf facilities for cricket and football enthusiasts who demand the best playing experience.",
    missionTitle: "Our Mission",
    missionDesc:
      "To provide accessible, high-quality sports facilities that bring people together through the love of the game.",
    visionTitle: "Our Vision",
    visionDesc:
      "To become the most trusted name in sports turf booking, creating memorable experiences for players of all skill levels.",
    featuresTitle: "Why Choose Us",
    feature1: "Professional Turf Quality",
    feature2: "Day & Night Matches",
    feature3: "Premium Floodlights",
    feature4: "Easy Online Booking",
    facilityTitle: "Our Facility",
    facilityDesc:
      "Located in Chockalingampuram on Madurai–Tuticorin Highway, Aruppukottai, our turf campus features well-maintained grounds, modern amenities, and a café for refreshments. Whether you're a professional athlete or just starting out, we have the perfect slot for you.",
    historyTitle: "Our Story",
    historyDesc:
      "Founded in May 2024, Pitch Perfect Turf was established with a vision to bring professional-grade sports facilities to our community. What started as a dream to provide quality playing spaces has grown into a trusted destination for sports enthusiasts across Virudhunagar district.",
    founderTitle: "Our Founder",
    founderDesc:
      "Led by Prahadhi S, our founder envisioned creating a space where players of all skill levels could enjoy the game they love on premium turf facilities. With a commitment to quality and customer satisfaction, we continue to grow and serve our community.",
    udyamTitle: "Registered MSME",
    udyamDesc:
      "Pitch Perfect Turf is a registered Micro Enterprise under Udyam Registration No. UDYAM-TN-32-0068371, committed to quality service and transparent business practices.",
  },
  ta: {
    title: "எங்களைப் பற்றி",
    subtitle: "நாங்கள் யார்",
    description:
      "பிட்ச் பெர்பெக்டுக்கு வரவேற்கிறோம், நகரத்தின் முன்னணி விளையாட்டு திடல் முன்பதிவு இடமாகும். சிறந்த விளையாட்டு அனுபவத்தை விரும்பும் கிரிக்கெட் மற்றும் கால்பந்து ஆர்வலர்களுக்கு உலகத் தரமான திடல் வசதிகளை வழங்குகிறோம்.",
    missionTitle: "எங்கள் இலக்கு",
    missionDesc:
      "விளையாட்டு மூலம் மக்களை ஒன்றிணைக்கக்கூடிய அணுகக்கூடிய, உயர்தர விளையாட்டு வசதிகளை வழங்குவதே எங்கள் இலக்கு.",
    visionTitle: "எங்கள் பார்வை",
    visionDesc:
      "விளையாட்டு திடல் முன்பதிவில் மிகவும் நம்பகமான பெயராக மாறி, அனைத்து திறமை நிலைகளையும் சேர்ந்த வீரர்களுக்கு மனதில் நினைவக்கூடிய அனுபவங்களை உருவாக்குவதே எங்கள் பார்வை.",
    featuresTitle: "எங்களை ஏன் தேர்வு செய்ய வேண்டும்",
    feature1: "தரமான சர்வதேச விளையாட்டு திடல்",
    feature2: "பகல் மற்றும் இரவுப் போட்டிகள்",
    feature3: "பிரீமியம் மின்விளக்கு வசதி",
    feature4: "எளிதான ஆன்லைன் முன்பதிவு",
    facilityTitle: "எங்கள் வளாகம்",
    facilityDesc:
      "நகரத்தின் மையத்தில் அமைந்துள்ள எங்கள் திடல் வளாகம், நன்கு பராமரிக்கப்படும் மைதானங்கள், நவீன வசதிகள் மற்றும் சிற்றுண்டிக்கான கஃபே ஆகியவற்றைக் கொண்டுள்ளது. நீங்கள் ஒரு தொழில்முறை வீரராக இருந்தாலும் அல்லது புதிதாகத் தொடங்குகிறவராக இருந்தாலும், உங்களுக்கு சரியான நேரம் உள்ளது.",
  },
};

const features = [
  { icon: CheckCircle2, key: "feature1" },
  { icon: CheckCircle2, key: "feature2" },
  { icon: CheckCircle2, key: "feature3" },
  { icon: CheckCircle2, key: "feature4" },
];

export default function AboutPage() {
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
          {s.en.description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{s.en.missionTitle}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {s.en.missionDesc}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{s.en.visionTitle}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {s.en.visionDesc}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.section
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <h2 className="text-lg font-semibold">{s.en.featuresTitle}</h2>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <Card key={feature.key} className="flex items-center gap-2 p-3">
              <feature.icon className="text-primary h-4 w-4 shrink-0" />
              <span className="text-muted-foreground text-xs">
                {(s.en as any)[feature.key]}
              </span>
            </Card>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold">{s.en.facilityTitle}</h2>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <MapPin className="h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {s.en.facilityDesc}
            </p>
          </div>
        </Card>
      </motion.section>

      <motion.section
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <h2 className="text-lg font-semibold">{s.en.historyTitle}</h2>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Building2 className="h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {s.en.historyDesc}
            </p>
          </div>
        </Card>
      </motion.section>

      <motion.section
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold">{s.en.founderTitle}</h2>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <User className="h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {s.en.founderDesc}
            </p>
          </div>
        </Card>
      </motion.section>

      <motion.section
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <h2 className="text-lg font-semibold">{s.en.udyamTitle}</h2>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Award className="h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {s.en.udyamDesc}
            </p>
          </div>
        </Card>
      </motion.section>

      <FooterBranding className="mt-8 rounded-xl" />
    </div>
  );
}
