import type { Metadata } from "next";
import { Geist_Mono, Inter, Manrope } from "next/font/google";
import { AppProviders } from "@/components/providers";
import "./globals.css";
import "./field-focus.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Staff Portal | The Peers Education System",
    template: "%s | The Peers Education System",
  },
  description: "Staff portals for The Peers Education System",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} ${geistMono.variable} ${inter.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
