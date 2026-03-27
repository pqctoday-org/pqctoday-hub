// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { GitBranch, CheckCircle, XCircle, AlertCircle, HelpCircle, Info } from 'lucide-react'
import {
  CLIENT_CONFIGS,
  SERVER_CONFIGS,
  INTEROP_MATRIX,
  type CompatStatus,
} from '../data/testingConstants'

const STATUS_CONFIG: Record<
  CompatStatus,
  { icon: React.ReactNode; label: string; cls: string; cellCls: string }
> = {
  compatible: {
    icon: <CheckCircle size={14} className="text-status-success" />,
    label: 'Compatible',
    cls: 'text-status-success bg-status-success/10 border-status-success/30',
    cellCls: 'bg-status-success/10',
  },
  partial: {
    icon: <AlertCircle size={14} className="text-status-warning" />,
    label: 'Partial (fallback)',
    cls: 'text-status-warning bg-status-warning/10 border-status-warning/30',
    cellCls: 'bg-status-warning/10',
  },
  incompatible: {
    icon: <XCircle size={14} className="text-destructive" />,
    label: 'Incompatible',
    cls: 'text-destructive bg-destructive/10 border-destructive/30',
    cellCls: 'bg-destructive/10',
  },
  untested: {
    icon: <HelpCircle size={14} className="text-muted-foreground" />,
    label: 'Untested',
    cls: 'text-muted-foreground bg-muted border-border',
    cellCls: 'bg-muted/30',
  },
}

export const InteropTestMatrix: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ client: string; server: string } | null>(null)

  const getEntry = (clientId: string, serverId: string) =>
    INTEROP_MATRIX[clientId]?.[serverId] ?? null

  const activeEntry =
    selectedClient && selectedServer ? getEntry(selectedClient, selectedServer) : null

  const hoveredEntry = hoveredCell ? getEntry(hoveredCell.client, hoveredCell.server) : null

  const displayEntry = activeEntry ?? hoveredEntry

  const countStatus = (status: CompatStatus) => {
    let count = 0
    CLIENT_CONFIGS.forEach((c) =>
      SERVER_CONFIGS.forEach((s) => {
        if (getEntry(c.id, s.id)?.status === status) count++
      })
    )
    return count
  }

  return (
    <div className="space-y-6">
      {/* Tool banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <GitBranch size={16} className="text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Reference:</span> OQS Test Server
          (test.openquantumsafe.org) + real-world browser/library compatibility data. Click a cell
          to see test details and RFC 9794 compliance notes.
        </p>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['compatible', 'partial', 'incompatible', 'untested'] as CompatStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s]
          return (
            <div key={s} className={`p-2.5 rounded-lg border text-center ${cfg.cls}`}>
              <div className="text-xl font-bold tabular-nums">{countStatus(s)}</div>
              <div className="text-[10px] font-medium">{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left text-muted-foreground font-medium border-b border-border min-w-[140px]">
                Client → Server ↓
              </th>
              {SERVER_CONFIGS.map((s) => (
                <th
                  key={s.id}
                  className={`p-2 text-center font-medium border-b border-l border-border whitespace-nowrap min-w-[90px] ${
                    selectedServer === s.id ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLIENT_CONFIGS.map((c, ci) => (
              <tr key={c.id} className={ci % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                <td
                  className={`p-2 font-medium border-r border-border ${
                    selectedClient === c.id ? 'text-primary' : 'text-foreground/80'
                  }`}
                >
                  {c.label}
                </td>
                {SERVER_CONFIGS.map((s) => {
                  const entry = getEntry(c.id, s.id)
                  const status = entry?.status ?? 'untested'
                  const cfg = STATUS_CONFIG[status]
                  const isSelected = selectedClient === c.id && selectedServer === s.id
                  const isHovered = hoveredCell?.client === c.id && hoveredCell?.server === s.id

                  return (
                    <td
                      key={s.id}
                      className={`border-l border-b border-border cursor-pointer transition-colors ${cfg.cellCls} ${
                        isSelected ? 'ring-2 ring-primary ring-inset' : ''
                      } ${isHovered && !isSelected ? 'brightness-95' : ''}`}
                      onClick={() => {
                        if (selectedClient === c.id && selectedServer === s.id) {
                          setSelectedClient(null)
                          setSelectedServer(null)
                        } else {
                          setSelectedClient(c.id)
                          setSelectedServer(s.id)
                        }
                      }}
                      onMouseEnter={() => setHoveredCell({ client: c.id, server: s.id })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div className="flex items-center justify-center p-2">{cfg.icon}</div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(['compatible', 'partial', 'incompatible', 'untested'] as CompatStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s]
          return (
            <div key={s} className="flex items-center gap-1.5 text-xs">
              {cfg.icon}
              <span className="text-muted-foreground">{cfg.label}</span>
            </div>
          )
        })}
      </div>

      {/* Detail panel */}
      {displayEntry ? (
        <div className={`p-4 rounded-lg border ${STATUS_CONFIG[displayEntry.status].cls}`}>
          <div className="flex items-center gap-2 mb-2">
            {STATUS_CONFIG[displayEntry.status].icon}
            <span className="font-semibold text-sm">
              {CLIENT_CONFIGS.find((c) => c.id === displayEntry.client)?.label}
              {' → '}
              {SERVER_CONFIGS.find((s) => s.id === displayEntry.server)?.label}
            </span>
          </div>
          <p className="text-xs text-foreground/80">{displayEntry.note}</p>

          {/* RFC 9794 callout for partial/incompatible */}
          {(displayEntry.status === 'partial' || displayEntry.status === 'incompatible') && (
            <div className="mt-3 flex items-start gap-2 p-2 rounded bg-background/50 border border-border/50">
              <Info size={12} className="text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">RFC 9794 rule:</span> In a hybrid
                scheme, both the classical and PQC components must complete successfully. If either
                fails, the shared secret is invalid — no silent downgrade is permitted.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-border bg-muted/30 text-center text-xs text-muted-foreground">
          Click or hover a matrix cell to see interoperability details
        </div>
      )}

      {/* Key insight */}
      <div className="p-3 rounded-lg bg-muted border border-border text-xs text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground">Oversized ClientHello risk:</p>
        <p>
          Pure PQC clients send ClientHello messages up to 1,536 bytes. When a server&apos;s TCP MSS
          is 1,460 bytes (standard Ethernet), the ClientHello spans 2 TCP segments — some older load
          balancers and firewalls drop fragmented ClientHellos, causing silent failures. Use{' '}
          <span className="font-mono">pqcscan</span> to probe affected endpoints and verify they
          handle oversized ClientHellos correctly.
        </p>
      </div>
    </div>
  )
}
