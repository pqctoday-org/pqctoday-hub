// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { BookOpen, FileText, Search, Fingerprint, Languages, ShieldCheck } from 'lucide-react'
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
  { id: 'cbom-context', label: 'Key identity' },
  { id: 'cbom-codify', label: 'Codification' },
  { id: 'cbom-verify', label: 'Verify' },
]

export const CbomIntroduction: FC<Props> = ({ onNavigateToWorkshop }) => (
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
        CBOM, and risk scoring (Phase 3) consumes it. A bare list of algorithms isn&apos;t enough —
        the value is a CBOM you can query and rank.
      </p>
      <p>
        <Badge kind="view" />
        Start with a <strong>Minimum Viable CBOM</strong>: capture the fields you need to prioritise
        (algorithm, where it&apos;s used, what it protects, owner), not a perfect catalogue.
        Regulators now expect one — the EU PQC Roadmap (23 Jun 2025) requires cryptographic
        inventories by end of 2026.
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
        <strong>SPDX 3.0.1 has no dedicated cryptography object model yet</strong>, so CycloneDX is
        the practical choice today. CycloneDX 1.7 adds a <strong>Cryptography Registry</strong>{' '}
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
        embedded/OT crypto, default library crypto. A CBOM built only from <em>known</em> systems is
        falsely reassuring. <strong>You can&apos;t migrate what you can&apos;t find.</strong>
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
        No single method finds it all — layer five: <strong>source code</strong> (sonar-cryptography
        / CBOMkit, IBM Quantum Safe Explorer), <strong>binary / container</strong> (CBOMkit-theia),{' '}
        <strong>network / traffic</strong> (passive handshake capture + active scanning),{' '}
        <strong>infrastructure / runtime</strong> (HSM/KMS, CLM, CT logs), and{' '}
        <strong>cloud</strong> (KMS/cert APIs + CSPM — no host to scan, provider-managed crypto,
        shared responsibility). Coverage = the union.
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
      id="cbom-context"
      icon={Fingerprint}
      title="Key identity, provenance & where it's managed"
    >
      <p>
        <Badge kind="view" />
        Discovery finds <em>artifacts</em>; risk needs <em>context</em>. Attach to each key what it
        protects (+ confidentiality horizon = the HNDL input), its purpose (Track A vs B), location,
        owner, vendor-dependency, and active-vs-dormant. That enrichment turns an inventory into a
        risk-rankable backlog.
      </p>
      <p>
        <Badge kind="std" />
        <strong>Two kinds of identifier.</strong> <em>Assigned</em> ids are local and don&apos;t
        correlate (PKCS#11 <code>CKA_ID</code>, KMIP Unique Identifier, KMS key-id, JWK{' '}
        <code>kid</code>). <em>Content-derived</em> ids do: the X.509 SKI / SPKI hash, KMIP Digest,
        JWK Thumbprint (RFC 7638), KCV for symmetric keys. Correlate &ldquo;same key across HSM /
        cert / code / wire&rdquo; on the <strong>SPKI fingerprint</strong>.
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
        certificate, <code>ES256</code> to a JWT, and <code>0x0403</code> to TLS 1.3 — and the curve
        alone is P-256 = secp256r1 = prime256v1. Six codification layers (spec, OID, protocol code
        point, key-mgmt enum, library string, CBOM) with no shared key.
      </p>
      <p>
        <Badge kind="std" />
        <strong>PQC makes it worse.</strong> Each parameter set is its own algorithm: ML-DSA chose{' '}
        <em>one OID per parameter set, parameters absent</em> (<code>id-ml-dsa-44/65/87</code>, RFC
        9881), so OIDs proliferate. Hybrid KEMs (X25519MLKEM768) and composite signatures each get
        their own identifier — combination × nomenclature.
      </p>
      <p>
        <Badge kind="std" />
        The answer is to map every source onto a canonical model (the CycloneDX Cryptography
        Registry) while <strong>never over-collapsing</strong> security-relevant parameters (mode,
        padding, curve, hash). The PKIC CBOM-Profiles WG is the neutral venue maintaining this as
        registries keep moving.
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
