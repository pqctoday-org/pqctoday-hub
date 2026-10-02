// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Network, ShieldCheck, ShieldAlert, ShieldOff, ArrowRight, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { CompleteStepAction } from '../../../common/CompleteStepAction'
import {
  OT_PROTOCOLS,
  summarizeProtocol,
  type LayerThreat,
  type OTProtocol,
  type OTSector,
} from '../data/otProtocolData'
import { SECTOR_LABEL } from '../data/roadmapData'

interface ProtocolSecurityAnalyzerProps {
  onComplete: () => void
  initialSelected?: string[]
}

/**
 * KATs for the symmetric primitives OT protocols actually run in their
 * real-time path. Labels name the vector source, never a regulation:
 *  - HMAC-SHA-256: NIST ACVP HMAC-SHA2-256 sample (FIPS 198-1) — the GOOSE/SV
 *    (IEC 62351-6) and DNP3 SAv5 MAC primitive.
 *  - AES-256 Key Wrap: RFC 3394 §4.6 published vector — the DNP3 SAv5
 *    session-key / symmetric update-key wrap primitive.
 */
export const OT_PROTOCOL_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'ot-goose-sv-hmac',
    useCase: 'GOOSE / SV per-message MAC primitive (HMAC-SHA-256, IEC 62351-6)',
    standard: 'NIST ACVP HMAC-SHA2-256 (FIPS 198-1)',
    referenceUrl: 'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files',
    libraryRefId: 'FIPS-198-1',
    kind: { type: 'hmac-verify', hashAlg: 'SHA-256' },
  },
  {
    id: 'ot-dnp3-sav5-keywrap',
    useCase: 'DNP3 SAv5 session-key and symmetric update-key wrap (AES-256 Key Wrap)',
    standard: 'RFC 3394 §4.6',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc3394',
    libraryRefId: 'RFC 3394',
    kind: { type: 'aeskw-wrap' },
  },
]

const THREAT_META: Record<
  LayerThreat,
  { label: string; cls: string; icon: React.ReactNode; border: string }
