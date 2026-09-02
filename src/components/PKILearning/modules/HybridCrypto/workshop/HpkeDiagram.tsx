// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'

export type HpkeDiagramStage =
  | 'idle'
  | 'recipient-keygen'
  | 'sender-keygen'
  | 'encap'
  | 'seal'
  | 'decap'
  | 'open'
  | 'done'

interface HpkeDiagramProps {
  stage: HpkeDiagramStage
  modeLabel: string
  kemLabel: string
}

const STAGE_LABEL: Record<HpkeDiagramStage, string> = {
  idle: 'Pick a suite and run Step 1',
  'recipient-keygen': 'Recipient generates a KEM keypair (ek, dk)',
  'sender-keygen': 'Sender generates a static keypair (Auth modes) + PSK (PSK modes)',
  encap: 'Sender: Encap(ek) → shared_secret, enc',
  seal: 'Sender: KeySchedule → key, base_nonce → Seal(pt) → ct',
  decap: 'Recipient: Decap(enc, dk) → shared_secret',
  open: 'Recipient: KeySchedule → key, base_nonce → Open(ct) → pt',
  done: 'Round-trip complete — both sides hold the same key material',
}

/**
 * Sender/Recipient flow diagram for the HPKE workshop step, in the same
 * two-node + connecting-line style as FiveGDiagram.tsx (highlighted node +
 * animated packet keyed off a `stage` prop instead of a numeric step index,
 * since this workshop's steps branch by picked mode/KEM rather than forming
 * one fixed linear sequence).
 */
export const HpkeDiagram: React.FC<HpkeDiagramProps> = ({ stage, modeLabel, kemLabel }) => {
  const senderActive = stage === 'sender-keygen' || stage === 'encap' || stage === 'seal'
  const recipientActive = stage === 'recipient-keygen' || stage === 'decap' || stage === 'open'
  const packetToRecipient = stage === 'encap' || stage === 'seal'
  const packetToSender = false // HPKE's data flow is unidirectional sender→recipient
  const bothSettled = stage === 'done'

  return (
    <div className="relative w-full h-[160px] bg-muted/50 rounded-lg p-4 flex items-center justify-between overflow-hidden">
      {/* Sender node */}
      <div
        className={`relative z-10 w-28 h-28 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500 ${
          senderActive || bothSettled
            ? 'border-primary bg-primary/10 shadow-glow'
            : 'border-border bg-card/40'
        }`}
      >
        <div className="text-2xl sm:text-3xl mb-1">📤</div>
        <div className="font-bold text-center text-sm">Sender</div>
        <div className="text-[10px] text-muted-foreground mt-1">Alice</div>
      </div>

      {/* Connection + packet */}
      <div className="flex-1 relative h-full flex flex-col items-center justify-center mx-4">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-border/20 -translate-y-1/2" />
        {(packetToRecipient || packetToSender) && (
          <div
            className={`absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 ${
              packetToRecipient
                ? 'left-1/4 bg-secondary animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]'
                : ''
            }`}
          />
        )}
        <div className="absolute top-1/3 w-full text-center px-2">
          <span className="text-[11px] text-primary">
            {kemLabel} · {modeLabel} mode
          </span>
        </div>
        <div className="absolute bottom-1/3 w-full text-center px-2">
          <span className="text-[11px] text-muted-foreground animate-pulse">
            {STAGE_LABEL[stage]}
          </span>
        </div>
      </div>

      {/* Recipient node */}
      <div
        className={`relative z-10 w-28 h-28 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500 ${
          recipientActive || bothSettled
            ? 'border-secondary bg-secondary/10 shadow-glow'
            : 'border-border bg-card/40'
        }`}
      >
        <div className="text-2xl sm:text-3xl mb-1">📥</div>
        <div className="font-bold text-center text-sm">Recipient</div>
        <div className="text-[10px] text-muted-foreground mt-1">Bob</div>
      </div>
    </div>
  )
}
