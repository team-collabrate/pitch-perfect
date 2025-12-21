import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Pitch Perfect Turf",
  description:
    "Get in touch with Pitch Perfect Turf in Aruppukottai. Find our location, contact number, and social media links.",
  keywords: [
    "contact Pitch Perfect",
    "turf location Aruppukottai",
    "Pitch Perfect phone number",
    "turf directions",
  ],
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
