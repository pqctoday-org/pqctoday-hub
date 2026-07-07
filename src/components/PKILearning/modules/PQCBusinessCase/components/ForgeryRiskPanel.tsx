// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { FileSignature, ShieldOff, ArrowRight } from 'lucide-react'

const FORGERY_TARGETS = [
  { label: 'Code & firmware signing', example: 'Malicious updates accepted as authentic' },
  { label: 'Financial transactions', example: 'Forged authorization on payments or trades' },
  {
    label: 'Document & contract signatures',
    example: 'Repudiation — forged signatures are indistinguishable from real ones',
  },
  {
    label: 'TLS server authentication',
    example: 'Impersonated servers pass certificate validation',
  },
]

/**
 * The Breach Scenario Simulator models HNDL (confidentiality) exposure. This
 * panel exists because quantum risk has a SECOND, qualitatively different
 * attack class the breach-cost math above cannot represent: forging
 * signatures. Unlike HNDL, forgery cannot be done retroactively — there is
 * nothing to "harvest now" — so it argues for a different migration priority
 * (signatures, by CRQC-day) than HNDL does (key establishment, now). No
 * dollar figures are invented here; this is deliberately qualitative pending
 * a citable fraud-loss baseline (see the improvement plan, Phase 3.2).
 */
export const ForgeryRiskPanel: React.FC = () => {
  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center gap-2">
        <FileSignature size={20} className="text-primary" />
        <h3 className="text-lg font-bold text-foreground">
          The Other Quantum Risk: Forged Signatures
        </h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Everything above models <strong className="text-foreground">confidentiality</strong> risk —
        data harvested today, decrypted later. Quantum computing threatens a second, independent
        property: <strong className="text-foreground">authenticity</strong>. Once a CRQC can break a
        signature scheme, it can forge NEW signatures going forward — but it cannot forge a
        signature that was already validly created in the past.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FORGERY_TARGETS.map((t) => (
          <div key={t.label} className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <ShieldOff size={14} className="text-status-error shrink-0" />
              <p className="text-sm font-medium text-foreground">{t.label}</p>
            </div>
            <p className="text-xs text-muted-foreground">{t.example}</p>
          </div>
        ))}
      </div>
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <p className="text-xs font-medium text-foreground mb-2">
          Why this splits your migration priority in two:
        </p>
        <div className="flex flex-col sm:flex-row items-stretch gap-3 text-xs">
          <div className="flex-1 bg-status-warning/10 border border-status-warning/30 rounded-lg p-3">
            <p className="font-semibold text-foreground mb-1">
              HNDL — migrate key establishment NOW
            </p>
            <p className="text-muted-foreground">
              Data is being harvested today. Every year of delay adds another year of exposed
              historical data — there is no "catching up" later.
            </p>
          </div>
          <div className="flex items-center justify-center text-muted-foreground">
            <ArrowRight size={16} className="hidden sm:block" />
          </div>
          <div className="flex-1 bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="font-semibold text-foreground mb-1">
              Forgery — migrate signatures by CRQC-day
            </p>
            <p className="text-muted-foreground">
              Not retroactive — only NEW signatures after a CRQC exists are at risk. Still urgent,
              but the deadline is the CRQC arrival date itself, not today.
            </p>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        This split is exactly what the US federal PQC executive order encodes: key-establishment
        migration by 2030, digital-signature migration by 2031 (
        <a
          href="https://www.whitehouse.gov/presidential-actions/2026/06/securing-the-nation-against-advanced-cryptographic-attacks/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Executive Order 14412, June 2026
        </a>
        ).
      </p>
      <p className="text-xs italic text-muted-foreground">
        Deliberately qualitative — no dollar figure is modeled here pending a citable fraud-loss
        baseline for forged-signature incidents.
      </p>
    </div>
  )
}
