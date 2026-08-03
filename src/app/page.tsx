import Link from 'next/link'
import { Check, Coins, Handshake, PenTool } from 'lucide-react'
import FundingBoard from '@/components/FundingBoard'
import ProjectCard from '@/components/ProjectCard'
import RoleMarquee from '@/components/RoleMarquee'
import FAQSection from '@/components/FAQSection'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'
import { mockProjects } from '@/lib/mock/projects'

export const dynamic = 'force-dynamic'

const steps = [
  {
    icon: Handshake,
    title: 'Agree on the split',
    description:
      'Start the project, add your crew — writer, artist, composer, voice — and set each person’s percentage. That agreement is written into the contract, where everyone can see it.',
    tag: 'One contract per project',
  },
  {
    icon: PenTool,
    title: 'Make the thing',
    description:
      'Work exactly as you normally would. Every deliverable is pinned to IPFS with your name attached, so the credit list updates itself as you go.',
    tag: 'Files on IPFS, credited by name',
  },
  {
    icon: Coins,
    title: 'Get paid, automatically',
    description:
      'When crowdfunding or streaming revenue lands, the contract pays each contributor their agreed percentage — no spreadsheets, no chasing, no “who did what?” debates.',
    tag: 'Every payout is public',
  },
]

const faqs = [
  {
    question: 'Is AnieLab only for anime projects?',
    answer:
      'No. AnieLab works for any team making original IP together — manga and webtoons, indie games, music albums, short films, animation. The contract doesn’t care what you’re making; it cares that every contributor gets their agreed percentage.',
  },
  {
    question: 'Do I need to know anything about crypto to join?',
    answer:
      'No. If you can upload a file and fill in a form, you can join. One person on the team sets up the project — the rest of you just get a link. Payments arrive in a Stellar wallet, and setting one up is explained step by step when you get there.',
  },
  {
    question: 'How is my percentage decided?',
    answer:
      'Your team agrees at the start of the project — writing, art, music, voice work all get a percentage. Those numbers are written into the project’s contract and visible to everyone. The admin can adjust them as the team changes, before revenue is distributed.',
  },
  {
    question: 'Who holds the money between a payment and a payout?',
    answer:
      'No one does. Backers pay directly into the project’s contract, and the contract only ever sends money to the contributors on the list. AnieLab never holds, touches, or withdraws funds — and neither can anyone else, because the rules are part of the contract itself.',
  },
  {
    question: 'What happens if a contributor leaves mid-project?',
    answer:
      'The project admin updates the contributor list inside the contract. Every distribution after that follows the updated list, and every past payout is already recorded publicly, so nobody gets quietly written out of history.',
  },
  {
    question: 'Can backers see where their money goes?',
    answer:
      'Yes. Every distribution is a public transaction on the Stellar network. A backer can look at the project’s contract at any time and see exactly which amounts went to which contributors.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
}

export default async function Home() {
  const supabaseReady =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Mock projects render ONLY in local development, and only while Supabase
  // credentials are missing. Production builds never show mock data or the
  // preview badge — the feed is empty until the env vars are set.
  const showMockData = process.env.NODE_ENV !== 'production' && !supabaseReady

  let projects: { id: string; title: string; description: string | null; cover_ipfs_cid: string | null; status: string }[] | null = null

  if (supabaseReady) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)
    projects = data
  }

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="absolute -top-16 right-1/4 h-80 w-80 rounded-full bg-yellow-500/10 blur-3xl" />
          <div className="absolute top-40 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Live on Stellar testnet — early days, built in public
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Co-create anime, comics &amp; games.{' '}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Get paid exactly for your share.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-400">
            AnieLab is where writers, illustrators, composers, and voice actors
            build original IP together — animation, manga, indie games, music.
            Your percentage is written into the project&apos;s contract from day
            one, and when crowdfunding or streaming revenue arrives, it&apos;s
            split automatically — no invoices, no chasing anyone, no legal team.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/create"
              className="btn-drip px-7 py-3 shadow-lg shadow-amber-950/50"
            >
              Start a project
            </Link>
            <Link
              href="#contract"
              className="btn-drip-ghost bg-stone-900/60 px-7 py-3"
            >
              See how it works, live
            </Link>
          </div>
        </div>
      </section>

      {/* crew marquee */}
      <RoleMarquee />

      {/* built on */}
      <section className="border-y border-stone-800/60 bg-stone-900/30 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 text-sm text-stone-500">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-500">
            Built on
          </span>
          {['Stellar', 'Soroban', 'IPFS', 'WalletConnect', 'Supabase'].map((tech) => (
            <span
              key={tech}
              className="font-mono text-xs text-stone-400 transition hover:text-amber-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* needs funding */}
      <div id="contract" className="scroll-mt-20 pb-16 pt-16">
        <div className="mx-auto max-w-6xl px-6 pb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
            Needs funding
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Put your money behind real projects
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-400">
            Every project below is live — its goal, funded amount, and remaining
            balance are read straight from its contract on the Stellar testnet.
            Fund one directly, and every payout stays public on-chain.
          </p>
        </div>
        <FundingBoard projects={projects} />
      </div>

      {/* how it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-20">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
            The sequence
          </p>
          <h2 className="mt-3 text-3xl font-bold">How AnieLab works</h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-400">
            Three steps, one contract. Your share is agreed once, then paid
            forever.
          </p>
        </div>

        <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          {/* connector line */}
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden h-px bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0 md:block" />

          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="flex items-center gap-4">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950 shadow-lg shadow-amber-950/40">
                  <step.icon className="h-7 w-7" />
                </div>
                <span className="font-mono text-xs tracking-widest text-amber-400/70">
                  STEP 0{i + 1}
                </span>
              </div>
              <div className="mt-5 rounded-2xl border border-stone-800 bg-stone-900/60 p-6 transition hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-950/30">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">
                  {step.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-300">
                  <Check className="h-3 w-3" />
                  {step.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* projects */}
      <section id="projects" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-24">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
              In the works
            </p>
            <div className="mt-2 flex items-center gap-3">
              <h2 className="text-2xl font-bold">Active projects</h2>
              {showMockData && (
                <span className="rounded-full border border-stone-700 bg-stone-800/80 px-3 py-1 text-xs text-stone-400">
                  Development preview — sample projects
                </span>
              )}
            </div>
          </div>
          <Link href="/create" className="text-sm text-amber-400 hover:text-amber-300">
            Create one →
          </Link>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : showMockData ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/40 p-12 text-center">
            <p className="text-stone-400">
              No projects on the feed yet — the first one gets to set the trend.
            </p>
            <Link
              href="/create"
              className="mt-4 inline-block rounded-full px-4 py-1.5 text-sm font-medium text-amber-400 transition hover:bg-amber-500/10 hover:text-amber-300"
            >
              Be the first →
            </Link>
          </div>
        )}
      </section>

      {/* backers & creative sprints */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
            Two sides of the same ledger
          </p>
          <h2 className="mt-3 text-3xl font-bold">Fund it, or run a creative sprint</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/fund"
            className="group rounded-3xl border border-stone-800 bg-stone-900/60 p-8 transition hover:border-amber-500/60"
          >
            <h3 className="text-2xl font-bold group-hover:text-amber-300">
              Back a project
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-400">
              Movies, comics, games, and music get made because someone pays for
              them to exist. Pledge straight into the project&apos;s contract —
              no middleman, no custodial wallet — and watch every payout land in
              public.
            </p>
            <span className="mt-5 inline-block text-sm font-medium text-amber-400">
              See how funding works →
            </span>
          </Link>
          <Link
            href="/challenges"
            className="group rounded-3xl border border-stone-800 bg-stone-900/60 p-8 transition hover:border-amber-500/60"
          >
            <h3 className="text-2xl font-bold group-hover:text-amber-300">
              Run a creative sprint
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-400">
              Time-boxed calls for your IP — fan art, boss music, a new ending
              for episode three. Run one and invite the community, or apply to
              join a sprint someone else is running. Entries pinned to IPFS,
              prizes split on-chain automatically when the clock runs out.
            </p>
            <span className="mt-5 inline-block text-sm font-medium text-amber-400">
              How creative sprints work →
            </span>
          </Link>
        </div>
      </section>

      {/* faq — hidden behind a reveal button */}
      <FAQSection faqs={faqs} />

      {/* final cta */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/40 via-stone-800/60 to-stone-900 p-px">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
          </div>
          <div className="relative flex flex-col items-center rounded-[calc(1.5rem-1px)] bg-stone-950/90 px-8 py-16 text-center">
            <h2 className="text-4xl font-bold">
              Your crew.{' '}
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Your contract.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-400">
              Agree on the split once, then let the contract do every payout
              from then on. Anime, manga, games, music — whatever your crew
              makes together, this is what fair credit looks like when
              it&apos;s written down.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/create"
                className="btn-drip px-7 py-3 shadow-lg shadow-amber-950/50"
              >
                Start a project
              </Link>
              <Link
                href="#contract"
                className="btn-drip-ghost bg-stone-900/60 px-7 py-3"
              >
                See projects needing funding
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <Footer />
    </div>
  )
}
