// SPDX-License-Identifier: GPL-3.0-only
/**
 * DeveloperImplementationView — persona-specific For You body for the developer
 * persona on /compliance. Bonus item from the 2026-05-20 page-audit set: the
 * developer For You tab previously rendered the generic ApplicabilityPanel,
 * same view as ops/curious, despite developer being a high-traffic persona on
 * a page in their nav.
 *
 * Layout:
 *   - Profile summary (shared)
 *   - Algorithm coverage strip: which post-quantum algorithm families show up
 *     across the user's applicable frameworks, with deep-link to /algorithms
 *   - Implementation jump bar: openssl-studio, pki-workshop, jose/cose tools
 *   - Standards → implementation table: framework → required algorithms →
 *     test vector / KAT cross-links
 *
 * Reuses useApplicabilityWithPaths so the engine output is identical to other
 * For You views; only rendering differs.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Code2,
  Beaker,
  ArrowRight,
  ExternalLink,
  FlaskConical,
  Terminal,
  Check,
  Copy,
} from 'lucide-react'
import { useState } from 'react'
import { logEvent, personaLabel } from '@/utils/analytics'
import { useApplicabilityWithPaths } from '../../../hooks/useApplicabilityWithPaths'
import { groupByTier, type UserProfile } from '../../../utils/applicabilityEngine'
import { ProfileEditor } from '../../applicability/parts/ProfileEditor'
import { ProfileSummary } from '../../applicability/parts/ProfileSummary'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { libraryData } from '../../../data/libraryData'
import type { ComplianceFramework } from '../../../data/complianceData'
import type { LibraryItem } from '../../../data/libraryData'
import type { ThreatData } from '../../../data/threatsData'
import type { TimelineEvent } from '../../../types/timeline'

interface DeveloperImplementationViewProps {
  profileOverride?: Partial<UserProfile>
  onSelectLibrary?: (item: LibraryItem) => void
  onSelectThreat?: (item: ThreatData) => void
  onSelectTimeline?: (item: TimelineEvent) => void
  onSelectFramework?: (item: ComplianceFramework) => void
}

// Algorithm family → /algorithms deep-link highlight token. Reuses the same
// highlight schema as the executive "View Top 5" button in AlgorithmsView.
const CI_GATE_YAML = `# .github/workflows/pqc-compliance.yml
# Fail the build if any classical-only algorithm appears in your CBOM.
# Drop this into a new repo or extend an existing CI workflow.
name: PQC Compliance Gate

on:
  pull_request:
  push:
    branches: [main]

jobs:
  pqc-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate CBOM with cyclonedx-cli
        run: |
          npx -y @cyclonedx/cdxgen -t cryptography \\
            --required-only \\
            -o cbom.json .

      - name: Fail if classical-only algorithms detected
        run: |
          jq -e '.components[]
            | select(.cryptoProperties.algorithmProperties.executionEnvironment == "software")
            | select(.cryptoProperties.algorithmProperties.implementationPlatform | test("rsa|ecdsa|ecdh"; "i"))
            | select((.cryptoProperties.algorithmProperties.cryptoFunctions // [])
              | map(test("ml-kem|ml-dsa|slh-dsa|hybrid"; "i")) | any | not)' cbom.json \\
            && (echo "::error::Classical-only algorithm found without hybrid/PQC pair" && exit 1) \\
            || echo "PQC compliance gate passed"
`

function CIGateSnippet() {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CI_GATE_YAML)
      setCopied(true)
      logEvent('Compliance', 'CI Gate Copied', personaLabel('developer'))
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section data-section-id="developer-ci-gate" className="glass-panel p-4 space-y-3 scroll-mt-20">
      <header className="flex items-center gap-2 flex-wrap">
        <Terminal size={16} className="text-primary" />
        <h3 className="text-base font-semibold text-foreground">Wire a PQC gate into CI</h3>
        <span className="text-xs text-muted-foreground">
          Drop this GitHub Actions snippet into your repo to fail builds that ship classical-only
          crypto
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="ml-auto h-7 text-xs gap-1.5"
          aria-label="Copy CI gate YAML"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy YAML'}
        </Button>
      </header>
      <pre className="text-xs font-mono bg-muted/30 border border-border rounded-md p-3 overflow-x-auto leading-relaxed text-foreground/90">
        <code>{CI_GATE_YAML}</code>
      </pre>
      <p className="text-xs text-muted-foreground">
        Pairs with the algorithm coverage strip above — anything missing here is a blocker. Uses{' '}
        <a
          href="https://github.com/CycloneDX/cdxgen"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          @cyclonedx/cdxgen
        </a>{' '}
        for the CBOM scan.
      </p>
    </section>
  )
}

const ALG_HIGHLIGHT: Record<string, string> = {
  'ML-KEM': 'ML-KEM-768',
  'ML-DSA': 'ML-DSA-65',
  'SLH-DSA': 'SLH-DSA-SHA2-128s',
  Falcon: 'Falcon-512',
  XMSS: 'XMSS',
  'LMS/HSS': 'LMS',
  HQC: 'HQC',
}

const IMPLEMENTATION_LINKS = [
  {
    label: 'OpenSSL Studio',
    desc: 'Live OpenSSL 3.6 CLI with PQC providers loaded',
    to: '/openssl',
    icon: Code2,
  },
  {
    label: 'PKI Workshop',
    desc: 'Build a CA hierarchy with ML-DSA / hybrid certs',
    to: '/playground/pki-workshop',
    icon: Beaker,
  },
  {
    label: 'JOSE / JWT Workshop',
    desc: 'RFC 9964 ML-DSA signatures + RFC-9504 KEMs',
    to: '/learn/api-security-jwt',
    icon: FlaskConical,
  },
]

function pickAlgFamilies(items: LibraryItem[]): Map<string, LibraryItem[]> {
  const m = new Map<string, LibraryItem[]>()
  for (const item of items) {
    const families = (item.algorithmFamily || '')
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    for (const family of families) {
      const bucket = m.get(family) ?? []
      bucket.push(item)
      m.set(family, bucket)
    }
  }
  return m
}

export function DeveloperImplementationView({
  profileOverride,
  onSelectLibrary,
  onSelectFramework,
}: DeveloperImplementationViewProps) {
  const { profile, isEmpty, frameworks } = useApplicabilityWithPaths(profileOverride)
  const grouped = useMemo(() => groupByTier(frameworks), [frameworks])
  const applicable: ComplianceFramework[] = useMemo(
    () =>
      [
        ...grouped.mandatory,
        ...grouped.recognized,
        ...grouped['cross-border'],
        ...grouped.advisory,
      ].map((r) => r.item),
    [grouped]
  )

  // Collect library refs that appear across applicable frameworks → resolve
  // to LibraryItem records → group by algorithm family.
  const relevantRefIds = useMemo(() => {
    const ids = new Set<string>()
    for (const fw of applicable) {
      for (const r of fw.libraryRefs ?? []) ids.add(r)
    }
    return ids
  }, [applicable])

  const relevantLibrary = useMemo(
    () => libraryData.filter((it) => relevantRefIds.has(it.referenceId)),
    [relevantRefIds]
  )

  const byFamily = useMemo(() => pickAlgFamilies(relevantLibrary), [relevantLibrary])
  const familyEntries = useMemo(
    () =>
      Array.from(byFamily.entries())
        .map(([family, items]) => ({ family, items }))
        .sort((a, b) => b.items.length - a.items.length),
    [byFamily]
  )

  if (isEmpty) {
    return (
      <div className="space-y-3">
        <ProfileEditor
          profile={profile}
          message="Set your stack first — pick an industry and country so we can match required algorithms to library implementations and test vectors."
        />
        <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Want algorithm-level recommendations? Take the full assessment.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Capturing your crypto stack and toolchain choices sharpens the library and KAT
              suggestions on this view.
            </p>
          </div>
          <Link
            to="/assess"
            className={`${buttonVariants({ variant: 'gradient', size: 'sm' })} flex items-center gap-1.5`}
          >
            Start assessment <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div data-section-id="profile-summary" className="scroll-mt-20">
        <ProfileSummary profile={profile} editable />
      </div>

      {/* ── Algorithm coverage strip ─────────────────────────────── */}
      <section
        data-section-id="developer-algorithm-coverage"
        className="glass-panel p-4 space-y-3 scroll-mt-20"
      >
        <header className="flex items-center gap-2">
          <FlaskConical size={16} className="text-secondary" />
          <h3 className="text-base font-semibold text-foreground">Algorithm coverage</h3>
          <span className="text-xs text-muted-foreground">
            Post-quantum families that show up across your applicable standards
          </span>
        </header>
        {familyEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No algorithm-tagged library docs matched your applicable frameworks yet. Add an industry
            and country to your profile and we will rebuild this list.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {familyEntries.slice(0, 12).map(({ family, items }) => {
              const highlight = ALG_HIGHLIGHT[family] // eslint-disable-line security/detect-object-injection
              const href = highlight
                ? `/algorithms?tab=detailed&highlight=${encodeURIComponent(highlight)}`
                : '/algorithms'
              return (
                <Link
                  key={family}
                  to={href}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs text-foreground hover:border-primary/60 hover:bg-primary/10 transition-colors group"
                  title={`${items.length} document${items.length === 1 ? '' : 's'} reference ${family}`}
                >
                  <span className="font-mono text-primary">{family}</span>
                  <span className="text-[10px] text-muted-foreground">{items.length}</span>
                  <ArrowRight
                    size={11}
                    className="text-primary/60 group-hover:text-primary transition-colors"
                  />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Implementation jump bar ─────────────────────────────── */}
      <section
        data-section-id="developer-implementation-jump"
        className="glass-panel p-4 space-y-3 scroll-mt-20"
      >
        <header className="flex items-center gap-2">
          <Code2 size={16} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Implementation jump bar</h3>
          <span className="text-xs text-muted-foreground">Open the tools you actually use</span>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {IMPLEMENTATION_LINKS.map(({ label, desc, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="rounded-lg border border-border bg-card/30 p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors group min-w-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className="text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CI gate wire-up CTA (P11-P1-06) ──────────────────────── */}
      <CIGateSnippet />

      {/* ── Standards → library cross-links ─────────────────────── */}
      <section
        data-section-id="developer-standards-impl"
        className="glass-panel p-4 space-y-3 scroll-mt-20"
      >
        <header className="flex items-center gap-2">
          <ExternalLink size={16} className="text-secondary" />
          <h3 className="text-base font-semibold text-foreground">
            Standards → implementation docs
          </h3>
          <span className="text-xs text-muted-foreground">
            Each row's library entries link to the canonical RFC / spec
          </span>
        </header>
        {applicable.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No applicable frameworks for this profile.
          </p>
        ) : (
          <ul className="space-y-2">
            {applicable.slice(0, 12).map((fw) => {
              const docs = libraryData.filter((it) =>
                (fw.libraryRefs ?? []).includes(it.referenceId)
              )
              return (
                <li key={fw.id} className="rounded-lg border border-border bg-card/30 p-3 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => onSelectFramework?.(fw)}
                      className="h-auto px-0 py-0 text-sm font-semibold text-foreground hover:text-primary truncate"
                      title={fw.label}
                    >
                      {fw.label}
                    </Button>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {fw.deadline || 'no deadline'}
                    </span>
                  </div>
                  {docs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No library cross-references.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {docs.slice(0, 6).map((doc) => (
                        <Button
                          key={doc.referenceId}
                          variant="ghost"
                          type="button"
                          onClick={() => onSelectLibrary?.(doc)}
                          className="h-auto text-[11px] px-2 py-0.5 rounded border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary truncate"
                          title={doc.documentTitle}
                        >
                          {doc.referenceId}
                        </Button>
                      ))}
                      {docs.length > 6 && (
                        <span className="text-[10px] text-muted-foreground self-center">
                          +{docs.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
