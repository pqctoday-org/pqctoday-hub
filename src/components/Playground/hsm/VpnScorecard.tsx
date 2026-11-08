// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo } from 'react'
import { useVpnPacketStore } from '@/store/useVpnPacketStore'
import { EXCHANGE_TYPE } from '@/utils/isakmp'
import { Circle, CircleDot } from 'lucide-react'
import { IKE_V2_EXCHANGES } from '@/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants'

/** Mirrors IKEv2Mode in @/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants. */
export type ScorecardKeMode = 'classical' | 'hybrid' | 'pure-pqc'

interface VpnScorecardProps {
  tunnelEstablished: boolean
  /** Selected key-exchange mode. */
  keMode: ScorecardKeMode
  /** Auth alg name (e.g. 'RSA-2048' or 'ML-DSA-65'). */
  authAlg: string
  /** Current fragmentation preference, not observed peer support. */
  fragmentationEnabled: boolean
  /** Current requested MTU; not a packet-fragment validation result. */
  mtu: number
  /** Selected ML-KEM parameter set (512/768/1024). Defaults to 768 for callers
   * that predate the KEM-size selector. */
  kemSize?: 512 | 768 | 1024
}

// Reference baselines for classical IKEv2 (two-roundtrip ECP-256 + PSK auth),
// read from the classical-mode model in ikev2Constants so the "vs classical"
// framing always matches the rest of the workshop.
const CLASSICAL_BASELINE_BYTES = IKE_V2_EXCHANGES.classical.totalBytes
const CLASSICAL_BASELINE_ROUND_TRIPS = 2

const Indicator: React.FC<{ on: boolean; label: string; subtitle?: string }> = ({
  on,
  label,
  subtitle,
}) => (
  <div className="flex items-center gap-2">
    {on ? (
      <CircleDot className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    ) : (
      <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
  kemSize = 768,
}) => {
  const packets = useVpnPacketStore((s) => s.packets)

  const stats = useMemo(() => {
    const totalBytes = packets.reduce((sum, p) => sum + p.bytes.length, 0)
    // Distinct captured header IDs, not proof of paired requests/responses.
    // Preserve the existing count and exclusion of INFORMATIONAL traffic.
    const handshakeMsgIds = new Set<string>()
    let intermediateSeen = false
    let authSeen = false
    let skfSeen = false
    for (const p of packets) {
      if (p.header) {
        if (p.header.exchangeType !== EXCHANGE_TYPE.INFORMATIONAL) {
          handshakeMsgIds.add(`${p.header.exchangeType}:${p.header.messageId}`)
        }
        if (p.header.exchangeType === EXCHANGE_TYPE.IKE_INTERMEDIATE) intermediateSeen = true
        if (p.header.exchangeType === EXCHANGE_TYPE.IKE_AUTH) authSeen = true
        // Header value 53 identifies SKF; this does not validate its body,
        // peer support negotiation or successful reassembly.
        if (p.header.nextPayload === 53) skfSeen = true
      }
    }
    return {
      totalBytes,
      roundTrips: handshakeMsgIds.size,
      intermediateSeen,
      authSeen,
      skfSeen,
    }
  }, [packets])

  if (!tunnelEstablished) return null

  const overheadPct =
    stats.totalBytes > 0 ? Math.round((stats.totalBytes / CLASSICAL_BASELINE_BYTES - 1) * 100) : 0

  const pqKeOn = keMode !== 'classical'

  return (
    <div
      className="glass-panel p-4 flex flex-col gap-3"
      data-testid="vpn-scorecard"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground"
          aria-hidden="true"
        />
        <h3 className="text-lg font-semibold text-gradient">Capture and current requests</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Retained UDP payload bytes</span>
          <span className="font-mono text-base text-foreground">
            {stats.totalBytes.toLocaleString()}
          </span>
          <span
            className={`text-[10px] ${overheadPct >= 0 ? 'text-status-warning' : 'text-status-success'}`}
          >
            {packets.length > 0 ? (
              <>
                vs ~{CLASSICAL_BASELINE_BYTES.toLocaleString()} illustrative classical baseline (
                {overheadPct >= 0 ? '+' : ''}
                {overheadPct}%)
              </>
            ) : (
              'No retained capture; comparison not assessed'
            )}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Distinct captured exchange IDs</span>
          <span className="font-mono text-base text-foreground">{stats.roundTrips}</span>
          <span className="text-[10px] text-muted-foreground">
            Classical example assumes {CLASSICAL_BASELINE_ROUND_TRIPS} round trips; this header-ID
            count does not measure round trips.
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Retained packets</span>
          <span className="font-mono text-base text-foreground">{packets.length}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Requested MTU</span>
          <span className="font-mono text-base text-foreground">{mtu} B</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Current selections are requests, not negotiated outcomes. Retained headers do not establish
        peer authentication, protocol conformance or fragment reassembly. Capture may be incomplete;
        byte totals exclude IP/UDP overhead and are not complete network traffic measurements.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Indicator
          on={pqKeOn}
          label="Current key-exchange request"
          subtitle={pqKeOn ? `${keMode}: ML-KEM-${kemSize}` : 'Classical'}
        />
        <Indicator
          on={false}
          label="Initiator authentication request"
          subtitle={authAlg.toUpperCase()}
        />
        <Indicator
          on={fragmentationEnabled}
          label="Current fragmentation preference"
          subtitle={fragmentationEnabled ? 'Enabled; peer support not assessed' : 'Disabled'}
        />
        <Indicator
          on={stats.intermediateSeen}
          label="IKE_INTERMEDIATE header"
          subtitle={
            stats.intermediateSeen
              ? 'Observed in retained capture'
              : 'Not observed in retained capture'
          }
        />
        <Indicator
          on={stats.authSeen}
          label="IKE_AUTH header"
          subtitle={
            stats.authSeen
              ? 'Observed; peer authentication not assessed'
              : 'Not observed in retained capture'
          }
        />
        <Indicator
          on={stats.skfSeen}
          label="SKF header (Next Payload 53)"
          subtitle={
            stats.skfSeen
              ? 'Observed; fragment validity and reassembly not assessed'
              : 'Not observed in retained capture'
          }
        />
      </div>
    </div>
  )
}
