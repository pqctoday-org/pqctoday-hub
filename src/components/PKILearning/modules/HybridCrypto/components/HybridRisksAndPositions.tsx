// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Hybrid or pure PQC" — the risks on each side, then who recommends what.
 * Every statement is taken from the library document it links to.
 */
import React from 'react'
import { Link } from 'react-router'
import { ShieldAlert, Landmark, Lock, Fingerprint, Layers, FlaskConical } from 'lucide-react'

interface SourceRef {
  label: string
  refId: string
}

interface RiskItem {
  title: string
  body: string
  sources: SourceRef[]
}

interface PositionRow {
  org: string
  position: string
  pureAlone: string
  sources: SourceRef[]
}

interface PositionGroup {
  heading: string
  rows: PositionRow[]
}

const SourceLinks: React.FC<{ sources: SourceRef[] }> = ({ sources }) => (
  <span className="text-[10px] text-muted-foreground">
    {sources.map((s, i) => (
      <React.Fragment key={s.refId}>
        {i > 0 && ' · '}
        <Link
          to={`/library?ref=${encodeURIComponent(s.refId)}`}
          className="text-primary hover:underline"
        >
          {s.label}
        </Link>
      </React.Fragment>
    ))}
  </span>
)

const RiskList: React.FC<{ items: RiskItem[] }> = ({ items }) => (
  <ul className="space-y-3">
    {items.map((item) => (
      <li key={item.title} className="text-xs">
        <div className="font-bold text-foreground">{item.title}</div>
        <p className="text-muted-foreground mt-0.5">{item.body}</p>
        <SourceLinks sources={item.sources} />
      </li>
    ))}
  </ul>
)

const PURE_PQC_RISKS: RiskItem[] = [
  {
    title: 'Cryptanalysis of young schemes',
    body: 'SIKE and Rainbow, both NIST competition candidates, were broken with classical computers. In 2026 the BSI advised against Classic McEliece in new developments after new structural cryptanalysis, and noted that because it had only recommended hybrid use, a hybrid with Classic McEliece still keeps at least the security of the classical scheme.',
    sources: [
      {
        label: 'NÚKIB annex',
        refId: 'https-nukib-gov-cz-download-publications-en-Annex-20to-20the',
      },
      {
        label: 'BSI Classic McEliece notice',
        refId: 'BSI-Hinweise-zu-aktuellen-Entwicklungen-um-Classic-McEliece',
      },
    ],
  },
  {
    title: 'Bugs in new implementations',
    body: 'Bernstein (2026) shows that a small change in ML-DSA software creates a flaw that interoperates with authentic ML-DSA, passes typical tests and is exploitable in 1 second on 1 laptop core. He estimates that far fewer Ed25519+ML-DSA keys than ML-DSA-only keys will be breakable, for years after the first quantum attack. The NCSC names implementation security as one reason to consider hybrid.',
    sources: [
      { label: 'Bernstein 2026', refId: 'Bernstein-MLDSA-Bugs-2026' },
      { label: 'NCSC white paper', refId: 'UK-NCSC-PQC-Whitepaper-2024' },
    ],
  },
]

