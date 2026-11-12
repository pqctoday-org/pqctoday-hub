// SPDX-License-Identifier: AGPL-3.0-only
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
import { Link } from 'react-router'
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
import { useComplianceRefresh } from '../services'
import { ModuleCertificationStatus } from './parts/ModuleCertificationStatus'
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
export const CI_GATE_YAML = `# .github/workflows/pqc-inventory-review.yml
# Educational family-review example, not a compliance/security verdict.
# Run from this Hub repository checkout; commit cbom.json at its root.
# Reuses package-lock.json (Ajv 8.20.0, ajv-formats 3.0.1) and the vendored
# CycloneDX 1.7 schemas at src/services/cbom/schema/. No inventory scanning.
name: Sample inventory review
on:
  pull_request:
  push:
    branches: [main]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.23.1'
          cache: npm
      - name: Install the existing locked validation dependencies
        run: npm ci --ignore-scripts
      - name: Validate and inspect a CycloneDX 1.7 sample
        shell: bash
        run: |
          set -eu
          if ! command -v jq >/dev/null 2>&1; then
            echo "::error::Evaluation failed: jq is unavailable"
            exit 2
          fi
          if ! node <<'NODE'
          const fs = require('node:fs');
          const path = require('node:path');
          try {
            if (require('ajv/package.json').version !== '8.20.0' ||
                require('ajv-formats/package.json').version !== '3.0.1') {
              throw new Error('Expected locked Ajv 8.20.0 and ajv-formats 3.0.1');
            }
            const Ajv = require('ajv');
            const addFormats = require('ajv-formats');
            const schemaDir = path.resolve('src/services/cbom/schema');
            const readSchema = (name) => JSON.parse(fs.readFileSync(path.join(schemaDir, name), 'utf8'));
            // Draft-07 section 7.2 permits format annotations without assertions.
            // These two formats are not implemented by locked ajv-formats 3.0.1.
            const ajv = new Ajv({
              strict: false, allErrors: true,
              formats: { 'iri-reference': true, 'idn-email': true },
            });
            addFormats(ajv);
            const schemas = ['spdx.schema.json', 'jsf-0.82.schema.json', 'cryptography-defs.schema.json', 'bom-1.7.schema.json'].map(readSchema);
            const checkFormats = (schema) => {
              if (!schema || typeof schema !== 'object') return;
              if (typeof schema.format === 'string' && !Object.hasOwn(ajv.formats, schema.format)) {
                throw new Error('Unconfigured schema format: ' + schema.format);
              }
              Object.values(schema).forEach(checkFormats);
            };
            schemas.forEach(checkFormats);
            schemas.slice(0, -1).forEach((schema) => ajv.addSchema(schema));
            const validate = ajv.compile(schemas.at(-1));
            const bom = JSON.parse(fs.readFileSync('cbom.json', 'utf8'));
            if (!validate(bom)) {
              console.error('::error::Evidence incomplete: CycloneDX 1.7 schema invalid');
              console.error(ajv.errorsText(validate.errors));
              process.exitCode = 2;
            } else {
              console.log('CycloneDX 1.7 structural schema passed; iri-reference and idn-email syntax are annotations only, not validated');
            }
          } catch (error) {
            console.error('::error::Evaluation failed: schema setup, input access or JSON parsing failed');
            console.error(error instanceof Error ? error.message : String(error));
            process.exitCode = 2;
          }
          NODE
          then
            exit 2
          fi
          if ! report=$(jq -sc '
            def incomplete($reason): {outcome:"incomplete", reason:$reason};
            if length != 1 then incomplete("Expected exactly one JSON document")
            elif (.[0] | type) != "object" then incomplete("Expected a BOM object")
            else .[0] as $bom |
              if $bom.bomFormat != "CycloneDX" or $bom.specVersion != "1.7"
              then incomplete("This example inspects CycloneDX 1.7 only")
              elif ($bom.components | type) != "array"
              then incomplete("Missing component inventory")
              elif any($bom.components[]; type != "object")
              then incomplete("Unsupported component shape")
              elif any($bom.components[]; has("components") and .components != [])
                or ($bom.metadata.component.components? != null and $bom.metadata.component.components != [])
              then incomplete("Nested component inventory is outside this example")
              else
                # These are sample review targets, NOT an approved/security list.
                ["RSAES-OAEP","RSAES-PKCS1","RSASSA-PKCS1","RSASSA-PSS","ECDSA","ECDH"] as $targets |
                ["ML-KEM","ML-DSA","SLH-DSA","AES"] as $other_examples |
                [$bom.components[] |
                  select(.type == "cryptographic-asset" and .cryptoProperties.assetType == "algorithm") |
                  {ref: .["bom-ref"], name: .name,
                   family: .cryptoProperties.algorithmProperties.algorithmFamily}] as $records |
                [$records[] | select((.family | type) == "string") | select(.family as $f | $targets | index($f))] as $findings |
                [$records[] | select((.family | type) != "string" or (.family as $f | ($targets + $other_examples) | index($f) | not))] as $unknown |
                if ($records | length) == 0 then incomplete("No algorithm-asset evidence")
                elif ($unknown | length) > 0 then
                  {outcome:"incomplete", reason:"Missing or out-of-example algorithm identity", findings:$findings, unassessed:$unknown}
                elif ($findings | length) > 0 then
                  {outcome:"review", findings:$findings, inspected:($records | length)}
                else {outcome:"none", inspected:($records | length)} end
              end
            end' cbom.json); then
            echo "::error::Evaluation failed: JSON parsing, file access or jq evaluation failed; inspect stderr"
            exit 2
          fi
          printf '%s\\n' "$report"
          if ! outcome=$(printf '%s\\n' "$report" | jq -r '.outcome'); then
            echo "::error::Evaluation failed: could not read the review result"
            exit 2
          fi
          case "$outcome" in
            review) echo "::error::Recorded algorithm-family review items; inspect their context"; exit 1 ;;
            incomplete) echo "::error::Evidence incomplete; no clean result established"; exit 2 ;;
            none) echo "No targeted findings in the inspected sample scope; not a compliance or security verdict" ;;
            *) echo "::error::Evaluation failed: unrecognised review outcome"; exit 2 ;;
          esac
`

