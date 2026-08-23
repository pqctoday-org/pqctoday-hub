// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import {
  BookOpen,
  FileText,
  Search,
  Fingerprint,
  Languages,
  ShieldCheck,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onNavigateToWorkshop?: (step?: number) => void
}

/** ● = grounded in a primary standard · ◆ = practitioner / framework view */
const Badge: FC<{ kind: 'std' | 'view' }> = ({ kind }) => (
  <span
    className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mr-1 align-middle ${
      kind === 'std'
        ? 'bg-status-success/15 text-status-success'
        : 'bg-status-info/15 text-status-info'
    }`}
  >
    {kind === 'std' ? '● standard' : '◆ practitioner'}
  </span>
)

const Section: FC<{
  id: string
  icon: typeof BookOpen
  title: string
  children: React.ReactNode
}> = ({ id, icon: Icon, title, children }) => (
  <section id={id} className="glass-panel p-5 scroll-mt-24">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={18} className="text-primary" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">{children}</div>
  </section>
)

const SECTIONS = [
  { id: 'cbom-why', label: 'Why a CBOM' },
  { id: 'cbom-formats', label: 'Formats' },
  { id: 'cbom-discovery', label: 'Discovery' },
  { id: 'cbom-estate', label: 'Estate fields' },
  { id: 'cbom-context', label: 'Key identity' },
  { id: 'cbom-codify', label: 'Codification' },
  { id: 'cbom-verify', label: 'Verify' },
]

export const CbomIntroduction: FC<Props> = ({ onNavigateToWorkshop }) => {
  useSectionAnchors()
  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center mr-1">In this module:</span>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            {s.label}
          </a>
        ))}
      </div>

      <Section id="cbom-why" icon={BookOpen} title="Why a CBOM, and where Phase 2 sits">
        <p>
          <Badge kind="std" />A <strong>Cryptography Bill of Materials (CBOM)</strong> is a
          machine-readable inventory of every cryptographic asset — algorithms, keys, certificates,
          protocols and their configurations — and how they relate to software components. It{' '}
          <em>extends the SBOM</em>: the SBOM lists your software, the CBOM lists the cryptography
          inside it.
        </p>
        <p>
          In the migration lifecycle it is <strong>Phase 2</strong>: discovery (Phase 1) feeds the
          CBOM, and risk scoring (Phase 3) consumes it. A bare list of algorithms isn&apos;t enough
          — the value is a CBOM you can query and rank.
        </p>
        <p>
          <Badge kind="view" />
          Start with a <strong>Minimum Viable CBOM</strong>: capture the fields you need to
          prioritise (algorithm, where it&apos;s used, what it protects, owner), not a perfect
          catalogue. Regulators are converging on the same expectation: the EU&apos;s NIS
          Cooperation Group roadmap (v1.1, 11 Jun 2025) sets an end-2026 milestone for Member States
          whose first steps include mature cryptographic asset management, saying they &ldquo;should
          promote and support that useful cryptographic inventories are being created and
          maintained&rdquo; and naming CBOM as a recommended format. It is guidance to Member States
          rather than a direct obligation on you — but it is what national rules will be built from.
        </p>
      </Section>

      <Section id="cbom-formats" icon={FileText} title="Formats & governance: CycloneDX vs SPDX">
        <p>
          <Badge kind="std" />
          Two BOM standards compete, with different stewards: <strong>CycloneDX</strong> (OWASP;
          standardized as <strong>ECMA-424</strong>, current spec v1.7) and <strong>SPDX</strong>{' '}
          (Linux Foundation; <strong>ISO/IEC 5962</strong>; v3.0.1).
        </p>
        <p>
          The decider for a CBOM:{' '}
          <strong>SPDX 3.0.1 has no dedicated cryptography object model yet</strong>, so CycloneDX
          is the practical choice today. CycloneDX 1.7 adds a <strong>Cryptography Registry</strong>{' '}
          (consistent algorithm-family and curve naming) built for PQC-readiness reviews.
        </p>
        <p>
          <Badge kind="std" />
          The <strong>PKI Consortium CBOM-Profiles Working Group</strong> (launched 8 Jun 2026) is
          building a neutral methodology so a CBOM profile maps onto <em>both</em> formats — the
          format-neutral future.
        </p>
      </Section>

      <Section id="cbom-discovery" icon={Search} title="Find all the crypto: layered discovery">
        <p>
          <Badge kind="view" />
          <strong>&ldquo;Ghost&rdquo; crypto</strong> is every cryptographic use that isn&apos;t in
          any inventory — shadow-IT services, forgotten-but-live certs, hardcoded algorithms,
          embedded/OT crypto, default library crypto. A CBOM built only from <em>known</em> systems
          is falsely reassuring. <strong>You can&apos;t migrate what you can&apos;t find.</strong>
        </p>
        <p>
          <Badge kind="view" />
          <strong>Reuse before you deploy.</strong> A new agent rollout is usually the real blocker.
          Pull from tools you already run as discovery <em>sources</em> — Qualys / Tenable / Rapid7
          and on-host agents (which surface TLS endpoints, ciphers and certs), Venafi / Keyfactor /
          DigiCert for certificates — and scan net-new only where you are blind.
        </p>
        <p>
          <Badge kind="std" />
          No single method finds it all — layer five: <strong>source code</strong>{' '}
          (sonar-cryptography / CBOMkit, IBM Quantum Safe Explorer),{' '}
          <strong>binary / container</strong> (CBOMkit-theia), <strong>network / traffic</strong>{' '}
          (passive handshake capture + active scanning), <strong>infrastructure / runtime</strong>{' '}
          (HSM/KMS, CLM, CT logs), and <strong>cloud</strong> (KMS/cert APIs + CSPM — no host to
          scan, provider-managed crypto, shared responsibility). Coverage = the union.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop?.(0)}
          className="border-primary text-primary hover:bg-primary/10"
        >
          Try the Source Coverage Mapper →
        </Button>
      </Section>

      <Section
        id="cbom-estate"
        icon={Database}
        title="Estate mapping — what to record per instance"
      >
        <p>
          <Badge kind="view" />
          Framework v2.1 Activity 1.3 defines <strong>13 mandatory fields</strong> per cryptographic
          instance. Recording them consistently is what turns a raw discovery export into a
          queryable, risk-rankable backlog that Phase 3 can score and Phase 4 can sequence.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              f: 'System / Asset ID',
              d: 'Linked to your CMDB — the anchor that ties the crypto instance to an owned, managed asset.',
            },
            {
              f: 'Cryptographic Function',
              d: 'Key exchange, signing, encryption at rest, MAC, hashing — what the crypto is doing.',
            },
            {
              f: 'Algorithm',
              d: 'Fully qualified: RSA-2048, ECDHE-P256, AES-256-GCM. Avoid shorthand (e.g. "RSA") — the key size determines vulnerability.',
            },
            {
              f: 'Key Size (bits)',
              d: 'Critical for quantum-vulnerability classification; a 1024-bit RSA key is more urgent than a 4096-bit one.',
            },
            {
              f: 'Protocol',
              d: 'TLS 1.2 / 1.3, SSH 2.0, IPsec IKEv2, S/MIME — the transport context.',
            },
            {
              f: 'Library / Implementation',
              d: 'OpenSSL 3.0.12, BoringSSL, Java 17 JCA — the version determines upgrade path and CVE exposure.',
            },
            {
              f: 'Certificate Details',
              d: 'Issuer, validity period, chain depth. Long-lived roots (20-year) are a TNFL risk; expiry gaps are a classical risk.',
            },
            {
              f: 'Key Lifetime',
              d: 'Ephemeral (per-session), short (1 year), long-lived (20-year root). Drives both HNDL and TNFL risk scoring.',
            },
            {
              f: 'Data Sensitivity',
              d: 'Confidential / Restricted / Public — feeds the HNDL urgency calculation in Phase 3.',
            },
            {
              f: 'Quantum Vulnerability',
              d: 'Shor-vulnerable (RSA, ECC, DH), Grover-weakened (symmetric, hashes), or neither. Set by algorithm + key size.',
            },
            {
              f: 'Owner',
              d: 'The team or person accountable for migrating this instance. No owner = no migration action.',
            },
            {
              f: 'Vendor Dependency',
              d: 'Whether migration requires a vendor to ship a PQC-capable version. Flags Phase 7 vendor-orchestration work.',
            },
            {
              f: 'Control Posture',
              d: 'Full (control both endpoints), Partial (one endpoint only), or None (third-party managed). Determines migration feasibility.',
            },
          ].map((row, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-2.5 border border-border">
              <div className="text-[11px] font-bold text-primary mb-0.5">{row.f}</div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{row.d}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <strong>Minimum Viable CBOM shortcut:</strong> if full capture is too slow, start with
          Algorithm + Key Size + Owner + Control Posture. Those four fields alone let you produce a
          prioritized remediation queue and unblock Phase 3 scoring for your highest-risk systems.
        </p>
      </Section>

      <Section
        id="cbom-context"
        icon={Fingerprint}
        title="Key identity, provenance & where it's managed"
      >
        <p>
          <Badge kind="view" />
          Discovery finds <em>artifacts</em>; risk needs <em>context</em>. Attach to each key what
          it protects (+ confidentiality horizon = the HNDL input), its purpose (Track A vs B),
          location, owner, vendor-dependency, and active-vs-dormant. That enrichment turns an
          inventory into a risk-rankable backlog.
        </p>
        <p>
          <Badge kind="std" />
          <strong>Two kinds of identifier.</strong> <em>Assigned</em> ids are local and don&apos;t
          correlate (PKCS#11 <code>CKA_ID</code>, KMIP Unique Identifier, KMS key-id, JWK{' '}
          <code>kid</code>). <em>Content-derived</em> ids do: the X.509 SKI / SPKI hash, KMIP
          Digest, JWK Thumbprint (RFC 7638), KCV for symmetric keys. Correlate &ldquo;same key
          across HSM / cert / code / wire&rdquo; on the <strong>SPKI fingerprint</strong>.
        </p>
        <p>
          <Badge kind="std" />
          <strong>Attestation</strong> proves a key&apos;s origin (generated in hardware,
          non-exportable) — HSM/TPM attestation, Android Key Attestation, FIDO2/WebAuthn; for PQC,
          attest generation in a FIPS 140-3-validated module. And record{' '}
          <strong>where the key is managed</strong> — software (exportable, sprawl-prone), HSM
          (non-exportable, attestable), or cloud KMS (API-mediated, envelope encryption) — it drives
          risk and migration feasibility.
        </p>
      </Section>

      <Section id="cbom-codify" icon={Languages} title="Codifying & normalizing crypto">
        <p>
          <Badge kind="view" />
          One mechanism has <strong>many names</strong>. ECDSA-P256-SHA256 is{' '}
          <code>CKM_ECDSA_SHA256</code> to an HSM, OID <code>1.2.840.10045.4.3.2</code> to a
          certificate, <code>ES256</code> to a JWT, and <code>0x0403</code> to TLS 1.3 — and the
          curve alone is P-256 = secp256r1 = prime256v1. Six codification layers (spec, OID,
          protocol code point, key-mgmt enum, library string, CBOM) with no shared key.
        </p>
        <p>
          <Badge kind="std" />
          <strong>PQC makes it worse.</strong> Each parameter set is its own algorithm: ML-DSA chose{' '}
          <em>one OID per parameter set, parameters absent</em> (<code>id-ml-dsa-44/65/87</code>,
          RFC 9881), so OIDs proliferate. Hybrid KEMs (X25519MLKEM768) and composite signatures each
          get their own identifier — combination × nomenclature.
        </p>
        <p>
          <Badge kind="std" />
          The answer is to map every source onto a canonical model (the CycloneDX Cryptography
          Registry) while <strong>never over-collapsing</strong> security-relevant parameters (mode,
          padding, curve, hash). The PKIC CBOM-Profiles WG is the neutral venue maintaining this as
          registries keep moving.
        </p>
        <p className="text-xs text-muted-foreground">
          For the full family/curve reference and a hands-on normalizer, see the dedicated{' '}
          <Link to="/learn/crypto-registry" className="text-primary hover:underline">
            CycloneDX Cryptography Registry
          </Link>{' '}
          module.
        </p>
      </Section>

      <Section id="cbom-verify" icon={ShieldCheck} title="Make it machine-verifiable & protect it">
        <p>
          <Badge kind="std" />
          <strong>Machine-verifiable</strong> in practice = policy-as-code. CBOMkit runs an OPA/Rego
          check classifying each asset quantum-safe / quantum-vulnerable / na / unknown, queryable
          over a REST API. Normalized names (above) are what make the rules match reliably.
        </p>
        <p>
          <Badge kind="view" />
          <strong>Secure the CBOM.</strong> The CBOM plus the risk backlog is a map of your weakest
          cryptography — an attacker&apos;s shopping list. Protect it with access control and
          integrity, the way you would any sensitive asset inventory.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop?.(2)}
            className="border-primary text-primary hover:bg-primary/10"
          >
            Run the policy-as-code check →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop?.(3)}
            className="border-primary text-primary hover:bg-primary/10"
          >
            Correlate a key across systems →
          </Button>
        </div>
      </Section>
    </div>
  )
}
