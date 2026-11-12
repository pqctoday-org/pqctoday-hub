import React, { useState } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  Copy,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TpmLogEntry } from './TpmPlayground'
import { toHex, getU16, getU32 } from '../../../wasm/tpmSerializer'
import { getCommandDef, getRcInfo } from './tpmCommandDefs'
import { readField, readVariablePreview, TAG_NAMES, CC_NAMES } from './tpmWireDecode'
import { Term } from '../learnkit/Term'
import { decodeTpmResponse } from './tpmResponseDecode'

interface ExecutionLogProps {
  logs: TpmLogEntry[]
}

// ── Sub-components ────────────────────────────────────────────────────────────

export function HexPanel({
  label,
  bytes,
  onCopy,
}: {
  label: string
  bytes: Uint8Array | null
  onCopy: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-border/50 rounded overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 h-auto rounded-none hover:bg-muted/30 text-left"
      >
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
          {bytes ? ` · ${bytes.length} bytes` : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onCopy()
            }}
            disabled={!bytes}
            className="h-5 w-5 hover:text-primary"
            title="Copy hex"
          >
            <Copy className="h-3 w-3" />
          </Button>
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </Button>
      {expanded && (
        <div className="p-3 bg-muted/10">
          <pre className="font-mono text-[10px] text-muted-foreground break-all whitespace-pre-wrap leading-relaxed">
            {bytes ? toHex(bytes) : 'No data'}
          </pre>
        </div>
      )}
    </div>
  )
}

