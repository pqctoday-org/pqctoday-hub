// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, type ComponentType } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  FileText,
  Plus,
  Sparkles,
  Bug,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Database,
  Shield,
  Briefcase,
  Code2,
  Network,
  FlaskConical,
  Calendar,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { getCurrentVersion } from '../../store/useVersionStore'
import {
  ALL_CHANGELOG_VERSIONS,
  HAS_DATA_SECTIONS,
  HAS_SECURITY_SECTIONS,
} from '../../utils/changelogParser'
import { Button } from '@/components/ui/button'

type FilterType = 'added' | 'changed' | 'fixed' | 'data' | 'security'

interface FilterState {
  added: boolean
  changed: boolean
  fixed: boolean
  data: boolean
  security: boolean
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
  data: {
    label: 'Data Updates',
    Icon: Database,
    borderClass: 'border-status-info',
    bgClass: 'bg-status-info/10',
    textClass: 'text-status-info',
  },
  security: {
    label: 'Security',
    Icon: Shield,
    borderClass: 'border-status-error',
    bgClass: 'bg-status-error/10',
    textClass: 'text-status-error',
  },
  other: {
    label: 'Other',
    Icon: FileText,
    borderClass: 'border-border',
    bgClass: 'bg-muted/10',
    textClass: 'text-muted-foreground',
  },
} as const

// ── Persona / view config for impact badges ──────────────────────────────────

type IconComponent = ComponentType<{ size?: number; className?: string }>

const PERSONA_CONFIG: Record<string, { label: string; Icon: IconComponent }> = {
  executive: { label: 'Executive', Icon: Briefcase },
  developer: { label: 'Developer', Icon: Code2 },
  architect: { label: 'Architect', Icon: Network },
  researcher: { label: 'Researcher', Icon: FlaskConical },
}

const VIEW_LABELS: Record<string, string> = {
  '/timeline': 'Timeline',
  '/playground': 'Playground',
  '/compliance': 'Compliance',
  '/learn': 'Learn',
  '/migrate': 'Migrate',
  '/assess': 'Assess',
  '/threats': 'Threats',
  '/algorithms': 'Algorithms',
  '/library': 'Library',
}

// ── Data Freshness ───────────────────────────────────────────────────────────

const CSV_PATHS = Object.keys(import.meta.glob('../../data/*.csv'))

const FRESHNESS_CATEGORIES = [
  { label: 'Compliance', prefix: 'compliance_' },
  { label: 'Algorithms', prefix: 'pqc_complete_algorithm_reference_' },
  { label: 'Software', prefix: 'quantum_safe_cryptographic_software_reference_' },
  { label: 'Timeline', prefix: 'timeline_' },
  { label: 'Library', prefix: 'library_' },
]

interface FreshnessEntry {
  label: string
  date: Date | null
}

function parseCsvDate(filePath: string): Date | null {
  const match = filePath.match(/_(\d{8})\.csv$/)
  if (!match) return null
  const digits = match[1]
  const month = parseInt(digits.slice(0, 2), 10) - 1
  const day = parseInt(digits.slice(2, 4), 10)
  const year = parseInt(digits.slice(4, 8), 10)
  const date = new Date(year, month, day)
  return isNaN(date.getTime()) ? null : date
}

const DATA_FRESHNESS: FreshnessEntry[] = FRESHNESS_CATEGORIES.map(({ label, prefix }) => {
  const matches = CSV_PATHS.filter((p) => {
    const basename = p.split('/').pop() ?? ''
    return basename.startsWith(prefix)
  })
  const dates = matches.map(parseCsvDate).filter((d): d is Date => d !== null)
  const latest = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null
  return { label, date: latest }
})

