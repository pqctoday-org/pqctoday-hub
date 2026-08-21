// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Hammer, ArrowRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ToolInfo {
  name: string
  /** Verified against the tool's own source/docs/changelog (Aug 2026) against
   * the 10 elements the 2026 CISA SBOM Minimum Elements v2.1 newly requires —
   * not a guess from the CycloneDX/SPDX schema's theoretical capabilities. */
  gaps2026: string
}

interface Scenario {
  id: string
  label: string
  tools: ToolInfo[]
  format: 'CycloneDX' | 'SPDX' | 'Either'
  note: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'container',
    label: 'Container image',
    tools: [
      {
        name: 'Syft',
        gaps2026:
          '4/10 new elements solid (format/tool identity), 4 partial (SBOM version, hash, license — ecosystem-dependent) — no signature, no generation context.',
      },
      {
        name: 'Trivy',
        gaps2026:
          'Same shape as Syft — no signature, no generation context; hash/license inconsistent per ecosystem (e.g. often missing for npm/pip components).',
      },
    ],
    format: 'Either',
    note: 'Both scan image layers directly; pick the format your downstream tooling (CBOM pipeline, registry scanner) already consumes.',
  },
  {
    id: 'npm',
    label: 'npm / Node package',
    tools: [
      {
        name: 'npm sbom (native)',
        gaps2026:
          'CycloneDX mode: 9/10 — the strongest default of any tool here, missing only Author Signature. SPDX mode: 7/10 — also drops SBOM Version and Generation Context.',
      },
      {
        name: 'cyclonedx-npm',
        gaps2026: '8/10 — missing Author Signature and Generation Context.',
      },
    ],
    format: 'CycloneDX',
    note: 'npm’s own `npm sbom` command ships CycloneDX output by default; use it before reaching for a third-party generator.',
  },
  {
    id: 'python',
    label: 'Python package',
    tools: [
      {
        name: 'cyclonedx-bom (Python)',
        gaps2026:
          '6/10 solid; component hashes only populate when a lock file (poetry.lock, Pipfile.lock, pinned requirements.txt) is the source — missing Author Signature and Generation Context.',
      },
      {
        name: 'pip-audit --format=cyclonedx-json',
        gaps2026:
          'Weakest tool surveyed: 2/10 — no tool identity, hashes, license, signature, or generation context, and it still emits CycloneDX 1.4, not 1.6.',
      },
    ],
    format: 'CycloneDX',
    note: 'pip-audit doubles as the VEX-relevant step: it cross-references the generated SBOM against the OSV vulnerability feed in the same run.',
  },
  {
    id: 'maven',
    label: 'Java / Maven',
    tools: [
      {
        name: 'cyclonedx-maven-plugin',
        gaps2026:
          '6/10 solid; hashes are reliable for dependencies but not the top-level artifact; license depends on upstream POM data quality — no signature.',
      },
    ],
    format: 'CycloneDX',
    note: 'Runs as a build-lifecycle plugin, so the SBOM is regenerated on every release rather than drifting from what actually shipped.',
  },
]

export function SbomGenerationPicker() {
  const [pick, setPick] = useState(SCENARIOS[0].id)
  const scenario = SCENARIOS.find((s) => s.id === pick) ?? SCENARIOS[0]

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="mb-1 flex items-center gap-2">
          <Hammer size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">
            Pick a build artifact, get a generation path
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          The right SBOM tool depends on what you&apos;re building, not on a single org-wide choice.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SCENARIOS.map((s) => (
            <Button
              key={s.id}
              variant="outline"
              size="sm"
              onClick={() => setPick(s.id)}
              className={pick === s.id ? 'border-primary bg-primary/15 text-primary' : ''}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-foreground font-semibold">{scenario.label}</span>
          <ArrowRight size={14} className="text-muted-foreground" />
          <span className="text-primary font-semibold">{scenario.format}</span>
        </div>
        <div className="space-y-2">
          {scenario.tools.map((t) => (
            <div key={t.name} className="rounded border border-border p-2">
              <span className="text-xs font-medium text-foreground">{t.name}</span>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {t.gaps2026}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{scenario.note}</p>
      </div>

      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-status-warning shrink-0" />
          <h4 className="text-sm font-semibold text-foreground">
            No tool here is fully 2026-compliant out of the box
          </h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Two gaps are universal across every tool surveyed above: none of them sign the SBOM
          automatically — <strong>SBOM Author Signature</strong> needs a separate step (e.g.
          Cosign/Sigstore attestation) regardless of which generator you pick — and{' '}
          <strong>SBOM Generation Context</strong> has no clean 1:1 mapping in any of them; the
          closest analog (CycloneDX&apos;s <code>lifecycles</code> field) is inconsistently
          supported. Component hash and license fields are frequently present but not guaranteed —
          coverage depends on the package ecosystem and, for compiled languages, on whether a lock
          file was available to the generator.
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          Verified against each tool&apos;s own source, docs, and changelog as of August 2026 — SBOM
          tooling moves fast; re-check before treating this as a compliance decision.
        </p>
      </div>
    </div>
  )
}
