import { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Bookings | Pitch Perfect Turf",
  description:
    "View your current and past bookings at Pitch Perfect Turf, Aruppukottai.",
  keywords: ["view bookings", "my slots", "Pitch Perfect history"],
};

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
