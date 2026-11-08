// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Lock } from 'lucide-react'
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

  const modelGB = sizeProfile.typicalFileSizeGB
  const limitGB = deployProfile.maxModelSizeGB
  const capacityState =
    !Number.isFinite(modelGB) || modelGB < 0
      ? 'invalid-model'
      : typeof limitGB !== 'number'
        ? 'missing-limit'
        : !Number.isFinite(limitGB) || limitGB < 0
          ? 'invalid-limit'
          : modelGB > limitGB
            ? 'exceeds'
            : 'within'
  const capacityTitle =
    capacityState === 'within'
      ? 'Within stated sample file-size limit'
      : capacityState === 'exceeds'
        ? 'Exceeds stated sample file-size limit'
        : capacityState === 'missing-limit'
          ? 'Limit not supplied — capacity not assessed'
          : capacityState === 'invalid-model'
            ? 'Invalid model file size — capacity not assessed'
            : 'Invalid profile limit — capacity not assessed'
  const capacityBasis =
    capacityState === 'within' || capacityState === 'exceeds'
      ? `${modelGB} GB model file ${capacityState === 'exceeds' ? '>' : '≤'} ${limitGB} GB stated profile limit.`
      : capacityState === 'missing-limit'
        ? `${modelGB} GB model file; the selected profile supplies no numeric capacity limit.`
        : 'A finite, non-negative model file size and profile limit are needed for this comparison.'
  const wrappingSelection = wrapProfile.quantumSafe
    ? `PQC primitive selected — category ${wrapProfile.nistLevel}`
    : 'Classical primitive selected — no PQC category'
  const signingSelection = signProfile.quantumSafe
    ? `PQC primitive selected — category ${signProfile.nistLevel}`
    : 'Classical primitive selected — no PQC category'
  const attestationAssumption = deployProfile.attestationAvailable
    ? 'Capability assumed available in this sample profile — not verified'
    : 'Capability not included in this sample profile — not verified'
  const inUseAssumption = deployProfile.encryptionInUse
    ? 'Assumed by this sample profile — not executed or verified'
    : 'Not assumed by this sample profile'

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Model Weight Vault</h3>
        <p className="text-sm text-muted-foreground">
          Compare sample model-weight protection profiles and their illustrative overhead. The
          file-size screen compares selected values with a fictional profile limit. The manifest
          records choices and assumptions. No encryption, signing, attestation or deployment
          operation is executed.
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
        <h4 className="text-sm font-bold text-foreground mb-3">Illustrative Overhead Comparison</h4>
        <div className="glass-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Metric</th>
                <th className="text-center p-3 text-status-error font-medium">Classical</th>
                <th className="text-center p-3 text-foreground font-medium">Selected example</th>
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
                <td className="p-3 text-foreground">Wrapping selection</td>
                <td className="text-center p-3 text-xs">Classical baseline</td>
                <td className="text-center p-3 text-xs">{wrappingSelection}</td>
                <td className="text-center p-3 text-xs">Selected scheme only; not executed</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Signing selection</td>
                <td className="text-center p-3 text-xs">Classical baseline</td>
                <td className="text-center p-3 text-xs">{signingSelection}</td>
                <td className="text-center p-3 text-xs">Selected scheme only; not executed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Deployment details */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-2">{deployProfile.name}</h4>
        <p className="text-xs text-muted-foreground mb-1">
          Selected fictional profile assumptions:
        </p>
        <p className="text-sm text-foreground/80">{deployProfile.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
          <div>
            <span className="text-muted-foreground">Key Storage: </span>
            <span className="text-foreground">{deployProfile.keyStorageLocation}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Attestation capability assumption: </span>
            <span className="text-foreground">{attestationAssumption}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Stated model-file limit: </span>
            <span className="text-foreground">
              {typeof limitGB === 'number' && Number.isFinite(limitGB) && limitGB >= 0
                ? `${limitGB} GB (sample assumption)`
                : limitGB === null
                  ? 'Not supplied'
                  : 'Invalid value'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">In-use encryption assumption: </span>
            <span className="text-foreground">{inUseAssumption}</span>
          </div>
        </div>
        <div
          role="status"
          aria-label="Sample file-size capacity"
          className="mt-4 rounded border border-border p-3 space-y-1"
        >
          <p
            className={`text-sm font-semibold ${capacityState === 'exceeds' ? 'text-status-warning' : 'text-foreground'}`}
          >
            {capacityTitle}
          </p>
          <p className="text-xs text-foreground/80">{capacityBasis}</p>
          <p className="text-xs text-muted-foreground">
            This compares only the selected model file size with a fictional profile limit. It does
            not establish runtime working-set memory, hardware compatibility or a deployable system.
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          No attestation report, certificate chain, measurement or freshness challenge is verified
          here. Check those capabilities with your deployment tools; availability alone is not
          evidence that the model is protected.
        </p>
        {selectedDeploy === 'federated' && (
          <p className="mt-3 text-xs text-muted-foreground">
            This fictional profile is not a general definition of federated learning. No aggregation
            or update-privacy protocol is selected or tested here; the in-use encryption assumption
            does not establish update confidentiality.
          </p>
        )}
        <div className="glass-panel p-3 mt-3 border-l-4 border-primary">
          <p className="text-xs text-foreground/70">
            <strong>Sample profile review topics (not checked):</strong>{' '}
            {deployProfile.pqcConsiderations}
          </p>
        </div>
      </div>

      {/* Sample Selection Manifest */}
      <div
        role="region"
        aria-label="Sample selection manifest"
        className="glass-panel p-4 border-primary/30"
      >
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Lock size={16} className="text-primary" />
          Sample Selection Manifest
        </h4>
        <div className="font-mono text-xs space-y-1 text-foreground/80">
          <p>
            Model: {sizeProfile.label} ({sizeProfile.typicalFileSizeGB} GB)
          </p>
          <p>Assumed encryption at rest: AES-256-GCM (not executed)</p>
          <p>
            Key Wrapping: {wrapProfile.algorithmLabel} — {wrappingSelection}
          </p>
          <p>
            Model Signing: {signProfile.algorithmLabel} — {signingSelection}
          </p>
          <p>Deployment profile: {deployProfile.name} (fictional assumptions)</p>
          <p>File-size screen: {capacityTitle}</p>
          <p>{capacityBasis}</p>
          <p>Attestation: {attestationAssumption}</p>
          <p>In-use encryption: {inUseAssumption}</p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Selecting PQC algorithms does not establish full model protection. Evaluate supported
          implementations, key handling, attestation, isolation and update privacy with your
          production tools for the deployment you plan.
        </p>
      </div>
    </div>
  )
}
