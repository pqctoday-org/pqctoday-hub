// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- keys are typed rule ids /
   RuleFamily / TerminalKind, never user input. */
//
// GraphCanvas — the decision-pipeline canvas. A KMIP request enters, flows
// through the rule nodes in precedence order, and exits at Allow / Rekey / Deny.
// SVG bezier wires behind absolutely-positioned node divs; pointer-event pan +
// node drag; CSS-transform zoom. Colours/icons come from the shared rule
// catalog so List and Visual stay consistent.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Maximize2, Plus, Minus, Check, ArrowRight, Ban, ArrowDownUp, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EditablePolicy, EditableRule } from './policyEditModel'
import {
  RULE_CATALOG,
  FAMILY_META,
  FAMILY_ORDER,
  familyColor,
  summarizeRule,
  isRuleTypeId,
  type RuleFamily,
} from './ruleCatalog'
import {
  NODE_H,
  REQ,
  SINK,
  nodeW,
  portOf,
  sinkInPort,
  linkPath,
  branchPath,
  fitView,
  type Layout,
  type Dir,
  type Rect,
  type TerminalKind,
} from './graphGeometry'
import type { SimResult, SimRequest } from './policySim'

export interface FlowToken {
  x: number
  y: number
  label: string
  color: string
}

interface Props {
  policy: EditablePolicy
  layout: Layout
  sim: SimResult | null
  selectedId: string | null
  request: SimRequest
  token: FlowToken | null
  onSelect: (id: string | null) => void
  onMoveNode: (id: string, xy: { x: number; y: number }) => void
  onToggle: (id: string) => void
  onOrientation: (dir: Dir) => void
}

const TERMINAL_CFG: Record<TerminalKind, { cssVar: string; label: string; icon: typeof Check }> = {
  allow: { cssVar: '--success', label: 'ALLOW', icon: Check },
  rekey: { cssVar: '--warning', label: 'REKEY', icon: ArrowRight },
  deny: { cssVar: '--destructive', label: 'DENY', icon: Ban },
}

const familyOf = (r: EditableRule): RuleFamily | null =>
  isRuleTypeId(r.type) ? RULE_CATALOG[r.type].family : null

const nodeIsGate = (r: EditableRule): boolean =>
  isRuleTypeId(r.type) ? RULE_CATALOG[r.type].node === 'gate' : true

type DragState =
  | { kind: 'pan'; sx: number; sy: number; ox: number; oy: number }
  | { kind: 'node'; id: string; sx: number; sy: number; ox: number; oy: number }
  | null

