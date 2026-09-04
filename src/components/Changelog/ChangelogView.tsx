// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useEffect, type ComponentType } from 'react'
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
  Wrench,
  Compass,
  Calendar,
  UserCheck,
  Search,
  Heart,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'
import clsx from 'clsx'
import { getCurrentVersion } from '../../store/useVersionStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import {
  ALL_CHANGELOG_VERSIONS,
  HAS_DATA_SECTIONS,
  HAS_SECURITY_SECTIONS,
  type ChangelogVersion,
  type ChangelogSection,
} from '../../utils/changelogParser'
import { sortCSVFiles } from '../../data/csvUtils'
import { Button } from '@/components/ui/button'
import { SPONSORS } from '@/data/sponsors'

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
  ops: { label: 'Ops', Icon: Wrench },
  curious: { label: 'Curious', Icon: Compass },
}

const VIEW_LABELS: Record<string, string> = {
  '/timeline': 'Timeline',
  '/playground': 'Playground',
  '/playground/tpm-playground': 'TPM 2.0 Playground',
  '/playground/cacp': 'KMIP 3.0 Playground',
  '/playground/hsm': 'PKCS#11 Playground',
  '/openssl': 'OpenSSL Studio',
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
  { label: 'Software', prefix: 'pqc_product_catalog_' },
  { label: 'Timeline', prefix: 'timeline_' },
  { label: 'Library', prefix: 'library_' },
]

interface FreshnessEntry {
  label: string
  date: Date | null
}

