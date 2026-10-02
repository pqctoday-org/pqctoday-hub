// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { FileSignature, AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { CompleteStepAction } from '../../../common/CompleteStepAction'
import {
  SIGNING_SCHEMES,
  DEFAULT_SIGNING_PLAN,
  planSigning,
  type SchemeId,
  type SigningPlanInputs,
  type SigningUse,
} from '../data/signingLabData'

interface FirmwareSigningLabProps {
  onComplete: () => void
  initial?: Partial<SigningPlanInputs>
}

/** ML-DSA is the only scheme in this lab with executable crypto, and it is
 *  checked against NIST ACVP sigVer vectors. LMS / XMSS rows are size models. */
export const OT_SIGNING_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'ot-fw-mldsa87-sigver',
    useCase: 'Firmware / project signature verification (ML-DSA-87)',
    standard: 'NIST ACVP ML-DSA sigVer (FIPS 204)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    libraryRefId: 'FIPS 204',
    kind: { type: 'mldsa-sigver', variant: 87 },
  },
  {
    id: 'ot-fw-mldsa65-sigver',
    useCase: 'Firmware / project signature verification (ML-DSA-65)',
    standard: 'NIST ACVP ML-DSA sigVer (FIPS 204)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    libraryRefId: 'FIPS 204',
    kind: { type: 'mldsa-sigver', variant: 65 },
  },
  {
    id: 'ot-fw-hss-tc1',
    useCase: 'HSS/LMS firmware verifier, RFC 8554 Test Case 1',
    standard: 'IETF RFC 8554 Appendix F',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc8554#appendix-F',
    libraryRefId: 'RFC 8554',
    kind: { type: 'lms-sigver', testCase: 1 },
  },
]

const USE_OPTIONS: { id: SigningUse; label: string }[] = [
  { id: 'firmware', label: 'Vendor firmware releases (few, central)' },
  { id: 'project', label: 'PLC project / logic downloads (many, at workstations)' },
]

function fmtYears(y: number): string {
  if (!Number.isFinite(y)) return 'never (stateless)'
  return y >= 1000 ? `${Math.round(y).toLocaleString()} years` : `${y} years`
}