> = {
  none: {
    label: 'Symmetric — quantum-safe',
    cls: 'text-status-success bg-status-success/10',
    icon: <ShieldCheck size={16} className="text-status-success shrink-0 mt-0.5" />,
    border: 'bg-status-success/5 border-status-success/20',
  },
  forgery: {
    label: 'Forgery exposure',
    cls: 'text-status-error bg-status-error/10',
    icon: <ShieldAlert size={16} className="text-status-error shrink-0 mt-0.5" />,
    border: 'bg-status-error/5 border-status-error/20',
  },
  hndl: {
    label: 'HNDL exposure',
    cls: 'text-status-warning bg-status-warning/10',
    icon: <ShieldAlert size={16} className="text-status-warning shrink-0 mt-0.5" />,
    border: 'bg-status-warning/5 border-status-warning/20',
  },
  both: {
    label: 'Forgery + HNDL exposure',
    cls: 'text-status-error bg-status-error/10',
    icon: <ShieldAlert size={16} className="text-status-error shrink-0 mt-0.5" />,
    border: 'bg-status-error/5 border-status-error/20',
  },
  'no-crypto': {
    label: 'No crypto today',
    cls: 'text-muted-foreground bg-muted',
    icon: <ShieldOff size={16} className="text-muted-foreground shrink-0 mt-0.5" />,
    border: 'bg-muted/40 border-border',
  },
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`
}

const SECTOR_FILTER: { id: 'all' | OTSector; label: string }[] = [
  { id: 'all', label: 'All sectors' },
  ...(Object.keys(SECTOR_LABEL) as OTSector[]).map((s) => ({ id: s, label: SECTOR_LABEL[s] })),
]

export const ProtocolSecurityAnalyzer: React.FC<ProtocolSecurityAnalyzerProps> = ({
  onComplete,
  initialSelected,
}) => {
  const [sector, setSector] = useState<'all' | OTSector>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelected ?? []))
  const [expandedId, setExpandedId] = useState<string | null>(initialSelected?.[0] ?? null)

  const visible = useMemo(
    () => OT_PROTOCOLS.filter((p) => sector === 'all' || p.sectors.includes(sector)),
    [sector]
  )
  const selected = useMemo(() => OT_PROTOCOLS.filter((p) => selectedIds.has(p.id)), [selectedIds])

  const totals = useMemo(
    () =>
      selected.reduce(
        (acc, p) => {
          const s = summarizeProtocol(p)
          acc.symmetricSafe += s.symmetricSafe
          acc.forgery += s.forgery
          acc.hndl += s.hndl
          acc.noCrypto += s.noCrypto
          return acc
        },
        { symmetricSafe: 0, forgery: 0, hndl: 0, noCrypto: 0 }
      ),
    [selected]
  )

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        if (expandedId === id) setExpandedId(null)
      } else {
        next.add(id)
        setExpandedId(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Pick the OT protocols on your network. Each one is split into its crypto layers and every
        layer is tagged by what a quantum computer would actually break:{' '}
        <strong className="text-foreground">forgery</strong> (signatures and certificates — forged
        commands, firmware or identities), <strong className="text-foreground">HNDL</strong> (key
        exchange — recorded traffic decrypted later), or nothing at all (symmetric MACs and key
        wrap).
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">Filter by sector</span>
        <FilterDropdown
          noContainer
          selectedId={sector}
          onSelect={(id) => setSector(id as 'all' | OTSector)}
          items={SECTOR_FILTER}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((protocol) => {
          const isSelected = selectedIds.has(protocol.id)
          const s = summarizeProtocol(protocol)
          return (
            <label
              key={protocol.id}
              aria-label={`Select ${protocol.name}`}
              className={`glass-panel p-4 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(protocol.id)}
                  className="mt-1 accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Network size={14} className="text-primary shrink-0" />
                    <span className="text-sm font-bold text-foreground">{protocol.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {protocol.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px]">
                    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                      {protocol.transport}
                    </span>
                    {protocol.timingRequirement && (
                      <span className="bg-status-info/10 text-status-info rounded px-1.5 py-0.5">
                        {protocol.timingRequirement}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] flex-wrap">
                    <span className="text-status-success">{s.symmetricSafe} symmetric</span>
                    <span className="text-status-error">{s.forgery} forgery</span>
                    <span className="text-status-warning">{s.hndl} HNDL</span>
                    {s.noCrypto > 0 && (
                      <span className="text-muted-foreground">{s.noCrypto} no crypto</span>
                    )}
                  </div>
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {selected.length > 0 && (
        <div className="glass-panel p-3 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-sm text-foreground font-medium">
            {selected.length} protocol{selected.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-status-success">
              {totals.symmetricSafe} symmetric (no change)
            </span>
            <span className="text-status-error">{totals.forgery} forgery-exposed</span>
            <span className="text-status-warning">{totals.hndl} HNDL-exposed</span>
            {totals.noCrypto > 0 && (
              <span className="text-muted-foreground">{totals.noCrypto} with no crypto today</span>
            )}
          </div>
        </div>
      )}

      {selected.map((protocol: OTProtocol) => {
        const isExpanded = expandedId === protocol.id
        return (
          <div key={protocol.id} className="glass-panel overflow-hidden">
            <Button
              variant="ghost"
              onClick={() => setExpandedId(isExpanded ? null : protocol.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors h-auto"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Network size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">{protocol.name}</span>
                <span className="text-xs text-muted-foreground whitespace-normal">
                  ({protocol.standard})
                </span>
              </div>
              <ArrowRight
                size={14}
                className={`text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
              />
            </Button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Standard status:</strong>{' '}
                  {protocol.standardStatus}
                </p>
                {protocol.cryptoLayers.map((layer) => {
                  const meta = THREAT_META[layer.threat]
                  return (
                    <div
                      key={layer.layerName}
                      className={`flex items-start gap-3 rounded-lg p-3 border ${meta.border}`}
                    >
                      {meta.icon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {layer.layerName}
                          </span>
                          <span className={`text-[10px] rounded px-1.5 py-0.5 ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{layer.mechanism}</p>
                        {layer.pqcPath && (
                          <p className="text-xs mt-1 flex items-center gap-1 flex-wrap">
                            <ArrowRight size={10} className="text-primary" />
                            <span className="text-primary font-medium">{layer.pqcPath}</span>
                          </p>
                        )}
                        {layer.classicalBytes !== undefined && layer.pqcBytes !== undefined && (
                          <p className="text-xs mt-1 font-mono text-foreground">
                            {formatBytes(layer.classicalBytes)} → {formatBytes(layer.pqcBytes)}{' '}
                            <span className="text-muted-foreground font-sans">
                              ({layer.sizeBasis}; FIPS 203/204 sizes)
                            </span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1.5 italic">{layer.notes}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            The real-time primitives, checked against published vectors
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          GOOSE, SV and DNP3 SAv5 protect each message with HMAC-SHA-256, and DNP3 SAv5 wraps its
          session and update keys with AES Key Wrap. These are the primitives that stay — so these
          are the ones worth testing. Each test runs in the in-browser SoftHSM against a published
          answer.
        </p>
      </div>
      <KatValidationPanel
        specs={OT_PROTOCOL_KAT_SPECS}
        label="OT symmetric primitive Known Answer Tests"
        authorityNote="NIST ACVP HMAC-SHA2-256 sample (FIPS 198-1) · RFC 3394 §4.6 AES-256 key wrap"
      />

      <div className="flex justify-end pt-2">
        <CompleteStepAction recordsArtifact={false} onClick={onComplete} />
      </div>
    </div>
  )
}
