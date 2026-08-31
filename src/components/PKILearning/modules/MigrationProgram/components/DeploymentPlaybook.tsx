// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo } from 'react'
import { Rocket } from 'lucide-react'
import { OpsChecklist, type ChecklistSection } from '@/components/PKILearning/common/OpsChecklist'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs, useSavedArtifactOutput } from '@/hooks/useSavedArtifactInputs'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import type { RoadmapOutput } from '../types'

// Exported (07192026, Batch 3) for the simulation's real-tool doc generator —
// the sim's sample playbook is the tool's own real checklist content.
export const DEPLOYMENT_PLAYBOOK_TITLE = 'PQC Deployment Playbook'
export const DEPLOYMENT_PLAYBOOK_DESCRIPTION =
  'Operational procedures for deploying PQC across production infrastructure — covering hybrid mode, canary testing, progressive rollout, validation, and rollback.'
export const DEPLOYMENT_PLAYBOOK_SECTIONS: ChecklistSection[] = [
  {
    title: 'Pre-Deployment Preparation',
    items: [
      {
        id: 'prep-feature-flags',
        label: 'Set up feature flags for PQC algorithm toggle',
      },
      {
        id: 'prep-hybrid-config',
        label: 'Configure hybrid classical+PQC mode (recommended before pure PQC)',
        critical: true,
      },
      {
        id: 'prep-monitoring',
        label: 'Configure monitoring dashboards for handshake metrics',
      },
      {
        id: 'prep-rollback-scripts',
        label: 'Prepare rollback automation scripts',
        critical: true,
      },
      {
        id: 'prep-baseline',
        label: 'Document current baseline latency and error rates',
      },
      {
        id: 'prep-notify-ops',
        label: 'Notify operations team and set maintenance window',
      },
    ],
  },
  {
    title: 'Hybrid Mode Deployment',
    items: [
      {
        id: 'hybrid-tls-config',
        label: 'Enable hybrid key exchange (e.g., X25519MLKEM768) in TLS config',
      },
      {
        id: 'hybrid-backward-compat',
        label: 'Verify backward compatibility — classical-only clients still connect',
        critical: true,
      },
      {
        id: 'hybrid-cert-chain',
        label: 'Validate certificate chain with hybrid or dual certificates',
      },
      {
        id: 'hybrid-perf-test',
        label: 'Benchmark hybrid handshake latency (expect 2-5% increase)',
      },
      {
        id: 'hybrid-interop',
        label: 'Test interoperability with partner/vendor endpoints',
      },
    ],
  },
  {
    title: 'Canary Deployment',
    items: [
      {
        id: 'canary-route-1pct',
        label: 'Route 1% of traffic through PQC/hybrid-enabled endpoint',
      },
      {
        id: 'canary-latency',
        label: 'Monitor latency impact against baseline',
      },
      {
        id: 'canary-error-rates',
        label: 'Compare error rates against baseline',
      },
      {
        id: 'canary-browser-matrix',
        label: 'Validate client compatibility across browser matrix',
      },
      {
        id: 'canary-24h',
        label: 'Run for minimum 24 hours before proceeding',
        critical: true,
      },
    ],
  },
  {
    title: 'Progressive Rollout',
    items: [
      {
        id: 'rollout-10pct',
        label: 'Increase to 10% traffic',
      },
      {
        id: 'rollout-50pct',
        label: 'Increase to 50% traffic',
      },
      {
        id: 'rollout-full',
        label: 'Full production rollout',
      },
      {
        id: 'rollout-hsts',
        label: 'Update HSTS preload entries if applicable',
      },
      {
        id: 'rollout-cdn-dns',
        label: 'Update CDN and DNS configurations',
      },
    ],
  },
  {
    title: 'Post-Deployment Validation',
    items: [
      {
        id: 'post-cert-validation',
        label: 'Verify PQC certificate chain validation end-to-end',
        critical: true,
      },
      {
        id: 'post-cipher-suites',
        label: 'Confirm all cipher suites negotiating correctly (check via TLS scanner)',
      },
      {
        id: 'post-compliance-scan',
        label: 'Run compliance scan against CNSA 2.0 / FIPS requirements',
      },
      {
        id: 'post-cmdb-update',
        label: 'Update CMDB / asset inventory with new cryptographic configuration',
      },
      {
        id: 'post-cbom-refresh',
        label: 'Regenerate CBOM (Cryptographic Bill of Materials) for updated systems',
      },
    ],
  },
  {
    title: 'Decommission Plan (CSWP.39 §4.6)',
    items: [
      {
        id: 'decom-record-mitigation',
        label: 'Record the mitigation in place (gateway / bump-in-the-wire / compensating control)',
        critical: true,
      },
      {
        id: 'decom-target-migration',
        label: 'Document the target migration (algorithm + product) replacing this mitigation',
        critical: true,
      },
      {
        id: 'decom-sunset-date',
        label:
          'Set a mandatory sunset date — CSWP.39 §4.6 frames a crypto gateway as an architectural fix for legacy systems that cannot be modified directly, not a substitute for migrating the algorithm inside them',
        critical: true,
      },
      {
        id: 'decom-owner',
        label: 'Assign an accountable owner with quarterly status review',
      },
      {
        id: 'decom-milestones',
        label:
          'Break down phased decommission milestones (pilot, partial cutover, full retirement)',
      },
      {
        id: 'decom-evidence',
        label: 'Capture evidence at retirement — CMVP cert # / ACVP run / CVE-scan clean',
      },
      {
        id: 'decom-cmdb-cbom',
        label: 'Update CMDB and CBOM to remove the mitigation entry once retired',
      },
    ],
  },
  {
    title: 'Rollback Procedures',
    items: [
      {
        id: 'rollback-toggle',
        label: 'Toggle feature flag to disable PQC / revert to classical-only',
        critical: true,
      },
      {
        id: 'rollback-verify-classical',
        label: 'Verify classical-only handshakes resume',
      },
      {
        id: 'rollback-preserve-logs',
        label: 'Preserve PQC logs for post-mortem analysis',
      },
      {
        id: 'rollback-escalation',
        label: 'Escalation path: on-call lead \u2192 security team \u2192 vendor support',
      },
      {
        id: 'rollback-review',
        label: 'Post-incident review within 48 hours',
      },
    ],
  },
]

