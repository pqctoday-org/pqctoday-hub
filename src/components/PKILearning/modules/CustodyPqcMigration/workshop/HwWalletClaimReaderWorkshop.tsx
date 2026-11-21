// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Cpu, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HW_CLAIM_CARDS, FIVE_HW_QUESTIONS, type HwPartId } from '../data/custodyPqcData'
import type { ClaimMaturity } from '../data/sourceClaims'
import { ClaimLine, ReadingNote } from '../components/ClaimLine'

interface Props {
  initialPreset?: string
}

const PART_LABELS: Record<HwPartId, string> = {
  'device-integrity': 'Part 1: Device Integrity & Attestation',
  'transaction-signing': 'Part 2: Chain Transaction Signing',
  'seed-derivation': 'Part 3: Seed & Derivation',
  'channel-display': 'Part 4: Host Channel & Clear Display',
}

const MATURITY_OPTIONS: { value: ClaimMaturity; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'vendor-shipped', label: 'Vendor shipped' },
  { value: 'vendor-announced', label: 'Vendor announced' },
  { value: 'research', label: 'Research' },
]

export const HwWalletClaimReaderWorkshop: React.FC<Props> = ({ initialPreset }) => {
  const [activeCardId, setActiveCardId] = useState<string>(
    initialPreset && HW_CLAIM_CARDS.some((c) => c.id === initialPreset)
      ? initialPreset
      : HW_CLAIM_CARDS[0].id
  )
  const [partPicks, setPartPicks] = useState<Record<string, HwPartId | undefined>>({})
  const [maturityPicks, setMaturityPicks] = useState<Record<string, ClaimMaturity | undefined>>({})

  const card = HW_CLAIM_CARDS.find((c) => c.id === activeCardId) ?? HW_CLAIM_CARDS[0]
  const pickedPart = partPicks[card.id]
  const pickedMaturity = maturityPicks[card.id]

  const bothAnswered = pickedPart !== undefined && pickedMaturity !== undefined
  const partCorrect = pickedPart === card.correctPart
  const maturityCorrect = pickedMaturity === card.correctMaturity

  const completedCount = HW_CLAIM_CARDS.filter((c) => {
    return partPicks[c.id] === c.correctPart && maturityPicks[c.id] === c.correctMaturity
  }).length

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="text-primary" size={20} aria-hidden="true" />
            <h2 className="text-xl font-bold text-gradient">
              W13: Hardware Wallet &ldquo;Quantum-Ready&rdquo; Claim Reader
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">
            Fully classified: {completedCount}/{HW_CLAIM_CARDS.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Dissect six hardware-wallet and secure-element statements into the four architectural
          parts and mark each claim’s maturity (standard / vendor shipped / vendor announced /
          research).
        </p>
      </div>

      {/* Card selector */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {HW_CLAIM_CARDS.map((c) => {
            const active = c.id === card.id
            const done =
              partPicks[c.id] === c.correctPart && maturityPicks[c.id] === c.correctMaturity
            return (
              <Button
                key={c.id}
                variant="ghost"
                onClick={() => setActiveCardId(c.id)}
                className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 ${
                  active
                    ? 'bg-primary/15 text-primary border-primary/50 font-semibold'
                    : 'bg-muted/40 text-foreground border-border hover:bg-muted/70'
                }`}
              >
                {done ? (
                  <CheckCircle2 size={12} className="text-status-success" aria-hidden="true" />
                ) : null}
                {c.productLabel}
              </Button>
            )
          })}
        </div>

        <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Statement to classify
          </p>
          <p className="text-sm font-semibold text-foreground">{card.productLabel}</p>
          <p className="text-sm text-muted-foreground">{card.statement}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              1. Which of the four parts does it cover?
            </p>
            {(Object.keys(PART_LABELS) as HwPartId[]).map((partId) => (
              <Button
                key={partId}
                variant="ghost"
                onClick={() => setPartPicks((prev) => ({ ...prev, [card.id]: partId }))}
                className={`w-full h-auto justify-start text-left whitespace-normal px-3 py-2 rounded-lg border text-xs transition-colors ${
                  pickedPart === partId
                    ? 'bg-primary/15 text-primary border-primary/50 font-semibold'
                    : 'bg-background/60 text-foreground border-border hover:bg-muted/50'
                }`}
              >
                {/* eslint-disable-next-line security/detect-object-injection */}
                {PART_LABELS[partId]}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              2. What is its maturity status?
            </p>
            {MATURITY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant="ghost"
                onClick={() => setMaturityPicks((prev) => ({ ...prev, [card.id]: opt.value }))}
                className={`w-full h-auto justify-start text-left whitespace-normal px-3 py-2 rounded-lg border text-xs transition-colors ${
                  pickedMaturity === opt.value
                    ? 'bg-primary/15 text-primary border-primary/50 font-semibold'
                    : 'bg-background/60 text-foreground border-border hover:bg-muted/50'
                }`}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {bothAnswered ? (
          <div className="space-y-3 pt-2">
            <div
              className={`p-4 rounded-lg border text-xs space-y-1.5 ${
                partCorrect && maturityCorrect
                  ? 'bg-status-success/10 border-status-success/40'
                  : 'bg-status-warning/10 border-status-warning/40'
              }`}
            >
              <p className="font-bold text-foreground flex items-center gap-1.5">
                {partCorrect && maturityCorrect ? (
                  <>
                    <CheckCircle2 size={15} className="text-status-success" aria-hidden="true" />
                    Both part and maturity match
                  </>
                ) : (
                  <>
                    <XCircle size={15} className="text-status-error" aria-hidden="true" />
                    Expected {PART_LABELS[card.correctPart]} · {card.correctMaturity}
                  </>
                )}
              </p>
              <p className="text-muted-foreground">{card.explanation}</p>
            </div>
            <ClaimLine id={card.claimId} chip="Primary evidence" />
          </div>
        ) : null}
      </div>

      {/* Five Questions Reference Card */}
      <ReadingNote title="Five questions to ask any “quantum-ready” hardware wallet claim">
        <ul className="space-y-1.5 text-xs text-foreground">
          {FIVE_HW_QUESTIONS.map((q) => (
            <li key={q} className="flex items-start gap-2">
              <HelpCircle size={13} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </ReadingNote>
    </div>
  )
}
