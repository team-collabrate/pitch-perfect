import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Your Slot | Online Turf Booking Aruppukottai",
  description:
    "Reserve your football or cricket slot at Pitch Perfect Turf, Aruppukottai. Easy online booking, real-time availability, and instant confirmation.",
  keywords: [
    "book turf Aruppukottai",
    "football slot booking",
    "cricket ground booking",
    "Pitch Perfect booking",
    "online turf reservation",
    "Aruppukottai sports booking",
  ],
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
