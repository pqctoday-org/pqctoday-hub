// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, ChevronDown, ChevronRight, Search, ExternalLink } from 'lucide-react'
import { FAQ_DATA, type FAQCategory, type FAQItem } from './faqData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function FAQAccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        className="flex w-full items-start gap-3 py-4 min-h-[44px] text-left transition-colors hover:text-accent"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        ) : (
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="font-medium text-foreground">{item.question}</span>
      </button>
      {open && (
        <div className="pb-4 pl-7">
          <p className="text-sm leading-relaxed text-secondary">{item.answer}</p>
          <Link
            to={item.deepLink}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Learn more
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  )
}

function FAQCategorySection({ category }: { category: FAQCategory }) {
  return (
    <section className="glass-panel p-6" id={category.id}>
      <h2 className="mb-4 text-lg font-semibold text-foreground">{category.title}</h2>
      <div>
        {category.items.map((item, i) => (
          <FAQAccordionItem key={i} item={item} />
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

export function FAQPage() {
  const [search, setSearch] = useState('')

  const filteredData = useMemo(() => {
    if (!search.trim()) return FAQ_DATA
    const terms = search.toLowerCase().split(/\s+/)
    return FAQ_DATA.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        const text = `${item.question} ${item.answer}`.toLowerCase()
        return terms.every((t) => text.includes(t))
      }),
    })).filter((cat) => cat.items.length > 0)
  }, [search])

  const totalQuestions = FAQ_DATA.reduce((sum, cat) => sum + cat.items.length, 0)
  const schema = useMemo(() => buildFAQPageSchema(FAQ_DATA), [])

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* JSON-LD structured data — always use full FAQ_DATA, not filtered */}
      <script type="application/ld+json">{JSON.stringify(schema)}</script>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-7 w-7 text-accent" />
          <h1 className="text-gradient text-2xl font-bold sm:text-3xl">
            PQC Frequently Asked Questions
          </h1>
        </div>
        <p className="text-muted-foreground">
          {totalQuestions} answers about post-quantum cryptography — algorithms, NIST standards,
          migration timelines, compliance, and more.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category quick links */}
      <nav className="flex flex-wrap gap-2" aria-label="FAQ categories">
        {FAQ_DATA.map((cat) => (
          <a key={cat.id} href={`#${cat.id}`}>
            <Button variant="outline" size="sm">
              {cat.title}
            </Button>
          </a>
        ))}
      </nav>

      {/* FAQ sections */}
      {filteredData.length > 0 ? (
        filteredData.map((cat) => <FAQCategorySection key={cat.id} category={cat} />)
      ) : (
        <div className="glass-panel p-8 text-center">
          <p className="text-muted-foreground">
            No questions match &ldquo;{search}&rdquo;. Try a different search term.
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="glass-panel p-6 text-center">
        <p className="mb-3 text-secondary">
          Have a question not listed here? Ask the PQC Assistant for real-time answers.
        </p>
        <Link to="/about">
          <Button variant="gradient">Learn about the PQC Assistant</Button>
        </Link>
      </div>
    </div>
  )
}
