// SPDX-License-Identifier: GPL-3.0-only
/**
 * Infrastructure Modernization Planner — Phase 6 (Infrastructure Modernization &
 * Performance) Command Center deliverable.
 *
 * The single P6 artifact that consolidates the framework's Phase 6 activities
 * (6.1–6.5): the PKI modernization plan (cert-lifetime targets, dual-stack CA,
 * Merkle Tree Certificate tracking), the HSM/KMS upgrade schedule (inventory,
 * firmware, hardware refresh, cloud KMS), the network compatibility report
 * (PQC-handshake protocol testing and middlebox readiness), and the capacity
 * plan (CPU, bandwidth, and certificate-storage impact).
 *
 * Emits a downloadable markdown artifact and saves it to the Command Center,
 * mirroring the other phase tools.
 */
import React, { useMemo, useState } from 'react'
import { Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'

export interface InfraModernizationState {
  // PKI modernization
  rootCaYears: string
  intermediateCaYears: string
  endEntityDays: string
  dualStackCa: boolean
  trackingMtc: boolean
  // HSM / KMS
  hsmInventory: string
  firmwareUpgradeScheduled: boolean
  hardwareReplacementPlanned: boolean
  cloudKmsConfigured: boolean
  // Network & middleboxes
  protocols: Record<ProtocolId, boolean>
  // Capacity plan
  cpuImpactPct: string
  bandwidthImpact: string
  certStorageMultiplier: string
}

/** Protocols exercised with PQC handshakes during Phase 6 compatibility testing. */
export const PROTOCOL_OPTIONS = [
  'TLS 1.3',
  'IKEv2/IPsec',
  'QUIC',
  'All production middleboxes',
] as const
export type ProtocolId = (typeof PROTOCOL_OPTIONS)[number]

const yesNo = (on: boolean): string => (on ? 'Yes' : 'No')

/** Highest number mentioned in a string ("5-15" → 15, "3x" → 3, "banana" → null). */
export function parseUpperNumber(s: string): number | null {
  const nums = (s.match(/\d+(\.\d+)?/g) ?? []).map(Number).filter(Number.isFinite)
  return nums.length ? Math.max(...nums) : null
}

/**
 * Derive capacity-readiness flags from the parsed inputs — the tool's "capacity
 * plan" should analyse the numbers, not just echo them. Thresholds: CPU impact
 * ≥ 20% needs headroom verification; a cert-storage multiplier ≥ 2 needs
 * provisioning ahead of cutover.
 */
export function capacityFlags(cpuImpactPct: string, certStorageMultiplier: string): string[] {
  const out: string[] = []
  const cpu = parseUpperNumber(cpuImpactPct)
  if (cpu !== null && cpu >= 20) {
    out.push(
      `High CPU impact (up to ${cpu}%) - verify compute headroom or plan to scale out before PQC cutover.`
    )
  }
  const mult = parseUpperNumber(certStorageMultiplier)
  if (mult !== null && mult >= 2) {
    out.push(
      `Certificate stores grow ~${mult}x - provision additional cert-store capacity before cutover.`
    )
  }
  return out
}

export function buildMarkdown(s: InfraModernizationState): string {
  const lines: string[] = []
  lines.push('# Infrastructure Modernization Plan')
  lines.push('')
  lines.push(
    '*Phase 6 — Infrastructure Modernization & Performance. Consolidates activities 6.1–6.5: ' +
      'PKI modernization, HSM/KMS upgrade schedule, network compatibility, and capacity planning.*'
  )
  lines.push('')

  lines.push('## PKI Modernization')
  lines.push('')
  lines.push('| Certificate tier | Lifetime target |')
  lines.push('|---|---|')
  lines.push(`| Root CA | ${s.rootCaYears.trim() || '_(TBD)_'} years |`)
  lines.push(`| Intermediate CA | ${s.intermediateCaYears.trim() || '_(TBD)_'} years |`)
  lines.push(`| End-entity | ${s.endEntityDays.trim() || '_(TBD)_'} days |`)
  lines.push('')
  lines.push(`- **Dual-stack CA deployed:** ${yesNo(s.dualStackCa)}`)
  lines.push(`- **Tracking Merkle Tree Certificates (MTC) for web PKI:** ${yesNo(s.trackingMtc)}`)
  lines.push('')

  lines.push('## HSM & KMS Upgrade Schedule')
  lines.push('')
  lines.push(
    `- **HSMs inventoried (model/firmware/PQC status):** ${s.hsmInventory.trim() || '_(not yet inventoried)_'}`
  )
  lines.push(`- **Firmware upgrade scheduled:** ${yesNo(s.firmwareUpgradeScheduled)}`)
  lines.push(`- **Hardware replacement planned (2–4 yr):** ${yesNo(s.hardwareReplacementPlanned)}`)
  lines.push(`- **Cloud KMS configured for PQC:** ${yesNo(s.cloudKmsConfigured)}`)
  lines.push('')

  lines.push('## Network Compatibility')
  lines.push('')
  const tested = PROTOCOL_OPTIONS.filter((id) => s.protocols[id])
  if (tested.length === 0) {
    lines.push('_No protocols tested with PQC handshakes yet._')
  } else {
    lines.push('Protocols verified with PQC handshakes:')
    lines.push('')
    for (const id of tested) {
      lines.push(`- ${id}`)
    }
  }
  lines.push('')

  lines.push('## Capacity Plan')
  lines.push('')
  lines.push(`- **Estimated CPU impact:** ${s.cpuImpactPct.trim() || '_(TBD)_'} %`)
  lines.push(`- **Bandwidth impact:** ${s.bandwidthImpact.trim() || '_(TBD)_'}`)
  lines.push(
    `- **Certificate-storage multiplier:** ${s.certStorageMultiplier.trim() || '_(TBD)_'}×`
  )
  const flags = capacityFlags(s.cpuImpactPct, s.certStorageMultiplier)
  if (flags.length > 0) {
    lines.push('')
    lines.push('**Capacity readiness flags:**')
    for (const f of flags) lines.push(`- ⚠ ${f}`)
  }
  lines.push('')

  lines.push('---')
  lines.push('')
  lines.push(
    '*Aligned to the Applied Quantum Phase 6 — Infrastructure Modernization & Performance ' +
      '(activities 6.1–6.5).*'
  )
  lines.push(
    '*PKI modernization grounded in NIST CSWP 39 §4.2 (Key Store and Certificate Management); ' +
      'network/protocol compatibility grounded in NIST CSWP 39 §3.2.1 (Algorithm Transitions in ' +
      'Deployed Protocols). https://doi.org/10.6028/NIST.CSWP.39-upd1*'
  )
  return lines.join('\n')
}

export const InfraModernizationPlanner: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const savedInputs = useSavedArtifactInputs<InfraModernizationState>('infra-modernization-plan')
  // Restore the user's last-saved plan so it round-trips across visits.
  const [state, setState] = useState<InfraModernizationState>(() => {
    const base: InfraModernizationState = {
      rootCaYears: '10',
      intermediateCaYears: '5',
      endEntityDays: '90',
      dualStackCa: false,
      trackingMtc: false,
      hsmInventory: '',
      firmwareUpgradeScheduled: false,
      hardwareReplacementPlanned: false,
      cloudKmsConfigured: false,
      protocols: {
        'TLS 1.3': true,
        'IKEv2/IPsec': false,
        QUIC: false,
        'All production middleboxes': false,
      },
      cpuImpactPct: '',
      bandwidthImpact: '',
      certStorageMultiplier: '',
    }
    if (savedInputs) {
      return { ...base, ...savedInputs, protocols: { ...base.protocols, ...savedInputs.protocols } }
    }
    return base
  })

  const set = <K extends keyof InfraModernizationState>(
    key: K,
    value: InfraModernizationState[K]
  ) => setState((prev) => ({ ...prev, [key]: value }))

  const toggleProtocol = (id: ProtocolId) =>
    setState((prev) => ({
      ...prev,
      protocols: { ...prev.protocols, [id]: !prev.protocols[id] },
    }))

  const exportMarkdown = useMemo(() => buildMarkdown(state), [state])

  const capacityNotes = useMemo(
    () => capacityFlags(state.cpuImpactPct, state.certStorageMultiplier),
    [state.cpuImpactPct, state.certStorageMultiplier]
  )

  const protocolCount = PROTOCOL_OPTIONS.filter((id) => state.protocols[id]).length

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <Server size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Infrastructure Modernization Planner
          </h2>
          <p className="text-sm text-muted-foreground">
            Phase 6 — Infrastructure Modernization &amp; Performance. Consolidate the PKI
            modernization plan, HSM/KMS upgrade schedule, network compatibility report, and capacity
            plan into one deliverable (activities 6.1–6.5).
          </p>
        </div>
      </header>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">PKI Modernization</h3>
        <p className="text-[11px] text-muted-foreground rounded-md border border-border bg-muted/30 p-2">
          <span className="font-semibold text-foreground">Why these defaults:</span> the
          framework&apos;s PKI modernization guidance (activity 6.1) recommends shortening root CA
          lifetimes from 20+ years to 10 years, intermediate CAs to 5 years, and end-entity
          certificates to 90–365 days — this limits Trust-Now-Forge-Later exposure on long-lived
          signing keys and builds the certificate-rotation discipline needed before dual-stack/PQC
          certificates arrive (NIST CSWP 39 §4.2 — Key Store and Certificate Management).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="block">
            <label
              htmlFor="infra-root-ca-years"
              className="text-xs font-medium text-muted-foreground"
            >
              Root CA lifetime (years)
            </label>
            <Input
              id="infra-root-ca-years"
              className="mt-1"
              value={state.rootCaYears}
              onChange={(e) => set('rootCaYears', e.target.value)}
              placeholder="e.g. 10"
            />
          </div>
          <div className="block">
            <label
              htmlFor="infra-intermediate-ca-years"
              className="text-xs font-medium text-muted-foreground"
            >
              Intermediate CA lifetime (years)
            </label>
            <Input
              id="infra-intermediate-ca-years"
              className="mt-1"
              value={state.intermediateCaYears}
              onChange={(e) => set('intermediateCaYears', e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
          <div className="block">
            <label
              htmlFor="infra-end-entity-days"
              className="text-xs font-medium text-muted-foreground"
            >
              End-entity lifetime (days)
            </label>
            <Input
              id="infra-end-entity-days"
              className="mt-1"
              value={state.endEntityDays}
              onChange={(e) => set('endEntityDays', e.target.value)}
              placeholder="e.g. 90"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => set('dualStackCa', !state.dualStackCa)}
            aria-pressed={state.dualStackCa}
            className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
              state.dualStackCa
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Dual-stack CA deployed
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => set('trackingMtc', !state.trackingMtc)}
            aria-pressed={state.trackingMtc}
            className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
              state.trackingMtc
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Tracking Merkle Tree Certificates (MTC) for web PKI
          </Button>
        </div>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">HSM &amp; KMS Upgrade Schedule</h3>
        <div className="block">
          <label
            htmlFor="infra-hsm-inventory"
            className="text-xs font-medium text-muted-foreground"
          >
            HSMs inventoried (model/firmware/PQC status)
          </label>
          <Input
            id="infra-hsm-inventory"
            className="mt-1"
            value={state.hsmInventory}
            onChange={(e) => set('hsmInventory', e.target.value)}
            placeholder="e.g. 4× Luna 7 (fw 7.7, PQC-capable), 2× nCipher (fw 12.6, no PQC)"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Framework vendor notes (activity 6.2): Thales Luna 7.8.0+ introduced initial PQC support
            (ML-KEM, ML-DSA); Luna 7.9 (June 2025) adds further capabilities. Utimaco Quantum
            Protect is a new hardware variant — not a firmware upgrade for existing devices, so
            budget for hardware replacement if running older Utimaco models.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => set('firmwareUpgradeScheduled', !state.firmwareUpgradeScheduled)}
            aria-pressed={state.firmwareUpgradeScheduled}
            className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
              state.firmwareUpgradeScheduled
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Firmware upgrade scheduled
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => set('hardwareReplacementPlanned', !state.hardwareReplacementPlanned)}
            aria-pressed={state.hardwareReplacementPlanned}
            className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
              state.hardwareReplacementPlanned
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Hardware replacement planned (2–4 yr)
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => set('cloudKmsConfigured', !state.cloudKmsConfigured)}
            aria-pressed={state.cloudKmsConfigured}
            className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
              state.cloudKmsConfigured
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Cloud KMS configured for PQC
          </Button>
        </div>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Network &amp; Middleboxes · {protocolCount} protocol{protocolCount === 1 ? '' : 's'}{' '}
          tested
        </h3>
        <p className="text-xs text-muted-foreground">
          Mark each protocol verified to complete a PQC handshake through your production network
          and middleboxes. Grounded in NIST CSWP 39 §3.2.1 (Algorithm Transitions in Deployed
          Protocols).
        </p>
        <div className="flex flex-wrap gap-2">
          {PROTOCOL_OPTIONS.map((id) => {
            const on = state.protocols[id]
            return (
              <Button
                key={id}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleProtocol(id)}
                aria-pressed={on}
                className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
                  on
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {id}
              </Button>
            )
          })}
        </div>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Capacity Plan</h3>
        <p className="text-[11px] text-muted-foreground rounded-md border border-border bg-muted/30 p-2">
          <span className="font-semibold text-foreground">Why these thresholds:</span> the
          framework&apos;s capacity guidance (activity 6.5) expects roughly a 5–15% CPU increase for
          signature-heavy workloads and a 2–5× certificate-storage increase at scale. The readiness
          flags below trigger at ≥20% CPU impact — above that typical range, so headroom needs
          explicit verification — and at ≥2× storage growth — the low end of the expected range, so
          provisioning should already be underway.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="block">
            <label htmlFor="infra-cpu-impact" className="text-xs font-medium text-muted-foreground">
              Estimated CPU impact (%)
            </label>
            <Input
              id="infra-cpu-impact"
              className="mt-1"
              value={state.cpuImpactPct}
              onChange={(e) => set('cpuImpactPct', e.target.value)}
              placeholder="e.g. 5–15"
            />
          </div>
          <div className="block">
            <label
              htmlFor="infra-bandwidth-impact"
              className="text-xs font-medium text-muted-foreground"
            >
              Bandwidth impact
            </label>
            <Input
              id="infra-bandwidth-impact"
              className="mt-1"
              value={state.bandwidthImpact}
              onChange={(e) => set('bandwidthImpact', e.target.value)}
              placeholder="e.g. +1–2 KB per handshake"
            />
          </div>
          <div className="block">
            <label
              htmlFor="infra-cert-storage"
              className="text-xs font-medium text-muted-foreground"
            >
              Cert-storage multiplier (×)
            </label>
            <Input
              id="infra-cert-storage"
              className="mt-1"
              inputMode="numeric"
              value={state.certStorageMultiplier}
              onChange={(e) => set('certStorageMultiplier', e.target.value)}
              placeholder="e.g. 3"
            />
          </div>
        </div>
        {capacityNotes.length > 0 && (
          <div className="rounded-md border border-status-warning/30 bg-status-warning/5 p-2 space-y-1">
            <p className="text-xs font-semibold text-status-warning">Capacity readiness</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {capacityNotes.map((f) => (
                <li key={f} className="text-[11px] text-muted-foreground">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <ExportableArtifact
        title="Infrastructure Modernization Plan — Export"
        exportData={exportMarkdown}
        filename="infra-modernization-plan"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() => {
          addExecutiveDocument({
            id: `infra-modernization-plan-${Date.now()}`,
            moduleId: 'network-security-pqc',
            type: 'infra-modernization-plan',
            title: `Infrastructure Modernization Plan — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: state,
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Save this plan to your Command Center, or export as markdown / PDF / Word. This is the
          single Phase-6 deliverable consolidating PKI modernization, the HSM/KMS upgrade schedule,
          network compatibility, and the capacity plan.
        </p>
      </ExportableArtifact>
    </div>
  )
}

export default InfraModernizationPlanner