export const FirmwareSigningLab: React.FC<FirmwareSigningLabProps> = ({ onComplete, initial }) => {
  const [inputs, setInputs] = useState<SigningPlanInputs>({ ...DEFAULT_SIGNING_PLAN, ...initial })
  const result = useMemo(() => planSigning(inputs), [inputs])
  const set = <K extends keyof SigningPlanInputs>(k: K, v: SigningPlanInputs[K]) =>
    setInputs((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        A PLC or IED trusts whatever its bootloader&rsquo;s public key verifies. Pick a PQC
        signature scheme for firmware or for engineering-workstation project signing and see what it
        costs in bytes and — for the stateful hash-based schemes — how long one key lasts and what
        managing its state means in an OT setting.
      </p>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileSignature size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Signing plan</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs text-muted-foreground mb-1">Scheme</span>
            <FilterDropdown
              noContainer
              selectedId={inputs.scheme}
              onSelect={(id) => set('scheme', id as SchemeId)}
              items={SIGNING_SCHEMES.map((s) => ({ id: s.id, label: s.label }))}
            />
          </div>
          <div>
            <span className="block text-xs text-muted-foreground mb-1">What is being signed</span>
            <FilterDropdown
              noContainer
              selectedId={inputs.use}
              onSelect={(id) => set('use', id as SigningUse)}
              items={USE_OPTIONS}
            />
          </div>
          <label className="block">
            <span className="text-xs text-muted-foreground block mb-1">
              Signatures per year: {inputs.signaturesPerYear.toLocaleString()}
            </span>
            <input
              type="range"
              min={10}
              max={20000}
              step={10}
              value={inputs.signaturesPerYear}
              onChange={(e) => set('signaturesPerYear', Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground block mb-1">
              HSMs sharing the key&rsquo;s state: {inputs.statePartitions}
            </span>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={inputs.statePartitions}
              onChange={(e) => set('statePartitions', Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-muted-foreground block mb-1">
              Years the key must keep signing: {inputs.serviceYears}
            </span>
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={inputs.serviceYears}
              onChange={(e) => set('serviceYears', Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
        </div>
      </div>

      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-foreground">{result.scheme.label}</h3>
          <span
            className={`text-[10px] rounded px-1.5 py-0.5 border ${
              result.scheme.validation !== 'simulated'
                ? 'bg-status-success/10 text-status-success border-status-success/30'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            {result.scheme.validation === 'acvp-kat'
              ? 'Verified by NIST ACVP KAT below'
              : result.scheme.validation === 'rfc8554-kat'
                ? 'Verifier checked by the RFC 8554 KAT below; sizes per RFC 8554'
                : result.scheme.family === 'XMSS'
                  ? 'Simulated — sizes per RFC 8391, no signature computed'
                  : 'Simulated — sizes per RFC 8554, no signature computed'}
          </span>
          {result.scheme.cnsa2 !== 'not-cnsa' && (
            <span className="text-[10px] rounded px-1.5 py-0.5 bg-primary/10 text-primary">
              {result.scheme.cnsa2 === 'firmware-signing'
                ? 'CNSA 2.0 software/firmware signing (SP 800-208)'
                : 'CNSA 2.0 signature parameter set'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{result.scheme.note}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Signature</p>
            <p className="text-lg font-mono font-bold">
              {result.scheme.signatureBytes.toLocaleString()} B
            </p>
            <p className="text-[10px] text-muted-foreground">
              +{result.extraBytesVsEcdsa.toLocaleString()} B vs ECDSA P-256
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Public key in bootloader</p>
            <p className="text-lg font-mono font-bold">
              {result.scheme.publicKeyBytes.toLocaleString()} B
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Signatures per HSM</p>
            <p className="text-lg font-mono font-bold">
              {Number.isFinite(result.perPartitionCapacity)
                ? result.perPartitionCapacity.toLocaleString()
                : 'unlimited'}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Key lasts</p>
            <p
              className={`text-lg font-mono font-bold ${
                result.coversServiceLife ? 'text-status-success' : 'text-status-error'
              }`}
            >
              {fmtYears(result.yearsToExhaustion)}
            </p>
          </div>
        </div>
        {result.warnings.length > 0 ? (
          <ul className="space-y-1.5">
            {result.warnings.map((w) => (
              <li key={w} className="text-xs flex items-start gap-2 text-foreground/80">
                <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
                {w}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs flex items-start gap-2 text-foreground/80">
            <CheckCircle2 size={14} className="text-status-success shrink-0 mt-0.5" />
            This plan covers the service life with no state-management caveats.
          </p>
        )}
      </div>

      <div className="glass-panel p-4">
        <h3 className="text-sm font-bold text-foreground mb-2">All schemes at a glance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-2 font-medium">Scheme</th>
                <th className="text-right p-2 font-medium">Signature (B)</th>
                <th className="text-right p-2 font-medium">Public key (B)</th>
                <th className="text-right p-2 font-medium">Signatures per key</th>
                <th className="text-left p-2 font-medium">Stateful</th>
              </tr>
            </thead>
            <tbody>
              {SIGNING_SCHEMES.map((s) => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="p-2 text-foreground">{s.label}</td>
                  <td className="p-2 text-right font-mono">{s.signatureBytes.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">{s.publicKeyBytes.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">
                    {Number.isFinite(s.capacity) ? `2^${Math.log2(s.capacity)}` : '—'}
                  </td>
                  <td className="p-2">{s.stateful ? 'yes' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          LMS/HSS sizes computed from RFC 8554 (n = 32, W8); ML-DSA from FIPS 204; XMSS from RFC
          8391.
        </p>
      </div>

      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center gap-2">
          <FlaskConical size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            What runs, and what is only modelled
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          The ML-DSA verifier is exercised below against NIST ACVP sigVer vectors in the in-browser
          SoftHSM. No LMS or XMSS signature is computed in this lab — those rows are size and
          capacity models built from the RFC formulas.
        </p>
      </div>
      <KatValidationPanel
        specs={OT_SIGNING_KAT_SPECS}
        label="Firmware signing Known Answer Tests"
        authorityNote="FIPS 204 ML-DSA sigVer vectors · RFC 8554 Appendix F HSS/LMS test cases"
      />

      <div className="flex justify-end pt-2">
        <CompleteStepAction recordsArtifact={false} onClick={onComplete} />
      </div>
    </div>
  )
}
