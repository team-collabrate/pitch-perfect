import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Home | Pitch Perfect Turf Aruppukottai",
  description:
    "Experience the best football and cricket at Pitch Perfect Turf, Aruppukottai. Professional 5-a-side turf with premium floodlights and facilities.",
  keywords: [
    "Pitch Perfect Home",
    "best turf Aruppukottai",
    "sports facility Aruppukottai",
    "football ground Aruppukottai",
    "cricket box Aruppukottai",
  ],
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
