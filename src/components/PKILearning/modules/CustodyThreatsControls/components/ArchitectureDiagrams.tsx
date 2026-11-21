// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Shield, Cpu, MonitorCheck, Lock, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MPC_HSM_VARIANTS, CONTROL_COMBINATIONS } from '../data/custodyThreatsData'

/**
 * Accessible SVG diagram showing the core §5 control-combination boundary:
 * Untrusted Requester/UI -> Protected Signing Boundary (Parser + Policy + Quorum Check + Key) -> Chain.
 */
export const ControlBoundaryDiagram: React.FC = () => {
  const [selectedId, setSelectedId] = useState(CONTROL_COMBINATIONS[0].id)
  const selected = CONTROL_COMBINATIONS.find((c) => c.id === selectedId) ?? CONTROL_COMBINATIONS[0]

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield size={16} className="text-primary" aria-hidden="true" />
          Interactive Boundary Map: Where Parsing, Policy &amp; Signing Sit
        </h3>
        <span className="text-xs text-muted-foreground">
          Select a combination to inspect G1 assumptions
        </span>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Control combinations">
        {CONTROL_COMBINATIONS.map((combo) => (
          <Button
            key={combo.id}
            variant={combo.id === selected.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedId(combo.id)}
            className="text-xs h-auto py-1.5 px-2.5 whitespace-normal text-left"
          >
            {combo.name.split(':')[0]}
          </Button>
        ))}
      </div>

      <svg
        viewBox="0 0 720 170"
        className="w-full h-auto rounded-lg bg-muted/30 border border-border"
        role="img"
        aria-label={`Architecture diagram for ${selected.name}: untrusted requester and browser UI sit outside the protected signing boundary containing transaction parsing, policy evaluation, quorum verification, and key material.`}
      >
        {/* Outside zone */}
        <rect
          x="14"
          y="22"
          width="176"
          height="126"
          rx="10"
          className="fill-muted/50 stroke-border"
          strokeDasharray="4 4"
        />
        <text
          x="102"
          y="44"
          textAnchor="middle"
          className="fill-muted-foreground text-[11px] font-semibold"
        >
          UNTRUSTED ZONE
        </text>
        <rect x="28" y="58" width="148" height="34" rx="6" className="fill-card stroke-border" />
        <text x="102" y="79" textAnchor="middle" className="fill-foreground text-[11px]">
          Requester / AI / API
        </text>
        <rect x="28" y="102" width="148" height="34" rx="6" className="fill-card stroke-border" />
        <text x="102" y="123" textAnchor="middle" className="fill-foreground text-[11px]">
          Browser UI / Frontend
        </text>

        {/* Arrow in */}
        <line x1="190" y1="85" x2="226" y2="85" className="stroke-primary" strokeWidth="2" />
        <polygon points="226,80 236,85 226,90" className="fill-primary" />

        {/* Protected Boundary */}
        <rect
          x="238"
          y="16"
          width="334"
          height="138"
          rx="12"
          className="fill-primary/10 stroke-primary"
          strokeWidth="1.5"
        />
        <text x="405" y="36" textAnchor="middle" className="fill-primary text-[11px] font-bold">
          PROTECTED BOUNDARY (HSM / TEE / ATTESTED DEVICE)
        </text>

        <rect x="252" y="48" width="96" height="44" rx="6" className="fill-card stroke-border" />
        <text
          x="300"
          y="67"
          textAnchor="middle"
          className="fill-foreground text-[10px] font-semibold"
        >
          1. Clear Parser
        </text>
        <text x="300" y="82" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          Decodes payload
        </text>

        <rect x="357" y="48" width="96" height="44" rx="6" className="fill-card stroke-border" />
        <text
          x="405"
          y="67"
          textAnchor="middle"
          className="fill-foreground text-[10px] font-semibold"
        >
          2. Policy Gate
        </text>
        <text x="405" y="82" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          Caps / Allowlist
        </text>

        <rect x="462" y="48" width="96" height="44" rx="6" className="fill-card stroke-border" />
        <text
          x="510"
          y="67"
          textAnchor="middle"
          className="fill-foreground text-[10px] font-semibold"
        >
          3. Quorum Check
        </text>
        <text x="510" y="82" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          t-of-n + TTL + Nonce
        </text>

        <rect x="292" y="102" width="226" height="40" rx="6" className="fill-card stroke-primary" />
        <text
          x="405"
          y="121"
          textAnchor="middle"
          className="fill-foreground text-[11px] font-semibold"
        >
          4. Non-Exportable Key / MPC Share
        </text>
        <text x="405" y="135" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          Signs only if gates 1–3 pass
        </text>

        {/* Arrow out */}
        <line x1="572" y1="85" x2="606" y2="85" className="stroke-primary" strokeWidth="2" />
        <polygon points="606,80 616,85 606,90" className="fill-primary" />

        {/* On-chain */}
        <rect x="618" y="44" width="88" height="82" rx="10" className="fill-card stroke-border" />
        <text
          x="662"
          y="78"
          textAnchor="middle"
          className="fill-foreground text-[11px] font-semibold"
        >
          Blockchain
        </text>
        <text x="662" y="94" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          On-chain guard /
        </text>
        <text x="662" y="106" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          Timelock
        </text>
      </svg>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-muted/40 border border-border">
          <p className="font-semibold text-foreground mb-1">Mitigates</p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {selected.mitigates.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 border border-border">
          <p className="font-semibold text-foreground mb-1">Authority Assumptions (Rule G1)</p>
          <p className="text-muted-foreground">{selected.g1Assumptions}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 border border-border">
          <p className="font-semibold text-foreground mb-1">Residual Risk</p>
          <p className="text-muted-foreground">{selected.residualRisk}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Accessible schematic cards + SVG boundary comparison for §5b Hybrid MPC + HSM variants (a)-(e).
 */
export const MpcHsmVariantDiagram: React.FC = () => {
  const [activeVariant, setActiveVariant] = useState<'a' | 'b' | 'c' | 'd' | 'e'>('a')
  const v = MPC_HSM_VARIANTS.find((x) => x.id === activeVariant) ?? MPC_HSM_VARIANTS[0]

  const iconMap: Record<'a' | 'b' | 'c' | 'd' | 'e', React.ReactNode> = {
    a: <Cpu size={15} aria-hidden="true" />,
    b: <Lock size={15} aria-hidden="true" />,
    c: <MonitorCheck size={15} aria-hidden="true" />,
    d: <Shield size={15} aria-hidden="true" />,
    e: <Layers size={15} aria-hidden="true" />,
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          §5b Variant Inspector: Where the Share Executes &amp; What Attacker Access Yields
        </h3>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="MPC plus HSM variants">
        {MPC_HSM_VARIANTS.map((item) => (
          <Button
            key={item.id}
            variant={item.id === activeVariant ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveVariant(item.id)}
            className="text-xs flex items-center gap-1.5"
          >
            {iconMap[item.id]}
            <span>
              ({item.id}) {item.title.split('(')[0].trim()}
            </span>
          </Button>
        ))}
      </div>

      <svg
        viewBox="0 0 720 130"
        className="w-full h-auto rounded-lg bg-muted/30 border border-border"
        role="img"
        aria-label={`Diagram for Variant (${v.id}) ${v.title}: ${v.whereShareUsed}`}
      >
        <rect x="16" y="18" width="215" height="94" rx="8" className="fill-card stroke-border" />
        <text x="123" y="40" textAnchor="middle" className="fill-primary text-[11px] font-bold">
          WHO HOLDS WHAT
        </text>
        <text x="123" y="62" textAnchor="middle" className="fill-foreground text-[10px]">
          {v.id === 'a'
            ? 'HSM: wrapping key | Host: unwrapped s_i'
            : v.id === 'b'
              ? 'HSM Firmware Ext: s_i + policy'
              : v.id === 'c'
                ? 'Custodian HSM + TEE + Client HW'
                : v.id === 'd'
                  ? 'HSMs: DKG + wrapped share backups'
                  : 'On-chain Safe.sol + MPC + HSM'}
        </text>
        <text x="123" y="84" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          {v.id === 'a'
            ? 'Protects disk backups only'
            : v.id === 'b'
              ? 'Vendor-specific (not PKCS#11 std)'
              : v.id === 'c'
                ? 'Distinct operators & tech stacks'
                : v.id === 'd'
                  ? 'Recovery requires HSM quorum'
                  : 'On-chain + off-chain must agree'}
        </text>

        <line x1="231" y1="65" x2="255" y2="65" className="stroke-primary" strokeWidth="2" />
        <polygon points="255,60 264,65 255,70" className="fill-primary" />

        <rect
          x="266"
          y="18"
          width="210"
          height="94"
          rx="8"
          className={
            v.id === 'a'
              ? 'fill-status-warning/10 stroke-status-warning'
              : 'fill-primary/10 stroke-primary'
          }
        />
        <text x="371" y="40" textAnchor="middle" className="fill-foreground text-[11px] font-bold">
          SHARE EXECUTION BOUNDARY
        </text>
        <text x="371" y="64" textAnchor="middle" className="fill-foreground text-[10px]">
          {v.id === 'a'
            ? 'Host OS RAM (exposed to root)'
            : v.id === 'b'
              ? 'Inside HSM physical enclosure'
              : v.id === 'c'
                ? 'Per-domain HSM / TEE / HW'
                : v.id === 'd'
                  ? 'Active HSMs; recovery offline'
                  : 'Off-chain MPC/HSM + EVM Contract'}
        </text>
        <text x="371" y="86" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          {v.id === 'a' ? 'Weakest MPC+HSM variant' : 'Check per-party policy & FIPS scope'}
        </text>

        <line x1="476" y1="65" x2="500" y2="65" className="stroke-primary" strokeWidth="2" />
        <polygon points="500,60 509,65 500,70" className="fill-primary" />

        <rect x="511" y="18" width="193" height="94" rx="8" className="fill-card stroke-border" />
        <text x="607" y="40" textAnchor="middle" className="fill-primary text-[11px] font-bold">
          POLICY CHECK LOCATION
        </text>
        <text x="607" y="64" textAnchor="middle" className="fill-foreground text-[10px]">
          {v.id === 'a'
            ? 'Often host-side (must move inside)'
            : v.id === 'b'
              ? 'Inside HSM extension code'
              : v.id === 'c'
                ? 'Inside EACH party boundary'
                : v.id === 'd'
                  ? 'HSM quorum for recovery'
                  : 'Both off-chain & Safe.sol'}
        </text>
        <text x="607" y="86" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          Never trust a shared orchestrator alone
        </text>
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
          <p className="font-semibold text-foreground">Compromised MPC Node / Host Root Gets</p>
          <p className="text-muted-foreground">{v.compromisedNodeGets}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
          <p className="font-semibold text-foreground">
            Stolen HSM Credential / Malicious Operator Gets
          </p>
          <p className="text-muted-foreground">
            {v.stolenHsmCredGets} {v.maliciousOperatorGets}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">Rule G1 Authority Assumptions:</strong>{' '}
        {v.g1Assumptions}
      </p>
    </div>
  )
}
