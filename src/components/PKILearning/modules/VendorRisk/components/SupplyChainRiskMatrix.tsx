// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import { softwareData, softwareMetadata } from '@/data/migrateData'
import { vendorMap } from '@/data/vendorData'
import { DOMAINS, type DomainId } from '@/data/migrationAssets'
import { softwareItemToCbomInput } from '@/components/Migrate/cbomExport'
import { buildCbomDocument, downloadCbomJson } from '@/services/cbom/cycloneDx'
import { isPqcReady, isFips1403Validated } from '@/data/kpiCatalog'
import { cpeByProduct } from '@/data/cpeXrefData'
import { loadCveSnapshot } from '@/data/cveSnapshotData'
import { threatsData, type ThreatData } from '@/data/threatsData'
import { matchesIndustry, isCrossIndustry } from '@/data/industryMatch'
import { ProductRow } from '@/components/Migrate/Workbench/ProductRow'
import { ProductDetail } from '@/components/Migrate/Workbench/ProductDetail'
import {
  HeatmapGrid,
  type HeatmapCell,
} from '@/components/PKILearning/common/executive/HeatmapGrid'
import type { SoftwareItem } from '@/types/MigrateTypes'
import type { CveSnapshot } from '@/types/CveTypes'
import type { ScorecardOutput } from './VendorScorecardBuilder'
import {
  Info,
  CheckSquare,
  Package,
  CheckCircle,
  GitMerge,
  Download,
  Link2,
  ChevronDown,
  Lock,
  Network,
  Terminal,
  Mail,
  MessageSquare,
  FileSignature,
  ShieldCheck,
  Cpu,
  KeyRound,
  Database,
  Fingerprint,
  Boxes,
  Globe2,
  HardDrive,
  Server,
  Library,
  Search,
  Landmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '../../../common/executive'
import { Link } from 'react-router'

// This tool's own simplified asset-class taxonomy for grouping the catalog's
// SoftwareItem categories into a CBOM view — NOT a taxonomy CSWP.39 itself
// defines. CSWP.39 §5.3 discusses an asset-centric inventory approach and
// names example asset types (application codes, libraries, software,
// hardware, firmware, user-generated content, communication protocols,
// enterprise services, systems), but not this six-class grouping.
export type CSWP39AssetClass = 'Code' | 'Library' | 'Application' | 'File' | 'Protocol' | 'System'

export function mapToAssetClass(item: SoftwareItem): CSWP39AssetClass {
  const cat = (item.categoryName || '').toLowerCase()
  if (
    // 'librar' (not 'library') stems both singular and plural — found while
    // building the exec-tour sample doc (WP5.3): 141 real catalog products
    // (81 "Cryptographic Libraries" + 60 "Post-Quantum Cryptography
    // Libraries") were silently falling through to the generic 'System'
    // bucket because the previous checks only matched the singular form.
    cat.includes('cryptographic librar') ||
    cat.includes('cryptography librar') ||
    cat.includes('cryptographic sdk') ||
    cat.includes('jwt librar') ||
    cat.includes('cryptographic software/librar')
  )
    return 'Library'
  if (
    cat.includes('code signing') ||
    cat.includes('ci/cd') ||
    cat.includes('software integrity') ||
    cat.includes('artifact management')
  )
    return 'Code'
  if (
    cat.includes('database encryption') ||
    cat.includes('data storage') ||
    cat.includes('data security')
  )
    return 'File'
  if (
    cat.includes('gateway') ||
    cat.includes('tls') ||
    cat.includes('dns') ||
    cat.includes('cdn') ||
    cat.includes('edge security') ||
    cat.includes('telecom') ||
    cat.includes('5g') ||
    cat.includes('service mesh') ||
    cat.includes('vpn') ||
    cat.includes('networking')
  )
    return 'Protocol'
  if (
    cat.includes('application server') ||
    cat.includes('web software') ||
    cat.includes('collaboration') ||
    cat.includes('developer platform') ||
    cat.includes('digital signature software') ||
    cat.includes('ai/ml')
  )
    return 'Application'
  return 'System'
}

export function resolveProductNames(keys: string[]): SoftwareItem[] {
  const keySet = new Set(keys)
  return softwareData.filter((s) => keySet.has(s.productId))
}

function renderPqcBadge(support: string) {
  const lower = (support || '').toLowerCase()
  let badgeClass: string
  if (lower.startsWith('yes')) {
    badgeClass = 'bg-status-success text-status-success'
  } else if (lower.startsWith('partial') || lower.startsWith('limited')) {
    badgeClass = 'bg-status-warning text-status-warning'
  } else if (lower.startsWith('planned') || lower.startsWith('in progress')) {
    badgeClass = 'bg-primary/10 text-primary border-primary/20'
  } else {
    badgeClass = 'bg-destructive/10 text-status-error border-destructive/20'
  }
  return (
    <span
      className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full border ${badgeClass}`}
    >
      {support || 'Unknown'}
    </span>
  )
}

function isHybridProduct(item: SoftwareItem): boolean {
  const desc = (item.pqcCapabilityDescription || '').toLowerCase()
  const support = (item.pqcSupport || '').toLowerCase()
  return desc.includes('hybrid') || support.includes('hybrid')
}

function getStatColor(count: number, total: number): string {
  if (total === 0) return 'text-muted-foreground'
  const pct = (count / total) * 100
  if (pct >= 75) return 'text-status-success'
  if (pct >= 50) return 'text-status-warning'
  return 'text-status-error'
}

function getBarColor(count: number, total: number): string {
  if (total === 0) return 'bg-muted'
  const pct = (count / total) * 100
  if (pct >= 75) return 'bg-status-success'
  if (pct >= 50) return 'bg-status-warning'
  return 'bg-status-error'
}

interface StatBadgeProps {
  label: string
  count: number
  total: number
  isGap?: boolean
}

const StatBadge: React.FC<StatBadgeProps> = ({ label, count, total, isGap }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const colorClass = isGap
    ? count === 0
      ? 'text-status-success'
      : 'text-status-error'
    : getStatColor(count, total)
  const barClass = isGap
    ? count === 0
      ? 'bg-status-success'
      : 'bg-status-error'
    : getBarColor(count, total)
  const barWidth = isGap ? (total > 0 ? Math.round((count / total) * 100) : 0) : pct

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${colorClass}`}>
          {isGap ? (count > 0 ? count : 'None') : `${count}/${total}`}
        </span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClass}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}

// ── Domain taxonomy (vendor-risk remediation, 2026-08-27) ────────────────
//
// This matrix used to group products by the catalog's free-text
// `infrastructure_layer` column — 9 canonical values plus ~15 stray
// spellings and 28 blanks, which scattered the 34 HSM products across five
// buckets and rendered phantom "layer" cards for every stray string. It now
// groups by `classifyProductDomain` — the audited, coverage-tested taxonomy
// the /migrate Replace tab uses, in which every active product lands in
// exactly one of the 18 domains.

/** Domain ids in DOMAINS declaration order (replace assets first). */
const DOMAIN_ORDER = Object.keys(DOMAINS) as DomainId[]

/** Presentational icons per domain (the shared DOMAINS registry is
 *  deliberately presentation-free). */
const DOMAIN_ICONS: Record<DomainId, typeof Package> = {
  tls: Lock,
  vpn: Network,
  ssh: Terminal,
  email: Mail,
  msg: MessageSquare,
  codesign: FileSignature,
  certs: ShieldCheck,
  hsm: Cpu,
  kms: KeyRound,
  atrest: Database,
  identity: Fingerprint,
  blockchain: Boxes,
  network: Globe2,
  hardware: HardDrive,
  platform: Server,
  foundations: Library,
  discovery: Search,
  programs: Landmark,
}

/**
 * Threat-matching keywords per domain, replacing the old derivation from
 * LAYERS label/description prose. Explicit and reviewed rather than derived:
 * these terms are matched (case-insensitive substring) against each threat's
 * description, cryptoAtRisk, and threatId to decide whether the threat
 * "names" the domain for the Impact axis. Overlap is intentional — one
 * threat can bear on several domains.
 */
