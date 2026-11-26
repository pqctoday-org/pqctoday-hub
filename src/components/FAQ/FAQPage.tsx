// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useMemo, useEffect, useId, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { HelpCircle, ChevronDown, ChevronRight, Search, ExternalLink, Sparkles } from 'lucide-react'
import { FAQ_DATA, personaLeadItems, type FAQCategory, type FAQItem } from './faqData'
import { PERSONAS } from '@/data/learningPersonas'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Input } from '@/components/ui/input'
import { logFaqSearch, logFaqExpand } from '@/utils/analytics'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'
import { PersonaPageNote } from '@/components/shared/PersonaPageNote'
import { useUrlBackedText } from '@/hooks/useUrlBackedText'
import { matchesAllWords } from '@/utils/searchMatch'
import { UnresolvedEstimatesNotice } from '@/components/common/UnresolvedEstimatesNotice'

/** Answers that quote a CRQC year or a qubit count; each carries the open-estimates notice. */
export const FAQ_ESTIMATE_QUESTIONS: readonly string[] = [
  'What is a CRQC and when might one exist?',
  "What is Mosca's Theorem?",
  'What is the difference between physical and logical qubits?',
]

function FAQAccordionItem({
  item,
  recommended,
  openDirectly = false,
}: {
  item: FAQItem
  recommended: boolean
  openDirectly?: boolean
}) {
  const [open, setOpen] = useState(openDirectly)
  const answerId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (openDirectly) buttonRef.current?.focus()
  }, [openDirectly])

  return (
    <div className="border-b border-border last:border-b-0">
      <Button
        ref={buttonRef}
        variant="ghost"
        className={`flex h-auto w-full items-start gap-3 whitespace-normal py-4 min-h-[44px] text-left transition-colors hover:text-accent ${recommended ? 'bg-primary/5' : ''}`}
        onClick={() => {
          if (!open) logFaqExpand(item.question)
          setOpen((o) => !o)
        }}
        aria-expanded={open}
        aria-controls={answerId}
      >
        {open ? (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        ) : (
          <ChevronRight
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
        <span className="min-w-0 flex-1 font-medium text-foreground">{item.question}</span>
        {recommended && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            <Sparkles size={9} aria-hidden="true" />
            For you
          </span>
        )}
      </Button>
      <div id={answerId} hidden={!open} className="pb-4 pl-7">
        {open && (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            {FAQ_ESTIMATE_QUESTIONS.includes(item.question) && (
              <UnresolvedEstimatesNotice detail="faq" className="mt-3" />
            )}
            <Link
              to={item.deepLink}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              {item.deepLinkLabel ?? 'Learn more'}
            </Link>
            {item.sources && (
              <ul className="mt-2 space-y-1 text-sm">
                {item.sources.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline"
                    >
                      {source.label}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {item.id && !openDirectly && (
              <Link
                to={`/faq?answer=${item.id}`}
                className="mt-3 block text-sm text-primary underline"
              >
                Open this answer on its own
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FAQCategorySection({
  category,
  activePersona,
}: {
  category: FAQCategory
  activePersona: PersonaId | null
}) {
  // "Float, don't filter" (same pattern as /explore's tile sort): a persona-matching
  // Q&A rises to the top of its category and gets a light highlight, but nothing is
  // hidden — the FAQ's un-gated, see-everything nature is part of why it works.
  const orderedItems = useMemo(() => {
    if (!activePersona) return category.items
    return [...category.items].sort(
      (a, b) => Number(b.persona === activePersona) - Number(a.persona === activePersona)
    )
  }, [category.items, activePersona])

  return (
    <section className="glass-panel p-6" id={category.id}>
      <h2 className="mb-4 text-lg font-semibold font-display text-heading">{category.title}</h2>
      <div>
        {orderedItems.map((item) => (
          <FAQAccordionItem
            key={item.question}
            item={item}
            recommended={item.persona === activePersona}
          />
        ))}
      </div>
    </section>
  )
}

/** Build FAQPage JSON-LD from the FAQ data for structured data injection */
function buildFAQPageSchema(data: FAQCategory[]) {
  const questions = data.flatMap((cat) =>
    cat.items.map((item) => ({
      '@type': 'Question' as const,
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: item.answer,
      },
    }))
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions,
  }
}

export function FAQPage({ inDrawer = false }: { inDrawer?: boolean } = {}) {
  const Heading = inDrawer ? 'h2' : 'h1'
  const [params, setParams] = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)
  const [drawerSearch, setDrawerSearch] = useState('')
  const routeSearch = useUrlBackedText(inDrawer ? '' : (params.get('q') ?? ''), (next) => {
    setParams(
      (prev) => {
        const updated = new URLSearchParams(prev)
        if (next) updated.set('q', next)
        else updated.delete('q')
        return updated
      },
      { replace: true }
    )
  })
  const search = inDrawer ? drawerSearch : routeSearch.text
  const setSearch = inDrawer ? setDrawerSearch : routeSearch.update
  const { selectedPersona } = usePersonaStore()
  // Hidden while searching: a lead block pinned above filtered results would
  // show three questions that do not match the query, which reads as a bug.
  const leadItems = useMemo(
    () => (search.trim() ? [] : personaLeadItems(selectedPersona)),
    [selectedPersona, search]
  )

  useEffect(() => {
    if (!search.trim()) return
    const t = window.setTimeout(() => logFaqSearch(search), 600)
    return () => window.clearTimeout(t)
  }, [search])

  const filteredData = useMemo(() => {
    if (!search.trim()) return FAQ_DATA
    return FAQ_DATA.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => matchesAllWords([item.question, item.answer], search)),
    })).filter((cat) => cat.items.length > 0)
  }, [search])

  const answerKey = inDrawer ? null : params.get('answer')
  const directAnswer = answerKey
    ? FAQ_DATA.flatMap((category) => category.items).find((item) => item.id === answerKey)
    : undefined

  const totalQuestions = FAQ_DATA.reduce((sum, cat) => sum + cat.items.length, 0)
  const schema = useMemo(() => buildFAQPageSchema(FAQ_DATA), [])

  if (directAnswer) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
        <h1 className="font-display text-heading text-2xl font-bold font-display text-heading">
          PQC Frequently Asked Questions
        </h1>
        <Link to="/faq" className="text-sm text-primary underline">
          All questions
        </Link>
        <section className="glass-panel p-4 sm:p-6">
          <FAQAccordionItem
            key={directAnswer.id}
            item={directAnswer}
            recommended={false}
            openDirectly
          />
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* JSON-LD structured data — always use full FAQ_DATA, not filtered */}
      <script type="application/ld+json">{JSON.stringify(schema)}</script>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-7 w-7 text-accent" aria-hidden="true" />
          <Heading className="text-heading text-2xl font-bold sm:text-3xl">
            PQC Frequently Asked Questions
          </Heading>
        </div>
        <p className="text-muted-foreground">
          {totalQuestions} answers about post-quantum cryptography — algorithms, NIST standards,
          migration timelines, compliance, 8 role learning paths, interactive labs, and governance
          tools.
        </p>
      </div>

      <PersonaPageNote route="/faq" />

      {answerKey && (
        <p role="status">
          This answer link could not be found. Browse or search the questions below.
        </p>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={searchRef}
          type="search"
          className="pl-10"
          aria-label="Search questions"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* B+ remediation 4.1 (2026-08-10): lead with this role's own three
          questions. Below this block the page is unchanged — the same twelve
          categories, in the same order, still floating persona-matched items
          within each. This is a reordering of what exists, not a second FAQ:
          every question here is resolved out of FAQ_DATA by exact match, and a
          test fails the build if one stops resolving. */}
      {leadItems.length > 0 && selectedPersona && (
        <section className="glass-panel p-6" aria-labelledby="faq-lead-heading">
          <h2
            id="faq-lead-heading"
            className="mb-1 text-lg font-semibold font-display text-heading"
          >
            Start here as {PERSONAS[selectedPersona].label}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            The three questions this role asks first. Everything below is the full list.
          </p>
          <div className="space-y-2">
            {leadItems.map((item) => (
              <FAQAccordionItem key={item.question} item={item} recommended />
            ))}
          </div>
        </section>
      )}

      {filteredData.length > 0 && (
        <nav className="flex flex-wrap gap-2" aria-label="FAQ categories">
          {filteredData.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {cat.title}
            </a>
          ))}
        </nav>
      )}

      {/* FAQ sections */}
      {filteredData.length > 0 ? (
        filteredData.map((cat) => (
          <FAQCategorySection key={cat.id} category={cat} activePersona={selectedPersona} />
        ))
      ) : (
        <div className="glass-panel p-8 text-center">
          <p role="status" className="text-muted-foreground">
            No questions match &ldquo;{search}&rdquo;.
          </p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => {
              setSearch('')
              searchRef.current?.focus()
            }}
          >
            Clear search
          </Button>
        </div>
      )}

      {/* CTA */}
      <div className="glass-panel p-6 text-center">
        <p className="mb-3 text-muted-foreground">
          Have a question not listed here? Ask the PQC Assistant for real-time answers.
        </p>
        <Link to="/about" className={buttonVariants({ variant: 'gradient' })}>
          Learn about the PQC Assistant
        </Link>
      </div>
    </div>
  )
}
