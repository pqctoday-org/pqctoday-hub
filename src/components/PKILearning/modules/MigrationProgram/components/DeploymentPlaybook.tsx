// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback } from 'react'
import { OpsChecklist, type ChecklistSection } from '@/components/PKILearning/common/OpsChecklist'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'

const sections: ChecklistSection[] = [
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
        label: 'Set a mandatory sunset date — §4.6 "Mitigation is not a permanent solution"',
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

export const DeploymentPlaybook: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const { myProducts, migrationDeadlineYear, industry } = useExecutiveModuleData()

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

  const seedSources: string[] = []
  if (myProducts.length > 0)
    seedSources.push(
      `${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`
    )
  if (industry) seedSources.push(`industry (${industry})`)
  if (migrationDeadlineYear) seedSources.push(`deadline ${migrationDeadlineYear} from /timeline`)

  return (
    <div className="space-y-3">
      {seedSources.length > 0 && (
        <PreFilledBanner
          summary={`Playbook scope informed by ${seedSources.join(' + ')}.`}
          onClear={() => {
            /* Sections are static — clear is informational */
          }}
        />
      )}
      <OpsChecklist
        title="PQC Deployment Playbook"
        description="Operational procedures for deploying PQC across production infrastructure — covering hybrid mode, canary testing, progressive rollout, validation, and rollback."
        sections={sections}
        onSave={handleSave}
      />
    </div>
  )
}
