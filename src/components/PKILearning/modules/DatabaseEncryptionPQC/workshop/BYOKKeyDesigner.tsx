// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { KeyRound, ShieldCheck, CheckCircle, XCircle } from 'lucide-react'
import { BYOK_ARCHITECTURES } from '../data/databaseConstants'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'

const DBENC_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'dbenc-tde-decrypt',
    useCase: 'TDE tablespace decryption (AES-256-GCM)',
    standard: 'SP 800-38D ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/38/d/final',
    kind: { type: 'aesgcm-decrypt' },
  },
  {
    id: 'dbenc-dek-wrap',
    useCase: 'Column DEK key wrapping (AES-256-KW)',
    standard: 'RFC 3394 ACVP',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc3394',
    kind: { type: 'aeskw-wrap' },
  },
  {
    id: 'dbenc-byok-kem',
    useCase: 'BYOK key transport (ML-KEM-768)',
    standard: 'FIPS 203',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
]

export const BYOKKeyDesigner: React.FC = () => {
  const [selectedPatternId, setSelectedPatternId] = useState<string>('provider-managed')

  const selected =
    BYOK_ARCHITECTURES.find((a) => a.id === selectedPatternId) ?? BYOK_ARCHITECTURES[0]

  const scoreColor =
    selected.pqcReadinessScore >= 80
      ? 'text-status-success'
      : selected.pqcReadinessScore >= 50
        ? 'text-status-warning'
        : 'text-status-error'

  const scoreBarColor =
    selected.pqcReadinessScore >= 80
      ? 'bg-status-success'
      : selected.pqcReadinessScore >= 50
        ? 'bg-status-warning'
        : 'bg-status-error'

  return (
    <div className="space-y-6">
      {/* Pattern selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BYOK_ARCHITECTURES.map((arch) => {
          const isSelected = selectedPatternId === arch.id
          return (
            <Button
              variant="ghost"
              key={arch.id}
              onClick={() => setSelectedPatternId(arch.id)}
              className={`text-left rounded-lg border p-4 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <KeyRound
                  size={16}
                  className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                />
                <span
                  className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}
                >
                  {arch.pattern}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">PQC Readiness:</div>
                <div
                  className={`text-xs font-bold ${
                    arch.pqcReadinessScore >= 80
                      ? 'text-status-success'
                      : arch.pqcReadinessScore >= 50
                        ? 'text-status-warning'
                        : 'text-status-error'
                  }`}
                >
                  {arch.pqcReadinessScore}%
                </div>
              </div>
            </Button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Architecture diagram */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-primary" />
            <h3 className="text-base font-bold text-foreground">{selected.pattern}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{selected.description}</p>

          {/* Diagram */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">Architecture Diagram</div>
            <div className="space-y-1 font-mono">
              {selected.diagram.map((line, idx) => (
                <div
                  key={idx}
                  className={`text-xs ${
                    line.startsWith(' ') || line.includes('↓')
                      ? 'text-muted-foreground pl-4'
                      : line.includes('ML-KEM') || line.includes('HSM')
                        ? 'text-primary font-bold'
                        : line.includes('Cloud')
                          ? 'text-status-warning'
                          : 'text-foreground font-medium'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Key metadata */}
          <div className="space-y-2">
            {[
              { label: 'KMS Provider', value: selected.kmsProvider },
              { label: 'Key Type', value: selected.keyType },
              { label: 'Wrapping Algorithm', value: selected.wrappingAlgorithm },
              { label: 'Data Key', value: selected.dataKey },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground shrink-0 w-32">{item.label}:</span>
                <span className="text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PQC readiness + pros/cons */}
        <div className="space-y-4">
          {/* PQC Readiness Score */}
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={18} className="text-primary" />
              <div className="text-sm font-bold text-foreground">PQC Readiness Score</div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`text-3xl font-bold ${scoreColor}`}>
                {selected.pqcReadinessScore}%
              </div>
              <div className="flex-1">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${scoreBarColor}`}
                    style={{ width: `${selected.pqcReadinessScore}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">PQC Upgrade Path</div>
              <p className="text-xs text-muted-foreground">{selected.pqcUpgrade}</p>
            </div>
          </div>

          {/* Pros */}
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-status-success" />
              <div className="text-sm font-bold text-foreground">Advantages</div>
            </div>
            <ul className="space-y-1.5">
              {selected.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-status-success shrink-0 mt-0.5">+</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={16} className="text-status-error" />
              <div className="text-sm font-bold text-foreground">Limitations</div>
            </div>
            <ul className="space-y-1.5">
              {selected.cons.map((con, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-status-error shrink-0 mt-0.5">−</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Comparison summary */}
      <div className="glass-panel p-4">
        <div className="text-xs font-bold text-foreground mb-3">Pattern Comparison</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Pattern</th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  Key Control
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  Complexity
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  PQC Score
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Best For</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  pattern: 'Provider-Managed',
                  control: 'None',
                  complexity: 'Low',
                  score: 30,
                  bestFor: 'Non-regulated workloads',
                },
                {
                  pattern: 'BYOK',
                  control: 'Customer generates',
                  complexity: 'Medium',
                  score: 65,
                  bestFor: 'Most regulated enterprises',
                },
                {
                  pattern: 'HYOK',
                  control: 'Full customer custody',
                  complexity: 'High',
                  score: 90,
                  bestFor: 'NSM-8, DORA, classified',
                },
              ].map((row) => (
                <tr key={row.pattern} className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium text-foreground">{row.pattern}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground">{row.control}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground">{row.complexity}</td>
                  <td
                    className={`py-2 px-2 text-center font-bold ${
                      row.score >= 80
                        ? 'text-status-success'
                        : row.score >= 50
                          ? 'text-status-warning'
                          : 'text-status-error'
                    }`}
                  >
                    {row.score}%
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">{row.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <KatValidationPanel
        specs={DBENC_KAT_SPECS}
        label="Database Encryption PQC Known Answer Tests"
        authorityNote="SP 800-38D · RFC 3394 · FIPS 203"
      />
    </div>
  )
}