export const DOMAIN_THREAT_KEYWORDS: Record<DomainId, readonly string[]> = {
  tls: ['tls', 'ssl', 'https', 'web traffic', 'session encryption'],
  vpn: ['vpn', 'ipsec', 'ikev2', 'tunnel'],
  ssh: ['ssh', 'remote access'],
  email: ['email', 's/mime', 'mail encryption'],
  msg: ['messaging', 'messenger', 'end-to-end'],
  codesign: [
    'code signing',
    'firmware',
    'secure boot',
    'software supply',
    'supply chain',
    'software update',
    'software integrity',
  ],
  certs: ['pki', 'certificate', 'x.509', 'digital signature', 'signing key'],
  hsm: [
    'hsm',
    'hardware security module',
    'tpm',
    'secure element',
    'smart card',
    'payment terminal',
  ],
  kms: ['key management', 'kms', 'key vault', 'secrets management', 'key wrapping'],
  atrest: ['data at rest', 'data-at-rest', 'database', 'storage', 'backup', 'archive'],
  identity: ['identity', 'authentication', 'credential', 'iam', 'single sign-on'],
  blockchain: [
    'blockchain',
    'cryptocurrency',
    'digital asset',
    'ledger',
    'wallet',
    'smart contract',
  ],
  network: ['network', '5g', 'telecom', 'dns', 'routing', 'cdn', 'satellite', 'backbone'],
  hardware: [
    'semiconductor',
    'chip',
    'hardware accelerator',
    'confidential computing',
    'root of trust',
    'side-channel',
  ],
  platform: [
    'operating system',
    'cloud',
    'container',
    'iot',
    'scada',
    'industrial control',
    'ics',
    'embedded',
  ],
  foundations: [
    'library',
    'libraries',
    'openssl',
    'sdk',
    'crypto implementation',
    'random number',
    'qkd',
  ],
  discovery: ['inventory', 'cbom', 'sbom', 'discovery', 'cryptographic audit'],
  programs: ['national', 'standardization', 'regulation', 'mandate', 'migration deadline'],
}

/**
 * Above this many products in one layer, an UNSELECTED view shows a count and
 * a Migrate link instead of a row per product.
 *
 * The gate is volume, not merely "has the user selected something". Cost is
 * driven by how many rows render: a user who has selected 40 products should
 * still see all 40, and the fixture-sized layers in this component's tests
 * (1-2 products) should still render rows so they keep exercising ProductRow.
 * Only the unfiltered whole-catalog case is suppressed. 25 is comfortably
 * above any realistic per-layer selection and far below the 50-200 per layer
 * the full catalog produces.
 */
const UNSELECTED_LAYER_ROW_CAP = 25

interface SavedSupplyChainInputs {
  pipelineSources?: string
  refreshCadence?: string
  cmdbMapping?: string
}

// --- Migration Gap × Impact matrix (mirrors RiskHeatmapGenerator's grid pattern) ---
//
// The vertical axis was originally labeled "Likelihood" with FAIR/ISO-31000
// probability language ("Almost Certain"..."Rare"), but the underlying number
// is the share of a layer not yet PQC-ready — a migration-progress ratio, not
// a threat-probability estimate. Renamed to "Migration Gap" so the label
// doesn't claim more rigor than the calculation provides. This is a label
// fix, not a framing fix: the grid still visually reads as a risk matrix
// producing a single score — see the methodology note rendered above the
// grid for the honest limitation.

const MATRIX_LIKELIHOOD_LABELS = [
  'Severe Gap',
  'Large Gap',
  'Moderate Gap',
  'Small Gap',
  'Minimal Gap',
]
const MATRIX_IMPACT_LABELS = ['Negligible', 'Minor', 'Moderate', 'Major', 'Critical']

/** Bucket a 0..1 fraction into a 1 (lowest) – 5 (highest) matrix level, or
 *  exactly 0 when the fraction is 0 (previously floored to 1, so even a
 *  fully-ready / zero-impact layer always showed a nonzero risk score). The
 *  5×5 grid below has no row/column for level 0 — callers must exclude
 *  level-0 layers from the plotted grid and surface them separately (see the
 *  "no risk" strip in the render). */
export function toMatrixLevel(fraction: number): number {
  if (fraction <= 0) return 0
  return Math.min(5, Math.max(1, Math.ceil(fraction * 5)))
}

/**
 * Severity weight per threat criticality, used to turn a layer's matched
 * threats into an ABSOLUTE impact score rather than a share of the estate.
 */
const THREAT_SEVERITY_WEIGHT: Record<string, number> = {
  Critical: 4,
  High: 3,
  'Medium-High': 2.5,
  Medium: 2,
  Low: 1,
}

/** Keyword regex for one domain's threat matching (see DOMAIN_THREAT_KEYWORDS). */
export function domainKeywordRegex(domain: DomainId): RegExp {
  const terms = DOMAIN_THREAT_KEYWORDS[domain].map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (terms.length === 0) return /(?!)/ // matches nothing
  return new RegExp(`(${terms.join('|')})`, 'i')
}

function threatMatchesDomain(t: ThreatData, regex: RegExp): boolean {
  return (
    regex.test(t.description || '') ||
    regex.test(t.cryptoAtRisk || '') ||
    regex.test(t.threatId || '')
  )
}

/**
 * Impact bands, calibrated against the real threat corpus rather than chosen
 * for roundness — derived at module load so they can never silently drift
 * from the data (the previous hardcoded bands were quartiles of a corpus
 * revision that had since moved on). Every distinct corpus industry × every
 * domain is scored exactly the way the live matrix scores it (sector-key
 * industry join including Cross-Industry threats, severity weights above);
 * the bands are the p25/p50/p75/p90 of the non-zero scores, so a level-5
 * domain is genuinely in the corpus's top decile rather than merely "the
 * biggest of however many domains happen to be on screen".
 */
export function deriveImpactBands(allThreats: ThreatData[]): number[] {
  const industries = [...new Set(allThreats.map((t) => t.industry))].filter(
    (ind) => ind && !isCrossIndustry(ind)
  )
  const regexes = DOMAIN_ORDER.map((d) => domainKeywordRegex(d))
  const scores: number[] = []
  for (const industry of industries) {
    const industryThreats = allThreats.filter((t) => matchesIndustry(t.industry, industry))
    for (const regex of regexes) {
      let score = 0
      for (const t of industryThreats) {
        if (threatMatchesDomain(t, regex)) score += THREAT_SEVERITY_WEIGHT[t.criticality] ?? 0
      }
      if (score > 0) scores.push(score)
    }
  }
  if (scores.length === 0) return [3, 5, 9, 15] // corpus empty — keep last known shape
  scores.sort((a, b) => a - b)
  const pct = (q: number) =>
    scores[Math.min(scores.length - 1, Math.floor(q * (scores.length - 1)))]
  // Strictly increasing: collapse ties upward so the 4 bands stay 4 levels.
  const raw = [pct(0.25), pct(0.5), pct(0.75), pct(0.9)].map(Math.round)
  for (let i = 1; i < raw.length; i++) if (raw[i] <= raw[i - 1]) raw[i] = raw[i - 1] + 1
  return raw
}

export const IMPACT_BANDS: readonly number[] = deriveImpactBands(threatsData)

/**
 * Absolute impact level (0–5) for a layer, from the severity-weighted total of
 * the industry threats matching it.
 *
 * Impact used to be `threatMatches / totalThreatMatches` — a SHARE of the
 * displayed estate, which sums to 1 by construction. On the nine canonical
 * layers that meant every layer scored 1 ("Negligible") whenever threats were
 * spread at all evenly, capping the whole matrix at "Low" no matter how
 * exposed the organization was, and a layer needed 80% of every threat match
 * in the estate to reach 5. It also meant adding a vendor or a layer
 * mechanically downgraded every other layer. Worse, it made the two axes
 * different kinds of quantity: likelihood is an absolute within-layer gap
 * fraction, impact was a relative cross-layer share, and the risk score
 * multiplied them together. (Audit 2026-08-10, W1-4.)
 *
 * Impact still comes from real threat data and never from
 * `pqcMigrationPriority` — using a curator's priority judgement to justify a
 * priority score is the circularity the `criticalHigh` field is kept out of.
 */
