import Link from 'next/link'
import ContractExplorer from '@/components/ContractExplorer'
import ProjectCard from '@/components/ProjectCard'
import RoleMarquee from '@/components/RoleMarquee'
import { createClient } from '@/lib/supabase/server'
import { mockProjects } from '@/lib/mock/projects'

export const dynamic = 'force-dynamic'

const steps = [
  {
    title: 'Agree on the split',
    description:
      'Start a project, add your teammates, and set each person’s percentage — writing, art, music, voices. That agreement is written into the project’s smart contract, where everyone can see it.',
  },
  {
    title: 'Make the thing',
    description:
      'Upload your work as you go. Every file is stored on IPFS with your name attached, and the team’s credit list updates automatically — no one’s contribution gets lost in a group chat.',
  },
  {
    title: 'Get paid, automatically',
    description:
      'When crowdfunding or streaming revenue arrives, the contract pays every contributor their agreed percentage. Done — no spreadsheets, no chasing invoices, no one deciding what you deserve.',
  },
]

const faqs = [
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
            Co-create anime.{' '}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Get paid exactly for your share.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-400">
            Your percentage is written into the project’s contract from day one.
            Every contribution is credited, and when crowdfunding or streaming
            revenue arrives, it’s split automatically — no invoices, no chasing
            anyone, no legal team.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/create"
              className="rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-7 py-3 font-semibold text-stone-950 shadow-lg shadow-amber-950/50 transition hover:from-amber-200 hover:to-amber-400"
            >
              Start a project
            </Link>
            <Link
              href="#contract"
              className="rounded-full border border-stone-700 bg-stone-900/60 px-7 py-3 font-medium text-stone-200 transition hover:border-amber-500/60 hover:text-amber-200"
            >
              See how it works, live
            </Link>
          </div>
        </div>
      </section>

      {/* crew marquee */}
      <RoleMarquee />

      {/* live contract */}
      <div id="contract" className="scroll-mt-20 pb-16">
        <ContractExplorer />
      </div>

      {/* how it works */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-center text-3xl font-bold">How AnieLab works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 transition hover:border-amber-500/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 font-mono text-sm font-bold text-stone-950">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* projects */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Active projects</h2>
            {showMockData && (
              <span className="rounded-full border border-stone-700 bg-stone-800/80 px-3 py-1 text-xs text-stone-400">
                Development preview — sample projects
              </span>
            )}
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

      {/* faq */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-center text-3xl font-bold">Common questions</h2>
        <div className="mt-10 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-stone-800 bg-stone-900/60 px-6 py-4 open:border-amber-500/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-stone-200">
                {faq.question}
                <span className="text-amber-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-stone-800 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-stone-500 sm:flex-row">
          <span>AnieLab — Web3 co-creation for indie anime</span>
          <span className="font-mono text-xs">
            contracts / anielab-contracts · backend / anielab-backend · web / anielab-web
          </span>
        </div>
      </footer>
    </div>
  )
}
