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
  FileText,
  CreditCard,
  Truck,
  Undo,
  AlertTriangle,
  Globe,
  Scale,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { WhatsAppIcon } from "~/components/ui/whatsapp-icon";
import { Card } from "~/components/ui/card";
import { FooterBranding } from "~/components/footer-branding";

const s = {
  en: {
    title: "Privacy Policy",
    subtitle: "Your privacy matters",
    effectiveDate: "Effective Date: 01-04-2026",
    intro:
      "At Pitch Perfect (pitchperfect.turf), we value your privacy and are committed to safeguarding your personal information. This Privacy Policy outlines how we collect, use, disclose, and protect your data when you visit or make a purchase from our website. By using our website, you agree to the terms described in this policy.",
    collectionTitle: "Information We Collect",
    collectionDesc:
      "We collect personal information that you voluntarily provide to us when you place orders, sign up, or contact us. This includes: Full Name, Email Address, Phone Number, Shipping & Billing Address, Payment Details (processed securely via third-party gateways). We may also automatically collect: IP Address, Browser Type & Device Information, Pages Visited and Time Spent, Cookies and Usage Data.",
    usageTitle: "How We Use Your Information",
    usageDesc:
      "We use the collected data for: Processing and delivering your orders; Providing customer support and responding to queries; Sending order updates and service-related notifications; Sending promotional emails/offers (you can opt out anytime); Improving website performance and user experience; Complying with legal obligations.",
    cookiesTitle: "Cookies and Tracking Technologies",
    cookiesDesc:
      "We use cookies and similar technologies to enhance your browsing experience. Cookies help us: Remember user preferences; Analyze website traffic; Improve functionality. You can disable cookies anytime through your browser settings.",
    productsTitle: "Products and Services",
    productsDesc:
      "We strive to display our products as accurately as possible. However: Product colors may vary slightly due to screen settings and lighting conditions; All products are subject to availability; We reserve the right to modify, update, or discontinue any product at any time without prior notice.",
    pricingTitle: "Pricing",
    pricingDesc:
      "All prices are listed in Indian Rupees (INR). Prices are inclusive of applicable taxes unless stated otherwise. We reserve the right to change pricing, discounts, or offers at any time without prior notice.",
    ordersTitle: "Orders",
    ordersDesc:
      "Once you place an order, you will receive an order confirmation email. This email is only an acknowledgment and does not guarantee acceptance of the order. We reserve the right to cancel or refuse any order due to: Product unavailability; Pricing errors; Suspicious or fraudulent activity.",
    paymentTitle: "Payment",
    paymentDesc:
      "We accept multiple payment methods including: Credit/Debit Cards, UPI, Net Banking, Cash on Delivery (COD) (if available). Additional charges may apply for COD orders.",
    shippingTitle: "Shipping",
    shippingDesc:
      "We offer shipping across India. Estimated delivery timelines are mentioned on product pages but may vary due to: Courier delays; Weather conditions; Public holidays or unforeseen circumstances.",
    returnsTitle: "Returns and Refunds",
    returnsDesc:
      "Please refer to our Return & Refund Policy page for complete details regarding eligibility, process, and timelines.",
    securityTitle: "How We Protect Your Information",
    securityDesc:
      "We implement industry-standard security measures to protect your personal data from unauthorized access, misuse, or disclosure. However, please note: No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
    sharingTitle: "Information Sharing",
    sharingDesc:
      "We do not sell or rent your personal data. However, we may share your information with: Service Providers (payment gateways, logistics partners, marketing tools); Legal Requirements (if required by law or to protect our legal rights and prevent fraud).",
    rightsTitle: "Your Rights",
    rightsDesc:
      "You have the right to: Access or update your personal data; Request deletion of your data; Opt out of marketing emails anytime; Withdraw consent for data usage. To exercise these rights, contact us at support@pitchperfectapk.com.",
    thirdPartyTitle: "Third-Party Links",
    thirdPartyDesc:
      "Our website may include links to third-party websites. We are not responsible for their privacy practices. We recommend reviewing their policies before sharing any personal information.",
    childrenTitle: "Children's Privacy",
    childrenDesc:
      "Our website is not intended for individuals under the age of 18. We do not knowingly collect data from children. If such data is identified, it will be deleted promptly.",
    useTitle: "Use of Website",
    useDesc:
      "You agree not to misuse the website. Prohibited activities include: Hacking or unauthorized access; Spreading malware or viruses; Spamming or fraudulent activity. Violation may result in termination of access and legal action.",
    ipTitle: "Intellectual Property",
    ipDesc:
      "All content on this website, including logos, images, product designs, text and graphics are the property of Pitch Perfect and are protected under applicable copyright laws. Unauthorized use or reproduction is strictly prohibited.",
    liabilityTitle: "Limitation of Liability",
    liabilityDesc:
      "Pitch Perfect shall not be held liable for any: Direct or indirect damages; Loss of data or profits; Issues arising from the use or inability to use our website or products.",
    changesTitle: "Changes to This Policy",
    changesDesc:
      "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated Effective Date.",
    lawTitle: "Governing Law",
    lawDesc:
      "This Privacy Policy is governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Virudhunagar, Tamil Nadu, India.",
    contactTitle: "Contact Us",
    contactDesc:
      "If you have any questions or concerns regarding this Privacy Policy, please contact us:",
    phoneLabel: "Call & WhatsApp",
    phoneNumber: "+91 73588 48765",
    emailLabel: "Email Us",
    emailAddress: "support@pitchperfectapk.com",
    whatsappCTA: "Chat on WhatsApp",
    addressLabel: "Address",
    address:
      "12/4A, Pitch Perfect Turf, Aruppukottai Main Road, Chockalingampuram, Nethaji Road, Aruppukottai, Virudhunagar, Tamil Nadu - 626101",
    consent:
      "By using our website, you consent to this Privacy Policy and agree to its terms.",
  },
};

const sections = [
  { icon: Database, key: "collection" },
  { icon: Share2, key: "usage" },
  { icon: Shield, key: "cookies" },
  { icon: FileText, key: "products" },
  { icon: CreditCard, key: "pricing" },
  { icon: CreditCard, key: "orders" },
  { icon: CreditCard, key: "payment" },
  { icon: Truck, key: "shipping" },
  { icon: Undo, key: "returns" },
  { icon: Lock, key: "security" },
  { icon: Share2, key: "sharing" },
  { icon: User, key: "rights" },
  { icon: Globe, key: "thirdParty" },
  { icon: AlertTriangle, key: "children" },
  { icon: AlertTriangle, key: "use" },
  { icon: Shield, key: "ip" },
  { icon: AlertTriangle, key: "liability" },
  { icon: Clock, key: "changes" },
  { icon: Scale, key: "law" },
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
          <p className="text-muted-foreground text-sm leading-relaxed">
            {s.en.intro}
          </p>
        </Card>
      </motion.div>

      {sections.map((section, index) => {
        const sectionKey = section.key as keyof typeof s.en;
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
                  <p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">
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