const KEM_RISKS: RiskItem[] = [
  {
    title: 'An unsound combiner',
    body: 'Naïve constructions can be less secure than their components: a "concatenation only" hybrid session key is not secure against active adversaries, whatever the strength of each part. SP 800-227 approves specific key combiners (see Hybrid KEMs below).',
    sources: [
      { label: 'ETSI TR 103 966', refId: 'ETSI-TR-103-966' },
      { label: 'NIST SP 800-227', refId: 'NIST SP 800-227' },
    ],
  },
  {
    title: 'Fallback to classical-only',
    body: 'Hybrids deployed for backwards compatibility can be open to downgrade attacks. If a client retries with a classical-only group after a hybrid attempt fails, an attacker who can make the post-quantum attempts fail obtains a classical-only session, even between two endpoints that both support hybrid (see TLS Basics).',
    sources: [{ label: 'ETSI TR 103 966', refId: 'ETSI-TR-103-966' }],
  },
  {
    title: 'Larger messages and denial of service',
    body: 'The X25519MLKEM768 key share is 1,216 bytes instead of 32. In IKEv2, additional key exchanges before authentication increase the risk of denial-of-service attacks, because post-quantum KEMs can cost more than traditional key exchanges.',
    sources: [{ label: 'ETSI TR 103 966', refId: 'ETSI-TR-103-966' }],
  },
  {
    title: 'Protocol fit and validation',
    body: "HPKE's authenticated modes cannot be built on ML-KEM or on a hybrid that includes it. A FIPS 140-3 module may offer a hybrid KEM as an approved service only when it meets the five IG D.S conditions; the IG says X-Wing cannot yet meet them.",
    sources: [
      { label: 'ETSI TR 103 966', refId: 'ETSI-TR-103-966' },
      { label: 'FIPS 140-3 IG', refId: 'NIST-FIPS140-3-IG-PQC' },
    ],
  },
]

const SIGNATURE_RISKS: RiskItem[] = [
  {
    title: 'Stripping one signature',
    body: 'If a verifier accepts the hybrid when either component is valid, an attacker can remove the post-quantum signature and present the classical one. ETSI notes that such a backwards-compatible hybrid can be less secure than the post-quantum algorithm used alone. Requiring both signatures, or a non-separable construction (RFC 9955), closes this. The same applies one level up: a TLS server that keeps classical certificates for legacy clients can face a rollback in which an attacker strips the PQC or composite certificate; an individual draft proposes that clients remember the server’s PQC support.',
    sources: [
      { label: 'ETSI TR 103 966', refId: 'ETSI-TR-103-966' },
      { label: 'RFC 9955', refId: 'RFC-9955-Hybrid-Signature-Spectrums' },
      { label: 'draft-sheffer-tls-pqc-continuity', refId: 'draft-sheffer-tls-pqc-continuity' },
    ],
  },
  {
    title: 'More complex and less studied',
    body: 'The NCSC notes that hybrid authentication can be significantly more complex than hybrid confidentiality, because both signatures must verify robustly, and that it has received significantly less research.',
    sources: [{ label: 'NCSC white paper', refId: 'UK-NCSC-PQC-Whitepaper-2024' }],
  },
  {
    title: 'The PKI has to carry both',
    body: 'Hybrid authentication needs a PKI that issues both signature types, or two parallel PKIs. The NCSC prefers a single migration to a fully post-quantum PKI over an intermediate hybrid PKI. The NSA tells national security systems to stand up a parallel PKI and not to use novel mechanisms that carry several algorithms in one certificate.',
    sources: [
      { label: 'NCSC white paper', refId: 'UK-NCSC-PQC-Whitepaper-2024' },
      { label: 'NSA CNSA 2.0 FAQ', refId: 'NSA CNSA 2.0 FAQ' },
    ],
  },
  {
    title: 'Formats, size and approval',
    body: 'No hybrid certificate format is universally accepted yet: composite certificates are not backward compatible, and GSMA PQ.03 considers it premature to recommend hybrid certificates. A composite ML-DSA-65 + ECDSA P-256 signature is about 3.4 KB, of which 64 bytes are the ECDSA part. The FIPS 140-3 IG has no section on composite signatures.',
    sources: [
      { label: 'GSMA PQ.03', refId: 'GSMA PQ.03 PQC Guidelines' },
      { label: 'FIPS 140-3 IG', refId: 'NIST-FIPS140-3-IG-PQC' },
    ],
  },
]

