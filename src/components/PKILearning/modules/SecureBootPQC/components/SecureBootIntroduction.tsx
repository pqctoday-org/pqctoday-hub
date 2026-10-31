// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import {
  Shield,
  FileCode,
  Key,
  Building2,
  Lock,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Cpu,
  Route,
  Monitor,
  ExternalLink,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { getStandard } from '@/data/standardsRegistry'
import { UEFI_KEY_TYPES, BOOT_CHAIN_STAGES, FIRMWARE_ALGO_SIZES } from '../data/secureBootConstants'
import {
  FIRMWARE_VENDORS,
  VENDOR_MATRIX_CHECKED_ON,
  VENDOR_STATUS_LABELS,
  formatVendorDate,
} from '../data/secureBootProviderData'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { LabTestsSummary } from './LabTestsSummary'

interface SecureBootIntroductionProps {
  onNavigateToWorkshop: () => void
}

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

/** A verbatim quotation with its source, used by the "What the lab tests" panel. */
const LabQuote: React.FC<{ source: string; children: React.ReactNode }> = ({
  source,
  children,
}) => (
  <blockquote className="border-l-2 border-primary/30 pl-3 text-xs text-foreground/80">
    &ldquo;{children}&rdquo;{' '}
    <cite className="text-[10px] not-italic text-muted-foreground">({source})</cite>
  </blockquote>
)

// Library rows cited by the "Two integrity checks" box. getStandard() throws at import on an
// unknown id, so a renamed or removed row fails the build instead of leaving a dead link.
const SP_800_193 = getStandard('NIST-SP-800-193')
const FIPS_140_3 = getStandard('FIPS-140-3-STANDARD')
const CMVP_IG = getStandard('NIST-FIPS140-3-IG-PQC')
const SP_800_140 = getStandard('NIST-SP-800-140')
const SP_800_140B = getStandard('NIST-SP-800-140B')
const SP_800_140C = getStandard('NIST-SP-800-140C')
const FIPS_186_5 = getStandard('FIPS 186-5')

/** The CMVP's own list of approved security functions (the web page behind SP 800-140C). */
const CMVP_SECURITY_FUNCTIONS_URL =
  'https://csrc.nist.gov/projects/cryptographic-module-validation-program/sp-800-140-series-supplemental-information/sp800-140c'

/** A link to a Library row, in the style of the "Related:" links in this lesson. */
const LibCite: React.FC<{
  std: { title: string; deepLink: string }
  children: React.ReactNode
}> = ({ std, children }) => (
  <Link
    to={std.deepLink}
    className="text-primary hover:underline"
    title={`Open ${std.title} in the library`}
  >
    {children}
  </Link>
)

