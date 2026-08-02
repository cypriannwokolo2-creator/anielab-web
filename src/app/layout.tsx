import type { Metadata } from "next";
import "./globals.css";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { Toaster } from "sonner";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AnieLab | Anime Co-Creation Platform for Indie Creators",
  description:
    "Co-create original anime with writers, illustrators, and composers — contributions tracked on-chain, revenue split by percentage automatically. No invoices.",
  openGraph: {
    title: "The anime project where everyone gets paid their share",
    description:
      "AnieLab is where indie anime teams co-create: every contribution tracked on-chain, every payout split automatically by the percentage you agreed to.",
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
        <header className="border-b border-stone-800/80 bg-stone-950/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link href="/" className="text-xl font-bold tracking-tight">
              <span className="bg-gradient-to-b from-amber-200 to-amber-500 bg-clip-text text-transparent">
                AnieLab
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/create"
                className="text-sm text-stone-300 transition hover:text-amber-300"
              >
                Create Project
              </Link>
              <ConnectWalletButton />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
