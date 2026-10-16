import type { Metadata } from "next";
import "./globals.css";

const title = "ONE FLY — today's fly, the same one for everyone";
const description =
  "Every day there is one fly. Its entire brain is 50 NAND gates, its whole day is decided by the date " +
  "alone, and the transcript is sealed with a hash chain. No server, no database, no randomness that is not in the seed.";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL("https://onefly.xyz"),
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
  icons: { icon: "/icon.svg" }
};

export const viewport = { themeColor: "#07090b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
