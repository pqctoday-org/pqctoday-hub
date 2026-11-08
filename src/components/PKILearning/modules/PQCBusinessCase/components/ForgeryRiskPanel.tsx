// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { FileSignature, ShieldOff, ArrowRight } from 'lucide-react'

const FORGERY_TARGETS = [
  { label: 'Code & firmware signing', example: 'Malicious updates accepted as authentic' },
  { label: 'Financial transactions', example: 'Forged authorization on payments or trades' },
  {
    label: 'Document & contract signatures',
    example: 'Repudiation — forged signatures can verify the same as real ones',
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
 * signatures. Unlike HNDL, there is no encrypted record to "harvest now" and
 * decrypt later; the attacker needs a CRQC to forge. It still reaches
 * backwards in one way: a forged claim about a past record verifies unless
 * earlier evidence anchors it. So it argues for a different migration order
 * than HNDL (key establishment first), with long-lead signature work started
 * before any scenario arrival date; no arrival date is treated as a reliable
 * deadline. No
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
        signature scheme, an attacker can forge signatures, including signatures that claim to be
        about the past: a forged signature or document dated earlier would verify unless evidence
        that existed before the break anchors it, such as a trusted timestamp or archival renewal of
        the signature evidence. Signatures that were genuinely made earlier stay the signer&apos;s,
        but a verifier using the broken scheme can no longer tell them from forgeries without that
        evidence.
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
              Data recorded today under a quantum-vulnerable key exchange could be decrypted later
              if a CRQC exists, so for long-lived secrets each year of delay adds another year of
              potentially exposed data.
            </p>
          </div>
          <div className="flex items-center justify-center text-muted-foreground">
            <ArrowRight size={16} className="hidden sm:block" />
          </div>
          <div className="flex-1 bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="font-semibold text-foreground mb-1">
              Forgery — start the long-lead signature work well before any scenario date
            </p>
            <p className="text-muted-foreground">
              Forgery needs a CRQC to exist, but its reach includes claims about past records, so
              plan trusted timestamps or archival renewal for evidence you must keep, and plan the
              migration of verification trust (algorithms, certificates, trust anchors and
              verifiers), which takes long lead time. No CRQC arrival date is reliable enough to
              serve as the deadline; treat any such year as a scenario assumption.
            </p>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        This split is what the US federal PQC executive order sets for federal high value assets and
        high-impact systems (national security systems are excluded): post-quantum key establishment
        by 31 December 2030, post-quantum digital signatures by 31 December 2031 (
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
