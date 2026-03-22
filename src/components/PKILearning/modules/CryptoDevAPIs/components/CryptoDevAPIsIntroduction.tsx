// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Globe,
  Lock,
  Server,
  Shield,
  Layers,
  Package,
  Wrench,
  Shuffle,
  BookOpen,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'

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

export const CryptoDevAPIsIntroduction: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Section 1 */}
      <CollapsibleSection
        title="The Crypto API Landscape"
        icon={<Globe size={20} className="text-primary" />}
        defaultOpen
      >
        <p className="text-muted-foreground">
          Cryptographic APIs have grown organically over decades. Each emerged from a specific need:
          <strong className="text-foreground"> PKCS#11</strong> was created by RSA Labs in 1995 to
          provide a vendor-neutral interface to hardware security modules.{' '}
          <strong className="text-foreground">JCA/JCE</strong> debuted in 1997 as Sun Microsystems
          built cryptography into the Java platform with a pluggable provider model.{' '}
          <strong className="text-foreground">CNG</strong> replaced the legacy CryptoAPI in Windows
          Vista, separating key storage providers from algorithm providers.
          <strong className="text-foreground"> OpenSSL&apos;s EVP API</strong> evolved to abstract
          over multiple algorithm implementations, with v3.x adding a loadable provider system.
        </p>
        <p className="text-muted-foreground">
          These APIs are not interchangeable — they reflect different design philosophies, security
          models, and deployment targets. Understanding their relationships helps you choose
          correctly and design for crypto agility.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {[
            { name: 'JCA/JCE', year: 1997, org: 'Sun Microsystems' },
            { name: 'PKCS#11', year: 1995, org: 'RSA Labs' },
            { name: 'OpenSSL EVP', year: 1998, org: 'Community' },
            { name: 'CNG', year: 2007, org: 'Microsoft' },
            { name: 'Bouncy Castle', year: 2000, org: 'Legion of the BC' },
            { name: 'JCProv', year: 2004, org: 'Thales / SafeNet' },
          ].map((api) => (
            <div key={api.name} className="border border-border rounded-lg p-3">
              <div className="font-semibold text-foreground text-sm">{api.name}</div>
              <div className="text-xs text-muted-foreground">
                {api.year} · {api.org}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 2 */}
      <CollapsibleSection
        title="Common Principles Across All APIs"
        icon={<Layers size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Despite their differences, all crypto APIs share a common set of abstractions:
        </p>
        <ul className="space-y-3">
          {[
            {
              title: 'Provider / Plugin Model',
              desc: 'Algorithm implementations are pluggable. Your application code stays the same; the provider changes. This is the foundation of crypto agility.',
            },
            {
              title: 'Key Lifecycle',
              desc: 'Keys are generated, stored (opaque handles), used, rotated, and destroyed. Never extract raw key material except at the system boundary.',
            },
            {
              title: 'Algorithm Negotiation',
              desc: 'Algorithms are selected at initialization time, not operation time. TLS does this at the protocol level; your API should too.',
            },
            {
              title: 'Opaque Handles vs Raw Material',
              desc: 'Hardware-backed keys (HSM/TPM) are never extractable. Software keys may be. Design for opaque handles throughout.',
            },
            {
              title: 'Session / Context Management',
              desc: 'Operations happen in contexts (JCA Signature, EVP_MD_CTX, PKCS#11 Session). Initialize → Update → Finalize is the universal pattern.',
            },
          ].map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="text-primary shrink-0 mt-1">▸</span>
              <div>
                <span className="font-semibold text-foreground">{item.title}: </span>
                <span className="text-muted-foreground">{item.desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Section 3 */}
      <CollapsibleSection
        title="JCA/JCE & Bouncy Castle"
        icon={<Code2 size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          The{' '}
          <InlineTooltip term="JCA/JCE">Java Cryptography Architecture / Extension</InlineTooltip>{' '}
          is the standard Java cryptographic framework. Engine classes (
          <code className="text-primary font-mono text-sm">KeyPairGenerator</code>,{' '}
          <code className="text-primary font-mono text-sm">Cipher</code>,{' '}
          <code className="text-primary font-mono text-sm">Signature</code>) delegate to pluggable
          Provider implementations registered at startup.
        </p>
        <p className="text-muted-foreground">
          <InlineTooltip term="Bouncy Castle">Open-source Java/.NET crypto library</InlineTooltip>{' '}
          plays a dual role: as a JCA provider (
          <code className="text-primary font-mono text-sm">new BouncyCastleProvider()</code>{' '}
          registered via{' '}
          <code className="text-primary font-mono text-sm">Security.addProvider()</code>), and as a
          standalone lightweight API for environments where JCA overhead is undesirable. BC has had
          full ML-KEM, ML-DSA, SLH-DSA, and FN-DSA support since version 1.78.
        </p>
        <p className="text-muted-foreground">
          <InlineTooltip term="JCProv">SafeNet/Thales Java PKCS#11 wrapper</InlineTooltip> bridges
          JCA and PKCS#11 — once registered, standard JCA calls transparently hit the HSM. This is
          the recommended pattern for enterprise Java apps that need HSM-backed keys.
        </p>
      </CollapsibleSection>

      {/* Section 4 */}
      <CollapsibleSection
        title="OpenSSL & libcrypto"
        icon={<Lock size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          OpenSSL&apos;s EVP API (<em>Envelope</em>) is the high-level, algorithm-agnostic layer.
          Use <code className="text-primary font-mono text-sm">EVP_PKEY</code> for key objects,
          <code className="text-primary font-mono text-sm">EVP_MD_CTX</code> for hashing, and
          <code className="text-primary font-mono text-sm">EVP_CIPHER_CTX</code> for encryption.
          Never use the deprecated low-level APIs (
          <code className="text-primary font-mono text-sm">RSA_*</code>,{' '}
          <code className="text-primary font-mono text-sm">EC_*</code>).
        </p>
        <p className="text-muted-foreground">
          OpenSSL 3.x introduced the <strong className="text-foreground">provider model</strong>:{' '}
          <code className="text-primary font-mono text-sm">
            OSSL_PROVIDER_load(NULL, &quot;oqsprovider&quot;)
          </code>{' '}
          loads PQC algorithm support at runtime via the{' '}
          <InlineTooltip term="oqsprovider">
            OpenSSL provider for PQC algorithms (liboqs)
          </InlineTooltip>
          . This means zero application code changes when switching to PQC — only the provider load
          call and algorithm name change.
        </p>
      </CollapsibleSection>

      {/* Section 5 */}
      <CollapsibleSection
        title="PKCS#11 — Hardware Abstraction"
        icon={<Server size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          <strong className="text-foreground">PKCS#11</strong> is a C API standard for communicating
          with cryptographic tokens (HSMs, smart cards, TPMs). The key objects are Slots, Tokens,
          and Sessions. Operations follow the pattern:{' '}
          <code className="text-primary font-mono text-sm">C_Initialize</code> →{' '}
          <code className="text-primary font-mono text-sm">C_GetSlotList</code> →{' '}
          <code className="text-primary font-mono text-sm">C_OpenSession</code> →{' '}
          <code className="text-primary font-mono text-sm">C_Login</code> →{' '}
          <code className="text-primary font-mono text-sm">C_GenerateKeyPair</code> →{' '}
          <code className="text-primary font-mono text-sm">C_Sign</code>.
        </p>
        <p className="text-muted-foreground">
          PKCS#11 v3.2 (2023) added PQC mechanisms:{' '}
          <code className="text-primary font-mono text-sm">CKM_ML_KEM_*</code>,{' '}
          <code className="text-primary font-mono text-sm">CKM_ML_DSA_*</code>,{' '}
          <code className="text-primary font-mono text-sm">CKM_SLH_DSA_*</code>. Hardware tokens are
          beginning to implement these — Thales Luna 10.x and Utimaco SecurityServer are in beta
          support.
        </p>
        <div className="bg-status-warning/10 border border-status-warning/40 rounded-lg p-3">
          <div className="font-semibold text-status-warning text-sm mb-1">
            Key Distinction from Other APIs
          </div>
          <p className="text-sm text-muted-foreground">
            PKCS#11 sessions are mandatory — unlike JCA or OpenSSL, every operation requires an open
            session. Session management is the #1 source of bugs in PKCS#11 implementations.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 6 */}
      <CollapsibleSection
        title="KSP & Windows CNG"
        icon={<Shield size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          <InlineTooltip term="CNG">Cryptography Next Generation (Windows API)</InlineTooltip>{' '}
          separates algorithm providers (
          <code className="text-primary font-mono text-sm">BCryptOpenAlgorithmProvider</code>) from
          key storage providers (
          <code className="text-primary font-mono text-sm">NCryptOpenStorageProvider</code>). The{' '}
          <InlineTooltip term="KSP">Key Storage Provider</InlineTooltip> manages key isolation —
          private keys can live in software, TPM, or HSM without changing application code.
        </p>
        <p className="text-muted-foreground">
          CNG integrates with the Windows certificate store and is the foundation for Windows FIPS
          mode. PQC support is currently limited: ML-KEM is available in Windows 11 Insider builds;
          ML-DSA support is on the roadmap for Windows Server 2026+.
        </p>
      </CollapsibleSection>

      {/* Section 7 */}
      <CollapsibleSection
        title="Build vs Buy vs Open Source"
        icon={<Wrench size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Choosing your crypto library source is a strategic decision with long-term implications:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Build Your Own',
              badge: 'High Risk',
              badgeColor: 'text-status-error border-status-error/50 bg-status-error/10',
              items: [
                '+ Full control, IP ownership, custom optimizations',
                '− Extreme cost: crypto expertise, side-channel audits, FIPS certification',
                '− Ongoing maintenance burden; must patch every new CVE',
                '✓ Only justified for Google, Amazon, Signal-level usage',
              ],
            },
            {
              title: 'Open Source',
              badge: 'Recommended',
              badgeColor: 'text-status-success border-status-success/50 bg-status-success/10',
              items: [
                '+ Community-audited, transparent, large ecosystem',
                '+ Zero licensing cost; PQC support often first here',
                '− No SLA; vulnerability timing depends on maintainers',
                '✓ OpenSSL, Bouncy Castle, liboqs for most use cases',
              ],
            },
            {
              title: 'Commercial',
              badge: 'Enterprise',
              badgeColor: 'text-status-info border-status-info/50 bg-status-info/10',
              items: [
                '+ Vendor SLA, pre-certified (FIPS 140-3, Common Criteria)',
                '+ Compliance documentation, incident response support',
                '− Vendor lock-in, cost, slower PQC adoption',
                '✓ Regulated industries: finance, defense, government',
              ],
            },
          ].map((strategy) => (
            <div key={strategy.title} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-foreground">{strategy.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded border ${strategy.badgeColor}`}>
                  {strategy.badge}
                </span>
              </div>
              <ul className="space-y-1">
                {strategy.items.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 8 */}
      <CollapsibleSection
        title="Open-Source PQC Libraries"
        icon={<Package size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          The PQC library ecosystem is maturing rapidly. Key libraries by use case:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground">Library</th>
                <th className="text-left p-2 text-muted-foreground">Language</th>
                <th className="text-left p-2 text-muted-foreground">Best For</th>
                <th className="text-left p-2 text-muted-foreground">FIPS Path</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: 'liboqs',
                  lang: 'C',
                  use: 'Reference implementations, bindings hub',
                  fips: 'Via oqsprovider',
                },
                {
                  name: 'AWS-LC',
                  lang: 'C',
                  use: 'FIPS-validated production, cloud',
                  fips: 'Validated',
                },
                {
                  name: 'BoringSSL',
                  lang: 'C',
                  use: "Google's fork, embedded in Chrome/Android",
                  fips: 'BoringCrypto',
                },
                {
                  name: 'Bouncy Castle',
                  lang: 'Java/.NET',
                  use: 'JVM/CLR, widest PQC coverage',
                  fips: 'Planned',
                },
                {
                  name: 'pqcrypto',
                  lang: 'Rust',
                  use: 'Compile-time safety, Rust ecosystem',
                  fips: 'Community',
                },
                {
                  name: 'PQClean',
                  lang: 'C',
                  use: 'Audited reference, feeds other libs',
                  fips: 'Reference',
                },
                {
                  name: 'wolfSSL',
                  lang: 'C',
                  use: 'Embedded/IoT, small footprint',
                  fips: 'Validated',
                },
                {
                  name: 'Botan',
                  lang: 'C++',
                  use: 'Native PQC since 3.x, modern C++',
                  fips: 'Planned',
                },
              ].map((lib) => (
                <tr key={lib.name} className="border-b border-border hover:bg-muted/20">
                  <td className="p-2 font-mono text-primary font-semibold">{lib.name}</td>
                  <td className="p-2 text-muted-foreground">{lib.lang}</td>
                  <td className="p-2 text-muted-foreground">{lib.use}</td>
                  <td className="p-2 text-muted-foreground">{lib.fips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Section 9 */}
      <CollapsibleSection
        title="Language Ecosystem Overview"
        icon={<BookOpen size={20} className="text-primary" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              lang: 'C / C++',
              libs: ['OpenSSL (EVP)', 'Botan 3.x', 'Crypto++', 'wolfSSL'],
              pqc: 'Via oqsprovider or liboqs directly',
              note: 'Maximum performance; requires careful memory management',
            },
            {
              lang: 'Rust',
              libs: ['RustCrypto', 'ring', 'pqcrypto', 'aws-lc-rs'],
              pqc: 'pqcrypto crate (compile-time algorithm selection)',
              note: 'Type system prevents key misuse; borrow checker eliminates use-after-free on key material',
            },
            {
              lang: 'Java / Kotlin',
              libs: ['JCA/JCE', 'Bouncy Castle', 'JCProv'],
              pqc: 'BC 1.78+ for all NIST PQC algorithms',
              note: 'Widest PQC coverage today; JCProv bridges to HSM',
            },
            {
              lang: 'Python',
              libs: ['cryptography.io', 'pyOpenSSL', 'liboqs-python'],
              pqc: 'liboqs-python for PQC; cryptography.io for classical',
              note: 'Fast prototyping; not for production key handling',
            },
            {
              lang: 'Go',
              libs: ['crypto/*', 'golang.org/x/crypto', 'oqs-go', 'CIRCL'],
              pqc: 'CIRCL (Cloudflare) for SIDH/FrodoKEM; oqs-go for full suite',
              note: 'Growing PQC ecosystem; stdlib still classical-only',
            },
            {
              lang: '.NET / C#',
              libs: ['System.Security.Cryptography', 'Bouncy Castle C#', 'CNG interop'],
              pqc: 'BC C# for PQC; CNG for Windows HSM integration',
              note: 'CNG integration is best-in-class for Windows environments',
            },
            {
              lang: 'Zig',
              libs: ['std.crypto', 'C interop via translate-c'],
              pqc: 'Consume C libraries via Zig build system',
              note: 'comptime enables constant-time implementations with no runtime overhead',
            },
          ].map((item) => (
            <div key={item.lang} className="border border-border rounded-lg p-3">
              <div className="font-bold text-foreground mb-1">{item.lang}</div>
              <div className="text-xs text-muted-foreground mb-1">
                Libs:{' '}
                {item.libs.map((l) => (
                  <code key={l} className="text-primary mx-0.5">
                    {l}
                  </code>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mb-1">PQC: {item.pqc}</div>
              <div className="text-xs text-muted-foreground italic">{item.note}</div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 10 */}
      <CollapsibleSection
        title="PQC Readiness & Roadmap"
        icon={<Shuffle size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">Current production-readiness by API:</p>
        <div className="space-y-2">
          {[
            {
              api: 'Bouncy Castle (Java/.NET)',
              status: 'production',
              note: 'ML-KEM, ML-DSA, SLH-DSA, FN-DSA, LMS/XMSS all supported since BC 1.78 (Jan 2024)',
            },
            {
              api: 'OpenSSL + oqsprovider',
              status: 'production',
              note: 'All NIST PQC algorithms via oqsprovider 0.7.0+; requires OpenSSL 3.2+',
            },
            {
              api: 'AWS-LC (aws-lc-rs)',
              status: 'production',
              note: 'ML-KEM-768 in FIPS module; ML-DSA planned for 2025',
            },
            {
              api: 'JCA/JCE (built-in)',
              status: 'planned',
              note: 'Oracle JDK PQC planned for Java 25 (LTS); currently requires BC provider',
            },
            {
              api: 'Windows CNG',
              status: 'experimental',
              note: 'ML-KEM in Insider builds; ML-DSA on roadmap for 2026',
            },
            {
              api: 'PKCS#11 v3.2',
              status: 'experimental',
              note: 'HSM vendor support beginning; Thales Luna 10.x in beta',
            },
          ].map((item) => {
            const colors = {
              production: 'text-status-success border-status-success/50 bg-status-success/10',
              experimental: 'text-status-warning border-status-warning/50 bg-status-warning/10',
              planned: 'text-status-info border-status-info/50 bg-status-info/10',
            }[item.status]
            return (
              <div
                key={item.api}
                className="flex items-start gap-3 p-3 border border-border rounded-lg"
              >
                <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${colors}`}>
                  {item.status}
                </span>
                <div>
                  <div className="font-semibold text-sm text-foreground">{item.api}</div>
                  <div className="text-sm text-muted-foreground">{item.note}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mt-2">
          <h4 className="font-bold text-foreground mb-2">Cross-Module References</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              •{' '}
              <Link to="/learn/crypto-agility" className="text-primary hover:underline">
                Crypto Agility
              </Link>{' '}
              — Surface-level provider patterns → this module for deep dive
            </li>
            <li>
              •{' '}
              <Link to="/learn/hsm-pqc" className="text-primary hover:underline">
                HSM-PQC
              </Link>{' '}
              — PKCS#11 from admin view → this module for developer API view
            </li>
            <li>
              •{' '}
              <Link to="/learn/kms-pqc" className="text-primary hover:underline">
                KMS-PQC
              </Link>{' '}
              — KMIP protocol → this module for API-level integration
            </li>
            <li>
              •{' '}
              <Link to="/learn/code-signing" className="text-primary hover:underline">
                Code Signing
              </Link>{' '}
              — Signing operations → this module for API selection
            </li>
            <li>
              •{' '}
              <Link to="/learn/os-pqc" className="text-primary hover:underline">
                OS Cryptographic Stacks
              </Link>{' '}
              — OS-level crypto providers → this module for application API layer
            </li>
            <li>
              •{' '}
              <Link to="/learn/platform-eng-pqc" className="text-primary hover:underline">
                Platform Engineering
              </Link>{' '}
              — CI/CD pipeline crypto → this module for library selection
            </li>
          </ul>
        </div>
      </CollapsibleSection>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shuffle size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">Design provider-agnostic APIs to swap algorithms at runtime</div>
            </div>
          </Link>
          <Link
            to="/learn/hsm-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Server size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">HSM &amp; PQC</div>
              <div className="text-xs text-muted-foreground">PKCS#11 from the HSM admin view vs. developer API perspective</div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Lock size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">KMS &amp; PQC</div>
              <div className="text-xs text-muted-foreground">KMIP protocol and API-level key management integration</div>
            </div>
          </Link>
          <Link
            to="/learn/code-signing"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Code Signing</div>
              <div className="text-xs text-muted-foreground">Signing operations and API selection for CI/CD pipelines</div>
            </div>
          </Link>
          <Link
            to="/learn/os-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Globe size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">OS Cryptographic Stacks</div>
              <div className="text-xs text-muted-foreground">OS-level crypto providers that application APIs build on top of</div>
            </div>
          </Link>
          <Link
            to="/learn/platform-eng-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Wrench size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Platform Engineering</div>
              <div className="text-xs text-muted-foreground">CI/CD pipeline crypto inventory and library selection</div>
            </div>
          </Link>
        </div>
      </section>
      <VendorCoverageNotice migrateLayer="Application" />

      <ReadingCompleteButton />
    </div>
  )
}
