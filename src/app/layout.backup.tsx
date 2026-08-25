import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sajibatlas.com"),

  title: {
    default: "Sajib Atlas | Geography, BCS & Knowledge Platform",
    template: "%s | Sajib Atlas",
  },

  description:
    "Sajib Atlas is a structured knowledge platform for Geography, BCS preparation, International Affairs, English, research and beyond.",

  keywords: [
    "Sajib Atlas",
    "BCS preparation",
    "BCS Bangladesh",
    "Geography",
    "Bangladesh Geography",
    "International Affairs",
    "English",
    "BCS Notes",
    "Geography Notes",
    "Knowledge Platform",
  ],

  authors: [
    {
      name: "Sajib Atlas",
      url: "https://sajibatlas.com",
    },
  ],

  creator: "Sajib Atlas",
  publisher: "Sajib Atlas",

  alternates: {
    canonical: "https://sajibatlas.com",
  },

  openGraph: {
    type: "website",
    url: "https://sajibatlas.com",
    siteName: "Sajib Atlas",
    title: "Sajib Atlas | Geography, BCS & Knowledge Platform",
    description:
      "A structured knowledge platform for Geography, BCS preparation, International Affairs, English, research and beyond.",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Sajib Atlas | Geography, BCS & Knowledge Platform",
    description:
      "A structured knowledge platform for Geography, BCS preparation, International Affairs, English, research and beyond.",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
