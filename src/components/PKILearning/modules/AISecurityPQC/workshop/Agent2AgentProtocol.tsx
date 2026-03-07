// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Network, ShieldCheck, AlertTriangle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import type {
  TransportProtocol,
  AuthMethod,
  MessageSigning,
  SessionKEM,
  MessageFormat,
  ProtocolMetrics,
} from '../data/aiSecurityConstants'

const TRANSPORT_ITEMS = [
  { id: 'tls-1.3', label: 'TLS 1.3' },
  { id: 'dtls-1.3', label: 'DTLS 1.3' },
  { id: 'quic', label: 'QUIC' },
  { id: 'custom', label: 'Custom Protocol' },
]

const AUTH_ITEMS = [
  { id: 'mtls-ml-dsa', label: 'mTLS + ML-DSA' },
  { id: 'dpop-token', label: 'DPoP Token' },
  { id: 'pre-shared-key', label: 'Pre-Shared Key' },
]

const SIGNING_ITEMS = [
  { id: 'ml-dsa-44', label: 'ML-DSA-44' },
  { id: 'ml-dsa-65', label: 'ML-DSA-65' },
  { id: 'slh-dsa', label: 'SLH-DSA' },
  { id: 'none', label: 'None' },
]

const KEM_ITEMS = [
  { id: 'ml-kem-768', label: 'ML-KEM-768' },
  { id: 'ml-kem-1024', label: 'ML-KEM-1024' },
  { id: 'hybrid-ml-kem-x25519', label: 'Hybrid ML-KEM + X25519' },
]

const FORMAT_ITEMS = [
  { id: 'signed-json', label: 'Signed JSON' },
  { id: 'cose', label: 'COSE' },
  { id: 'protobuf-detached', label: 'Protobuf + Detached Sig' },
]

const THROUGHPUT_LEVELS = [100, 1000, 10000]

function computeMetrics(
  transport: TransportProtocol,
  auth: AuthMethod,
  signing: MessageSigning,
  kem: SessionKEM,
  format: MessageFormat
): ProtocolMetrics {
  // Base handshake bytes by transport
  const transportBase: Record<TransportProtocol, number> = {
    'tls-1.3': 4500,
    'dtls-1.3': 5200,
    quic: 3800,
    custom: 6000,
  }

  // KEM ciphertext sizes
  const kemSize: Record<SessionKEM, number> = {
    'ml-kem-768': 1088,
    'ml-kem-1024': 1568,
    'hybrid-ml-kem-x25519': 1120,
  }

  // Auth overhead
  const authOverhead: Record<AuthMethod, number> = {
    'mtls-ml-dsa': 6600,
    'dpop-token': 3900,
    'pre-shared-key': 64,
  }

  // Signing overhead per message
  const sigSize: Record<MessageSigning, number> = {
    'ml-dsa-44': 2420,
    'ml-dsa-65': 3309,
    'slh-dsa': 7856,
    none: 0,
  }

  // Format overhead
  const formatOverhead: Record<MessageFormat, number> = {
    'signed-json': 200,
    cose: 80,
    'protobuf-detached': 50,
  }

  const handshakeBytes = transportBase[transport] + kemSize[kem] + authOverhead[auth]
  const perMessageOverheadBytes = sigSize[signing] + formatOverhead[format]

  // Latency estimates
  const kemLatency: Record<SessionKEM, number> = {
    'ml-kem-768': 0.5,
    'ml-kem-1024': 0.7,
    'hybrid-ml-kem-x25519': 0.6,
  }
  const authLatency: Record<AuthMethod, number> = {
    'mtls-ml-dsa': 3,
    'dpop-token': 1.5,
    'pre-shared-key': 0.1,
  }
  const handshakeLatencyMs = kemLatency[kem] + authLatency[auth] + 10 // base RTT

  // NIST level
  const kemLevel: Record<SessionKEM, number> = {
    'ml-kem-768': 3,
    'ml-kem-1024': 5,
    'hybrid-ml-kem-x25519': 3,
  }

  const quantumSafe = signing !== 'none' && auth !== 'pre-shared-key'
  const interop: Record<TransportProtocol, number> = {
    'tls-1.3': 5,
    'dtls-1.3': 4,
    quic: 4,
    custom: 1,
  }

  return {
    handshakeBytes,
    perMessageOverheadBytes,
    handshakeLatencyMs,
    securityLevel: kemLevel[kem],
    quantumSafe,
    interoperabilityScore: interop[transport],
  }
}

// Classical baseline for comparison
const CLASSICAL_METRICS: ProtocolMetrics = {
  handshakeBytes: 4500 + 32 + 800, // TLS + X25519 + ECDSA mTLS
  perMessageOverheadBytes: 64 + 200, // ECDSA sig + JSON
  handshakeLatencyMs: 8,
  securityLevel: 0,
  quantumSafe: false,
  interoperabilityScore: 5,
}

