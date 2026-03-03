// SPDX-License-Identifier: GPL-3.0-only
import { OpsChecklist, type ChecklistSection } from '@/components/PKILearning/common/OpsChecklist'

const sections: ChecklistSection[] = [
  {
    title: 'Pre-Deployment Preparation',
    items: [
      {
        id: 'prep-feature-flags',
        label: 'Set up feature flags for PQC algorithm toggle',
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
    title: 'Canary Deployment',
    items: [
      {
        id: 'canary-route-1pct',
        label: 'Route 1% of traffic through PQC-enabled endpoint',
      },
      {
        id: 'canary-latency',
        label: 'Monitor latency impact (expect 2-5% increase for hybrid)',
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
    title: 'Rollback Procedures',
    items: [
      {
        id: 'rollback-toggle',
        label: 'Toggle feature flag to disable PQC',
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
  return (
    <OpsChecklist
      title="PQC Deployment Playbook"
      description="Operational procedures for deploying PQC across production infrastructure"
      sections={sections}
    />
  )
}
