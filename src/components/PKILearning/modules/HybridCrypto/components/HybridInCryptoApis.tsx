// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Hybrid in Crypto APIs": how applications build hybrids today from separate
 * classical and PQC calls, the limits of that (above all with an HSM), and
 * which libraries and APIs now offer hybrid as one algorithm or mechanism.
 * Every statement comes from the library document it links to.
 */
import React from 'react'
import { Link } from 'react-router'
import { Code2, ShieldAlert, Boxes, Table2 } from 'lucide-react'

interface Src {
  label: string
  refId: string
}

const lib = (refId: string) => `/library?ref=${encodeURIComponent(refId)}`

const Sources: React.FC<{ sources: Src[] }> = ({ sources }) => (
  <span className="text-[10px] text-muted-foreground">
    {sources.map((s, i) => (
      <React.Fragment key={s.refId}>
        {i > 0 && ' · '}
        <Link to={lib(s.refId)} className="text-primary hover:underline">
          {s.label}
        </Link>
      </React.Fragment>
    ))}
  </span>
)

interface Limit {
  title: string
  body: string
  sources: Src[]
}

const LIMITS: Limit[] = [
  {
    title: 'The application owns the combiner, and can get it wrong',
    body: 'Order, label, KDF and what gets bound are all the caller’s choice. A naive "concatenation only" key is not secure against active adversaries, and different protocols use different combiners, so two applications built on the same primitives can disagree. Microsoft gives this as the reason for native composites: they "abstract away the complexity of securely combining multiple algorithms, reducing the risk of incorrect integrations".',
    sources: [
      { label: 'ETSI TR 103 966', refId: 'ETSI-TR-103-966' },
      { label: 'Microsoft, 2026', refId: 'Microsoft-Windows-PQ-Composite-Features-2026' },
    ],
  },
  {
    title: 'Secrets leave the HSM unless every template is right',
    body: 'In PKCS#11 v3.2, C_EncapsulateKey and C_DecapsulateKey create a secret-key object whose CKA_EXTRACTABLE defaults to true unless the template says otherwise, and whose CKA_ALWAYS_SENSITIVE and CKA_NEVER_EXTRACTABLE are set to false. Combining the two secrets in application memory means reading them out of the token, and anything that can read that memory can rebuild the session key. Combining inside the token is possible, but only as a chain the application drives.',
    sources: [{ label: 'PKCS#11 v3.2', refId: 'PKCS11-V32-OS-OASIS' }],
  },
  {
    title: 'The token does not know it is computing a hybrid',
    body: 'A v3.2 token can concatenate two secret keys (CKM_CONCATENATE_BASE_AND_KEY), append public data (CKM_CONCATENATE_BASE_AND_DATA) and hash the result (CKM_SHA3_256_KEY_DERIVATION, or CKM_HKDF_DERIVE). Each step is a separate C_DeriveKey with its own template, and the token checks none of the order, label or hash choice. For FIPS 140-3, a hybrid KEM is an approved service only when the module itself enforces a fixed set of hybrid schemes and the order of the secrets (IG D.S Scenario 2).',
    sources: [
      { label: 'PKCS#11 v3.2', refId: 'PKCS11-V32-OS-OASIS' },
      { label: 'FIPS 140-3 IG', refId: 'NIST-FIPS140-3-IG-PQC' },
    ],
  },
  {
    title: 'Two signature keys that nothing ties together',
    body: 'C_SignInit takes one key handle, so an application-composed hybrid signature is two C_Sign calls on two key objects. PKCS#11 v3.2 has no mechanism that binds the keys or requires both signatures; the verifier’s policy must insist on both, or one signature can be stripped. The two keys also need their own lifecycle, attributes and backup, kept in step by the application.',
    sources: [
      { label: 'PKCS#11 v3.2', refId: 'PKCS11-V32-OS-OASIS' },
      { label: 'ETSI TR 103 966', refId: 'ETSI-TR-103-966' },
    ],
  },
]

interface MatrixRow {
  name: string
  pure: string
  tls: string
  kemApi: string
  sigApi: string
  sources: Src[]
}

