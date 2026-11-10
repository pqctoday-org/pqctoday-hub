// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PIPELINE_STAGES } from '../data/pipelineStagesData'
import { assessProtectionWindows, describeWindowCounts } from '../utils/protectionWindows'

export interface WorkshopConfig {
  step: number
}

interface ExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: WorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: WorkshopConfig
}

export const PlatformEngExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const timelineFindings = [2030, 2035]
    .map((year) => {
      const result = assessProtectionWindows(PIPELINE_STAGES, year)
      return `${year}: confidentiality — ${describeWindowCounts(result.confidentiality)}; authenticity — ${describeWindowCounts(result.authenticity)}. ${result.assets.length} vulnerable assets; ${result.notModeled} have no modeled window.`
    })
    .join(' ')
  const scenarios: Scenario[] = [
    {
      id: 'hndl-exposure-audit',
      title: '1. HNDL Exposure Audit — Identify your highest-risk pipeline stage',
      description:
        'In the Pipeline Crypto Inventory (Step 1), filter by HNDL Exposure: High and Migration Priority: Critical. Review the three assets in the Build stage. Which single asset poses the greatest harvest-now-decrypt-later risk and why?',
      badge: 'Inventory',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'The Vault mTLS session (build-vault-mtls) is the highest-risk asset. It uses ECDH P-256 key exchange, has an exposure window of 10+ years (secrets fetched by the pipeline may remain sensitive long after the session ends), and is classified as HNDL: High. An adversary recording Vault mTLS traffic today can decrypt every secret the pipeline fetched post-CRQC. The PQC replacement is X25519MLKEM768 hybrid TLS.',
      config: { step: 0 },
    },
    {
      id: 'crqc-countdown',
      title: '2. CRQC Countdown — Compare confidentiality and authenticity windows',
      description:
        'In the Quantum Threat Timeline (Step 2), select the illustrative 2030 scenario, then 2035. Compare the confidentiality and authenticity window counts for the 2026 sample cohort. Inspect the Runtime stage: why does its 1-hour SVID window not replace the separately stated 10+year payload window? Return to All Stages before comparing the findings below.',
      badge: 'Timeline',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe: `${timelineFindings} Open bounds and ranges can leave an answer indeterminate. Signature/credential authenticity is distinct from recorded-payload confidentiality (HNDL). A window ending by the horizon does not protect newly issued classical credentials. These are explicit fictional planning inputs, not a forecast or a production migration result.`,
      config: { step: 1 },
    },
    {
      id: 'signing-tool-comparison',
      title: '3. Signing Tool Comparison — Choose the right migration path for container signing',
      description:
        "In the Container Signing Migration (Step 3), enter Compare mode and select Notation and cosign. Compare their PQC Readiness status and estimated PQC year. What does each tool's documentation let you conclude about ML-DSA support?",
      badge: 'Signing',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'We found no vendor documentation that confirms ML-DSA support in Notation, and the Sigstore post (June 2025) does not mention cosign, so both are shown as unconfirmed; the post says it wants to enable post-quantum signing as soon as possible, has added ML-DSA to its protocol specification for client experiments, and gives no production date. Vendor timelines move quickly, so confirm current status before choosing a tool. Docker Content Trust (DCT) should be migrated immediately — Docker is fully retiring DCT and the Notary v1 service (full shutdown 8 December 2026), and the upstream Notary v1 codebase is no longer maintained.',
      config: { step: 2 },
    },
    {
      id: 'policy-enforcement-design',
      title: '4. Policy Design — Write a cert-manager algorithm enforcement policy',
      description:
        'In the Policy-as-Code Enforcer (Step 4), expand the "Block Non-PQC Certificate Algorithms" OPA rule. Study the Rego code. Then explain: (a) what trigger causes the violation, and (b) which string prefixes are used to identify PQC algorithms.',
      badge: 'Policy',
      badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
      observe:
        'The violation fires when: (a) the resource is a cert-manager Certificate, and (b) the spec.privateKey.algorithm does not start with "ml" (ML-DSA family) or "slh" (SLH-DSA family). The string prefix check (startswith(lower(algo), "ml") / startswith(lower(algo), "slh")) is algorithm-agnostic for the ML-DSA parameter set — it matches MLDSA44, MLDSA65, and MLDSA87 without listing each variant explicitly.',
      config: { step: 3 },
    },
    {
      id: 'capacity-impact',
      title: '5. Capacity Planning — Calculate TLS cert storage growth for a 500-cert cluster',
      description:
        'In the Crypto Posture Monitor (Step 5), navigate to the Capacity Planner tab. Set TLS Certificates in Cluster to 500. Compare the etcd storage consumption between Classical and PQC. What is the storage multiplier and should this affect your migration decision?',
      badge: 'Capacity',
      badgeColor: 'bg-status-info/20 text-status-info border-status-info/50',
      observe:
        "For 500 certificates, the module's illustrative sizes of 3 KB and 14 KB per key-and-certificate pair give about 1.5 MB and 7 MB, or 4.7×. This is a sample byte estimate, not measured etcd usage. In etcd v3.5, the backend quota starts at 2 GiB unless configured otherwise; the documentation suggests 8 GiB as an upper size for normal environments, not the default. Assess the configured quota, existing objects, retained history and operational headroom before drawing a capacity conclusion. The sample alone does not establish whether storage should change a migration plan. The 12 ms and 28 ms handshake values are also illustrative; test the intended configuration and workload with production tools.",
      config: { step: 4 },
    },
    {
      id: 'migration-rollback',
      title: '6. Rollback Simulation — Navigate the rollback decision tree for a TLS failure',
      description:
        'In the Platform Migration Planner (Step 6), expand the Rollback Decision Tree. Walk through this scenario: clients are reporting TLS handshake failures, the failure is on key exchange (not certificate validation), and affected clients do support TLS 1.3. What is the recommended rollback action?',
      badge: 'Migration',
      badgeColor: 'bg-accent/20 text-accent border-accent/50',
      observe:
        'The decision path leads to: revert ssl-ecdh-curve to X25519:P-256 and file a bug with the client vendor for ML-KEM support. Treat the revert as a temporary policy trade-off back to classical-only key exchange. Test client compatibility.',
      config: { step: 5 },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Guided Practice Exercises</h2>
        </div>
        <p className="text-muted-foreground">
          Six exercises map to the six workshop steps. Each exercise gives you a specific task to
          investigate in the interactive tool, then reveals the expected findings. Work through them
          in order — later exercises build on the crypto asset inventory you&apos;ll create in the
          first exercise.
        </p>
      </div>

      {scenarios.map((scenario) => (
        <div key={scenario.id} className="glass-panel p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div
              className={`text-[10px] px-2 py-1 rounded border font-bold shrink-0 mt-1 ${scenario.badgeColor}`}
            >
              {scenario.badge}
            </div>
            <h3 className="text-base font-bold text-foreground leading-snug">{scenario.title}</h3>
          </div>

          <p className="text-sm text-muted-foreground">{scenario.description}</p>

          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
              <ArrowRight size={12} className="transition-transform group-open:rotate-90" />
              Reveal expected findings
            </summary>
            <div className="mt-3 p-3 rounded-lg bg-status-success/10 border border-status-success/20">
              <p className="text-xs text-muted-foreground">{scenario.observe}</p>
              {scenario.id === 'capacity-impact' && (
                <a
                  className="text-xs text-primary underline"
                  href="https://etcd.io/docs/v3.5/dev-guide/limit/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  etcd v3.5 system limits — storage quota guidance
                </a>
              )}
            </div>
          </details>

          <Button
            variant="ghost"
            onClick={() => {
              if (onSetWorkshopConfig) onSetWorkshopConfig(scenario.config)
              onNavigateToWorkshop()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Play size={14} />
            Open Step {scenario.config.step + 1}
          </Button>
        </div>
      ))}
    </div>
  )
}
