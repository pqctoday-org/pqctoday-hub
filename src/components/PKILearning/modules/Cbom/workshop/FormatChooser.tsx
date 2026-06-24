// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Format Chooser — CycloneDX vs SPDX decision aid. The decisive point: SPDX
 * 3.0.1 has no dedicated cryptography object model yet, so for a CBOM
 * specifically CycloneDX is the practical choice today.
 */

interface Question {
  id: string
  text: string
  // weight toward CycloneDX (+) or SPDX (-) when answered "yes"
  weight: number
}

const QUESTIONS: Question[] = [
  {
    id: 'crypto',
    text: 'Do you need to express cryptographic assets (algorithms, keys, certs) — i.e. a true CBOM?',
    weight: 3,
  },
  { id: 'vex', text: 'Do you need native vulnerability / VEX linkage?', weight: 1 },
  { id: 'license', text: 'Is open-source license compliance your primary driver?', weight: -2 },
  { id: 'iso', text: 'Is an ISO/IEC 5962 mandate the deciding constraint?', weight: -2 },
]

export function FormatChooser() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({})

  const score = QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ? q.weight : 0), 0)
  const answered = Object.keys(answers).length > 0
  const cryptoNeeded = answers['crypto'] === true

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Pick a BOM format</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          CycloneDX (OWASP / ECMA-424) vs SPDX (Linux Foundation / ISO 5962). Answer to see a
          recommendation.
        </p>
      </div>

      <div className="space-y-2">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="glass-panel p-3 flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">{q.text}</span>
            <div className="flex gap-1 shrink-0">
              {(['Yes', 'No'] as const).map((label) => {
                const val = label === 'Yes'
                const on = answers[q.id] === val
                return (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: val }))}
                    className={
                      on
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:border-primary/40'
                    }
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {answered && (
        <div className="glass-panel p-4 border border-primary/30">
          <h4 className="text-sm font-semibold text-foreground mb-1">Recommendation</h4>
          {cryptoNeeded ? (
            <p className="text-sm text-foreground">
              <span className="font-semibold text-primary">CycloneDX</span> — SPDX 3.0.1 has no
              dedicated cryptography object model yet, so for a CBOM specifically CycloneDX is the
              only practical choice regardless of the other answers.
            </p>
          ) : (
            <p className="text-sm text-foreground">
              {score >= 0 ? (
                <>
                  <span className="font-semibold text-primary">CycloneDX</span> leans ahead for
                  security-automation use. Either format works for a general SBOM.
                </>
              ) : (
                <>
                  <span className="font-semibold text-primary">SPDX</span> fits a license-compliance
                  / ISO-mandate driver — but note it cannot express a CBOM today.
                </>
              )}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            The PKIC CBOM-Profiles WG is building format-neutral profiles that map onto both.
          </p>
        </div>
      )}
    </div>
  )
}
