// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  KeyRound,
  Lock,
  Shuffle,
  Cloud,
  RefreshCw,
  Building2,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Wrench,
  Route,
  Shield,
  KeySquare,
  Database,
  Brain,
} from 'lucide-react'
import {
  KEY_SIZE_COMPARISONS,
  ENVELOPE_ENCRYPTION_STEPS,
  HYBRID_COMBINER_MODES,
  ENTERPRISE_SCENARIO,
} from '../data/kmsConstants'
import { KMS_PROVIDERS, KMS_STATUS_LABELS, getKmsPqcStatus } from '../data/kmsProviderData'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { RecordDecisionLink } from '@/components/PKILearning/RecordDecisionLink'
import { LearnSection } from '@/components/PKILearning/common/LearnSection'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

interface KmsPqcIntroductionProps {
  onNavigateToWorkshop: () => void
}

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

interface ExchangePath {
  path: string
  mechanism: string[]
  quantumSafe: string
  whereKeyEnds: string
}

/**
 * AWS KMS key-exchange paths, from the AWS KMS Developer Guide and API Reference pages
 * (post-quantum keys, importing key material, Encapsulate, Decapsulate, GenerateDataKeyPair).
 * Sentences that are claim-matched to a Library row are reproduced word for word.
 */
const AWS_EXCHANGE_PATHS: ExchangePath[] = [
  {
    path: 'Import (BYOK) into AWS KMS',
    mechanism: [
      'GetParametersForImport returns an RSA wrapping public key and an import token; ImportKeyMaterial accepts the wrapped key.',
      'AWS KMS imports key material under an RSA wrapping key (RSA_2048, RSA_3072 or RSA_4096), or an SM2 wrapping key in the China Regions, and cannot import key material into ML-DSA or ML-KEM KMS keys.',
      'A 256-bit AES or HMAC key is wrapped with RSAES_OAEP_SHA_256 or RSAES_OAEP_SHA_1. RSA private key material requires RSA_AES_KEY_WRAP_SHA_256 or RSA_AES_KEY_WRAP_SHA_1, and ECC private keys may use either family. RSAES_PKCS1_V1_5 has not been supported since 10 October 2023.',
    ],
    quantumSafe:
      'No. The wrap is RSA. Hybrid post-quantum TLS protects the API call that carries it, not the wrap.',
    whereKeyEnds: 'Inside AWS KMS, in an imported key.',
  },
  {
    path: 'Export out of AWS KMS',
    mechanism: [
      'A KMS key is not exported. Only data keys and data key pairs come out.',
      'AWS KMS GenerateDataKeyPair can return ML-KEM data key pairs, with the private key in seed format, encrypted under a symmetric KMS key.',
      'The response also carries a plaintext copy of the private key unless a Nitro enclave Recipient is used, and a Recipient is limited to the RSAES_OAEP_SHA_256 algorithm.',
    ],
    quantumSafe:
      'Encrypting under a symmetric AES-256 KMS key: yes. Delivery to a Nitro enclave Recipient: no, it is RSA.',
    whereKeyEnds: 'The caller’s memory, outside any HSM.',
  },
  {
    path: 'ML-KEM key establishment',
    mechanism: [
      'The partner gets the public key with GetPublicKey and encapsulates with its own library; AWS KMS Decapsulate recovers the secret.',
      "AWS KMS Encapsulate works only with the public key of a KMS ML-KEM key. Encapsulating to a partner's HSM key therefore happens in the caller's own library.",
      'AWS KMS Decapsulate returns the 32-byte ML-KEM shared secret in plaintext to the calling application.',
    ],
    quantumSafe:
      'Yes for the key establishment (FIPS 203). The secret then lives outside the HSM, so any wrapping or key derivation done with it is the application’s job.',
    whereKeyEnds:
      'The application’s memory, in plaintext. It is not a KMS key, and Decapsulate has no Recipient option to deliver it to an enclave.',
  },
  {
    path: 'Hybrid, combined in your application',
    mechanism: [
      'Combine an ECDH secret (the DeriveSharedSecret operation) with the Decapsulate secret using an approved key combiner or key derivation (SP 800-56C, SP 800-227 Section 4.6.2), in your own code.',
      'The AWS KMS ML-KEM key specs are ML_KEM_512, ML_KEM_768 and ML_KEM_1024; none of them is a hybrid.',
    ],
    quantumSafe:
      'The combined secret is quantum-safe if the ML-KEM part is, but the combiner runs outside the HSM.',
    whereKeyEnds: 'The application’s memory.',
  },
  {
    path: 'RSA key transport',
    mechanism: [
      'The partner encrypts the key to the public key of a KMS RSA key; Decrypt returns the plaintext to the caller.',
    ],
    quantumSafe: 'No. RSA key transport is quantum-vulnerable.',
    whereKeyEnds: 'The caller’s memory.',
  },
]

