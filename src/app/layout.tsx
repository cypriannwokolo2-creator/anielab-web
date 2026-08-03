import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AnieLab | Anime, Comics & Game Co-Creation Platform",
  description:
    "Co-create anime, comics, games, and music with writers, illustrators, composers, and voice actors — contributions tracked on-chain, revenue split by percentage automatically.",
  openGraph: {
    title: "The project where every creator gets paid their share",
    description:
      "AnieLab is where creators build original IP together — animation, manga, games, music. Every contribution tracked on-chain, every payout split by the percentage you agreed to.",
    type: "website",
    siteName: "AnieLab",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-950 text-stone-100">
        <Header />
        <main className="flex-1 pt-24">{children}</main>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