export function threatImpactLevel(weightedThreatScore: number): number {
  if (weightedThreatScore <= 0) return 0
  return IMPACT_BANDS.filter((b) => weightedThreatScore >= b).length + 1
}

export function isCriticalOrHighPriority(priority: string): boolean {
  const p = (priority || '').toLowerCase()
  return p === 'critical' || p === 'high'
}

/** Sum of known NVD CVEs (MEDIUM+, per the static snapshot) across a domain's
 *  products, joined via the same softwareName-keyed CPE xref
 *  CryptoVulnerabilityWatch.tsx uses. `null` snapshot (still loading) or a
 *  product with no CPE match contributes 0, not an error — this is a known-
 *  exposure count, not a completeness claim. */
function countDomainCves(products: SoftwareItem[], snapshot: CveSnapshot | null): number {
  if (!snapshot) return 0
  let total = 0
  for (const product of products) {
    const xref = cpeByProduct.get(product.softwareName)
    if (!xref || !xref.cpeUri || xref.status === 'not_found') continue
    total += snapshot.byCpe?.[xref.cpeUri]?.length ?? 0
  }
  return total
}

export interface DomainStat {
  domainId: DomainId
  products: SoftwareItem[]
  total: number
  pqcReady: number
  fipsValidated: number
  hybridSupport: number
  /** Count of products flagged Critical/High `pqcMigrationPriority` by
   *  the catalog curator. Real data, surfaced as its own "Priority"
   *  badge — no longer used as the Impact axis input (see below). */
  criticalHigh: number
  /** 1–5, or 0 when the domain is fully PQC-ready: share of the domain not
   *  yet PQC-ready. Labeled "Migration Gap" in the UI, not "Likelihood"
   *  — see the comment above MATRIX_LIKELIHOOD_LABELS. */
  likelihood: number
  threatMatches: number
  /** Known NVD CVEs (MEDIUM+) across the domain's products, per the static
   *  snapshot — see countDomainCves. */
  cveCount: number
  /** null when hasIndustryContext is false ("not personalized" — Impact
   *  can't be computed from real threat data without an industry). */
  impact: number | null
  riskScore: number | null
}

/**
 * Per-domain Migration-Gap × Impact statistics — the shared computation behind
 * both the live SupplyChainRiskMatrix component and its exec-tour sample doc
 * (realToolDocs.ts). Impact is derived from the share of the given industry's
 * threats that name each domain (via domainKeywordRegex) — a genuinely
 * separate signal from the catalog's own `pqcMigrationPriority` field, to
 * avoid the circular reasoning of using a priority judgment to justify itself
 * (see the `criticalHigh` field above). `hasIndustryContext=false` leaves
 * impact/riskScore null rather than silently falling back to criticalHigh,
 * which would reintroduce that exact circularity.
 */
export function computeDomainStats(
  vendorsByDomain: Map<DomainId, SoftwareItem[]>,
  industryThreats: ThreatData[],
  hasIndustryContext: boolean,
  cveSnapshot: CveSnapshot | null
): DomainStat[] {
  const domainThreatMatchCounts = new Map<DomainId, number>()
  // Severity-weighted total per domain — the ABSOLUTE impact input (W1-4).
  const domainThreatSeverity = new Map<DomainId, number>()
  for (const domainId of DOMAIN_ORDER) {
    const regex = domainKeywordRegex(domainId)
    const matched = industryThreats.filter((t) => threatMatchesDomain(t, regex))
    domainThreatMatchCounts.set(domainId, matched.length)
    domainThreatSeverity.set(
      domainId,
      matched.reduce((sum, t) => sum + (THREAT_SEVERITY_WEIGHT[t.criticality] ?? 0), 0)
    )
  }

  const base: Omit<DomainStat, 'impact' | 'riskScore'>[] = []

  for (const domainId of DOMAIN_ORDER) {
    const products = vendorsByDomain.get(domainId)
    if (!products || products.length === 0) continue

    const total = products.length
    const pqcReady = products.filter((p) => isPqcReady(p.pqcSupport)).length
    const fipsValid = products.filter((p) => isFips1403Validated(p.fipsValidated)).length
    const hybrid = products.filter((p) => {
      const desc = (p.pqcCapabilityDescription || '').toLowerCase()
      const support = (p.pqcSupport || '').toLowerCase()
      return desc.includes('hybrid') || support.includes('hybrid')
    }).length
    const criticalHigh = products.filter((p) =>
      isCriticalOrHighPriority(p.pqcMigrationPriority)
    ).length

    const gapCount = total - pqcReady
    const likelihood = toMatrixLevel(total > 0 ? gapCount / total : 0)

    base.push({
      domainId,
      products,
      total,
      pqcReady,
      fipsValidated: fipsValid,
      hybridSupport: hybrid,
      criticalHigh,
      likelihood,
      threatMatches: domainThreatMatchCounts.get(domainId) ?? 0,
      cveCount: countDomainCves(products, cveSnapshot),
    })
  }

  return base.map((s) => {
    if (!hasIndustryContext) {
      return { ...s, impact: null, riskScore: null }
    }
    // Absolute, severity-weighted — NOT a share of the displayed estate, so a
    // domain's impact no longer changes when unrelated domains come and go.
    const impact = threatImpactLevel(domainThreatSeverity.get(s.domainId) ?? 0)
    const riskScore = s.likelihood > 0 && impact > 0 ? s.likelihood * impact : 0
    return { ...s, impact, riskScore }
  })
}

export function matrixRiskLevel(score: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (score >= 20) return 'Critical'
  if (score >= 12) return 'High'
  if (score >= 6) return 'Medium'
  return 'Low'
}

function matrixBadgeClasses(score: number): string {
  if (score >= 20) return 'bg-status-error/10 text-status-error border-status-error/20'
  if (score >= 12) return 'bg-status-warning/10 text-status-warning border-status-warning/20'
  if (score >= 6) return 'bg-primary/10 text-primary border-primary/20'
  return 'bg-status-success/10 text-status-success border-status-success/20'
}

export interface DomainMatrixEntry {
  domainId: DomainId
  label: string
  likelihood: number
  impact: number
  score: number
}

/** Minimum name length before a provider's product name is used as a text-match
 *  signal — short names (e.g. "AES") would otherwise false-positive constantly. */
const DEPENDENCY_NAME_MIN_LENGTH = 5

export interface DependencyRelation {
  provider: SoftwareItem
  dependents: SoftwareItem[]
}

/** Real (not fabricated) product-to-product dependency signal: a consumer product's
 *  own catalog description/brief mentioning a Library- or Hardware-layer product by
 *  name (e.g. "BoringSSL" mentioning "OpenSSL", "Thales payShield 10K" mentioning
 *  "Thales Luna HSM"). Grounded entirely in existing SoftwareItem text fields. */
export function buildDependencyRelations(
  providers: SoftwareItem[],
  consumers: SoftwareItem[]
): DependencyRelation[] {
  const seenProviders = new Map<string, SoftwareItem>()
  for (const p of providers) {
    if (!seenProviders.has(p.productId)) seenProviders.set(p.productId, p)
  }

  // Each consumer's search text is built ONCE, not once per provider. The
  // inner filter previously rebuilt and lower-cased
  // `pqcCapabilityDescription + productBrief` for every provider it tested,
  // so the unfiltered catalog view did roughly providers × consumers string
  // builds — tens of thousands of them — before rendering anything. Same
  // matching, same results; just hoisted. (Re-audit batch 4a, 2026-08-11.)
  const haystacks = new Map<string, string>()
  for (const c of consumers) {
    haystacks.set(
      c.productId,
      `${c.pqcCapabilityDescription || ''} ${c.productBrief || ''}`.toLowerCase()
    )
  }

  const relations: DependencyRelation[] = []
  for (const provider of seenProviders.values()) {
    const name = (provider.softwareName || '').trim()
    if (name.length < DEPENDENCY_NAME_MIN_LENGTH) continue
    const needle = name.toLowerCase()
    const dependents = consumers.filter((c) => {
      if (c.productId === provider.productId) return false
      return (haystacks.get(c.productId) ?? '').includes(needle)
    })
    if (dependents.length > 0) relations.push({ provider, dependents })
  }
  return relations.sort((a, b) => b.dependents.length - a.dependents.length)
}

