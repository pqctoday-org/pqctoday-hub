// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { useVpnPacketStore, type VpnPacket } from '@/store/useVpnPacketStore'
import { EXCHANGE_TYPE } from '@/utils/isakmp'

interface VpnWireVisualizationProps {
  /** When true, the responder rail shows "Tunnel Established". */
  tunnelEstablished: boolean
  /** Active MTU; packets with bytes.length > mtu render as fragmented or dropped. */
  mtu: number
  /** When false, oversized packets render as dropped instead of fragmented. */
  fragmentationEnabled: boolean
}

const RAIL_X_INIT = 80
const RAIL_X_RESP = 420
const RAIL_TOP = 60
const ROW_HEIGHT = 56
const BUBBLE_RADIUS_MIN = 8
const BUBBLE_RADIUS_MAX = 28

const bubbleRadius = (size: number): number => {
  if (size <= 0) return BUBBLE_RADIUS_MIN
  // log scale: 100 bytes → ~10, 1000 → ~14, 5000 → ~22
  const scaled = Math.log10(size) * 6
  return Math.max(BUBBLE_RADIUS_MIN, Math.min(BUBBLE_RADIUS_MAX, scaled))
}

interface BubbleStatus {
  color: string
  status: 'ok' | 'fragmented' | 'dropped'
  label: string
}

const classifyPacket = (
  packet: VpnPacket,
  mtu: number,
  fragmentationEnabled: boolean
): BubbleStatus => {
  const exchangeType = packet.header?.exchangeType ?? 0
  const oversized = packet.bytes.length > mtu
  if (oversized && !fragmentationEnabled) {
    return { color: 'fill-destructive', status: 'dropped', label: 'DROPPED' }
  }
  if (oversized) {
    return { color: 'fill-warning', status: 'fragmented', label: 'FRAG' }
  }
  if (exchangeType === EXCHANGE_TYPE.IKE_SA_INIT) {
    return { color: 'fill-primary', status: 'ok', label: 'SA_INIT' }
  }
  if (exchangeType === EXCHANGE_TYPE.IKE_INTERMEDIATE) {
    return { color: 'fill-accent', status: 'ok', label: 'INT' }
  }
  if (exchangeType === EXCHANGE_TYPE.IKE_AUTH) {
    return { color: 'fill-success', status: 'ok', label: 'AUTH' }
  }
  return { color: 'fill-muted-foreground', status: 'ok', label: packet.header?.exchangeName ?? '?' }
}