const COMMON_RISKS: RiskItem[] = [
  {
    title: 'Complexity and attack surface',
    body: 'Hybrids add negotiation, error handling, API changes and testing. The NSA notes that more security products fail through implementation or configuration errors than through their algorithms, so added complexity can weaken security; the Dutch handbook notes that hybridisation may increase the attack surface.',
    sources: [
      { label: 'NSA CNSA 2.0 FAQ', refId: 'NSA CNSA 2.0 FAQ' },
      { label: 'Dutch PQC Migration Handbook', refId: 'NL-PQC-Migration-Handbook-2024' },
    ],
  },
  {
    title: 'Interoperability and a second transition',
    body: 'Every party must support all component algorithms and the same combination method. Removing the classical part later is a second transition; the NCSC asks that hybrid protocols allow a migration to a PQC-only future.',
    sources: [
      { label: 'NSA CNSA 2.0 FAQ', refId: 'NSA CNSA 2.0 FAQ' },
      { label: 'NCSC white paper', refId: 'UK-NCSC-PQC-Whitepaper-2024' },
    ],
  },
  {
    title: 'Proofs and labels',
    body: 'For some formal security properties, hybrids may be no stronger, or even weaker, than their components; the NSA calls this a matter of significant debate. A product marketed as hybrid or composite is not necessarily quantum resistant.',
    sources: [{ label: 'NSA CNSA 2.0 FAQ', refId: 'NSA CNSA 2.0 FAQ' }],
  },
  {
    title: 'Overhead',
    body: 'Two algorithms run for each operation. When the hybrid is used once to set up a symmetric key for a connection, the Dutch handbook judges the added cost low compared with the whole connection.',
    sources: [{ label: 'Dutch PQC Migration Handbook', refId: 'NL-PQC-Migration-Handbook-2024' }],
  },
]

