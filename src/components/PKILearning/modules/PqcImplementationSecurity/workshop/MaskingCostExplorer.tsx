// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { AlertTriangle, Cpu, Info, Layers, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FAULT_DEFENSE_PROFILES,
  MASKING_TARGET_PROFILES,
  type FaultDefense,
  type MaskingOrder,
  type TargetComponentId,
} from '../data/implSecurityData'

const MASKING_ORDER_META: Record<
  MaskingOrder,
  { label: string; shares: string; mitigated: string; caveat: string }
> = {
  unmasked: {
    label: 'Unmasked (Constant-Time Only)',
    shares: '1 share (no secret splitting)',
    mitigated: 'Remote/local timing & cache-line attacks only.',
    caveat:
      'Vulnerable to first-order Differential Power Analysis (DPA), Correlation Power Analysis (CPA), and EM side-channel attacks on physical devices.',
  },
  'first-order': {
    label: '1st-Order Masking (2 Shares)',
    shares: 'd + 1 = 2 shares',
    mitigated: 'First-order univariate DPA/CPA power & EM leakage (when shares are independent).',
    caveat:
      'Hardware glitches, register transitions (transitional leakage), or correlated share routing can still cause first-order leakage on real silicon without careful masking gadgets (e.g., DOM/HPC) and TVLA verification.',
  },
  'second-order': {
    label: '2nd-Order Masking (3 Shares)',
    shares: 'd + 1 = 3 shares',
    mitigated:
      '1st- and 2nd-order DPA/EM leakage (required for high-assurance smart cards / HSMs).',
    caveat:
      'Fresh randomness demand grows quadratically for non-linear gadgets (Keccak Chi, A2B/B2A); requires high-throughput approved DRBG and hardware acceleration to remain practical.',
  },
}

function getMaskingOrderMeta(order: MaskingOrder) {
  switch (order) {
    case 'unmasked':
      return MASKING_ORDER_META.unmasked
    case 'first-order':
      return MASKING_ORDER_META['first-order']
    case 'second-order':
      return MASKING_ORDER_META['second-order']
  }
}

function pickByOrder(values: Record<MaskingOrder, string>, order: MaskingOrder): string {
  switch (order) {
    case 'unmasked':
      return values.unmasked
    case 'first-order':
      return values['first-order']
    case 'second-order':
      return values['second-order']
  }
}

export const MaskingCostExplorer: React.FC = () => {
  const [maskingOrder, setMaskingOrder] = useState<MaskingOrder>('first-order')
  const [faultDefense, setFaultDefense] = useState<FaultDefense>('redundant-verify')
  const [selectedTarget, setSelectedTarget] = useState<TargetComponentId>('ml-kem-768')

  const orderMeta = getMaskingOrderMeta(maskingOrder)
  const faultMeta =
    FAULT_DEFENSE_PROFILES.find((f) => f.id === faultDefense) ?? FAULT_DEFENSE_PROFILES[0]
  const targetProfile =
    MASKING_TARGET_PROFILES.find((t) => t.id === selectedTarget) ?? MASKING_TARGET_PROFILES[0]

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-status-warning/40 bg-status-warning/10 p-3.5 text-xs text-foreground/85 flex items-start gap-2.5">
        <Info size={15} className="text-status-warning shrink-0 mt-0.5" />
        <span>
          <strong>Illustrative Educational Profiles — Not Vendor Benchmarks:</strong> Cycle, RAM,
          and randomness multipliers below reflect typical order-of-magnitude engineering trade-offs
          from published masked PQC literature to guide architecture budgeting. Actual figures vary
          widely by CPU/FPGA/ASIC hardware acceleration (e.g., masked Keccak or NTT coprocessors).
        </span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-4 space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            1. Masking Order (Passive Power / EM Defense)
          </span>
          <div role="group" aria-label="Masking order selector" className="flex flex-wrap gap-2">
            {(
              [
                { id: 'unmasked', label: 'Unmasked' },
                { id: 'first-order', label: '1st-Order (2 Shares)' },
                { id: 'second-order', label: '2nd-Order (3 Shares)' },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.id}
                variant={maskingOrder === opt.id ? 'gradient' : 'outline'}
                size="sm"
                aria-pressed={maskingOrder === opt.id}
                onClick={() => setMaskingOrder(opt.id)}
                className="text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-4 space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            2. Fault-Injection Countermeasure (Active Glitch / Laser)
          </span>
          <div
            role="group"
            aria-label="Fault countermeasure selector"
            className="flex flex-wrap gap-2"
          >
            {FAULT_DEFENSE_PROFILES.map((fd) => (
              <Button
                key={fd.id}
                variant={faultDefense === fd.id ? 'gradient' : 'outline'}
                size="sm"
                aria-pressed={faultDefense === fd.id}
                onClick={() => setFaultDefense(fd.id)}
                className="text-xs"
              >
                {fd.id === 'none'
                  ? 'None'
                  : fd.id === 'redundant-verify'
                    ? 'Redundant Verify'
                    : 'Shuffling + Redundancy'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Primitive Selector */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          3. Inspect Primitive / Layer Cost Profile
        </span>
        <div
          role="group"
          aria-label="Target PQC primitive selector"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5"
        >
          {MASKING_TARGET_PROFILES.map((profile) => (
            <Button
              key={profile.id}
              variant={selectedTarget === profile.id ? 'gradient' : 'outline'}
              aria-pressed={selectedTarget === profile.id}
              onClick={() => setSelectedTarget(profile.id)}
              className="h-auto py-2.5 px-3 text-left flex-col items-start gap-0.5 whitespace-normal"
            >
              <span className="text-xs font-bold">{profile.label}</span>
              <span className="text-[11px] opacity-80">{profile.standard}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Profile Summary */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-primary shrink-0" />
            <h3 className="text-base font-bold text-foreground">
              {targetProfile.label} — {orderMeta.label}
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-primary/10 text-primary">
            {orderMeta.shares}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Illustrative Cycle Cost
            </span>
            <p className="text-base font-bold text-foreground">
              {pickByOrder(targetProfile.cycleMultiplier, maskingOrder)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Fault defense add-on: {faultMeta.cycleOverhead}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Illustrative RAM / Stack
            </span>
            <p className="text-base font-bold text-foreground">
              {pickByOrder(targetProfile.ramMultiplier, maskingOrder)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Scales with share storage &amp; masked state buffers
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Fresh Randomness (DRBG)
            </span>
            <p className="text-xs font-semibold text-foreground leading-snug pt-0.5">
              {pickByOrder(targetProfile.prngDemand, maskingOrder)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3.5 text-xs space-y-1.5">
          <p className="text-foreground">
            <strong>Primary Bottleneck: </strong>
            <span className="text-muted-foreground">{targetProfile.bottleneck}</span>
          </p>
          <p className="text-muted-foreground leading-relaxed">{targetProfile.nonLinearCostNote}</p>
        </div>

        {/* Security Coverage vs. Residual Risk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1.5">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              <Layers size={14} className="text-primary shrink-0" />
              Masking Protection &amp; Physical Caveat
            </h4>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Mitigates:</strong> {orderMeta.mitigated}
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Caveat:</strong> {orderMeta.caveat}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1.5">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              {faultDefense === 'none' ? (
                <ShieldAlert size={14} className="text-status-error shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-status-warning shrink-0" />
              )}
              Fault-Injection Posture ({faultMeta.label})
            </h4>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Protects against:</strong>{' '}
              {faultMeta.protectsAgainst}
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Residual risk:</strong> {faultMeta.residualRisk}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
