import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Book Your Slot at Pitch Perfect Turf",
  description:
    "Contact Pitch Perfect Turf in Aruppukottai for bookings and inquiries. Find our location on Google Maps, WhatsApp us, or call for details.",
  keywords: [
    "contact Pitch Perfect",
    "turf location Aruppukottai",
    "Pitch Perfect phone number",
    "turf directions",
    "book turf Aruppukottai",
    "Pitch Perfect WhatsApp",
  ],
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