export const SecureBootIntroduction: React.FC<SecureBootIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useSectionAnchors()

  return (
    <div className="space-y-8 w-full">
      {/* Section 1: UEFI Secure Boot Key Hierarchy */}
      <CollapsibleSection
        icon={<Shield size={24} className="text-primary" />}
        title="UEFI Secure Boot: Key Hierarchy and Chain of Trust"
        defaultOpen
        sectionId="secure-boot-fundamentals"
      >
        <p>
          <InlineTooltip term="UEFI">UEFI</InlineTooltip> Secure Boot establishes a{' '}
          <strong>cryptographic chain of trust</strong> from hardware power-on through the OS
          kernel. Each stage must be verified by a trusted key before it executes. The hierarchy is:
          Platform Key (PK) &rarr; Key Exchange Key (KEK) &rarr; Authorized Signature Database (db)
          &rarr; Bootloader/Kernel signatures.
        </p>

        <div className="bg-status-error/5 rounded-lg p-4 border border-status-error/20">
          <div className="text-sm font-bold text-status-error mb-2">
            All UEFI Signing Keys Are Quantum-Vulnerable
          </div>
          <p className="text-xs text-foreground/80">
            Every RSA-2048 and ECDSA key in the UEFI Secure Boot hierarchy can be broken by a
            Cryptographically Relevant Quantum Computer (CRQC) via Shor&apos;s algorithm. This is a
            forgery risk (&ldquo;trust now, forge later&rdquo;), not a harvest-now-decrypt-later
            one: a signature protects no secret, so nothing recorded today is exposed later. Once a
            CRQC exists, anyone who holds a public key (the verifying keys are stored on every
            device) could derive its private key and sign firmware that existing devices accept —
            enabling undetectable firmware rootkits. How urgent that is depends on how long the
            device and its trust anchors stay in the field. NSA&apos;s CNSA 2.0 FAQ (v2.2, p.13)
            notes that in many firmware-signing cases the validation algorithm is not easily
            updated, so firmware-signing algorithms are &ldquo;frequently locked in for the life of
            a system&rdquo;. Harvest-now-decrypt-later applies to confidentiality, such as the TLS
            key exchange that carries remote attestation, not to signatures.
          </p>
        </div>

        {/* Key type table */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">UEFI Key Hierarchy Summary</div>
          <p className="text-xs text-muted-foreground mb-3">
            ML-DSA-65 is this module&apos;s general-purpose target (NIST Security Level 3). For
            National Security Systems (NSS), the NSA&apos;s CNSA 2.0 FAQ (Ver. 2.2, p. 7&ndash;8)
            specifies ML-DSA-87 for all classification levels and allows LMS and XMSS (NIST SP
            800-208) for signing firmware and software; HSS and XMSS<sup>MT</sup> are not allowed
            and SLH-DSA is not approved for NSS (p. 11). The CNSA 2.0 / NSS column shows the NSS
            choice.
          </p>
          <ResponsiveTable
            caption="UEFI key hierarchy summary"
            testId="uefi-key-table"
            head={['Key', 'Owner', 'Current', 'PQC Target', 'CNSA 2.0 / NSS', 'Priority']}
            rows={UEFI_KEY_TYPES.map((kt) => [
              <span key="name" className="font-mono font-bold text-foreground">
                {kt.name}
              </span>,
              <span key="owner" className="text-[10px] text-muted-foreground">
                {kt.owner}
              </span>,
              <span
                key="current"
                className={`text-[10px] ${
                  kt.quantumVulnerable ? 'text-status-error' : 'text-muted-foreground'
                }`}
              >
                {kt.currentAlgorithm}
              </span>,
              <span key="pqc" className="text-[10px] text-primary">
                {kt.pqcAlgorithm}
              </span>,
              <span key="cnsa" className="text-[10px] text-muted-foreground">
                {kt.cnsaAlgorithm}
              </span>,
              <span
                key="priority"
                className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-bold ${
                  kt.migrationPriority === 'critical'
                    ? 'text-status-error'
                    : kt.migrationPriority === 'high'
                      ? 'text-status-warning'
                      : kt.migrationPriority === 'medium'
                        ? 'text-status-info'
                        : 'text-status-success'
                }`}
              >
                {kt.migrationPriority}
              </span>,
            ])}
          />
        </div>

        <p>
          The <strong>db size impact</strong> is a key operational concern: a minimal self-signed
          ML-DSA-65 X.509 certificate is about <strong>5.5 KB</strong> (5,538 bytes) against about{' '}
          <strong>0.8 KB</strong> (809 bytes) for RSA-2048, measured with OpenSSL 3.6.3.
          Certificates with more fields are larger. Secure Boot variable storage is
          platform-specific; firmware reports it through QueryVariableInfo() (UEFI 2.11 section
          8.2.4). A full PQC db migration may require platform NVRAM reallocation — verify UEFI
          NVRAM capacity before planning.
        </p>

        {/* Boot chain visual */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">Boot Chain: Signing Surfaces</div>
          <div className="space-y-2">
            {BOOT_CHAIN_STAGES.map((stage, idx) => (
              <div key={stage.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      stage.forgeryUrgency === 'critical' || stage.forgeryUrgency === 'high'
                        ? 'bg-status-error/20 text-status-error'
                        : stage.forgeryUrgency === 'medium'
                          ? 'bg-status-warning/20 text-status-warning'
                          : 'bg-status-success/20 text-status-success'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < BOOT_CHAIN_STAGES.length - 1 && <div className="w-0.5 h-3 bg-border" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">{stage.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {stage.currentAlgorithm}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{stage.pqcStatus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: ML-DSA-65 Firmware Signing */}
      <CollapsibleSection
        icon={<FileCode size={24} className="text-primary" />}
        title="ML-DSA-65 for Firmware Signature Migration"
        sectionId="firmware-signing"
      >
        <p>
          <InlineTooltip term="ML-DSA">ML-DSA-65</InlineTooltip> (FIPS 204, formerly
          CRYSTALS-Dilithium3) is the NIST-standardized post-quantum signature algorithm at NIST
          Security Level 3. It is a common choice for firmware signing because its signature size
          (3,309 bytes) balances security and UEFI storage overhead better than ML-DSA-87. For
          National Security Systems, CNSA 2.0 specifies ML-DSA-87 for all classification levels, so
          firmware for NSS customers uses ML-DSA-87 or LMS/XMSS.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-status-error/5 rounded-lg p-4 border border-status-error/20">
            <div className="text-xs font-bold text-status-error mb-2">RSA-2048 (Current)</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Public key: 256 bytes</li>
              <li>&bull; Signature: 256 bytes</li>
              <li>&bull; Quantum-safe: No (Shor&apos;s algorithm)</li>
            </ul>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">ML-DSA-65 (Target)</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Public key: 1,952 bytes (7.6&times; larger)</li>
              <li>&bull; Signature: 3,309 bytes (12.9&times; larger)</li>
              <li>&bull; Quantum-safe: Yes (NIST Level 3)</li>
            </ul>
          </div>
        </div>

        {/* Size comparison table */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">Algorithm Size Reference</div>
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; making a scrollable region focusable is axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
            tabIndex={0}
            role="region"
            aria-label="Algorithm size reference"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                    Algorithm
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    Pub Key
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    Priv Key
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Sig</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                    Strength / category
                  </th>
                </tr>
              </thead>
              <tbody>
                {FIRMWARE_ALGO_SIZES.filter((a) => a.type === 'classical').map((a) => (
                  <tr key={a.algorithm} className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-status-error">{a.algorithm}</td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.publicKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.privateKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.signatureBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-status-error">{a.nistLevel}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="py-1">
                    <div className="border-t-2 border-primary/30" />
                  </td>
                </tr>
                {FIRMWARE_ALGO_SIZES.filter((a) => a.type === 'pqc').map((a) => (
                  <tr key={a.algorithm} className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-primary">{a.algorithm}</td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.publicKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.privateKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.signatureBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-status-success">{a.nistLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            The last column uses two different measures. PQC rows show the NIST security category
            from FIPS 204 and FIPS 205. Classical rows show the comparable security strength in bits
            from NIST SP 800-57 Part 1 Rev. 5, Table 2 (RSA-2048: 112, P-256: 128, P-384: 192;
            RSA-4096 is not a listed size and falls between RSA-3072 at 128 and RSA-7680 at 192),
            which assumes no large quantum computer. SLH-DSA-SHA2-128s has the smallest public key
            (32 B) but the largest signature (7,856 B). For firmware signing where signature size is
            the bottleneck, ML-DSA-65 is a common choice. Outside National Security Systems, SLH-DSA
            may suit long-lived root keys where signing is rare; for NSS it is not an option,
            because the CNSA 2.0 FAQ (p. 11) says SLH-DSA is not part of CNSA and is not approved
            for any use in NSS. CNSA 2.0 prefers stateful hash-based signatures (LMS or XMSS, NIST
            SP 800-208) to start firmware/software signing now; validated ML-DSA-87 is also approved
            for firmware/software signing.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">
            Dual-Signature Hybrid Pattern
          </div>
          <p className="text-xs text-muted-foreground">
            During the transition period, firmware images can carry both an RSA-2048 and ML-DSA-65
            signature. Legacy systems that do not support ML-DSA fall back to RSA verification. New
            systems validate the ML-DSA signature. This dual-signature approach requires careful
            UEFI variable budget planning — the combined overhead is approximately 3,565 bytes
            (3,309 B ML-DSA-65 + 256 B RSA-2048 ≈ 3,565 B) per signed component; with an RSA-4096
            second signature it is about 3,821 bytes (3,309 B + 512 B).
          </p>
        </div>

        {/* What the lab tests: verifier vs signer. Every quotation is verbatim from the named document. */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
          <h3 className="text-sm font-bold text-foreground">What the lab tests</h3>
          <p className="text-xs text-muted-foreground">
            Firmware signing has two sides, and they are tested differently. The{' '}
            <strong>verifier</strong> is the code on the device that checks a signature. The{' '}
            <strong>signer</strong> is the module that holds the private key and produces the
            signature. CAVP is NIST&apos;s algorithm validation program (its tests are specified in
            ACVP documents). CMVP is NIST&apos;s cryptographic module validation program. A CAST is
            a cryptographic algorithm self-test that a validated module runs on its own algorithms.
            In the quotations, IUT means implementation under test, OTS means one-time signature,
            and HBS means hash-based signature. Every quotation below is verbatim from the document
            named after it, with footnote and reference-number markers left out.
          </p>

          <LabTestsSummary />

          <div className="bg-background rounded-lg p-3 border border-border space-y-2">
            <h4 className="text-xs font-bold text-foreground">
              1. The verifier: algorithm tests (CAVP)
            </h4>
            <p className="text-xs text-muted-foreground">
              NIST&apos;s ACVP specification drafts include signature verification for ML-DSA
              (ML-DSA / sigVer / FIPS204) and for LMS (LMS / sigVer). Both use the test type AFT
              (algorithm functional test). For LMS:
            </p>
            <LabQuote source="ACVP draft-celi-acvp-lms-01, 2 October 2026">
              The ACVP server generates a series of signatures to communicate to the IUT. The IUT is
              REQUIRED to determine the validity of the signature given the tree structure, key, and
              message.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              For ML-DSA, the server starts from a valid signature and changes the message or one
              part of the signature (commitment, z or hint); each changed version is not a valid
              signature. The same specification says what ACVP does not test:
            </p>
            <LabQuote source="ACVP draft-celi-acvp-ml-dsa-01, 2 October 2026, section 6.2.2">
              An ACVP server will not test the zeroization of intermediate values, security strength
              of the deterministic random bit generators (DRBGs), or incorrect length signatures or
              public keys.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              No ACVP specification is published for XMSS, XMSS^MT or HSS (NIST&apos;s ACVP
              specification list, October 2026). The FIPS 140-3 Implementation Guidance (IG) C.N,
              last modified September 2024, describes the same state:
            </p>
            <LabQuote source="IG C.N, Background, p. 169">
              CAVP tests are undergoing development with testing available for LMS but not yet for
              XMSS, HSS, or XMSSMT.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              So CNSA 2.0 accepts XMSS as well as LMS for firmware (see part 2), but of the SP
              800-208 schemes only LMS has an ACVP test.
            </p>
          </div>

          <div className="bg-background rounded-lg p-3 border border-border space-y-2">
            <h4 className="text-xs font-bold text-foreground">
              2. The signer: SP 800-208 and the CNSA 2.0 FAQ
            </h4>
            <p className="text-xs text-muted-foreground">
              NIST SP 800-208 sets this rule for key generation and signing with its stateful
              hash-based schemes (LMS and XMSS, and their multi-tree forms HSS and XMSS^MT):
            </p>
            <LabQuote source="NIST SP 800-208, section 8.1, p. 28">
              Implementations of the key generation and signature algorithms in this document shall
              only be validated for use within hardware cryptographic modules. The cryptographic
              modules shall be validated to provide FIPS 140-2 or FIPS 140-3 Level 3 or higher
              physical security, and the operational environment shall be non-modifiable or limited.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              That rule is for key generation and signing only. For a module that only verifies:
            </p>
            <LabQuote source="IG C.N, Resolution 1, p. 170">
              Modules that only support signature verification need to comply with requirements from
              section 8.2 of SP 800-208, but do not need to meet requirements from section 8.1.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              ACVP cannot check two of the signer requirements, the ban on exporting a private key
              and the one-time use of each signing key:
            </p>
            <LabQuote source="ACVP draft-celi-acvp-lms-01, section 6.2.2">
              Many requirements outlined in this section are not testable by ACVP. ACVP does not
              test the inability of an implementation to export a private key. ACVP does not provide
              any guarantees on the inability to reuse private OTS pairs of an implementation.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              The NSA CNSA 2.0 FAQ (version 2.2, October 2026, pp. 11-12) says which part needs
              which validation for National Security Systems (NSS). A product that only verifies:
            </p>
            <LabQuote source="CNSA 2.0 FAQ, p. 11">
              Signature verification is expected to be performed by code that has been validated by
              NIST&apos;s Cryptographic Algorithm Validation Program (CAVP). &hellip; If your
              product is only verifying signatures, CAVP testing is all that is required.
            </LabQuote>
            <p className="text-xs text-muted-foreground">A signer that is itself an NSS:</p>
            <LabQuote source="CNSA 2.0 FAQ, pp. 11-12">
              Code sources and signature generation processes (signers) that are NSS are required to
              produce signatures according to NIST SP 800-208, which requires hardware validated by
              NIST&apos;s Cryptographic Module Validation Program (CMVP), or via other NSA guidance.
              Waivers for this will not be granted.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              A signer that is not an NSS, such as a commercial vendor&apos;s development
              environment:
            </p>
            <LabQuote source="CNSA 2.0 FAQ, p. 12">
              &hellip; the signature generation processes for that code (signers) are often not
              themselves NSS. For example, for many commercial vendors with commodity products used
              in an NSS, their development environments are not NSS. In this case, those signers are
              expected to use code in their signature generation processes that is at least at the
              same operational quality as the code being put on the device, but the only part NSA
              will validate is that the signature verification code on the device passes CAVP.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              The same FAQ applies this to NIAP Protection Profile evaluations of products that only
              verify:
            </p>
            <LabQuote source="CNSA 2.0 FAQ, p. 12">
              Where signing occurs outside the Target of Evaluation (TOE) boundary, such as for
              commercial products being certified where only firmware signature verification is
              performed within the TOE while the firmware signing is performed outside the TOE by an
              HSM or other external signing service, Protection Profile requirements only apply to
              signature verification. As signature generation is the component of LMS/XMSS that
              requires state management, if only signature verification is being performed only CAVP
              validation (not CMVP) will be expected to meet CNSA 2.0 for such products.
            </LabQuote>
            <p className="text-xs text-muted-foreground">Which algorithms the FAQ allows:</p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>
                LMS and XMSS (the same table lists ML-DSA-87 for &ldquo;signing firmware and
                software&rdquo;, p. 7):
                <LabQuote source="CNSA 2.0 FAQ, algorithm table, p. 8">
                  All parameters approved for all classification levels. LMS SHA-256/192 is
                  recommended.
                </LabQuote>
              </li>
              <li>
                <LabQuote source="CNSA 2.0 FAQ, p. 11">
                  From NIST SP 800-208, NSA has only approved LMS and XMSS for use in NSS. The
                  multi-tree algorithms HSS and XMSSMT are not allowed.
                </LabQuote>
              </li>
              <li>
                <LabQuote source="CNSA 2.0 FAQ, p. 11">
                  While SLH-DSA is hash-based, it is not part of CNSA and is not approved for any
                  use in NSS.
                </LabQuote>
              </li>
            </ul>
          </div>

          <div className="bg-background rounded-lg p-3 border border-border space-y-2">
            <h4 className="text-xs font-bold text-foreground">
              3. Module self-tests and module type (FIPS 140-3 IG)
            </h4>
            <p className="text-xs text-muted-foreground">
              A signer or verifier that is a FIPS 140-3 module also runs self-tests (CASTs). IG
              10.3.A (last modified 19 August 2026) sets the timing and the content:
            </p>
            <LabQuote source="IG 10.3.A, p. 103">
              The requirements of this IG apply prior to the first operational use of the
              cryptographic algorithm.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              For a signer (XMSS has the same wording as LMS):
            </p>
            <LabQuote source="IG 10.3.A, item 5, p. 106">
              If the module implements LMS signature generation then it shall also implement key
              generation and shall have CASTs for both LMS signature generation and key generation.
            </LabQuote>
            <p className="text-xs text-muted-foreground">For a verifier:</p>
            <LabQuote source="IG 10.3.A, item 5, p. 106">
              If the module implements signature verification for LMS, it shall have a CAST for it.
            </LabQuote>
            <LabQuote source="IG 10.3.A, item 15, p. 111">
              if the module implements digital signature verification, the module shall have an
              ML-DSA digital signature verification CAST.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              For the hash-based schemes the size of the tree sets the testing effort:
            </p>
            <LabQuote source="IG 10.3.A, item 5, Note 5, p. 106">
              it is sufficient that the CASTs exercise the smallest (or any other single) parameter
              set (e.g., a single table row with the lowest height trees) supported by the module to
              provide assurance that the algorithm is operating correctly.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              Every generated key pair also gets a pairwise consistency test (PCT), which for SP
              800-208 key pairs may be limited:
            </p>
            <LabQuote source="IG 10.3.A, Additional Comment 1, p. 116">
              may be limited to confirming the same key identifier (I in the case of LMS, SEED in
              the case of XMSS and PK.SEED for SLH-DSA) is shared by the resulting public and
              private key following generation.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              For ML-DSA keys rebuilt from a stored seed:
            </p>
            <LabQuote source="IG 10.3.A, Additional Comment 1, p. 116">
              Subsequent generations of the key pair from the stored seed are considered a
              reconstitution of the key pair and a PCT is not required.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              Module type. SP 800-208 asks for a hardware module. IG C.N Resolution 9 reads:
            </p>
            <LabQuote source="IG C.N, Resolution 9, pp. 171-172">
              Provided the hardware components of any FIPS 140-3 certified module satisfies the
              latter two requirements, it is not required that modules are module type:
              &lsquo;hardware&rsquo; and may separately include modules of type
              &lsquo;firmware&rsquo; and &lsquo;hybrid firmware&rsquo;. For any permitted module
              type, these shall support a certification claim to the Level 3 requirements from
              section 7.7, Physical security, of ISO/IEC 19790:2012. This resolution excludes
              software and hybrid software modules on the basis that these are not by definition in
              ISO/IEC 19790:2012 permitted to include a limited or non-modifiable operating
              environment (OE) as required by SP 800-208.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              In this IG a hybrid firmware module is a module &ldquo;whose cryptographic boundary
              delimits the composite of one or more firmware component(s) and a disjoint hardware
              component&rdquo; (IG 1.B, p. 13). It has nothing to do with hybrid key exchange.
            </p>
          </div>

          <div className="bg-background rounded-lg p-3 border border-border space-y-2">
            <h4 className="text-xs font-bold text-foreground">
              4. What a certificate for the signing module does and does not cover
            </h4>
            <p className="text-xs text-muted-foreground">
              <strong>It covers the module the lab tested.</strong> A module claiming SP 800-208 has
              to meet its Section 8 conformance requirements:
            </p>
            <LabQuote source="IG 10.3.A, item 5, Note 8, p. 107">
              Modules claiming compliance with SP 800-208 and use of the approved security functions
              described therein shall meet, and make clear in the documentation, the conformance
              requirements noted in Section 8 of the standard including, but not limited to, the
              following that apply when a module implements key generation and signature generation:
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              These include requirements that ACVP cannot check:
            </p>
            <LabQuote source="NIST SP 800-208, section 8.1, p. 28">
              The cryptographic module shall not allow for the export of private keying material.
              The entropy source for any approved random bit generator used in the implementation
              shall be located inside the cryptographic module&apos;s physical boundary.
            </LabQuote>
            <LabQuote source="IG C.N, Resolution 3, p. 170">
              In addition to the prohibition of the export of private keys, this resolution extends
              this to include the prohibition of the import of private key material for use with an
              approved HBS service, including the prohibition of importing private keys as a restore
              operation from a backup.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              The lab checks the one-time-key rule by testing, not by paperwork alone:
            </p>
            <LabQuote source="IG C.N, Resolution 12, p. 172">
              Documentation review in isolation is not sufficient to confirm compliance with these
              requirements.
            </LabQuote>
            <LabQuote source="IG C.N, Resolution 12 (m), p. 173">
              the tester shall confirm they verified the module prevents the use of an OTS key to
              generate a digital signature more than one time.
            </LabQuote>
            <p className="text-xs text-muted-foreground">
              <strong>It does not cover</strong> the following.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>
                The verification code on the device. The FAQ (part 2) says that for a signer that is
                not an NSS, &ldquo;the only part NSA will validate&rdquo; is that this on-device
                code passes CAVP.
              </li>
              <li>
                Anything outside the module boundary. For a signature scheme split across
                components:
                <LabQuote source="IG 10.3.A, item 5, Note 7, p. 107">
                  If the module is part of a distributed signature scheme per Section 7 of SP
                  800-208, the CASTs described above only apply to the functionality implemented
                  within the module&apos;s boundary.
                </LabQuote>
              </li>
              <li>
                An algorithm validation on its own. NIST&apos;s CAVP page says:
                <LabQuote source="CAVP overview page, NIST CSRC">
                  a product or implementation does not meet the FIPS 140 module validation
                  requirements by simply implementing an Approved security function and acquiring
                  validations for each of the implemented algorithms.
                </LabQuote>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              The FAQ also advises on where to keep the signing state and on backups:
            </p>
            <LabQuote source="CNSA 2.0 FAQ, p. 12">
              Note: To avoid weakening the security of these signatures, one should implement
              signing and state management in hardware, such as an HSM. Backup flows, which may
              involve transferring keys between modules, must prevent state re-use.
            </LabQuote>
          </div>

          <p className="text-xs text-muted-foreground">
            Related: how the ACVP tests are run in{' '}
            <Link to="/learn/acvp-lab-workflow" className="text-primary hover:underline">
              ACVP Lab Workflow
            </Link>
            , how the signing state is managed in{' '}
            <Link to="/learn/stateful-signatures" className="text-primary hover:underline">
              Stateful Hash-Based Signatures
            </Link>
            , and how a module is validated in{' '}
            <Link to="/learn/fips-140-3-certification" className="text-primary hover:underline">
              FIPS 140-3 Certification
            </Link>
            .
          </p>
        </div>

        {/* Two integrity checks beside the signature: a sibling of "What the lab tests", not a fifth part of it, because no lab tests SP 800-193. */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            Two integrity checks beside the signature: SP 800-193 and the FIPS 140-3 integrity test
          </h3>

          <h4 className="text-xs font-bold text-foreground">
            NIST SP 800-193: a guideline for platform designers
          </h4>
          <p className="text-xs text-muted-foreground">
            NIST SP 800-193, Platform Firmware Resiliency Guidelines (May 2018), is aimed at
            developers and engineers who implement firmware-level security.
          </p>
          <p className="text-xs text-muted-foreground">
            It has three principles. Protection keeps platform firmware code and critical data in a
            state of integrity, for example by ensuring the authenticity and integrity of firmware
            updates. Detection finds when they have been corrupted or changed from an authorized
            state. Recovery restores them to a state of integrity.
          </p>
          <p className="text-xs text-muted-foreground">
            The mechanisms are founded in Roots of Trust, defined by function: Update, Detection and
            Recovery. The guideline applies to any device in the platform that contains firmware.
            Its example list for x86 platforms includes the embedded controller, TPM, baseboard
            management controller, SPI flash and host boot firmware.
          </p>
          <p className="text-xs text-muted-foreground">
            In an authenticated update, the Root of Trust for Update holds the signature
            verification algorithm and the key store. Both change only through an authenticated
            update or a secure local update. Update images must be signed with a FIPS 186-4
            algorithm at a security strength of at least 112 bits. For detection, the guideline
            lists integrity verification with a digital signature algorithm or a cryptographic hash
            before code outside the Root of Trust for Detection runs. The text names FIPS 186-4,
            which FIPS 186-5 has since superseded, and does not mention post-quantum schemes.
          </p>

          <h4 className="text-xs font-bold text-foreground">
            The FIPS 140-3 software/firmware integrity test
          </h4>
          <p className="text-xs text-muted-foreground">
            FIPS 140-3 takes its technical requirements and test methods from ISO/IEC 19790:2012 and
            ISO/IEC 24759:2017. The CMVP records changes in the SP 800-140 series and answers lab
            and vendor questions in the Implementation Guidance (IG).
          </p>
          <p className="text-xs text-muted-foreground">
            The integrity test is a pre-operational self-test (ISO/IEC 19790:2012, 7.10.2.2). The
            module verifies all software and firmware inside its cryptographic boundary with
            &ldquo;an approved integrity technique or EDC&rdquo;; if verification fails, the test
            fails. Code in non-reconfigurable memory, as the IG defines it, is exempt. The IG notes
            that a bootloader will have a pre-operational test for firmware integrity/authenticity.
          </p>
          <p className="text-xs text-muted-foreground">
            For the software and firmware of a hybrid module, the IG names the technique by security
            level: level 1, &ldquo;an approved integrity technique&rdquo;; level 2, &ldquo;an
            approved digital signature or keyed message authentication code&rdquo;; levels 3 and 4,
            &ldquo;an approved digital signature&rdquo;. For a hardware module, an EDC is sufficient
            for its software and firmware. The algorithm behind the technique first has to pass its
            own algorithm self-test. The Security Policy states which techniques the module uses.
          </p>
          <p className="text-xs text-muted-foreground">
            For PQC signatures,{' '}
            <a
              href={CMVP_SECURITY_FUNCTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="the CMVP list of security functions (opens in a new tab)"
              className="text-primary hover:underline"
            >
              the CMVP list of security functions
            </a>{' '}
            includes ML-DSA, SLH-DSA, LMS, HSS, XMSS and XMSSMT. The IG&apos;s worked example for
            the integrity technique&apos;s self-test uses RSA; it gives no PQC example.
          </p>

          <h4 className="text-xs font-bold text-foreground">How the two differ</h4>
          <p className="text-xs text-muted-foreground">
            SP 800-193 is a design guideline for platforms and names no validation program. The
            integrity test is a requirement on a cryptographic module, tested by an accredited
            laboratory and validated by the CMVP.
          </p>

          <p className="text-xs text-muted-foreground">
            Sources: <LibCite std={SP_800_193}>NIST SP 800-193</LibCite> (May 2018);{' '}
            <LibCite std={FIPS_140_3}>FIPS 140-3</LibCite> (sections 3.2 to 3.4);{' '}
            <LibCite std={CMVP_IG}>CMVP Implementation Guidance for FIPS 140-3</LibCite> (IG 1.B,
            5.A, 10.2.A, 10.3.E); <LibCite std={SP_800_140}>NIST SP 800-140</LibCite>;{' '}
            <LibCite std={SP_800_140B}>NIST SP 800-140B</LibCite> Rev. 1 (section 5.1);{' '}
            <LibCite std={SP_800_140C}>NIST SP 800-140C</LibCite> Rev. 2 (section 6.2) and{' '}
            <a
              href={CMVP_SECURITY_FUNCTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              the CMVP web page that lists the approved security functions
              <ExternalLink size={10} aria-hidden="true" className="shrink-0" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{' '}
            (as of 24 October 2026); <LibCite std={FIPS_186_5}>FIPS 186-5</LibCite>. Check the
            current versions: the guidance and the CMVP list change.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 3: TPM 2.0 and PQC */}
      <CollapsibleSection
        icon={<Key size={24} className="text-primary" />}
        title="TPM 2.0 and the Path to Post-Quantum Attestation"
        sectionId="tpm-attestation"
      >
        <p>
          <InlineTooltip term="TPM">TPM 2.0</InlineTooltip> (ISO/IEC 11889:2015) is the hardware
          root of trust for platform attestation in most enterprise servers and PCs. It measures
          boot stages into PCR banks, provides Attestation Identity Keys (AIK) for remote
          attestation, and seals secrets to specific platform states.
        </p>

        <div className="bg-status-warning/5 rounded-lg p-4 border border-status-warning/20">
          <div className="text-sm font-bold text-status-warning mb-2">
            TPM 2.0 Library v185 Defines ML-DSA and ML-KEM; Installed TPMs Predate It
          </div>
          <p className="text-xs text-foreground/80">
            The <strong>Trusted Computing Group (TCG)</strong> published the TPM 2.0 Library
            Specification v185 on 12 March 2026. Its change history (Part 0) states:
            &ldquo;Introduced support for ML-DSA, HashML-DSA, and ML-KEM.&rdquo; The PC Client
            Platform TPM Profile (PTP) 1.07 adds larger data transport and defines which ML-KEM
            Endorsement Key certificates are required. The ISO/IEC 11889:2015 edition dates from
            before ML-KEM and ML-DSA were standardized (FIPS 203 and FIPS 204).
          </p>
          <p className="text-xs text-foreground/80 mt-2">
            A TPM offers these algorithms only if its vendor built it to v185 or later. A
            TPM2_GetCapability query for TPM_PT_REVISION (specification version) and
            TPM_PT_ML_PARAMETER_SETS (supported ML-KEM and ML-DSA parameter sets) shows what a given
            part supports. Chips and platform firmware follow the specification, so check a
            vendor&rsquo;s own documentation for which version a shipping part implements.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold text-foreground">
            Interim Hybrid Approach for TPMs Built to Earlier Versions:
          </div>
          {[
            {
              step: 1,
              title: 'TPM RSA AIK signs quote (hardware-backed proof)',
              detail:
                "The TPM's RSA-2048 AIK produces a quote over PCR values — this proves hardware integrity but is quantum-vulnerable for long-lived secrets.",
            },
            {
              step: 2,
              title: 'Software ML-DSA-65 key co-signs the same nonce',
              detail:
                'An ML-DSA-65 key pair generated in software (outside the TPM) signs the same challenge nonce, providing quantum-safe attestation. The ML-DSA public key is bound to the TPM AIK certificate.',
            },
            {
              step: 3,
              title: 'Verifier validates both signatures',
              detail:
                'The relying party checks: (1) TPM AIK certificate chain (hardware binding), (2) ML-DSA signature (quantum-safe proof). Both must pass.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border"
            >
              <span className="text-xs font-bold text-primary w-5 shrink-0 mt-0.5">
                {item.step}
              </span>
              <div>
                <div className="text-xs font-bold text-foreground mb-0.5">{item.title}</div>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">PCR[7] and Key Migration</div>
          <p className="text-xs text-muted-foreground">
            PCR[7] records all Secure Boot key changes (PK/KEK/db enrollment). When you migrate UEFI
            keys to ML-DSA, PCR[7] will change. Any secrets sealed against PCR[7] (notably{' '}
            <strong>BitLocker TPM protectors</strong> on Windows) must be re-sealed after the key
            migration. Plan for BitLocker recovery key backup and re-sealing as part of your UEFI
            PQC migration procedure.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 4: Vendor Roadmaps */}
      <CollapsibleSection
        icon={<Building2 size={24} className="text-primary" />}
        title="AMI, Insyde, EDK2, Dell, HPE Firmware PQC Roadmaps"
        sectionId="vendor-roadmaps"
      >
        <p>
          BIOS and firmware vendors are at different stages of PQC adoption. Understanding each
          vendor&apos;s timeline is critical for infrastructure refresh planning, especially for
          organizations with CNSA 2.0 or EU NIS2 compliance requirements.
        </p>

        <div className="space-y-4">
          {FIRMWARE_VENDORS.map((vendor) => {
            const status = VENDOR_STATUS_LABELS[vendor.pqcStatus]
            return (
              <div key={vendor.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{vendor.product}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground uppercase">
                    {vendor.vendor}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.className}`}
                  >
                    {status.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Source dated {formatVendorDate(vendor.statementDate)}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 mb-2">{vendor.notes}</p>
                <div className="text-[10px] text-primary/80">PQC: {vendor.pqcAlgorithm}</div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Checked on {VENDOR_MATRIX_CHECKED_ON}. Each card shows only what its linked sources state;
          the sources are listed in the Firmware Vendor Matrix.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">
            UEFI Forum PQC Specification Work
          </div>
          <p className="text-xs text-muted-foreground">
            The UEFI Forum published a white paper,{' '}
            <a
              href="https://uefi.org/sites/default/files/resources/UEFI_PQC_Update_Whitepaper_Final.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Post-Quantum Cryptography: UEFI Specification Updates
            </a>{' '}
            (29 April 2026), that &ldquo;consolidates proposed specification changes for additional
            feedback and to validate implementation feasibility.&rdquo; It states: &ldquo;These
            proposals are not yet approved and may change or be rejected.&rdquo; Organizations
            should monitor UEFI Forum publications and engage their firmware vendors for preview
            access.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 5: Supply Chain Security */}
      <CollapsibleSection
        icon={<Cpu size={24} className="text-primary" />}
        title="Hardware Supply Chain and Firmware Integrity at Scale"
      >
        <p>
          At scale, firmware integrity requires end-to-end supply chain controls. The threat model
          extends beyond network attackers to include <strong>insider threats at OEMs</strong>,{' '}
          <strong>compromised build systems</strong>, and{' '}
          <strong>hardware implants in manufacturing</strong>. PQC migration must secure the entire
          signing pipeline.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: 'Build-Time Code Signing',
              icon: Lock,
              description:
                'ML-DSA private keys used for firmware signing should be stored in FIPS 140-3 Level 3 HSMs (best practice). For LMS and XMSS, NIST SP 800-208 §8.1 says the key generation and signature algorithms "shall only be validated for use within hardware cryptographic modules". Key ceremony procedures must be updated for ML-DSA-65 key generation.',
            },
            {
              title: 'Supply Chain Verification',
              icon: Shield,
              description:
                'NIST SP 800-161r1 says the enterprise should ensure that code authentication mechanisms, such as digital signatures, are implemented to ensure the integrity of software, firmware, and information. Signing firmware manifests (SWID tags, SBOM attestations) with ML-DSA is one way to carry this out.',
            },
            {
              title: 'Firmware Update Pipeline',
              icon: Route,
              description:
                'Automated firmware update systems (iDRAC, iLO, iSUM) must validate ML-DSA signatures before applying updates. Update catalogs and manifests must use ML-DSA-65 throughout.',
            },
            {
              title: 'Attestation at Scale',
              icon: Building2,
              description:
                'Enterprise attestation services (Microsoft Azure Attestation, Google Confidential Space) must handle ML-DSA AIK certificates and PQC TPM quote signatures as hardware support becomes available.',
            },
          ].map((item) => {
            const ItemIcon = item.icon
            return (
              <div key={item.title} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <ItemIcon size={16} className="text-primary shrink-0" aria-hidden="true" />
                  <div className="text-xs font-bold text-foreground">{item.title}</div>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            )
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">Migration Phase Plan</div>
          <div className="space-y-2">
            {[
              {
                phase: 'Phase 1: Inventory (2025–2026)',
                description:
                  'Catalog all firmware signing keys, identify platforms, assess UEFI NVRAM capacity, engage OEM vendors for PQC timelines.',
              },
              {
                phase: 'Phase 2: Dual-Signature Deployment (2026–2027)',
                description:
                  'Deploy firmware with hybrid RSA + ML-DSA signatures. Begin PK/KEK/db migration on new platforms. EDK2 OVMF for lab validation.',
              },
              {
                phase: 'Phase 3: Full PQC (2027–2030)',
                description:
                  'Retire RSA-only firmware signing. Complete PK/KEK/db migration on all production platforms. Enable ML-DSA-only mode once legacy systems are retired.',
              },
            ].map((p) => (
              <div
                key={p.phase}
                className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border"
              >
                <div className="flex-1">
                  <div className="text-xs font-bold text-foreground mb-0.5">{p.phase}</div>
                  <p className="text-[10px] text-muted-foreground">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/hsm-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Key size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">HSM &amp; PQC Operations</div>
              <div className="text-xs text-muted-foreground">
                PKCS#11 v3.2 mechanisms and firmware migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">
                KMS &amp; PQC Key Management
              </div>
              <div className="text-xs text-muted-foreground">
                Envelope encryption and key hierarchy patterns
              </div>
            </div>
          </Link>
          <Link
            to="/learn/confidential-computing"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Cpu size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Confidential Computing</div>
              <div className="text-xs text-muted-foreground">TEEs, remote attestation, and PQC</div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Algorithm-agnostic cryptographic infrastructure
              </div>
            </div>
          </Link>
          <Link
            to="/learn/os-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Monitor size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">OS Cryptographic Stacks</div>
              <div className="text-xs text-muted-foreground">
                OS-level crypto providers, SSH host keys, and system TLS policy
              </div>
            </div>
          </Link>
        </div>
      </section>

      <VendorCoverageNotice migrateLayer="Hardware" migrateDomain="codesign" />

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
          Analyze UEFI key hierarchies, migrate firmware signatures, and explore TPM attestation
          flows.
        </p>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
