import type { PersonaId } from './learningPersonas'

export interface PersonaStepHint {
  hint: string
  suggestUnknown?: boolean
  recommendedOptions?: string[]
  /** Persona-tailored step title (replaces the default h3) */
  title?: string
  /** Persona-tailored step description (replaces the default subtitle) */
  description?: string
  /** Per-option description overrides: maps option value → persona-specific description */
  optionDescriptions?: Record<string, string>
}

/**
 * Returns persona-specific title and description for a wizard step.
 * Falls back to empty object when no persona or no overrides exist.
 */
export function getPersonaStepContent(
  persona: PersonaId | null,
  stepKey: string
): { title?: string; description?: string } {
  if (!persona) return {}
  // eslint-disable-next-line security/detect-object-injection
  const hint = PERSONA_STEP_HINTS[persona]?.[stepKey]
  return { title: hint?.title, description: hint?.description }
}

/**
 * Returns persona-specific option description overrides for a wizard step.
 * Falls back to empty object when no persona or no overrides exist.
 */
export function getPersonaOptionDescriptions(
  persona: PersonaId | null,
  stepKey: string
): Record<string, string> {
  if (!persona) return {}
  // eslint-disable-next-line security/detect-object-injection
  return PERSONA_STEP_HINTS[persona]?.[stepKey]?.optionDescriptions ?? {}
}

export const PERSONA_STEP_HINTS: Record<PersonaId, Record<string, PersonaStepHint>> = {
  executive: {
    crypto: {
      hint: 'If you are unsure, select "I don\'t know" — your security team can provide this detail. The assessment will use conservative defaults.',
      suggestUnknown: true,
      title: 'What encryption does your organization use?',
      description:
        'Select what you know, or choose "I don\'t know" — your security team can fill this in later.',
    },
    sensitivity: {
      hint: 'Think about the most sensitive data your organization handles. For board-level planning, focus on the highest classification.',
      title: 'What types of sensitive data does your organization handle?',
      description: 'Focus on the highest classification your organization manages.',
    },
    compliance: {
      hint: 'Select frameworks your organization is subject to. If unsure, your compliance or legal team can confirm.',
    },
    migration: {
      hint: 'This refers to whether your organization has started transitioning cryptographic systems to post-quantum alternatives.',
      title: 'Has your organization started transitioning to quantum-safe encryption?',
      description: 'This helps us recommend the right next steps for your team.',
      optionDescriptions: {
        started:
          'Our team has started transitioning to quantum-safe encryption in production or pilot programs.',
        planning: 'We have a roadmap or budget allocated for quantum-safe migration.',
        'not-started': 'We have not started any quantum-safe migration activities yet.',
      },
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
      title: 'How flexible is your encryption infrastructure?',
      description: 'This measures how easily your systems can switch to new encryption standards.',
      optionDescriptions: {
        'fully-abstracted':
          'Encryption is behind a centralized abstraction — algorithm changes are configuration updates.',
        'partially-abstracted':
          'Some encryption is abstracted, but parts are embedded in application code.',
        hardcoded:
          'Encryption algorithms are referenced directly in business logic — changes require code rewrites.',
        unknown: 'Not sure — your engineering team can assess this.',
      },
    },
    infra: {
      hint: 'Ask your infrastructure team about HSMs and legacy systems. These are the biggest cost drivers in PQC migration.',
      suggestUnknown: true,
      title: 'What infrastructure handles your encryption?',
      description: 'These systems represent the biggest cost drivers in a PQC migration.',
    },
    vendors: {
      hint: 'Consider your major technology vendors (cloud, SaaS, payment processors). Heavy vendor dependency means migration is partly out of your control.',
      title: 'How dependent is your organization on external technology providers?',
      description:
        'Heavy vendor dependency means migration timelines are partly out of your control.',
      optionDescriptions: {
        'heavy-vendor':
          'We rely heavily on external vendors for encryption — their timelines constrain ours.',
        mixed: 'We use a mix of vendor-managed and in-house encryption across the organization.',
        'open-source': 'We primarily use open-source encryption libraries that our team manages.',
        'in-house': 'We manage our own encryption infrastructure and can control migration pace.',
      },
    },
    timeline: {
      hint: 'Select the deadline that applies to your organization based on regulatory requirements or internal planning.',
    },
  },
  developer: {
    crypto: {
      hint: 'Select all algorithms present in your codebase, including those in dependencies (check package.json, go.mod, requirements.txt for crypto libraries).',
      title: 'What algorithms are in your codebase?',
      description:
        'Include algorithms in dependencies — check package.json, go.mod, or requirements.txt.',
    },
    sensitivity: {
      hint: 'Consider the data your code handles — PII, financial records, health data, and API keys all have different sensitivity levels.',
    },
    compliance: {
      hint: 'Check with your security team about which frameworks apply. Common ones: SOC 2, PCI DSS, HIPAA (healthcare), FedRAMP (government).',
    },
    migration: {
      hint: 'Have you or your team started replacing quantum-vulnerable algorithms? Even a proof-of-concept counts as "started".',
      title: 'Have you started replacing quantum-vulnerable algorithms?',
      description: 'Even a proof-of-concept or prototype counts as started.',
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
      title: 'How is crypto implemented in your codebase?',
      description: 'Fully abstracted = all crypto behind a provider/factory pattern.',
    },
    infra: {
      hint: 'Include cloud KMS, HSMs, and any certificate authorities your code interacts with programmatically.',
      title: 'What crypto infrastructure does your code interact with?',
      description:
        'Include cloud KMS, HSMs, and certificate authorities you call programmatically.',
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
      title: 'Map your cryptographic footprint across all layers',
      description:
        'Consider protocol-level (TLS, VPN), storage-level (KMS), and identity-level (PKI, CA) algorithms.',
    },
    sensitivity: {
      hint: 'Assess sensitivity across data flows — data may be low-sensitivity at rest but critical in transit between systems.',
    },
    compliance: {
      hint: 'Consider frameworks that apply to each component in your architecture — different subsystems may have different compliance requirements.',
    },
    migration: {
      hint: 'Has any part of your architecture been updated for PQC? Hybrid TLS, updated KMS configurations, or PKI re-keying all count.',
      title: 'Has any part of your architecture been updated for PQC?',
      description: 'Hybrid TLS, updated KMS, or PKI re-keying all count.',
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
      title: 'Does your crypto abstraction layer support algorithm negotiation?',
      description:
        'This determines your migration architecture — from re-keying to full re-engineering.',
    },
    infra: {
      hint: 'Consider the full dependency graph: HSMs in your trust root, cloud KMS for data-at-rest, legacy systems with firmware crypto, and embedded devices.',
      title: 'Map your full crypto dependency graph',
      description: 'HSMs in your trust root, cloud KMS, legacy systems, and embedded devices.',
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