export function GraphCanvas({
  policy,
  layout,
  sim,
  selectedId,
  request,
  token,
  onSelect,
  onMoveNode,
  onToggle,
  onOrientation,
}: Props) {
  const dir = layout.dir
  const nw = nodeW(dir)
  const [view, setView] = useState({ x: 20, y: 10, s: 0.75 })
  const [drag, setDrag] = useState<DragState>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // A rule can briefly exist in `policy.rules` before `layout.pos` has caught up
  // (the frame right after an add, or a stale/edited layout). Never deref a
  // missing position — an uncaught read here crashes the whole canvas render.
  const posOf = (id: string): { x: number; y: number } => layout.pos[id] ?? { x: 0, y: 0 }
  const rectOf = (id: string): Rect => ({
    x: posOf(id).x,
    y: posOf(id).y,
    w: nw,
    h: NODE_H,
  })
  const reqRect: Rect = { x: layout.reqPos.x, y: layout.reqPos.y, w: REQ.w, h: REQ.h }
  const sinkRect = (k: TerminalKind): Rect => ({
    x: layout.sinks[k].x,
    y: layout.sinks[k].y,
    w: SINK.w,
    h: SINK.h,
  })

  const traceById = new Map((sim?.trace ?? []).map((t) => [t.ruleId, t]))
  const verdictKind = sim?.verdict.kind ?? null
  const deciderId = sim?.deciderId ?? null

  const fit = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    setView(fitView(layout.contentW, layout.contentH, el.clientWidth, el.clientHeight))
  }, [layout.contentW, layout.contentH])

  // Auto-fit on policy size / orientation change.
  useEffect(() => {
    fit()
  }, [fit, policy.rules.length, dir])

  // ── pointer pan / node drag ──
  const onPointerDown = (e: React.PointerEvent, target: DragState) => {
    if (target?.kind === 'node') e.stopPropagation()
    setDrag(target)
  }
  useEffect(() => {
    if (!drag) return
    const move = (e: PointerEvent) => {
      const dx = e.clientX - drag.sx
      const dy = e.clientY - drag.sy
      if (drag.kind === 'pan') setView((v) => ({ ...v, x: drag.ox + dx, y: drag.oy + dy }))
      else onMoveNode(drag.id, { x: drag.ox + dx / view.s, y: drag.oy + dy / view.s })
    }
    const up = () => setDrag(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [drag, view.s, onMoveNode])

  // ── wires ──
  const chain = policy.rules
  const flowIds: string[] = []
  for (const r of chain) {
    flowIds.push(r.id)
    if (r.id === deciderId) break
  }
  const wires: { d: string; key: string; active: boolean; dim: boolean; sinkKey?: TerminalKind }[] =
    []
  chain.forEach((r, i) => {
    const a = i === 0 ? portOf(reqRect, 'out', dir) : portOf(rectOf(chain[i - 1].id), 'out', dir)
    const b = portOf(rectOf(r.id), 'in', dir)
    const onPath = !!sim && flowIds.includes(r.id) && (i === 0 || flowIds.includes(chain[i - 1].id))
    wires.push({ d: linkPath(a, b, dir), key: `w-${r.id}`, active: onPath, dim: !r.enabled })
  })
  if (chain.length) {
    const sinkKey: TerminalKind =
      verdictKind === 'deny' ? 'deny' : verdictKind === 'rekey' ? 'rekey' : 'allow'
    const lastId = deciderId ?? chain[chain.length - 1].id
    const from = deciderId
      ? portOf(rectOf(lastId), 'branch', dir)
      : portOf(rectOf(lastId), 'out', dir)
    const to = sinkInPort(sinkKey, sinkRect(sinkKey), dir)
    wires.push({
      d: deciderId ? branchPath(from, to, dir) : linkPath(from, to, dir),
      key: 'w-sink',
      active: !!sim,
      dim: false,
      sinkKey,
    })
  }

  return (
    // Pointer-only pan/deselect surface; selection + editing are fully
    // keyboard-accessible via the palette, inspector, and the node buttons.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      ref={wrapRef}
      onPointerDown={(e) =>
        onPointerDown(e, { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y })
      }
      onClick={() => onSelect(null)}
      className="relative h-full min-h-[540px] w-full overflow-hidden bg-background/40"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
        backgroundSize: '22px 22px',
        cursor: drag?.kind === 'pan' ? 'grabbing' : 'default',
      }}
    >
      {/* toolbar */}
      <div className="absolute right-3 top-3 z-20 flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 bg-card px-2 text-[11px]"
          onClick={(e) => {
            e.stopPropagation()
            onOrientation(dir === 'tb' ? 'lr' : 'tb')
          }}
        >
          <ArrowDownUp size={12} /> {dir === 'tb' ? 'Waterfall' : 'Pipeline'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 bg-card px-2 text-[11px]"
          onClick={(e) => {
            e.stopPropagation()
            fit()
          }}
        >
          <Maximize2 size={12} /> Fit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 bg-card px-2 text-[11px]"
          onClick={(e) => {
            e.stopPropagation()
            setView((v) => ({ ...v, s: 1 }))
          }}
        >
          100%
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 bg-card p-0"
          aria-label="zoom in"
          onClick={(e) => {
            e.stopPropagation()
            setView((v) => ({ ...v, s: Math.min(1.4, v.s + 0.15) }))
          }}
        >
          <Plus size={12} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 bg-card p-0"
          aria-label="zoom out"
          onClick={(e) => {
            e.stopPropagation()
            setView((v) => ({ ...v, s: Math.max(0.3, v.s - 0.15) }))
          }}
        >
          <Minus size={12} />
        </Button>
      </div>

      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${view.x}px,${view.y}px) scale(${view.s})`,
          transformOrigin: '0 0',
        }}
      >
        {/* wires behind nodes */}
        <svg
          width={layout.contentW}
          height={layout.contentH}
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
        >
          <defs>
            <marker
              id="cacp-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path
                d="M1,1 L6,4 L1,7"
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.4"
              />
            </marker>
          </defs>
          {wires.map((w) => {
            const col = w.sinkKey
              ? `hsl(var(${TERMINAL_CFG[w.sinkKey].cssVar}))`
              : w.active
                ? 'hsl(var(--primary))'
                : 'hsl(var(--muted-foreground))'
            return (
              <g key={w.key}>
                <path
                  d={w.d}
                  fill="none"
                  stroke={col}
                  strokeOpacity={w.active ? 0.9 : w.dim ? 0.25 : 0.45}
                  strokeWidth={w.active ? 3 : 2}
                  markerEnd={w.sinkKey ? undefined : 'url(#cacp-arrow)'}
                />
                {w.active && (
                  <path
                    d={w.d}
                    fill="none"
                    stroke={col}
                    strokeWidth={3}
                    strokeOpacity={0.9}
                    strokeDasharray="2 10"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="24"
                      to="0"
                      dur="0.7s"
                      repeatCount="indefinite"
                    />
                  </path>
                )}
              </g>
            )
          })}
        </svg>

        {/* request node */}
        <RequestNode reqPos={layout.reqPos} dir={dir} request={request} />

        {/* rule nodes */}
        {policy.rules.map((r, i) => {
          const fam = familyOf(r)
          const color = fam ? familyColor(fam) : 'hsl(var(--border))'
          const spec = isRuleTypeId(r.type) ? RULE_CATALOG[r.type] : undefined
          const Icon = spec?.icon
          const tr = traceById.get(r.id)
          const matched = !!tr?.matched
          const bypassed = !!sim && !!tr && !tr.matched && tr.effect !== 'off'
          const isDecider = r.id === deciderId
          const sel = r.id === selectedId
          const ip = portOf({ x: 0, y: 0, w: nw, h: NODE_H }, 'in', dir)
          const op = portOf({ x: 0, y: 0, w: nw, h: NODE_H }, 'out', dir)
          const bp = portOf({ x: 0, y: 0, w: nw, h: NODE_H }, 'branch', dir)
          const ops = r.lists.ops ?? r.lists.ops_affected ?? (r.scalars.op ? [r.scalars.op] : [])
          const maxOps = dir === 'tb' ? 4 : 2
          return (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              aria-label={`${spec?.title ?? r.type} rule #${i + 1}`}
              aria-pressed={sel}
              onPointerDown={(e) =>
                onPointerDown(e, {
                  kind: 'node',
                  id: r.id,
                  sx: e.clientX,
                  sy: e.clientY,
                  ox: posOf(r.id).x,
                  oy: posOf(r.id).y,
                })
              }
              onClick={(e) => {
                e.stopPropagation()
                onSelect(r.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(r.id)
                }
              }}
              className={cn(
                'absolute flex cursor-grab flex-col overflow-hidden rounded-xl border bg-card transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                sel && 'ring-2 ring-offset-1',
                isDecider && 'ring-2 ring-destructive'
              )}
              style={{
                left: posOf(r.id).x,
                top: posOf(r.id).y,
                width: nw,
                height: NODE_H,
                borderColor: sel || matched ? color : 'hsl(var(--border))',
                borderWidth: 1.5,
                boxShadow: sel
                  ? `0 6px 18px -8px ${fam ? familyColor(fam, 0.5) : 'transparent'}`
                  : matched
                    ? `0 4px 14px -8px ${color}`
                    : undefined,
                opacity: !r.enabled ? 0.42 : bypassed ? 0.5 : 1,
              }}
            >
              <div style={{ height: 4, background: color, opacity: r.enabled ? 1 : 0.4 }} />
              <div className="flex flex-1 flex-col gap-1 px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded"
                    style={{ background: fam ? familyColor(fam, 0.12) : 'transparent' }}
                  >
                    {Icon && <Icon size={13} style={{ color }} />}
                  </span>
                  <span className="truncate text-[12px] font-bold text-foreground">
                    {spec?.title ?? r.type}
                  </span>
                  <span className="ml-auto font-mono text-[9px] font-bold text-muted-foreground">
                    #{i + 1}
                  </span>
                  <Button
                    variant="ghost"
                    aria-label={r.enabled ? 'disable rule' : 'enable rule'}
                    title={r.enabled ? 'disable rule' : 'enable rule'}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(r.id)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex h-[15px] w-[26px] items-center rounded-full p-0.5 hover:bg-transparent"
                    style={{
                      background: r.enabled ? color : 'hsl(var(--muted-foreground))',
                      justifyContent: r.enabled ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span className="h-[11px] w-[11px] rounded-full bg-card" />
                  </Button>
                </div>
                <div className="flex min-h-[16px] items-center gap-1.5">
                  {spec?.node === 'transform' && (
                    <span
                      className="rounded px-1 py-px text-[8px] font-extrabold tracking-wide text-status-success"
                      style={{ background: 'hsl(var(--success) / 0.1)' }}
                    >
                      TRANSFORM
                    </span>
                  )}
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {summarizeRule(r)}
                  </span>
                </div>
                <div className="flex gap-1 overflow-hidden">
                  {ops.slice(0, maxOps).map((o) => (
                    <span
                      key={o}
                      className="rounded bg-muted px-1 py-px font-mono text-[9px] text-muted-foreground"
                    >
                      {o}
                    </span>
                  ))}
                  {ops.length > maxOps && (
                    <span className="text-[9px] text-muted-foreground">+{ops.length - maxOps}</span>
                  )}
                </div>
              </div>
              {/* ports */}
              <PortDot x={ip.x} y={ip.y} color="hsl(var(--muted-foreground))" />
              <PortDot x={op.x} y={op.y} color={matched ? color : 'hsl(var(--muted-foreground))'} />
              {nodeIsGate(r) && (
                <PortDot
                  x={bp.x}
                  y={bp.y}
                  color={isDecider ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}
                />
              )}
            </div>
          )
        })}

        {/* terminals */}
        {(['allow', 'rekey', 'deny'] as TerminalKind[]).map((k) => (
          <TerminalNode
            key={k}
            kind={k}
            pos={layout.sinks[k]}
            dir={dir}
            active={verdictKind === k}
            verdict={sim?.verdict ?? null}
          />
        ))}

        {/* animated token */}
        {token && (
          <div
            className="pointer-events-none absolute z-20 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border-2 px-2 py-0.5 font-mono text-[11px] font-bold text-white"
            style={{
              left: token.x,
              top: token.y,
              background: token.color,
              borderColor: 'rgba(255,255,255,0.7)',
              boxShadow: `0 4px 14px -2px ${token.color}`,
            }}
          >
            {token.label}
          </div>
        )}
      </div>

      {/* legend */}
      <div className="absolute bottom-3 left-3 z-20 flex max-w-[calc(100%-220px)] flex-wrap items-center gap-2.5 rounded-lg border border-border bg-card/90 px-2.5 py-1.5 backdrop-blur">
        <span className="text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
          {dir === 'tb' ? '↓ waterfall' : '→ pipeline'}
        </span>
        <span className="h-3.5 w-px bg-border" />
        {FAMILY_ORDER.map((f) => (
          <span
            key={f}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <span className="h-2 w-2 rounded-sm" style={{ background: familyColor(f) }} />
            {FAMILY_META[f].label}
          </span>
        ))}
        <span className="h-3.5 w-px bg-border" />
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="h-0.5 w-4" style={{ background: 'hsl(var(--primary))' }} /> live path
        </span>
      </div>
    </div>
  )
}