const now = Date.now()

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr
  const [year, month, day] = parts
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ChangelogView = () => {
  const version = getCurrentVersion()

  const [filters, setFilters] = useState<FilterState>({
    added: true,
    changed: true,
    fixed: true,
    data: true,
    security: true,
  })
  const [showDetails, setShowDetails] = useState(false)

  const toggleFilter = (type: FilterType) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const filteredVersions = useMemo(() => {
    return ALL_CHANGELOG_VERSIONS.map((v) => ({
      ...v,
      sections: v.sections.filter((s) => {
        if (s.type === 'other') return true
        if (s.type === 'added') return filters.added
        if (s.type === 'changed') return filters.changed
        if (s.type === 'fixed') return filters.fixed
        if (s.type === 'data') return filters.data
        if (s.type === 'security') return filters.security
        return true
      }),
    })).filter((v) => v.sections.length > 0)
  }, [filters])

  const allFiltersActive =
    filters.added &&
    filters.changed &&
    filters.fixed &&
    (!HAS_DATA_SECTIONS || filters.data) &&
    (!HAS_SECURITY_SECTIONS || filters.security)

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

      {/* Data Freshness Bar */}
      {DATA_FRESHNESS.some((f) => f.date !== null) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel px-4 py-3 mb-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <Calendar size={12} />
              <span>Data last updated:</span>
            </div>
            {DATA_FRESHNESS.map(({ label, date }) => {
              if (!date) return null
              const isStale = now - date.getTime() > 30 * 24 * 60 * 60 * 1000
              return (
                <span
                  key={label}
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border',
                    isStale
                      ? 'bg-warning/10 border-warning/30 text-warning'
                      : 'bg-muted/30 border-border text-muted-foreground'
                  )}
                >
                  {isStale && <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />}
                  <span className="font-medium">{label}</span>
                  <span className="opacity-60">·</span>
                  <span>
                    {date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              )
            })}
          </div>
        </motion.div>
      )}

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
            <Button
              variant="ghost"
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
            </Button>
            <Button
              variant="ghost"
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
            </Button>
            <Button
              variant="ghost"
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
            </Button>
            {HAS_DATA_SECTIONS && (
              <Button
                variant="ghost"
                onClick={() => toggleFilter('data')}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-lg border transition-all',
                  filters.data
                    ? 'bg-status-info/20 border-status-info/50 text-status-info'
                    : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <Database size={14} />
                <span>Data Updates</span>
              </Button>
            )}
            {HAS_SECURITY_SECTIONS && (
              <Button
                variant="ghost"
                onClick={() => toggleFilter('security')}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-lg border transition-all',
                  filters.security
                    ? 'bg-status-error/20 border-status-error/50 text-status-error'
                    : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <Shield size={14} />
                <span>Security</span>
              </Button>
            )}
            {!allFiltersActive && (
              <Button
                variant="ghost"
                onClick={() =>
                  setFilters({
                    added: true,
                    changed: true,
                    fixed: true,
                    data: true,
                    security: true,
                  })
                }
                className="ml-2 text-xs text-muted-foreground hover:text-foreground underline"
              >
                Show all
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
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
          </Button>
        </div>
      </motion.div>

      {/* Changelog Content — vertical timeline layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative space-y-4 pl-6 sm:pl-8"
      >
        {/* Timeline spine */}
        <div className="absolute left-[10px] sm:left-[14px] top-2 bottom-2 w-px bg-border/40" />

        {filteredVersions.map((v, idx) => (
          <div key={v.version} id={`v${v.version}`} className="relative">
            {/* Version milestone dot */}
            <div
              className={clsx(
                'absolute top-[22px] -left-[18px] sm:-left-6 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ring-2 ring-background z-10',
                idx === 0 ? 'bg-primary' : 'bg-border'
              )}
            />

            <div className="glass-panel p-6">
              {/* Version header */}
              <div className="mb-4 pb-3 border-b border-border">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-semibold text-foreground">v{v.version}</h2>
                  <span className="text-sm text-muted-foreground">{formatDate(v.date)}</span>
                  {idx === 0 && (
                    <span className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      Current
                    </span>
                  )}
                </div>
                {v.summary && (
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {v.summary}
                  </p>
                )}
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
                                  {/* Impact badges */}
                                  {(entry.meta.personas.length > 0 ||
                                    entry.meta.views.length > 0) && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {entry.meta.personas.map((p) => {
                                        const pConf = PERSONA_CONFIG[p]
                                        if (!pConf) return null
                                        const { Icon: PIcon, label: pLabel } = pConf
                                        return (
                                          <span
                                            key={p}
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20"
                                          >
                                            <PIcon size={10} />
                                            {pLabel}
                                          </span>
                                        )
                                      })}
                                      {entry.meta.views.map((viewPath) => (
                                        <span
                                          key={viewPath}
                                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted/50 text-muted-foreground border border-border"
                                        >
                                          {VIEW_LABELS[viewPath] ?? viewPath}
                                        </span>
                                      ))}
                                    </div>
                                  )}
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
          </div>
        ))}
      </motion.div>
    </div>
  )
}
