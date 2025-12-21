import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Your Slot | Pitch Perfect Turf",
  description:
    "Book your football or cricket slot at Pitch Perfect Turf, Aruppukottai. Check availability and reserve your time online.",
  keywords: [
    "book turf Aruppukottai",
    "football slot booking",
    "cricket ground booking",
    "Pitch Perfect booking",
  ],
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