/** Domains with a real, non-null score placed on the 5×5 grid. The grid's
 *  row/col math (`5 - likelihood`, `impact - 1`) has no slot for level 0 on
 *  either axis, so a domain with a zero Migration Gap or zero Impact can't be
 *  plotted — those belong in {@link computeNoRiskDomains} instead of being
 *  silently dropped or floored back up to a fake nonzero score. */
export function computeMatrixEntries(domainStats: DomainStat[]): DomainMatrixEntry[] {
  return domainStats
    .filter(
      (stat): stat is DomainStat & { impact: number; riskScore: number } =>
        stat.impact !== null && stat.likelihood > 0 && stat.impact > 0
    )
    .map((stat) => ({
      domainId: stat.domainId,
      label: DOMAINS[stat.domainId]?.label ?? stat.domainId,
      likelihood: stat.likelihood,
      impact: stat.impact,
      score: stat.riskScore,
    }))
}

/** Domains with a real, computed (non-null) score of exactly 0 on either
 *  axis — fully PQC-ready and/or matching no industry threats. Not a bug to
 *  hide: shown as its own "no risk" list, attached directly to the grid,
 *  with domains named (not just counted) so it reads as "the rest of the
 *  picture," not "these dropped out." */
export function computeNoRiskDomains(domainStats: DomainStat[]): DomainStat[] {
  return domainStats.filter(
    (stat) => stat.impact !== null && (stat.likelihood === 0 || stat.impact === 0)
  )
}

export interface SupplyChainMarkdownInput {
  industry: string
  country: string
  totalProducts: number
  overallPqcPct: number
  pqcReadyCount: number
  overallFipsPct: number
  fipsValidatedCount: number
  domainStats: DomainStat[]
  matrixEntries: DomainMatrixEntry[]
  noRiskDomains: DomainStat[]
  hasIndustryContext: boolean
  /** Where to tell the reader to go personalize (differs by the live tool's
   *  mount point — 'Step 1' in the Learn-module wizard, 'the Assess page' on
   *  /migrate). Unused when hasIndustryContext is true. */
  industryContextHint: string
  dependencyRelations: DependencyRelation[]
  cbomBuckets: Record<CSWP39AssetClass, SoftwareItem[]>
  pipelineSources: string
  refreshCadence: string
  cmdbMapping: string
}

/**
 * Renders the Supply Chain PQC Risk Matrix export — the shared markdown
 * builder behind both the live tool's "Export" button and its exec-tour
 * sample doc (realToolDocs.ts). Pure formatting only: every number/list here
 * is already computed by the caller (computeDomainStats, computeMatrixEntries,
 * computeNoRiskDomains, buildDependencyRelations, mapToAssetClass) — a fix to
 * any of those shows up here automatically.
 */
export function buildSupplyChainMarkdown(input: SupplyChainMarkdownInput): string {
  const {
    industry,
    country,
    totalProducts,
    overallPqcPct,
    pqcReadyCount,
    overallFipsPct,
    fipsValidatedCount,
    domainStats,
    matrixEntries,
    noRiskDomains,
    hasIndustryContext,
    industryContextHint,
    dependencyRelations,
    cbomBuckets,
    pipelineSources,
    refreshCadence,
    cmdbMapping,
  } = input

  let md = '# Supply Chain PQC Risk Matrix\n\n'
  md += `**Generated:** ${new Date().toLocaleDateString()}\n`
  if (industry) md += `**Industry:** ${industry}\n`
  if (country) md += `**Country:** ${country}\n`
  md += `**Products Analyzed:** ${totalProducts}\n\n`

  md += '## Summary\n\n'
  md += `| Metric | Value |\n|--------|-------|\n`
  md += `| PQC Ready | ${overallPqcPct}% (${pqcReadyCount}/${totalProducts}) |\n`
  md += `| FIPS Validated | ${overallFipsPct}% (${fipsValidatedCount}/${totalProducts}) |\n`
  md += `| Domains Covered | ${domainStats.length} |\n\n`

  md += '## Domain Breakdown\n\n'
  for (const stat of domainStats) {
    const label = DOMAINS[stat.domainId]?.label ?? stat.domainId
    const gapCount = stat.total - stat.pqcReady
    md += `### ${label} (${stat.total} products)\n\n`
    md += `| Metric | Count | % |\n|--------|-------|---|\n`
    md += `| PQC Ready | ${stat.pqcReady} | ${stat.total > 0 ? Math.round((stat.pqcReady / stat.total) * 100) : 0}% |\n`
    md += `| FIPS Validated | ${stat.fipsValidated} | ${stat.total > 0 ? Math.round((stat.fipsValidated / stat.total) * 100) : 0}% |\n`
    md += `| Hybrid Support | ${stat.hybridSupport} | ${stat.total > 0 ? Math.round((stat.hybridSupport / stat.total) * 100) : 0}% |\n`
    md += `| Migration Gap | ${gapCount} | ${stat.total > 0 ? Math.round((gapCount / stat.total) * 100) : 0}% |\n`
    md += `| Priority (Critical/High, catalog-curated) | ${stat.criticalHigh} | ${stat.total > 0 ? Math.round((stat.criticalHigh / stat.total) * 100) : 0}% |\n`
    if (stat.impact === null) {
      md += `| Migration Gap × Impact | ${stat.likelihood} × not personalized | — (select an industry to compute Impact) |\n\n`
    } else {
      md += `| Migration Gap × Impact | ${stat.likelihood} × ${stat.impact} | Score ${stat.riskScore} (${stat.likelihood === 0 || stat.impact === 0 ? 'No risk — not plotted on grid' : matrixRiskLevel(stat.riskScore ?? 0)}) |\n\n`
    }
  }

  md += '## Migration Gap × Impact Risk Matrix\n\n'
  if (!hasIndustryContext) {
    md += `_Not personalized: select an industry/country in ${industryContextHint} to compute Impact from real threat data. Migration Gap alone is shown per domain above._\n\n`
  } else {
    md +=
      '_Migration Gap derives from the share of each domain not yet PQC-ready. Impact is the severity-weighted count of this industry\'s supply-chain-relevant threats naming each domain (Critical 4, High 3, Medium 2, Low 1), banded 1-5 at the quartiles of the real threat corpus — an absolute measure that does not shift when other domains are added or removed, and an independent signal from the separately-authored threats catalog, not the catalog\'s own `pqcMigrationPriority` field (shown separately above as "Priority"). Both are heuristics, not validated risk measurements — see the methodology note above the grid._\n\n'
    md += '| Domain | Migration Gap (1-5) | Impact (1-5) | Score | Level |\n|---|---|---|---|---|\n'
    for (const entry of [...matrixEntries].sort((a, b) => b.score - a.score)) {
      md += `| ${entry.label} | ${entry.likelihood} | ${entry.impact} | ${entry.score} | ${matrixRiskLevel(entry.score)} |\n`
    }
    if (noRiskDomains.length > 0) {
      md += `\n_No risk — not plotted (0 on at least one axis):_ ${noRiskDomains.map((s) => DOMAINS[s.domainId]?.label ?? s.domainId).join(', ')}\n`
    }
  }
  md += '\n'

  md += '## Product Dependencies\n\n'
  if (dependencyRelations.length === 0) {
    md +=
      '_No text-detected dependencies between catalog products in this view (a consumer product must reference a crypto-library, hardware, or HSM product by name in its own description)._\n\n'
  } else {
    md += '| Library / HSM | Depended on by |\n|---|---|\n'
    for (const rel of dependencyRelations) {
      md += `| ${rel.provider.softwareName} | ${rel.dependents.map((d) => d.softwareName).join(', ')} |\n`
    }
    md += '\n'
  }

  // This tool's own 6-class CBOM grouping, informed by CSWP.39 §5.3's
  // asset-centric approach (not a taxonomy CSWP.39 itself defines).
  md += '## CBOM (6 asset classes, informed by CSWP.39 §5.3)\n\n'
  const classOrder: CSWP39AssetClass[] = [
    'Code',
    'Library',
    'Application',
    'File',
    'Protocol',
    'System',
  ]
  for (const cls of classOrder) {
    const items = cbomBuckets[cls]
    md += `### ${cls} (${items.length})\n\n`
    if (items.length === 0) {
      md += '_No products mapped to this asset class._\n\n'
      continue
    }
    md += `| Product | Vendor | PQC Support | FIPS |\n|---|---|---|---|\n`
    for (const item of items) {
      const vendorName =
        (item.vendorId && vendorMap.get(item.vendorId)?.vendorName) || item.vendorId || '—'
      md += `| ${item.softwareName} | ${vendorName} | ${item.pqcSupport || 'Unknown'} | ${item.fipsValidated || '—'} |\n`
    }
    md += '\n'
  }

  // CSWP.39 §5.3 — Pipeline + Refresh + CMDB metadata.
  md += '## Pipeline Sources (CSWP.39 §5.3)\n\n'
  md += pipelineSources.trim() || '_No upstream SBOM/CMDB sources documented yet._'
  md += '\n\n'

  md += '## Refresh Cadence\n\n'
  md += `**Target cadence:** ${refreshCadence || 'Not specified'}\n\n`

  md += '## CMDB → CBOM Mapping\n\n'
  md += cmdbMapping.trim() || '_No CMDB-to-CBOM mapping documented yet._'
  md += '\n\n'

  return md
}