interface DeploymentPlaybookProps {
  roadmapOutput?: RoadmapOutput | null
}

export const DeploymentPlaybook: React.FC<DeploymentPlaybookProps> = ({ roadmapOutput }) => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)

  // roadmapOutput only arrives as a live prop inside the linear
  // `/learn/migration-program` wizard. Reached any other way — the
  // Simulation embed or the standalone Business Center route — fall back to
  // the Roadmap Builder's last saved output so this banner isn't silently
  // dropped just because of how the tool was opened.
  const savedRoadmapOutput = useSavedArtifactOutput<RoadmapOutput>('migration-roadmap')
  const effectiveRoadmapOutput = roadmapOutput ?? savedRoadmapOutput ?? null

  // Group roadmap milestones by phaseId to show which phases have planned milestones.
  const phaseGroups = useMemo(() => {
    if (!effectiveRoadmapOutput || effectiveRoadmapOutput.milestones.length === 0) return null
    const grouped = new Map<string, Array<{ label: string; year: number }>>()
    for (const m of effectiveRoadmapOutput.milestones) {
      const group = grouped.get(m.phaseId) ?? []
      group.push({ label: m.label, year: m.year })
      grouped.set(m.phaseId, group)
    }
    return grouped
  }, [effectiveRoadmapOutput])

  const roadmapSummary = useMemo(() => {
    if (!phaseGroups) return null
    const lines: string[] = []
    for (const [phaseId, ms] of phaseGroups) {
      const sorted = [...ms].sort((a, b) => a.year - b.year)
      lines.push(`Phase ${phaseId}: ${sorted.map((m) => `${m.year} — ${m.label}`).join('; ')}`)
    }
    return lines.join(' | ')
  }, [phaseGroups])

  // Restore half of the save/restore pair — handleSave below writes this
  // same shape into inputs, but nothing ever read it back until this fix:
  // OpsChecklist always started checkedItems as an empty Set, so a saved
  // playbook looked reset on every remount despite the save succeeding.
  const savedInputs = useSavedArtifactInputs<{ checkedItems: string[] }>('deployment-playbook')

  const handleSave = useCallback(
    ({ markdown, checkedItems }: { markdown: string; checkedItems: string[] }) => {
      addExecutiveDocument({
        id: `deployment-playbook-${Date.now()}`,
        moduleId: 'migration-program',
        type: 'deployment-playbook',
        title: `PQC Deployment Playbook — ${new Date().toLocaleDateString()}`,
        data: markdown,
        inputs: { checkedItems },
        createdAt: Date.now(),
      })
    },
    [addExecutiveDocument]
  )

  return (
    <div className="space-y-3">
      <div className="glass-panel p-4 border-l-4 border-status-info flex items-start gap-3">
        <Rocket size={20} className="text-status-info mt-0.5 shrink-0" />
        <div>
          <h2 className="text-base font-semibold text-foreground">Methodology</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Grounded in NIST CSWP.39 §4 — Crypto Agility in System Implementations, which covers how
            agility is achieved at each layer touched by a rollout: crypto-library APIs, the OS
            kernel, service mesh, embedded/RTOS, and hardware. The Decommission Plan section below
            applies §4.6: a crypto gateway restores agility at the network boundary for legacy
            systems that cannot be modified directly, but the legacy component's own cryptography
            stays in place — so every gateway entry needs a planned sunset date rather than standing
            in as the migration itself.
          </p>
        </div>
      </div>
      {effectiveRoadmapOutput && effectiveRoadmapOutput.milestones.length > 0 && roadmapSummary && (
        <PreFilledBanner
          summary={`${effectiveRoadmapOutput.milestones.length} roadmap milestone${effectiveRoadmapOutput.milestones.length !== 1 ? 's' : ''} ${roadmapOutput ? 'from Step 1' : 'from your last Roadmap Builder export'} are available for reference. Phases covered: ${roadmapSummary}.`}
        />
      )}
      <OpsChecklist
        title={DEPLOYMENT_PLAYBOOK_TITLE}
        description={DEPLOYMENT_PLAYBOOK_DESCRIPTION}
        sections={DEPLOYMENT_PLAYBOOK_SECTIONS}
        onSave={handleSave}
        initialCheckedItems={savedInputs?.checkedItems}
      />
    </div>
  )
}
