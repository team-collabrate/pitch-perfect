import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Instructions & Rules | Pitch Perfect Turf Aruppukottai",
  description:
    "Learn how to book and follow the guidelines for a great experience at Pitch Perfect Turf. Rules for football and cricket matches.",
  keywords: [
    "turf rules",
    "Pitch Perfect instructions",
    "Aruppukottai turf guidelines",
    "how to book turf",
    "turf safety rules",
  ],
};

export default function InstructionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
