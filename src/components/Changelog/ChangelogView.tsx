// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileText, Plus, Sparkles, Bug, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { getCurrentVersion } from '../../store/useVersionStore'

// Import CHANGELOG.md as raw text
import changelogContent from '../../../CHANGELOG.md?raw'

// ── Types ────────────────────────────────────────────────────────────────────

type SectionType = 'added' | 'changed' | 'fixed' | 'other'
type FilterType = 'added' | 'changed' | 'fixed'

interface FilterState {
  added: boolean
  changed: boolean
  fixed: boolean
}

interface Entry {
  title: string
  body: string
}

interface Section {
  type: SectionType
  entries: Entry[]
}

interface ChangelogVersion {
  version: string
  date: string
  sections: Section[]
}

// ── Section display config ────────────────────────────────────────────────────

const SECTION_CONFIG = {
  added: {
    label: 'New Features',
    Icon: Plus,
    borderClass: 'border-success',
    bgClass: 'bg-success/10',
    textClass: 'text-success',
  },
  changed: {
    label: 'Improvements',
    Icon: Sparkles,
    borderClass: 'border-primary',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
  },
  fixed: {
    label: 'Bug Fixes',
    Icon: Bug,
    borderClass: 'border-warning',
    bgClass: 'bg-warning/10',
    textClass: 'text-warning',
  },
  other: {
    label: 'Other',
    Icon: FileText,
    borderClass: 'border-border',
    bgClass: 'bg-muted/10',
    textClass: 'text-muted-foreground',
  },
} as const

// ── Parser ────────────────────────────────────────────────────────────────────

function parseEntry(raw: string): Entry {
  const boldMatch = raw.match(/^\*\*([^*]+)\*\*/)
  if (boldMatch) {
    const title = boldMatch[1]
    const body = raw.slice(boldMatch[0].length).replace(/^:\s*/, '').trim()
    return { title, body }
  }
  return { title: raw.trim(), body: '' }
}

