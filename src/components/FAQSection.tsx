'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import FAQAccordion from './FAQAccordion'

interface Faq {
  question: string
  answer: string
}

/** FAQ section hidden behind a reveal button — keeps the page lean. */
export default function FAQSection({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState(false)

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 pb-24">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
          Questions, answered
        </p>
        <h2 className="mt-3 text-3xl font-bold">Common questions</h2>
      </div>

      {open ? (
        <>
          <FAQAccordion faqs={faqs} />
          <div className="mt-6 text-center">
            <button
              onClick={() => setOpen(false)}
              className="btn-drip-ghost inline-flex items-center gap-2 bg-stone-900/60 px-5 py-2.5 text-sm"
            >
              <X className="h-4 w-4" />
              Hide the answers
            </button>
          </div>
        </>
      ) : (
        <div className="mt-10 text-center">
          <button
            onClick={() => setOpen(true)}
            className="btn-drip inline-flex items-center gap-2 px-6 py-3 shadow-lg shadow-amber-950/40"
          >
            <HelpCircle className="h-4 w-4" />
            Got questions? Read the FAQ
          </button>
        </div>
      )}
    </section>
  )
}
