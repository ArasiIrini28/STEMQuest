import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "STEMQuest — A little curiosity. A big adventure.",
  description:
    "Explore STEM worlds, solve playful challenges, and build your next big idea. Learning for curious minds, Grade 3 through college.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
