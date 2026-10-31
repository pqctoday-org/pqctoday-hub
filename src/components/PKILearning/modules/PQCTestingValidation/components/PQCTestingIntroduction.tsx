// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { useActiveLearnPathId } from '@/components/PKILearning/common/useLearnPath'
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
  FileBadge,
  Building2,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Cite } from '@/components/PKILearning/modules/AcvpLabWorkflow/components/Cite'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'
import manifest from '../manifest'
import { CERTIFICATION_PATH } from '../data/learnPathTags'

interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  sectionId?: string
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon,
  title,
  defaultOpen = false,
  children,
  sectionId,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section data-section-id={sectionId} className="glass-panel p-6 scroll-mt-20">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        // `Button` sets `whitespace-nowrap`; without `whitespace-normal` + `min-w-0`
        // the flex-1 heading takes its full intrinsic width (up to ~500px) and pushes
        // the whole section past a 390px viewport.
        className="flex h-auto w-full items-center gap-3 whitespace-normal py-2 text-left"
      >
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">{icon}</div>
        <h2 className="min-w-0 flex-1 break-words text-lg font-bold text-gradient sm:text-xl">
          {title}
        </h2>
        <ChevronRight
          size={18}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
        />
      </Button>
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
  useSectionAnchors()
  const onCertificationRoute = useActiveLearnPathId(manifest.id, manifest) === CERTIFICATION_PATH

  return (
    <div className="space-y-8 w-full">
      {/* Section 1: Why PQC Testing Is Different */}
      <CollapsibleSection
        icon={<AlertTriangle size={24} className="text-primary" />}
        title="Why PQC Testing Is Different"
        defaultOpen
        sectionId="why-pqc-testing"
      >
        <p>
          Testing post-quantum cryptography deployments is fundamentally different from classical
          crypto testing. Three forces make it uniquely challenging:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30">
            <p className="font-semibold text-status-warning mb-1">Performance Cliffs</p>
            <p className="text-xs">
              In GSMA PQ.06 (27 May 2026), enabling hybrid key negotiation with seven additional
              ML-KEM-1024 exchanges raised the average time to establish one IKE SA from 140 ms to
              335 ms. Certificates add a second kind of cost: a pure PQC certificate CHAIN reaches
              ~17KB by this module&apos;s arithmetic, more than the 14,600-byte initial window of 10
              segments (RFC 6928), so that flight takes more than one round trip. (One ML-DSA-65
              certificate is ~5-6KB: a 1,952-byte public key plus a 3,309-byte signature plus X.509
              overhead. It is the chain that breaks the budget.)
            </p>
          </div>
          <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30">
            <p className="font-semibold text-status-info mb-1">Interop Fragility</p>
            <p className="text-xs">
              A hybrid ClientHello adds about 1.2 KB (the X25519MLKEM768 key share is 1,216 bytes
              against 32 bytes for X25519 alone; RFC 10024 §4.1). Faulty server implementations
              silently reject the larger message. Pure PQC clients fail on servers that accept only
              hybrid key exchange.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="font-semibold text-destructive mb-1">Implementation Leakage</p>
            <p className="text-xs">
              ML-KEM and ML-DSA reference implementations leak key material via power analysis at
              the NTT stage. A fixed-vs-random TVLA test alone is not enough for lattice crypto: it
              also flags public-data leakage, so labs add specific tests on the secret-handling
              stages.
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
            A TCP connection costs one round trip before application data can flow (RFC 9293 section
            3.5), and a TLS 1.3 handshake costs one more (RFC 8446 section 2). On high-latency links
            (satellite, WAN) every round trip costs more. NIST SP 1800-38C&apos;s TLS 1.3 tests, at
            a simulated 133 ms round-trip time with an ECDSA P256 server certificate, found
            &ldquo;essentially minimal impact on the handshake time&rdquo;: the hybrid key exchange
            even with Kyber-1024 was &ldquo;just a few milliseconds slower&rdquo; than P256. The
            extra round trips NIST reported came from other causes: a 3% loss probability led to
            &ldquo;almost an extra round-trip&rsquo;s delay&rdquo;, and in the QUIC tests Dilithium
            authentication data from the server above the initial congestion window (~14 KB) or the
            amplification window (~3.6 KB) can add one. This changes where you need to optimize.
          </p>
        </div>

        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 2: Passive vs Active */}
      <CollapsibleSection
        icon={<Radio size={24} className="text-primary" />}
        title="Passive Discovery vs Active Scanning"
        sectionId="passive-vs-active"
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
        sectionId="performance-testing-method"
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
                realistic load. Document hardware specs — CPU, NIC offload capabilities, available
                RAM.
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
                X25519+ML-KEM-768 adds about 1.2 KB to ClientHello (1,216-byte key share vs 32
                bytes) but minimal compute overhead on modern hardware. Test WAN separately —
                fragmentation risk increases with distance.
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
                A pure ML-DSA-65 certificate chain (~17KB) exceeds the typical TCP initial
                congestion window of 10 segments (10 × 1,460 B = 14,600 B, RFC 6928). On
                high-latency links, this forces extra round-trips. Measure the whole chain your
                server actually sends, not one leaf certificate, and test against your worst-case
                latency links.
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

      {/* Section 3b: Enterprise Reality — Hidden Costs */}
      <CollapsibleSection
        icon={<Building2 size={24} className="text-primary" />}
        title="Enterprise Reality: Hidden Performance Costs"
      >
        <p>
          Lab benchmarks measure clean-path overhead, but enterprise networks have middleboxes,
          hardware constraints, and bursty traffic that amplify PQC costs far beyond what simple
          protocol testing reveals.
        </p>

        <div className="space-y-4 mt-2">
          {/* NGFW Double-Handshake */}
          <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30">
            <p className="font-semibold text-status-warning mb-2 flex items-center gap-2">
              <AlertTriangle size={14} />
              NGFW / SGW Double-Handshake Overhead
            </p>
            <p className="text-xs">
              Enterprise traffic flows through Next-Generation Firewalls (NGFWs) and Secure Web
              Gateways (SGWs) that decrypt, inspect, and re-encrypt every TLS session. Each
              inspection point must complete a full PQC handshake with <em>both</em> the client and
              the destination server — effectively <strong>doubling</strong> the cryptographic
              workload per hop.
            </p>
            <p className="text-xs mt-2">
              A typical enterprise proxy chain (NGFW → SGW → DLP) means each connection pays the PQC
              handshake cost <strong>three times</strong>. Where VIAVI&apos;s white paper Testing,
              Measuring and Managing PQC Migration reports a sharp drop in connection rate on a
              clean path, enterprises with inspection chains should expect a much larger one (our
              estimate).
            </p>
          </div>

          {/* Hardware Acceleration Gaps */}
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="font-semibold text-destructive mb-2 flex items-center gap-2">
              <Cpu size={14} />
              Hardware Acceleration Gaps
            </p>
            <p className="text-xs">
              Most network security appliances rely on dedicated silicon for RSA and ECC
              acceleration. These chips{' '}
              <strong>cannot accelerate ML-KEM or PQ signature algorithms</strong> — devices fall
              back to general-purpose CPUs under PQC workloads.
            </p>
            <p className="text-xs mt-2">
              Under high connection rates, this can reduce appliance capacity by{' '}
              <strong>50-90%</strong> (our estimate) compared to hardware-accelerated classical
              crypto. Vendors acknowledge that many existing deployments will require new hardware
              for PQC at scale.
            </p>
          </div>

          {/* Bursty Traffic */}
          <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30">
            <p className="font-semibold text-status-info mb-2 flex items-center gap-2">
              <Info size={14} />
              Bursty Traffic Amplification
            </p>
            <p className="text-xs">
              PQC overhead hits hardest in environments with short-lived, bursty connections. Login
              storms (morning surges, post-outage reconnections), API spikes, and microservice
              authentication chatter all pay the <strong>full PQC handshake cost</strong> per
              connection.
            </p>
            <p className="text-xs mt-2">
              Unlike persistent VPN tunnels that amortize setup cost over hours, bursty workloads
              continuously create new TLS sessions. VIAVI testing showed web pages loading{' '}
              <strong>48× slower</strong> with PQC — a metric driven by repeated short connections,
              not raw crypto speed.
            </p>
          </div>

          {/* Session Resumption Mitigation */}
          <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/30">
            <p className="font-semibold text-status-success mb-2 flex items-center gap-2">
              <CheckCircle size={14} />
              Mitigation: TLS Session Resumption
            </p>
            <p className="text-xs">
              TLS session resumption allows returning clients to reuse previously negotiated
              parameters via Pre-Shared Keys (PSK), skipping the expensive PQC key exchange
              entirely. VIAVI&apos;s white paper says this eliminates <strong>80-90%</strong> of the
              PQC performance impact for returning users.
            </p>
            <p className="text-xs mt-2">
              Combined with hardware acceleration (AVX2/AVX-512 or FPGA accelerators for lattice
              operations) and hybrid mode (PQC + classical), organizations can reduce the production
              impact to manageable levels. The key is{' '}
              <em>measuring these mitigations under realistic conditions</em> — not assuming lab
              results translate to production.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted border border-border mt-2">
          <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Info size={16} className="text-primary" />
            VIAVI TeraVM Production-Scale Results
          </p>
          <p className="text-xs">
            VIAVI&apos;s white paper Testing, Measuring and Managing PQC Migration reports testing
            on Dell R6625 hardware with HAProxy (TLS) and Strongswan (IKEv2) against more than a
            million emulated users: <strong>markedly fewer connections per second</strong>,{' '}
            <strong>lower throughput</strong>,{' '}
            <strong>client response times an order of magnitude higher</strong>, and{' '}
            <strong>VPN tunnel setup rates cut to a fraction</strong>. The paper sits behind a
            registration wall, so its other figures are not reproduced here. Those results represent
            the floor — enterprise middlebox chains multiply them further.
          </p>
        </div>

        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 4: Interoperability Testing */}
      <CollapsibleSection
        icon={<GitBranch size={24} className="text-primary" />}
        title="Interoperability Testing & RFC 9794 Compliance"
        sectionId="interop-testing"
      >
        <p>
          <InlineTooltip term="RFC 9794">RFC 9794</InlineTooltip> (Informational, June 2025) defines
          the terminology for post-quantum/traditional hybrid schemes; it does not set protocol
          rules. The two rules below are this module&apos;s test practice, not RFC requirements:
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
          The mechanism itself is in the protocol document, not in RFC 9794. For TLS 1.3 the hybrid
          key exchange construction (draft-ietf-tls-hybrid-design, published as RFC 9954,
          Informational, July 2026) concatenates the two component shared secrets and uses the
          result in the key schedule in place of the (EC)DHE secret, so a session only gets a hybrid
          secret if both components completed. It describes a non-hybrid result as the expected
          outcome only when the hybrid-aware endpoint is willing to downgrade (§1.4), so a test
          should confirm that any fallback is a visible, intended outcome.
        </p>

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
        sectionId="side-channel-tvla"
      >
        <p>
          <InlineTooltip term="TVLA">Test Vector Leakage Assessment</InlineTooltip> is a widely used
          method for detecting side-channel leakage in cryptographic implementations. Its
          non-specific test compares fixed-input and random-input trace groups; its specific tests
          target chosen intermediate values.
        </p>

        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 mt-2">
          <p className="font-semibold text-destructive text-sm mb-2">
            Why a Fixed-vs-Random Test Alone Is Not Enough for PQC
          </p>
          <p className="text-xs">
            A non-specific fixed-vs-random test flags any input-dependent difference, including
            leakage of public data such as ciphertexts, so a failing result does not by itself show
            that secret data leaks. PQC labs therefore add specific tests on the operations that
            handle secrets: the NTT, sampling and, in ML-KEM, the Fujisaki–Okamoto re-encryption.
          </p>
        </div>

        <p className="mt-3">
          The adapted TVLA approach for lattice crypto targets specific operations:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {[
            'NTT / INTT',
            'Polynomial Multiplication',
            'Modular Reduction',
            'Key Load',
            'Compression / Encoding',
            'Randomness Sampling',
          ].map((stage) => (
            <div
              key={stage}
              className="p-2 rounded bg-muted border border-border text-xs text-center"
            >
              {stage}
            </div>
          ))}
        </div>

        <p className="mt-3">
          The NTT (Number Theoretic Transform) is the core of lattice operations. Unmasked
          implementations consistently leak at this stage. First-order masking mitigates
          single-trace attacks but higher-order leakage can persist — requiring additional analysis
          rounds.
        </p>

        <p className="text-xs text-muted-foreground mt-2">
          Tools: Keysight Inspector Crypto 3 (commercial leakage testing), ChipWhisperer (open
          source, power analysis + fault injection). CMVP has no approved non-invasive attack test
          metrics yet: SP 800-140F §6.2 says &ldquo;No additional requirements at this time&rdquo;.
        </p>

        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 mt-3">
          <p className="font-semibold text-status-info text-sm mb-2">
            ISO/IEC 17825 and FIPS 140-3: what is and is not required
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs pl-1">
            <li>
              <strong>What the standard is.</strong>{' '}
              <a
                href="https://www.iso.org/standard/82422.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ISO/IEC 17825
              </a>{' '}
              sets non-invasive attack mitigation test metrics for checking conformance with ISO/IEC
              19790 at Security Levels 3 and 4. ISO lists the 2016 edition as{' '}
              <a
                href="https://www.iso.org/standard/60612.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                withdrawn on 19 January 2024
              </a>
              ; ISO/IEC 17825:2024 is the current edition.
            </li>
            <li>
              <strong>What CMVP has defined.</strong> NIST{' '}
              <a
                href="https://doi.org/10.6028/NIST.SP.800-140F"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                SP 800-140F
              </a>{' '}
              (March 2020) replaces ISO/IEC 19790 Annex F, and its §6.2 &ldquo;Approved non-invasive
              attack mitigation test metrics&rdquo; reads &ldquo;No additional requirements at this
              time&rdquo;. ISO/IEC 17825 is named only in the August 2021 draft of SP 800-140F Rev.
              1 (with ISO/IEC 20085-1 and -2), which NIST still lists as a draft.
            </li>
            <li>
              <strong>Where side channels land in a validation today.</strong> CMVP Implementation
              Guidance 12.A says: &ldquo;Until requirements of SP 800-140F are defined, non-invasive
              mechanisms fall under ISO/IEC 19790:2012 Section 7.12 Mitigation of other
              attacks.&rdquo; If a module was purposely designed, built and publicly documented to
              mitigate specific attacks, that section applies and its assertions (AS12.01 to
              AS12.04, as applicable) must be addressed.
            </li>
            <li>
              <strong>Not found.</strong> No CMVP statement says that ISO/IEC 17825 testing is
              required or accepted for a certificate, and SP 800-140F defines no approved metric, so
              a TVLA result is not an approved CMVP test metric.
            </li>
          </ul>
          <p className="text-sm mt-2">
            For how a Common Criteria or EUCC evaluation looks at side-channel attacks on
            post-quantum code (AVA_VAN.5), see{' '}
            <Link
              to="/learn/cc-eucc-certification?tab=learn&section=eucc-pqc-today"
              className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
            >
              Common Criteria, EUCC &amp; eIDAS Certification
            </Link>
            .
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">
            Sources: ISO catalogue pages above; NIST SP 800-140F (March 2020) abstract and §6.2; SP
            800-140F Rev. 1 draft (August 2021) §6.2; FIPS 140-3 Implementation Guidance (last
            update 19 August 2026) IG 12.A, Additional Comments and Resolution.
          </p>
        </div>

        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 6: FIPS 140-3 & ACVP */}
      <CollapsibleSection
        icon={<FileBadge size={24} className="text-primary" />}
        title="FIPS 140-3 & Algorithm Validation (CAVP, via ACVP)"
        sectionId="fips-acvp"
      >
        <p>
          Before performance testing, interoperability, or TVLA, a cryptographic implementation must
          be functionally correct. NIST&apos;s Cryptographic Algorithm Validation Program (CAVP)
          checks this: the implementation is tested through the{' '}
          <InlineTooltip term="ACVP">Automated Cryptographic Validation Protocol</InlineTooltip>{' '}
          and, if it passes, receives an <strong>algorithm certificate</strong>. That is not a
          module certificate.
        </p>
        <p className="mt-2">
          A FIPS 140-3 certificate comes from a separate program, the Cryptographic Module
          Validation Program (CMVP), which validates the whole module. The module certificate lists
          its approved algorithms, which (apart from a few vendor-affirmed functions) are backed by
          algorithm certificates. Where a law, policy or contract requires FIPS 140-3 validated
          modules &mdash; US federal systems, for example &mdash; algorithm validation is one
          prerequisite, not the whole requirement.
        </p>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 mt-2">
          <p className="font-semibold text-primary text-sm mb-2">
            The Testing Mechanism: Issued Test Vectors
          </p>
          <p className="text-xs">
            ACVP messages are JSON exchanged over HTTPS <Cite s="acvpSpec" at="§6, §8" />. The
            client registers the algorithm capabilities it implements, the server generates matching
            test vector sets (the prompt), the implementation computes its answers and uploads them
            (the response), and the server returns a disposition for each vector set{' '}
            <Cite s="acvpSpec" at="§12.4" />. A vector set passes only when every test case in it
            passes, and even then the pass is not itself the validation{' '}
            <Cite s="acvpSpec" at="§5.4" />. The <em>.req</em>/<em>.rsp</em> request and response
            files often associated with NIST test vectors belong to ACVP&apos;s predecessor, the
            CAVS tool (e.g.{' '}
            <a
              href="https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/shs/SHAVS.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              SHAVS §6.2.1
            </a>
            ), which the CAVP page lists as deprecated by ACVTS <Cite s="cavp" />.
          </p>
        </div>

        <p className="mt-3">
          For PQC algorithms like <strong>ML-KEM</strong> and <strong>ML-DSA</strong>, the ACVP
          sub-specifications define test types for key generation, encapsulation and decapsulation,
          and signature generation and verification <Cite s="acvpMlKem" /> <Cite s="acvpMlDsa" />.
          FIPS 203 and FIPS 204 expose internal interfaces that take the randomness as an input,
          which is what lets a test vector fix it <Cite s="fips203" at="§6" />{' '}
          <Cite s="fips204" at="§6" />. ACVP testing does not cover everything: the same
          sub-specifications leave out zeroization of intermediate values, DRBG strength, and
          incorrect-length keys and signatures, and the CMVP laboratory must confirm the algorithm
          requirements CAVP testing does not reach <Cite s="cmvpMM" at="§2.6.2" />.
        </p>

        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 7: Capacity Planning & Verification (Applied Quantum §6/§7) */}
      <CollapsibleSection
        icon={<Cpu size={24} className="text-primary" />}
        title="Capacity Planning & Handshake Verification"
        sectionId="capacity-verification"
      >
        <p>
          PQC is not free at scale. Larger keys and signatures, plus heavier key generation, change
          the load profile of every endpoint that terminates a handshake. Before a wave cutover,
          size the infrastructure: model the <strong>per-handshake cost increase</strong> against
          peak connections-per-second, not just average load.
        </p>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-3 font-semibold text-muted-foreground">
                  Capacity dimension
                </th>
                <th className="py-2 px-3 font-semibold text-muted-foreground">
                  Classical baseline
                </th>
                <th className="py-2 pl-3 font-semibold text-primary">PQC / hybrid impact</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  dim: 'TLS handshake bytes on the wire',
                  base: '~0.3–1 KB ClientHello',
                  pqc: 'adds about 1.2 KB with hybrid (1,216-byte X25519MLKEM768 key share = 1,184-byte ML-KEM-768 encapsulation key, FIPS 203, + 32-byte X25519 share); a ClientHello of about 1.5 KB is still inside the 10-segment initial window (RFC 6928)',
                },
                {
                  dim: 'Certificate / chain size',
                  base: 'ECC chain ~1–2 KB',
                  pqc: 'ML-DSA chain ~10–17 KB — buffer & MTU pressure',
                },
                {
                  dim: 'CPU per handshake (sign / keygen)',
                  base: 'ECDSA P-256 reference',
                  pqc: 'ML-DSA verify is fast; keygen/sign heavier — size CPS headroom',
                },
                {
                  dim: 'Session memory / state',
                  base: 'Small per-session keys',
                  pqc: 'Larger KEM secrets & buffers — multiply by concurrent sessions',
                },
                {
                  dim: 'HSM throughput',
                  base: 'Classical op/s rating',
                  pqc: 'Confirm vendor PQC op/s — often lower; can become the bottleneck',
                },
              ].map((row) => (
                <tr key={row.dim} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-3 font-medium text-foreground">{row.dim}</td>
                  <td className="py-2 px-3 text-muted-foreground">{row.base}</td>
                  <td className="py-2 pl-3 text-foreground/80">{row.pqc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/30 mt-3">
          <p className="font-semibold text-status-success text-sm mb-1 flex items-center gap-2">
            <CheckCircle size={16} />A successful PQC handshake states a fact
          </p>
          <p className="text-xs">
            A completed hybrid or pure-PQC handshake is positive proof: both endpoints negotiated,
            exchanged, and verified post-quantum material end to end. It is the cheapest, most
            trustworthy verification signal you have — far stronger than a config flag or an
            inventory record. Instrument your edge to{' '}
            <strong>count negotiated PQC handshakes</strong> as a live migration KPI: the curve
            climbing toward the 100% target is your real cutover evidence, and a stalled curve
            surfaces silent interop failures the inventory can&apos;t see.
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Sources: Applied Quantum PQC Migration Framework §6 (Infrastructure &amp; Performance) and
          §7 (Validation).
        </p>

        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* CTA */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-foreground">Ready to test your knowledge?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {onCertificationRoute
              ? 'Work through the 2 workshop steps on your route (TVLA leakage analysis and ACVP validation).'
              : 'Work through 7 interactive workshops covering passive discovery, active scanning, performance benchmarking, interop testing, TVLA analysis, strategy building, and ACVP validation.'}
          </p>
        </div>
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors whitespace-nowrap"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  )
}
