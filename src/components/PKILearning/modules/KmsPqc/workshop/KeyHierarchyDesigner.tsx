// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { KeyRound, HardDrive, Network, Info } from 'lucide-react'
import { KEY_HIERARCHY_LEVELS, KEY_SIZE_COMPARISONS } from '../data/kmsConstants'

type AlgorithmMode = 'classical' | 'hybrid' | 'pqc'

interface LevelConfig {
  mode: AlgorithmMode
}

/** Approximate public key sizes by level and mode */
const KEY_SIZES: Record<string, Record<AlgorithmMode, { pubKey: number; privKey: number }>> = {
  'root-kek': {
    classical: { pubKey: 512, privKey: 2048 }, // RSA-4096
    hybrid: { pubKey: 512 + 1568, privKey: 2048 + 3168 }, // RSA-4096 + ML-KEM-1024
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

/** Typical key count per level in an enterprise */
const KEY_COUNTS: Record<string, number> = {
  'root-kek': 2,
  'zone-kek': 10,
  dek: 500,
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

  // Calculate totals
  const analysis = useMemo(() => {
    let totalPubKey = 0
    let totalPrivKey = 0
    let classicalTotalPubKey = 0
    let classicalTotalPrivKey = 0

    for (const level of KEY_HIERARCHY_LEVELS) {
      const count = KEY_COUNTS[level.id]
      const sizes = KEY_SIZES[level.id]
      const mode = levels[level.id].mode

      totalPubKey += sizes[mode].pubKey * count
      totalPrivKey += sizes[mode].privKey * count
      classicalTotalPubKey += sizes.classical.pubKey * count
      classicalTotalPrivKey += sizes.classical.privKey * count
    }

    const pubKeyMultiplier = classicalTotalPubKey > 0 ? totalPubKey / classicalTotalPubKey : 1
    const totalKeyMaterial = totalPubKey + totalPrivKey
    const classicalTotal = classicalTotalPubKey + classicalTotalPrivKey

    // Rough bandwidth per rotation: re-distribute all public keys
    const rotationBandwidth = totalPubKey

    return {
      totalPubKey,
      totalPrivKey,
      totalKeyMaterial,
      classicalTotal,
      pubKeyMultiplier,
      rotationBandwidth,
    }
  }, [levels])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Key Hierarchy Designer</h3>
        <p className="text-sm text-muted-foreground">
          Design a 3-level PQC key hierarchy. Select the algorithm mode for each level and observe
          how key material sizes, storage requirements, and rotation bandwidth change.
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
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : config.mode === 'hybrid'
                                ? 'bg-warning/10 text-warning border-warning/20'
                                : 'bg-success/10 text-success border-success/20'
                          }`}
                        >
                          {modeInfo.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          &times;{count} keys
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{level.description}</p>

                      {/* Algorithm details */}
                      <div className="text-xs text-foreground/70">
                        <span className="font-bold">Algorithm: </span>
                        {config.mode === 'classical'
                          ? level.classicalAlgorithm
                          : config.mode === 'hybrid'
                            ? level.hybridAlgorithm
                            : level.pqcAlgorithm}
                      </div>
                      <div className="flex gap-4 text-[10px] text-muted-foreground mt-1">
                        <span>
                          Public: {sizes[config.mode].pubKey.toLocaleString()} B &times; {count} ={' '}
                          {(sizes[config.mode].pubKey * count).toLocaleString()} B
                        </span>
                        <span>Rotation: {level.rotationInterval}</span>
                      </div>
                    </div>

                    {/* Mode toggle */}
                    <div className="flex gap-1 shrink-0">
                      {(['classical', 'hybrid', 'pqc'] as AlgorithmMode[]).map((mode) => (
                        <button
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
                        </button>
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
          <h4 className="text-sm font-bold text-foreground">Storage Requirements</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-foreground">
              {formatBytes(analysis.totalPubKey)}
            </div>
            <div className="text-[10px] text-muted-foreground">Total Public Keys</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-foreground">
              {formatBytes(analysis.totalPrivKey)}
            </div>
            <div className="text-[10px] text-muted-foreground">Total Private Keys</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
            <div className="text-lg font-bold text-primary">
              {formatBytes(analysis.totalKeyMaterial)}
            </div>
            <div className="text-[10px] text-muted-foreground">Total Key Material</div>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 text-center">
            <div className="text-lg font-bold text-warning">
              {analysis.pubKeyMultiplier.toFixed(1)}x
            </div>
            <div className="text-[10px] text-muted-foreground">vs Classical (pub keys)</div>
          </div>
        </div>

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
                    <span className="text-[10px] text-muted-foreground">({count} keys)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-destructive">Classical: {formatBytes(classicalPub)}</span>
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

      {/* Bandwidth estimate */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Network size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Rotation Bandwidth Estimate</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-foreground">
              {formatBytes(analysis.rotationBandwidth)}
            </div>
            <div className="text-[10px] text-muted-foreground">Per Rotation Cycle (pub keys)</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-foreground">
              {(
                KEY_COUNTS['root-kek'] +
                KEY_COUNTS['zone-kek'] +
                KEY_COUNTS['dek']
              ).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">Total Keys</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-lg font-bold text-foreground">
              {formatBytes(
                Math.round(
                  analysis.rotationBandwidth /
                    (KEY_COUNTS['root-kek'] + KEY_COUNTS['zone-kek'] + KEY_COUNTS['dek'])
                )
              )}
            </div>
            <div className="text-[10px] text-muted-foreground">Avg per Key</div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Bandwidth estimate assumes all public keys are re-distributed during rotation. Actual
          bandwidth is higher when including certificate chain signatures.
        </p>
      </div>

      {/* Key size reference */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Algorithm Reference</h4>
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
                  Security Level
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
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
