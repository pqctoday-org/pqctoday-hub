import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpenText, Search, X, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { glossaryTerms, type GlossaryTerm } from '../../data/glossaryData'
import clsx from 'clsx'

const complexityColors = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  advanced: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const categoryColors = {
  algorithm: 'text-primary',
  protocol: 'text-secondary',
  standard: 'text-accent',
  concept: 'text-foreground',
  organization: 'text-tertiary',
}

const TermCard = ({ term }: { term: GlossaryTerm }) => (
  <div className="glass-panel p-4 hover:border-primary/30 transition-colors">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-foreground">{term.term}</h3>
        {term.acronym && (
          <span className="text-xs font-mono text-muted-foreground">({term.acronym})</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={clsx(
            'px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize',

            complexityColors[term.complexity]
          )}
        >
          {term.complexity}
        </span>
      </div>
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed mb-2">{term.definition}</p>
    {term.technicalNote && (
      <p className="text-xs text-muted-foreground/70 italic mb-2">💡 {term.technicalNote}</p>
    )}
    {term.relatedModule && (
      <Link
        to={term.relatedModule}
        className={clsx(
          'inline-flex items-center gap-1 text-xs hover:underline',

          categoryColors[term.category]
        )}
      >
        <ExternalLink size={10} />
        Related module →
      </Link>
    )}
  </div>
)

export const Glossary: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 200)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  const categories = ['all', 'algorithm', 'protocol', 'standard', 'concept', 'organization']

  const filteredTerms = useMemo(() => {
    return glossaryTerms
      .filter((t) => {
        if (activeCategory !== 'all' && t.category !== activeCategory) return false
        if (activeLetter && !t.term.toUpperCase().startsWith(activeLetter)) return false
        if (!search) return true
        const q = search.toLowerCase()
        return (
          t.term.toLowerCase().includes(q) ||
          t.acronym?.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.term.localeCompare(b.term))
  }, [search, activeCategory, activeLetter])

  const availableLetters = useMemo(() => {
    const letters = new Set(glossaryTerms.map((t) => t.term[0].toUpperCase()))
    return Array.from(letters).sort()
  }, [])

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-primary text-black shadow-lg hover:bg-primary/90 transition-all hover:scale-110"
        aria-label="Open glossary"
        title="PQC Glossary"
      >
        <BookOpenText size={22} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
              role="dialog"
              aria-label="PQC Glossary"
              aria-modal="true"
            >
              {/* Header */}
              <div className="p-4 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gradient flex items-center gap-2">
                    <BookOpenText size={22} />
                    PQC Glossary
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
                    aria-label="Close glossary"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search terms..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setActiveLetter(null)
                    }}
                    className="w-full bg-muted/30 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground"
                    aria-label="Search glossary terms"
                  />
                </div>

                {/* Category Tabs */}
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={clsx(
                        'px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors border',
                        activeCategory === cat
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'text-muted-foreground border-border hover:border-primary/20'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* A-Z Index */}
                <div className="flex gap-0.5 flex-wrap">
                  {availableLetters.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
                      className={clsx(
                        'w-6 h-6 rounded text-[10px] font-bold transition-colors',
                        activeLetter === letter
                          ? 'bg-primary text-black'
                          : 'text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''}
                </p>
                {filteredTerms.map((term) => (
                  <TermCard key={term.term} term={term} />
                ))}
                {filteredTerms.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground italic">
                    No terms match your search.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
