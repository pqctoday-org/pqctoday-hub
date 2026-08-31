// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { TtlvNode } from '@/wasm/kmip/kmipEngine'
import { tagName, ENUM_NAMES, normalizeHexKey } from '@/wasm/kmip/kmipMeta'
import { Term } from '@/components/Playground/learnkit/Term'
import { lookupGlossaryDef } from './kmip3/glossary'
import { CollapsibleValue } from '@/components/shared/CollapsibleValue'

/** Render one decoded TTLV value (leaf) compactly. ByteString/BigInteger go
 *  through CollapsibleValue (click-to-expand, same component the pipeline
 *  builders' Inspect views use) instead of a hard 48-char truncation, so
 *  Inspect can actually show a full signature/ciphertext/key here — this
 *  function now only covers the remaining scalar types. */
const renderValue = (node: TtlvNode): string => {
  if (node.value === undefined) return ''
  if (node.type === 'Enumeration') {
    const label = ENUM_NAMES[normalizeHexKey(node.tag)]?.[normalizeHexKey(String(node.value))]
    return label ? `${node.value} (${label})` : String(node.value)
  }
  return String(node.value)
}

const typeTone: Record<string, string> = {
  Structure: 'text-primary',
  Enumeration: 'text-status-warning',
  TextString: 'text-status-success',
  ByteString: 'text-status-info',
  BigInteger: 'text-status-info',
  Integer: 'text-foreground',
  Boolean: 'text-accent',
}

function Node({ node, depth, annotated }: { node: TtlvNode; depth: number; annotated?: boolean }) {
  const isStruct = node.type === 'Structure'
  const isBlob = node.type === 'ByteString' || node.type === 'BigInteger'
  const [open, setOpen] = useState(depth < 3)
  const name = tagName(node.tag)
  const caption = annotated ? lookupGlossaryDef(name) : undefined
  return (
    <div className="font-mono text-xs leading-relaxed">
      <div
        className={`flex items-start gap-1.5 ${isStruct ? 'cursor-pointer hover:bg-accent/40 rounded' : ''}`}
        style={{ paddingLeft: `${depth * 14}px` }}
        role={isStruct ? 'button' : undefined}
        tabIndex={isStruct ? 0 : undefined}
        aria-expanded={isStruct ? open : undefined}
        onClick={isStruct ? () => setOpen((o) => !o) : undefined}
        onKeyDown={
          isStruct
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setOpen((o) => !o)
                }
              }
            : undefined
        }
      >
        {isStruct ? (
          open ? (
            <ChevronDown size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="text-foreground font-semibold">
          <Term glossaryKey={name}>{name}</Term>
        </span>
        <span className={`${typeTone[node.type] ?? 'text-muted-foreground'} opacity-70`}>
          {node.type}
        </span>
        {!isStruct && isBlob && typeof node.value === 'string' && (
          <span className="flex-1 min-w-0 text-muted-foreground">
            <CollapsibleValue value={node.value} showModeToggle />
          </span>
        )}
        {!isStruct && !isBlob && (
          <span className="text-muted-foreground break-all">{renderValue(node)}</span>
        )}
        {isStruct && node.children && (
          <span className="text-muted-foreground">{`{${node.children.length}}`}</span>
        )}
      </div>
      {annotated && caption && (
        <p
          className="text-muted-foreground/80 break-words"
          style={{ paddingLeft: `${depth * 14 + 18}px` }}
        >
          {caption}
        </p>
      )}
      {isStruct &&
        open &&
        node.children?.map((c, i) => (
          <Node key={i} node={c} depth={depth + 1} annotated={annotated} />
        ))}
    </div>
  )
}

/** Renders a decoded KMIP TTLV frame as a collapsible, named tree.
 * `annotated` (used by Learn) renders a permanent one-line glossary caption
 * under every tag; Reference/Corpus/Batch leave it off and rely on hover +
 * the shared GlossaryRail to stay dense. */
export function WireTreeView({ root, annotated }: { root: TtlvNode | null; annotated?: boolean }) {
  if (!root)
    return (
      <p className="text-xs text-muted-foreground italic">
        Run an operation to see the wire response.
      </p>
    )
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 overflow-auto max-h-80">
      <Node node={root} depth={0} annotated={annotated} />
    </div>
  )
}
