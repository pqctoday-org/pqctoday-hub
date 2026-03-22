// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
}

interface SecretsManagementExercisesProps {
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

export const SecretsManagementExercises: React.FC<SecretsManagementExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'hndl-risk-classification',
      title: '1. HNDL Risk Classification',
      description:
        'Select all 8 secret types in your environment and classify them by PQC risk level. Use the "Select All Critical" shortcut, then review the prioritized action list. Identify which secrets have Immediate vs Delayed HNDL exposure and understand why dynamic secrets (TTL ≤ 8h) are the lowest-risk category regardless of algorithm.',
      badge: 'Risk',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        '5 of the 6 critical-risk secrets have Immediate HNDL exposure — they are usable by an attacker the moment they are decrypted. API keys (delayed) are the exception due to token lifetime limits, but remain critical. The prioritized action list shows ML-KEM-based mitigation for each type.',
      config: { step: 0 },
    },
    {
      id: 'vault-transit-pqc',
      title: '2. Vault Transit Algorithm Impact',
      description:
        'Simulate all four Vault transit operations (Symmetric Encryption, Key Wrapping, Sign/Verify, MAC) with PQC algorithms. Compare the size impact of ML-KEM-768 key wrapping vs RSA-OAEP-2048, and ML-DSA-65 vs ECDSA P-256. Observe the API call changes required for each operation.',
      badge: 'Vault',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'ML-KEM-768 key wrapping produces 1,088-byte ciphertexts vs 256 bytes for RSA — a 4.25x increase. ML-DSA-65 signatures are 3,309 bytes vs 64 bytes for ECDSA P-256 — a 51.7x increase. AES-256-GCM and HMAC-SHA256 have zero size impact. SYMMETRIC encryption and MAC operations require no algorithm change, only KEK upgrade.',
      config: { step: 1 },
    },
    {
      id: 'rotation-policy-design',
      title: '3. Rotation Policy Design',
      description:
        'Design a complete rotation policy for all 6 secret types. Test edge cases: set API key TTL to 2 years and observe the warning. Set DB credentials to 7 days and compare against the dynamic secrets recommendation. Generate the YAML output and inspect the PQC considerations embedded in each policy.',
      badge: 'Policy',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'API keys with TTL > 90 days trigger the PQC warning — they outlive safe HNDL windows. DB credentials at 7 days far exceed the recommended 8-hour dynamic TTL. The generated YAML includes both the rotation schedule and PQC algorithm requirements for the underlying vault infrastructure.',
      config: { step: 2 },
    },
    {
      id: 'cloud-provider-selection',
      title: '4. Cloud Provider PQC Readiness',
      description:
        'Compare all 5 secrets management providers across PQC status, dynamic secrets support, envelope encryption, FIPS mode, and Kubernetes integration. Filter by deployment type (Cloud / On-Prem / Hybrid). Identify which providers support both dynamic secrets and FIPS compliance simultaneously.',
      badge: 'Cloud',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'HashiCorp Vault supports native dynamic secrets (DB, AWS, GCP, Azure credential generation) with FIPS 140-3 (Enterprise), but PQC is planned rather than GA. AWS Secrets Manager has GA PQC via KMS integration but does not generate dynamic secrets natively. GCP Cloud KMS supports ML-KEM-768, ML-KEM-1024, X-Wing, ML-DSA-65, and SLH-DSA (preview), but FIPS mode is unavailable for GCP Secret Manager.',
      config: { step: 3 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to master PQC secrets management: classify secrets by HNDL
          risk, understand Vault transit algorithm impacts, design rotation policies, and select the
          right cloud provider for your compliance requirements. Each exercise pre-configures the
          Workshop &mdash; click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <button
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to reinforce what you&apos;ve learned about secrets management,
                HNDL risk, and Vault transit engine migration.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