const CloudKeyExchange: React.FC = () => (
  <div className="space-y-4" data-testid="cloud-key-exchange">
    <h3 className="text-base font-bold text-foreground">
      Exchanging keys with a third-party HSM or KMS
    </h3>
    <p className="text-muted-foreground">
      Moving a key between a partner HSM or key manager and a cloud KMS is a different problem from
      encrypting data with a KMS. This section sets out what AWS KMS, Google Cloud KMS and Azure Key
      Vault document for key import and key establishment as of November 2026, whether each path is
      quantum-safe, and where the key ends up. Workshop Step 7, &ldquo;Cloud KMS Key
      Exchange,&rdquo; simulates these flows in the browser; no cloud service is called.
    </p>
    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
      <p className="text-sm text-foreground">
        <strong>Headline, November 2026.</strong> The AWS and Azure pages cited here describe
        RSA-based key import only (AWS adds an SM2 wrapping key in the China Regions): for AWS KMS
        and Azure Key Vault there is no quantum-safe import path in these pages, and they describe
        no preview of one. Google Cloud KMS documents a quantum-safe import built on HPKE, in
        Preview, for software-protected keys. A quantum-safe transport protects the API call that
        carries a wrapped key; it does not change how the key is wrapped.
      </p>
    </div>

    <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
      <h4 className="font-semibold text-foreground">AWS KMS</h4>
      <p className="text-sm text-muted-foreground">
        AWS KMS offers ML-DSA signing keys (ML_DSA_44, ML_DSA_65, ML_DSA_87) and ML-KEM
        key-establishment keys (ML_KEM_512, ML_KEM_768, ML_KEM_1024). AWS added ML-KEM keys to AWS
        KMS on 26 October 2026; they are not available in the China, Middle East (UAE) and Middle
        East (Bahrain) Regions. Neither key family can receive imported key material.
      </p>
      <div
        className="overflow-x-auto"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard.
        tabIndex={0}
        role="region"
        aria-label="AWS KMS key exchange paths"
      >
        <table className="w-full min-w-[40rem] text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-2 font-medium">Path</th>
              <th className="py-2 px-2 font-medium">Mechanism</th>
              <th className="py-2 px-2 font-medium">Quantum-safe?</th>
              <th className="py-2 px-2 font-medium">Where the key ends up</th>
            </tr>
          </thead>
          <tbody>
            {AWS_EXCHANGE_PATHS.map((row) => (
              <tr key={row.path} className="border-b border-border/50 align-top">
                <th scope="row" className="py-2 px-2 text-left font-semibold text-foreground">
                  {row.path}
                </th>
                <td className="py-2 px-2 text-muted-foreground space-y-1">
                  {row.mechanism.map((m) => (
                    <p key={m}>{m}</p>
                  ))}
                </td>
                <td className="py-2 px-2 text-muted-foreground">{row.quantumSafe}</td>
                <td className="py-2 px-2 text-muted-foreground">{row.whereKeyEnds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">
        An external key store keeps the key in your own HSM (see the HYOK card above); it supports
        only symmetric encryption keys and offers no ML-KEM path. AWS Payment Cryptography has its
        own key import and export methods; they are not covered here. AWS KMS supports hybrid
        post-quantum TLS that combines ECDH with ML-KEM on its service endpoints. AWS lists hybrid
        post-quantum key exchange as launched on FIPS and non-FIPS endpoints for AWS KMS, AWS
        Payment Cryptography and the AWS CloudHSM control plane. AWS pages differ on the edges, so
        check the endpoint and Region you use: the AWS KMS hybrid post-quantum TLS page says all
        endpoints including FIPS 140-3 validated endpoints in the Regions where AWS KMS is
        available, the AWS PQ readiness page lists FIPS and non-FIPS endpoints in commercial and US
        GovCloud Regions as launched, and the{' '}
        <a
          href="https://docs.aws.amazon.com/kms/latest/developerguide/infrastructure-security.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Infrastructure security in AWS KMS
        </a>{' '}
        page says AWS KMS supports hybrid post-quantum TLS in all Regions except the China Regions
        and does not support it on AWS GovCloud (US) FIPS endpoints.
      </p>
      <p className="text-sm text-muted-foreground">
        AWS&apos;s post-quantum keys page notes that AWS KMS is closely tracking the IETF
        post-quantum HPKE draft as a replacement for RSA-based encryption; it describes no import
        feature built on it.
      </p>
    </div>

    <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
      <h4 className="font-semibold text-foreground">Google Cloud KMS</h4>
      <p className="text-sm text-muted-foreground">
        Google Cloud KMS key import wraps key material for transfer using RSA-based import methods.
        The quantum-safe HPKE methods are a separate set of import methods in Preview. The RSA
        methods use RSAES-OAEP with SHA-1 plus AES-KWP, or with SHA-256 with or without AES-KWP,
        under a 3072-bit or 4096-bit import-job key.
      </p>
      <p className="text-sm text-muted-foreground">
        Google Cloud KMS quantum-safe key import, in Preview, wraps imported key material with HPKE
        using X-Wing, ML-KEM-768 or ML-KEM-1024 with HKDF-SHA256 and AES-256-GCM. The Cloud KMS
        release notes date the Preview to 6 August 2026. It is supported for software-backed keys
        (SOFTWARE protection level) only.
      </p>
      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
        <li>
          You create an import job with one of the import methods
          HPKE_KEM_XWING_HKDF_SHA256_AES_256_GCM, HPKE_KEM_ML_KEM_768_HKDF_SHA256_AES_256_GCM or
          HPKE_KEM_ML_KEM_1024_HKDF_SHA256_AES_256_GCM. A job expires after three days.
        </li>
        <li>
          When the job is ACTIVE you download its public key. On your side, wrapping runs
          HPKE.Seal() as defined in RFC 9180 and concatenates the encapsulated key and the
          ciphertext (<code>enc || ciphertext</code>). Google&apos;s Go sample wraps the key with
          the tink-go library.
        </li>
        <li>The imported key material becomes a new key version on an existing target key.</li>
      </ul>
      <p className="text-sm text-muted-foreground">
        The launch stage of key encapsulation differs by source. Google Cloud KMS release notes list
        the ML-KEM and X-Wing key encapsulation algorithms as Preview since 23 September 2025.
        Google&apos;s 28 July 2026 blog post announces general availability of ML-KEM key
        encapsulation; check the current launch stage before relying on either. Post-quantum signing
        in Cloud KMS became generally available on 16 July 2026.
      </p>
    </div>

    <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
      <h4 className="font-semibold text-foreground">Azure Key Vault and Managed HSM</h4>
      <p className="text-sm text-muted-foreground">
        Azure Key Vault BYOK transfers a key wrapped with CKM_RSA_AES_KEY_WRAP under an RSA-HSM key
        exchange key of 2048, 3072 or 4096 bits. Azure Managed HSM BYOK uses an RSA-HSM key exchange
        key that has only the import key operation.
      </p>
      <p className="text-sm text-muted-foreground">
        The mechanism encrypts an ephemeral AES key with RSA-OAEP (SHA-1) and the target key with
        AES key wrap with padding, then concatenates the two. The transfer blob is a{' '}
        <code>.byok</code> file whose header names the key exchange key and the CKM_RSA_AES_KEY_WRAP
        mechanism. The Azure pages cited here describe no post-quantum option.
      </p>
    </div>

    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
      <li>
        <strong>Transport is not the wrap.</strong> Hybrid post-quantum TLS to a KMS endpoint
        protects the request. Whether a key moved between two HSMs is quantum-safe depends on the
        key-wrapping step, which is RSA for AWS KMS and Azure and HPKE for Google&apos;s Preview
        import.
      </li>
      <li>
        <strong>A plain ML-KEM exchange hands the secret to the application.</strong> The
        application can derive a wrapping key (HKDF) and wrap a key with AES-KW, but the derivation
        and the wrap happen outside the HSM.
      </li>
      <li>
        <strong>HPKE is the pattern.</strong> Google&apos;s import shows what a post-quantum import
        looks like: the sender runs HPKE Seal to the service&apos;s public key, and the service
        opens it inside its boundary. The Workshop step shows the same flow as a candidate design
        for AWS and Azure, labelled as not offered by those providers.
      </li>
    </ul>
  </div>
)

export const KmsPqcIntroduction: React.FC<KmsPqcIntroductionProps> = ({ onNavigateToWorkshop }) => {
  // The data-section-id anchors below were already here and already
  // matched this module's manifest; nothing read them. One call makes
  // deep links land and section progress record.
  useSectionAnchors()

  return (
    <div className="space-y-8 w-full">
      {/* Section 1: PQC Key Management Fundamentals */}
      <div data-section-id="key-hierarchy" className="scroll-mt-20">
        <CollapsibleSection
          icon={<KeyRound size={24} className="text-primary" />}
          title="PQC Key Management Fundamentals"
          defaultOpen
        >
          <p>
            Post-quantum cryptography fundamentally changes how organizations manage keys.{' '}
            <strong>
              <InlineTooltip term="NIST SP 800-227">NIST SP 800-227</InlineTooltip>
            </strong>{' '}
            establishes that <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> is a{' '}
            <strong>Key Encapsulation Mechanism only</strong> &mdash; it cannot sign. Similarly,{' '}
            <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> is for signatures only &mdash; it
            cannot encapsulate. This strict algorithm separation replaces the dual-use nature of{' '}
            <InlineTooltip term="RSA">RSA</InlineTooltip>, which could both encrypt and sign.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;A KEM can be combined with a symmetric-key encryption scheme to yield very
              efficient public-key encryption. This is sometimes referred to as the KEM-DEM paradigm
              for PKE&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; NIST SP 800-227, Recommendations for Key-Encapsulation Mechanisms, Sec. 5.2.1
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
              <div className="text-xs font-bold text-destructive mb-2">
                Classical: separation is good practice
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; RSA-OAEP: direct encryption of data/keys</li>
                <li>&bull; RSA-PSS: digital signatures</li>
                <li>&bull; One RSA key pair can do both, but should not (NIST SP 800-57)</li>
                <li>&bull; AWS KMS permits only one usage per key</li>
              </ul>
            </div>
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="text-xs font-bold text-primary mb-2">PQC: Strict Separation</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; ML-KEM: key encapsulation only (KEM)</li>
                <li>&bull; ML-DSA: digital signatures only</li>
                <li>&bull; Separate key pairs are mandatory, not just good practice</li>
                <li>&bull; Inventory grows where classical keys were dual-use</li>
              </ul>
            </div>
          </div>

          {/* Key Size Explosion Table */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-3">Key Size Comparison</div>
            <div
              className="overflow-x-auto"
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; making a scrollable region focusable is axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
              tabIndex={0}
              role="region"
              aria-label="Key size comparison"
            >
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                      Algorithm
                    </th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                      Public Key
                    </th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                      Private Key
                    </th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                      Sig / CT
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                      Security
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {KEY_SIZE_COMPARISONS.filter((k) => k.type === 'classical').map((k) => (
                    <tr key={k.algorithm} className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-destructive">{k.algorithm}</td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {k.publicKeyBytes.toLocaleString()} B
                      </td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {k.privateKeyBytes.toLocaleString()} B
                      </td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {k.signatureOrCiphertextBytes.toLocaleString()} B
                      </td>
                      <td className="py-2 px-2 text-destructive">{k.nistLevel}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={5} className="py-1">
                      <div className="border-t-2 border-primary/30" />
                    </td>
                  </tr>
                  {KEY_SIZE_COMPARISONS.filter((k) => k.type === 'pqc').map((k) => (
                    <tr key={k.algorithm} className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-primary">{k.algorithm}</td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {k.publicKeyBytes.toLocaleString()} B
                      </td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {k.privateKeyBytes.toLocaleString()} B
                      </td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {k.signatureOrCiphertextBytes.toLocaleString()} B
                      </td>
                      <td className="py-2 px-2 text-success">{k.nistLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              PQC public keys are about 3&times; (ML-KEM-512) to 10&times; (ML-DSA-87) the size of
              an RSA-2048 public key, and up to about 40&times; the size of an ECDSA P-256 public
              key &mdash; impacting HSM storage, certificate sizes, and network bandwidth during key
              distribution. The Security column uses two scales: classical rows show approximate bit
              strength (NIST SP 800-57 Part 1 Rev. 5, Table 2), and PQC rows show NIST security
              categories. SP 800-57 has no row for RSA-4096, which falls between its 128-bit and
              192-bit entries. The RSA private-key sizes are typical DER lengths and vary by a few
              bytes between keys.
            </p>
          </div>
        </CollapsibleSection>
      </div>

      {/* Section 2: Envelope Encryption with ML-KEM */}
      <div data-section-id="envelope" className="scroll-mt-20">
        <CollapsibleSection
          icon={<Lock size={24} className="text-primary" />}
          title="Envelope Encryption with ML-KEM"
        >
          <p>
            Because <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> produces a random shared
            secret (not a direct encryption),{' '}
            <strong>
              <InlineTooltip term="Envelope Encryption">envelope encryption</InlineTooltip>
            </strong>{' '}
            uses a different pattern from RSA-OAEP, which wraps the DEK in one step. In this
            module&apos;s design, ML-KEM encapsulates &rarr; derives a wrapping key via HKDF &rarr;
            wraps the DEK with AES-KW. The shared secret key from ML-KEM does not itself require
            further key derivation (NIST PQC FAQ); the HKDF step binds the wrapping key to this
            protocol and version.
          </p>

          <div className="space-y-3">
            {ENVELOPE_ENCRYPTION_STEPS.map((step) => (
              <div key={step.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                    Step {step.step}
                  </span>
                  <span className="text-sm font-bold text-foreground">{step.title}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
                    <div className="text-[10px] font-bold text-destructive mb-1">
                      Classical (RSA-OAEP)
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {step.classicalDescription}
                    </p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-foreground/70">{step.classicalArtifact}</span>
                      <span className="font-mono text-destructive">{step.classicalSize}</span>
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                    <div className="text-[10px] font-bold text-primary mb-1">PQC (ML-KEM)</div>
                    <p className="text-xs text-muted-foreground mb-2">{step.pqcDescription}</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-foreground/70">{step.pqcArtifact}</span>
                      <span className="font-mono text-primary">{step.pqcSize}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Data flow summary */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-3">Envelope Encryption Flow</div>
            <div className="space-y-2 text-center">
              <div className="p-2 rounded bg-primary/10 text-primary text-xs font-bold">
                ML-KEM.Encaps(ek) &rarr; ciphertext + shared_secret
              </div>
              <div className="text-muted-foreground">&darr;</div>
              <div className="p-2 rounded bg-secondary/10 text-secondary text-xs font-bold">
                HKDF-SHA-256(ss, salt=&quot;kms-envelope-salt-v1&quot;,
                info=&quot;kms-envelope-v1&quot;) &rarr; 256-bit wrapping key
              </div>
              <div className="text-muted-foreground">&darr;</div>
              <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
                AES-256-KW(wrapping_key, DEK) &rarr; wrapped DEK
              </div>
              <div className="text-muted-foreground">&darr;</div>
              <div className="p-2 rounded bg-warning/10 text-warning text-xs font-bold">
                Store: KEM ciphertext + wrapped DEK (1,128 bytes total vs 256 bytes RSA)
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Section 3: Hybrid Key Wrapping */}
      <div data-section-id="hybrid-wrap" className="scroll-mt-20">
        <CollapsibleSection
          icon={<Shuffle size={24} className="text-primary" />}
          title="Hybrid Key Wrapping"
        >
          <p>
            <strong>
              <InlineTooltip term="NIST SP 800-227">SP 800-227</InlineTooltip>
            </strong>{' '}
            recommends hybrid combiners that derive a single key from both a classical and PQC
            shared secret:{' '}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
              KDF(classical_shared || pqc_shared)
            </code>
            . With a sound combiner, the derived key stays secret as long as either shared secret
            does.
          </p>
          <p>
            Do not confuse these key-wrap combiners with the TLS hybrid groups. X25519MLKEM768,
            SecP256r1MLKEM768 and SecP384r1MLKEM1024 (RFC 10024) protect a live connection: the two
            secrets are concatenated and fed to the TLS 1.3 key schedule. The combiners below wrap a
            key that is stored, so this module defines its own HKDF call over the two secrets. They
            are different constructions even when they use the same two algorithms, and a TLS group
            name does not describe how a KMS wraps its keys.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HYBRID_COMBINER_MODES.map((mode) => (
              <div key={mode.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="text-sm font-bold text-foreground mb-2">{mode.name}</div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="text-destructive font-bold shrink-0">Classical:</span>
                    <span>{mode.classical}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-bold shrink-0">PQC:</span>
                    <span>{mode.pqc}</span>
                  </div>
                  <div className="bg-background p-2 rounded border border-border font-mono text-[10px] break-all">
                    {mode.combiner}
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>
                      Output: <strong>{mode.outputKeySize * 8}-bit</strong> key
                    </span>
                    <span className="text-warning">{mode.totalOverhead}</span>
                  </div>
                  <p className="text-[10px] text-foreground/70">{mode.useCase}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Section 4: KMS Provider PQC Landscape */}
      <CollapsibleSection
        icon={<Cloud size={24} className="text-primary" />}
        title="KMS Provider PQC Landscape"
      >
        <p>
          Cloud <InlineTooltip term="KMS">KMS</InlineTooltip> providers and on-premises key
          management solutions are at different stages of PQC adoption. Understanding each
          provider&apos;s capabilities is critical for multi-cloud strategies. The list is not
          exhaustive: Entrust nShield and KeyControl and IBM key-management products are not covered
          by this module&apos;s sources.
        </p>
        <p className="text-xs text-muted-foreground">
          A post-quantum algorithm counts as FIPS-validated only if the module&apos;s own FIPS 140-3
          validation covers it. The CMVP implementation guidance for FIPS 140-3 says a module&apos;s
          ML-KEM shall show compliance with FIPS 203 and SP 800-227, and treats a hybrid scheme as
          an approved ML-KEM plus one or more other algorithms combined through an approved key
          combiner (SP 800-227 Section 4.6.2). Whether a hybrid counts as FIPS-approved depends on
          the module&apos;s validated algorithms and the current guidance, so check both and the
          Security Policy of the module that runs your keys. The AWS KMS HSM certificate (CMVP
          #4884) lists no ML-DSA or ML-KEM algorithm, and a key service&apos;s FIPS level does not
          carry over to a newer key type by implication.
        </p>

        <div className="space-y-4">
          {KMS_PROVIDERS.map((provider) => {
            const status = KMS_STATUS_LABELS[getKmsPqcStatus(provider)]
            return (
              <div key={provider.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{provider.product}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border uppercase">
                    {provider.type}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.className}`}
                  >
                    {status.label}
                  </span>
                  {provider.fipsLevel && (
                    <span className="text-[10px] text-muted-foreground">{provider.fipsLevel}</span>
                  )}
                </div>

                {/* Algorithms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {provider.pqcAlgorithms.kem.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-primary mb-1">KEM</div>
                      <div className="space-y-1">
                        {provider.pqcAlgorithms.kem.map((algo) => (
                          <div key={algo.name} className="text-[10px] text-muted-foreground">
                            {algo.name}{' '}
                            <span className="text-foreground/50">&mdash; {algo.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {provider.pqcAlgorithms.sign.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-secondary mb-1">Signing</div>
                      <div className="space-y-1">
                        {provider.pqcAlgorithms.sign.map((algo) => (
                          <div key={algo.name} className="text-[10px] text-muted-foreground">
                            {algo.name}{' '}
                            <span className="text-foreground/50">&mdash; {algo.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* API Pattern */}
                <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto font-mono whitespace-pre mb-2">
                  {provider.apiPattern}
                </pre>

                {provider.launchStageNote && (
                  <p className="text-[10px] text-warning mb-2">{provider.launchStageNote}</p>
                )}
                <p className="text-[10px] text-muted-foreground">{provider.notes}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  <strong>Key import:</strong> {provider.keyImportPath}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  <strong>Rotation:</strong> {provider.autoRotationNote}
                </p>
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Section 5: PQC Key Rotation Strategies */}
      <div data-section-id="rotation" className="scroll-mt-20">
        <CollapsibleSection
          icon={<RefreshCw size={24} className="text-primary" />}
          title="PQC Key Rotation Strategies"
        >
          <p>
            Key rotation with PQC algorithms introduces significant bandwidth and storage overhead.
            Enterprises must plan phased rotation aligned with compliance deadlines from{' '}
            <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> and{' '}
            <InlineTooltip term="NIST IR 8547">NIST IR 8547</InlineTooltip>.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-3">
              Bandwidth Impact: {ENTERPRISE_SCENARIO.name}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="bg-background rounded-lg p-3 border border-border text-center">
                <div className="text-lg font-bold text-foreground">
                  {ENTERPRISE_SCENARIO.totalCertificates}
                </div>
                <div className="text-[10px] text-muted-foreground">Total Keys and Certificates</div>
              </div>
              <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 text-center">
                <div className="text-lg font-bold text-destructive">400</div>
                <div className="text-[10px] text-muted-foreground">
                  Quantum-Vulnerable (RSA and ECDSA)
                </div>
              </div>
              <div className="bg-success/5 rounded-lg p-3 border border-success/20 text-center">
                <div className="text-lg font-bold text-success">100</div>
                <div className="text-[10px] text-muted-foreground">
                  Already Safe (100 AES-256 data keys)
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Rotating 300 TLS certificates from RSA-2048 (256 B pub key) to hybrid ML-DSA-65 +
              ECDSA (2,017 B) increases per-rotation bandwidth by approximately 528 KB (this
              module's planning assumption, not a measurement) for public keys alone. Certificate
              chains with larger signatures add more overhead.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            NIST SP 800-57 Part 1 Revision 6 (Initial Public Draft, December 2025, so it may still
            change) adds ML-KEM-aware cryptoperiods: it suggests no more than one or two years for a
            public static encapsulation key and recommends no more than two years for a private
            static decapsulation key, which may need to outlive the encapsulation key because
            earlier ciphertexts still have to be decapsulated. Revision 5 remains the final
            publication.
          </p>

          {/* Phased rotation approach */}
          <div className="space-y-2">
            {[
              {
                phase: 'Phase 1: Inventory',
                timeline: '2025-2026',
                description:
                  'Catalog all cryptographic assets, identify quantum-vulnerable keys, establish baseline metrics.',
              },
              {
                phase: 'Phase 2: Hybrid Deploy',
                timeline: '2026-2028',
                description:
                  'Issue hybrid certificates (classical + PQC) for TLS, upgrade HSM firmware, configure dual-key rotation policies in KMS.',
              },
              {
                phase: 'Phase 3: Full PQC',
                timeline: '2028-2031',
                description:
                  'Complete the in-scope migration using approved profiles. CNSA 2.0 FAQ version 2.2 mandates its algorithms for NSS by 31 December 2031 unless otherwise noted; NIST IR 8547 (final, October 2026) sets a separate transition horizon for systems that follow NIST standards: deprecated after 2030, disallowed after 2035.',
              },
            ].map((p) => (
              <div key={p.phase} className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-foreground">{p.phase}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {p.timeline}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
            ))}
          </div>

          {/* Compliance deadlines */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-3">Compliance Deadlines</div>
            <div className="space-y-2">
              {ENTERPRISE_SCENARIO.complianceDeadlines.map((d) => (
                <div
                  key={d.framework}
                  className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border"
                >
                  <span className="text-sm font-bold text-primary shrink-0 w-16">{d.deadline}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground">{d.framework}</div>
                    <p className="text-[10px] text-muted-foreground">{d.requirement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Section 6: Enterprise Architecture Patterns */}
      <div data-section-id="kmip" className="scroll-mt-20">
        <CollapsibleSection
          icon={<Building2 size={24} className="text-primary" />}
          title="Enterprise Architecture Patterns"
        >
          <p>
            Multi-cloud PQC key management requires a unified architecture that abstracts
            provider-specific APIs while maintaining centralized policy control.{' '}
            <InlineTooltip term="KMIP">KMIP</InlineTooltip> (Key Management Interoperability
            Protocol) provides a vendor-neutral interface for cross-provider key operations.
          </p>

          {/* Architecture diagram */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-3">
              Multi-Cloud PQC Key Architecture
            </div>
            <div className="space-y-2 text-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  Applications
                </div>
                <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  Microservices
                </div>
                <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  IoT / Edge
                </div>
              </div>
              <div className="text-muted-foreground text-xs">&darr; REST / gRPC &darr;</div>
              <div className="p-2 rounded bg-secondary/10 text-secondary text-xs font-bold">
                Enterprise KMS Orchestrator (KMIP + policy engine)
              </div>
              <div className="text-muted-foreground text-xs">&darr; Provider APIs &darr;</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2 rounded bg-success/10 text-success text-[10px] font-bold">
                  AWS KMS
                </div>
                <div className="p-2 rounded bg-success/10 text-success text-[10px] font-bold">
                  Google Cloud KMS
                </div>
                <div className="p-2 rounded bg-success/10 text-success text-[10px] font-bold">
                  Azure Key Vault
                </div>
              </div>
              <div className="text-muted-foreground text-xs">&darr; HSM-backed &darr;</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 rounded bg-warning/10 text-warning text-[10px] font-bold">
                  On-Prem HSM (Thales / Entrust)
                </div>
                <div className="p-2 rounded bg-warning/10 text-warning text-[10px] font-bold">
                  Vault Transit Engine
                </div>
              </div>
            </div>
          </div>

          {/* Key principles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">KMIP Interoperability</div>
              <p className="text-xs text-muted-foreground">
                KMIP 3.0 (Committee Specification Draft 02, 7 May 2026) adds the FIPS 203, 204 and
                205 algorithms (ML-KEM, ML-DSA, SLH-DSA) and includes Encapsulate and Decapsulate
                operations; KMIP 2.1 is the OASIS Standard. Use KMIP as the abstraction layer for
                cross-provider key operations: Create Key Pair, Get (with a wrapping specification),
                Re-key Key Pair, Revoke and Destroy. KMIP has no Wrap, Unwrap or Rotate operation.
                Re-key replaces a symmetric key; Re-key Key Pair replaces a key pair, which is what
                an ML-KEM or ML-DSA key needs. A key moves Pre-Active, Active, Deactivated,
                Destroyed (Compromised is a further state), and Destroy applies only to Pre-Active
                or Deactivated objects, so an Active key is first deactivated with Revoke.
              </p>
              <div
                className="mt-2 flex flex-wrap items-center gap-1 text-[10px]"
                role="img"
                aria-label="KMIP key lifecycle: Pre-Active, then Activate to Active, then Revoke to Deactivated, then Destroy to Destroyed"
              >
                {['Pre-Active', 'Active', 'Deactivated', 'Destroyed'].map((state, idx) => (
                  <React.Fragment key={state}>
                    {idx > 0 && (
                      <span className="text-muted-foreground">
                        &rarr; {['Activate', 'Revoke', 'Destroy'][idx - 1]} &rarr;
                      </span>
                    )}
                    <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-primary">
                      {state}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Key Backup Strategy</div>
              <p className="text-xs text-muted-foreground">
                In this module&apos;s design, PQC key backup uses quantum-safe wrapping for the
                backup envelope: ML-KEM wraps the backup keys, with M-of-N key splitting for
                disaster recovery, and backup HSMs run PQC-capable firmware. For HSMs that cannot
                yet be upgraded, the Applied Quantum framework (v2.1) suggests PQC key-wrapping
                around classical HSM operations as interim protection.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Crypto Agility</div>
              <p className="text-xs text-muted-foreground">
                Design the KMS abstraction layer to support algorithm swaps without application
                changes. Tag keys with algorithm metadata, version them, and use feature flags to
                route traffic between classical and PQC paths.
              </p>
            </div>
          </div>

          {/* Provider rotation section */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-3">
              Provider-Specific Auto-Rotation
            </div>
            <div className="space-y-2">
              {ENTERPRISE_SCENARIO.kmsProviders.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border"
                >
                  <Shield size={14} className="text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground">{p.name}</div>
                    <p className="text-[10px] text-muted-foreground">{p.rotationFeature}</p>
                    <p className="text-[10px] text-primary/80">{p.pqcCapability}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/hsm-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">HSM &amp; PQC Operations</div>
              <div className="text-xs text-muted-foreground">
                PKCS#11 v3.2 mechanisms, firmware migration, and FIPS validation
              </div>
            </div>
          </Link>
          <Link
            to="/learn/arch-quantum-impact?tab=workshop&step=5"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">
                Compare with the other trust hardware
              </div>
              <div className="text-xs text-muted-foreground">
                HSMs, TPMs, confidential computing and DPUs side by side
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Wrench size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Design patterns for algorithm-agnostic cryptographic infrastructure
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hybrid-crypto"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Hybrid Cryptography</div>
              <div className="text-xs text-muted-foreground">
                Classical + PQC hybrid schemes for the transition period
              </div>
            </div>
          </Link>
          <Link
            to="/migrate"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Guide</div>
              <div className="text-xs text-muted-foreground">
                Software catalog and migration workflows
              </div>
            </div>
          </Link>
          <Link
            to="/learn/secrets-management-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <KeySquare size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Secrets Management</div>
              <div className="text-xs text-muted-foreground">
                Vault, cloud secrets engines, and PQC rotation policies
              </div>
            </div>
          </Link>
          <Link
            to="/learn/database-encryption-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Database size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Database Encryption</div>
              <div className="text-xs text-muted-foreground">
                TDE, column-level encryption, and BYOK key management
              </div>
            </div>
          </Link>
          <Link
            to="/learn/ai-security-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Brain size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">AI Security &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                AI model security, data pipeline encryption, and PQC for ML workloads
              </div>
            </div>
          </Link>
        </div>
      </section>

      <VendorCoverageNotice migrateLayer="Security Stack" migrateDomain="kms" />

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Design key hierarchies, visualize envelope encryption, and plan PQC rotation strategies.
        </p>
      </div>

      <LearnSection
        sectionId="cloud-responsibility"
        title="Cloud Shared Responsibility & Key Ownership"
        icon={<Cloud size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Every cloud PQC conversation eventually reduces to one question: who holds the root of
          trust, and can they prove what happened to it? The algorithms are the easy part — the hard
          part is that the answer differs per service, per tenant model, and per region.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              model: 'Provider-managed',
              root: 'Cloud provider',
              migration:
                'The provider migrates on its own schedule. You inherit the timeline and usually cannot audit the key material directly.',
            },
            {
              model: 'BYOK',
              root: 'You generate, provider stores',
              migration:
                'You control generation and keep the original key material, but the import path is whatever the service supports: AWS KMS documents RSA wrapping key specs for import and does not import ML-KEM or ML-DSA key material. The provider still controls the HSM boundary and its FIPS posture.',
            },
            {
              model: 'HYOK / external key store',
              root: 'You hold the external key-encryption key (KEK)',
              migration:
                'You control where that KEK lives and how it migrates, and you carry the operational burden. External custody does not take the provider out of the data path: a plaintext data key still reaches whoever encrypts your data, your application or the cloud service, and some AWS services briefly cache data keys, so revoking the external key does not stop every operation at once. In AWS KMS an external key store supports only symmetric encryption keys and the service adds its own encryption layer under yours, so it offers no ML-KEM path. Other services differ in import, wrapping and caching, so check each service\u2019s boundary before assuming a PQC option.',
            },
          ].map((m) => (
            <div key={m.model} className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-semibold text-foreground">{m.model}</h4>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                Root of trust
              </p>
              <p className="text-sm text-foreground">{m.root}</p>
              <p className="mt-2 text-sm text-muted-foreground">{m.migration}</p>
            </div>
          ))}
        </div>
        <CloudKeyExchange />
        <div
          className="p-4 rounded-lg bg-muted/50 border border-border space-y-2"
          data-testid="key-release-attested"
        >
          <h4 className="font-semibold text-foreground">Key release to an attested workload</h4>
          <p className="text-sm text-muted-foreground">
            A key service can also decide when a key is used: only after the workload shows what it
            is running. Two documented examples. Azure Key Vault Secure Key Release (Managed HSM and
            Premium) releases an HSM-protected, exportable key to an attested trusted execution
            environment when the Microsoft Azure Attestation claims satisfy a release policy set
            when the key is created. AWS KMS works with AWS Nitro Enclaves: its key-policy condition
            keys (<code>kms:RecipientAttestation:ImageSha384</code> and{' '}
            <code>kms:RecipientAttestation:PCR</code>) make KMS allow operations with a key only if
            the enclave provides a signed attestation document whose measurements match the policy.
          </p>
          <p className="text-sm text-muted-foreground">
            In both cases the key service relies on the attestation and on the hardware behind it;
            how those attestations work is covered in{' '}
            <Link to="/learn/confidential-computing" className="text-primary hover:underline">
              Confidential Computing
            </Link>
            . Sources:{' '}
            <Link
              to="/library?ref=Secure-Key-Release-with-Azure-Key-Vault-and-Azure-Confidenti"
              className="text-primary hover:underline"
            >
              Microsoft Learn, Secure Key Release
            </Link>{' '}
            and{' '}
            <Link
              to="/library?ref=Using-cryptographic-attestation-with-AWS-KMS-AWS-Nitro-Encla"
              className="text-primary hover:underline"
            >
              AWS Nitro Enclaves User Guide, cryptographic attestation with AWS KMS
            </Link>{' '}
            (read 8 Nov 2026).
          </p>
        </div>
        <p className="text-muted-foreground">
          NIST SP 800-210 sets out access-control guidance across IaaS, PaaS and SaaS and is the
          reference for arguing where a boundary actually sits. It was published in July 2020,
          predates the PQC standards, and names no post-quantum mechanism — useful for the boundary
          argument, not for the algorithm one. The Cloud Security Alliance practitioner guide is the
          post-quantum-aware companion.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            to="/library?ref=NIST-SP-800-210-General-Access-Control-Guidance-for-Cloud-Sy"
            className="text-primary hover:underline"
          >
            NIST SP 800-210
          </Link>
          <Link to="/library?ref=CSA-PQC-Guide-2025" className="text-primary hover:underline">
            CSA Practitioner&rsquo;s Guide to PQC
          </Link>
          <Link to="/library?ref=KMIP-V2-1-OASIS" className="text-primary hover:underline">
            KMIP v2.1
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Cloud Computing / Data Centers in the Industry Landscape links here rather than to a
          separate cloud module: the cryptography is already covered by this module,{' '}
          <Link to="/learn/confidential-computing" className="text-primary hover:underline">
            Confidential Computing
          </Link>
          ,{' '}
          <Link to="/learn/database-encryption-pqc" className="text-primary hover:underline">
            Database Encryption
          </Link>{' '}
          and{' '}
          <Link to="/learn/web-gateway-pqc" className="text-primary hover:underline">
            Web Gateway PQC
          </Link>
          . What was missing was this ownership framing.
        </p>
      </LearnSection>

      <RecordDecisionLink topic="kms-design" />
      <ReadingCompleteButton />
    </div>
  )
}