// Freshness only needs each category's newest filename/date, not parsed CSV
// content, but `sortCSVFiles` (the same date-desc/revision-desc sort every
// CSV loader in the app uses) expects a modules-shaped record — pass
// placeholder content since it's never read.
const DATA_FRESHNESS: FreshnessEntry[] = FRESHNESS_CATEGORIES.map(({ label, prefix }) => {
  const matchingPaths = CSV_PATHS.filter((p) => (p.split('/').pop() ?? '').startsWith(prefix))
  const modules = Object.fromEntries(matchingPaths.map((p) => [p, '']))
  const dateRegex = new RegExp(`${prefix}(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  const [latest] = sortCSVFiles(modules, dateRegex)
  return { label, date: latest?.date ?? null }
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

// Strip inline code spans and markdown links from a title so it reads as plain
// prose in the collapsed view. Full markdown still renders inside `Show details`.
function cleanTitle(title: string): string {
  return title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
    .replace(/`([^`]+)`/g, '$1') // `code` → code
    .replace(/\s+/g, ' ')
    .trim()
}

interface ChangelogDateGroup {
  date: string
  versions: ChangelogVersion[]
}

function groupVersionsByDate(versions: ChangelogVersion[]): ChangelogDateGroup[] {
  const groups: ChangelogDateGroup[] = []
  for (const v of versions) {
    const last = groups[groups.length - 1]
    if (last && last.date === v.date) {
      last.versions.push(v)
    } else {
      groups.push({ date: v.date, versions: [v] })
    }
  }
  return groups
}

// Section type ordering for merged display (matches the legend on the filter bar).
const SECTION_ORDER: ChangelogSection['type'][] = [
  'added',
  'changed',
  'fixed',
  'data',
  'security',
  'other',
]

function mergeSections(versions: ChangelogVersion[]): ChangelogSection[] {
  const buckets = new Map<ChangelogSection['type'], ChangelogSection['entries']>()
  for (const v of versions) {
    for (const s of v.sections) {
      const existing = buckets.get(s.type) ?? []
      buckets.set(s.type, existing.concat(s.entries))
    }
  }
  return SECTION_ORDER.filter((t) => buckets.has(t)).map((t) => ({
    type: t,
    entries: buckets.get(t) ?? [],
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────

// Per-persona keyword sets — used by the "For me" filter to surface entries
// that aren't explicitly tagged via `[persona:X]` but mention work in that
// persona's wheelhouse. Explicit tags always take precedence.
//
// Coverage rationale (post-2026-05-21 audit pass):
// - Existing CHANGELOG is ~1,150 entries; only ~25 have explicit persona tags.
//   The keyword regex bridges the gap so a persona-filtered view still
//   surfaces relevant historic work.
// - Terms chosen from the actual corpus, not abstract role descriptions.
//   Examples: "PROV-DM" + "corpus" + "embeddings" + "trust-engine" are
//   researcher concerns because researchers use those for citation chains;
//   "CI" / "vitest" / "lint" / "tsconfig" are developer concerns because
//   they touch the build pipeline; "CSV" / "scrape" / "catalog refresh" are
//   ops concerns because they're the data plumbing that feeds dashboards.
export const PERSONA_KEYWORDS: Record<string, RegExp> = {
  executive:
    /\b(compliance|regulatory|governance|board|roadmap|policy|NIST|ANSSI|BSI|CNSA|FIPS 140|deadline|business case|audit|framework|enforcement|stakeholder)\b/i,
  developer:
    /\b(API|SDK|library|code|playground|openssl|WASM|JOSE|COSE|JWT|workshop|tool|algorithm|implementation|TLS|liboqs|vitest|Playwright|TypeScript|test|lint|tsconfig|webpack|vite|CI|GitHub Action|workflow)\b/i,
  architect:
    /\b(PKI|certificate|hybrid|agility|architecture|design|HSM|TPM|protocol|hierarchy|enrollment|composite|X\.509|PKCS#?11|module structure|provider|crypto-agility|key management|KMS|root of trust)\b/i,
  researcher:
    /\b(spec|RFC|draft|KAT|ACVP|FIPS 203|FIPS 204|FIPS 205|test vector|cryptanalysis|attack|paper|PROV-DM|provenance|corpus|RAG|embeddings|attestation|trust score|trust engine|trust-engine|trust tier|OSCAL|CBOM|enrichment|xwalk|crosswalk|concept registry)\b/i,
  ops: /\b(deploy|deployment|runtime|infrastructure|operations|rotate|monitoring|telemetry|incident|migration|CSV|scrape|catalog refresh|data refresh|fleet|cert rotation|HSM firmware|ETL)\b/i,
  curious:
    /\b(landing|explore|intro|overview|basics|simplified|story|getting started|learn|persona|plain.language|three[- ]?step|teaser|orientation|on.ramp)\b/i,
}

export const ChangelogView = () => {
  const version = getCurrentVersion()
  const location = useLocation()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const [highlightedVersion, setHighlightedVersion] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    added: true,
    changed: true,
    fixed: true,
    data: true,
    security: true,
  })
  const [personaOnly, setPersonaOnly] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleFilter = (type: FilterType) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const personaKeyword =
    personaOnly && selectedPersona
      ? // eslint-disable-next-line security/detect-object-injection
        (PERSONA_KEYWORDS[selectedPersona] ?? null)
      : null

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredVersions = useMemo(() => {
    return ALL_CHANGELOG_VERSIONS.map((v) => ({
      ...v,
      sections: v.sections
        .filter((s) => {
          if (s.type === 'other') return true
          if (s.type === 'added') return filters.added
          if (s.type === 'changed') return filters.changed
          if (s.type === 'fixed') return filters.fixed
          if (s.type === 'data') return filters.data
          if (s.type === 'security') return filters.security
          return true
        })
        .map((s) => {
          let entries = s.entries
          if (personaOnly && selectedPersona) {
            entries = entries.filter((e) => {
              if (e.meta.personas.includes(selectedPersona)) return true
              if (personaKeyword && personaKeyword.test(`${e.title} ${e.body}`)) return true
              return false
            })
          }
          if (normalizedQuery) {
            entries = entries.filter((e) =>
              `${e.title} ${e.body}`.toLowerCase().includes(normalizedQuery)
            )
          }
          return { ...s, entries }
        })
        .filter((s) => s.entries.length > 0),
    })).filter((v) => v.sections.length > 0)
  }, [filters, personaOnly, selectedPersona, personaKeyword, normalizedQuery])

  // B+ remediation 4.1 (2026-08-10). The "For me" control was a keyword regex
  // presented to the reader as a filter: only ~25 of ~1,150 entries carry an
  // explicit [persona:X] tag, so the overwhelming majority of what it returned
  // was a GUESS, and the control said nothing about that. "This is an accuracy
  // fix before it is a usability one: the current control tells the reader
  // something untrue about what it is doing."
  //
  // Retro-tagging 1,150 historical entries is not something this change can do
  // honestly — nobody can now reconstruct which roles a 2025 entry was for. So
  // the fix is to STATE the split rather than hide it, and to make the tag the
  // documented convention for new entries (see CHANGELOG.md's own header).
  const personaMatchSplit = useMemo(() => {
    if (!personaOnly || !selectedPersona) return null
    let tagged = 0
    let guessed = 0
    for (const v of filteredVersions) {
      for (const s of v.sections) {
        for (const e of s.entries) {
          if (e.meta.personas.includes(selectedPersona)) tagged++
          else guessed++
        }
      }
    }
    return { tagged, guessed }
  }, [filteredVersions, personaOnly, selectedPersona])

  const groupedByDate = useMemo(() => groupVersionsByDate(filteredVersions), [filteredVersions])

  const allFiltersActive =
    filters.added &&
    filters.changed &&
    filters.fixed &&
    (!HAS_DATA_SECTIONS || filters.data) &&
    (!HAS_SECURITY_SECTIONS || filters.security)

  // Deep-link via hash (e.g. /changelog#v3.5.11). The route is lazy-loaded, so
  // the browser's native anchor jump can fire before content paints — scroll
  // here once filteredVersions is rendered.
  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const show = window.setTimeout(() => setHighlightedVersion(id), 0)
    const hide = window.setTimeout(() => setHighlightedVersion(null), 1800)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [location.hash, filteredVersions.length])

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

      {/* Sponsor thanks — real, wired to src/data/sponsors.ts (the same
          registry that drives the /migrate "Sponsor" badge). Renders nothing
          until a sponsorship actually closes, so this never displays a name
          that isn't real — see /sponsor's "Thank-you note in the monthly
          changelog" benefit, which this makes literally true rather than
          aspirational copy. */}
      {SPONSORS.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="glass-panel p-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
            <Heart size={14} className="text-primary shrink-0" aria-hidden="true" />
            Thank you to our sponsors
          </div>
          <div className="flex flex-wrap gap-2">
            {SPONSORS.map((s) => (
              <a
                key={s.name}
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full text-xs border border-border bg-muted/30 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                {s.name}
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Data Freshness Bar */}
      {DATA_FRESHNESS.some((f) => f.date !== null) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel px-4 py-3 mb-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
              title="Days since each dataset's newest snapshot file. An amber dot means that dataset hasn't been refreshed in over 30 days."
            >
              <Calendar size={12} />
              <span>Data last updated:</span>
            </div>
            {DATA_FRESHNESS.map(({ label, date }) => {
              if (!date) return null
              const isStale = now - date.getTime() > 30 * 24 * 60 * 60 * 1000
              return (
                <span
                  key={label}
                  title={
                    isStale
                      ? `${label} dataset hasn't been refreshed in over 30 days`
                      : `${label} dataset's newest snapshot`
                  }
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
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search changelog entries…"
            aria-label="Search changelog entries"
            className="w-full pl-9 pr-3 py-2 min-h-[44px] rounded-lg border border-border bg-muted/20 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Filter:</span>
            {selectedPersona && (
              <Button
                variant="ghost"
                onClick={() => setPersonaOnly((v) => !v)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-lg border transition-all',
                  personaOnly
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
                )}
                title="Entries tagged for your role, plus a keyword guess over the untagged ones — see the note below when active"
              >
                <UserCheck size={14} />
                <span>For me</span>
              </Button>
            )}
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

      {/* B+ remediation 4.1: say what the "For me" filter actually did. A
          filter that is mostly a keyword guess is fine; a filter that hides
          that fact from the reader is not. */}
      {personaMatchSplit && (
        <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{personaMatchSplit.tagged}</span>{' '}
          {personaMatchSplit.tagged === 1 ? 'entry' : 'entries'} explicitly tagged for your role
          {personaMatchSplit.guessed > 0 && (
            <>
              , plus{' '}
              <span className="font-semibold text-foreground">{personaMatchSplit.guessed}</span>{' '}
              matched by keyword — a guess, not a tag. Older entries pre-date the role tag, so the
              keyword pass is how they surface at all
            </>
          )}
          .
        </p>
      )}

      {/* B+ remediation 4.1: a first-time non-technical reader arriving at
          ~1,150 engineering entries needs to be told what this page is before
          it is useful. Stated, not hidden — the page stays fully reachable. */}
      {selectedPersona === 'curious' && (
        <p className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-foreground">
          This is the engineering record of every change to the site — useful if you want to check
          that it is actively maintained, and not somewhere you need to read. The{' '}
          <span className="font-semibold">Revisions</span> feed summarises what changed in the
          content itself, which is usually the question behind the question.
        </p>
      )}

      {/* Changelog Content — vertical timeline layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative space-y-4 pl-6 sm:pl-8"
      >
        {/* Timeline spine */}
        <div className="absolute left-[10px] sm:left-[14px] top-2 bottom-2 w-px bg-border/40" />

        {groupedByDate.map((group, idx) => {
          const groupHighlighted = group.versions.some(
            (v) => highlightedVersion === `v${v.version}`
          )
          const versionLabel =
            group.versions.length === 1
              ? `v${group.versions[0].version}`
              : `v${group.versions[group.versions.length - 1].version}–v${group.versions[0].version}`
          // Merge sections across same-date versions, preserving section order.
          const mergedSections = mergeSections(group.versions)
          const groupSummary = group.versions
            .map((v) => v.summary)
            .filter((s) => s && s.length > 0)
            .join(' · ')
          // Keyed by date+first-version, not just date: groupVersionsByDate only
          // merges ADJACENT same-date entries (by design — a different-dated
          // release sandwiched between two same-date releases, e.g.
          // 3.17.2/3.17.1/3.17.0, correctly stays 3 separate visual groups).
          // Two non-adjacent groups can therefore share a date, which made
          // `key={group.date}` alone a real duplicate-key collision (confirmed:
          // 2026-05-30 and 2026-03-13 each hit this) — found via a
          // full-suite-only test failure in ChangelogView.sponsors.test.tsx.
          return (
            <div key={`${group.date}-${group.versions[0].version}`} className="relative">
              {/* Date milestone dot */}
              <div
                className={clsx(
                  'absolute top-[22px] -left-[18px] sm:-left-6 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ring-2 ring-background z-10',
                  idx === 0 ? 'bg-primary' : 'bg-border'
                )}
              />

              {/* Per-version anchors so deep-links keep working */}
              {group.versions.map((v) => (
                <div
                  key={v.version}
                  id={`v${v.version}`}
                  className="absolute -top-20"
                  aria-hidden="true"
                />
              ))}

              <div
                className={clsx(
                  'glass-panel p-6 transition-shadow duration-500',
                  groupHighlighted && 'ring-2 ring-primary shadow-glow'
                )}
              >
                {/* Date header */}
                <div className="mb-4 pb-3 border-b border-border">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h2 className="text-xl font-semibold text-foreground">
                      {formatDate(group.date)}
                    </h2>
                    <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full border border-border">
                      {versionLabel}
                    </span>
                    {idx === 0 && (
                      <span className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        Current
                      </span>
                    )}
                  </div>
                  {groupSummary && (
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {groupSummary}
                    </p>
                  )}
                </div>

                {/* Merged sections */}
                <div className="space-y-4">
                  {mergedSections.map((section) => {
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
                          <span className="text-xs ml-auto tabular-nums text-muted-foreground">
                            {section.entries.length}
                          </span>
                        </div>

                        {/* Entry list */}
                        <ul className="space-y-0.5 pl-1">
                          {section.entries.map((entry, ei) => (
                            <li key={ei}>
                              <div className="py-1.5 px-2 rounded hover:bg-muted/20 transition-colors">
                                <div className="flex items-start gap-2">
                                  <span
                                    className={clsx('mt-0.5 shrink-0 text-sm', config.textClass)}
                                  >
                                    ›
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-sm text-foreground">
                                      {cleanTitle(entry.title)}
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
          )
        })}
      </motion.div>
    </div>
  )
}
