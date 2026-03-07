// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import {
  Car,
  Eye,
  ShieldCheck,
  HardDrive,
  Clock,
  Lock,
  CreditCard,
  Key,
  Package,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'

// -- Local CollapsibleSection ------------------------------------------------

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
          <h2 className="text-xl font-bold text-gradient">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </section>
  )
}

// -- Introduction Component --------------------------------------------------

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const AutomotivePQCIntroduction: React.FC<IntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* -- Section 1: The Automotive Crypto Landscape ------------------------ */}
      <CollapsibleSection
        title="The Automotive Crypto Landscape"
        icon={<Car size={24} className="text-primary" />}
        defaultOpen={true}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Modern vehicles are among the most complex distributed computing systems in production
            today. A premium vehicle contains 100&ndash;150 Electronic Control Units (
            <InlineTooltip term="ECU">ECUs</InlineTooltip>) communicating over multiple bus
            technologies, each with distinct bandwidth, latency, and security profiles. The
            cryptographic requirements span from real-time safety-critical signing (brake-by-wire
            commands in &lt;1 ms) to bulk data protection (
            <InlineTooltip term="OTA Updates">OTA</InlineTooltip> firmware packages of several
            gigabytes).
          </p>

          <p>
            <InlineTooltip term="V2X Communication">V2X</InlineTooltip> communication defined by
            IEEE 1609.2 adds an external attack surface: vehicles broadcast Basic Safety Messages
            (BSMs) 10 times per second, each signed with ECDSA P-256. A future{' '}
            <InlineTooltip term="CRQC">CRQC</InlineTooltip> could forge BSMs to cause phantom
            braking or mask real obstacles &mdash; a direct safety-of-life threat. Transitioning V2X
            to PQC signatures is complicated by the 300-byte BSM payload budget and strict 100 ms
            end-to-end latency requirement.
          </p>

          <p>
            The industry is simultaneously migrating from <strong>domain architecture</strong>{' '}
            (separate ECU clusters for powertrain, chassis, body, infotainment) to{' '}
            <strong>zonal architecture</strong> (zone controllers aggregating ECUs by physical
            location). This architectural shift creates a window of opportunity: zonal gateways
            become natural PQC enforcement points, concentrating cryptographic operations on fewer,
            more powerful processors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
              <h4 className="text-sm font-bold text-foreground mb-2">Domain Architecture</h4>
              <p className="text-xs text-muted-foreground">
                ECUs grouped by function: powertrain domain, chassis domain, body domain,
                infotainment domain. Each domain has a gateway ECU. Crypto is per-domain &mdash;
                50&ndash;70 independent key stores across the vehicle. PQC migration requires
                touching every domain controller independently.
              </p>
              <div className="mt-2 text-[10px] font-medium text-status-warning">
                Legacy (pre-2024 platforms)
              </div>
            </div>
            <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
              <h4 className="text-sm font-bold text-foreground mb-2">Zonal Architecture</h4>
              <p className="text-xs text-muted-foreground">
                ECUs grouped by physical location (front-left, front-right, rear). 3&ndash;5 high-
                performance zone controllers run Automotive Ethernet (100BASE-T1 / 1000BASE-T1).
                Crypto consolidates to zone controllers &mdash; ideal for{' '}
                <InlineTooltip term="HSM">HSM</InlineTooltip>-backed PQC.
              </p>
              <div className="mt-2 text-[10px] font-medium text-status-success">
                Modern (2025+ platforms)
              </div>
            </div>
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-2">Comparison</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>ECU count</span>
                  <span className="text-foreground font-medium">100&ndash;150 vs 30&ndash;50</span>
                </div>
                <div className="flex justify-between">
                  <span>Key stores</span>
                  <span className="text-foreground font-medium">50&ndash;70 vs 3&ndash;5</span>
                </div>
                <div className="flex justify-between">
                  <span>Bus tech</span>
                  <span className="text-foreground font-medium">CAN/LIN vs Ethernet</span>
                </div>
                <div className="flex justify-between">
                  <span>PQC overhead</span>
                  <span className="text-foreground font-medium">Distributed vs Centralized</span>
                </div>
                <div className="flex justify-between">
                  <span>Bandwidth</span>
                  <span className="text-foreground font-medium">1 Mbps vs 1 Gbps</span>
                </div>
              </div>
            </div>
          </div>

          <p>
            In-vehicle bus protocols create hard constraints:{' '}
            <InlineTooltip term="CAN Bus">CAN 2.0</InlineTooltip> frames are limited to 8 bytes of
            payload &mdash; impossibly small for any PQC signature. CAN FD extends this to 64 bytes,
            still insufficient for <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> (3,309 bytes
            at security level 3). Both require application-layer fragmentation. Automotive Ethernet
            (1,500-byte MTU) can natively carry ML-KEM payloads (1,088 bytes) without fragmentation,
            but even Ethernet will require IP fragmentation for ML-DSA-44 or larger signatures.
          </p>
        </div>
      </CollapsibleSection>

      {/* -- Section 2: Autonomous Driving Data Integrity ---------------------- */}
      <CollapsibleSection
        title="Autonomous Driving Data Integrity"
        icon={<Eye size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Autonomous driving systems (SAE Levels 3&ndash;5) rely on continuous{' '}
            <InlineTooltip term="Sensor Fusion">sensor fusion</InlineTooltip> &mdash; combining
            LiDAR point clouds, radar returns, camera frames, and ultrasonic readings into a unified
            environmental model updated 20&ndash;60 times per second. The integrity of this data
            pipeline is a safety-of-life concern: a tampered LiDAR stream could cause the vehicle to
            misidentify obstacles, while a forged HD map update could direct the vehicle onto a
            wrong route.
          </p>

          <p>
            The <strong>Harvest Now, Decrypt Later</strong> threat is especially severe for
            autonomous driving datasets. Training data collected today &mdash; including detailed 3D
            maps of military installations, government facilities, and critical infrastructure
            &mdash; will remain valuable to adversaries for decades. HD map providers (HERE, TomTom,
            Google) transmit map updates over TLS with ECDH key exchange; a CRQC could decrypt
            harvested map data exposing sensitive geospatial intelligence.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Sensor Type
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Data Rate
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Msg/sec
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Signing Feasibility
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    PQC Impact
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">LiDAR (128-ch)</td>
                  <td className="text-right py-2 px-3">300 MB/s</td>
                  <td className="text-right py-2 px-3">~20 frames</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">Per-frame infeasible</span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    Batch-sign point cloud segments; verify at fusion layer
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">Radar (77 GHz)</td>
                  <td className="text-right py-2 px-3">15 MB/s</td>
                  <td className="text-right py-2 px-3">~50 scans</td>
                  <td className="py-2 px-3">
                    <span className="text-status-warning font-medium">Marginal</span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    <InlineTooltip term="ML-DSA">ML-DSA-44</InlineTooltip> adds ~0.8 ms per scan;
                    within budget
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">Camera (8 MP)</td>
                  <td className="text-right py-2 px-3">40 MB/s</td>
                  <td className="text-right py-2 px-3">~30 frames</td>
                  <td className="py-2 px-3">
                    <span className="text-status-warning font-medium">Marginal</span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    Sign compressed JPEG2000 output, not raw Bayer data
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">Ultrasonic</td>
                  <td className="text-right py-2 px-3">0.1 MB/s</td>
                  <td className="text-right py-2 px-3">~40 readings</td>
                  <td className="py-2 px-3">
                    <span className="text-status-success font-medium">Feasible</span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    Trivial payload; PQC overhead negligible
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">HD Map Updates</td>
                  <td className="text-right py-2 px-3">5&ndash;50 MB/tile</td>
                  <td className="text-right py-2 px-3">Async</td>
                  <td className="py-2 px-3">
                    <span className="text-status-success font-medium">Feasible</span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    Offline verification; use ML-DSA-65 or SLH-DSA for integrity
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <strong>ML model provenance</strong> is an emerging concern: autonomous driving neural
            networks are updated via OTA with models trained on petabytes of driving data. Model
            signing with <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> ensures that only
            OEM-authenticated models execute on vehicle hardware. Without PQC model signing, an
            adversary with a CRQC could forge model updates, replacing safety-critical perception
            models with adversarially compromised versions.
          </p>

          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  HNDL Risk: Autonomous Driving Training Data
                </h4>
                <p className="text-xs text-muted-foreground">
                  Autonomous vehicles continuously upload driving telemetry to cloud training
                  pipelines. This data includes centimeter-accurate 3D scans of cities, military
                  bases, and critical infrastructure. Adversaries harvesting this TLS-encrypted
                  traffic today can decrypt it with a future CRQC, gaining a comprehensive
                  geospatial intelligence dataset with no physical surveillance required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 3: Safety-Critical Systems & ISO 26262 -------------------- */}
      <CollapsibleSection
        title="Safety-Critical Systems & ISO 26262"
        icon={<ShieldCheck size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            ISO 26262 defines the Automotive Safety Integrity Levels (ASIL) that govern all
            safety-related electronic systems. When cryptographic verification becomes part of a
            safety function &mdash; for example, authenticating a steering command or verifying a{' '}
            <InlineTooltip term="Secure Boot">secure boot</InlineTooltip> chain &mdash; the crypto
            library inherits the ASIL classification of that function. PQC algorithms have
            fundamentally different timing characteristics than classical ECDSA, and these
            differences directly impact whether a system can meet its ASIL-mandated response
            deadlines.
          </p>

          <p>
            The core tension is between <strong>fail-safe</strong> and{' '}
            <strong>fail-operational</strong> design. A fail-safe system (ASIL A/B) can enter a safe
            state when crypto verification fails or times out. A fail-operational system (ASIL C/D)
            must continue operating safely even during crypto failures &mdash; this requires
            redundant verification paths and strict worst-case timing guarantees that PQC algorithms
            must satisfy.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">ASIL</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Safety Requirement
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Latency Budget
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Crypto Requirements
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    PQC Timing Impact
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-bold text-muted-foreground">QM</td>
                  <td className="py-2 px-3">No safety requirement</td>
                  <td className="text-right py-2 px-3">No limit</td>
                  <td className="py-2 px-3">Best effort</td>
                  <td className="py-2 px-3">
                    <span className="text-status-success font-medium">No impact</span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-bold text-foreground">A</td>
                  <td className="py-2 px-3">Fail-safe (light injuries)</td>
                  <td className="text-right py-2 px-3">&lt;100 ms</td>
                  <td className="py-2 px-3">Auth on state transitions</td>
                  <td className="py-2 px-3">
                    <span className="text-status-success font-medium">ML-DSA fits</span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-bold text-status-warning">B</td>
                  <td className="py-2 px-3">Fail-safe (severe injuries)</td>
                  <td className="text-right py-2 px-3">&lt;50 ms</td>
                  <td className="py-2 px-3">Periodic auth + watchdog</td>
                  <td className="py-2 px-3">
                    <span className="text-status-warning font-medium">
                      ML-DSA tight; FN-DSA better
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-bold text-status-error">C</td>
                  <td className="py-2 px-3">Fail-operational (life-threat)</td>
                  <td className="text-right py-2 px-3">&lt;10 ms</td>
                  <td className="py-2 px-3">Real-time auth every cycle</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">
                      HW accel required for ML-DSA
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-status-error">D</td>
                  <td className="py-2 px-3">Fail-operational (fatal)</td>
                  <td className="text-right py-2 px-3">&lt;5 ms</td>
                  <td className="py-2 px-3">Deterministic auth + redundancy</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">
                      Dedicated PQC crypto ASIC needed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            For ASIL C/D functions like steer-by-wire and brake-by-wire, PQC verification must
            complete within a single control loop iteration (typically 5&ndash;10 ms). Software-only{' '}
            <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> verification on an automotive-grade
            ARM Cortex-R52 takes approximately 2&ndash;4 ms &mdash; leaving dangerously little
            margin for jitter. Hardware-accelerated PQC (via dedicated crypto coprocessors or FPGA
            fabric) can reduce this to &lt;0.5 ms but adds BOM cost and silicon area.
          </p>

          <p>
            Cross-reference the{' '}
            <a href="/learn/iot-ot-pqc" className="text-primary hover:underline">
              IoT &amp; OT PQC module
            </a>{' '}
            for constrained device algorithm selection mechanics, including the tradeoffs between
            ML-DSA, FN-DSA, and hash-based signatures in resource-limited environments.
          </p>
        </div>
      </CollapsibleSection>

      {/* -- Section 4: HSM Lifecycle: Factory to End-of-Life ------------------ */}
      <CollapsibleSection
        title="HSM Lifecycle: Factory to End-of-Life"
        icon={<HardDrive size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Automotive <InlineTooltip term="HSM">HSM</InlineTooltip> deployments follow a tiered
            model: high-assurance HSMs protect the most sensitive keys (V2X root credentials,
            production signing keys), while lightweight secure elements handle per-ECU operations.
            Each tier has different PQC readiness &mdash; top-tier factory HSMs from established
            vendors are adding ML-DSA and ML-KEM support first, while constrained SHE (Secure
            Hardware Extension) modules may never support lattice-based PQC natively.
          </p>

          <p>
            The vehicle&rsquo;s cryptographic lifecycle spans three distinct phases, each with
            different HSM roles and PQC requirements. At production, keys are injected under
            controlled factory conditions. During road life, HSMs perform millions of real-time
            signing operations. At end-of-life, all key material must be securely destroyed to
            prevent harvest-after-disposal attacks.
          </p>

          <h4 className="text-sm font-bold text-foreground">
            Five HSM Tiers in the Automotive Stack
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
              <h4 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                <ShieldCheck size={14} className="text-status-success" /> Factory HSM
              </h4>
              <p className="text-[10px] font-medium text-status-success mb-2">FIPS 140-3 Level 3</p>
              <p className="text-xs text-muted-foreground mb-2">
                Rack-mounted HSMs in production plants. Generate and inject root keys into every
                vehicle. Sign firmware images and V2X enrollment certificates.
              </p>
              <p className="text-[10px] text-muted-foreground">
                <strong>Vendors:</strong> Thales Luna, Utimaco SecurityServer, Entrust nShield
              </p>
              <p className="text-[10px] text-foreground mt-1 flex items-center gap-1">
                <CheckCircle size={10} className="text-status-success" /> ML-DSA + ML-KEM available
              </p>
            </div>
            <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
              <h4 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                <ShieldCheck size={14} className="text-status-success" /> V2X SCMS HSM
              </h4>
              <p className="text-[10px] font-medium text-status-success mb-2">
                FIPS 140-3 Level 3 / CC EAL4+
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Backend HSMs in the Security Credential Management System. Issue pseudonym
                certificates, manage butterfly key expansion, and run misbehavior detection.
              </p>
              <p className="text-[10px] text-muted-foreground">
                <strong>Vendors:</strong> Qualcomm / Autotalks SCMS, Denso V2X PKI
              </p>
              <p className="text-[10px] text-foreground mt-1 flex items-center gap-1">
                <CheckCircle size={10} className="text-status-success" /> PQC hybrid mode in
                development
              </p>
            </div>
            <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
              <h4 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                <ShieldCheck size={14} className="text-status-warning" /> Vehicle Gateway ECU HSM
              </h4>
              <p className="text-[10px] font-medium text-status-warning mb-2">
                EVITA Full / SHE 2.0
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Embedded HSM in the central gateway or zone controller. Handles OTA verification,
                inter-domain authentication, and diagnostic session security. Typically built on
                Infineon SLI 97 or NXP SE050.
              </p>
              <p className="text-[10px] text-muted-foreground">
                <strong>Vendors:</strong> Infineon AURIX TC4x, NXP S32G, Renesas R-Car S4
              </p>
              <p className="text-[10px] text-foreground mt-1 flex items-center gap-1">
                <Minus size={10} className="text-status-warning" /> PQC via firmware update (limited
                algorithms)
              </p>
            </div>
            <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
              <h4 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                <ShieldCheck size={14} className="text-status-warning" /> ECU Secure Element
              </h4>
              <p className="text-[10px] font-medium text-status-warning mb-2">EVITA Medium / SHE</p>
              <p className="text-xs text-muted-foreground mb-2">
                Lightweight hardware security in individual ECUs (engine, transmission, ADAS).
                Stores per-ECU symmetric keys for{' '}
                <InlineTooltip term="Secure Boot">secure boot</InlineTooltip> and authenticated CAN
                messages (SecOC). Extremely constrained: 16&ndash;32 KB secure storage.
              </p>
              <p className="text-[10px] text-muted-foreground">
                <strong>Vendors:</strong> Infineon SLI 37, STMicro STSAFE-A
              </p>
              <p className="text-[10px] text-foreground mt-1 flex items-center gap-1">
                <XCircle size={10} className="text-status-error" /> No PQC (symmetric-only; AES-128
                / CMAC)
              </p>
            </div>
            <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
              <h4 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                <ShieldCheck size={14} className="text-status-warning" />{' '}
                <InlineTooltip term="TPM">TPM</InlineTooltip> 2.0
              </h4>
              <p className="text-[10px] font-medium text-status-warning mb-2">TCG TPM 2.0</p>
              <p className="text-xs text-muted-foreground mb-2">
                Discrete or firmware TPM in the infotainment head unit and telematics control unit
                (TCU). Provides measured boot, platform attestation, and DRM key protection. Runs
                RSA-2048 and ECDSA P-256 today.
              </p>
              <p className="text-[10px] text-muted-foreground">
                <strong>Vendors:</strong> Infineon SLB 9672, STMicro ST33, Nuvoton NPCT7xx
              </p>
              <p className="text-[10px] text-foreground mt-1 flex items-center gap-1">
                <Minus size={10} className="text-status-warning" /> PQC TPM profiles under TCG
                development
              </p>
            </div>
          </div>

          <h4 className="text-sm font-bold text-foreground">
            Three Lifecycle Phases &amp; HSM Roles
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-2">1. Production</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Root key generation in Factory HSM (FIPS 140-3 L3)</li>
                <li>Per-vehicle key pair injection into Gateway ECU HSM</li>
                <li>V2X enrollment certificate provisioning via SCMS</li>
                <li>
                  <InlineTooltip term="Secure Boot">Secure boot</InlineTooltip> chain initialization
                  across all ECUs
                </li>
                <li>PQC key material: ML-DSA-65 signing keys + ML-KEM-768 transport keys</li>
              </ul>
            </div>
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-2">2. Road Life</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Real-time V2X BSM signing (10 signatures/sec, PQC latency-critical)</li>
                <li>
                  <InlineTooltip term="OTA Updates">OTA</InlineTooltip> firmware verification via
                  Gateway HSM
                </li>
                <li>Pseudonym certificate rotation (weekly butterfly key expansion)</li>
                <li>Diagnostic session authentication (UDS 0x27 / 0x29)</li>
                <li>Key rotation during scheduled maintenance (dealer key refresh)</li>
              </ul>
            </div>
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-2">3. End-of-Life</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Cryptographic key zeroization in all HSM tiers</li>
                <li>V2X certificate revocation via SCMS CRL</li>
                <li>TPM platform credential revocation</li>
                <li>Secure data erasure for GDPR compliance</li>
                <li>Audit trail export for regulatory retention requirements</li>
              </ul>
            </div>
          </div>

          <p>
            Cross-reference the{' '}
            <a href="/learn/hsm-pqc" className="text-primary hover:underline">
              HSM PQC module
            </a>{' '}
            for detailed <InlineTooltip term="PKCS#11">PKCS#11</InlineTooltip> operations, key
            lifecycle management patterns, and hands-on exercises with PQC-enabled HSM emulation.
          </p>
        </div>
      </CollapsibleSection>

      {/* -- Section 5: Long Vehicle Lifecycle & Crypto-Agility ---------------- */}
      <CollapsibleSection
        title="Long Vehicle Lifecycle & Crypto-Agility"
        icon={<Clock size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A vehicle sold in 2026 will be on the road until 2041&ndash;2046. During that 15&ndash;
            20 year lifespan, the cryptographic landscape will transform multiple times:
            post-quantum algorithms will mature, new attacks may weaken initial PQC standards, and
            hybrid modes will eventually be deprecated in favor of pure PQC. The vehicle&rsquo;s
            crypto stack must survive <strong>3&ndash;4 complete algorithm generations</strong>{' '}
            &mdash; a challenge no other consumer product faces.
          </p>

          <p>
            <InlineTooltip term="Crypto Agility">Crypto agility</InlineTooltip> in automotive
            requires abstraction at every layer. The AUTOSAR Adaptive Platform provides a Crypto
            Service Manager (CSM) that decouples application code from specific algorithm
            implementations. When a new PQC algorithm is standardized or an existing one is
            deprecated, only the CSM driver needs updating &mdash; application ECUs receive the
            change transparently via <InlineTooltip term="OTA Updates">OTA updates</InlineTooltip>.
          </p>

          <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
            <h4 className="text-sm font-bold text-foreground mb-3">
              Crypto Deprecation vs. Vehicle Lifecycle
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-xs text-muted-foreground text-right">
                  Crypto cycle
                </div>
                <div className="flex-1 h-6 rounded bg-status-error/20 border border-status-error/30 flex items-center px-2">
                  <span className="text-[10px] font-medium text-status-error">
                    3&ndash;5 years per algorithm generation
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-xs text-muted-foreground text-right">
                  Vehicle life
                </div>
                <div className="flex-1 h-6 rounded bg-status-success/20 border border-status-success/30 flex items-center px-2">
                  <span className="text-[10px] font-medium text-status-success">
                    15&ndash;20 years on the road
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-xs text-muted-foreground text-right">Gap</div>
                <div className="flex-1 h-6 rounded bg-primary/10 border border-primary/30 flex items-center px-2">
                  <span className="text-[10px] font-medium text-primary">
                    Must plan for 3&ndash;4 crypto transitions during ownership
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p>
            The <strong>CRQC vulnerability window</strong> concept is critical for automotive
            planning. If a vehicle&rsquo;s data has a secrecy requirement of <em>S</em> years, and a
            CRQC is expected in <em>Q</em> years, then PQC migration must complete within{' '}
            <em>Q &minus; S</em> years. For a vehicle with 20-year data confidentiality requirements
            and a 10-year CRQC horizon, PQC migration needed to start <strong>10 years ago</strong>{' '}
            &mdash; illustrating the urgency. Even optimistic CRQC timelines (15&ndash;20 years)
            leave zero margin for vehicles entering production today.
          </p>

          <p>
            <InlineTooltip term="AUTOSAR">AUTOSAR</InlineTooltip> Adaptive Platform R23-11 includes
            the Crypto Service Manager (ara::crypto) which supports algorithm-agnostic key
            management. However, AUTOSAR Classic (used in 80% of ECUs) relies on the SHE/SHE 2.0
            hardware interface, which has a fixed AES-128 algorithm set with no extensibility for
            PQC. The Classic-to-Adaptive migration is itself a multi-year effort that must be
            coordinated with PQC adoption.
          </p>
        </div>
      </CollapsibleSection>

      {/* -- Section 6: Connected Car Privacy & GDPR --------------------------- */}
      <CollapsibleSection
        title="Connected Car Privacy & GDPR"
        icon={<Lock size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Connected vehicles generate 25&ndash;40 GB of data per hour, including GPS traces,
            driving behavior, cabin occupancy, voice commands, and biometric data from driver
            monitoring systems. This data flows from the vehicle&rsquo;s Telematics Control Unit
            (TCU) to OEM cloud backends over LTE/5G connections protected by classical TLS. Under
            GDPR Article 25 (Data Protection by Design), OEMs must implement cryptographic
            protections that remain effective for the entire data retention period &mdash; which may
            extend well into the CRQC era.
          </p>

          <p>
            V2X pseudonym certificates are the automotive industry&rsquo;s primary privacy
            mechanism. IEEE 1609.2 mandates that vehicles rotate through pools of short-lived
            pseudonym certificates (typically 20&ndash;40 active at once) to prevent long-term The{' '}
            <strong>butterfly key expansion</strong> protocol generates pseudonym keys from a single
            seed, allowing the SCMS to issue thousands of certificates without knowing the private
            keys. Transitioning butterfly key expansion from ECDSA to PQC requires careful redesign:
            ML-DSA public keys are over 20x larger (1,312 bytes vs 64 bytes), and the expansion
            protocol must be adapted for lattice-based algebra.
          </p>

          <p>
            GDPR&rsquo;s <strong>right to erasure</strong> (Article 17) creates a unique tension
            with cryptographic audit trails. Immutable logs of V2X certificate issuance and
            revocation cannot be erased without breaking the chain of trust. The emerging solution
            is crypto-shredding: encrypting audit entries with per-user keys that can be securely
            destroyed, making the data unrecoverable without technically deleting the log entries.
            PQC must be applied to these encryption keys to prevent future quantum decryption of
            supposedly erased data.
          </p>

          <h4 className="text-sm font-bold text-foreground">
            Privacy Risk Matrix: Data Type vs. Quantum Exposure
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Data Type
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Collection Frequency
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Retention Period
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Quantum Exposure
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">GPS location</td>
                  <td className="py-2 px-3">Continuous (1 Hz)</td>
                  <td className="py-2 px-3">3&ndash;7 years</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">Critical</span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">Driving behavior</td>
                  <td className="py-2 px-3">Continuous (10 Hz)</td>
                  <td className="py-2 px-3">5&ndash;10 years</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">Critical</span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">Voice commands</td>
                  <td className="py-2 px-3">On activation</td>
                  <td className="py-2 px-3">1&ndash;3 years</td>
                  <td className="py-2 px-3">
                    <span className="text-status-warning font-medium">High</span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">Cabin cameras</td>
                  <td className="py-2 px-3">Continuous (driver monitoring)</td>
                  <td className="py-2 px-3">30 days (local)</td>
                  <td className="py-2 px-3">
                    <span className="text-status-warning font-medium">High</span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">EV charging sessions</td>
                  <td className="py-2 px-3">Per charge event</td>
                  <td className="py-2 px-3">5&ndash;10 years (billing)</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">Critical</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">V2X BSMs</td>
                  <td className="py-2 px-3">10 Hz (broadcast)</td>
                  <td className="py-2 px-3">Not retained (ephemeral)</td>
                  <td className="py-2 px-3">
                    <span className="text-status-success font-medium">Low</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            &ldquo;Quantum Exposure&rdquo; reflects both retention period and adversarial value.
            Location data + driving behavior enables complete movement profiling; combined with EV
            charging records, it reveals home/work patterns with high confidence.
          </p>
        </div>
      </CollapsibleSection>

      {/* -- Section 7: In-Vehicle Payments & EV Charging ---------------------- */}
      <CollapsibleSection
        title="In-Vehicle Payments & EV Charging"
        icon={<CreditCard size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Vehicles are becoming payment terminals.{' '}
            <InlineTooltip term="ISO 15118">ISO 15118</InlineTooltip> Plug &amp; Charge enables
            automatic authentication between electric vehicles and charging stations using X.509
            certificates exchanged over a TLS session. The vehicle presents its contract certificate
            (issued by the eMobility Service Provider), the charging station verifies it against the
            Charging Point Operator&rsquo;s (CPO) trust chain, and charging begins &mdash; no RFID
            card, no app, no user interaction. This entire flow depends on classical RSA/ECDSA
            certificates that a CRQC would break.
          </p>

          <p>
            Beyond EV charging, in-vehicle payment use cases are expanding rapidly: automated
            tolling (DSRC or GNSS-based), parking payment, fuel purchases, drive-through ordering,
            and infotainment content purchases. Each payment flow has its own certificate hierarchy
            and signature requirements, but all share the same quantum vulnerability: classical
            public-key signatures that authenticate payment authorization.
          </p>

          <h4 className="text-sm font-bold text-foreground">
            ISO 15118 Plug &amp; Charge Authentication Flow
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h4 className="text-sm font-bold text-foreground mb-2">1. Vehicle</h4>
              <p className="text-xs text-muted-foreground">
                Presents contract certificate + ECDSA signature proving authorization from eMobility
                Service Provider. Certificate chain: OEM root CA &rarr; provisioning CA &rarr;
                contract cert. <strong>PQC upgrade:</strong> ML-DSA-65 contract certificates with
                hybrid fallback.
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h4 className="text-sm font-bold text-foreground mb-2">2. Charging Station</h4>
              <p className="text-xs text-muted-foreground">
                Verifies vehicle certificate against CPO trust store. Establishes TLS session for
                metering data. Sends signed charging schedule. <strong>PQC upgrade:</strong>{' '}
                ML-KEM-768 TLS handshake + ML-DSA metering signatures.
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h4 className="text-sm font-bold text-foreground mb-2">3. CPO Backend</h4>
              <p className="text-xs text-muted-foreground">
                Validates contract certificate via OCSP/CRL. Authorizes energy delivery. Processes
                CDR (Charge Detail Record) for billing settlement. <strong>PQC upgrade:</strong>{' '}
                PQC-signed CDRs for non-repudiation over billing retention period (10+ years).
              </p>
            </div>
          </div>

          <p>
            Cross-reference the{' '}
            <a href="/learn/emv-payment-pqc" className="text-primary hover:underline">
              EMV Payment PQC module
            </a>{' '}
            for detailed coverage of payment network PQC migration (Visa, Mastercard, Amex),
            tokenization frameworks, and the role of{' '}
            <InlineTooltip term="FN-DSA">FN-DSA-512</InlineTooltip> in constrained payment
            terminals.
          </p>

          <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Cross-Industry Coordination Required
                </h4>
                <p className="text-xs text-muted-foreground">
                  ISO 15118 Plug &amp; Charge PQC migration requires synchronized upgrades across
                  the entire ecosystem: vehicle OEMs, charging station manufacturers, CPO backend
                  systems, eMobility Service Providers, and the V2G root CA. Any single participant
                  using classical-only certificates creates a weak link. The ISO 15118-20 revision
                  process must include PQC algorithm profiles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 8: Digital Car Key (CCC Digital Key 3.0) ------------------ */}
      <CollapsibleSection
        title="Digital Car Key (CCC Digital Key 3.0)"
        icon={<Key size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The Car Connectivity Consortium (CCC) Digital Key 3.0 specification enables smartphones
            and wearables to unlock and start vehicles using NFC, BLE, and UWB (Ultra-Wideband)
            transports. The protocol uses ECDH P-256 for key agreement and ECDSA P-256 for
            authentication &mdash; both quantum-vulnerable. With over 200 million vehicles expected
            to support <InlineTooltip term="CCC Digital Key">CCC Digital Key</InlineTooltip> by
            2030, the PQC migration of this standard affects a massive installed base.
          </p>

          <h4 className="text-sm font-bold text-foreground">Transport Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Transport
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Max Payload
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Latency
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    PQC Feasibility
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Challenge
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">NFC (ISO 14443)</td>
                  <td className="text-right py-2 px-3">256 B/APDU</td>
                  <td className="text-right py-2 px-3">&lt;500 ms</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">Severely constrained</span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    ML-KEM public key (1,184 B) + ciphertext (1,088 B) requires 9+ APDU fragments
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">BLE 5.0</td>
                  <td className="text-right py-2 px-3">512 B/PDU</td>
                  <td className="text-right py-2 px-3">&lt;2 s</td>
                  <td className="py-2 px-3">
                    <span className="text-status-warning font-medium">Marginal</span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    3&ndash;4 PDU fragments; acceptable with connection parameter optimization
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">UWB (802.15.4z)</td>
                  <td className="text-right py-2 px-3">2,048 B</td>
                  <td className="text-right py-2 px-3">&lt;100 ms</td>
                  <td className="py-2 px-3">
                    <span className="text-status-success font-medium">Feasible</span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    ML-KEM-768 fits in single frame; best PQC transport
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            The <strong>NFC APDU fragmentation problem</strong> is the most acute PQC challenge for
            digital car keys. NFC ISO 14443-4 limits Application Protocol Data Units to 256 bytes.
            An <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>-768 public key is 1,184 bytes,
            and the resulting ciphertext requires another 1,088 bytes. Exchanging just the KEM
            material requires at least 9 APDU exchanges. Each exchange adds ~50 ms of round-trip
            latency, potentially pushing the total NFC transaction time beyond the 500 ms user
            experience threshold that CCC requires for &ldquo;tap and go&rdquo; unlock. Solutions
            under investigation include extended-length APDUs (supported by some NFC controllers but
            not all smartphones), pre-cached key material, and hybrid protocols where NFC bootstraps
            a BLE connection for the PQC handshake.
          </p>

          <h4 className="text-sm font-bold text-foreground">Owner-to-Friend Key Sharing Flow</h4>
          <div className="glass-panel p-4">
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                  1
                </span>
                <p>
                  <strong className="text-foreground">Owner initiates share</strong> &mdash; OEM app
                  generates a sharing invitation containing the vehicle&rsquo;s public key and
                  access policy (time window, geofence, feature restrictions).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                  2
                </span>
                <p>
                  <strong className="text-foreground">Friend&rsquo;s device enrolls</strong> &mdash;
                  Friend&rsquo;s phone generates an ephemeral key pair, signs an enrollment request,
                  and sends it to the OEM key server. The server issues a time-limited digital key
                  credential signed by the OEM CA.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                  3
                </span>
                <p>
                  <strong className="text-foreground">Vehicle verifies credential</strong> &mdash;
                  On first NFC/BLE tap, the vehicle verifies the friend&rsquo;s credential against
                  the OEM CA chain and the owner&rsquo;s access policy. All signatures must be PQC
                  to prevent a CRQC from forging shared keys after the fact.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                  4
                </span>
                <p>
                  <strong className="text-foreground">Revocation</strong> &mdash; Owner revokes
                  access via the OEM app. Vehicle receives revocation update via OTA or at next
                  cloud sync. PQC-signed revocation lists prevent forgery of &ldquo;keep
                  access&rdquo; messages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 9: Supply Chain: TISAX, VDA & AUTOSAR --------------------- */}
      <CollapsibleSection
        title="Supply Chain: TISAX, VDA & AUTOSAR"
        icon={<Package size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The automotive supply chain operates as a deep hierarchy: OEMs (BMW, Toyota, Volkswagen)
            set cryptographic requirements that cascade through Tier-1 suppliers (Bosch,
            Continental, Denso), who pass them to Tier-2 suppliers (specialized chip vendors,
            firmware houses), who may further subcontract to Tier-3 and beyond. PQC readiness at the
            OEM level is meaningless if a Tier-2 supplier ships an ECU with hardcoded RSA-2048 keys
            and no firmware update capability.
          </p>

          <p>
            The mandatory regulatory backdrop is <strong>UNECE WP.29 R155 / R156</strong>: since
            July 2024 all new vehicle type approvals in the EU, Japan, and Korea require a certified
            Cyber Security Management System (CSMS) under R155 and a Software Update Management
            System (SUMS) under R156. R155 explicitly requires cryptographic controls throughout the
            supply chain, and national type-approval authorities are beginning to interpret
            &ldquo;adequate cryptographic protection&rdquo; to include post-quantum readiness for
            systems with multi-decade operating lives.
          </p>

          <p>
            <InlineTooltip term="TISAX">TISAX</InlineTooltip> (Trusted Information Security
            Assessment Exchange), managed by the VDA (Verband der Automobilindustrie), is the
            automotive industry&rsquo;s standard information security assessment framework. TISAX
            assessment labels (AL 1&ndash;3) are required for suppliers handling confidential OEM
            data. As PQC becomes a regulatory requirement, TISAX assessment scope is expanding to
            include quantum-readiness criteria: cryptographic inventory documentation, PQC migration
            timelines, and evidence of crypto-agility in delivered components.
          </p>

          <h4 className="text-sm font-bold text-foreground">Supplier PQC Readiness Cascade</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
              <h4 className="text-sm font-bold text-foreground mb-2">OEM</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Defines PQC policy and algorithm requirements. Mandates hybrid mode for all new
                platforms from 2027+. Requires TISAX AL2+ with PQC addendum from all Tier-1
                suppliers.
              </p>
              <p className="text-[10px] text-foreground font-medium">
                Responsibility: Architecture, policy, validation
              </p>
            </div>
            <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
              <h4 className="text-sm font-bold text-foreground mb-2">Tier-1 Supplier</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Implements PQC in ECU firmware and gateway modules. Provides crypto-agile hardware
                (HSM with PQC firmware update path). Cascades requirements to Tier-2 component
                vendors.
              </p>
              <p className="text-[10px] text-foreground font-medium">
                Responsibility: Implementation, integration testing
              </p>
            </div>
            <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
              <h4 className="text-sm font-bold text-foreground mb-2">Tier-2 Supplier</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Delivers chips, secure elements, and firmware libraries. Must ensure hardware
                supports PQC key sizes and computation. Longest lead time (18&ndash;36 months for
                silicon respins).
              </p>
              <p className="text-[10px] text-foreground font-medium">
                Responsibility: Hardware capability, algorithm libraries
              </p>
            </div>
          </div>

          <h4 className="text-sm font-bold text-foreground">
            <InlineTooltip term="AUTOSAR">AUTOSAR</InlineTooltip> Classic vs. Adaptive: PQC
            Extensibility
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
              <h4 className="text-sm font-bold text-foreground mb-2">
                AUTOSAR Classic (SHE-based)
              </h4>
              <p className="text-xs text-muted-foreground">
                Used in 80% of automotive ECUs. Crypto Stack (CryIf + Csm) is tightly coupled to SHE
                hardware: fixed AES-128 + CMAC. No extensibility for asymmetric crypto, let alone
                PQC. Secure boot uses AES-CMAC chains, not digital signatures. PQC migration
                requires replacing ECU hardware entirely or adding an external secure element.
              </p>
              <p className="text-[10px] text-status-error font-medium mt-2">
                No PQC path without hardware replacement
              </p>
            </div>
            <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
              <h4 className="text-sm font-bold text-foreground mb-2">
                AUTOSAR Adaptive (Crypto Service Manager)
              </h4>
              <p className="text-xs text-muted-foreground">
                Used in zone controllers, ADAS, and infotainment. ara::crypto Crypto Service Manager
                supports pluggable algorithm providers. PQC algorithms can be added as new CSM
                drivers without changing application code. Supports{' '}
                <InlineTooltip term="PKCS#11">PKCS#11</InlineTooltip>-backed HSM integration.
                Algorithm negotiation enables hybrid classical+PQC during transition.
              </p>
              <p className="text-[10px] text-status-success font-medium mt-2">
                Full PQC extensibility via CSM driver updates
              </p>
            </div>
          </div>

          <p>
            Cross-reference the{' '}
            <a href="/learn/vendor-risk" className="text-primary hover:underline">
              Vendor Risk module
            </a>{' '}
            for a comprehensive supply chain assessment methodology, including questionnaire
            templates for evaluating supplier PQC readiness, risk scoring frameworks, and contract
            clause recommendations for cryptographic requirements.
          </p>

          <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">The Weakest-Link Problem</h4>
                <p className="text-xs text-muted-foreground">
                  A single Tier-3 supplier shipping a sensor ECU with non-upgradeable classical
                  crypto creates a permanent vulnerability in every vehicle that ECU is installed
                  in. OEMs must enforce PQC readiness requirements at{' '}
                  <strong>every tier of the supply chain</strong> and require contractual guarantees
                  of firmware-updateable cryptographic implementations. TISAX assessments must
                  verify actual crypto-agility, not just policy documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Reading Complete + Workshop CTA ----------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6">
        <ReadingCompleteButton />
        <Button variant="gradient" onClick={onNavigateToWorkshop} className="gap-2">
          Ready for Workshop <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
