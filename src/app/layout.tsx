import type { Metadata } from "next";
import "./globals.css";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import Logo from "@/components/Logo";
import { Toaster } from "sonner";
import Link from "next/link";

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
        <header className="border-b border-stone-800/80 bg-stone-950/80">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-b from-amber-200 to-amber-500 bg-clip-text text-transparent">
                  AnieLab
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-5">
              <Link
                href="/#projects"
                className="hidden text-sm text-stone-300 transition hover:text-amber-300 sm:block"
              >
                Projects
              </Link>
              <Link
                href="/fund"
                className="hidden text-sm text-stone-300 transition hover:text-amber-300 sm:block"
              >
                Fund
              </Link>
              <Link
                href="/challenges"
                className="hidden text-sm text-stone-300 transition hover:text-amber-300 sm:block"
              >
                Challenges
              </Link>
              <Link
                href="/create"
                className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20"
              >
                Start a project
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
