// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Hammer, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Scenario {
  id: string
  label: string
  tools: string[]
  format: 'CycloneDX' | 'SPDX' | 'Either'
  note: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'container',
    label: 'Container image',
    tools: ['Syft', 'Trivy'],
    format: 'Either',
    note: 'Both scan image layers directly; pick the format your downstream tooling (CBOM pipeline, registry scanner) already consumes.',
  },
  {
    id: 'npm',
    label: 'npm / Node package',
    tools: ['cyclonedx-npm', 'npm sbom (native, CycloneDX or SPDX)'],
    format: 'CycloneDX',
    note: 'npm’s own `npm sbom` command ships CycloneDX output by default; use it before reaching for a third-party generator.',
  },
  {
    id: 'python',
    label: 'Python package',
    tools: ['cyclonedx-bom (Python)', 'pip-audit --format=cyclonedx-json'],
    format: 'CycloneDX',
    note: 'pip-audit doubles as the VEX-relevant step: it cross-references the generated SBOM against the OSV vulnerability feed in the same run.',
  },
  {
    id: 'maven',
    label: 'Java / Maven',
    tools: ['cyclonedx-maven-plugin'],
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
        <div className="flex flex-wrap gap-1.5">
          {scenario.tools.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-1 rounded border border-border text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{scenario.note}</p>
      </div>
    </div>
  )
}