const POSITION_GROUPS: PositionGroup[] = [
  {
    heading: 'National agencies',
    rows: [
      {
        org: 'France — ANSSI',
        position:
          'Insists strongly on hybrid wherever PQC is deployed, in the short and medium term. Mandatory inside the French regulated perimeter.',
        pureAlone:
          'Only for hash-based signatures (SLH-DSA, XMSS, LMS). May be revisited once the community has more hindsight.',
        sources: [{ label: 'ANSSI PQC FAQ', refId: 'ANSSI-PQC-FAQ-2025' }],
      },
      {
        org: 'Germany — BSI',
        position:
          'TR-02102-1 currently recommends quantum-safe methods only in hybrid use with classical methods. Classical-only key agreement is recommended until the end of 2031.',
        pureAlone: 'Not in the current version of the guideline.',
        sources: [{ label: 'BSI TR-02102-1', refId: 'BSI TR-02102-1' }],
      },
      {
        org: 'Netherlands — AIVD, CWI, TNO',
        position:
          'Recommends hybrid particularly for organisations that must deploy before mature implementations exist, for example when data is exposed to store-now-decrypt-later. Notes the overhead and the added attack surface.',
        pureAlone: 'Not stated as a recommendation.',
        sources: [{ label: 'PQC Migration Handbook', refId: 'NL-PQC-Migration-Handbook-2024' }],
      },
      {
        org: 'Czech Republic — NÚKIB',
        position:
          'Accepts both approaches for sensitive information in the near term: hybrid combinations, or standalone ML-KEM and ML-DSA at security level 5.',
        pureAlone:
          'Yes, at security level 5. Recommends standalone LMS and XMSS for firmware and software updates.',
        sources: [
          {
            label: 'NÚKIB annex',
            refId: 'https-nukib-gov-cz-download-publications-en-Annex-20to-20the',
          },
        ],
      },
      {
        org: 'United Kingdom — NCSC',
        position:
          'Hybrid where it is needed: interoperability, implementation security, or constraints of a protocol or system. Notes higher cost and complexity.',
        pureAlone:
          'Yes. Prefers a single migration to a post-quantum PKI over an intermediate hybrid PKI.',
        sources: [{ label: 'NCSC white paper', refId: 'UK-NCSC-PQC-Whitepaper-2024' }],
      },
      {
        org: 'United States — NSA (national security systems)',
        position:
          'Will not require hybrid for security purposes. Only hybrid solutions the NSA identifies count as CNSA 2.0 compliant, for example its IKEv2 profile, where message-size limits leave no straightforward standalone ML-KEM-1024 design.',
        pureAlone:
          'Yes: CNSA 2.0 algorithms on their own. A parallel PKI rather than several algorithms in one certificate.',
        sources: [{ label: 'NSA CNSA 2.0 FAQ', refId: 'NSA CNSA 2.0 FAQ' }],
      },
      {
        org: 'United States — NIST',
        position:
          'SP 800-227: combining key-establishment schemes can be advantageous, for example during the migration, and it approves key combiners. It does not say how or when to migrate. FIPS 140-3 IG D.S lets a validated module offer a hybrid KEM under set conditions.',
        pureAlone: 'Yes: ML-KEM and ML-DSA are approved on their own.',
        sources: [
          { label: 'NIST SP 800-227', refId: 'NIST SP 800-227' },
          { label: 'FIPS 140-3 IG', refId: 'NIST-FIPS140-3-IG-PQC' },
        ],
      },
      {
        org: 'Canada — Cyber Centre',
        position:
          'ITSP.40.111 recommends ML-KEM and ML-DSA for general use, and says classical key establishment and signatures used without a post-quantum scheme should be phased out by the end of 2035. It does not discuss hybrid constructions.',
        pureAlone: 'Not stated either way.',
        sources: [{ label: 'ITSP.40.111', refId: 'CA-CCCS-ITSP-40-111' }],
      },
    ],
  },
  {
    heading: 'Certification and standards bodies',
    rows: [
      {
        org: 'EU — ECCG (EUCC certification)',
        position:
          'Agreed Cryptographic Mechanisms v2.0 recommends rolling out PQC in hybrid mode where confidentiality must hold for the long term, and agrees the CatKDF and CasKDF combiners. ENISA’s 2026 report on hybridization surveys standards and is explicitly not a recommendation.',
        pureAlone:
          'The v3 draft (not yet applicable) says lattice-based mechanisms should not be used standalone.',
        sources: [
          { label: 'ACM v2.0', refId: 'EUCC v2.0 ACM' },
          { label: 'ACM v3 draft', refId: 'ECCG-ACM-v3-Draft-2026' },
          { label: 'ENISA report', refId: 'ENISA-Hybridization-Standardisation-Status' },
        ],
      },
      {
        org: 'ETSI',
        position:
          'TS 103 744 specifies hybrid key exchanges; TR 103 966 describes the trade-offs of deploying them. Neither mandates hybrid.',
        pureAlone: 'Not addressed.',
        sources: [
          { label: 'ETSI TS 103 744', refId: 'ETSI TS 103 744' },
          { label: 'ETSI TR 103 966', refId: 'ETSI-TR-103-966' },
        ],
      },
      {
        org: 'IETF',
        position:
          'Standardizes both options: hybrid groups for TLS 1.3 (RFC 10024) and composite signatures (in the RFC Editor queue), and pure ML-KEM groups for TLS 1.3 (still a draft). It does not choose between them for deployers.',
        pureAlone: 'Specified alongside hybrid.',
        sources: [
          { label: 'RFC 10024', refId: 'RFC-10024' },
          { label: 'draft-ietf-tls-mlkem', refId: 'draft-ietf-tls-mlkem-07' },
        ],
      },
      {
        org: 'GSMA (telecom)',
        position:
          'PQ.03 finds it premature to recommend hybrid certificates while the community evaluates their feasibility and necessity.',
        pureAlone: 'Not addressed.',
        sources: [{ label: 'GSMA PQ.03', refId: 'GSMA PQ.03 PQC Guidelines' }],
      },
    ],
  },
  {
    heading: 'Industry practice and research',
    rows: [
      {
        org: 'Google Chrome, Cloudflare, AWS',
        position:
          'Deploy hybrid key exchange (X25519MLKEM768): on by default in Chrome since version 131, on most human traffic to Cloudflare, and on AWS KMS, ACM and Secrets Manager endpoints. Cloudflare targets 2029 for full post-quantum security, including authentication.',
        pureAlone: 'Not their default for key exchange.',
        sources: [
          { label: 'Google', refId: 'Google-Security-Blog-A-new-path-for-Kyber-on-the-web' },
          { label: 'Cloudflare', refId: 'Cloudflare-PQ-Internet-2025' },
          { label: 'Cloudflare roadmap', refId: 'Cloudflare-PostQuantum-Roadmap-2026' },
          {
            label: 'AWS',
            refId: 'AWS-Security-Blog-ML-KEM-Post-Quantum-TLS-in-KMS-ACM-Secrets',
          },
        ],
      },
      {
        org: 'Research (individual authors)',
        position:
          'Bernstein (2026) estimates fewer breakable Ed25519+ML-DSA keys than ML-DSA-only keys and disputes arguments that hybrid signatures add no security. An individual Internet-Draft concludes that hybrid key establishment is preferable to standalone ML-KEM until a quantum computer breaks most classical keys. Neither has IETF consensus.',
        pureAlone:
          'Debated. Bernstein surveys and contests published arguments for going straight to PQC.',
        sources: [
          { label: 'Bernstein 2026', refId: 'Bernstein-MLDSA-Bugs-2026' },
          {
            label: 'draft-usama-tls-risks-of-mlkem',
            refId: 'Analysis-of-Hybrid-Key-Establishment-and-Standalone-ML-KEM-i',
          },
        ],
      },
    ],
  },
]