function DevModuleCertSummary() {
  const { data } = useComplianceRefresh()
  return (
    <ModuleCertificationStatus
      records={data ?? []}
      closingNote="These catalogue records are not your dependency inventory. The CI example reviews only the structured algorithm-family evidence supplied in its sample input."
    />
  )
}

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
        <h3 className="text-base font-semibold text-foreground">
          Inspect inventory evidence in CI
        </h3>
        <span className="text-xs text-muted-foreground">
          Schema validation and scoped family review; supply a CycloneDX 1.7 input
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
        Run this workflow in this Hub repository with cbom.json at the repository root. It uses Node
        22.23.1, the existing lockfile’s Ajv 8.20.0 / ajv-formats 3.0.1 and all four vendored
        schemas in src/services/cbom/schema/. All vendored Draft-07 structural schema constraints
        run before the unchanged top-level family-review rule. Invalid schema, missing identities,
        unsupported nested inventories and evaluation errors exit 2; recorded review items exit 1;
        no targeted finding exits 0. The optional iri-reference and idn-email formats are
        annotations only: their string types are checked, but their IRI/email syntax is not.
        Supported formats such as date-time remain checked; an unconfigured format makes evaluation
        fail. Structural schema validity establishes document structure, not truthful inventory,
        correct cryptography, hybrid binding or deployed security. With your production tools,
        generate and review the inventory, retain the validator versions and results, and assess
        each item’s component, protocol context and migration plan. No targeted finding is not an
        approval.
      </p>
    </section>
  )
}

// Family chip → /algorithms target. A family with one representative
// parameter set opens it directly via `?algo=<algorithm_id>` (ids verified
// against pqc_complete_algorithm_reference_09292026.csv); families whose
// chip stands for several sets keep the `highlight` family filter.
const ALG_LINK: Record<string, { algo: string } | { highlight: string }> = {
  'ML-KEM': { algo: 'ml-kem-768' },
  'ML-DSA': { algo: 'ml-dsa-65' },
  'SLH-DSA': { algo: 'slh-dsa-sha2-128s' },
  Falcon: { algo: 'fn-dsa-512' },
  XMSS: { highlight: 'XMSS' },
  'LMS/HSS': { highlight: 'LMS' },
  HQC: { highlight: 'HQC' },
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
    desc: 'RFC 9964 ML-DSA signatures (JOSE/COSE); PQ KEM encryption still an IETF draft',
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
              const target = ALG_LINK[family] // eslint-disable-line security/detect-object-injection
              const href = !target
                ? '/algorithms'
                : 'algo' in target
                  ? `/algorithms?algo=${encodeURIComponent(target.algo)}`
                  : `/algorithms?tab=detailed&highlight=${encodeURIComponent(target.highlight)}`
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

      {/* ── Module-level certification status (P11-P1-05) ────────── */}
      <DevModuleCertSummary />

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
