import type { PersonaId } from './learningPersonas'

export interface PersonaStepHint {
  hint: string
  suggestUnknown?: boolean
  recommendedOptions?: string[]
}

export const PERSONA_STEP_HINTS: Record<PersonaId, Record<string, PersonaStepHint>> = {
  executive: {
    crypto: {
      hint: 'If you are unsure, select "I don\'t know" — your security team can provide this detail. The assessment will use conservative defaults.',
      suggestUnknown: true,
    },
    sensitivity: {
      hint: 'Think about the most sensitive data your organization handles. For board-level planning, focus on the highest classification.',
    },
    compliance: {
      hint: 'Select frameworks your organization is subject to. If unsure, your compliance or legal team can confirm.',
    },
    migration: {
      hint: 'This refers to whether your organization has started transitioning cryptographic systems to post-quantum alternatives.',
    },
    'use-cases': {
      hint: 'Select the business functions that rely on cryptography. If unsure, consult your CISO or security team.',
    },
    retention: {
      hint: 'Consider the longest period any sensitive data must remain protected — regulatory requirements often set the floor.',
    },
    credential: {
      hint: 'This covers how long your certificates, signed firmware, and digital credentials must remain trusted.',
      suggestUnknown: true,
    },
    scale: {
      hint: 'Estimate the number of systems that use cryptography and the size of the team that would manage migration.',
    },
    agility: {
      hint: 'This is a technical question about how cryptography is implemented in your codebase. If unsure, select "I don\'t know" — your engineering team can assess this.',
      suggestUnknown: true,
    },
    infra: {
      hint: 'Ask your infrastructure team about HSMs and legacy systems. These are the biggest cost drivers in PQC migration.',
      suggestUnknown: true,
    },
    vendors: {
      hint: 'Consider your major technology vendors (cloud, SaaS, payment processors). Heavy vendor dependency means migration is partly out of your control.',
    },
    timeline: {
      hint: 'Select the deadline that applies to your organization based on regulatory requirements or internal planning.',
    },
  },
  developer: {
    crypto: {
      hint: 'Select all algorithms present in your codebase, including those in dependencies (check package.json, go.mod, requirements.txt for crypto libraries).',
    },
    sensitivity: {
      hint: 'Consider the data your code handles — PII, financial records, health data, and API keys all have different sensitivity levels.',
    },
    compliance: {
      hint: 'Check with your security team about which frameworks apply. Common ones: SOC 2, PCI DSS, HIPAA (healthcare), FedRAMP (government).',
    },
    migration: {
      hint: 'Have you or your team started replacing quantum-vulnerable algorithms? Even a proof-of-concept counts as "started".',
    },
    'use-cases': {
      hint: 'Think about where crypto appears in your code: TLS connections, database encryption, API authentication, signed artifacts.',
    },
    retention: {
      hint: 'Consider how long the data your code processes must remain confidential — database backups and archives count.',
    },
    credential: {
      hint: 'Check your certificate validity periods, code signing certificate lifetimes, and JWT token expiry configurations.',
    },
    scale: {
      hint: 'Count services, microservices, and applications that use crypto operations — including transitive dependencies on crypto libraries.',
    },
    agility: {
      hint: 'Fully abstracted = all crypto behind a provider/factory pattern. Hardcoded = algorithms referenced directly in business logic.',
      recommendedOptions: ['fully-abstracted', 'partially-abstracted'],
    },
    infra: {
      hint: 'Include cloud KMS, HSMs, and any certificate authorities your code interacts with programmatically.',
    },
    vendors: {
      hint: 'Consider crypto libraries (OpenSSL, BoringSSL, libsodium), cloud SDKs, and SaaS APIs that handle encryption.',
    },
    timeline: {
      hint: 'If your organization has a PQC migration deadline, select it. Otherwise, consider the deadline of your most pressing compliance framework.',
    },
  },
  architect: {
    crypto: {
      hint: 'Map all algorithms across your system topology — consider protocol-level (TLS, VPN), storage-level (KMS), and identity-level (PKI, CA) uses.',
    },
    sensitivity: {
      hint: 'Assess sensitivity across data flows — data may be low-sensitivity at rest but critical in transit between systems.',
    },
    compliance: {
      hint: 'Consider frameworks that apply to each component in your architecture — different subsystems may have different compliance requirements.',
    },
    migration: {
      hint: 'Has any part of your architecture been updated for PQC? Hybrid TLS, updated KMS configurations, or PKI re-keying all count.',
    },
    'use-cases': {
      hint: 'Consider the full dependency graph: service-to-service mTLS, internal CA chains, key management flows, and secure boot chains.',
    },
    retention: {
      hint: 'Assess retention across the architecture — some data stores (backups, archives, compliance vaults) may have much longer lifetimes.',
    },
    credential: {
      hint: 'Map all credential chains: root CA certificates, intermediate CAs, leaf certificates, signed firmware images, and code signing keys.',
    },
    scale: {
      hint: 'Include systems that consume cryptographic services indirectly (e.g., microservices calling an internal CA or KMS).',
    },
    agility: {
      hint: 'Evaluate whether your crypto abstraction layer supports algorithm negotiation and hybrid schemes. This determines migration architecture.',
    },
    infra: {
      hint: 'Consider the full dependency graph: HSMs in your trust root, cloud KMS for data-at-rest, legacy systems with firmware crypto, and embedded devices.',
    },
    vendors: {
      hint: 'Map which crypto operations are vendor-controlled vs. in-house. Vendor timelines constrain your migration schedule.',
    },
    timeline: {
      hint: 'Align your timeline with the most constrained component in your architecture — the slowest subsystem sets the pace.',
    },
  },
  researcher: {
    crypto: {
      hint: 'Select all algorithms for comprehensive analysis. Each quantum-vulnerable algorithm generates specific migration recommendations with NIST FIPS references.',
    },
    sensitivity: {
      hint: 'Multiple sensitivity levels can be selected. The scoring engine uses the maximum across selections for worst-case HNDL risk analysis.',
    },
    compliance: {
      hint: 'Each selected framework is scored for PQC mandate status, deadline proximity, and enforcement body. Closer deadlines increase regulatory pressure.',
    },
    migration: {
      hint: 'Migration status affects the organizational readiness score. "Started" gives the largest risk reduction; "unknown" applies conservative defaults.',
    },
    'use-cases': {
      hint: 'Each use case has HNDL relevance, HNFL relevance, and migration priority weights that feed into the composite risk score.',
    },
    retention: {
      hint: 'Retention years drive the HNDL risk window calculation: data expiry year minus estimated CRQC arrival year. Industry-specific defaults apply when unknown.',
    },
    credential: {
      hint: 'Credential lifetime drives the HNFL risk window. Only affects scoring when signing algorithms (RSA, ECDSA, Ed25519) are present.',
    },
    scale: {
      hint: 'System scale and team capacity create a capacity gap ratio that feeds into organizational readiness scoring.',
    },
    agility: {
      hint: 'Crypto agility is the single largest factor in migration complexity scoring (40% weight). "Hardcoded" = 0.9 factor, "fully-abstracted" = 0.2.',
    },
    infra: {
      hint: 'Infrastructure items have individual complexity scores (HSM=15, Legacy=14, Embedded=13, On-prem PKI=12). Sum is capped at 30.',
    },
    vendors: {
      hint: 'Vendor dependency weight ranges from 3 (in-house) to 20 (heavy-vendor). Affects both migration complexity and organizational readiness.',
    },
    timeline: {
      hint: 'Timeline pressure is a multiplier (1.0-1.3) applied to the regulatory pressure score. Country-specific deadlines from the timeline CSV are shown.',
    },
  },
}
