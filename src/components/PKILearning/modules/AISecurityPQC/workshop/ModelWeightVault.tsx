// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  MODEL_SIZE_PROFILES,
  KEY_WRAPPING_OVERHEADS,
  MODEL_SIGNING_OVERHEADS,
  DEPLOYMENT_MODES,
} from '../data/aiModelData'

const SIZE_ITEMS = MODEL_SIZE_PROFILES.map((p) => ({ id: p.id, label: p.label }))
const WRAP_ITEMS = KEY_WRAPPING_OVERHEADS.map((p) => ({
  id: p.algorithmId,
  label: p.algorithmLabel,
}))
const SIGN_ITEMS = MODEL_SIGNING_OVERHEADS.map((p) => ({
  id: p.algorithmId,
  label: p.algorithmLabel,
}))
const DEPLOY_ITEMS = DEPLOYMENT_MODES.map((d) => ({ id: d.id, label: d.name }))

export const ModelWeightVault: React.FC = () => {
  const [selectedSize, setSelectedSize] = useState<string>(MODEL_SIZE_PROFILES[1].id)
  const [selectedWrap, setSelectedWrap] = useState('ml-kem-768')
  const [selectedSign, setSelectedSign] = useState('ml-dsa-65')
  const [selectedDeploy, setSelectedDeploy] = useState(DEPLOYMENT_MODES[0].id)

  const sizeProfile = useMemo(
    () => MODEL_SIZE_PROFILES.find((p) => p.id === selectedSize) ?? MODEL_SIZE_PROFILES[1],
    [selectedSize]
  )

  const wrapProfile = useMemo(
    () =>
      KEY_WRAPPING_OVERHEADS.find((p) => p.algorithmId === selectedWrap) ??
      KEY_WRAPPING_OVERHEADS[1],
    [selectedWrap]
  )

  const signProfile = useMemo(
    () =>
      MODEL_SIGNING_OVERHEADS.find((p) => p.algorithmId === selectedSign) ??
      MODEL_SIGNING_OVERHEADS[3],
    [selectedSign]
  )

  const deployProfile = useMemo(
    () => DEPLOYMENT_MODES.find((d) => d.id === selectedDeploy) ?? DEPLOYMENT_MODES[0],
    [selectedDeploy]
  )

  // Classical baselines for comparison
  const classicalWrap = KEY_WRAPPING_OVERHEADS[0] // RSA-2048
  const classicalSign = MODEL_SIGNING_OVERHEADS[1] // ECDSA P-256

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Model Weight Vault</h3>
        <p className="text-sm text-muted-foreground">
          Configure a protection scheme for your model weights. Compare classical vs PQC overhead
          and generate a protection manifest.
        </p>
      </div>

      {/* Model Size */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Lock size={16} className="text-primary" />
          Model Profile
        </h4>
        <FilterDropdown
          items={SIZE_ITEMS}
          selectedId={selectedSize}
          onSelect={(id) => setSelectedSize(id)}
          label="Model Size"
          defaultLabel="Select Size"
          noContainer
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-panel p-3 text-center">
            <p className="text-lg font-bold text-foreground">{sizeProfile.parameterCount}</p>
            <p className="text-xs text-muted-foreground">Parameters</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-lg font-bold text-foreground">{sizeProfile.typicalFileSizeGB} GB</p>
            <p className="text-xs text-muted-foreground">File Size</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-lg font-bold text-foreground">{sizeProfile.trainingCostEstimate}</p>
            <p className="text-xs text-muted-foreground">Training Cost</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-xs text-foreground/80">{sizeProfile.hndlValueAssessment}</p>
            <p className="text-xs text-muted-foreground mt-1">HNDL Value</p>
          </div>
        </div>
      </div>

      {/* Crypto Config */}
      <div className="glass-panel p-4 space-y-4">
        <h4 className="text-sm font-bold text-foreground">Cryptographic Configuration</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Key Wrapping</p>
            <FilterDropdown
              items={WRAP_ITEMS}
              selectedId={selectedWrap}
              onSelect={(id) => setSelectedWrap(id)}
              label="Key Wrapping"
              defaultLabel="Select"
              noContainer
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Model Signing</p>
            <FilterDropdown
              items={SIGN_ITEMS}
              selectedId={selectedSign}
              onSelect={(id) => setSelectedSign(id)}
              label="Signing"
              defaultLabel="Select"
              noContainer
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Deployment</p>
            <FilterDropdown
              items={DEPLOY_ITEMS}
              selectedId={selectedDeploy}
              onSelect={(id) => setSelectedDeploy(id)}
              label="Deployment"
              defaultLabel="Select"
              noContainer
            />
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3">Overhead Comparison</h4>
        <div className="glass-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Metric</th>
                <th className="text-center p-3 text-status-error font-medium">Classical</th>
                <th className="text-center p-3 text-status-success font-medium">Selected PQC</th>
                <th className="text-center p-3 text-muted-foreground font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Key Wrap Size</td>
                <td className="text-center p-3 font-mono">{classicalWrap.keyOrSignatureSize} B</td>
                <td className="text-center p-3 font-mono">{wrapProfile.keyOrSignatureSize} B</td>
                <td className="text-center p-3 font-mono text-status-warning">
                  +
                  {(
                    (wrapProfile.keyOrSignatureSize / classicalWrap.keyOrSignatureSize - 1) *
                    100
                  ).toFixed(0)}
                  %
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Key Wrap Time</td>
                <td className="text-center p-3 font-mono">{classicalWrap.operationTimeMs}ms</td>
                <td className="text-center p-3 font-mono">{wrapProfile.operationTimeMs}ms</td>
                <td className="text-center p-3 font-mono text-status-success">
                  {wrapProfile.operationTimeMs <= classicalWrap.operationTimeMs
                    ? 'Faster'
                    : `+${((wrapProfile.operationTimeMs / classicalWrap.operationTimeMs - 1) * 100).toFixed(0)}%`}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Signature Size</td>
                <td className="text-center p-3 font-mono">{classicalSign.keyOrSignatureSize} B</td>
                <td className="text-center p-3 font-mono">{signProfile.keyOrSignatureSize} B</td>
                <td className="text-center p-3 font-mono text-status-warning">
                  +
                  {(
                    (signProfile.keyOrSignatureSize / classicalSign.keyOrSignatureSize - 1) *
                    100
                  ).toFixed(0)}
                  %
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Sign Time</td>
                <td className="text-center p-3 font-mono">{classicalSign.operationTimeMs}ms</td>
                <td className="text-center p-3 font-mono">{signProfile.operationTimeMs}ms</td>
                <td className="text-center p-3 font-mono">
                  {signProfile.operationTimeMs <= classicalSign.operationTimeMs
                    ? '~Same'
                    : `+${((signProfile.operationTimeMs / classicalSign.operationTimeMs - 1) * 100).toFixed(0)}%`}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Quantum Safe</td>
                <td className="text-center p-3">
                  <AlertTriangle size={16} className="text-status-error inline" />
                </td>
                <td className="text-center p-3">
                  {wrapProfile.quantumSafe && signProfile.quantumSafe ? (
                    <ShieldCheck size={16} className="text-status-success inline" />
                  ) : (
                    <AlertTriangle size={16} className="text-status-error inline" />
                  )}
                </td>
                <td className="text-center p-3 text-xs">
                  {wrapProfile.quantumSafe && signProfile.quantumSafe
                    ? 'Level ' + Math.min(wrapProfile.nistLevel, signProfile.nistLevel)
                    : 'Not safe'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Deployment details */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-2">{deployProfile.name}</h4>
        <p className="text-sm text-foreground/80">{deployProfile.description}</p>
        <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
          <div>
            <span className="text-muted-foreground">Key Storage: </span>
            <span className="text-foreground">{deployProfile.keyStorageLocation}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Attestation: </span>
            <span
              className={
                deployProfile.attestationAvailable ? 'text-status-success' : 'text-muted-foreground'
              }
            >
              {deployProfile.attestationAvailable ? 'Available' : 'Not available'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Max Model: </span>
            <span className="text-foreground">
              {deployProfile.maxModelSizeGB ? `${deployProfile.maxModelSizeGB} GB` : 'Unlimited'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Encryption in Use: </span>
            <span
              className={
                deployProfile.encryptionInUse ? 'text-status-success' : 'text-muted-foreground'
              }
            >
              {deployProfile.encryptionInUse ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        <div className="glass-panel p-3 mt-3 border-l-4 border-primary">
          <p className="text-xs text-foreground/70">
            <strong>PQC Considerations:</strong> {deployProfile.pqcConsiderations}
          </p>
        </div>
      </div>

      {/* Protection Manifest */}
      <div className="glass-panel p-4 border-primary/30">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" />
          Protection Manifest
        </h4>
        <div className="font-mono text-xs space-y-1 text-foreground/80">
          <p>
            Model: {sizeProfile.label} ({sizeProfile.typicalFileSizeGB} GB)
          </p>
          <p>Encryption at Rest: AES-256-GCM</p>
          <p>
            Key Wrapping: {wrapProfile.algorithmLabel} (NIST Level {wrapProfile.nistLevel})
          </p>
          <p>
            Model Signing: {signProfile.algorithmLabel} (NIST Level {signProfile.nistLevel})
          </p>
          <p>Deployment: {deployProfile.name}</p>
          <p>
            Quantum Safety:{' '}
            <span
              className={
                wrapProfile.quantumSafe && signProfile.quantumSafe
                  ? 'text-status-success'
                  : 'text-status-error'
              }
            >
              {wrapProfile.quantumSafe && signProfile.quantumSafe
                ? 'FULL PQC PROTECTION'
                : 'PARTIAL — upgrade required'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