export const HybridRisks: React.FC = () => (
  <section data-section-id="hybrid-risks" className="glass-panel p-6 scroll-mt-20">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <ShieldAlert size={24} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold text-gradient">Hybrid or Pure PQC: The Risks</h2>
    </div>
    <div className="space-y-4 text-sm text-foreground/80">
      <p>
        Both choices carry risk. Pure PQC relies on algorithms with a shorter record of
        cryptanalysis and on new implementations. Hybrid adds a second algorithm and the machinery
        to combine the two. Each item below names the document that states it.
      </p>
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <FlaskConical size={16} className="text-primary" />
          What pure PQC alone is exposed to
        </h3>
        <RiskList items={PURE_PQC_RISKS} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            Risks of hybrid KEMs
          </h3>
          <RiskList items={KEM_RISKS} />
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Fingerprint size={16} className="text-primary" />
            Risks of hybrid signatures
          </h3>
          <RiskList items={SIGNATURE_RISKS} />
        </div>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          Risks common to both
        </h3>
        <RiskList items={COMMON_RISKS} />
      </div>
    </div>
  </section>
)

export const HybridPositions: React.FC = () => (
  <section data-section-id="who-recommends" className="glass-panel p-6 scroll-mt-20">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Landmark size={24} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold text-gradient">Who Recommends Hybrid, and Who Does Not</h2>
    </div>
    <div className="space-y-4 text-sm text-foreground/80">
      <p>
        Authorities weigh the same risks differently. France, Germany, the Netherlands and the EU
        certification group ask for hybrid during the transition; the NSA, the UK NCSC and the Czech
        NÚKIB accept post-quantum algorithms on their own. A recommendation applies only within its
        own scope, such as a national regulated perimeter or national security systems.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-bold text-foreground py-1.5 pr-3">Organization</th>
              <th className="text-left font-bold text-foreground py-1.5 pr-3">
                Position on hybrid
              </th>
              <th className="text-left font-bold text-foreground py-1.5 pr-3">
                Pure PQC on its own
              </th>
              <th className="text-left font-bold text-foreground py-1.5">Source</th>
            </tr>
          </thead>
          {POSITION_GROUPS.map((group) => (
            <tbody key={group.heading} className="text-muted-foreground">
              <tr>
                <th
                  colSpan={4}
                  scope="colgroup"
                  className="text-left text-[10px] font-bold uppercase tracking-wider text-foreground pt-3 pb-1"
                >
                  {group.heading}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.org} className="border-b border-border/50 align-top">
                  <td className="py-1.5 pr-3 font-semibold text-foreground">{row.org}</td>
                  <td className="py-1.5 pr-3">{row.position}</td>
                  <td className="py-1.5 pr-3">{row.pureAlone}</td>
                  <td className="py-1.5">
                    <SourceLinks sources={row.sources} />
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  </section>
)
