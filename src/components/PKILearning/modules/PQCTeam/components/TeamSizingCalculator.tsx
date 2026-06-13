// SPDX-License-Identifier: GPL-3.0-only
/**
 * Team Sizing Calculator (Applied Quantum Skills appendix, p.160–164).
 * Turns org size + scope into a concrete role/FTE estimate using the
 * 1-Crypto-Champion-per-500-engineers heuristic plus a fixed core team that
 * scales in coarse bands. Pure UI; no persistence.
 */
import React, { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RoleEstimate {
  role: string
  fte: number
  note: string
}

const CHAMPION_RATIO = 500 // 1 Crypto Champion per 500 engineers

function coreTeam(engineers: number): RoleEstimate[] {
  // Core team scales in coarse bands; a 5k-engineer estate is not 10x a 500-engineer one.
  const large = engineers >= 5000
  const mid = engineers >= 1000
  return [
    { role: 'Quantum-Readiness Program Manager', fte: 1, note: 'Always 1 accountable owner.' },
    {
      role: 'Cryptographic Architect',
      fte: large ? 2 : 1,
      note: large ? 'Two at very large estates for coverage.' : 'One owns target-state crypto.',
    },
    {
      role: 'Application Security Lead',
      fte: mid ? 2 : 1,
      note: mid ? 'Split across business units.' : 'Drives pilots and waves.',
    },
    {
      role: 'Security Engineers (PQC)',
      fte: large ? 6 : mid ? 3 : 2,
      note: 'Hands-on remediation; scales with estate.',
    },
    { role: 'GRC / Compliance Lead', fte: 1, note: 'Owns deadlines, evidence, audit readiness.' },
  ]
}

export const TeamSizingCalculator: React.FC = () => {
  const [engineers, setEngineers] = useState(800)
  const [regulated, setRegulated] = useState(false)

  const { rows, championFte, totalFte } = useMemo(() => {
    const safeEng = Number.isFinite(engineers) && engineers > 0 ? engineers : 0
    const champions = Math.max(1, Math.ceil(safeEng / CHAMPION_RATIO))
    const core = coreTeam(safeEng)
    // Regulated estates carry an extra GRC/compliance FTE for evidence load.
    const rows: RoleEstimate[] = [
      ...core.map((r) =>
        r.role.startsWith('GRC') && regulated
          ? { ...r, fte: r.fte + 1, note: 'Regulated: +1 for evidence & audit load.' }
          : r
      ),
      {
        role: 'Crypto Champions (federated)',
        fte: champions,
        note: `~1 per ${CHAMPION_RATIO} engineers (${safeEng} ÷ ${CHAMPION_RATIO}).`,
      },
    ]
    const total = rows.reduce((sum, r) => sum + r.fte, 0)
    return { rows, championFte: champions, totalFte: total }
  }, [engineers, regulated])

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Users size={18} className="text-primary" />
          Team Sizing Calculator
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Estimate roles and FTE for your PQC migration team from your engineering headcount.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Engineering headcount (people who touch code/crypto)
          </span>
          <input
            type="number"
            min={1}
            value={engineers}
            onChange={(e) => setEngineers(Number(e.target.value))}
            aria-label="Engineering headcount"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </label>
        <div className="flex flex-col justify-end">
          <span className="text-xs font-medium text-muted-foreground mb-1">
            Regulated industry?
          </span>
          <div className="flex gap-2">
            <Button
              variant={regulated ? 'gradient' : 'outline'}
              size="sm"
              aria-pressed={regulated}
              onClick={() => setRegulated(true)}
            >
              Yes
            </Button>
            <Button
              variant={!regulated ? 'gradient' : 'outline'}
              size="sm"
              aria-pressed={!regulated}
              onClick={() => setRegulated(false)}
            >
              No
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="py-2 px-3 font-semibold">Role</th>
              <th className="py-2 px-3 font-semibold w-16">FTE</th>
              <th className="py-2 px-3 font-semibold">Basis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.role} className="border-t border-border/50 align-top">
                <td className="py-2 px-3 font-medium text-foreground">{r.role}</td>
                <td className="py-2 px-3 text-foreground tabular-nums">{r.fte}</td>
                <td className="py-2 px-3 text-xs text-muted-foreground">{r.note}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-primary/5">
              <td className="py-2 px-3 font-bold text-foreground">Total core + champions</td>
              <td className="py-2 px-3 font-bold text-primary tabular-nums">{totalFte}</td>
              <td className="py-2 px-3 text-xs text-muted-foreground">
                Includes {championFte} Crypto Champion{championFte === 1 ? '' : 's'}.
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Heuristic only — a starting point for budgeting, not a staffing mandate. Source: Applied
        Quantum PQC Migration Framework, Skills &amp; Team appendix (1-per-500 Crypto Champion
        ratio).
      </p>
    </div>
  )
}
