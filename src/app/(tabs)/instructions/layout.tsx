import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instructions | Pitch Perfect Turf",
  description:
    "Guidelines and rules for using Pitch Perfect Turf facilities. Ensure a safe and enjoyable experience for everyone.",
  keywords: [
    "turf rules",
    "Pitch Perfect instructions",
    "Aruppukottai turf guidelines",
  ],
};

export default function InstructionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
