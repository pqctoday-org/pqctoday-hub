// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const MIDDLEWARE_PROVIDERS_SECTION: SourcedSectionData = {
  id: 'middleware-providers',
  title: 'Cryptographic Middleware Interfaces and Provider Capabilities',
  lead: 'This section examines cryptographic middleware interfaces, key management protocols, and runtime provider APIs. These topics matter to application developers and platform engineers preparing software and infrastructure for post-quantum cryptography.',
  nice: [
    { id: 'K0841', statement: 'Knowledge of middleware software capabilities and applications' },
  ],
  blocks: [
    {
      heading: 'Token Interfaces, Providers, and Key Management',
      sentences: [
        {
          id: 'K0841-01',
          text: 'OASIS PKCS #11 Specification Version 3.2 specifies the Cryptoki application programming interface, which isolates an application from cryptographic device details so the application remains portable across different device types and environments.',
          sourceId: 'PKCS11-V32-OS-OASIS',
          edition: 'PKCS #11 Specification Version 3.2 (OASIS Standard), 2026-06',
          locator: 'Section 1 introduction',
        },
        {
          id: 'K0841-02',
          text: 'A PKCS #11 provider makes cryptographic functionality available to a consuming application via the PKCS #11 API, and a baseline provider offers the ability to provide information about the capabilities of its cryptographic services.',
          sourceId: 'PKCS-11-Cryptographic-Token-Interface-Profiles-Version-3-2-O',
          edition:
            'PKCS #11 Cryptographic Token Interface Profiles Version 3.2 (OASIS Standard), 2026-06',
          locator: 'Section 5.1 Baseline Provider, PDF p. 14',
        },
        {
          id: 'K0841-04',
          text: 'IETF RFC 7512 specifies a PKCS #11 URI scheme for identifying objects stored in PKCS #11 tokens as well as tokens, slots, and libraries, rather than creating new tokens or objects.',
          sourceId: 'RFC-7512-The-PKCS-11-URI-Scheme',
          edition: 'RFC 7512 — The PKCS #11 URI Scheme, 2015-04',
          locator: 'Abstract; Section 1',
        },
        {
          id: 'K0841-03',
          text: 'The KMIP specification defines a client-server protocol for certain management operations on managed objects (including symmetric and asymmetric cryptographic keys and digital certificates) stored by a key management system, including generating cryptographic keys and registering, obtaining, destroying, and searching for objects.',
          sourceId: 'Key-Management-Interoperability-Protocol-Specification-Versi',
          edition: 'Key Management Interoperability Protocol Specification Version 3.0, 2026-05',
          locator: 'Section 1 introduction',
        },
      ],
    },
    {
      heading: 'Post-Quantum Support in Runtime Providers and APIs',
      bridge:
        'The following claims look at post-quantum support in runtime providers and language APIs.',
      sentences: [
        {
          id: 'K0841-05',
          text: 'For OpenSSL (>=v3), oqs-provider implements a single shared library enabling TLS 1.3 KEM key establishment, OpenSSL (3.0) provider key management, and hybrid KEM schemes, plus EVP QSC signatures (with CMS/CMP), adding TLS 1.3 signatures and resolving final CMS glitches from OpenSSL 3.2.',
          sourceId: 'oqs-provider-OpenSSL-3-provider-containing-post-quantum-algo',
          edition: 'oqs-provider: OpenSSL 3 provider containing post-quantum algorithms',
          locator: 'README, purpose and status',
        },
        {
          id: 'K0841-06',
          text: 'The Key Encapsulation Mechanism API enables applications to use KEM algorithms, including candidate algorithms for the NIST post-quantum cryptography standardization process, and allows security providers to implement them in Java or native code.',
          sourceId: 'OpenJDK-JEP-452-KEM-API',
          edition: 'JEP 452: Key Encapsulation Mechanism API, 2023-01',
          locator: 'Summary and Goals',
        },
        {
          id: 'K0841-07',
          text: 'OpenJDK JEP 496 defines standard algorithm and parameter-set names for ML-KEM in the KeyPairGenerator, KEM, and KeyFactory APIs, while noting that passing an integer key size to KeyPairGenerator is unsupported for ML-KEM and throws an InvalidParameterException.',
          sourceId: 'OpenJDK-JEP-496-ML-KEM',
          edition:
            'JEP 496: Quantum-Resistant Module-Lattice-Based Key Encapsulation Mechanism, 2024-08',
          locator: 'Description and Generating ML-KEM key pairs',
        },
        {
          id: 'K0841-08',
          text: 'In OpenJDK JEP 497, ML-DSA uses the existing KeyPairGenerator and Signature APIs, where a Signature instance initialized with the family name accepts any ML-DSA parameter set, whereas one initialized with a specific parameter-set name rejects other parameter sets.',
          sourceId: 'OpenJDK-JEP-497-ML-DSA',
          edition:
            'JEP 497: Quantum-Resistant Module-Lattice-Based Digital Signature Algorithm, 2024-08',
          locator: 'Description and Signing with ML-DSA keys',
        },
      ],
    },
    {
      heading: 'Provider Overlap and Module Validation Scope',
      bridge:
        'As native algorithm support evolves, platform teams also track how providers interact and how module certifications apply.',
      sentences: [
        {
          id: 'K0841-09',
          text: "According to the oqs-provider documentation, a post-quantum algorithm is unavailable through oqs-provider on OpenSSL 3.5 or later if OpenSSL's default provider already implements that exact algorithm, while unimplemented hybrid combinations remain available.",
          sourceId: 'oqs-provider-OpenSSL-3-provider-containing-post-quantum-algo',
          edition: 'oqs-provider: OpenSSL 3 provider containing post-quantum algorithms',
          locator: 'README, Using with OpenSSL >= 3.5',
        },
        {
          id: 'K0841-11',
          text: "NIST FIPS 140-3 Implementation Guidance states that a cryptographic module validation certificate specifies the validated module's name, version number, and tested operational environment, serving as a benchmark for the tested configuration.",
          sourceId: 'NIST-FIPS140-3-IG-PQC',
          edition:
            'Implementation Guidance for FIPS 140-3 and the Cryptographic Module Validation Program, 2026-08',
          locator:
            'Section 2.3.A Binding of Cryptographic Algorithm Validation Certificates, PDF p. 25',
        },
      ],
    },
  ],
}
