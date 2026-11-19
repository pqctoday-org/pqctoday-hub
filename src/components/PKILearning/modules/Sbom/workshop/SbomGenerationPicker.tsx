// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Hammer, ArrowRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ToolInfo {
  name: string
  source: string
  sourceUrl: string
  outputNote: string
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
        source: 'Syft documentation',
        sourceUrl: 'https://github.com/anchore/syft',
        outputNote:
          'Scans container images and other sources. Verify coverage, identifiers, hashes, licenses, and generation metadata in the output for your image and Syft version.',
      },
      {
        name: 'Trivy',
        source: 'Trivy SBOM documentation',
        sourceUrl: 'https://trivy.dev/latest/docs/supply-chain/sbom/',
        outputNote:
          'Can create SBOMs from container images and other supported targets. Results depend on target, scanner options, package ecosystem, and version; inspect your actual output.',
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
        source: 'npm sbom documentation',
        sourceUrl: 'https://docs.npmjs.com/cli/commands/npm-sbom',
        outputNote:
          'The npm CLI can emit SPDX or CycloneDX. Confirm the npm version, selected format, lockfile mode, workspaces, and generated metadata in your own output.',
      },
      {
        name: 'cyclonedx-npm',
        source: 'CycloneDX Node NPM project',
        sourceUrl: 'https://github.com/CycloneDX/cyclonedx-node-npm',
        outputNote:
          'An alternative CycloneDX generator for npm projects. Check supported npm/package-lock versions and output fields against the current project documentation.',
      },
    ],
    format: 'CycloneDX',
    note: 'Choose the output format explicitly—for example, `npm sbom --sbom-format=cyclonedx`—and inspect the output from your installed npm version against the requirements of your next tool.',
  },
  {
    id: 'python',
    label: 'Python package',
    tools: [
      {
        name: 'cyclonedx-py (Python)',
        source: 'CycloneDX Python project',
        sourceUrl: 'https://github.com/CycloneDX/cyclonedx-python',
        outputNote:
          'The project provides Python environment and dependency-file workflows. Supported inputs and emitted metadata vary by command and version; inspect the chosen workflow’s output.',
      },
      {
        name: 'pip-audit --format=cyclonedx-json',
        source: 'pip-audit documentation and changelog',
        sourceUrl: 'https://github.com/pypa/pip-audit',
        outputNote:
          'Emits CycloneDX SBOM output while auditing Python packages against vulnerability services. It is a vulnerability-audit workflow, not a VEX statement; verify schema version and metadata for the installed release.',
      },
    ],
    format: 'CycloneDX',
    note: 'Use the audit result as vulnerability evidence. A vulnerability finding or SBOM export does not by itself create a product-specific VEX statement.',
  },
  {
    id: 'maven',
    label: 'Java / Maven',
    tools: [
      {
        name: 'cyclonedx-maven-plugin',
        source: 'CycloneDX Maven plugin documentation',
        sourceUrl: 'https://github.com/CycloneDX/cyclonedx-maven-plugin',
        outputNote:
          'Generates CycloneDX output for Maven projects and can be bound into a build lifecycle. Configure the goal deliberately and inspect the resulting artifact, version, and component metadata.',
      },
    ],
    format: 'CycloneDX',
    note: 'Binding generation to the release lifecycle can keep the SBOM aligned with a release; verify that the goal actually runs in your build and archive the output for the released artifact.',
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
                {t.outputNote}{' '}
                <a
                  href={t.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  {t.source}
                </a>
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
            Inspect each generator’s output against your requirements
          </h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This is a tool-finding starting point, not a compliance score or a claim that a named
          generator emits every required field.{' '}
          <a
            href="https://www.cisa.gov/sites/default/files/2026-07/2026_cisa_sbom_minimum_elements_508c.pdf"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            CISA&apos;s 2026 Minimum Elements
          </a>{' '}
          describe the information to include; the exact output depends on the tool version,
          ecosystem, lock file, and configuration. Inspect generated SBOMs and add or attest to
          missing metadata in the appropriate part of your build process.
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          Tool references were rechecked on 18 November 2026. Their documentation changes; review
          the linked source and your installed version before using this workflow in production.
        </p>
      </div>
    </div>
  )
}
