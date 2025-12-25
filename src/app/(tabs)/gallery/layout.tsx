import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery | Photos & Videos of Pitch Perfect Turf",
  description:
    "Explore our premium football and cricket turf in Aruppukottai. View photos of our professional facilities, night matches, and drone shots.",
  keywords: [
    "turf gallery",
    "Pitch Perfect photos",
    "Aruppukottai sports ground images",
    "football turf photos",
    "cricket turf images",
    "Aruppukottai turf videos",
  ],
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
