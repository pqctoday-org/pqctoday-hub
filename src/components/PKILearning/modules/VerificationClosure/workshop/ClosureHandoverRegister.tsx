// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { UserCheck, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Closure & Handover Register — a program closes deliberately: every standing
 * capability transfers to a permanent owner with a re-evaluation date, and the
 * residual risk is accepted by name. Generic governance hooks: ISO/IEC 27001 +
 * NIST RMF (SP 800-37); the PQC-specific framing is practitioner guidance.
 */

const CAPABILITIES = [
  { id: 'cbom', label: 'CBOM + continuous discovery', owner: 'Crypto governance owner' },
  { id: 'vendor', label: 'Vendor governance cadence', owner: 'Supplier risk lead' },
  { id: 'soc', label: 'SOC detection content (crypto drift)', owner: 'SOC manager' },
  { id: 'kri', label: 'KRI / board reporting', owner: 'Risk / GRC' },
  { id: 'agility', label: 'Crypto-agility OKRs', owner: 'Architecture' },
  {
    id: 'residual',
    label: 'Residual-risk register (accepted, with re-eval date)',
    owner: 'SteerCo',
  },
]

export function ClosureHandoverRegister() {
  const [assigned, setAssigned] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setAssigned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allAssigned = assigned.size === CAPABILITIES.length

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <h3 className="font-semibold text-foreground mb-1">
          Hand the program to business-as-usual
        </h3>
        <p className="text-sm text-muted-foreground">
          Assign every standing capability to a permanent owner. The program only closes when
          nothing is left orphaned and the residual risk is accepted by name.
        </p>
      </div>

      <div className="space-y-2">
        {CAPABILITIES.map((cap) => {
          const on = assigned.has(cap.id)
          return (
            <Button
              key={cap.id}
              variant="ghost"
              onClick={() => toggle(cap.id)}
              className={`glass-panel h-auto w-full items-center justify-between whitespace-normal border p-3 text-left ${
                on ? 'border-status-success/40 bg-status-success/5' : 'border-border'
              }`}
            >
              <span className="text-sm text-foreground">{cap.label}</span>
              <span
                className={`flex items-center gap-1 text-xs ${
                  on ? 'text-status-success' : 'text-muted-foreground/50'
                }`}
              >
                <UserCheck size={13} /> {on ? cap.owner : 'unassigned'}
              </span>
            </Button>
          )
        })}
      </div>

      {allAssigned && (
        <div className="glass-panel p-4 border border-status-success/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
            <FileText size={15} className="text-status-success" /> Closure record ready
          </div>
          <p className="text-xs text-muted-foreground">
            All capabilities owned, residual risk accepted, evidence dossier archived. Minute the
            closure decision at the level that chartered the program.
          </p>
        </div>
      )}
    </div>
  )
}
