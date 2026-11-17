// SPDX-License-Identifier: AGPL-3.0-only
import { useRef, useState } from 'react'
import { INFOGRAPHIC_IMAGE_REVISIONS } from '@/data/infographicImageRevisions'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'
import FocusLock from 'react-focus-lock'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, Lightbulb, X, ImageOff } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { applyGlossaryToChildren } from '@/utils/parseGlossary'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * Eagerly load all curious-summary.md files at bundle time.
 * Keyed by relative path like '../modules/Module1-Introduction/curious-summary.md'.
 */
const standardSummaries = import.meta.glob('../modules/*/curious-summary.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const curiousVariantSummaries = import.meta.glob('../modules/*/curious-summary-curious.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * Map directory names to moduleId slugs (same as route paths).
 * Only entries where dir name !== moduleId need to be listed.
 */
const CURIOUS_INFOGRAPHIC_ALT_TEXT: Record<string, string> = {
  'crypto-dev-apis':
    'A fictional algorithm-plus-HSM requirement that neither of two partial-capability candidates meets; evaluate the combined operation and its evidence.',
  'pqc-testing-validation':
    'A fictional hundred-case suite contrasts ten false accepts with correct rejection of all ten invalid cases, then separates algorithm, module and deployment checks.',
  'network-security-pqc':
    'Raw ML-DSA sizes versus encoded certificates, fictional chain and TCP-window budgets, TLS termination versus passive inspection, and separate IKEv2 key-exchange and fragmentation mechanisms.',
  'emv-payment-pqc':
    'Fictional terminal replacement calculations: ten thousand terminals take five years at two thousand per year or ten years at one thousand per year, alongside conditional software overlap.',
  'hsm-pqc':
    'Conceptual stateful-signature index allocation across two signers, durable state and rollback constraints, and distinct algorithm and module-validation scopes.',
  'ot-pqc':
    'Fictional control-loop timing budgets showing a feasible nine-millisecond case and an over-budget twelve-millisecond case, with safety-path and recovery checks.',
  'iot-pqc':
    'Fictional constrained-device frame counts for ML-KEM and ML-DSA objects at 80-byte and 64-byte usable payloads; object sizes do not measure target-device performance.',
  'pki-enrollment-protocols':
    'Enrollment proof-of-possession choices for signing and KEM keys, trust in an RA, and the difference between parallel certificates and composite signatures.',
  'pqc-101':
    "A visual flowchart showing classical computers struggling to open a lock, while a quantum computer flashes a light representing Shor's Algorithm, which could break it once such a machine is large enough. Below it, math grids represent lattice cryptography securing the lock.",
  'quantum-threats':
    "A timeline showing the 'Harvest Now, Decrypt Later' threat, where hackers steal encrypted data today to decrypt it when quantum computers are powerful enough.",
  'hybrid-crypto':
    'A diagram showing a traditional RSA lock and a new PQC lattice lock combined together on a single vault door, staying secure as long as either one holds.',
  'crypto-agility':
    'A visualization of a modular IT architecture where security algorithms can be swapped out quickly without disrupting the entire system.',
  'tls-basics':
    'TLS 1.3 key establishment, raw versus hybrid key shares, and a fictional initial TCP-window calculation. The worked assumptions and limits are provided below.',
  'pqc-risk-management':
    'A heatmap grid showing likelihood versus impact scores for cryptographic assets, with high-risk systems highlighted for urgent PQC migration.',
  'data-asset-sensitivity':
    'A tiered classification pyramid showing data assets ranked from Low to Critical sensitivity, with regulatory icons for GDPR, HIPAA, and DORA alongside each tier.',
  'compliance-strategy':
    'A world map with overlapping jurisdiction timelines showing CNSA 2.0 deadlines alongside European regulatory frameworks such as eIDAS 2.0 and DORA that organizations operating across borders must reconcile.',
  'standards-bodies':
    'A three-column diagram separating Standards Bodies, Certification Bodies, and Compliance Frameworks, with arrows showing how algorithms flow from specification through validation to mandated use.',
  'migration-program':
    'Fictional sequential migration phases totaling 42 months, extending to 54 months if rollout slips twelve months, with dependency and service-scope checks.',
  'pqc-hw-acceleration':
    'CPU instructions and accelerator models, a measured KV260 FPGA comparison, seven-platform CPU signing throughput including Apple M4 Pro and M5 Max, AMD64 dispatch tests, and hybrid HSM operations. Different benchmark scopes are kept separate.',
  'dnssec-pqc':
    'A bar comparison showing a classical ECDSA signature as a small block next to a much larger ML-DSA-44 signature block, both measured against a dashed line marking the DNS UDP size limit; alongside it, a resolver icon labeled Cloudflare 1.1.1.1 checking a green checkmark against a signed test-zone icon labeled dnstest.dev, with a roadmap timeline below leading toward a 2029 target.',
  'media-drm-pqc':
    "Six panels on content protection read as written: a compromised padlock beside a row of identical padlocks; the AACS key ladder from Device Keys through a Processing Key to a Media Key; the CI Plus signature, key negotiation and scrambler primitives; the hybrid key agreement mechanisms of RFC 10024; the signature algorithms C2PA 2.4 allows; and NIST's 2030 and 2035 dates, which the media documents do not set.",
  'software-supply-chain-pqc':
    "Six panels on signatures along the software supply chain: signed releases; a status map of what each held document says about post-quantum signatures and where it is silent; the TUF roles root, targets, snapshot, timestamp and the optional mirrors; Uptane's Director and Image repositories checked against each other; the SLSA Build track levels; and what changes after a verifier has shipped.",
}

export const INFOGRAPHIC_SAMPLE_ASSUMPTIONS: Record<
  string,
  { title: string; assumptions: string }
> = {
  'pki-enrollment-protocols': {
    title: 'Sample Enrollment & Composite Framing',
    assumptions:
      'A signing key can sign proof-of-possession data. An ML-KEM key requires a supported non-signature proof: distinguish encrypted-certificate, challenge-response and separately trusted RA assertions. Parallel certificates differ from a composite signature profile combining two signature algorithms.',
  },
  'tls-basics': {
    title: 'Raw and Hybrid Key Shares & Network Assumptions',
    assumptions:
      'Raw ML-KEM-768 key 1,184 B and ciphertext 1,088 B; adding the 32 B X25519 contribution gives hybrid shares of 1,216 B and 1,120 B. A sample 10 \u00d7 1,460 B initial window is 14,600 B. Byte counts do not establish latency or negotiated-profile support.',
  },
  'iot-pqc': {
    title: 'Bounded Constrained-Device Sample Scope',
    assumptions:
      'Fictional Cortex-M4 planning scenario with 80 B usable application payload per frame: ML-KEM-512 public key 800 B needs 10 frames; ciphertext 768 B needs 10; ML-DSA-44 public key 1,312 B needs 17; signature 2,420 B needs 31. At 64 B payload the signature needs 38. These object-only counts exclude protocol, certificate and retransmission costs; measure target resource use separately.',
  },
  'ot-pqc': {
    title: 'Operational Technology Sample Boundary',
    assumptions:
      'Fictional control-loop budget 10 ms, baseline 7 ms and added processing 2 ms yields 9 ms with 1 ms margin; adding 5 ms yields 12 ms and exceeds the budget. These are arithmetic assumptions, not measured hardware results. Assess the actual safety path, zones, failure isolation and update recovery.',
  },
  'hsm-pqc': {
    title: 'Dual-Partition HA & Rollback Assumptions',
    assumptions:
      'Conceptual one-time-index example: signer A exclusively uses 0\u20137 and B 8\u201315. This illustrates allocation only, not an LMS/XMSS parameter set or enforced implementation. Durable atomic state and recovery must prevent reuse; firmware partitions do not by themselves partition signing state. Verify actual vendor-supported state and rollback behavior.',
  },
  'migration-program': {
    title: 'Enterprise vs. Sector Phased Timeline Scope',
    assumptions:
      'Fictional sequential schedule: inventory 6 + pilot 6 + rollout 24 + verification 6 = 42 months (3.5 years). A 12-month rollout extension gives 54 months (4.5 years). Overlap requires dependency analysis. The 3\u20135 year range is illustrative; scope external milestones separately.',
  },
  'emv-payment-pqc': {
    title: 'Payment Terminal Lifecycle & PCI DSS Scope',
    assumptions:
      'Fictional fleet: 10,000 terminals replaced at 2,000/year needs 5 years; at 1,000/year it needs 10 years. An 18-month software/pilot effort can overlap only where dependencies allow. Illustrative hardware and software ranges are planning assumptions; exact scheme, kernel, profile, certificates and key-service dependencies must be checked.',
  },
  'network-security-pqc': {
    title: 'Certificate Byte Sizes & Middlebox Framing',
    assumptions:
      'Raw ML-DSA-65 public key 1,952 B plus signature 3,309 B equals 5,261 B. A certificate using both adds DER metadata; other subject/issuer combinations differ. Fictional encoded chain 18,000 B exceeds a 14,600 B initial window by 3,400 B; 12,000 B fits. This does not predict exact RTT. RFC 9370 additional key exchanges and RFC 7383 fragmentation are distinct.',
  },
  'pqc-testing-validation': {
    title: 'Sample Test Scores vs. Production Assurance',
    assumptions:
      'Fictional suite: 90 valid and 10 invalid cases. Accepting all 100 completes 100 requests but gives only 90 correct outcomes and 10 false accepts. Correctly accepting 90 and rejecting 10 gives 100 correct outcomes for this bounded suite. Algorithm checks, module validation scope and deployment testing establish different things.',
  },
  'crypto-dev-apis': {
    title: 'Joint Algorithm & Key-Protection Requirements',
    assumptions:
      'Fictional requirement: ML-KEM-768 with a nonexportable HSM private key. Candidate A offers the algorithm in software; B offers HSM key protection without that algorithm. Combining checkmarks does not satisfy the joint requirement. Test an implementation that meets both or justify an explicit requirement change.',
  },
  'pqc-hw-acceleration': {
    title: 'Measured Reference Benchmarks vs. Unmeasured Targets',
    assumptions:
      'The seven-platform comparison is measured CPU ML-DSA-65 throughput, including Apple M4 Pro/M5 Max and AMD64. The separate KV260 SLH-DSA FPGA on/off comparison is not included in its CPU row. Hybrid results measure combined HSM mechanisms directly. GPU/NPU paths need separate target-specific evidence; these different scopes cannot be combined into one speed claim.',
  },
}

const DIR_TO_MODULE_ID: Record<string, string> = {
  'Module1-Introduction': 'pqc-101',
  QuantumThreats: 'quantum-threats',
  HybridCrypto: 'hybrid-crypto',
  CryptoAgility: 'crypto-agility',
  TalkingAboutPQC: 'talking-about-pqc',
  TLSBasics: 'tls-basics',
  VPNSSHModule: 'vpn-ssh-pqc',
  DNSSECPQC: 'dnssec-pqc',
  EmailSigning: 'email-signing',
  PKIWorkshop: 'pki-workshop',
  KmsPqc: 'kms-pqc',
  HsmPqc: 'hsm-pqc',
  PQCHardwareAcceleration: 'pqc-hw-acceleration',
  CryptoProductCertification: 'crypto-product-certification',
  Fips1403Certification: 'fips-140-3-certification',
  CcEuccCertification: 'cc-eucc-certification',
  PciCertification: 'pci-certification',
  DataAssetSensitivity: 'data-asset-sensitivity',
  StatefulSignatures: 'stateful-signatures',
  DigitalAssets: 'digital-assets',
  FiveG: '5g-security',
  DigitalID: 'digital-id',
  Entropy: 'entropy-randomness',
  MerkleTreeCerts: 'merkle-tree-certs',
  QKD: 'qkd',
  VendorRisk: 'vendor-risk',
  ComplianceStrategy: 'compliance-strategy',
  MigrationProgram: 'migration-program',
  PQCRiskManagement: 'pqc-risk-management',
  PQCTestingValidation: 'pqc-testing-validation',
  AcvpLabWorkflow: 'acvp-lab-workflow',
  PQCBusinessCase: 'pqc-business-case',
  PQCGovernance: 'pqc-governance',
  CodeSigning: 'code-signing',
  SoftwareSupplyChainPQC: 'software-supply-chain-pqc',
  APISecurityJWT: 'api-security-jwt',
  IoTPQC: 'iot-pqc',
  ConfidentialComputing: 'confidential-computing',
  HomomorphicEncryption: 'homomorphic-encryption',
  WebGatewayPQC: 'web-gateway-pqc',
  EMVPaymentPQC: 'emv-payment-pqc',
  CryptoDevAPIs: 'crypto-dev-apis',
  PlatformEngPQC: 'platform-eng-pqc',
  OTPQC: 'ot-pqc',
  HealthcarePQC: 'healthcare-pqc',
  AerospacePQC: 'aerospace-pqc',
  AutomotivePQC: 'automotive-pqc',
  ExecQuantumImpact: 'exec-quantum-impact',
  DevQuantumImpact: 'dev-quantum-impact',
  ArchQuantumImpact: 'arch-quantum-impact',
  OpsQuantumImpact: 'ops-quantum-impact',
  ResearchQuantumImpact: 'research-quantum-impact',
  StandardsBodies: 'standards-bodies',
  AISecurityPQC: 'ai-security-pqc',
  SecretsManagementPQC: 'secrets-management-pqc',
  NetworkSecurityPQC: 'network-security-pqc',
  DatabaseEncryptionPQC: 'database-encryption-pqc',
  IAMPQC: 'iam-pqc',
  SecureBootPQC: 'secure-boot-pqc',
  OSPQC: 'os-pqc',
  SLHDSAModule: 'slh-dsa',
  CryptoMgmtModernization: 'crypto-mgmt-modernization',
  PKIEnrollmentProtocols: 'pki-enrollment-protocols',
  MLSGroupMessaging: 'mls-group-messaging',
  PQCCandidates: 'pqc-candidates',
  VerificationClosure: 'verification-closure',
  MediaDrmPQC: 'media-drm-pqc',
}

/** Build a moduleId → markdown content lookup from the glob results */
const standardContentByModuleId: Record<string, string> = {}
for (const [filePath, content] of Object.entries(standardSummaries)) {
  // Extract dir name: '../modules/FooBar/curious-summary.md' → 'FooBar'
  const match = filePath.match(/\/modules\/([^/]+)\/curious-summary\.md$/)
  if (!match) continue
  const dirName = match[1]
  const moduleId = DIR_TO_MODULE_ID[dirName] ?? dirName.toLowerCase() // eslint-disable-line security/detect-object-injection
  standardContentByModuleId[moduleId] = content // eslint-disable-line security/detect-object-injection
}

const curiousContentByModuleId: Record<string, string> = {}
for (const [filePath, content] of Object.entries(curiousVariantSummaries)) {
  const match = filePath.match(/\/modules\/([^/]+)\/curious-summary-curious\.md$/)
  if (!match) continue
  const dirName = match[1]
  const moduleId = DIR_TO_MODULE_ID[dirName] ?? dirName.toLowerCase() // eslint-disable-line security/detect-object-injection
  curiousContentByModuleId[moduleId] = content // eslint-disable-line security/detect-object-injection
}

interface CuriousSummaryBannerProps {
  moduleId: string
  isFullPage?: boolean
}

/**
 * Collapsible "In Simple Terms" banner shown above module tabs when
 * experienceLevel === 'curious'. Renders the module's curious-summary.md.
 */
export const CuriousSummaryBanner = ({
  moduleId,
  isFullPage = false,
}: CuriousSummaryBannerProps) => {
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const isCuriousMode = experienceLevel === 'curious' || selectedPersona === 'curious'
  const [expanded, setExpanded] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const lightboxRef = useRef<HTMLDivElement>(null)
  useOverlayEscape(lightboxOpen, () => setLightboxOpen(false), { rootRef: lightboxRef })

  const idealImgSrc = `/images/infographics/pqcstd_${moduleId}.png`
  // Changed visuals need a new URL because image-cache is CacheFirst.
  const imageRevision =
    INFOGRAPHIC_IMAGE_REVISIONS[moduleId] ??
    (moduleId === 'ai-security-pqc'
      ? '65181ab040311ff4'
      : moduleId === 'merkle-tree-certs'
        ? 'c443553ff4dc196b'
        : 'pqcstd_v4')

  const [imgSrc, setImgSrc] = useState(idealImgSrc)
  const [imgFailed, setImgFailed] = useState(false)
  // Reset when the module changes (adjust-state-during-render pattern —
  // avoids a cascading-render setState-in-effect).
  const [prevIdealImgSrc, setPrevIdealImgSrc] = useState(idealImgSrc)
  if (prevIdealImgSrc !== idealImgSrc) {
    setPrevIdealImgSrc(idealImgSrc)
    setImgSrc(idealImgSrc)
    setImgFailed(false)
  }

  const handleImgError = () => {
    // Single-variant policy: only pqcstd_*.png is shipped. No fallback chain —
    // a module without its infographic hides the visual pane entirely rather
    // than rendering a broken image.
    setImgFailed(true)
  }

  if (!isCuriousMode && !isFullPage) return null

  const content = isCuriousMode
    ? curiousContentByModuleId[moduleId] || standardContentByModuleId[moduleId] // eslint-disable-line security/detect-object-injection
    : standardContentByModuleId[moduleId] // eslint-disable-line security/detect-object-injection
  if (!content) {
    // On the standalone Visual tab (isFullPage) a missing summary would render
    // an empty tab — show a purposeful empty state instead. The inline curious
    // banner still collapses to nothing.
    return isFullPage ? (
      <EmptyState
        icon={<ImageOff size={32} />}
        title="No visual summary yet"
        description="This module doesn't have an infographic or plain-language summary yet."
      />
    ) : null
  }

  // Strip the H1 title — we render our own heading
  const body = content.replace(/^#\s+.+\n+/, '')
  const altText =
    CURIOUS_INFOGRAPHIC_ALT_TEXT[moduleId] || `Infographic in simple terms for ${moduleId}`
  const sampleNote = INFOGRAPHIC_SAMPLE_ASSUMPTIONS[moduleId] // eslint-disable-line security/detect-object-injection

  return (
    <div
      className={
        isFullPage
          ? 'w-full overflow-x-hidden'
          : 'glass-panel border-l-4 border-l-warning/50 mb-3 overflow-hidden'
      }
    >
      {!isFullPage && (
        <Button
          variant="ghost"
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-between w-full px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-warning">
            <Lightbulb size={16} className="shrink-0" />
            In Simple Terms
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground shrink-0" />
          )}
        </Button>
      )}

      {(expanded || isFullPage) && (
        <div className={isFullPage ? '' : 'px-4 pb-4 -mt-1'}>
          {/* Mobile Layout: Full-width visual stacked above In Simple Terms */}
          <div className="md:hidden flex flex-col gap-y-4">
            {!imgFailed && (
              <div className="w-full bg-muted/30 rounded-lg border border-border p-2 sm:p-3 flex flex-col items-center">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="block w-full p-0 h-auto bg-transparent hover:bg-transparent cursor-zoom-in"
                  aria-label="View infographic full size"
                >
                  <img
                    src={`${imgSrc}?v=${imageRevision}`}
                    alt={altText}
                    loading="lazy"
                    onError={handleImgError}
                    className="w-full h-auto max-h-[60vh] object-contain rounded-md shadow-md"
                  />
                </Button>
                <p className="text-center text-[11px] text-muted-foreground mt-1.5">
                  Tap image to zoom
                </p>
                {sampleNote && (
                  <div
                    data-testid="infographic-sample-assumptions"
                    className="mt-2.5 w-full rounded-md border border-primary/25 bg-card/80 p-2.5 text-left text-xs text-muted-foreground"
                  >
                    <p className="font-semibold text-foreground">{sampleNote.title}</p>
                    <p className="mt-0.5 leading-relaxed">{sampleNote.assumptions}</p>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-p:text-sm prose-p:leading-relaxed prose-strong:text-foreground prose-ul:text-sm prose-li:text-sm">
                <h3 className="text-base font-bold text-foreground mb-3 border-b border-border pb-2 mt-0 flex items-center gap-2">
                  <Lightbulb size={18} className="text-warning" />
                  In Simple Terms
                </h3>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p({ children, ...props }) {
                      return <p {...props}>{applyGlossaryToChildren(children)}</p>
                    },
                    li({ children, ...props }) {
                      return <li {...props}>{applyGlossaryToChildren(children)}</li>
                    },
                  }}
                >
                  {body}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Desktop Layout: Visual on left, In Simple Terms on right */}
          <div
            className={
              imgFailed ? 'hidden md:block' : 'hidden md:grid md:grid-cols-[6fr_4fr] gap-x-6'
            }
          >
            {/* Left: Infographic */}
            {!imgFailed && (
              <div className="w-full bg-muted/30 rounded-lg border border-border p-3 flex flex-col items-center self-start">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="block w-full p-0 h-auto bg-transparent hover:bg-transparent cursor-zoom-in"
                  aria-label="View infographic full size"
                >
                  <img
                    src={`${imgSrc}?v=${imageRevision}`}
                    alt={altText}
                    loading="lazy"
                    onError={handleImgError}
                    className="w-full h-auto object-contain rounded-md shadow-md"
                  />
                </Button>
                <p className="text-center text-[11px] text-muted-foreground mt-2">
                  Click image to zoom
                </p>
                {sampleNote && (
                  <div
                    data-testid="infographic-sample-assumptions"
                    className="mt-2.5 w-full rounded-md border border-primary/25 bg-card/80 p-2.5 text-left text-xs text-muted-foreground"
                  >
                    <p className="font-semibold text-foreground">{sampleNote.title}</p>
                    <p className="mt-0.5 leading-relaxed">{sampleNote.assumptions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Right: In Simple Terms */}
            <div className="overflow-x-auto">
              <div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-p:text-sm prose-p:leading-relaxed prose-strong:text-foreground prose-ul:text-sm prose-li:text-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2 mt-0 flex items-center gap-2">
                  <Lightbulb size={20} className="text-warning" />
                  In Simple Terms
                </h3>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p({ children, ...props }) {
                      return <p {...props}>{applyGlossaryToChildren(children)}</p>
                    },
                    li({ children, ...props }) {
                      return <li {...props}>{applyGlossaryToChildren(children)}</li>
                    },
                  }}
                >
                  {body}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {lightboxOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <FocusLock returnFocus className="contents">
            <div
              ref={lightboxRef}
              className="fixed inset-0 embed-backdrop z-dialog bg-card/95 backdrop-blur-sm flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Infographic full view"
            >
              {/* Invisible backdrop — clicking outside the image closes the lightbox */}
              <Button
                variant="ghost"
                type="button"
                className="absolute inset-0 w-full h-full p-0 rounded-none bg-transparent hover:bg-transparent cursor-default"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close infographic"
                tabIndex={-1}
              />
              <img
                src={`${imgSrc}?v=${imageRevision}`}
                alt={altText}
                className="relative z-10 max-w-full max-h-[90vh] object-contain rounded-md select-none"
                style={{ touchAction: 'pinch-zoom' }}
              />
              <Button
                variant="ghost"
                className="absolute top-4 right-4 z-10 text-foreground hover:text-foreground/70 hover:bg-muted/30"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close infographic"
              >
                <X size={24} />
              </Button>
              <p className="absolute bottom-4 left-0 right-0 z-10 text-center text-xs text-muted-foreground pointer-events-none">
                Pinch to zoom · Tap outside to close
              </p>
            </div>
          </FocusLock>,
          document.body
        )}
    </div>
  )
}
