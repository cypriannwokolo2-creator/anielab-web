'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Faq {
  question: string
  answer: string
}

/** Single-open accordion with smooth height animation. */
export default function FAQAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="mt-10 space-y-2">
      {faqs.map((faq, i) => {
        const isOpen = open === i
        return (
          <div
            key={faq.question}
            className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
              isOpen
                ? 'border-amber-500/40 bg-stone-900/80'
                : 'border-stone-800 bg-stone-900/60 hover:border-stone-700'
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
            >
              <span
                className={`text-sm font-medium transition-colors ${
                  isOpen ? 'text-amber-200' : 'text-stone-200'
                }`}
              >
                {faq.question}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-amber-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-stone-400">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
