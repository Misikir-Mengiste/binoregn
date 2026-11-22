import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Binoregn",
  description:
    "Discover products recommended by creators. Explore, find what you love, and shop with ease.",
  // iPhone browsers otherwise turn phone numbers, dates and addresses in
  // the page into links before React loads — that changes the text and
  // fails hydration (seen on the admin orders list and order pages).
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning (this element's own attributes only): a
    // phone tab restored from cache keeps old <html> markup after the font
    // class changes, which otherwise shows a hydration error on reload.
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
