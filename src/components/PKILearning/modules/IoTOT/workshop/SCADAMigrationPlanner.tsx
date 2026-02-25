import React, { useState, useMemo } from 'react'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { PURDUE_LAYERS } from '../constants'

type CryptoPosture = 'none' | 'psk' | 'rsa-2048' | 'ecdsa-p256' | 'tls-1.3' | 'pqc-hybrid'

const POSTURE_OPTIONS: { id: CryptoPosture; label: string; quantumVulnerable: boolean }[] = [
  { id: 'none', label: 'No encryption', quantumVulnerable: true },
  { id: 'psk', label: 'Pre-shared keys', quantumVulnerable: true },
  { id: 'rsa-2048', label: 'RSA-2048 / TLS 1.2', quantumVulnerable: true },
  { id: 'ecdsa-p256', label: 'ECDSA P-256 / TLS 1.3', quantumVulnerable: true },
  { id: 'tls-1.3', label: 'TLS 1.3 (X25519)', quantumVulnerable: true },
  { id: 'pqc-hybrid', label: 'PQC Hybrid (ML-KEM + X25519)', quantumVulnerable: false },
]

interface LayerAssessment {
  level: number | string
  name: string
  posture: CryptoPosture
  internetFacing: boolean
  pqcPriority: 'critical' | 'high' | 'medium' | 'low'
  assetLifecycleYears: number
  migrationScore: number
}

function scoreMigrationPriority(
  posture: CryptoPosture,
  internetFacing: boolean,
  basePriority: string,
  lifecycleYears: number
): number {
  const postureOpt = POSTURE_OPTIONS.find((p) => p.id === posture)
  if (!postureOpt?.quantumVulnerable) return 0 // Already PQC

  let score = 0
  // Base priority
  if (basePriority === 'critical') score += 40
  else if (basePriority === 'high') score += 30
  else if (basePriority === 'medium') score += 20
  else score += 10

  // Internet-facing multiplier
  if (internetFacing) score += 25

  // Long lifecycle adds urgency (HNDL window)
  score += Math.min(lifecycleYears * 1.5, 25)

  // Weak posture adds urgency
  if (posture === 'none') score += 10
  else if (posture === 'psk') score += 5

  return Math.min(score, 100)
}

