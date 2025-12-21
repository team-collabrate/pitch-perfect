import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery | Pitch Perfect Turf",
  description:
    "View our premium turf facilities, match highlights, and community events at Pitch Perfect Turf, Aruppukottai.",
  keywords: [
    "turf gallery",
    "Pitch Perfect photos",
    "Aruppukottai sports ground images",
    "football turf photos",
  ],
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
