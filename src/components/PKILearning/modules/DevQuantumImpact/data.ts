// SPDX-License-Identifier: GPL-3.0-only
import type { RoleGuideData } from '../../common/roleGuide/types'

export const DEV_GUIDE_DATA: RoleGuideData = {
  roleId: 'developer',
  roleLabel: 'Developer / Engineer',
  tagline:
    'The code you write today may be vulnerable before its end of life. Understanding PQC is now a core engineering skill.',

  urgencyStatement:
    'Every line of cryptographic code you ship today uses algorithms that quantum computers will break. Library migrations are already underway (OpenSSL 3.5, BoringSSL, Go 1.24), and larger PQC keys/signatures break assumptions baked into protocols, databases, and network stacks. Developers who understand PQC now will lead their teams through the most significant cryptographic transition in internet history.',

  threatImpacts: [
    {
      id: 'library-transition',
      title: 'Crypto Library Transitions',
      description:
        'OpenSSL, BoringSSL, Go crypto, and AWS-LC are adding PQC support. Your code may need API changes.',
      severity: 'critical',
      timeframe: '2024-2027',
      exampleScenario:
        'Your application uses OpenSSL for TLS. OpenSSL 3.5 adds ML-KEM and ML-DSA support but changes EVP API patterns. Your hardcoded cipher suite configuration breaks, and your CI pipeline starts failing TLS handshake tests.',
    },
    {
      id: 'key-size-impact',
      title: 'Larger Keys & Signatures Break Assumptions',
      description:
        'ML-KEM public keys are 800-1568 bytes (vs 32-133 for ECC). ML-DSA signatures are 2420-4627 bytes (vs 64-72 for ECDSA).',
      severity: 'critical',
      timeframe: 'Immediate design impact',
      exampleScenario:
        'Your JWT tokens use ECDSA signatures (64 bytes). Switching to ML-DSA-65 produces 3309-byte signatures. Your API gateway rejects them because the Authorization header exceeds the 8KB limit. URL-encoded tokens break browser URL length limits.',
    },
    {
      id: 'tls-handshake',
      title: 'TLS Handshake Size Increase',
      description:
        'PQC key exchange adds ~1KB to the TLS handshake. Some networks and middleboxes may not handle this.',
      severity: 'high',
      timeframe: '2025-2028',
      exampleScenario:
        'Your mobile app connects through a corporate proxy that fragments TLS ClientHello messages larger than 1200 bytes. Adding ML-KEM to the key exchange pushes it over, causing connection timeouts for 15% of enterprise users.',
    },
    {
      id: 'code-signing',
      title: 'Code Signing & Verification',
      description:
        'Software supply chain signatures (npm, Docker, Git) will transition to PQC algorithms.',
      severity: 'high',
      timeframe: '2026-2030',
      exampleScenario:
        'Your CI/CD pipeline signs container images with ECDSA. When your security team mandates ML-DSA signatures, sigstore verification fails because your deployment tools don\u2019t support the new algorithm yet.',
    },
    {
      id: 'hybrid-complexity',
      title: 'Hybrid Deployment Complexity',
      description:
        'The transition period requires supporting both classical and PQC algorithms simultaneously.',
      severity: 'medium',
      timeframe: '2025-2035',
      exampleScenario:
        'Your microservice mesh needs to communicate with both PQC-upgraded and legacy services during migration. You must implement hybrid TLS that negotiates the strongest available algorithm without breaking backward compatibility.',
    },
    {
      id: 'test-coverage',
      title: 'Testing & Validation Gaps',
      description:
        'Existing test suites do not cover PQC algorithm behavior, performance characteristics, or failure modes.',
      severity: 'medium',
      timeframe: '2025-2028',
      exampleScenario:
        'Your load tests assume TLS handshakes complete in <5ms. ML-KEM key generation takes 2-3x longer, and your latency budgets are violated under peak traffic. Without PQC-aware performance tests, this surfaces in production.',
    },
  ],

  selfAssessment: [
    {
      id: 'tls-code',
      label: 'I write or maintain code that configures TLS connections',
      weight: 15,
    },
    {
      id: 'jwt-tokens',
      label: 'I work with JWTs, signed cookies, or API authentication tokens',
      weight: 12,
    },
    {
      id: 'crypto-libs',
      label: 'My code directly calls cryptographic libraries (OpenSSL, libsodium, Web Crypto)',
      weight: 15,
    },
    {
      id: 'signing',
      label: 'I implement or verify digital signatures (code signing, document signing)',
      weight: 12,
    },
    {
      id: 'key-mgmt',
      label: 'I handle key generation, rotation, or storage in my codebase',
      weight: 10,
    },
    {
      id: 'ci-cd',
      label: 'My CI/CD pipeline includes cryptographic verification steps',
      weight: 8,
    },
    {
      id: 'long-lived',
      label: 'My application stores or transmits data with >5yr confidentiality needs',
      weight: 10,
    },
    {
      id: 'no-abstraction',
      label: 'Crypto operations are hardcoded (not behind abstraction layers)',
      weight: 12,
    },
    {
      id: 'no-cbom',
      label: 'I have no cryptographic bill of materials (CBOM) for my projects',
      weight: 6,
    },
  ],

  skillGaps: [
    {
      id: 'pqc-algorithms',
      category: 'Algorithm Knowledge',
      skill: 'PQC Algorithm Mechanics',
      description:
        'Understanding ML-KEM (key encapsulation), ML-DSA (signatures), and SLH-DSA (hash-based signatures).',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'pqc-101', label: 'PQC 101' },
        { id: 'quantum-threats', label: 'Quantum Threats' },
        { id: 'crypto-dev-apis', label: 'Crypto Developer APIs' },
      ],
    },
    {
      id: 'hybrid-patterns',
      category: 'Algorithm Knowledge',
      skill: 'Hybrid Cryptography Patterns',
      description:
        'Implementing hybrid KEM (X25519 + ML-KEM) and composite signatures for backward compatibility.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'hybrid-crypto', label: 'Hybrid Cryptography' }],
    },
    {
      id: 'tls-integration',
      category: 'Protocol Integration',
      skill: 'PQC TLS Configuration',
      description: 'Configuring TLS 1.3 with ML-KEM key exchange and hybrid cipher suites.',
      targetLevel: 'advanced',
      linkedModules: [{ id: 'tls-basics', label: 'TLS Basics' }],
    },
    {
      id: 'api-jwt',
      category: 'Protocol Integration',
      skill: 'PQC API & JWT Security',
      description:
        'Adapting JWT signing, API authentication, and token formats for PQC-sized signatures.',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'api-security-jwt', label: 'API Security & JWT' },
        { id: 'database-encryption-pqc', label: 'Database Encryption' },
      ],
    },
    {
      id: 'crypto-agility',
      category: 'Architecture',
      skill: 'Crypto-Agile Code Design',
      description:
        'Writing code with abstraction layers that allow algorithm swaps without application changes.',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'crypto-agility', label: 'Crypto Agility' },
        { id: 'secrets-management-pqc', label: 'Secrets Management' },
      ],
    },
    {
      id: 'pki-certs',
      category: 'Architecture',
      skill: 'PQC Certificate Handling',
      description:
        'Working with PQC certificates, composite certs, and certificate chain validation.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'pki-workshop', label: 'PKI' }],
    },
    {
      id: 'code-signing-dev',
      category: 'Supply Chain',
      skill: 'PQC Code & Container Signing',
      description: 'Signing and verifying code, containers, and packages with PQC algorithms.',
      targetLevel: 'basic',
      linkedModules: [
        { id: 'code-signing', label: 'Code Signing' },
        { id: 'platform-eng-pqc', label: 'Platform Engineering' },
      ],
    },
    {
      id: 'testing-pqc',
      category: 'Quality',
      skill: 'PQC Testing & Validation',
      description:
        'Writing tests for PQC operations, performance benchmarking, and interoperability testing.',
      targetLevel: 'basic',
      linkedModules: [],
    },
  ],

  knowledgeDomains: [
    {
      name: 'PQC Fundamentals',
      description: 'Understand the quantum threat and how new algorithms work.',
      modules: [
        { id: 'pqc-101', label: 'PQC 101' },
        { id: 'quantum-threats', label: 'Quantum Threats' },
      ],
    },
    {
      name: 'Protocol Migration',
      description: 'Learn how TLS, SSH, JWT, and web protocols integrate PQC.',
      modules: [
        { id: 'tls-basics', label: 'TLS Basics' },
        { id: 'api-security-jwt', label: 'API & JWT' },
        { id: 'vpn-ssh-pqc', label: 'VPN/SSH' },
        { id: 'web-gateway-pqc', label: 'Web Gateways' },
      ],
    },
    {
      name: 'Architecture Patterns',
      description: 'Design crypto-agile systems with hybrid and composite approaches.',
      modules: [
        { id: 'hybrid-crypto', label: 'Hybrid Crypto' },
        { id: 'crypto-agility', label: 'Crypto Agility' },
        { id: 'pki-workshop', label: 'PKI' },
      ],
    },
    {
      name: 'Supply Chain Security',
      description: 'Secure your build pipeline and distribution with PQC signing.',
      modules: [{ id: 'code-signing', label: 'Code Signing' }],
    },
  ],

  actionItems: [
    {
      id: 'dev-immediate-1',
      phase: 'immediate',
      title: 'Audit Crypto Usage in Your Code',
      description: 'Search your codebase for cryptographic operations that will need migration.',
      checklist: [
        'Grep for RSA, ECDSA, ECDH, P-256, secp256k1 usage',
        'List all TLS/SSL configuration points',
        'Identify JWT signing and token generation code',
        'Check for hardcoded cipher suites or algorithm names',
      ],
    },
    {
      id: 'dev-immediate-2',
      phase: 'immediate',
      title: 'Check Library PQC Support',
      description: 'Review whether your crypto dependencies have PQC support or roadmaps.',
      checklist: [
        'Check OpenSSL/BoringSSL version and PQC availability',
        'Review language-specific crypto library PQC status',
        'Note any transitive dependencies on vulnerable algorithms',
      ],
    },
    {
      id: 'dev-30d-1',
      phase: '30-day',
      title: 'Set Up PQC Test Environment',
      description: 'Create a development environment capable of testing PQC operations.',
      checklist: [
        'Install PQC-enabled OpenSSL or liboqs in dev environment',
        'Create test certificates with ML-DSA and hybrid algorithms',
        'Run TLS handshake tests with ML-KEM key exchange',
        'Benchmark PQC operation latency vs. current algorithms',
      ],
    },
    {
      id: 'dev-90d-1',
      phase: '90-day',
      title: 'Implement Hybrid Crypto in Staging',
      description: 'Deploy hybrid classical+PQC cryptography in a non-production environment.',
      checklist: [
        'Implement crypto abstraction layer if not present',
        'Configure hybrid TLS (X25519MLKEM768) in staging',
        'Test backward compatibility with non-PQC clients',
        'Update CI/CD to include PQC interoperability tests',
        'Document size impact on tokens, certs, and network traffic',
      ],
    },
    {
      id: 'dev-6mo-1',
      phase: '6-month',
      title: 'Complete Protocol Migration Plan',
      description: 'Produce a complete migration plan for all cryptographic touchpoints.',
      checklist: [
        'Generate CBOM (Cryptographic Bill of Materials) for all services',
        'Create migration runbooks for each protocol (TLS, JWT, signing)',
        'Establish algorithm governance standard for the team',
        'Propose migration timeline aligned with org deadlines',
        'Contribute findings to team knowledge base',
      ],
    },
  ],

  quickWins: [
    {
      id: 'qw-grep',
      label: 'Run a crypto grep on your codebase',
      description: 'Search for RSA, ECDSA, ECDH, AES-128 to map your crypto footprint in minutes.',
    },
    {
      id: 'qw-openssl',
      label: 'Check your OpenSSL version',
      description: 'Run `openssl version` — 3.5+ has ML-KEM/ML-DSA support built in.',
    },
    {
      id: 'qw-tls-test',
      label: 'Test ML-KEM TLS in your browser',
      description:
        'Chrome 131+ uses ML-KEM by default for TLS 1.3. Check your site\u2019s support.',
    },
  ],

  kpiMetrics: [
    {
      label: 'Crypto Inventory',
      target: '100%',
      description: 'All cryptographic operations documented in CBOM.',
    },
    {
      label: 'Abstraction Coverage',
      target: '> 90%',
      description: 'Crypto operations behind algorithm-agnostic abstraction layers.',
    },
    {
      label: 'PQC Test Coverage',
      target: '> 80%',
      description: 'Unit/integration tests covering PQC algorithm paths.',
    },
    {
      label: 'Hybrid Readiness',
      target: 'Staging',
      description: 'Hybrid TLS/signing deployed and tested in staging environment.',
    },
    {
      label: 'Size Budget Compliance',
      target: '100%',
      description: 'All tokens, headers, and payloads validated against PQC size increases.',
    },
    {
      label: 'Library Currency',
      target: 'PQC-enabled',
      description: 'All crypto libraries updated to versions with PQC support.',
    },
  ],
}
