// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { KeyRound, HardDrive, Network, Info } from 'lucide-react'
import { KEY_HIERARCHY_LEVELS, KEY_SIZE_COMPARISONS } from '../data/kmsConstants'
import { Button } from '@/components/ui/button'

type AlgorithmMode = 'classical' | 'hybrid' | 'pqc'

interface LevelConfig {
  mode: AlgorithmMode
}

/** Approximate public key sizes by level and mode */
const KEY_SIZES: Record<string, Record<AlgorithmMode, { pubKey: number; privKey: number }>> = {
  'root-kek': {
    classical: { pubKey: 512, privKey: 2348 }, // RSA-4096 (typical PKCS#1 DER private key, about 2.3 kB)
    hybrid: { pubKey: 512 + 1568, privKey: 2348 + 3168 }, // RSA-4096 + ML-KEM-1024
    pqc: { pubKey: 1568, privKey: 3168 }, // ML-KEM-1024
  },
  'zone-kek': {
    classical: { pubKey: 384, privKey: 1766 }, // RSA-3072
    hybrid: { pubKey: 65 + 1184, privKey: 32 + 2400 }, // P-256 + ML-KEM-768
    pqc: { pubKey: 1184, privKey: 2400 }, // ML-KEM-768
  },
  dek: {
    classical: { pubKey: 32, privKey: 32 }, // AES-256
    hybrid: { pubKey: 32, privKey: 32 }, // AES-256 (unchanged)
    pqc: { pubKey: 32, privKey: 32 }, // AES-256 (unchanged)
  },
}

/** Existing illustrative logical-profile counts; not enterprise norms or physical object counts. */
const KEY_COUNTS: Record<string, number> = {
  'root-kek': 2,
  'zone-kek': 10,
  dek: 500,
}

/** Sample payload accounting, not a serialized-object or wrapping profile. */
// eslint-disable-next-line react-refresh/only-export-components -- Pure sample accounting exposed for independent arithmetic checks.
export function hierarchyMaterial(
  modes: Partial<Record<string, AlgorithmMode>>,
  counts: Record<string, number> = KEY_COUNTS
) {
  let publicBytes = 0
  let privateBytes = 0
  let secretBytes = 0
  let classicalPublicBytes = 0
  let classicalPrivateBytes = 0
  let logicalRecords = 0
  for (const id of Object.keys(KEY_COUNTS)) {
    const count = counts[id]
    if (!Number.isFinite(count) || count < 0 || !Number.isInteger(count)) return null
    if (count === 0) continue
    const mode = modes[id]
    if (!mode || !KEY_SIZES[id]?.[mode]) return null
    logicalRecords += count
    if (id === 'dek') {
      // The two legacy DEK fields describe the SAME AES secret, not a keypair.
      secretBytes += count * KEY_SIZES[id][mode].pubKey
    } else {
      publicBytes += count * KEY_SIZES[id][mode].pubKey
      privateBytes += count * KEY_SIZES[id][mode].privKey
      classicalPublicBytes += count * KEY_SIZES[id].classical.pubKey
      classicalPrivateBytes += count * KEY_SIZES[id].classical.privKey
    }
  }
  return {
    publicBytes,
    privateBytes,
    secretBytes,
    logicalRecords,
    totalMaterialBytes: publicBytes + privateBytes + secretBytes,
    classicalMaterialBytes: classicalPublicBytes + classicalPrivateBytes + secretBytes,
    publicMultiplier: classicalPublicBytes > 0 ? publicBytes / classicalPublicBytes : null,
  }
}

const MODE_LABELS: Record<AlgorithmMode, { label: string; color: string }> = {
  classical: { label: 'Classical', color: 'text-destructive' },
  hybrid: { label: 'Hybrid', color: 'text-warning' },
  pqc: { label: 'PQC-Only', color: 'text-success' },
}

const MODE_BORDER: Record<AlgorithmMode, string> = {
  classical: 'border-destructive/30',
  hybrid: 'border-warning/30',
  pqc: 'border-success/30',
}

const MODE_BG: Record<AlgorithmMode, string> = {
  classical: 'bg-destructive/5',
  hybrid: 'bg-warning/5',
  pqc: 'bg-success/5',
}

