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

// Reference baselines for classical IKEv2 (two-roundtrip ECDH + auth).
// Matches the classical-mode totalBytes model in
// @/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants so the
// "vs classical" framing is consistent with the rest of the workshop.
const CLASSICAL_BASELINE_BYTES = 1784
const CLASSICAL_BASELINE_ROUND_TRIPS = 2

const Indicator: React.FC<{ on: boolean; label: string; subtitle?: string }> = ({
  on,
  label,
  subtitle,
}) => (
  <div className="flex items-center gap-2">
    {on ? (
      <Check className="h-4 w-4 text-status-success" aria-hidden="true" />
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
    // One round trip per distinct (exchangeType, messageId) request/response
    // pair. Handles multiple IKE_INTERMEDIATE rounds (RFC 9370 allows up to
    // 7, each with its own Message ID) and excludes INFORMATIONAL traffic.
    const handshakeMsgIds = new Set<string>()
    let intermediateSeen = false
    let authSeen = false
    let oversizedSeen = false
    let skfSeen = false
    for (const p of packets) {
      if (p.header) {
        if (p.header.exchangeType !== EXCHANGE_TYPE.INFORMATIONAL) {
          handshakeMsgIds.add(`${p.header.exchangeType}:${p.header.messageId}`)
        }
        if (p.header.exchangeType === EXCHANGE_TYPE.IKE_INTERMEDIATE) intermediateSeen = true
        if (p.header.exchangeType === EXCHANGE_TYPE.IKE_AUTH) authSeen = true
        // Next Payload 53 = Encrypted and Authenticated Fragment (SKF,
        // RFC 7383) — a real fragment on the wire.
        if (p.header.nextPayload === 53) skfSeen = true
      }
      if (p.bytes.length > mtu) oversizedSeen = true
    }
    return {
      totalBytes,
      roundTrips: handshakeMsgIds.size,
      intermediateSeen,
      authSeen,
      oversizedSeen,
      skfSeen,
    }
  }, [packets, mtu])

  if (!tunnelEstablished) return null

  const overheadPct =
    stats.totalBytes > 0 ? Math.round((stats.totalBytes / CLASSICAL_BASELINE_BYTES - 1) * 100) : 0

  const pqKeOn = keMode !== 'classical'
  const pqAuthOn = authAlg.toLowerCase().includes('ml-dsa')
  // Real SKF fragments observed on the wire; the oversized fallback covers
  // builds where charon sends whole messages regardless of MTU.
  const rfc7383On = stats.skfSeen || (fragmentationEnabled && stats.oversizedSeen)
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
          className="inline-block h-2.5 w-2.5 rounded-full bg-status-success shadow-glow-sm"
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
          <span
            className={`text-[10px] ${overheadPct >= 0 ? 'text-status-warning' : 'text-status-success'}`}
          >
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
        <Indicator on={pqAuthOn} label="PQC authentication" subtitle={authAlg.toUpperCase()} />
        <Indicator on={rfc9370On} label="RFC 9370 (Multiple KE)" />
        <Indicator on={rfc9242On} label="RFC 9242 (IKE_INTERMEDIATE)" />
        <Indicator on={rfc7383On} label="RFC 7383 (IKEv2 Fragmentation)" />
      </div>
    </div>
  )
}