export const Agent2AgentProtocol: React.FC = () => {
  const [transport, setTransport] = useState<TransportProtocol>('tls-1.3')
  const [auth, setAuth] = useState<AuthMethod>('mtls-ml-dsa')
  const [signing, setSigning] = useState<MessageSigning>('ml-dsa-44')
  const [kem, setKem] = useState<SessionKEM>('ml-kem-768')
  const [format, setFormat] = useState<MessageFormat>('signed-json')

  const metrics = useMemo(
    () => computeMetrics(transport, auth, signing, kem, format),
    [transport, auth, signing, kem, format]
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Agent-to-Agent Protocol</h3>
        <p className="text-sm text-muted-foreground">
          Design a PQC-secured communication protocol for autonomous agent-to-agent interactions.
          Compare bandwidth, latency, and security against classical baselines.
        </p>
      </div>

      {/* Protocol config */}
      <div className="glass-panel p-4 space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Network size={16} className="text-primary" />
          Protocol Configuration
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Transport</p>
            <FilterDropdown
              items={TRANSPORT_ITEMS}
              selectedId={transport}
              onSelect={(id) => setTransport(id as TransportProtocol)}
              label="Transport"
              defaultLabel="Select"
              noContainer
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Authentication</p>
            <FilterDropdown
              items={AUTH_ITEMS}
              selectedId={auth}
              onSelect={(id) => setAuth(id as AuthMethod)}
              label="Auth"
              defaultLabel="Select"
              noContainer
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Message Signing</p>
            <FilterDropdown
              items={SIGNING_ITEMS}
              selectedId={signing}
              onSelect={(id) => setSigning(id as MessageSigning)}
              label="Signing"
              defaultLabel="Select"
              noContainer
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Session KEM</p>
            <FilterDropdown
              items={KEM_ITEMS}
              selectedId={kem}
              onSelect={(id) => setKem(id as SessionKEM)}
              label="KEM"
              defaultLabel="Select"
              noContainer
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Message Format</p>
            <FilterDropdown
              items={FORMAT_ITEMS}
              selectedId={format}
              onSelect={(id) => setFormat(id as MessageFormat)}
              label="Format"
              defaultLabel="Select"
              noContainer
            />
          </div>
        </div>
      </div>

      {/* Readiness matrix */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3">Readiness Matrix</h4>
        <div className="glass-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Metric</th>
                <th className="text-center p-3 text-status-error font-medium">Classical</th>
                <th className="text-center p-3 text-primary font-medium">Your Config</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Handshake Size</td>
                <td className="text-center p-3 font-mono">
                  {(CLASSICAL_METRICS.handshakeBytes / 1024).toFixed(1)} KB
                </td>
                <td className="text-center p-3 font-mono">
                  {(metrics.handshakeBytes / 1024).toFixed(1)} KB
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Per-Message Overhead</td>
                <td className="text-center p-3 font-mono">
                  {CLASSICAL_METRICS.perMessageOverheadBytes} B
                </td>
                <td className="text-center p-3 font-mono">{metrics.perMessageOverheadBytes} B</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Handshake Latency</td>
                <td className="text-center p-3 font-mono">
                  {CLASSICAL_METRICS.handshakeLatencyMs}ms
                </td>
                <td className="text-center p-3 font-mono">
                  {metrics.handshakeLatencyMs.toFixed(1)}ms
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Security Level</td>
                <td className="text-center p-3">
                  <AlertTriangle size={14} className="text-status-error inline" /> None
                </td>
                <td className="text-center p-3">
                  {metrics.quantumSafe ? (
                    <span className="inline-flex items-center gap-1 text-status-success">
                      <ShieldCheck size={14} /> NIST {metrics.securityLevel}
                    </span>
                  ) : (
                    <span className="text-status-warning">Partial</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-foreground">Interoperability</td>
                <td className="text-center p-3">
                  {'★'.repeat(CLASSICAL_METRICS.interoperabilityScore)}
                </td>
                <td className="text-center p-3">
                  {'★'.repeat(metrics.interoperabilityScore)}
                  {'☆'.repeat(5 - metrics.interoperabilityScore)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Throughput analysis */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Throughput Analysis</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THROUGHPUT_LEVELS.map((rate) => {
            const classicalBW = (rate * CLASSICAL_METRICS.perMessageOverheadBytes) / 1024
            const pqcBW = (rate * metrics.perMessageOverheadBytes) / 1024
            const overheadPct = classicalBW > 0 ? ((pqcBW - classicalBW) / classicalBW) * 100 : 0
            return (
              <div key={rate} className="glass-panel p-3 text-center">
                <p className="text-sm font-bold text-foreground">{rate.toLocaleString()} msg/s</p>
                <div className="mt-2 text-xs space-y-1">
                  <p className="text-muted-foreground">
                    Classical:{' '}
                    <span className="text-foreground">{classicalBW.toFixed(1)} KB/s</span>
                  </p>
                  <p className="text-muted-foreground">
                    PQC: <span className="text-primary">{pqcBW.toFixed(1)} KB/s</span>
                  </p>
                  <p className="text-status-warning font-medium">+{overheadPct.toFixed(0)}%</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
