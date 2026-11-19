// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Cpu, AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GRID_LINK_PROFILES, GRID_CRYPTO_MECHANISMS } from '../data/energyGridData'

export const SubstationMtuBudget: React.FC = () => {
  const [selectedLinkId, setSelectedLinkId] = useState<string>('goose-l2')
  const [selectedMechId, setSelectedMechId] = useState<string>('ml-dsa-44')
  const [appPayloadBytes, setAppPayloadBytes] = useState<number>(180)

  const link = GRID_LINK_PROFILES.find((l) => l.id === selectedLinkId) ?? GRID_LINK_PROFILES[0]
  const mech =
    GRID_CRYPTO_MECHANISMS.find((m) => m.id === selectedMechId) ?? GRID_CRYPTO_MECHANISMS[0]

  const totalFrameBytes = link.headerOverheadBytes + appPayloadBytes + mech.wirePayloadBytes
  const fragmentsRequired = Math.ceil(totalFrameBytes / link.mtuBytes)
  const serializationMs = Number(
    (((totalFrameBytes * 8) / (link.throughputKbps * 1000)) * 1000).toFixed(2)
  )
  const estimatedLatencyMs = Number((serializationMs + mech.typicalComputeMs).toFixed(2))

  const exceedsMtu = totalFrameBytes > link.mtuBytes
  const exceedsLatency = estimatedLatencyMs > link.latencyBudgetMs
  const isL2NoFragFail = link.id === 'goose-l2' && exceedsMtu
  const isQuantumVulnerable = mech.quantumStatus === 'vulnerable'

  const verdict = (() => {
    if (isL2NoFragFail || exceedsLatency) {
      return {
        status: 'FAIL — Exceeds Hard Real-Time / Layer 2 Constraint',
        tone: 'border-status-error/50 bg-status-error/10 text-status-error',
        icon: <AlertTriangle size={17} className="shrink-0" />,
        guidance:
          link.id === 'goose-l2'
            ? `${mech.label} adds ${mech.wirePayloadBytes.toLocaleString()} bytes on the wire (${totalFrameBytes.toLocaleString()} B total vs. ${link.mtuBytes.toLocaleString()} B L2 Ethernet MTU). Layer 2 GOOSE/SV frames cannot fragment and must meet <${link.latencyBudgetMs} ms. Use HMAC-SHA-256 (32 B) on the protection loop and move ML-KEM-768 / ML-DSA to out-of-band GDOI/TLS key distribution.`
            : `Estimated ${estimatedLatencyMs} ms exceeds the ${link.latencyBudgetMs} ms budget on ${link.name}. Offload asymmetric operations to session setup and use symmetric MACs per message.`,
      }
    }
    if (isQuantumVulnerable) {
      return {
        status: 'LEGACY — Fits Link Budget, but Quantum-Vulnerable',
        tone: 'border-status-warning/50 bg-status-warning/10 text-status-warning',
        icon: <ShieldAlert size={17} className="shrink-0" />,
        guidance: `${mech.label} fits within the ${link.mtuBytes.toLocaleString()}-byte MTU and ${link.latencyBudgetMs} ms budget, but is broken by Shor’s algorithm and deprecated by 2030 under NIST IR 8547.`,
      }
    }
    if (exceedsMtu) {
      return {
        status: 'CAUTION — Multi-Frame Fragmentation Required',
        tone: 'border-status-warning/50 bg-status-warning/10 text-status-warning',
        icon: <AlertTriangle size={17} className="shrink-0" />,
        guidance: `${mech.label} requires ${fragmentsRequired} frames (${totalFrameBytes.toLocaleString()} B vs. ${link.mtuBytes.toLocaleString()} B MTU). Acceptable for infrequent control-plane session setup (TLS 1.3 / IKEv2 with RFC 7383 fragmentation) on IP links, but avoid per-message use on constrained ${link.name} links.`,
      }
    }
    return {
      status: 'PASS — Quantum-Safe & Within Link Budget',
      tone: 'border-status-success/50 bg-status-success/10 text-status-success',
      icon: <CheckCircle2 size={17} className="shrink-0" />,
      guidance: `${mech.label} fits in a single ${link.mtuBytes.toLocaleString()}-byte frame (${totalFrameBytes.toLocaleString()} B total) and completes in ~${estimatedLatencyMs} ms (within the ${link.latencyBudgetMs} ms budget). Pair symmetric MACs with PQC-protected key distribution.`,
    }
  })()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Educational MTU &amp; Latency Budget Lab:</strong> Compare exact FIPS 203/204 wire
          sizes (ML-KEM-768 ciphertext 1,088 B / pk 1,184 B; ML-DSA-44 sig 2,420 B; ML-DSA-65 sig
          3,309 B) against ECDSA P-256 (64 B), RSA-2048 (256 B), and symmetric HMAC-SHA-256 (32 B).
          Timing figures are illustrative engineering estimates — verify on vendor HIL testbeds in
          production.
        </span>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">1. Select Utility Link Profile</h3>
          <div role="group" aria-label="Select utility link profile" className="space-y-2">
            {GRID_LINK_PROFILES.map((profile) => {
              const active = profile.id === link.id
              return (
                <Button
                  key={profile.id}
                  variant="ghost"
                  aria-pressed={active}
                  onClick={() => setSelectedLinkId(profile.id)}
                  className={`w-full h-auto flex-col items-stretch text-left rounded-lg border p-3 transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 hover:bg-primary/15'
                      : 'border-border bg-muted/20 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-bold text-foreground">{profile.name}</span>
                    <span className="text-[11px] font-mono text-primary">
                      MTU {profile.mtuBytes} B · &lt;{profile.latencyBudgetMs} ms
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-muted-foreground mt-1">
                    {profile.protocol}
                  </p>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="glass-panel p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">2. Select Cryptographic Mechanism</h3>
          <div role="group" aria-label="Select cryptographic mechanism" className="space-y-2">
            {GRID_CRYPTO_MECHANISMS.map((m) => {
              const active = m.id === mech.id
              return (
                <Button
                  key={m.id}
                  variant="ghost"
                  aria-pressed={active}
                  onClick={() => setSelectedMechId(m.id)}
                  className={`w-full h-auto flex-col items-stretch text-left rounded-lg border p-3 transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 hover:bg-primary/15'
                      : 'border-border bg-muted/20 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-bold text-foreground">{m.label}</span>
                    <span className="text-[11px] font-mono font-normal text-muted-foreground">
                      Wire: {m.wirePayloadBytes.toLocaleString()} B
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-muted-foreground mt-1">{m.standard}</p>
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Application Payload Slider */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="grid-app-payload-slider"
            className="text-sm font-semibold text-foreground"
          >
            Application Payload Size (GOOSE APDU / DNP3 / DLMS payload):{' '}
            <span className="text-primary font-mono">{appPayloadBytes} bytes</span>
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppPayloadBytes(64)}
              className="h-7 text-xs"
            >
              Small (64 B)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppPayloadBytes(180)}
              className="h-7 text-xs"
            >
              Typical GOOSE (180 B)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppPayloadBytes(512)}
              className="h-7 text-xs"
            >
              Telemetry Block (512 B)
            </Button>
          </div>
        </div>
        <input
          id="grid-app-payload-slider"
          type="range"
          min={32}
          max={800}
          step={16}
          value={appPayloadBytes}
          onChange={(e) => setAppPayloadBytes(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Verdict & Computed Breakdown */}
      <div className={`rounded-xl border p-4 space-y-2 ${verdict.tone}`} role="status">
        <div className="flex items-center gap-2 font-bold text-sm">
          {verdict.icon}
          <span>{verdict.status}</span>
        </div>
        <p className="text-xs text-foreground/90 leading-relaxed">{verdict.guidance}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">Total Frame Size</p>
          <p className="text-xl font-bold font-mono text-foreground mt-1">
            {totalFrameBytes.toLocaleString()} B
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Hdr {link.headerOverheadBytes} + App {appPayloadBytes} + Crypto {mech.wirePayloadBytes}
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">Frames / Fragments</p>
          <p
            className={`text-xl font-bold font-mono mt-1 ${
              exceedsMtu ? 'text-status-error' : 'text-status-success'
            }`}
          >
            {fragmentsRequired}x
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Link MTU: {link.mtuBytes.toLocaleString()} bytes
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">Est. Crypto + Wire Latency</p>
          <p
            className={`text-xl font-bold font-mono mt-1 ${
              exceedsLatency ? 'text-status-error' : 'text-foreground'
            }`}
          >
            {estimatedLatencyMs} ms
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Budget: &lt;{link.latencyBudgetMs} ms
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">Public Key Size</p>
          <p className="text-xl font-bold font-mono text-foreground mt-1">
            {mech.publicKeyBytes === 0 ? 'Symmetric' : `${mech.publicKeyBytes.toLocaleString()} B`}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {mech.quantumStatus === 'quantum-safe' ? 'Quantum-resistant' : 'Shor-vulnerable'}
          </p>
        </div>
      </div>

      {/* Mechanism Note */}
      <div className="glass-panel p-4 flex items-start gap-2.5 text-xs">
        <Cpu size={16} className="text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{mech.label} Engineering Note</p>
          <p className="text-muted-foreground leading-relaxed">{mech.detail}</p>
        </div>
      </div>
    </div>
  )
}