function parseChangelog(content: string): ChangelogVersion[] {
  const versions: ChangelogVersion[] = []
  // Split at each '## [' version header
  const versionBlocks = content.split(/\n(?=## \[)/)

  for (const block of versionBlocks) {
    const headerMatch = block.match(/^## \[([^\]]+)\] - (\S+)/)
    if (!headerMatch) continue

    const version = headerMatch[1]
    const date = headerMatch[2]
    const sections: Section[] = []

    // Split at each '### ' section header
    const sectionBlocks = block.split(/\n(?=### )/)

    for (const sectionBlock of sectionBlocks) {
      const sectionHeaderMatch = sectionBlock.match(/^### (.+)/)
      if (!sectionHeaderMatch) continue

      const sectionName = sectionHeaderMatch[1].toLowerCase()
      const type: SectionType = sectionName.startsWith('add')
        ? 'added'
        : sectionName.startsWith('change')
          ? 'changed'
          : sectionName.startsWith('fix')
            ? 'fixed'
            : 'other'

      // Collect list items; continuation lines are indented with 2+ spaces
      const lines = sectionBlock.split('\n').slice(1)
      const entries: Entry[] = []
      let currentLines: string[] | null = null

      for (const line of lines) {
        if (line.startsWith('- ')) {
          if (currentLines !== null) {
            entries.push(parseEntry(currentLines.join('\n').trim()))
          }
          currentLines = [line.slice(2)]
        } else if (currentLines !== null) {
          // Strip leading 2-space indent from continuation lines
          currentLines.push(line.replace(/^ {2}/, ''))
        }
      }
      if (currentLines !== null) {
        entries.push(parseEntry(currentLines.join('\n').trim()))
      }

      if (entries.length > 0) {
        sections.push({ type, entries })
      }
    }

    if (sections.length > 0) {
      versions.push({ version, date, sections })
    }
  }

  return versions
}

// Parse once at module level — content is a static import
const ALL_VERSIONS = parseChangelog(changelogContent)

// ── Component ─────────────────────────────────────────────────────────────────

export const ChangelogView = () => {
  const version = getCurrentVersion()

  const [filters, setFilters] = useState<FilterState>({
    added: true,
    changed: true,
    fixed: true,
  })
  const [showDetails, setShowDetails] = useState(false)

  const toggleFilter = (type: FilterType) => {
    setFilters((prev) => ({
      ...prev,
      [type]: !prev[type as keyof FilterState],
    }))
  }

  const filteredVersions = useMemo(() => {
    return ALL_VERSIONS.map((v) => ({
      ...v,
      sections: v.sections.filter((s) => {
        if (s.type === 'other') return true
        if (s.type === 'added') return filters.added
        if (s.type === 'changed') return filters.changed
        if (s.type === 'fixed') return filters.fixed
        return true
      }),
    })).filter((v) => v.sections.length > 0)
  }, [filters])

  const allFiltersActive = filters.added && filters.changed && filters.fixed

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <FileText className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Changelog</h1>
              <p className="text-sm text-muted-foreground">
                Current version:{' '}
                <span className="font-mono text-primary font-bold">v{version}</span>
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to App</span>
          </Link>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Filter:</span>
            <button
              onClick={() => toggleFilter('added')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-lg border transition-all',
                filters.added
                  ? 'bg-success/20 border-success/50 text-success'
                  : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Plus size={14} />
              <span>New Features</span>
            </button>
            <button
              onClick={() => toggleFilter('changed')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-lg border transition-all',
                filters.changed
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles size={14} />
              <span>Improvements</span>
            </button>
            <button
              onClick={() => toggleFilter('fixed')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-lg border transition-all',
                filters.fixed
                  ? 'bg-warning/20 border-warning/50 text-warning'
                  : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Bug size={14} />
              <span>Bug Fixes</span>
            </button>
            {!allFiltersActive && (
              <button
                onClick={() => setFilters({ added: true, changed: true, fixed: true })}
                className="ml-2 text-xs text-muted-foreground hover:text-foreground underline"
              >
                Show all
              </button>
            )}
          </div>
          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-lg border transition-all text-sm whitespace-nowrap',
              showDetails
                ? 'bg-muted/30 border-border text-foreground'
                : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showDetails ? 'Hide details' : 'Show details'}</span>
          </button>
        </div>
      </motion.div>

      {/* Changelog Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredVersions.map((v) => (
          <div key={v.version} className="glass-panel p-6">
            {/* Version header */}
            <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">v{v.version}</h2>
              <span className="text-sm text-muted-foreground">{v.date}</span>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {v.sections.map((section) => {
                const config = SECTION_CONFIG[section.type]
                const { Icon } = config
                return (
                  <div key={section.type}>
                    {/* Category band */}
                    <div
                      className={clsx(
                        'flex items-center gap-2 px-3 py-2 rounded-r-lg border-l-4 mb-2',
                        config.borderClass,
                        config.bgClass
                      )}
                    >
                      <Icon size={14} className={config.textClass} />
                      <span className={clsx('text-sm font-semibold', config.textClass)}>
                        {config.label}
                      </span>
                      <span
                        className={clsx(
                          'text-xs ml-auto tabular-nums opacity-70',
                          config.textClass
                        )}
                      >
                        {section.entries.length}
                      </span>
                    </div>

                    {/* Entry list */}
                    <ul className="space-y-0.5 pl-1">
                      {section.entries.map((entry, ei) => (
                        <li key={ei}>
                          <div className="py-1.5 px-2 rounded hover:bg-muted/20 transition-colors">
                            <div className="flex items-start gap-2">
                              <span className={clsx('mt-0.5 shrink-0 text-sm', config.textClass)}>
                                ›
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-sm text-foreground">
                                  {entry.title}
                                </span>
                                {showDetails && entry.body && (
                                  <div className="mt-1 prose prose-sm prose-invert max-w-none prose-p:text-muted-foreground prose-p:my-0.5 prose-li:text-muted-foreground prose-code:text-primary prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-a:text-primary">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {entry.body}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