function FieldTable({
  rows,
}: {
  rows: { name: string; type: string; value: string; description: React.ReactNode }[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-xs">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-[30%]">
              Field
            </th>
            <th className="text-left px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-[15%]">
              Type
            </th>
            <th className="text-left px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Value / Meaning
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/10">
              <td className="px-2 py-1.5 font-mono text-[10px] text-foreground align-top">
                {row.name}
              </td>
              <td className="px-2 py-1.5 font-mono text-[10px] text-secondary align-top">
                {row.type}
              </td>
              <td className="px-2 py-1.5 align-top space-y-0.5">
                <div className="font-mono text-[10px] text-primary">{row.value}</div>
                <div className="text-[10px] text-muted-foreground leading-snug">
                  {row.description}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExecutionLog({ logs }: ExecutionLogProps) {
  const log = logs[logs.length - 1]

  const handleCopy = (bytes: Uint8Array | null) => {
    if (bytes) navigator.clipboard.writeText(toHex(bytes))
  }

  if (!log) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12 space-y-2">
        <ArrowRight className="h-8 w-8 opacity-20" />
        <p className="text-sm">No command executed yet.</p>
        <p className="text-xs">Select a command and click Send.</p>
      </div>
    )
  }

  // ── Decode request header ──
  const req = log.request
  const reqTag = getU16(req, 0)
  const reqSize = getU32(req, 2)
  const reqCc = getU32(req, 6)

  const reqTagName = TAG_NAMES[reqTag]
  const reqCcName = CC_NAMES[reqCc]
  const reqRows = [
    {
      name: 'tag',
      type: 'TPM_ST',
      value: `0x${reqTag.toString(16).padStart(4, '0')}`,
      description: reqTagName ? <Term glossaryKey={reqTagName}>{reqTagName}</Term> : 'Unknown tag',
    },
    {
      name: 'commandSize',
      type: 'UINT32',
      value: `${reqSize} bytes`,
      description: 'Total command buffer size including this header',
    },
    {
      name: 'commandCode',
      type: 'TPM_CC',
      value: `0x${reqCc.toString(16).padStart(8, '0')}`,
      description: reqCcName ? (
        <Term glossaryKey={reqCcName}>{reqCcName}</Term>
      ) : (
        'Unknown command code'
      ),
    },
  ]

  // ── Decode response ──
  const resp = log.response
  const cmdDef = getCommandDef(log.commandType)
  // Existing hybrid examples return a textual summary, not a TPM wire response.
  const informational = cmdDef?.respFields(log.algorithm).every((f) => f.name === 'note')
  let tpmRc = -1
  if (resp && resp.length >= 10) {
    tpmRc = getU32(resp, 6)
  }
  const rcInfo = getRcInfo(tpmRc)
  const isSuccess = informational ? !log.error : tpmRc === 0
  const decoded = resp && !informational ? decodeTpmResponse(log.commandType, resp) : null

  // Decode response fields
  const respRows =
    isSuccess && resp && cmdDef
      ? cmdDef.respFields(log.algorithm).map((field) => {
          const range = decoded?.fields.get(field.name)
          let value: string
          if (field.name === 'note' && field.tpmType === '—') {
            value = 'Informational note — no decoded value'
          } else if (!range) {
            value = decoded?.error
              ? 'Not decoded — response structure could not be read safely.'
              : 'Not present or unsupported in this response structure.'
          } else if (range.variable) {
            const preview = readVariablePreview(
              resp.subarray(range.offset, range.offset + range.size),
              0
            )
            value = `${range.size} B${range.size ? ` · ${preview}` : ' (empty)'}`
          } else {
            value = readField(resp, range.offset, range.size)
          }

          // Annotate well-known values
          if (range && field.name === 'tag') {
            const v = getU16(resp, range.offset)
            value += ` (${TAG_NAMES[v] ?? ''})`
          } else if (range && field.name === 'responseCode') {
            value += ` (${getRcInfo(getU32(resp, range.offset)).name})`
          } else if (range && field.name === 'objectHandle') {
            const h = getU32(resp, range.offset)
            value = `0x${h.toString(16).padStart(8, '0')} (transient)`
          }

          return {
            name: field.name,
            type: field.tpmType,
            value,
            description: field.description,
          }
        })
      : []

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
      {/* ── Request ── */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-3 py-2 border-b border-border flex items-center gap-2">
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Request — <Term glossaryKey={log.commandType}>{log.commandType}</Term>
          </span>
        </div>
        <div className="p-3 space-y-3">
          <FieldTable rows={reqRows} />
          <HexPanel label="raw bytes" bytes={log.request} onCopy={() => handleCopy(log.request)} />
        </div>
      </div>

      {/* ── Response ── */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeft className="h-3.5 w-3.5 text-secondary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Response
            </span>
          </div>
          {resp && !informational && (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isSuccess
                  ? 'bg-status-success/10 text-status-success border border-status-success/30'
                  : 'bg-status-error/10 text-status-error border border-status-error/30'
              }`}
            >
              {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              <Term glossaryKey={rcInfo.name}>{rcInfo.name}</Term>
            </div>
          )}
        </div>

        <div className="p-3 space-y-3">
          {log.error && (
            <div className="font-mono text-xs text-status-error bg-status-error/5 border border-status-error/20 rounded p-2 break-all">
              [TPM WASM ERROR] {log.error}
            </div>
          )}

          {decoded?.error && !informational && (
            <p role="alert" className="text-xs text-status-error">
              Response fields not decoded: {decoded.error}. Raw received bytes remain available
              below.
            </p>
          )}
          {decoded?.parameterStart !== undefined && !decoded.error && (
            <p className="text-[10px] text-muted-foreground">
              Parameter bytes: {decoded.parameterStart}–{decoded.parameterEnd} (end exclusive).
              {decoded.authStart !== undefined
                ? ` Authorization area starts at byte ${decoded.authStart}; it is not payload.`
                : ' No response authorization area.'}
            </p>
          )}
          {resp && !informational && !isSuccess && (
            <div className="text-xs text-muted-foreground bg-muted/20 border border-border rounded p-3">
              <div className="font-mono font-bold text-status-error mb-1">
                RC = 0x{tpmRc.toString(16).padStart(8, '0')} — {rcInfo.name}
              </div>
              <p className="leading-relaxed">{rcInfo.description}</p>
            </div>
          )}

          {isSuccess && respRows.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Decoded Fields
              </p>
              <div className="border border-border rounded-lg overflow-hidden">
                <FieldTable rows={respRows} />
              </div>
            </div>
          )}

          {resp && <HexPanel label="raw bytes" bytes={resp} onCopy={() => handleCopy(resp)} />}

          {!resp && !log.error && (
            <p className="text-xs text-muted-foreground italic">Awaiting response…</p>
          )}
        </div>
      </div>
    </div>
  )
}
