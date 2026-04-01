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
  Package,
  Tag,
  ShoppingCart,
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
    title: "Terms and Conditions",
    subtitle: "Please read carefully",
    intro:
      "Welcome to Pitch Perfect (pitchperfect.turf). By accessing or using our website, you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully before using our services.",
    generalTitle: "General",
    generalDesc:
      "These Terms & Conditions apply to all users of pitchperfect.turf (referred to as 'we,' 'us,' or 'our'). By using this website, you agree to follow these terms. If you do not agree, please do not use our website.",
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
      "We offer shipping across India. Estimated delivery timelines are mentioned on product pages but may vary due to:\n• Courier delays\n• Weather conditions\n• Public holidays or unforeseen circumstances.",
    returnsTitle: "Returns and Refunds",
    returnsDesc:
      "We want you to be completely satisfied with our service. Please review our refund policy below:\n\nRefund Processing Time\n• Refunds, once approved, will be processed within 5-7 business days and credited to your original payment method.\n\nNo Refund Conditions\n• No refunds will be provided for cancellations made less than 1 hour before the scheduled slot time\n• No-shows will not be eligible for any refund\n• Cancellations made 1 hour or more before the scheduled slot will be eligible for a full refund\n\nFor any refund requests or disputes, please contact us within 24 hours of your booking time.",
    useTitle: "Use of Website",
    useDesc:
      "You agree not to misuse the website. Prohibited activities include: Hacking or unauthorized access; Spreading malware or viruses; Spamming or fraudulent activity. Violation may result in termination of access and legal action.",
    ipTitle: "Intellectual Property",
    ipDesc:
      "All content on this website, including logos, images, product designs, text and graphics are the property of Pitch Perfect and are protected under applicable copyright laws. Unauthorized use or reproduction is strictly prohibited.",
    privacyTitle: "Privacy Policy",
    privacyDesc:
      "Your use of this website is also governed by our Privacy Policy, which explains how we collect and use your information.",
    liabilityTitle: "Limitation of Liability",
    liabilityDesc:
      "Pitch Perfect shall not be held liable for any: Direct or indirect damages; Loss of data or profits; Issues arising from the use or inability to use our website or products.",
    lawTitle: "Governing Law",
    lawDesc:
      "These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Virudhunagar, Tamil Nadu, India.",
    contactTitle: "Contact Us",
    contactDesc:
      "If you have any questions or need support, feel free to contact us:",
    phoneLabel: "Call & WhatsApp",
    phoneNumber: "+91 73588 48765",
    emailLabel: "Email Us",
    emailAddress: "support@pitchperfectapk.com",
    whatsappCTA: "Chat on WhatsApp",
    addressLabel: "Address",
    address:
      "Madurai–Tuticorin Highway, Chockalingampuram, Nethaji Road, Aruppukottai, Virudhunagar, Tamil Nadu – 626101",
    acceptance:
      "By using our website, you confirm that you have read, understood, and agreed to these Terms & Conditions.",
  },
};

const sections = [
  { icon: FileText, key: "general" },
  { icon: Package, key: "products" },
  { icon: Tag, key: "pricing" },
  { icon: ShoppingCart, key: "orders" },
  { icon: CreditCard, key: "payment" },
  { icon: Truck, key: "shipping" },
  { icon: Undo, key: "returns" },
  { icon: AlertTriangle, key: "use" },
  { icon: Copyright, key: "ip" },
  { icon: Shield, key: "privacy" },
  { icon: Gavel, key: "liability" },
  { icon: Scale, key: "law" },
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
          <h3 className="mb-4 font-semibold">{s.en.contactTitle}</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {s.en.contactDesc}
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
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

            <div className="flex items-start gap-3">
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

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <WhatsAppIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">WhatsApp</h3>
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
            {s.en.acceptance}
          </p>
        </Card>
      </motion.div>

      <FooterBranding className="mt-8 rounded-xl" />
    </div>
  );
}