function buildDomainEntriesMap(entries: DomainMatrixEntry[]): Map<string, DomainMatrixEntry[]> {
  const map = new Map<string, DomainMatrixEntry[]>()
  for (const e of entries) {
    const rowIdx = 5 - e.likelihood
    const colIdx = e.impact - 1
    const key = `${rowIdx}-${colIdx}`
    const existing = map.get(key)
    if (existing) existing.push(e)
    else map.set(key, [e])
  }
  return map
}

/** 5×5 likelihood × impact grid — plots migration domains instead of
 *  individual risks, on top of the shared `HeatmapGrid` component (the same
 *  one `RiskHeatmapGenerator` is grounded in conceptually) rather than a
 *  hand-rolled table. */
function SupplyChainRiskGrid({
  entriesMap,
  onCellClick,
}: {
  entriesMap: Map<string, DomainMatrixEntry[]>
  onCellClick?: (rowIdx: number, colIdx: number) => void
}) {
  const rows = MATRIX_LIKELIHOOD_LABELS.map((label, rowIdx) => `${5 - rowIdx} · ${label}`)
  const columns = MATRIX_IMPACT_LABELS.map((label, colIdx) => `${colIdx + 1} · ${label}`)
  const cells: HeatmapCell[][] = MATRIX_LIKELIHOOD_LABELS.map((_, rowIdx) => {
    const likelihood = 5 - rowIdx
    return MATRIX_IMPACT_LABELS.map((_, colIdx) => {
      const impact = colIdx + 1
      const score = likelihood * impact
      const cellEntries = entriesMap.get(`${rowIdx}-${colIdx}`) ?? []
      return {
        value: (score / 25) * 100,
        labels: cellEntries.map((e) => e.label),
        tooltip: `Score ${score} (${matrixRiskLevel(score)})`,
      }
    })
  })
  return (
    <HeatmapGrid
      rows={rows}
      columns={columns}
      cells={cells}
      colorScale="risk"
      onCellClick={onCellClick}
    />
  )
}

/** One provider + its dependents. Click the provider name or a dependent
 *  chip to expand that product's full ProductDetail below the card — only
 *  one entity's detail open per card at a time. Self-contained (its own
 *  local state) rather than reusing PLAN-CERT-01's cert popover: chips here
 *  are too narrow to host a floating panel, and this keeps the two plans
 *  independent of each other. */