function PortDot({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <span
      className="pointer-events-none absolute rounded-full bg-card"
      style={{ left: x - 4, top: y - 4, width: 9, height: 9, border: `2px solid ${color}` }}
    />
  )
}

function RequestNode({
  reqPos,
  dir,
  request,
}: {
  reqPos: { x: number; y: number }
  dir: Dir
  request: SimRequest
}) {
  const port = portOf({ x: 0, y: 0, w: REQ.w, h: REQ.h }, 'out', dir)
  return (
    <div
      className="absolute flex flex-col gap-1 rounded-2xl p-3 text-white"
      style={{
        left: reqPos.x,
        top: reqPos.y,
        width: REQ.w,
        height: REQ.h,
        background: 'linear-gradient(160deg, hsl(var(--foreground)), hsl(222 47% 20%))',
        boxShadow: '0 10px 24px -10px rgba(15,23,42,.5)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <Send size={14} />
        <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85">
          Request
        </span>
      </div>
      <div className="font-mono text-[15px] font-bold">{request.op || 'Sign'}</div>
      <div className="truncate font-mono text-[11.5px] opacity-90">{request.algorithm || '—'}</div>
      <div className="mt-auto flex gap-1.5">
        <span className="rounded bg-white/15 px-1.5 py-px text-[9.5px]">
          {request.keyState || 'Active'}
        </span>
        {request.date && (
          <span className="rounded bg-white/15 px-1.5 py-px text-[9.5px]">{request.date}</span>
        )}
      </div>
      <PortDot x={port.x} y={port.y} color="hsl(var(--primary))" />
    </div>
  )
}

function TerminalNode({
  kind,
  pos,
  dir,
  active,
  verdict,
}: {
  kind: TerminalKind
  pos: { x: number; y: number }
  dir: Dir
  active: boolean
  verdict: SimResult['verdict'] | null
}) {
  const cfg = TERMINAL_CFG[kind]
  const Icon = cfg.icon
  const color = `hsl(var(${cfg.cssVar}))`
  const ip = sinkInPort(kind, { x: 0, y: 0, w: SINK.w, h: SINK.h }, dir)
  let detail = ''
  if (active && verdict) {
    if (kind === 'allow') detail = verdict.algorithm ?? ''
    else if (kind === 'rekey') detail = `${verdict.from} → ${verdict.to}`
    else detail = verdict.reason ?? ''
  }
  return (
    <div
      className={cn(
        'absolute rounded-xl border-[1.5px] p-2.5 transition-all',
        active ? 'opacity-100' : 'opacity-70'
      )}
      style={{
        left: pos.x,
        top: pos.y,
        width: SINK.w,
        minHeight: SINK.h,
        background: active ? `hsl(var(${cfg.cssVar}) / 0.12)` : 'hsl(var(--card))',
        borderColor: active ? color : 'hsl(var(--border))',
        boxShadow: active ? `0 0 0 3px hsl(var(${cfg.cssVar}) / 0.16)` : undefined,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="grid h-5 w-5 place-items-center rounded"
          style={{ background: `hsl(var(${cfg.cssVar}) / 0.14)` }}
        >
          <Icon size={13} style={{ color }} />
        </span>
        <span className="text-[12px] font-extrabold tracking-wide" style={{ color }}>
          {cfg.label}
        </span>
      </div>
      {detail && (
        <div className="mt-1 font-mono text-[11px] leading-snug text-foreground">{detail}</div>
      )}
      <PortDot x={ip.x} y={ip.y} color={active ? color : 'hsl(var(--muted-foreground))'} />
    </div>
  )
}
