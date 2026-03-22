// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import {
  Radio,
  ScanSearch,
  BarChart2,
  GitBranch,
  Cpu,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'

interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon,
  title,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left"
      >
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">{icon}</div>
        <h2 className="text-xl font-bold text-gradient flex-1">{title}</h2>
        <ChevronRight
          size={18}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {isOpen && <div className="mt-4 space-y-4 text-sm text-foreground/80">{children}</div>}
    </section>
  )
}

interface PQCTestingIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const PQCTestingIntroduction: React.FC<PQCTestingIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: Why PQC Testing Is Different */}
      <CollapsibleSection
        icon={<AlertTriangle size={24} className="text-primary" />}
        title="Why PQC Testing Is Different"
        defaultOpen
      >
        <p>
          Testing post-quantum cryptography deployments is fundamentally different from classical
          crypto testing. Three forces make it uniquely challenging:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30">
            <p className="font-semibold text-status-warning mb-1">Performance Cliffs</p>
            <p className="text-xs">
              IKEv2 SA establishment can jump from 38ms (classical) to 12,626ms with some PQC
              configurations. Pure PQC certificates reach 17KB — forcing 2 TCP round-trips instead
              of 1.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30">
            <p className="font-semibold text-status-info mb-1">Interop Fragility</p>
            <p className="text-xs">
              Larger hybrid ClientHello messages (1120 bytes vs 320 bytes classical) trigger silent
              rejection by faulty server implementations. Pure PQC clients fail on servers requiring
              hybrid per RFC 9794.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="font-semibold text-destructive mb-1">Implementation Leakage</p>
            <p className="text-xs">
              ML-KEM and ML-DSA reference implementations leak key material via power analysis at
              the NTT stage. Traditional TVLA methods must be adapted — fixed-vs-random test vectors
              fail for lattice crypto.
            </p>
          </div>
        </div>

        <p>
          Classical crypto testing assumed algorithms were computationally secure if implemented
          correctly. PQC testing adds a third dimension:{' '}
          <em>are implementations physically secure</em> against side-channel attacks on the new
          mathematical structures?
        </p>

        <div className="p-4 rounded-lg bg-muted border border-border mt-2">
          <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Info size={16} className="text-primary" />
            The TCP-to-TLS Overhead Insight
          </p>
          <p className="text-xs">
            Research shows that on typical Internet connections, TCP connection overhead accounts
            for 6× more latency than the cryptographic operations themselves. On high-latency links
            (satellite, WAN), PQC&apos;s larger key sizes matter more because they force extra
            round-trips — not because the math is slower. This changes where you need to optimize.
          </p>
        </div>

        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 2: Passive vs Active */}
      <CollapsibleSection
        icon={<Radio size={24} className="text-primary" />}
        title="Passive Discovery vs Active Scanning"
      >
        <p>
          Two complementary approaches cover different parts of the{' '}
          <InlineTooltip term="Crypto Inventory">crypto inventory</InlineTooltip> problem:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Radio size={16} className="text-status-success" />
              Passive Discovery
            </h3>
            <p>
              A network tap or SPAN port feeds traffic to a passive probe. The probe inspects
              TLS/SSH/IKEv2 handshakes in-flight — classifying cipher suites, detecting hybrid
              algorithm negotiation, and flagging quantum-vulnerable connections — <em>without</em>{' '}
              injecting any packets.
            </p>
            <ul className="space-y-1 text-xs list-none">
              <li className="flex gap-2">
                <CheckCircle size={12} className="text-status-success mt-0.5 shrink-0" />
                <span>Production-safe: zero network impact</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle size={12} className="text-status-success mt-0.5 shrink-0" />
                <span>Sees real traffic patterns (not just what&apos;s reachable)</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle size={12} className="text-status-success mt-0.5 shrink-0" />
                <span>Covers OT/ICS segments safely</span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle size={12} className="text-status-warning mt-0.5 shrink-0" />
                <span>Cannot validate active PQC support — only what&apos;s negotiated</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Tools: CryptoNext COMPASS, pqc-flow, VIAVI Observer
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ScanSearch size={16} className="text-status-info" />
              Active Scanning
            </h3>
            <p>
              An active scanner initiates connections to target endpoints, probing for PQC algorithm
              support, TLS version, cipher suites, and certificate details. Results reveal what each
              server <em>can</em> negotiate, not just what it currently does.
            </p>
            <ul className="space-y-1 text-xs list-none">
              <li className="flex gap-2">
                <CheckCircle size={12} className="text-status-success mt-0.5 shrink-0" />
                <span>Validates actual PQC capability at each endpoint</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle size={12} className="text-status-success mt-0.5 shrink-0" />
                <span>Detects misconfigured or lagging servers</span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle size={12} className="text-status-warning mt-0.5 shrink-0" />
                <span>Generates traffic — not safe for sensitive OT segments</span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle size={12} className="text-status-warning mt-0.5 shrink-0" />
                <span>May miss ephemeral or inbound-only services</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">Tools: pqcscan, SSLyze, CryptoLyzer</p>
          </div>
        </div>

        <p className="mt-2">
          Best practice: run passive discovery first to build the full inventory, then use active
          scanning to validate PQC readiness endpoint-by-endpoint before cutover.
        </p>

        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 3: Performance Benchmarking */}
      <CollapsibleSection
        icon={<BarChart2 size={24} className="text-primary" />}
        title="PQC Performance Benchmarking Methodology"
      >
        <p>
          Performance testing for PQC requires a layered methodology — because the bottleneck is
          rarely where you expect.
        </p>

        <div className="space-y-3 mt-2">
          <div className="flex gap-3 p-3 rounded-lg bg-muted border border-border">
            <span className="font-bold text-primary text-lg">1</span>
            <div>
              <p className="font-semibold text-foreground text-sm">Establish Classical Baseline</p>
              <p className="text-xs text-muted-foreground">
                Measure current TLS handshake latency, IPSec SA setup time, and throughput under
                realistic load. Document hardware specs — CPU, NIC offload capabilities,
                available RAM.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-muted border border-border">
            <span className="font-bold text-primary text-lg">2</span>
            <div>
              <p className="font-semibold text-foreground text-sm">
                Test Hybrid Configuration First
              </p>
              <p className="text-xs text-muted-foreground">
                X25519+ML-KEM-768 adds ~400 bytes to ClientHello but minimal compute overhead on
                modern hardware. Most organizations see &lt;7% TLS latency increase on LAN. Test
                WAN separately — fragmentation risk increases with distance.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-muted border border-border">
            <span className="font-bold text-primary text-lg">3</span>
            <div>
              <p className="font-semibold text-foreground text-sm">
                Identify Certificate Size Impact
              </p>
              <p className="text-xs text-muted-foreground">
                Pure PQC certificates (17KB for ML-DSA-65) exceed the typical TCP initial
                congestion window. On high-latency links, this forces extra round-trips. Test
                specifically against your worst-case latency links.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-muted border border-border">
            <span className="font-bold text-primary text-lg">4</span>
            <div>
              <p className="font-semibold text-foreground text-sm">Stress Test at Scale</p>
              <p className="text-xs text-muted-foreground">
                Emulate realistic concurrent user counts with application-layer traffic (video,
                collaboration). VIAVI TeraVM and Keysight CyPerf simulate this at scale; PQC-LEO
                (open source) provides lab-grade benchmarking on x86 and ARM without commercial
                licensing. CPU utilization on VPN headends can spike dramatically without hardware
                offload.
              </p>
            </div>
          </div>
        </div>

        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 4: Interoperability Testing */}
      <CollapsibleSection
        icon={<GitBranch size={24} className="text-primary" />}
        title="Interoperability Testing & RFC 9794 Compliance"
      >
        <p>
          <InlineTooltip term="RFC 9794">RFC 9794</InlineTooltip> standardizes hybrid PQC scheme
          terminology and design rules. Two rules drive interoperability testing:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <p className="font-semibold text-primary text-sm mb-2">Rule 1: Shared Component</p>
            <p className="text-xs">
              At least one component algorithm must be supported by both parties. A pure-PQC client
              cannot connect to a classical-only server and vice versa — there&apos;s no shared
              algorithm to fall back to.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30">
            <p className="font-semibold text-secondary text-sm mb-2">
              Rule 2: Both Components Complete
            </p>
            <p className="text-xs">
              For confidentiality, all hybrid components must execute successfully. A hybrid where
              only the classical component works provides no quantum protection — the session must
              fail or fall back, not silently degrade.
            </p>
          </div>
        </div>

        <p className="mt-3">
          Test coverage must include: hybrid client → hybrid server, hybrid client → classical-only
          server (fallback path), and pure-PQC client → hybrid server (should fail per policy at
          most enterprises). The Open Quantum Safe test server at{' '}
          <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            test.openquantumsafe.org
          </span>{' '}
          provides a reference endpoint for each algorithm combination.
        </p>

        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 5: TVLA */}
      <CollapsibleSection
        icon={<Cpu size={24} className="text-primary" />}
        title="Side-Channel Testing & TVLA for Lattice Crypto"
      >
        <p>
          <InlineTooltip term="TVLA">Test Vector Leakage Assessment</InlineTooltip> is the
          standard method for detecting side-channel leakage in cryptographic implementations.
          Classical TVLA uses fixed-vs-random test vectors — but this approach breaks down for
          lattice-based PQC.
        </p>

        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 mt-2">
          <p className="font-semibold text-destructive text-sm mb-2">
            Why Classical TVLA Fails for PQC
          </p>
          <p className="text-xs">
            In ML-KEM and ML-DSA, the public key and private key are mathematically tightly
            coupled. Using a fixed public key with random plaintexts creates inputs that are not
            statistically independent — violating the assumptions of the standard t-test. Leakage
            at the NTT (Number Theoretic Transform) stage may not be detected at all.
          </p>
        </div>

        <p className="mt-3">The adapted TVLA approach for lattice crypto targets specific operations:</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {['NTT / INTT', 'Polynomial Multiplication', 'Modular Reduction', 'Key Load', 'Compression / Encoding', 'Randomness Sampling'].map(
            (stage) => (
              <div key={stage} className="p-2 rounded bg-muted border border-border text-xs text-center">
                {stage}
              </div>
            )
          )}
        </div>

        <p className="mt-3">
          The NTT (Number Theoretic Transform) is the core of lattice operations. Unmasked
          implementations consistently leak at this stage. First-order masking mitigates
          single-trace attacks but higher-order leakage can persist — requiring additional analysis
          rounds.
        </p>

        <p className="text-xs text-muted-foreground mt-2">
          Tools: Keysight Inspector Crypto 3 (commercial, FIPS 140-3 Level 4), ChipWhisperer (open
          source, power analysis + fault injection)
        </p>

        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* CTA */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-foreground">Ready to test your knowledge?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Work through 6 interactive workshops covering passive discovery, active scanning,
            performance benchmarking, interop testing, TVLA analysis, and strategy building.
          </p>
        </div>
        <button
          onClick={onNavigateToWorkshop}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          Start Workshop <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
