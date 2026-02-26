import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "DJ Hub - Music Discovery for DJs",
    template: "%s | DJ Hub",
  },
  description:
    "DJ Hub is the ultimate music discovery platform for DJs. Get personalized recommendations, manage channels, and discover new tracks powered by Deezer.",
  keywords: ["DJ", "music", "discovery", "recommendations", "deezer", "channels"],
  authors: [{ name: "DJ Hub" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "DJ Hub - Music Discovery for DJs",
    description: "The ultimate music discovery platform for DJs",
    siteName: "DJ Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "DJ Hub - Music Discovery for DJs",
    description: "The ultimate music discovery platform for DJs",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
