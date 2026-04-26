// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { useVpnPacketStore } from '@/store/useVpnPacketStore'
import { EXCHANGE_TYPE } from '@/utils/isakmp'
import { Check, X } from 'lucide-react'

/** Mirrors IKEv2Mode in @/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants. */
export type ScorecardKeMode = 'classical' | 'hybrid' | 'pure-pqc'

interface VpnScorecardProps {
  tunnelEstablished: boolean
  /** Selected key-exchange mode. */
  keMode: ScorecardKeMode
  /** Auth alg name (e.g. 'RSA-2048' or 'ML-DSA-65'). */
  authAlg: string
  /** Whether IKEv2 fragmentation was enabled in the run. */
  fragmentationEnabled: boolean
  /** Active MTU. Used to detect whether fragmentation actually triggered. */
  mtu: number
}

// Reference baselines for classical IKEv2 (single-roundtrip ECDH + RSA).
// Captures upstream strongSwan tcpdumps at default MTU 1500. These are
// approximations — good enough for "vs classical" framing in the UI.
const CLASSICAL_BASELINE_BYTES = 720
const CLASSICAL_BASELINE_ROUND_TRIPS = 2

const Indicator: React.FC<{ on: boolean; label: string; subtitle?: string }> = ({
  on,
  label,
  subtitle,
}) => (
  <div className="flex items-center gap-2">
    {on ? (
      <Check className="h-4 w-4 text-success" aria-hidden="true" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    )}
    <span className="flex flex-col">
      <span className={on ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      {subtitle && <span className="text-[10px] text-muted-foreground">{subtitle}</span>}
    </span>
  </div>
)

export const VpnScorecard: React.FC<VpnScorecardProps> = ({
  tunnelEstablished,
  keMode,
  authAlg,
  fragmentationEnabled,
  mtu,
}) => {
  const packets = useVpnPacketStore((s) => s.packets)

  const stats = useMemo(() => {
    const totalBytes = packets.reduce((sum, p) => sum + p.bytes.length, 0)
    // Round trips ~= count of distinct message-id pairs initiator↔responder
    const exchangeTypes = new Set<number>()
    let intermediateSeen = false
    let authSeen = false
    let oversizedSeen = false
    for (const p of packets) {
      if (p.header) {
        exchangeTypes.add(p.header.exchangeType)
        if (p.header.exchangeType === EXCHANGE_TYPE.IKE_INTERMEDIATE) intermediateSeen = true
        if (p.header.exchangeType === EXCHANGE_TYPE.IKE_AUTH) authSeen = true
      }
      if (p.bytes.length > mtu) oversizedSeen = true
    }
    return {
      totalBytes,
      roundTrips: exchangeTypes.size, // one round trip per exchange type
      intermediateSeen,
      authSeen,
      oversizedSeen,
    }
  }, [packets, mtu])

  if (!tunnelEstablished) return null

  const overheadPct =
    stats.totalBytes > 0 ? Math.round((stats.totalBytes / CLASSICAL_BASELINE_BYTES - 1) * 100) : 0

  const pqKeOn = keMode !== 'classical'
  const pqAuthOn = authAlg.toLowerCase().includes('ml-dsa')
  const rfc7383On = fragmentationEnabled && stats.oversizedSeen
  const rfc9242On = stats.intermediateSeen
  const rfc9370On = keMode === 'hybrid'

  return (
    <div
      className="glass-panel p-4 flex flex-col gap-3"
      data-testid="vpn-scorecard"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full bg-success shadow-glow-sm"
          aria-hidden="true"
        />
        <h3 className="text-lg font-semibold text-gradient">Tunnel Established</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Total bytes on wire</span>
          <span className="font-mono text-base text-foreground">
            {stats.totalBytes.toLocaleString()}
          </span>
          <span className={`text-[10px] ${overheadPct >= 0 ? 'text-warning' : 'text-success'}`}>
            vs ~{CLASSICAL_BASELINE_BYTES.toLocaleString()} classical ({overheadPct >= 0 ? '+' : ''}
            {overheadPct}%)
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Round trips</span>
          <span className="font-mono text-base text-foreground">{stats.roundTrips}</span>
          <span className="text-[10px] text-muted-foreground">
            vs {CLASSICAL_BASELINE_ROUND_TRIPS} classical
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Packets</span>
          <span className="font-mono text-base text-foreground">{packets.length}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">MTU</span>
          <span className="font-mono text-base text-foreground">{mtu} B</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Indicator on={pqKeOn} label="PQC key exchange" subtitle={pqKeOn ? 'ML-KEM-768' : ''} />
        <Indicator
          on={pqAuthOn}
          label="PQC authentication"
          subtitle={pqAuthOn ? authAlg.toUpperCase() : authAlg.toUpperCase()}
        />
        <Indicator on={rfc9370On} label="RFC 9370 (Multiple KE)" />
        <Indicator on={rfc9242On} label="RFC 9242 (IKE_INTERMEDIATE)" />
        <Indicator on={rfc7383On} label="RFC 7383 (IKEv2 Fragmentation)" />
      </div>
    </div>
  )
}
