import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home | Pitch Perfect Turf",
  description:
    "Welcome to Pitch Perfect Turf, Aruppukottai's premier sports destination for football and cricket enthusiasts.",
  keywords: [
    "Pitch Perfect Home",
    "best turf Aruppukottai",
    "sports facility Aruppukottai",
  ],
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
