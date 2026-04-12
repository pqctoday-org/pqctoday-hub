// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pkcs11InspectPanel — renders a decoded Pkcs11LogInspect record.
 *
 * Shared by PkcsLogPanel (Playground) and Pkcs11LogPanel (learning modules).
 * Pure presentational component — no side effects, no context dependencies.
 */
import { useState } from 'react'
import type { Pkcs11LogInspect, InspectSection, DecodedAttribute } from '../../wasm/pkcs11Inspect'

const CollapsibleValue = ({ value, isOutput = false }: { value: string; isOutput?: boolean }) => {
  const [expanded, setExpanded] = useState(false)

  // Only collapse long payload strings
  if (value.length <= 40) {
    return <span className={isOutput ? 'text-status-success' : 'text-foreground'}>{value}</span>
  }

  return (
    <div className="flex flex-col w-full">
      <div
        role="button"
        tabIndex={0}
        className={`flex items-center gap-1 text-[11px] select-none text-left appearance-none bg-transparent border-none p-0 cursor-pointer hover:underline ${isOutput ? 'text-status-success' : 'text-foreground'}`}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded(!expanded)
          }
        }}
      >
        <span className="text-[9px] opacity-70">{expanded ? '▼' : '▶'}</span>
        {expanded ? 'Hide payload' : 'Show payload'}
        <span className="text-muted-foreground opacity-50 ml-1">
          ({Math.floor(value.length / 2)} bytes)
        </span>
      </div>
      {expanded && (
        <div className="mt-1.5 p-2 bg-background/50 rounded border border-border/30 max-h-40 overflow-y-auto break-all font-mono text-[10px] leading-relaxed select-text">
          {value}
        </div>
      )}
    </div>
  )
}

export const AttributeRow = ({ attr }: { attr: DecodedAttribute }) => (
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
            <div className="flex-1 min-w-0">
              <CollapsibleValue value={p.value} />
            </div>
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

export const InspectPanel = ({ inspect }: { inspect: Pkcs11LogInspect }) => (
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
              <div className="flex-1 min-w-0">
                <CollapsibleValue value={o.value} isOutput />
              </div>
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