export const KeyHierarchyDesigner: React.FC = () => {
  const [levels, setLevels] = useState<Record<string, LevelConfig>>({
    'root-kek': { mode: 'hybrid' },
    'zone-kek': { mode: 'hybrid' },
    dek: { mode: 'pqc' },
  })

  const setMode = (levelId: string, mode: AlgorithmMode) => {
    setLevels((prev) => ({ ...prev, [levelId]: { mode } }))
  }

  const analysis = useMemo(
    () =>
      hierarchyMaterial(
        Object.fromEntries(Object.entries(levels).map(([id, config]) => [id, config.mode]))
      ),
    [levels]
  )

  if (!analysis)
    return <p>Sample material totals: Not assessed — missing count or profile inputs.</p>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Key Hierarchy Designer</h3>
        <p className="text-sm text-muted-foreground">
          Compare raw key-material inputs for three sample levels. AES DEKs are symmetric secrets,
          counted once. These subtotals are not complete encoded storage or rotation traffic.
        </p>
      </div>

      {/* Visual Tree Diagram */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-4">Hierarchy Tree</h4>
        <div className="space-y-3">
          {KEY_HIERARCHY_LEVELS.map((level, idx) => {
            const config = levels[level.id]
            const modeInfo = MODE_LABELS[config.mode]
            const sizes = KEY_SIZES[level.id]
            const count = KEY_COUNTS[level.id]

            return (
              <React.Fragment key={level.id}>
                {/* Connector line */}
                {idx > 0 && (
                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-border" />
                  </div>
                )}

                <div
                  className={`rounded-lg p-4 border-2 ${MODE_BORDER[config.mode]} ${MODE_BG[config.mode]} transition-all duration-200`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Level info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <KeyRound size={14} className={modeInfo.color} />
                        <span className="text-sm font-bold text-foreground">{level.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                            config.mode === 'classical'
                              ? 'bg-destructive/10 text-status-error border-destructive/20'
                              : config.mode === 'hybrid'
                                ? 'bg-warning/10 text-warning border-warning/20'
                                : 'bg-success/10 text-success border-success/20'
                          }`}
                        >
                          {modeInfo.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          &times;{count} logical profiles
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{level.description}</p>

                      {/* Algorithm details */}
                      <div className="text-xs text-foreground/70">
                        <span className="font-bold">Algorithm: </span>
                        {level.id === 'dek'
                          ? 'AES-256 secret (unchanged in every mode)'
                          : level.id === 'root-kek'
                            ? config.mode === 'classical'
                              ? 'RSA-4096'
                              : config.mode === 'hybrid'
                                ? 'RSA-4096 + ML-KEM-1024 constituent material'
                                : 'ML-KEM-1024 constituent material'
                            : config.mode === 'classical'
                              ? 'RSA-3072'
                              : config.mode === 'hybrid'
                                ? 'P-256 + ML-KEM-768 constituent material'
                                : 'ML-KEM-768 constituent material'}
                      </div>
                      <div className="flex gap-4 text-[10px] text-muted-foreground mt-1">
                        <span>
                          {level.id === 'dek' ? 'Symmetric secret' : 'Public material'}:{' '}
                          {sizes[config.mode].pubKey.toLocaleString()} B &times; {count} ={' '}
                          {(sizes[config.mode].pubKey * count).toLocaleString()} B
                        </span>
                        <span>Rotation: {level.rotationInterval}</span>
                      </div>
                    </div>

                    {/* Mode toggle */}
                    <div className="flex gap-1 shrink-0">
                      {(['classical', 'hybrid', 'pqc'] as AlgorithmMode[]).map((mode) => (
                        <Button
                          variant="ghost"
                          key={mode}
                          onClick={() => setMode(level.id, mode)}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            config.mode === mode
                              ? mode === 'classical'
                                ? 'bg-destructive/20 text-destructive border border-destructive/50'
                                : mode === 'hybrid'
                                  ? 'bg-warning/20 text-warning border border-warning/50'
                                  : 'bg-success/20 text-success border border-success/50'
                              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                          }`}
                        >
                          {MODE_LABELS[mode].label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Storage & Bandwidth Analysis */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Sample material subtotals</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-foreground">
              {formatBytes(analysis.publicBytes)}
            </div>
            <div className="text-[10px] text-muted-foreground">Asymmetric public material</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-foreground">
              {formatBytes(analysis.privateBytes)}
            </div>
            <div className="text-[10px] text-muted-foreground">Asymmetric private material</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
            <div className="text-lg font-bold text-primary">
              {formatBytes(analysis.totalMaterialBytes)}
            </div>
            <div className="text-[10px] text-muted-foreground">All sample material (AES once)</div>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 text-center">
            <div className="text-lg font-bold text-warning">
              {analysis.publicMultiplier === null
                ? 'Not assessed'
                : `${analysis.publicMultiplier.toFixed(1)}x`}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Public-material ratio vs chosen traditional profiles
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Symmetric-secret material: <strong>{analysis.secretBytes.toLocaleString()} B</strong>.
          Public/private values are existing sample inputs; RSA/P-256 encodings and hybrid
          containers are unspecified. Zone comparison changes RSA-3072 to P-256 plus ML-KEM, so the
          ratio is not solely a PQC-size effect.
        </p>

        {/* Per-level breakdown */}
        <div className="space-y-2">
          {KEY_HIERARCHY_LEVELS.map((level) => {
            const config = levels[level.id]
            const sizes = KEY_SIZES[level.id]
            const count = KEY_COUNTS[level.id]
            const classicalPub = sizes.classical.pubKey * count
            const selectedPub = sizes[config.mode].pubKey * count
            const multiplier = classicalPub > 0 ? selectedPub / classicalPub : 1

            return (
              <div
                key={level.id}
                className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 border border-border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-foreground">
                      {level.name.split('(')[0].trim()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({count} logical profiles)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-destructive">
                      {level.id === 'dek'
                        ? 'AES secret (unchanged)'
                        : 'Traditional public material'}
                      : {formatBytes(classicalPub)}
                    </span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className={MODE_LABELS[config.mode].color}>
                      {MODE_LABELS[config.mode].label}: {formatBytes(selectedPub)}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold shrink-0 ${
                    multiplier <= 1.0
                      ? 'text-success'
                      : multiplier < 5
                        ? 'text-warning'
                        : 'text-destructive'
                  }`}
                >
                  {multiplier.toFixed(1)}x
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="glass-panel p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Network size={16} className="text-primary" />
          <h4 className="text-sm font-bold">Object and transfer scope</h4>
        </div>
        <p className="text-xs">
          {analysis.logicalRecords} logical sample records: 12 asymmetric-pair profiles and 500 AES
          DEKs. Hybrid profiles can contain multiple constituent keys; this is not a physical object
          count.
        </p>
        <p className="text-xs">
          <strong>Physical object / certificate count: Not assessed.</strong>
        </p>
        <p className="text-xs">
          <strong>Protected transfer / rewrap bytes: Not assessed.</strong> A public-material
          subtotal or KEM ciphertext is not a complete protected DEK-distribution message.
        </p>
        <p className="text-xs text-muted-foreground">
          With production tools, inspect actual encodings, wrapped-secret objects, recipient/copy
          counts, certificate/signature metadata and rewrap behavior before estimating stored bytes
          or transfer traffic. No wrapping profile or operation is executed here.
        </p>
      </div>

      {/* Key size reference */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Constituent key-material reference</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Algorithm</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Public Key
                </th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Private Key
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Security (classical rows: approximate bits; PQC rows: NIST category)
                </th>
              </tr>
            </thead>
            <tbody>
              {KEY_SIZE_COMPARISONS.map((k) => (
                <tr key={k.algorithm} className="border-b border-border/50">
                  <td
                    className={`py-2 px-2 font-mono ${k.quantumSafe ? 'text-primary' : 'text-destructive'}`}
                  >
                    {k.algorithm}
                  </td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {k.publicKeyBytes.toLocaleString()} B
                  </td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {k.privateKeyBytes.toLocaleString()} B
                  </td>
                  <td
                    className={`py-2 px-2 ${k.quantumSafe ? 'text-success' : 'text-destructive'}`}
                  >
                    {k.nistLevel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}