const NOT_OFFERED = 'Not offered'

const MATRIX: MatrixRow[] = [
  {
    name: 'PKCS#11 v3.2 (OASIS Standard)',
    pure: 'ML-KEM, ML-DSA mechanisms',
    tls: 'n/a',
    kemApi: 'Not offered: composed from separate mechanisms',
    sigApi: NOT_OFFERED,
    sources: [{ label: 'v3.2', refId: 'PKCS11-V32-OS-OASIS' }],
  },
  {
    name: 'PKCS#11 v3.3 (working draft)',
    pure: 'As v3.2',
    tls: 'n/a',
    kemApi: 'CKM_COMP_KEM (12 parameter sets; draft)',
    sigApi: 'CKM_COMP_SIG, CKM_COMP_SIG_EXTERNAL_HASH (18 sets; draft)',
    sources: [
      { label: 'TC header', refId: 'OASIS-PKCS11-TC-v33-Working-Header' },
      { label: 'KEM text', refId: 'OASIS-PKCS11-TC-v33-Composite-KEM-Draft' },
      { label: 'sig text', refId: 'OASIS-PKCS11-TC-v33-Composite-Sig-Draft' },
    ],
  },
  {
    name: 'Java JDK 27 (and 25.0.5)',
    pure: 'ML-KEM, ML-DSA since JDK 24',
    tls: 'X25519MLKEM768 default; SecP256r1MLKEM768, SecP384r1MLKEM1024 opt-in',
    kemApi: 'Not offered: hybrid only inside TLS, by design',
    sigApi: NOT_OFFERED,
    sources: [
      { label: 'JEP 527', refId: 'OpenJDK-JEP-527-PQ-Hybrid-TLS13' },
      { label: 'JDK 25.0.5', refId: 'Oracle-JDK-25-0-5-Release-Notes' },
      { label: 'JEP 496', refId: 'OpenJDK-JEP-496-ML-KEM' },
      { label: 'JEP 497', refId: 'OpenJDK-JEP-497-ML-DSA' },
    ],
  },
  {
    name: 'Bouncy Castle Java 1.86',
    pure: 'ML-KEM, ML-DSA, SLH-DSA and more',
    tls: 'All three groups in the BCJSSE default list',
    kemApi: 'Composite ML-KEM (experimental); X-Wing in the lightweight API',
    sigApi: 'Composite ML-DSA (18 combinations)',
    sources: [
      { label: 'release notes', refId: 'BouncyCastle-Java-Release-Notes' },
      { label: '1.86', refId: 'BouncyCastle-Java-1-86-Release' },
      { label: 'specifications', refId: 'BouncyCastle-Java-Specifications' },
    ],
  },
  {
    name: 'Windows CNG and SChannel (Windows 11 24H2/25H2, Server 2025)',
    pure: 'ML-KEM, ML-DSA (GA November 2025)',
    tls: 'All three groups, not enabled by default',
    kemApi: 'Composite-ML-KEM (GA July 2026)',
    sigApi: 'Composite-ML-DSA, four ECDSA sets (GA July 2026)',
    sources: [
      { label: 'PQC APIs GA', refId: 'Microsoft-PQC-APIs-GA-2025' },
      { label: 'composites', refId: 'Microsoft-Windows-PQ-Composite-Features-2026' },
      { label: 'TLS FAQ', refId: 'Microsoft-Windows-TLS13-PQC-FAQ-2026' },
      { label: 'CNG identifiers', refId: 'Microsoft-CNG-Algorithm-Identifiers' },
    ],
  },
  {
    name: '.NET 10 / .NET 11',
    pure: 'MLKem, MLDsa (.NET 10)',
    tls: 'From the operating system',
    kemApi: 'CompositeMLKem (.NET 11, experimental)',
    sigApi: 'CompositeMLDsa (experimental; native CNG on Windows in .NET 11)',
    sources: [
      { label: '.NET PQC', refId: 'Microsoft-DotNet-PQC-2025' },
      { label: '.NET 11', refId: 'Microsoft-DotNet-11-Libraries' },
      { label: 'native composite', refId: 'Microsoft-DotNet-11-CompositeMLDsa-Windows-Native' },
    ],
  },
  {
    name: 'Microsoft SymCrypt',
    pure: 'ML-KEM, ML-DSA',
    tls: 'n/a',
    kemApi: 'Composite ML-KEM (v103.11.0)',
    sigApi: 'Composite ML-DSA (v103.12.0)',
    sources: [{ label: 'changelog', refId: 'Microsoft-SymCrypt-Changelog' }],
  },
  {
    name: 'OpenSSL 3.5 LTS to 4.1',
    pure: 'ML-KEM, ML-DSA, SLH-DSA',
    tls: 'X25519MLKEM768 default; 4.x also defaults SecP256r1MLKEM768; SecP384r1MLKEM1024 available',
    kemApi: NOT_OFFERED,
    sigApi: NOT_OFFERED,
    sources: [
      { label: '4.1.0', refId: 'OpenSSL-4-1-0-Release' },
      { label: '3.5 groups', refId: 'OpenSSL-SSL-CTX-set1-curves-3-5' },
      { label: '3.6', refId: 'OpenSSL-3-6-Release-Notes' },
    ],
  },
  {
    name: 'BoringSSL',
    pure: 'ML-KEM, ML-DSA, SLH-DSA',
    tls: 'X25519MLKEM768 default',
    kemApi: 'X-Wing (xwing.h, and as an HPKE KEM)',
    sigApi: NOT_OFFERED,
    sources: [{ label: 'xwing.h', refId: 'BoringSSL-xwing-h' }],
  },
  {
    name: 'AWS-LC 5.12',
    pure: 'ML-KEM, ML-DSA',
    tls: 'All three groups, in the default list',
    kemApi: NOT_OFFERED,
    sigApi: NOT_OFFERED,
    sources: [{ label: 'v5.12.0', refId: 'AWS-LC-v5-12-0-Release' }],
  },
  {
    name: 'Go 1.24 to 1.27',
    pure: 'crypto/mlkem (1.24), crypto/mldsa (1.27)',
    tls: 'X25519MLKEM768 default since 1.24; all three since 1.26',
    kemApi: 'crypto/hpke: MLKEM768X25519 (X-Wing), MLKEM768P256, MLKEM1024P384 (1.26)',
    sigApi: NOT_OFFERED,
    sources: [
      { label: '1.24', refId: 'Go-1-24-Release-Notes' },
      { label: '1.26', refId: 'Go-1-26-Release-Notes' },
      { label: '1.27', refId: 'Go-1-27-Release-Notes' },
      { label: 'crypto/hpke', refId: 'Go-crypto-hpke' },
    ],
  },
  {
    name: 'rustls 0.23 (aws-lc-rs provider)',
    pure: 'ML-KEM groups; ML-DSA certificates',
    tls: 'X25519MLKEM768 preferred by default; SecP256r1MLKEM768 opt-in',
    kemApi: NOT_OFFERED,
    sigApi: NOT_OFFERED,
    sources: [
      { label: '0.23.46', refId: 'rustls-0-23-46-Release' },
      { label: '0.23.27', refId: 'rustls-0-23-27-Release' },
    ],
  },
  {
    name: 'Mozilla NSS / Firefox',
    pure: 'ML-KEM, ML-DSA',
    tls: 'X25519 + ML-KEM-768 on by default in Firefox since 132; NIST-curve hybrids in NSS 3.118',
    kemApi: NOT_OFFERED,
    sigApi: NOT_OFFERED,
    sources: [
      { label: 'NSS 3.132', refId: 'NSS-3-132-Release-Notes' },
      { label: 'NSS 3.118', refId: 'NSS-3-118-Release-Notes' },
      { label: 'Firefox 132', refId: 'Firefox-132-Release-Notes' },
    ],
  },
  {
    name: 'wolfSSL 5.9.4',
    pure: 'ML-KEM, ML-DSA',
    tls: 'All three groups; X25519MLKEM768 is the default key share',
    kemApi: NOT_OFFERED,
    sigApi: NOT_OFFERED,
    sources: [{ label: '5.9.4', refId: 'wolfSSL-5-9-4-Release' }],
  },
  {
    name: 'liboqs 0.16 / oqs-provider 0.12',
    pure: 'ML-KEM, ML-DSA, SLH-DSA and more',
    tls: 'Hybrid groups offered; on OpenSSL 3.5+ OpenSSL’s own are used',
    kemApi: NOT_OFFERED,
    sigApi: 'Not offered: the experimental composite integration was removed',
    sources: [
      { label: 'liboqs 0.16.0', refId: 'liboqs-0-16-0-Release' },
      { label: 'oqs-provider 0.12.0', refId: 'oqs-provider-0-12-0-Release' },
    ],
  },
]