export const SCADAMigrationPlanner: React.FC = () => {
  const [layerPostures, setLayerPostures] = useState<Record<string, CryptoPosture>>(() => {
    const defaults: Record<string, CryptoPosture> = {}
    PURDUE_LAYERS.forEach((layer) => {
      if (layer.defaultCrypto.includes('TLS 1.3')) defaults[String(layer.level)] = 'tls-1.3'
      else if (layer.defaultCrypto.includes('RSA')) defaults[String(layer.level)] = 'rsa-2048'
      else if (layer.defaultCrypto.includes('Pre-shared')) defaults[String(layer.level)] = 'psk'
      else defaults[String(layer.level)] = 'none'
    })
    return defaults
  })

  const assessments = useMemo<LayerAssessment[]>(() => {
    return PURDUE_LAYERS.map((layer) => {
      const key = String(layer.level)
      // eslint-disable-next-line security/detect-object-injection
      const posture = layerPostures[key] ?? 'none'
      return {
        level: layer.level,
        name: layer.name,
        posture,
        internetFacing: layer.internetFacing,
        pqcPriority: layer.pqcPriority,
        assetLifecycleYears: layer.assetLifecycleYears,
        migrationScore: scoreMigrationPriority(
          posture,
          layer.internetFacing,
          layer.pqcPriority,
          layer.assetLifecycleYears
        ),
      }
    })
  }, [layerPostures])

  const sortedByPriority = useMemo(
    () => [...assessments].sort((a, b) => b.migrationScore - a.migrationScore),
    [assessments]
  )

  const handlePostureChange = (level: string, posture: CryptoPosture) => {
    setLayerPostures((prev) => ({ ...prev, [level]: posture }))
  }

  const allProtected = assessments.every((a) => a.migrationScore === 0)

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Configure the cryptographic posture for each Purdue model layer in your SCADA/ICS
        environment. The tool generates a migration priority matrix based on internet exposure,
        asset lifetime, and HNDL risk.
      </p>

      {/* Layer Configuration */}
      <div className="space-y-3">
        {PURDUE_LAYERS.map((layer) => {
          const key = String(layer.level)
          // eslint-disable-next-line security/detect-object-injection
          const posture = layerPostures[key] ?? 'none'
          const assessment = assessments.find((a) => String(a.level) === key)
          const score = assessment?.migrationScore ?? 0

          return (
            <div
              key={key}
              className={`glass-panel p-4 border-l-4 ${
                score === 0
                  ? 'border-l-success'
                  : score >= 60
                    ? 'border-l-destructive'
                    : score >= 30
                      ? 'border-l-warning'
                      : 'border-l-primary'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      Level {layer.level}: {layer.name}
                    </span>
                    {layer.internetFacing && (
                      <span className="text-[10px] bg-destructive/20 text-destructive rounded px-1.5 py-0.5">
                        Internet-facing
                      </span>
                    )}
                    <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                      {layer.assetLifecycleYears}yr lifecycle
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{layer.description}</p>
                </div>

                <select
                  value={posture}
                  onChange={(e) => handlePostureChange(key, e.target.value as CryptoPosture)}
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground min-w-[200px]"
                >
                  {POSTURE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Migration score bar */}
              {score > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-muted-foreground">Migration Priority</span>
                    <span className="font-mono text-foreground">{score}/100</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        score >= 60
                          ? 'bg-destructive/70'
                          : score >= 30
                            ? 'bg-warning/70'
                            : 'bg-primary/70'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              )}
              {score === 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-success">
                  <CheckCircle size={12} />
                  <span>Quantum-resistant</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Priority Matrix */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Migration Priority Matrix</div>
        {allProtected ? (
          <div className="flex items-center gap-2 text-success p-4">
            <Shield size={20} />
            <span className="text-sm font-medium">
              All layers are using quantum-resistant cryptography.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Priority</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Layer</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">
                    Current Crypto
                  </th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Risk</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedByPriority
                  .filter((a) => a.migrationScore > 0)
                  .map((a, idx) => {
                    const postureLabel =
                      POSTURE_OPTIONS.find((p) => p.id === a.posture)?.label ?? 'Unknown'
                    return (
                      <tr key={String(a.level)} className="border-b border-border/50">
                        <td className="p-2">
                          <span
                            className={`text-xs font-bold rounded px-1.5 py-0.5 ${
                              idx === 0
                                ? 'bg-destructive/20 text-destructive'
                                : idx < 3
                                  ? 'bg-warning/20 text-warning'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="p-2 text-foreground font-medium">
                          L{a.level}: {a.name}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">{postureLabel}</td>
                        <td className="p-2 text-center">
                          <span
                            className={`font-mono text-xs font-bold ${
                              a.migrationScore >= 60
                                ? 'text-destructive'
                                : a.migrationScore >= 30
                                  ? 'text-warning'
                                  : 'text-primary'
                            }`}
                          >
                            {a.migrationScore}
                          </span>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {a.internetFacing
                            ? 'Migrate to PQC hybrid TLS 1.3 immediately'
                            : a.posture === 'none' || a.posture === 'psk'
                              ? 'Upgrade to TLS 1.3 first, then hybrid PQC'
                              : 'Upgrade to PQC hybrid at next refresh cycle'}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Timeline Visualization */}
      {!allProtected && (
        <div className="glass-panel p-4">
          <div className="text-sm font-bold text-foreground mb-3">
            Recommended Migration Timeline
          </div>
          <div className="space-y-2">
            {[
              {
                phase: 'Phase 1: Immediate (0\u20136 months)',
                layers: sortedByPriority
                  .filter((a) => a.migrationScore >= 60)
                  .map((a) => `L${a.level}`),
                desc: 'Internet-facing layers with highest HNDL exposure. Deploy PQC hybrid TLS 1.3 on DMZ and enterprise boundaries.',
              },
              {
                phase: 'Phase 2: Short-term (6\u201318 months)',
                layers: sortedByPriority
                  .filter((a) => a.migrationScore >= 30 && a.migrationScore < 60)
                  .map((a) => `L${a.level}`),
                desc: 'Internal layers with moderate exposure. Upgrade SCADA servers and engineering workstations during planned maintenance windows.',
              },
              {
                phase: 'Phase 3: Long-term (18\u201336 months)',
                layers: sortedByPriority
                  .filter((a) => a.migrationScore > 0 && a.migrationScore < 30)
                  .map((a) => `L${a.level}`),
                desc: 'Air-gapped field devices. Consider gateway-mediated PQC protection for Level 0\u20131 devices that cannot be upgraded directly.',
              },
            ]
              .filter((p) => p.layers.length > 0)
              .map((p) => (
                <div key={p.phase} className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs font-bold text-foreground">{p.phase}</div>
                    <span className="text-[10px] font-mono text-primary">
                      [{p.layers.join(', ')}]
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* HNDL Risk Note */}
      <div className="flex items-start gap-3 bg-warning/10 rounded-lg p-4 border border-warning/30">
        <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-foreground">HNDL Risk for SCADA</div>
          <p className="text-xs text-muted-foreground mt-1">
            SCADA systems are high-value targets for harvest-now-decrypt-later attacks. Encrypted
            operational data captured today from internet-facing layers could be decrypted once
            quantum computers arrive. With 20&ndash;30 year asset lifecycles, devices deployed now
            will still be operational when CRQCs become available.
          </p>
        </div>
      </div>
    </div>
  )
}