export const VpnWireVisualization: React.FC<VpnWireVisualizationProps> = ({
  tunnelEstablished,
  mtu,
  fragmentationEnabled,
}) => {
  const packets = useVpnPacketStore((s) => s.packets)
  const selectPacket = useVpnPacketStore((s) => s.selectPacket)
  const selectedIndex = useVpnPacketStore((s) => s.selectedIndex)

  const totalBytesInFlight = useMemo(
    () => packets.reduce((sum, p) => sum + p.bytes.length, 0),
    [packets]
  )

  const svgHeight = Math.max(280, RAIL_TOP + (packets.length + 1) * ROW_HEIGHT + 40)

  return (
    <div className="glass-panel p-4 flex flex-col gap-3" data-testid="vpn-wire-viz">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gradient">The Wire</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Bytes in flight:{' '}
            <span className="font-mono text-foreground">{totalBytesInFlight.toLocaleString()}</span>
          </span>
          <span>
            Packets: <span className="font-mono text-foreground">{packets.length}</span>
          </span>
        </div>
      </div>

      <div className="relative overflow-auto rounded-lg border border-border bg-card/40">
        <svg
          width={500}
          height={svgHeight}
          viewBox={`0 0 500 ${svgHeight}`}
          className="block w-full"
          role="img"
          aria-label="IKEv2 packet sequence diagram"
        >
          {/* Rails */}
          <line
            x1={RAIL_X_INIT}
            y1={RAIL_TOP - 20}
            x2={RAIL_X_INIT}
            y2={svgHeight - 20}
            className="stroke-border"
            strokeWidth={2}
            strokeDasharray="3,3"
          />
          <line
            x1={RAIL_X_RESP}
            y1={RAIL_TOP - 20}
            x2={RAIL_X_RESP}
            y2={svgHeight - 20}
            className="stroke-border"
            strokeWidth={2}
            strokeDasharray="3,3"
          />

          {/* Rail labels */}
          <text
            x={RAIL_X_INIT}
            y={RAIL_TOP - 32}
            textAnchor="middle"
            className="fill-foreground text-xs font-semibold"
          >
            Initiator
          </text>
          <text
            x={RAIL_X_INIT}
            y={RAIL_TOP - 18}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] font-mono"
          >
            192.168.0.1
          </text>
          <text
            x={RAIL_X_RESP}
            y={RAIL_TOP - 32}
            textAnchor="middle"
            className="fill-foreground text-xs font-semibold"
          >
            Responder
          </text>
          <text
            x={RAIL_X_RESP}
            y={RAIL_TOP - 18}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] font-mono"
          >
            192.168.0.2
          </text>

          {/* Tunnel established indicator */}
          {tunnelEstablished && (
            <line
              x1={RAIL_X_INIT}
              y1={svgHeight - 25}
              x2={RAIL_X_RESP}
              y2={svgHeight - 25}
              className="stroke-success"
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}

          {packets.map((packet, idx) => {
            const status = classifyPacket(packet, mtu, fragmentationEnabled)
            const y = RAIL_TOP + idx * ROW_HEIGHT
            const fromInit = packet.srcIp === '192.168.0.1'
            const x1 = fromInit ? RAIL_X_INIT : RAIL_X_RESP
            const x2 = fromInit ? RAIL_X_RESP : RAIL_X_INIT
            const radius = bubbleRadius(packet.bytes.length)
            const isSelected = idx === selectedIndex
            return (
              <g
                key={packet.seq}
                onClick={() => selectPacket(idx)}
                style={{ cursor: 'pointer' }}
                aria-label={`Packet ${packet.seq}: ${status.label} ${packet.bytes.length} bytes`}
              >
                {/* arrow line */}
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  className={status.status === 'dropped' ? 'stroke-destructive' : 'stroke-border'}
                  strokeWidth={isSelected ? 2 : 1}
                  markerEnd="url(#arrow)"
                  strokeDasharray={status.status === 'dropped' ? '6,4' : undefined}
                />
                {/* bubble at midpoint */}
                <circle
                  cx={(x1 + x2) / 2}
                  cy={y}
                  r={radius}
                  className={status.color}
                  opacity={isSelected ? 1 : 0.85}
                  stroke={isSelected ? 'currentColor' : 'none'}
                  strokeWidth={2}
                />
                {/* label */}
                <text
                  x={(x1 + x2) / 2}
                  y={y + 4}
                  textAnchor="middle"
                  className="fill-card text-[10px] font-bold pointer-events-none"
                >
                  {status.label}
                </text>
                {/* size readout */}
                <text
                  x={(x1 + x2) / 2}
                  y={y + radius + 14}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] font-mono pointer-events-none"
                >
                  {packet.bytes.length.toLocaleString()} B
                </text>
                {/* fragment slicing visual */}
                {status.status === 'fragmented' && (
                  <g>
                    {[0, 1, 2].map((i) => (
                      <circle
                        key={i}
                        cx={(x1 + x2) / 2 + (i - 1) * 14}
                        cy={y - radius - 8}
                        r={4}
                        className="fill-warning"
                        opacity={0.7}
                      />
                    ))}
                  </g>
                )}
              </g>
            )
          })}

          {/* arrowhead marker */}
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX={9}
              refY={5}
              markerWidth={6}
              markerHeight={6}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground" />
            </marker>
          </defs>

          {packets.length === 0 && (
            <text
              x={250}
              y={svgHeight / 2}
              textAnchor="middle"
              className="fill-muted-foreground text-sm"
            >
              No packets yet — click "Establish IKEv2 Tunnel" to begin.
            </text>
          )}
        </svg>
      </div>
    </div>
  )
}