export const HybridInCryptoApis: React.FC = () => (
  <section data-section-id="crypto-apis" className="glass-panel p-6 scroll-mt-20">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Code2 size={24} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold text-gradient">Hybrid in Crypto APIs and HSMs</h2>
    </div>
    <div className="space-y-4 text-sm text-foreground/80">
      <p>
        An application gets a hybrid in one of two ways. It can <strong>compose</strong> it: call a
        classical API and a pure-PQC API separately, then combine the results itself. Or the library
        or token offers the hybrid as <strong>one algorithm</strong>: a TLS named group, a composite
        KEM such as X-Wing or composite ML-KEM, or a composite signature. Today most libraries offer
        hybrid key exchange only inside TLS, so any hybrid outside TLS is usually composed by the
        application.
      </p>

      <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Code2 size={16} className="text-primary" />
          How applications compose a hybrid today
        </h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>
            <strong className="text-foreground">Key establishment in Java:</strong> an X25519
            KeyAgreement, an ML-KEM KEM and the KDF API&apos;s HKDF, fed both secrets in an order
            the application fixes. JEP 527 notes the platform &ldquo;already contains the building
            blocks&rdquo;, but adds hybrid itself only for TLS 1.3; Bouncy Castle&apos;s guidance is
            that &ldquo;the order is part of the protocol and must be fixed by both parties in
            advance&rdquo;.{' '}
            <Sources
              sources={[
                { label: 'JEP 527', refId: 'OpenJDK-JEP-527-PQ-Hybrid-TLS13' },
                { label: 'JEP 510', refId: 'OpenJDK-JEP-510-KDF-API' },
                { label: 'BC specifications', refId: 'BouncyCastle-Java-Specifications' },
              ]}
            />
          </li>
          <li>
            <strong className="text-foreground">Key establishment on an HSM (PKCS#11 v3.2):</strong>{' '}
            CKM_ECDH1_DERIVE for the classical secret, C_EncapsulateKey / C_DecapsulateKey with
            CKM_ML_KEM for the post-quantum one, then the application either reads both out and
            combines them, or chains CKM_CONCATENATE_BASE_AND_KEY, CKM_CONCATENATE_BASE_AND_DATA and
            CKM_SHA3_256_KEY_DERIVATION inside the token, as this module&apos;s HPKE step does.{' '}
            <Sources sources={[{ label: 'PKCS#11 v3.2', refId: 'PKCS11-V32-OS-OASIS' }]} />
          </li>
          <li>
            <strong className="text-foreground">Signatures:</strong> two separate signatures, one
            classical and one ML-DSA, each with its own key, and a verification policy in the
            application that requires both. Microsoft&apos;s 2025 guidance still recommended this
            kind of combination with existing algorithms before its composites shipped.{' '}
            <Sources
              sources={[
                { label: 'Microsoft, 2025', refId: 'Microsoft-PQC-Windows-Insiders-Linux-2025' },
              ]}
            />
          </li>
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShieldAlert size={16} className="text-primary" />
          Limits of composing it yourself, especially with an HSM
        </h3>
        <ul className="space-y-3">
          {LIMITS.map((l) => (
            <li key={l.title} className="text-xs">
              <div className="font-bold text-foreground">{l.title}</div>
              <p className="text-muted-foreground mt-0.5">{l.body}</p>
              <Sources sources={l.sources} />
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Boxes size={16} className="text-primary" />
          What a single hybrid mechanism changes: PKCS#11 v3.3
        </h3>
        <p className="text-xs text-muted-foreground">
          The PKCS#11 v3.3 working draft adds key types CKK_COMP_KEM and CKK_COMP_SIG and five
          mechanisms: CKM_COMP_KEM_KEY_PAIR_GEN and CKM_COMP_KEM (run through C_EncapsulateKey /
          C_DecapsulateKey, returning the combined secret as a key handle), and
          CKM_COMP_SIG_KEY_PAIR_GEN, CKM_COMP_SIG and CKM_COMP_SIG_EXTERNAL_HASH (one C_Sign call
          for one composite signature from one key object holding both halves). The combiner then
          runs inside the token, as the composite ML-KEM and ML-DSA drafts define it. The OASIS PKCS
          11 TC approved these identifiers in October 2026; no v3.3 specification has been
          published, and an X-Wing or HPKE mechanism is still an open discussion.{' '}
          <Sources
            sources={[
              { label: 'TC header', refId: 'OASIS-PKCS11-TC-v33-Working-Header' },
              { label: 'composite KEM text', refId: 'OASIS-PKCS11-TC-v33-Composite-KEM-Draft' },
              {
                label: 'composite signature text',
                refId: 'OASIS-PKCS11-TC-v33-Composite-Sig-Draft',
              },
            ]}
          />
        </p>
        <p className="text-xs text-muted-foreground">
          Try both mechanisms in the Hub&apos;s PKCS#11 engine:{' '}
          <Link
            to="/playground/hsm?tab=learn&ltrack=v33&lesson=v33-composite-mlkem"
            className="text-primary underline"
          >
            composite ML-KEM
          </Link>{' '}
          and{' '}
          <Link
            to="/playground/hsm?tab=learn&ltrack=v33&lesson=v33-composite-mldsa"
            className="text-primary underline"
          >
            composite ML-DSA
          </Link>{' '}
          in the PKCS#11 workshop&apos;s v3.3 tab. A single mechanism is not automatically an
          approved FIPS 140-3 service: the published guidance has no section on composite signatures
          (see Implementation &amp; Validation).
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Table2 size={16} className="text-primary" />
          Which libraries and APIs offer what (1 November 2026)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="crypto-api-matrix">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-bold text-foreground py-1.5 pr-3">Library / API</th>
                <th className="text-left font-bold text-foreground py-1.5 pr-3">Pure PQC</th>
                <th className="text-left font-bold text-foreground py-1.5 pr-3">
                  Hybrid TLS 1.3 groups
                </th>
                <th className="text-left font-bold text-foreground py-1.5 pr-3">
                  Hybrid KEM as one algorithm
                </th>
                <th className="text-left font-bold text-foreground py-1.5 pr-3">
                  Composite signature as one algorithm
                </th>
                <th className="text-left font-bold text-foreground py-1.5">Sources</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {MATRIX.map((r) => (
                <tr key={r.name} className="border-b border-border/50 align-top">
                  <td className="py-1.5 pr-3 font-semibold text-foreground">{r.name}</td>
                  <td className="py-1.5 pr-3">{r.pure}</td>
                  <td className="py-1.5 pr-3">{r.tls}</td>
                  <td className="py-1.5 pr-3">{r.kemApi}</td>
                  <td className="py-1.5 pr-3">{r.sigApi}</td>
                  <td className="py-1.5">
                    <Sources sources={r.sources} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          &ldquo;Not offered&rdquo; means the project&apos;s release notes and documentation list no
          such algorithm as of 1 November 2026. The TLS groups are those of RFC 10024:
          X25519MLKEM768, SecP256r1MLKEM768 and SecP384r1MLKEM1024. The Migrate catalog shows the
          same information per product.
        </p>
      </div>
    </div>
  </section>
)
