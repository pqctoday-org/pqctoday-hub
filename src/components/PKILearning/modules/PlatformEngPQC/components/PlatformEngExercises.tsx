// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'

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
  const scenarios: Scenario[] = [
    {
      id: 'hndl-exposure-audit',
      title: '1. HNDL Exposure Audit — Identify your highest-risk pipeline stage',
      description:
        'In the Pipeline Crypto Inventory (Step 1), filter by HNDL Exposure: High and Migration Priority: Critical. Review the three assets in the Build stage. Which single asset poses the greatest harvest-now-decrypt-later risk and why?',
      badge: 'Inventory',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'The Vault mTLS session (build-vault-mtls) is the highest-risk asset. It uses ECDH P-256 key exchange, has an exposure window of 10+ years (secrets fetched by the pipeline may remain sensitive long after the session ends), and is classified as HNDL: High. An adversary recording Vault mTLS traffic today can decrypt every secret the pipeline fetched post-CRQC. The PQC replacement is ML-KEM-768 X-Wing hybrid TLS.',
      config: { step: 0 },
    },
    {
      id: 'crqc-countdown',
      title: '2. CRQC Countdown — Model your pipeline exposure under different threat scenarios',
      description:
        'In the Quantum Threat Timeline (Step 2), select CRQC Year: 2030. Count how many pipeline assets have a data expiry year beyond 2030 — meaning data protected by them will still be sensitive when a CRQC arrives. Then switch to CRQC Year: 2035 and compare.',
      badge: 'Timeline',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'Under a 2030 CRQC scenario, all 14 quantum-vulnerable assets are at risk because their exposure windows extend beyond 2030. Under 2035, the same 14 assets remain at risk — signature and certificate lifetimes are measured in decades, not years. This demonstrates why HNDL is independent of CRQC timeline: the exposure window starts today, not when the CRQC arrives.',
      config: { step: 1 },
    },
    {
      id: 'signing-tool-comparison',
      title: '3. Signing Tool Comparison — Choose the right migration path for container signing',
      description:
        'In the Container Signing Migration (Step 3), enter Compare mode and select Notation and cosign. Compare their PQC Readiness status and estimated PQC year. Which tool should you use for new deployments that need ML-DSA today?',
      badge: 'Signing',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Notation has Beta PQC readiness (available in 2025 via the AWS Crypto Tools plugin with ML-DSA-65 composite certificates). cosign is On Roadmap with a 2026 target. For new deployments requiring ML-DSA today, Notation + AWS Crypto plugin is the correct choice. Docker Content Trust (DCT) should be migrated immediately — Notary v1 has no PQC roadmap and is in maintenance mode.',
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
        'With 500 certs, etcd storage grows from ~1.5 MB (classical RSA-2048 key+cert at 3KB each) to ~7 MB (ML-DSA-65 at 14KB each) — approximately a 4.7× increase. For most clusters, this is negligible relative to total etcd capacity (default 8 GB). The storage impact is NOT a reason to delay migration. The TLS handshake latency increase (12ms → 28ms, +133%) warrants more attention in high-throughput microservice environments.',
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
        'The decision path leads to: "Revert ssl-ecdh-curve to X25519:P-256. X-Wing is additive — removing it is non-breaking. File bug with client vendor for ML-KEM support." This is the correct approach because X-Wing (ML-KEM-768 + X25519) is a hybrid — removing the ML-KEM component is safe for compatibility and does not break existing sessions. The classical X25519 continues to provide forward secrecy.',
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
            </div>
          </details>

          <button
            onClick={() => {
              if (onSetWorkshopConfig) onSetWorkshopConfig(scenario.config)
              onNavigateToWorkshop()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Play size={14} />
            Open Step {scenario.config.step + 1}
          </button>
        </div>
      ))}
    </div>
  )
}
