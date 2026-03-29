// SPDX-License-Identifier: GPL-3.0-only
/**
 * PkcsLogPanel — PKCS#11 call log with optional inspect mode.
 *
 * Compact mode: flat list with timestamp, function, args, rv, ms.
 * Inspect mode: each entry with inspect data shows an expand chevron;
 *   expanded view renders mechanism, attribute templates, and outputs
 *   decoded via pkcs11Inspect.ts.
 */
import { useState } from 'react'
import { Copy, Trash2, CheckCircle, Eye, EyeOff, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '../../ui/button'
import { useHsmContext } from '../hsm/HsmContext'
import type {
  Pkcs11LogInspect,
  InspectSection,
  DecodedAttribute,
} from '../../../wasm/pkcs11Inspect'
import type { Pkcs11LogEntry } from '../../../wasm/softhsm'
import { lookupCkr } from '../../../wasm/pkcs11Inspect'

// ── Inspect sub-components ────────────────────────────────────────────────────

const AttributeRow = ({ attr }: { attr: DecodedAttribute }) => (
  <div className="grid grid-cols-[10rem_1fr] gap-x-3 text-xs font-mono py-0.5 border-b border-border/20 last:border-0">
    <div className="text-muted-foreground truncate" title={attr.typeName}>
      {attr.typeName}
      <span className="ml-1 text-foreground/30">{attr.typeHex}</span>
    </div>
    <div>
      <span
        className={
          attr.value.kind === 'constant'
            ? 'text-primary'
            : attr.value.kind === 'bool'
              ? attr.value.display === 'true'
                ? 'text-status-success'
                : 'text-muted-foreground'
              : attr.value.kind === 'null'
                ? 'text-foreground/30 italic'
                : 'text-foreground'
        }
      >
        {attr.value.display}
      </span>
      {attr.value.description && (
        <span className="ml-2 text-muted-foreground font-sans text-[10px]">
          — {attr.value.description}
        </span>
      )}
    </div>
  </div>
)

const InspectPanel = ({ inspect }: { inspect: Pkcs11LogInspect }) => {
  const renderSection = (section: InspectSection, idx: number) => (
    <div key={idx} className="mb-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
        {section.label}
      </p>

      {section.mechanism && (
        <div className="space-y-1 text-xs font-mono mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-primary font-semibold">{section.mechanism.name}</span>
            <span className="text-muted-foreground">{section.mechanism.typeHex}</span>
          </div>
          {section.mechanism.description && (
            <p className="text-muted-foreground font-sans text-[11px]">
              {section.mechanism.description}
            </p>
          )}
          {section.mechanism.param && (
            <div className="pl-3 border-l border-border/40 mt-1 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                CK_SIGN_ADDITIONAL_CONTEXT
              </p>
              <div className="text-xs">
                <span className="text-primary">{section.mechanism.param.hedgeName}</span>
                <span className="ml-2 text-muted-foreground font-sans text-[10px]">
                  — {section.mechanism.param.hedgeDescription}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                contextLen = {section.mechanism.param.contextLen}
                {section.mechanism.param.contextHex && (
                  <span className="ml-2 font-mono text-foreground/60">
                    [{section.mechanism.param.contextHex}]
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {section.attributes && section.attributes.length > 0 && (
        <div className="border border-border/40 rounded px-2 py-1">
          {section.attributes.map((attr, i) => (
            <AttributeRow key={i} attr={attr} />
          ))}
        </div>
      )}

      {section.primitives && section.primitives.length > 0 && (
        <div className="space-y-0.5">
          {section.primitives.map((p, i) => (
            <div key={i} className="flex gap-3 text-xs font-mono">
              <span className="text-muted-foreground w-36 shrink-0">{p.name}</span>
              <span className="text-foreground">{p.value}</span>
              {p.note && (
                <span className="text-muted-foreground font-sans text-[10px] self-center">
                  — {p.note}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="mt-2 ml-4 pl-3 border-l-2 border-primary/30 bg-muted/30 rounded-r-lg p-3">
      {inspect.inputs.map(renderSection)}

      {inspect.outputs && inspect.outputs.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
            Output
          </p>
          <div className="space-y-0.5">
            {inspect.outputs.map((o, i) => (
              <div key={i} className="flex gap-3 text-xs font-mono">
                <span className="text-muted-foreground w-28 shrink-0">{o.name}</span>
                <span className="text-status-success">{o.value}</span>
                {o.note && (
                  <span className="text-muted-foreground font-sans text-[10px] self-center">
                    — {o.note}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {inspect.spec && (
        <p className="text-[10px] text-muted-foreground border-t border-border/30 pt-2 mt-2">
          § {inspect.spec}
        </p>
      )}
    </div>
  )
}

// ── Log entry row ─────────────────────────────────────────────────────────────

const LogEntryRow = ({ entry, inspectMode }: { entry: Pkcs11LogEntry; inspectMode: boolean }) => {
  const [expanded, setExpanded] = useState(false)
  const hasInspect = inspectMode && !!entry.inspect

  return (
    <div>
      <div
        role={hasInspect ? 'button' : undefined}
        tabIndex={hasInspect ? 0 : undefined}
        className={`flex items-baseline gap-2 text-xs font-mono py-0.5 ${hasInspect ? 'cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1' : ''}`}
        onClick={() => hasInspect && setExpanded((e) => !e)}
        onKeyDown={(ev) =>
          hasInspect && (ev.key === 'Enter' || ev.key === ' ') && setExpanded((e) => !e)
        }
      >
        {hasInspect && (
          <span className="text-muted-foreground shrink-0 w-3">
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </span>
        )}
        {!hasInspect && <span className="w-3" />}
        <span className="text-muted-foreground shrink-0 w-16">{entry.timestamp}</span>
        {entry.engineName === 'rust' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-warning/20 text-warning shrink-0">
            Rust
          </span>
        )}
        {entry.engineName === 'cpp' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
            C++
          </span>
        )}
        {entry.engineName === 'dual' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary/20 text-secondary shrink-0">
            Dual
          </span>
        )}
        <span className="text-foreground shrink-0">{entry.fn}</span>
        <span className="text-muted-foreground truncate">{entry.args && `(${entry.args})`}</span>
        <span className="ml-auto shrink-0">→</span>
        <span className={entry.ok ? 'text-status-success shrink-0' : 'text-status-error shrink-0'}>
          {entry.rvName}
        </span>
        <span className="text-muted-foreground shrink-0">[{entry.ms}ms]</span>
      </div>
      {expanded && entry.inspect && <InspectPanel inspect={entry.inspect} />}
      {!entry.ok && (() => {
        const ckr = lookupCkr(parseInt(entry.rvHex, 16) || 0)
        return (
          <div className="ml-8 mb-1 text-[10px] leading-relaxed">
            <span className="text-status-error">{ckr.description}</span>
            {ckr.hint && <span className="text-muted-foreground ml-1.5">— {ckr.hint}</span>}
          </div>
        )
      })()}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export const PkcsLogPanel = () => {
  const { hsmLog, clearHsmLog, inspectMode, toggleInspect } = useHsmContext()
  const [copied, setCopied] = useState(false)

  const copyAll = () => {
    const text = hsmLog
      .map(
        (e) =>
          `[${e.timestamp}]${e.engineName ? ` [${e.engineName.toUpperCase()}]` : ''} ${e.fn}(${e.args}) → ${e.rvName} ${e.rvHex} [${e.ms}ms]`
      )
      .join('\n')
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          PKCS#11 Call Log
          <span className="text-xs text-muted-foreground font-normal">({hsmLog.length} calls)</span>
        </h3>
        <div className="flex gap-2">
          <Button
            variant={inspectMode ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={toggleInspect}
            title={inspectMode ? 'Hide parameter decode' : 'Show parameter decode'}
          >
            {inspectMode ? (
              <EyeOff size={12} className="mr-1" />
            ) : (
              <Eye size={12} className="mr-1" />
            )}
            Inspect
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={hsmLog.length === 0}
            onClick={copyAll}
          >
            {copied ? (
              <CheckCircle size={12} className="mr-1 text-status-success" />
            ) : (
              <Copy size={12} className="mr-1" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearHsmLog}>
            <Trash2 size={12} className="mr-1" /> Clear
          </Button>
        </div>
      </div>

      {inspectMode && (
        <p className="text-xs text-muted-foreground">
          Click an entry to expand PKCS#11 v3.2 parameter decode.
        </p>
      )}

      {hsmLog.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No calls yet — initialize the token and run KEM or Sign operations.
        </p>
      ) : (
        <div className="space-y-0.5">
          {/* Log is newest-first from addHsmLog — reverse to show oldest-first visually */}
          {[...hsmLog].reverse().map((e) => (
            <LogEntryRow key={e.id} entry={e} inspectMode={inspectMode} />
          ))}
        </div>
      )}
    </div>
  )
}
