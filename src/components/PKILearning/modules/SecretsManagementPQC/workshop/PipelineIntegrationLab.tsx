// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle, AlertCircle, GitBranch } from 'lucide-react'
import { PIPELINE_INTEGRATION_PATTERNS } from '../data/secretsConstants'
import { Button } from '@/components/ui/button'

type TabId = string

export const PipelineIntegrationLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(PIPELINE_INTEGRATION_PATTERNS[0].id)

  const pattern = PIPELINE_INTEGRATION_PATTERNS.find((p) => p.id === activeTab)!

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2">
        {PIPELINE_INTEGRATION_PATTERNS.map((p) => (
          <Button
            variant="ghost"
            key={p.id}
            onClick={() => setActiveTab(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              activeTab === p.id
                ? 'bg-primary text-black border-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {p.tool}
          </Button>
        ))}
      </div>

      {/* Pattern content */}
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-foreground">{pattern.tool}</h3>
            <p className="text-sm text-muted-foreground">{pattern.pattern}</p>
          </div>
          {pattern.pqcReady ? (
            <span className="flex items-center gap-1.5 text-status-success text-xs font-bold bg-status-success/10 border border-status-success/30 px-3 py-1.5 rounded-lg shrink-0">
              <CheckCircle size={13} />
              PQC Ready
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-status-warning text-xs font-bold bg-status-warning/10 border border-status-warning/30 px-3 py-1.5 rounded-lg shrink-0">
              <AlertCircle size={13} />
              PQC Pending
            </span>
          )}
        </div>

        {/* Secret injection */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-2">Secret Injection Method</div>
          <p className="text-xs text-muted-foreground">{pattern.secretInjection}</p>
        </div>

        {/* Recommendation */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start gap-2">
            <GitBranch size={15} className="text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-primary mb-1">PQC Recommendation</div>
              <p className="text-xs text-muted-foreground">{pattern.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Code snippet */}
        <div>
          <div className="text-sm font-bold text-foreground mb-2">Implementation Example</div>
          <div className="bg-muted font-mono text-xs rounded-lg p-4 overflow-x-auto border border-border whitespace-pre text-foreground/90 max-h-[400px] overflow-y-auto">
            {pattern.codeSnippet}
          </div>
        </div>

        {/* PQC status details */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-3">PQC Migration Status</div>
          <div className="space-y-2">
            {[
              {
                label: 'Token Signing Algorithm',
                status:
                  pattern.id === 'kubernetes-vault-agent'
                    ? 'RSA-2048 (Kubernetes SA JWTs) → ML-DSA-65 (planned K8s 1.33+)'
                    : pattern.id === 'github-actions-oidc'
                      ? "RS256 (GitHub's OIDC JWTs) → ML-DSA (GitHub roadmap TBD)"
                      : pattern.id === 'gitlab-ci-tokens'
                        ? 'RS256 (GitLab CI_JOB_JWT_V2) → ML-DSA (GitLab roadmap TBD)'
                        : 'Vault token: HMAC-SHA256 (quantum-safe already)',
                isSafe: pattern.id === 'terraform-vault-provider',
              },
              {
                label: 'TLS Channel Security',
                status:
                  'TLS 1.3 with hybrid ML-KEM (via Vault 1.18+ / cloud SDK) → Protects secrets in transit',
                isSafe: false,
              },
              {
                label: 'Secret Encryption at Rest',
                status:
                  'Vault AES-256-GCM with ML-KEM KEK (Vault 1.18+) → Protects vault backups from HNDL',
                isSafe: false,
              },
              {
                label: 'Identity Attestation',
                status:
                  pattern.id === 'kubernetes-vault-agent'
                    ? 'Kubernetes SA JWT + Vault K8s auth → SPIFFE/SPIRE with ML-DSA X.509-SVID (recommended long-term)'
                    : 'OIDC JWT federation → ML-DSA signed OIDC tokens (provider roadmap dependent)',
                isSafe: false,
              },
            ].map(({ label, status, isSafe }) => (
              <div key={label} className="flex items-start gap-2">
                {isSafe ? (
                  <CheckCircle size={12} className="text-status-success shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={12} className="text-status-warning shrink-0 mt-0.5" />
                )}
                <div className="text-[10px] text-muted-foreground">
                  <strong className="text-foreground">{label}:</strong> {status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