const DependencyRelationCard: React.FC<{ rel: DependencyRelation }> = ({ rel }) => {
  const [expanded, setExpanded] = useState<SoftwareItem | null>(null)
  const toggle = (item: SoftwareItem) =>
    setExpanded((cur) => (cur?.productId === item.productId ? null : item))

  return (
    <div className="rounded-md border border-border bg-muted/30 p-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-sm font-medium text-foreground hover:text-primary hover:underline"
          aria-expanded={expanded?.productId === rel.provider.productId}
          onClick={() => toggle(rel.provider)}
        >
          {rel.provider.softwareName}
        </Button>
        {renderPqcBadge(rel.provider.pqcSupport)}
        <span className="text-xs text-muted-foreground">
          depended on by {rel.dependents.length}{' '}
          {rel.dependents.length === 1 ? 'product' : 'products'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {rel.dependents.map((d) => (
          <Button
            type="button"
            variant="ghost"
            key={d.productId}
            size="sm"
            aria-expanded={expanded?.productId === d.productId}
            className={`h-auto rounded-full px-2 py-0.5 max-md:py-1.5 text-xs font-normal ${
              expanded?.productId === d.productId
                ? 'border-primary text-primary bg-background'
                : 'border-border text-muted-foreground bg-background'
            } border hover:border-primary hover:text-primary`}
            onClick={() => toggle(d)}
          >
            {d.softwareName}
          </Button>
        ))}
      </div>
      {expanded && (
        <div className="mt-2 border-t border-border/50 pt-2">
          <ProductDetail product={expanded} />
        </div>
      )}
    </div>
  )
}

export const SupplyChainRiskMatrix: React.FC<{
  scorecardOutput?: ScorecardOutput | null
  /** 'glass' (default) matches this component's home in the Learn-module vendor-
   *  risk wizard. Migrate's asset-first workbench uses flat cards everywhere
   *  else, so it mounts this with 'flat' instead of a global restyle. */
  variant?: 'glass' | 'flat'
}> = ({ scorecardOutput, variant = 'glass' }) => {
  const cardClass = (extra = '') =>
    variant === 'flat'
      ? `rounded-xl border border-border bg-card ${extra}`.trim()
      : `glass-panel ${extra}`.trim()
  const [docsOpen, setDocsOpen] = useState(false)
  const [cveSnapshot, setCveSnapshot] = useState<CveSnapshot | null>(null)
  useEffect(() => {
    let cancelled = false
    loadCveSnapshot()
      .then((s) => {
        if (!cancelled) setCveSnapshot(s)
      })
      .catch(() => {
        // Educational digest only — a failed/missing snapshot just leaves
        // the CVE badges at 0, no error surface needed here.
      })
    return () => {
      cancelled = true
    }
  }, [])
  const myProducts = useSelectedProductIds()
  const {
    vendorsByDomain,
    fipsValidatedCount,
    pqcReadyCount,
    totalProducts,
    industry,
    country,
    industryThreats,
  } = useExecutiveModuleData(myProducts.length > 0 ? myProducts : undefined)
  const { addExecutiveDocument } = useModuleStore()

  const selectedItems = useMemo(
    () => (myProducts.length > 0 ? resolveProductNames(myProducts) : []),
    [myProducts]
  )

  // FIXED 2026-07-16 (migrate-process remediation Phase 5, U6): this
  // component's "personalize with an industry/country" empty states said
  // "Step 1" unconditionally — correct in its home (the Learn-module vendor-
  // risk wizard, which has one), a dead-end reference on /migrate (variant
  // 'flat'), where there is no "Step 1" at all.
  const industryContextHint = variant === 'flat' ? 'the Assess page' : 'Step 1'

  // CSWP.39 §5.3 educational extensions: CBOM by asset class + pipeline metadata.
  const savedInputs = useSavedArtifactInputs<SavedSupplyChainInputs>('supply-chain-matrix')
  const [pipelineSources, setPipelineSources] = useState(savedInputs?.pipelineSources ?? '')
  // No silent pre-fill — the input shows a placeholder of suggested cadences instead.
  const [refreshCadence, setRefreshCadence] = useState(savedInputs?.refreshCadence ?? '')
  const [cmdbMapping, setCmdbMapping] = useState(savedInputs?.cmdbMapping ?? '')

  const cbomBuckets = useMemo(() => {
    const source: SoftwareItem[] =
      selectedItems.length > 0 ? selectedItems : Array.from(vendorsByDomain.values()).flat()
    const buckets: Record<CSWP39AssetClass, SoftwareItem[]> = {
      Code: [],
      Library: [],
      Application: [],
      File: [],
      Protocol: [],
      System: [],
    }
    for (const item of source) {
      buckets[mapToAssetClass(item)].push(item)
    }
    return buckets
  }, [selectedItems, vendorsByDomain])

  // Impact used to be derived from `pqcMigrationPriority` — a hand-curated
  // catalog field that may already have been set considering impact, which
  // risked circular reasoning (using a priority judgment to justify the same
  // priority judgment). `industryThreats` is a genuinely separate data
  // source (the threats/compliance-framework catalog), so a per-domain count
  // of matching threats is used instead. This breaks the circularity but is
  // still a heuristic (keyword matching), not a validated measurement — it's
  // not more *accurate* than the old field, just no longer the same field
  // reused to justify itself.
  const hasIndustryContext = industry.trim().length > 0

  const domainStats = useMemo(
    () => computeDomainStats(vendorsByDomain, industryThreats, hasIndustryContext, cveSnapshot),
    [vendorsByDomain, industryThreats, hasIndustryContext, cveSnapshot]
  )

  /** Domains with a real, non-null score placed on the 5×5 grid. The grid's
   *  row/col math (`5 - likelihood`, `impact - 1`) has no slot for level 0
   *  on either axis, so a domain with a zero Migration Gap or zero Impact
   *  can't be plotted — those are listed separately below instead of being
   *  silently dropped or floored back up to a fake nonzero score. */
  const matrixEntries = useMemo(() => computeMatrixEntries(domainStats), [domainStats])
  const matrixEntriesMap = useMemo(() => buildDomainEntriesMap(matrixEntries), [matrixEntries])
  const noRiskDomains = useMemo(() => computeNoRiskDomains(domainStats), [domainStats])

  // Real product-to-product dependencies: crypto-library / hardware / HSM
  // products ("providers") that other catalog products ("consumers")
  // reference by name in their own description/brief text. Providers come
  // from the domain taxonomy — the old raw-layer keys ('Libraries',
  // 'Hardware') missed every HSM filed under a stray layer spelling.
  const dependencyRelations = useMemo(() => {
    const providers = [
      ...(vendorsByDomain.get('foundations') ?? []),
      ...(vendorsByDomain.get('hardware') ?? []),
      ...(vendorsByDomain.get('hsm') ?? []),
    ]
    const consumers =
      selectedItems.length > 0 ? selectedItems : Array.from(vendorsByDomain.values()).flat()
    return buildDependencyRelations(providers, consumers)
  }, [vendorsByDomain, selectedItems])

  const overallPqcPct = totalProducts > 0 ? Math.round((pqcReadyCount / totalProducts) * 100) : 0
  const overallFipsPct =
    totalProducts > 0 ? Math.round((fipsValidatedCount / totalProducts) * 100) : 0

  const exportMarkdown = useMemo(
    () =>
      buildSupplyChainMarkdown({
        industry,
        country,
        totalProducts,
        overallPqcPct,
        pqcReadyCount,
        overallFipsPct,
        fipsValidatedCount,
        domainStats,
        matrixEntries,
        noRiskDomains,
        hasIndustryContext,
        industryContextHint,
        dependencyRelations,
        cbomBuckets,
        pipelineSources,
        refreshCadence,
        cmdbMapping,
      }),
    [
      industry,
      country,
      totalProducts,
      overallPqcPct,
      pqcReadyCount,
      overallFipsPct,
      fipsValidatedCount,
      domainStats,
      matrixEntries,
      noRiskDomains,
      hasIndustryContext,
      industryContextHint,
      dependencyRelations,
      cbomBuckets,
      pipelineSources,
      refreshCadence,
      cmdbMapping,
    ]
  )

  // A real, schema-valid CycloneDX 1.7 CBOM (shared emitter). Each product maps
  // through the same SoftwareItem adapter the Migrate export uses, tagged with its
  // CSWP.39 asset class; PQC and classical algorithms both surface as
  // `cryptographic-asset` children
  // carrying `cryptoProperties` (the part the old inline JSON was missing).
  const cbomResult = useMemo(() => {
    const inputs = (Object.keys(cbomBuckets) as CSWP39AssetClass[]).flatMap((cls) =>
      cbomBuckets[cls].map((item) =>
        softwareItemToCbomInput(item, [{ name: 'cswp39:assetClass', value: cls }])
      )
    )
    return buildCbomDocument(inputs, {
      toolName: 'PQC Today Supply-Chain CBOM',
      properties: [
        ...(industry ? [{ name: 'industry', value: industry }] : []),
        ...(country ? [{ name: 'country', value: country }] : []),
      ],
    })
  }, [cbomBuckets, industry, country])

  const handleDownloadCbomJson = useCallback(() => {
    downloadCbomJson(cbomResult.json, 'cbom-cyclonedx')
  }, [cbomResult])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `supply-chain-matrix-${Date.now()}`,
      moduleId: 'vendor-risk',
      type: 'supply-chain-matrix',
      title: `Supply Chain Risk Matrix (${overallPqcPct}% PQC Ready)`,
      data: exportMarkdown,
      inputs: { pipelineSources, refreshCadence, cmdbMapping },
      createdAt: Date.now(),
    })
  }, [
    addExecutiveDocument,
    overallPqcPct,
    exportMarkdown,
    pipelineSources,
    refreshCadence,
    cmdbMapping,
  ])

  // Filter industry threats to supply-chain–relevant ones. We keyword-match
  // the threat description and threatId for terms tied to the supply-chain
  // attack surface (vendor backdoors, third-party components, software
  // supply, CBOM gaps, etc.) so the banner count accurately reflects
  // what's surfaced — not a generic industry-threat tally.
  const supplyChainThreats = useMemo(() => {
    const KEYWORDS =
      /(supply[- ]?chain|vendor|third[- ]?party|sbom|cbom|component|backdoor|firmware|hsm|library)/i
    return industryThreats.filter(
      (t) =>
        KEYWORDS.test(t.description || '') ||
        KEYWORDS.test(t.threatId || '') ||
        KEYWORDS.test(t.cryptoAtRisk || '')
    )
  }, [industryThreats])

  const seedSources: string[] = []
  if (myProducts.length > 0)
    seedSources.push(
      `${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`
    )
  if (industry) seedSources.push(`industry (${industry})`)
  if (country) seedSources.push(`country (${country})`)
  if (supplyChainThreats.length > 0)
    seedSources.push(
      `${supplyChainThreats.length} supply-chain threat${supplyChainThreats.length !== 1 ? 's' : ''} from your industry`
    )

  // Drill-down: HeatmapGrid already supports onCellClick, just unused here
  // before now. Resolves the domain(s) in the clicked cell and scrolls to +
  // briefly highlights their existing domain card(s) below, instead of
  // building a new UI surface for what the domain cards already show.
  const domainCardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [highlightedDomainId, setHighlightedDomainId] = useState<string | null>(null)
  const handleMatrixCellClick = useCallback(
    (rowIdx: number, colIdx: number) => {
      const entries = matrixEntriesMap.get(`${rowIdx}-${colIdx}`)
      if (!entries || entries.length === 0) return
      const target = domainCardRefs.current[entries[0].domainId]
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedDomainId(entries[0].domainId)
      window.setTimeout(() => setHighlightedDomainId(null), 1600)
    },
    [matrixEntriesMap]
  )

  return (
    <div className="space-y-6">
      {seedSources.length > 0 && (
        <PreFilledBanner summary={`Matrix derived from ${seedSources.join(' + ')}.`} />
      )}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-sm text-foreground/80">
          This view maps {myProducts.length > 0 ? 'your selected' : ''} product capabilities across
          migration domains using real data from the migration catalog. Each domain card shows PQC
          readiness, FIPS validation status, hybrid support, and gaps requiring vendor engagement.
        </p>
      </div>

      {selectedItems.length > 0 ? (
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare size={14} className="text-primary" />
            <span className="text-sm font-medium text-foreground">
              Mapping {selectedItems.length} selected product
              {selectedItems.length !== 1 ? 's' : ''} across your infrastructure
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedItems.map((item) => (
              <span
                key={item.productId}
                className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground"
              >
                {item.softwareName}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            Showing all catalog products. Select your infrastructure in{' '}
            {variant === 'flat' ? 'the Replace tab' : 'Step 1'} for personalized results.
          </span>
        </div>
      )}

      {/* Scorecard import summary from Step 2 — only ever reachable when a caller
          passes scorecardOutput (the Learn-module wizard); Migrate's workbench
          mounts this with none, so this whole block stays dead code there. */}
      {scorecardOutput && scorecardOutput.rows.length > 0 && (
        <div className={cardClass('p-4')}>
          <PreFilledBanner
            summary={`Vendor data imported from Step 2 scorecard — ${scorecardOutput.rows.length} vendor${scorecardOutput.rows.length !== 1 ? 's' : ''}.`}
          />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-1.5 pr-3 font-medium">Vendor</th>
                  <th className="py-1.5 px-2 font-medium text-center">Products</th>
                  <th className="py-1.5 px-2 font-medium text-center">Readiness Score</th>
                  <th className="py-1.5 px-2 font-medium text-center">Level</th>
                </tr>
              </thead>
              <tbody>
                {scorecardOutput.rows.map((row) => {
                  const isLow = row.overall < 50
                  const scoreColor =
                    row.overall >= 75
                      ? 'text-status-success'
                      : row.overall >= 50
                        ? 'text-status-warning'
                        : 'text-status-error'
                  return (
                    <tr key={row.vendor} className="border-b border-border/50">
                      <td className="py-1.5 pr-3 text-foreground">{row.vendor}</td>
                      <td className="py-1.5 px-2 text-center text-muted-foreground">
                        {row.productCount}
                      </td>
                      <td className={`py-1.5 px-2 text-center font-bold ${scoreColor}`}>
                        {row.overall}/100
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                            isLow
                              ? 'bg-destructive/10 text-status-error border-destructive/20'
                              : row.overall >= 75
                                ? 'bg-status-success/10 text-status-success border-status-success/20'
                                : 'bg-status-warning/10 text-status-warning border-status-warning/20'
                          }`}
                        >
                          {isLow ? 'Low' : row.overall >= 75 ? 'High' : 'Medium'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Likelihood × Impact Risk Matrix */}
      <div className={cardClass('p-4')}>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Supply Chain Risk Matrix (Migration Gap × Impact)
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Each migration domain plotted by <strong>migration gap</strong> (share of the domain not
          yet PQC-ready) × <strong>impact</strong> (the severity-weighted count of this
          industry&apos;s supply-chain-relevant threats naming this domain — Critical threats weigh
          4, High 3, Medium 2, Low 1). Impact is an <em>absolute</em> measure: it does not change
          when other domains are added or removed, and its 1–5 bands are set at the quartiles of the
          real threat corpus, so a level-5 domain sits in its top decile. Both axes are heuristics
          derived from real catalog/threat data, not a validated risk-probability estimate — click a
          cell to jump to the domain(s) it represents below.
        </p>
        {!hasIndustryContext ? (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <Info size={14} className="mt-0.5 shrink-0" />
            <div>
              <p>
                Impact requires an industry/country context to compute from real threat data —
                select yours in {industryContextHint}. Showing Migration Gap only, worst first:
              </p>
              <ul className="mt-2 space-y-1">
                {[...domainStats]
                  .sort((a, b) => b.likelihood - a.likelihood)
                  .map((stat) => (
                    <li key={stat.domainId} className="flex items-center justify-between gap-2">
                      <span className="text-foreground">
                        {DOMAINS[stat.domainId]?.label ?? stat.domainId}
                      </span>
                      <span className="tabular-nums">
                        {stat.likelihood === 0
                          ? 'Fully ready'
                          : `${MATRIX_LIKELIHOOD_LABELS[5 - stat.likelihood]}`}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-5 shrink-0 self-center">
                <span
                  className="text-[10px] font-bold text-muted-foreground whitespace-nowrap tracking-widest"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  MIGRATION GAP
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <SupplyChainRiskGrid
                  entriesMap={matrixEntriesMap}
                  onCellClick={handleMatrixCellClick}
                />
                <div className="text-center">
                  <span className="text-[10px] font-bold text-muted-foreground tracking-widest">
                    IMPACT
                  </span>
                </div>
              </div>
            </div>
            {noRiskDomains.length > 0 && (
              <div
                data-testid="no-risk-strip"
                className="mt-2 flex items-start gap-2 rounded-lg border border-status-success/30 bg-status-success/5 p-2 text-xs text-muted-foreground"
              >
                <CheckCircle size={13} className="mt-0.5 shrink-0 text-status-success" />
                <div className="min-w-0 flex-1">
                  <p>
                    <strong className="text-foreground">
                      {noRiskDomains.length} domain{noRiskDomains.length !== 1 ? 's' : ''}
                    </strong>{' '}
                    not plotted above — zero on at least one axis, not enough matrix room for a true
                    &quot;no risk&quot; cell:
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {noRiskDomains.map((s) => (
                      <span
                        key={s.domainId}
                        className="rounded-full border border-status-success/20 bg-background px-2 py-0.5 font-medium text-status-success"
                      >
                        {DOMAINS[s.domainId]?.label ?? s.domainId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Dependencies */}
      {dependencyRelations.length > 0 && (
        <div className={cardClass('p-4')}>
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={16} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">Product Dependencies</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Library/HSM products referenced by name in another product&apos;s own catalog
            description — detected by matching product names as a substring in free text. This is a
            real (if partial) signal, not verified dependency data: it may miss real dependencies
            never named in prose, and may false-positive on names that appear in an unrelated
            sentence. Click a name to view its full detail.
          </p>
          <div className="space-y-2">
            {dependencyRelations.map((rel) => (
              <DependencyRelationCard key={rel.provider.productId} rel={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Domain cards */}
      <div className="space-y-4">
        {domainStats.map((stat) => {
          const Icon = DOMAIN_ICONS[stat.domainId] ?? Package
          const label = DOMAINS[stat.domainId]?.label ?? stat.domainId

          const riskBadge =
            stat.impact === null ? (
              <span
                className="text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 bg-muted/50 text-muted-foreground border-border"
                title={`Select an industry/country in ${industryContextHint} to compute Impact`}
              >
                Gap-only (no Impact yet)
              </span>
            ) : stat.likelihood === 0 || stat.impact === 0 ? (
              <span
                className="text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 bg-status-success/10 text-status-success border-status-success/20"
                title={`Migration Gap ${stat.likelihood}/5 × Impact ${stat.impact}/5 — not plotted on the grid above`}
              >
                No risk
              </span>
            ) : (
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${matrixBadgeClasses(stat.riskScore ?? 0)}`}
                title={`Migration Gap ${stat.likelihood}/5 × Impact ${stat.impact}/5`}
              >
                {matrixRiskLevel(stat.riskScore ?? 0)} risk ({stat.riskScore})
              </span>
            )

          return (
            <div
              key={stat.domainId}
              data-testid={`layer-card-${stat.domainId}`}
              ref={(el) => {
                domainCardRefs.current[stat.domainId] = el
              }}
              className={`${cardClass('p-4')} transition-colors ${
                highlightedDomainId === stat.domainId ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* Domain header — matches InfrastructureSelector pattern */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-muted/20 border border-border text-primary">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground">{label}</h3>
                  <span className="text-xs text-muted-foreground">
                    {stat.total} product{stat.total !== 1 ? 's' : ''}
                  </span>
                </div>
                {stat.criticalHigh > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 bg-status-warning/10 text-status-warning border-status-warning/20"
                    title="Products flagged Critical/High pqcMigrationPriority by the catalog curator — informational, no longer used as the Impact axis input"
                  >
                    {stat.criticalHigh} priority
                  </span>
                )}
                {riskBadge}
              </div>

              {/* Readiness stats */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatBadge label="PQC Ready" count={stat.pqcReady} total={stat.total} />
                <StatBadge label="FIPS Validated" count={stat.fipsValidated} total={stat.total} />
                <StatBadge label="Hybrid Support" count={stat.hybridSupport} total={stat.total} />
                <StatBadge label="Known CVEs" count={stat.cveCount} total={stat.total} isGap />
              </div>

              {/* Per-product detail — click a product to expand its full
                  detail (vendor, certs, roadmap, proof) in place.

                  ONLY when the user has actually selected something. With no
                  selection `stat.products` is the entire catalog, and rendering
                  it cost 437,690 of this page's 448,555 characters, 14,637 of
                  its 15,343 DOM nodes and 1,196 SVG icons — a 19-second render
                  against 0.8s for the ROI Calculator. The risk matrix this tool
                  is named for costs 1,471 characters; the catalog dump cost 300
                  times that, to show 912 undifferentiated products nobody asked
                  for. The layer summaries above still render, so the matrix,
                  the dependencies and the CBOM are all unaffected.
                  (Re-audit batch 4a, 2026-08-11.) */}
              <div className="mt-3 pt-3 border-t border-border/50">
                {selectedItems.length === 0 && stat.products.length > UNSELECTED_LAYER_ROW_CAP ? (
                  <p className="text-xs text-muted-foreground">
                    {stat.products.length} catalog products sit in this domain.{' '}
                    <Link to="/migrate" className="text-primary hover:underline">
                      Pick your infrastructure on Migrate
                    </Link>{' '}
                    to list the ones that are yours.
                  </p>
                ) : (
                  stat.products.map((item) => (
                    <ProductRow
                      key={item.productId}
                      product={item}
                      compact
                      extraBadges={
                        isHybridProduct(item) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            <GitMerge size={9} /> Hybrid
                          </span>
                        ) : undefined
                      }
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={cardClass('p-4 text-center')}>
          <p className="text-sm text-muted-foreground mb-1">Total Products Tracked</p>
          <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
          <p className="text-xs text-muted-foreground mt-1">
            across {domainStats.length} migration domains
          </p>
        </div>
        <div className={cardClass('p-4 text-center')}>
          <p className="text-sm text-muted-foreground mb-1">PQC Ready</p>
          <p
            className={`text-3xl font-bold ${overallPqcPct >= 50 ? 'text-status-success' : 'text-status-warning'}`}
          >
            {overallPqcPct}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {pqcReadyCount} of {totalProducts} products
          </p>
        </div>
        <div className={cardClass('p-4 text-center')}>
          <p className="text-sm text-muted-foreground mb-1">FIPS Validated</p>
          <p
            className={`text-3xl font-bold ${overallFipsPct >= 50 ? 'text-status-success' : 'text-status-warning'}`}
          >
            {overallFipsPct}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {fipsValidatedCount} of {totalProducts} products
          </p>
        </div>
      </div>
      {/* ADDED 2026-07-16 (migrate-process remediation Phase 5, U6): these
          KPI tiles derive from keyword heuristics over the catalog's
          free-text pqcSupport/fipsValidated fields with no data date shown
          anywhere in this tab — a stale catalog silently shifted every
          number with no visible caveat. */}
      {softwareMetadata && (
        <p className="text-center text-[11px] text-muted-foreground">
          Catalog data as of {softwareMetadata.lastUpdate.toLocaleDateString()}
        </p>
      )}

      {/* CBOM by this tool's 6 asset classes, informed by CSWP.39 §5.3 */}
      <div className={cardClass('p-4')}>
        <h3 className="text-base font-semibold text-foreground mb-1">
          CBOM — 6 asset classes (informed by CSWP.39 §5.3)
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Auto-derived from{' '}
          {selectedItems.length > 0 ? 'your selected products' : 'the full catalog'}. Each product
          is bucketed into one of this tool's six simplified asset classes (Code / Library /
          Application / File / Protocol / System) using its catalog category.
        </p>
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>
            This is PQC Today&apos;s own simplified grouping, not a taxonomy CSWP.39 itself defines
            — CSWP.39 §5.3 discusses an asset-centric inventory approach but doesn&apos;t prescribe
            these six classes.
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(['Code', 'Library', 'Application', 'File', 'Protocol', 'System'] as const).map(
            (cls) => (
              <div key={cls} className="rounded-md border border-border bg-muted/30 p-2">
                <div className="text-xs font-semibold text-foreground">{cls}</div>
                <div className="text-2xl font-bold tabular-nums text-primary">
                  {cbomBuckets[cls].length}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {cbomBuckets[cls].length === 1 ? 'product' : 'products'}
                </div>
              </div>
            )
          )}
        </div>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={handleDownloadCbomJson}>
            <Download size={14} className="mr-1" />
            Download CBOM JSON (CycloneDX 1.7)
          </Button>
        </div>
      </div>

      {/* CSWP.39 §5.3 — Pipeline + Refresh + CMDB metadata. Collapsed by default
          (fix #12) — optional documentation, not required to use the matrix. */}
      <div className={cardClass('p-4')}>
        <Button
          variant="ghost"
          onClick={() => setDocsOpen((v) => !v)}
          aria-expanded={docsOpen}
          className="flex h-auto w-full items-start justify-between gap-3 whitespace-normal p-0 text-left font-normal"
        >
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Document your pipeline (optional)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Note the upstream sources that keep the CBOM fresh and the cadence at which they
              refresh it. Educational only — these notes export with the artifact below.
            </p>
          </div>
          <ChevronDown
            size={16}
            className={`mt-1 shrink-0 text-muted-foreground transition-transform ${docsOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </Button>
        {docsOpen && (
          <div className="mt-3 space-y-3">
            <div>
              <label
                htmlFor="cswp39-pipeline-sources"
                className="text-xs font-medium text-foreground block mb-1"
              >
                Pipeline sources (SBOM / CMDB / scanners feeding the CBOM)
              </label>
              <textarea
                id="cswp39-pipeline-sources"
                className="w-full text-sm rounded-md border border-input bg-background p-2 min-h-[60px]"
                placeholder="e.g., CycloneDX SBOMs from CI; ServiceNow CMDB nightly export; Keyfactor AgileSec scan output"
                value={pipelineSources}
                onChange={(e) => setPipelineSources(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="cswp39-refresh-cadence"
                className="text-xs font-medium text-foreground block mb-1"
              >
                Refresh cadence
              </label>
              <Input
                id="cswp39-refresh-cadence"
                type="text"
                placeholder="Daily / Weekly / Quarterly / Annually"
                value={refreshCadence}
                onChange={(e) => setRefreshCadence(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="cswp39-cmdb-mapping"
                className="text-xs font-medium text-foreground block mb-1"
              >
                CMDB → CBOM mapping notes
              </label>
              <textarea
                id="cswp39-cmdb-mapping"
                className="w-full text-sm rounded-md border border-input bg-background p-2 min-h-[60px]"
                placeholder="Which CMDB asset fields map to CBOM fields (asset class, criticality, FIPS status, ESV status)…"
                value={cmdbMapping}
                onChange={(e) => setCmdbMapping(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <ExportableArtifact
        title="Supply Chain Risk Matrix - Export"
        exportData={exportMarkdown}
        filename="supply-chain-risk-matrix"
        formats={['markdown', 'pdf']}
        onExport={handleExport}
        wideTable
      >
        <p className="text-sm text-muted-foreground">
          Export the supply chain risk analysis as a shareable document. Includes CBOM by asset
          class, pipeline sources, refresh cadence, and CMDB mapping.
        </p>
      </ExportableArtifact>
    </div>
  )
}
