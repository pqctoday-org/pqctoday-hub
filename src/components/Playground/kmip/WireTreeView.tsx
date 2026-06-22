// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { TtlvNode } from '@/wasm/kmip/kmipEngine'
import { tagName, ENUM_NAMES } from '@/wasm/kmip/kmipMeta'

/** Render one decoded TTLV value (leaf) compactly, truncating long blobs. */
const renderValue = (node: TtlvNode): string => {
  if (node.value === undefined) return ''
  if (node.type === 'Enumeration') {
    const label = ENUM_NAMES[node.tag.toUpperCase()]?.[String(node.value).toUpperCase()]
    return label ? `${node.value} (${label})` : String(node.value)
  }
  if (
    (node.type === 'ByteString' || node.type === 'BigInteger') &&
    typeof node.value === 'string'
  ) {
    const hex = node.value
    return hex.length > 48
      ? `${hex.slice(0, 48)}… (${hex.length / 2} bytes)`
      : `${hex} (${hex.length / 2} bytes)`
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

function Node({ node, depth }: { node: TtlvNode; depth: number }) {
  const isStruct = node.type === 'Structure'
  const [open, setOpen] = useState(depth < 3)
  const name = tagName(node.tag)
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
        <span className="text-foreground font-semibold">{name}</span>
        <span className={`${typeTone[node.type] ?? 'text-muted-foreground'} opacity-70`}>
          {node.type}
        </span>
        {!isStruct && <span className="text-muted-foreground break-all">{renderValue(node)}</span>}
        {isStruct && node.children && (
          <span className="text-muted-foreground/60">{`{${node.children.length}}`}</span>
        )}
      </div>
      {isStruct &&
        open &&
        node.children?.map((c, i) => <Node key={i} node={c} depth={depth + 1} />)}
    </div>
  )
}

/** Renders a decoded KMIP TTLV frame as a collapsible, named tree. */
export function WireTreeView({ root }: { root: TtlvNode | null }) {
  if (!root)
    return (
      <p className="text-xs text-muted-foreground italic">
        Run an operation to see the wire response.
      </p>
    )
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 overflow-auto max-h-80">
      <Node node={root} depth={0} />
    </div>
  )
}
