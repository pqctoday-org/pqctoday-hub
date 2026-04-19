// SPDX-License-Identifier: GPL-3.0-only
import type { PersonaId } from './learningPersonas'
import type { ExperienceLevel } from '../store/usePersonaStore'

export interface PersonaStepHint {
  hint: string
  /** Simpler hint for 'curious' proficiency users — reassuring, jargon-free */
  hintBeginner?: string
  /** Technical hint for 'expert' proficiency users — deep, actionable */
  hintExpert?: string
  suggestUnknown?: boolean
  recommendedOptions?: string[]
  /** Persona-tailored step title (replaces the default h3) */
  title?: string
  /** Simpler title for 'curious' proficiency */
  titleBeginner?: string
  /** Persona-tailored step description (replaces the default subtitle) */
  description?: string
  /** Simpler description for 'curious' proficiency */
  descriptionBeginner?: string
  /** Per-option description overrides: maps option value → persona-specific description */
  optionDescriptions?: Record<string, string>
}

/* ── Step-key aliasing ───────────────────────────────────────────────────── */

/**
 * Maps wizard ALL_STEPS keys to PERSONA_STEP_HINTS keys when they differ.
 * Currently only `credential-lifetime` (wizard key) → `credential` (hint key).
 */
const STEP_KEY_ALIASES: Record<string, string> = {
  'credential-lifetime': 'credential',
}

/** Resolve a wizard step key to its corresponding hint key. */
export function resolveHintKey(stepKey: string): string {
  // eslint-disable-next-line security/detect-object-injection
  return STEP_KEY_ALIASES[stepKey] ?? stepKey
}

/* ── Persona step content helpers ────────────────────────────────────────── */

/**
 * Resolve the effective hint for (persona, industry, stepKey) by layering:
 *   1. persona × industry override  (PERSONA_INDUSTRY_STEP_HINTS)
 *   2. persona default              (PERSONA_STEP_HINTS)
 * Industry is matched case-insensitively via `normalizeIndustry`. A missing
 * industry or missing override falls through to the persona default.
 */
function resolveHint(
  persona: PersonaId | null,
  stepKey: string,
  industry?: string | null
): PersonaStepHint | undefined {
  if (!persona) return undefined
  const key = resolveHintKey(stepKey)
  // eslint-disable-next-line security/detect-object-injection
  const base = PERSONA_STEP_HINTS[persona]?.[key]
  if (!industry) return base
  const norm = normalizeIndustry(industry)
  // eslint-disable-next-line security/detect-object-injection
  const industryOverride = PERSONA_INDUSTRY_STEP_HINTS[persona]?.[norm]?.[key]
  if (!industryOverride) return base
  return base ? { ...base, ...industryOverride } : (industryOverride as PersonaStepHint)
}

/**
 * Returns persona-specific title and description for a wizard step.
 * When experienceLevel is 'curious', prefers beginner variants if available.
 * When industry is provided, persona × industry overrides take precedence.
 * Falls back to empty object when no persona or no overrides exist.
 */
export function getPersonaStepContent(
  persona: PersonaId | null,
  stepKey: string,
  experienceLevel?: ExperienceLevel | null,
  industry?: string | null
): { title?: string; description?: string } {
  const hint = resolveHint(persona, stepKey, industry)
  if (!hint) return {}
  const title = experienceLevel === 'curious' ? (hint.titleBeginner ?? hint.title) : hint.title
  const description =
    experienceLevel === 'curious'
      ? (hint.descriptionBeginner ?? hint.description)
      : hint.description
  return { title, description }
}

/**
 * Returns persona-specific option description overrides for a wizard step.
 * When industry is provided, persona × industry overrides take precedence.
 * Falls back to empty object when no persona or no overrides exist.
 */
export function getPersonaOptionDescriptions(
  persona: PersonaId | null,
  stepKey: string,
  industry?: string | null
): Record<string, string> {
  return resolveHint(persona, stepKey, industry)?.optionDescriptions ?? {}
}

/**
 * Lower-case + strip non-alphanumerics so 'Finance & Banking' and
 * 'finance_banking' both resolve to the same override key.
 */
function normalizeIndustry(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

/* ── Step context info (non-persona factors shown in the info modal) ───── */

export interface StepContextInfo {
  /** How the user's industry selection affects this step */
  industryEffect?: string
  /** How the user's country selection affects this step */
  countryEffect?: string
  /** How proficiency level affects this step */
  proficiencyEffect?: string
}

export const STEP_CONTEXT_INFO: Record<string, StepContextInfo> = {
  industry: {
    industryEffect:
      'Sets the industry used to filter compliance frameworks, threat profiles, and use case options throughout the assessment.',
  },
  country: {
    countryEffect:
      'Filters compliance frameworks to your jurisdiction and drives country-specific migration deadlines.',
    industryEffect:
      'The industry you selected in Step 1 determines which country-level regulations are most relevant.',
  },
  crypto: {
    proficiencyEffect:
      'Beginners and intermediate users see "I don\'t know" pre-selected. Experts see the full algorithm picker with no defaults.',
  },
  sensitivity: {
    industryEffect:
      'Industry-specific data types (e.g., PHI for Healthcare, PII for Finance) are promoted when relevant.',
    proficiencyEffect:
      'Beginners see "I don\'t know" pre-selected; the assessment uses worst-case sensitivity assumptions.',
  },
  compliance: {
    industryEffect:
      'Frameworks are filtered to show only those relevant to your selected industry.',
    countryEffect:
      'Frameworks are filtered to your jurisdiction. EU member states see EU-wide frameworks automatically.',
    proficiencyEffect: 'Beginners see "None apply / I don\'t know" pre-selected.',
  },
  migration: {
    proficiencyEffect:
      'Beginners see "I don\'t know" pre-selected; the assessment assumes no migration has started.',
  },
  'use-cases': {
    industryEffect: 'Industry-relevant use cases are promoted in the list.',
    proficiencyEffect: 'Beginners see "I don\'t know" pre-selected.',
  },
  retention: {
    industryEffect: 'Industry-specific retention periods are promoted.',
    proficiencyEffect: 'Beginners see "I don\'t know" pre-selected.',
  },
  credential: {
    proficiencyEffect:
      'Beginners see "I don\'t know" pre-selected; the assessment assumes long-lived credentials.',
  },
  scale: {
    proficiencyEffect:
      'No impact — system count and team size are required for all proficiency levels.',
  },
  agility: {
    proficiencyEffect:
      'Beginners and intermediate users see "I don\'t know" pre-selected. Hints adapt to technical depth.',
  },
  infra: {
    proficiencyEffect:
      'Beginners and intermediate users see "I don\'t know" pre-selected. Hints adapt to technical depth.',
  },
  vendors: {
    proficiencyEffect: 'Beginners see "I don\'t know" pre-selected.',
  },
  timeline: {
    countryEffect:
      'Country-specific regulatory deadlines from the PQC timeline are shown as options.',
    proficiencyEffect: 'Beginners see "I don\'t know" pre-selected.',
  },
}

/* ── Per-persona per-step hints ──────────────────────────────────────────── */

export const PERSONA_STEP_HINTS: Record<PersonaId, Record<string, PersonaStepHint>> = {
  executive: {
    industry: {
      hint: 'Your industry determines which compliance frameworks, threat profiles, and migration timelines are most relevant to your organization.',
      hintBeginner:
        'Pick the sector closest to your organization. This shapes the entire assessment — compliance rules and risk levels differ significantly between industries.',
      title: 'What sector does your organization operate in?',
      description: 'Industry drives compliance obligations and quantum risk exposure.',
    },
    country: {
      hint: 'Your jurisdiction determines regulatory timelines and government mandates. Select where your primary operations are based.',
      hintBeginner:
        'Choose your headquarters country. Different countries have different PQC migration deadlines — some as early as 2030.',
      title: 'Where is your organization headquartered?',
      description: 'Regulatory deadlines vary significantly by country.',
    },
    crypto: {
      hint: 'If you are unsure, select "I don\'t know" — your security team can provide this detail. The assessment will use conservative defaults.',
      hintBeginner:
        "Don't worry if you're not sure — select \"I don't know\" and the assessment will use safe defaults. Your IT team can update this later.",
      hintExpert:
        'Select all algorithm families present across your enterprise, including algorithms in third-party dependencies, payment processing, and legacy systems.',
      suggestUnknown: true,
      title: 'What encryption does your organization use?',
      titleBeginner: 'Does your organization use encryption?',
      description:
        'Select what you know, or choose "I don\'t know" — your security team can fill this in later.',
      descriptionBeginner:
        "If you're not sure, that's OK — \"I don't know\" gives you a safe starting point.",
    },
    sensitivity: {
      hint: 'Think about the most sensitive data your organization handles. For board-level planning, focus on the highest classification.',
      hintBeginner:
        'Think about the most important data your company protects — customer records, financial data, trade secrets. If unsure, pick the highest level that might apply.',
      title: 'What types of sensitive data does your organization handle?',
      description: 'Focus on the highest classification your organization manages.',
    },
    compliance: {
      hint: 'Select frameworks your organization is subject to. If unsure, your compliance or legal team can confirm.',
      hintBeginner:
        'These are regulatory standards your organization must follow. If you\'re not sure which ones apply, select "I don\'t know" — your legal or compliance team can fill this in.',
    },
    migration: {
      hint: 'This refers to whether your organization has started transitioning cryptographic systems to post-quantum alternatives.',
      hintBeginner:
        'Has your organization started preparing for quantum-safe encryption? Most organizations haven\'t — "not started" or "I don\'t know" are common answers.',
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
      hintBeginner:
        'These are the ways your organization uses encryption — for example, secure emails, online payments, or digital signatures. Select what you know or choose "I don\'t know".',
    },
    retention: {
      hint: 'Consider the longest period any sensitive data must remain protected — regulatory requirements often set the floor.',
      hintBeginner:
        'How long must your data stay confidential? Think about regulations like GDPR (forever for some data) or financial records (typically 7+ years).',
    },
    credential: {
      hint: 'This covers how long your certificates, signed firmware, and digital credentials must remain trusted.',
      hintBeginner:
        'This is about how long your digital certificates and signatures need to stay valid. If unsure, select "I don\'t know".',
      suggestUnknown: true,
    },
    scale: {
      hint: 'Estimate the number of systems that use cryptography and the size of the team that would manage migration.',
      hintBeginner:
        'Give your best estimate. "Systems" includes servers, applications, and cloud services. "Team" is the people who would manage the transition.',
    },
    agility: {
      hint: 'This is a technical question about how cryptography is implemented in your codebase. If unsure, select "I don\'t know" — your engineering team can assess this.',
      hintBeginner:
        'This is a technical question your engineering team would know. Select "I don\'t know" — the assessment will assume a conservative answer.',
      hintExpert:
        'Evaluate whether your crypto layer supports algorithm negotiation. Fully abstracted = algorithm changes are config updates; hardcoded = code rewrites required.',
      suggestUnknown: true,
      title: 'How flexible is your encryption infrastructure?',
      titleBeginner: 'Can your systems easily switch encryption methods?',
      description: 'This measures how easily your systems can switch to new encryption standards.',
      descriptionBeginner:
        'Your engineering team will know this. Select "I don\'t know" to use safe defaults.',
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
      hintBeginner:
        'This is about specialized hardware and systems that handle encryption. If you\'re not sure what your organization uses, select "I don\'t know".',
      hintExpert:
        'Map HSMs (FIPS-validated and cloud), on-prem PKI infrastructure, legacy cryptographic appliances, and embedded devices with firmware crypto.',
      suggestUnknown: true,
      title: 'What infrastructure handles your encryption?',
      titleBeginner: 'Does your organization use specialized encryption hardware?',
      description: 'These systems represent the biggest cost drivers in a PQC migration.',
      descriptionBeginner:
        'HSMs and legacy systems are expensive to upgrade. If you\'re not sure, select "I don\'t know".',
    },
    vendors: {
      hint: 'Consider your major technology vendors (cloud, SaaS, payment processors). Heavy vendor dependency means migration is partly out of your control.',
      hintBeginner:
        'Do you rely on outside technology companies for your encryption? Cloud providers, payment processors, and SaaS vendors all count.',
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
      hintBeginner:
        'When does your organization need to be quantum-safe? If you don\'t have a deadline yet, select "I don\'t know" — most organizations are still figuring this out.',
    },
  },
  developer: {
    industry: {
      hint: 'Your industry determines which crypto libraries and standards are most relevant, and which compliance certifications your code must support.',
      hintBeginner:
        "Pick the industry your application serves. This determines which security standards and crypto libraries you'll need to know about.",
      title: 'What industry does your application serve?',
      description: 'Industry determines relevant crypto standards and compliance certifications.',
    },
    country: {
      hint: 'Your jurisdiction affects which cryptographic certifications (FIPS, CC, BSI) your code must target and which algorithm choices are mandated.',
      hintBeginner:
        'Where is your application deployed? Different countries require different cryptographic certifications.',
      title: 'Where is your application deployed?',
      description: 'Jurisdiction determines required certifications and allowed algorithms.',
    },
    crypto: {
      hint: 'Select all algorithms present in your codebase, including those in dependencies (check package.json, go.mod, requirements.txt for crypto libraries).',
      hintBeginner:
        'Not sure what algorithms your code uses? That\'s common — many are hidden inside libraries. Select "I don\'t know" and check your dependencies later.',
      hintExpert:
        'Audit your full dependency tree: direct crypto calls, TLS library defaults, database encryption, JWT signing algorithms, and any custom crypto in WASM modules.',
      title: 'What algorithms are in your codebase?',
      description:
        'Include algorithms in dependencies — check package.json, go.mod, or requirements.txt.',
    },
    sensitivity: {
      hint: 'Consider the data your code handles — PII, financial records, health data, and API keys all have different sensitivity levels.',
      hintBeginner:
        'Think about what data your application processes — user accounts, payment info, health records. Each type has a different sensitivity level.',
    },
    compliance: {
      hint: 'Check with your security team about which frameworks apply. Common ones: SOC 2, PCI DSS, HIPAA (healthcare), FedRAMP (government).',
      hintBeginner:
        'These are security standards your application must comply with. Common ones: SOC 2 (enterprise SaaS), PCI DSS (payments), HIPAA (health data). Ask your security team if unsure.',
    },
    migration: {
      hint: 'Have you or your team started replacing quantum-vulnerable algorithms? Even a proof-of-concept counts as "started".',
      hintBeginner:
        'Have you experimented with any quantum-safe algorithms in your code? Even trying ML-KEM or ML-DSA in a branch counts.',
      hintExpert:
        'Include PoCs, library evaluations, and any hybrid mode implementations (e.g., X25519+ML-KEM in TLS). CI/CD pipeline crypto scanning counts as "planning".',
      title: 'Have you started replacing quantum-vulnerable algorithms?',
      description: 'Even a proof-of-concept or prototype counts as started.',
    },
    'use-cases': {
      hint: 'Think about where crypto appears in your code: TLS connections, database encryption, API authentication, signed artifacts.',
      hintBeginner:
        'Where does your code use encryption? HTTPS connections, database encryption, JWT tokens, and code signing are common examples.',
    },
    retention: {
      hint: 'Consider how long the data your code processes must remain confidential — database backups and archives count.',
      hintBeginner:
        'How long does the data your app handles need to stay secret? Include database backups — they often outlive the application itself.',
    },
    credential: {
      hint: 'Check your certificate validity periods, code signing certificate lifetimes, and JWT token expiry configurations.',
      hintBeginner:
        'How long are your SSL certificates valid? How long do your JWT tokens last? Check your TLS config and auth setup.',
      hintExpert:
        'Map all credential chains: TLS leaf certs, code signing certs, CA intermediates, JWT signing keys, API key rotation policies, and mTLS client certificates.',
    },
    scale: {
      hint: 'Count services, microservices, and applications that use crypto operations — including transitive dependencies on crypto libraries.',
      hintBeginner:
        'How many services or apps does your team maintain that use encryption? Include anything with HTTPS, database encryption, or authentication.',
    },
    agility: {
      hint: 'Fully abstracted = all crypto behind a provider/factory pattern. Hardcoded = algorithms referenced directly in business logic.',
      hintBeginner:
        'Is your encryption code in one place (a library or service) or scattered throughout the codebase? Centralized = easier to migrate.',
      hintExpert:
        'Evaluate: provider/factory pattern, algorithm negotiation support, runtime algorithm selection, and whether cipher suites are configurable without code changes.',
      recommendedOptions: ['fully-abstracted', 'partially-abstracted'],
      title: 'How is crypto implemented in your codebase?',
      description: 'Fully abstracted = all crypto behind a provider/factory pattern.',
    },
    infra: {
      hint: 'Include cloud KMS, HSMs, and any certificate authorities your code interacts with programmatically.',
      hintBeginner:
        'Does your code call cloud KMS (AWS KMS, Azure Key Vault), use HSMs, or interact with a certificate authority? If not sure, select "I don\'t know".',
      hintExpert:
        'Include cloud KMS APIs, HSM PKCS#11 integrations, internal CA REST endpoints, ACME clients, and any hardware security modules accessed via SDKs.',
      title: 'What crypto infrastructure does your code interact with?',
      description:
        'Include cloud KMS, HSMs, and certificate authorities you call programmatically.',
    },
    vendors: {
      hint: 'Consider crypto libraries (OpenSSL, BoringSSL, libsodium), cloud SDKs, and SaaS APIs that handle encryption.',
      hintBeginner:
        'What crypto libraries does your code depend on? OpenSSL, BoringSSL, Node crypto, or cloud SDKs all count as vendor dependencies.',
      hintExpert:
        'Map all crypto providers: TLS libraries, cloud KMS SDKs, HSM PKCS#11 drivers, certificate management APIs, and any SaaS encryption endpoints.',
    },
    timeline: {
      hint: 'If your organization has a PQC migration deadline, select it. Otherwise, consider the deadline of your most pressing compliance framework.',
      hintBeginner:
        'Does your organization have a deadline for upgrading encryption? If not, check if your compliance framework (PCI DSS, FedRAMP) has one.',
    },
  },
  architect: {
    industry: {
      hint: 'Industry determines compliance requirements across your architecture — different subsystems may fall under different regulatory scopes.',
      hintBeginner:
        'Your industry affects which security standards each part of your system must meet. Select the primary sector your architecture serves.',
      title: 'What industry does your architecture serve?',
      description:
        'Different subsystems may have different compliance requirements based on industry.',
    },
    country: {
      hint: "Multi-jurisdiction architectures face compound compliance. Consider where data transits, not just where it's stored.",
      hintBeginner:
        'Where does your system operate? If you serve multiple countries, pick your primary jurisdiction — the assessment will highlight cross-border considerations.',
      hintExpert:
        "Consider data sovereignty: where crypto keys are generated, where data transits, and where it's stored. Each jurisdiction may mandate different algorithms.",
      title: 'What is the primary jurisdiction for your architecture?',
      description:
        'Multi-jurisdiction systems face compound compliance. Consider data transit paths.',
    },
    crypto: {
      hint: 'Map all algorithms across your system topology — consider protocol-level (TLS, VPN), storage-level (KMS), and identity-level (PKI, CA) uses.',
      hintBeginner:
        'Think about encryption across your whole system — not just one service. TLS, VPNs, databases, and identity systems may all use different algorithms.',
      hintExpert:
        'Map the full cryptographic inventory: TLS cipher suites per endpoint, VPN IKE/ESP algorithms, KMS wrapping keys, CA signing algorithms, S/MIME, and any custom crypto in firmware.',
      title: 'Map your cryptographic footprint across all layers',
      description:
        'Consider protocol-level (TLS, VPN), storage-level (KMS), and identity-level (PKI, CA) algorithms.',
    },
    sensitivity: {
      hint: 'Assess sensitivity across data flows — data may be low-sensitivity at rest but critical in transit between systems.',
      hintBeginner:
        'Data sensitivity can change depending on where it is in your system. Consider the most sensitive point in each data flow.',
    },
    compliance: {
      hint: 'Consider frameworks that apply to each component in your architecture — different subsystems may have different compliance requirements.',
      hintBeginner:
        'Different parts of your system may need to meet different standards. Select all frameworks that apply to any component.',
    },
    migration: {
      hint: 'Has any part of your architecture been updated for PQC? Hybrid TLS, updated KMS configurations, or PKI re-keying all count.',
      hintBeginner:
        'Has any part of your system been upgraded for quantum safety? Even a single service using hybrid TLS counts as "started".',
      title: 'Has any part of your architecture been updated for PQC?',
      description: 'Hybrid TLS, updated KMS, or PKI re-keying all count.',
    },
    'use-cases': {
      hint: 'Consider the full dependency graph: service-to-service mTLS, internal CA chains, key management flows, and secure boot chains.',
      hintBeginner:
        'Where does encryption appear in your architecture? Think about connections between services, certificate chains, key storage, and device authentication.',
    },
    retention: {
      hint: 'Assess retention across the architecture — some data stores (backups, archives, compliance vaults) may have much longer lifetimes.',
      hintBeginner:
        'Consider data across your whole system — backups and archives often live much longer than active databases.',
    },
    credential: {
      hint: 'Map all credential chains: root CA certificates, intermediate CAs, leaf certificates, signed firmware images, and code signing keys.',
      hintBeginner:
        'Certificates and signing keys have different lifetimes throughout your system. Root CAs can last 20+ years; leaf certs are typically 1-2 years.',
      hintExpert:
        'Map the full chain: root CA (10-30yr), intermediate CAs (5-10yr), leaf TLS (90d-2yr), code signing (3-5yr), firmware signing (device lifetime), mTLS client certs.',
    },
    scale: {
      hint: 'Include systems that consume cryptographic services indirectly (e.g., microservices calling an internal CA or KMS).',
      hintBeginner:
        'Count all systems in your architecture that use encryption — even indirectly through shared services like a KMS or internal CA.',
    },
    agility: {
      hint: 'Evaluate whether your crypto abstraction layer supports algorithm negotiation and hybrid schemes. This determines migration architecture.',
      hintBeginner:
        'Can your system switch encryption algorithms without major redesign? This is the single biggest factor in how hard migration will be.',
      hintExpert:
        'Evaluate: AEAD/KEM abstraction depth, algorithm negotiation in protocol handshakes, hybrid combiner support, and whether algorithm selection propagates through service mesh configs.',
      title: 'Does your crypto abstraction layer support algorithm negotiation?',
      description:
        'This determines your migration architecture — from re-keying to full re-engineering.',
    },
    infra: {
      hint: 'Consider the full dependency graph: HSMs in your trust root, cloud KMS for data-at-rest, legacy systems with firmware crypto, and embedded devices.',
      hintBeginner:
        'Map the infrastructure that handles encryption in your system: HSMs, cloud key management, legacy systems, and any specialized hardware.',
      hintExpert:
        'Include: HSMs (trust root + backup), cloud KMS (per-region), on-prem PKI, legacy crypto appliances, embedded crypto in IoT/OT, and network encryption appliances.',
      title: 'Map your full crypto dependency graph',
      description: 'HSMs in your trust root, cloud KMS, legacy systems, and embedded devices.',
    },
    vendors: {
      hint: 'Map which crypto operations are vendor-controlled vs. in-house. Vendor timelines constrain your migration schedule.',
      hintBeginner:
        'Which parts of your encryption are managed by external vendors vs. your own team? Vendor-controlled components migrate on their schedule, not yours.',
    },
    timeline: {
      hint: 'Align your timeline with the most constrained component in your architecture — the slowest subsystem sets the pace.',
      hintBeginner:
        "Your migration deadline is set by the slowest component in your system. If one subsystem takes 3 years to migrate, that's your real timeline.",
    },
  },
  researcher: {
    industry: {
      hint: 'Industry is an input variable to the scoring model — it drives compliance framework selection, threat category mapping, and industry-specific retention defaults.',
      title: 'Select an industry for analysis',
      description:
        'Industry drives framework filtering, threat mapping, and retention defaults in the scoring model.',
    },
    country: {
      hint: 'Country drives regulatory pressure scoring via deadline proximity, mandate strength, and enforcement body reputation.',
      hintExpert:
        'Country selection feeds the regulatory pressure multiplier (1.0-1.3). Deadlines are sourced from the timeline CSV; closer deadlines increase the multiplier exponentially.',
      title: 'Select a jurisdiction for analysis',
      description:
        'Country drives deadline proximity, mandate strength, and regulatory pressure scoring.',
    },
    crypto: {
      hint: 'Select all algorithms for comprehensive analysis. Each quantum-vulnerable algorithm generates specific migration recommendations with NIST FIPS references.',
      hintExpert:
        'Each algorithm maps to a NIST migration path: RSA→ML-KEM (FIPS 203), ECDSA→ML-DSA (FIPS 204), SHA-2→SHA-3 (FIPS 202). Symmetric algorithms are quantum-resistant at sufficient key sizes.',
    },
    sensitivity: {
      hint: 'Multiple sensitivity levels can be selected. The scoring engine uses the maximum across selections for worst-case HNDL risk analysis.',
      hintExpert:
        'Sensitivity drives the data_value_score (0-30 range). "Top Secret" = 30, "Public" = 5. The maximum across all selections is used for the HNDL risk window calculation.',
    },
    compliance: {
      hint: 'Each selected framework is scored for PQC mandate status, deadline proximity, and enforcement body. Closer deadlines increase regulatory pressure.',
      hintExpert:
        'Framework scoring: mandate_weight × deadline_proximity × enforcement_strength. Frameworks with explicit PQC mandates (CNSA 2.0, BSI TR) receive 2× weight.',
    },
    migration: {
      hint: 'Migration status affects the organizational readiness score. "Started" gives the largest risk reduction; "unknown" applies conservative defaults.',
      hintExpert:
        'Readiness multipliers: started=0.3, planning=0.5, not-started=0.8, unknown=0.7. Lower = better organizational readiness. "Unknown" is slightly better than "not-started" due to Bayesian prior.',
    },
    'use-cases': {
      hint: 'Each use case has HNDL relevance, HNFL relevance, and migration priority weights that feed into the composite risk score.',
      hintExpert:
        'Use cases have independent HNDL and HNFL weights. Key exchange/encryption use cases dominate HNDL; signing/authentication dominate HNFL. Weights are summed and normalized.',
    },
    retention: {
      hint: 'Retention years drive the HNDL risk window calculation: data expiry year minus estimated CRQC arrival year. Industry-specific defaults apply when unknown.',
      hintExpert:
        'HNDL window = retention_years - (CRQC_year - current_year). Positive = data still sensitive when CRQC arrives. Industry defaults: Finance=10yr, Healthcare=30yr, Government=50yr.',
    },
    credential: {
      hint: 'Credential lifetime drives the HNFL risk window. Only affects scoring when signing algorithms (RSA, ECDSA, Ed25519) are present.',
      hintExpert:
        'HNFL window = credential_years - (CRQC_year - current_year). Only nonzero when signature algorithms are selected. Maximum across all credential types is used.',
    },
    scale: {
      hint: 'System scale and team capacity create a capacity gap ratio that feeds into organizational readiness scoring.',
      hintExpert:
        'Capacity gap = systems_count / team_capacity. Ratios >50 increase migration complexity. Team size categories: 1-5=micro, 6-20=small, 21-100=medium, 100+=large.',
    },
    agility: {
      hint: 'Crypto agility is the single largest factor in migration complexity scoring (40% weight). "Hardcoded" = 0.9 factor, "fully-abstracted" = 0.2.',
      hintExpert:
        'Agility multipliers: fully-abstracted=0.2, partially-abstracted=0.5, hardcoded=0.9, unknown=0.7. This is the dominant factor in migration_complexity_score.',
    },
    infra: {
      hint: 'Infrastructure items have individual complexity scores (HSM=15, Legacy=14, Embedded=13, On-prem PKI=12). Sum is capped at 30.',
      hintExpert:
        'Per-item scores: HSM=15, Legacy=14, Embedded=13, On-prem PKI=12, Cloud KMS=8, Cloud HSM=10, Network crypto=11. Total capped at 30, normalized to 0-1 range.',
    },
    vendors: {
      hint: 'Vendor dependency weight ranges from 3 (in-house) to 20 (heavy-vendor). Affects both migration complexity and organizational readiness.',
      hintExpert:
        'Vendor scores: in-house=3, open-source=7, mixed=12, heavy-vendor=20. Feeds both migration_complexity (30% weight) and org_readiness (external dependency factor).',
    },
    timeline: {
      hint: 'Timeline pressure is a multiplier (1.0-1.3) applied to the regulatory pressure score. Country-specific deadlines from the timeline CSV are shown.',
      hintExpert:
        'Pressure multipliers: within-1y=1.3, within-2-3y=1.15, internal-deadline=1.05, no-deadline=1.0, unknown=1.1. Applied after regulatory_pressure_score calculation.',
    },
  },
  ops: {
    industry: {
      hint: 'Your industry determines compliance requirements for your infrastructure — different sectors have different certification mandates and audit cycles.',
      hintBeginner:
        'Select the industry you support. This determines which security certifications and audit requirements apply to your infrastructure.',
      title: 'What industry does your infrastructure support?',
      description:
        'Industry drives infrastructure compliance requirements and certification mandates.',
    },
    country: {
      hint: 'Your deployment jurisdiction determines which cryptographic standards are mandated and which certifications (FIPS, CC, BSI) are required.',
      hintBeginner:
        'Where are your servers and services deployed? Different countries require different encryption certifications.',
      title: 'Where is your infrastructure deployed?',
      description:
        'Deployment jurisdiction determines mandated cryptographic standards and certifications.',
    },
    crypto: {
      hint: 'List algorithms in your production configs — TLS cipher suites, VPN settings, KMS policies, and certificate signing algorithms.',
      hintBeginner:
        'Check your server configs for encryption settings. If you manage TLS certificates or VPN tunnels, those use specific algorithms. Select "I don\'t know" if unsure.',
      hintExpert:
        'Audit: TLS cipher suite ordering, IKEv2/IPsec algorithms, KMS key policies, CA signing algorithms, SSH host key types, DNSSEC algorithms, and any FIPS-validated modules.',
      title: 'What algorithms are active in your production environment?',
      description: 'Check TLS configs, VPN settings, and KMS policies.',
    },
    sensitivity: {
      hint: 'Consider the data flowing through your systems — production databases, backup archives, inter-service traffic, and monitoring logs.',
      hintBeginner:
        'What kind of data passes through your infrastructure? Customer data, financial records, and health info each have different sensitivity levels.',
    },
    compliance: {
      hint: 'Check with your GRC or compliance team about which frameworks apply. Focus on frameworks that affect your infrastructure — FedRAMP, SOC 2, PCI DSS.',
      hintBeginner:
        'Ask your compliance or security team which standards apply. Common infrastructure ones: SOC 2, FedRAMP (government), PCI DSS (payment processing).',
    },
    migration: {
      hint: 'Have you deployed any PQC changes to production? Hybrid TLS configs, certificate re-keying, or KMS updates all count.',
      hintBeginner:
        'Have you changed any encryption settings in production for quantum safety? Even updating a cipher suite configuration counts.',
      title: 'Have you deployed any PQC changes to production?',
      description: 'Hybrid TLS, cert re-keying, or KMS updates all count.',
    },
    'use-cases': {
      hint: 'Think about where crypto runs in your infrastructure: TLS termination, database encryption at rest, backup encryption, service mesh mTLS, SSH key management.',
      hintBeginner:
        'Where does encryption run in your systems? Web servers (HTTPS), databases, backups, VPNs, and SSH are common places.',
    },
    retention: {
      hint: 'Consider the longest-lived data in your systems — backups, archives, cold storage. These drive your HNDL risk window.',
      hintBeginner:
        'How long do your backups and archives need to stay protected? Backups often last longer than people expect — check your retention policies.',
    },
    credential: {
      hint: 'Check your CA certificate validity, TLS cert rotation schedules, SSH key rotation policies, and code signing cert lifetimes.',
      hintBeginner:
        'How long are your certificates valid? Check your TLS certs, SSH keys, and any CA certificates you manage.',
      hintExpert:
        'Map all credential lifetimes: root CA (10-30yr), intermediate CA (3-10yr), TLS leaf (90d via ACME to 2yr), SSH host keys (rotation schedule), code signing (3-5yr).',
    },
    scale: {
      hint: 'Count production systems: servers, containers, IoT devices, network appliances, and HSMs that use crypto operations.',
      hintBeginner:
        'How many servers, containers, and devices do you manage that use encryption? Include everything — even network appliances and IoT devices.',
    },
    agility: {
      hint: 'Evaluate your infrastructure automation: can you rotate algorithms via config management (Ansible, Terraform) or does it require manual changes per system?',
      hintBeginner:
        'Can you change encryption settings across all servers from one place (like Ansible or Terraform)? Or do you need to update each system manually?',
      hintExpert:
        'Evaluate: IaC coverage for crypto configs, automated cert rotation (ACME), cipher suite propagation via service mesh, and HSM firmware update automation.',
      title: 'How automated is your crypto configuration management?',
      description: 'Can you change algorithms via config management, or is it manual?',
    },
    infra: {
      hint: 'Map your full crypto infrastructure: load balancers with TLS termination, HSMs, cloud KMS, internal CAs, config management systems, and container registries.',
      hintBeginner:
        'Select the infrastructure you manage that handles encryption — load balancers, key management services, hardware security modules, and internal certificate systems.',
      hintExpert:
        'Include: load balancers (TLS termination), HSMs (on-prem + cloud), KMS (per-cloud-region), internal CA (EJBCA, Vault PKI), network encryption appliances, and container image signing.',
      title: 'Map your crypto infrastructure footprint',
      description:
        'Load balancers, HSMs, cloud KMS, internal CAs, config management, container registries.',
    },
    vendors: {
      hint: 'Consider infrastructure vendors: cloud providers, CDN, DNS, load balancer vendors, HSM manufacturers, and certificate authorities.',
      hintBeginner:
        'Which vendors provide your encryption infrastructure? Cloud providers (AWS, Azure, GCP), CDN providers, and certificate authorities all count.',
    },
    timeline: {
      hint: 'If your organization has a compliance deadline, select it. Otherwise, align with industry peers — check the timeline view for your sector.',
      hintBeginner:
        'When does your infrastructure need to be quantum-safe? Check with your compliance team, or select "I don\'t know" if there\'s no clear deadline yet.',
    },
  },
  curious: {
    industry: {
      hint: "Pick the field that best describes your organization or the area you're curious about. This helps us show you the most relevant information.",
      title: 'What area are you interested in?',
      description: 'This helps us show you threats and rules that matter most to your area.',
    },
    country: {
      hint: 'Pick the country where your organization is based, or just pick where you live. Different countries have different timelines for upgrading their security.',
      title: 'Where are you based?',
      description: 'Different countries have different deadlines for updating encryption.',
    },
    crypto: {
      hint: "Most people don't know this — and that's perfectly fine! Select \"I don't know\" and we'll use safe assumptions.",
      suggestUnknown: true,
      title: 'What kind of encryption is being used?',
      titleBeginner: 'What kind of encryption is being used?',
      description: "It's OK to not know — most people don't. We'll fill in the blanks.",
      descriptionBeginner: "It's OK to not know — most people don't. We'll fill in the blanks.",
    },
    sensitivity: {
      hint: 'Think about the most important information you or your organization protects — customer data, financial records, medical records, trade secrets.',
      title: 'How sensitive is the data being protected?',
      description: 'Think about what kind of information would be most damaging if exposed.',
    },
    compliance: {
      hint: 'These are rules that organizations must follow. If you\'re not sure, select "I don\'t know" — the assessment will still give useful results.',
      suggestUnknown: true,
      title: 'Are there any security rules you need to follow?',
      description: "If you're not sure, that's fine — select \"I don't know\".",
    },
    migration: {
      hint: "Has anyone started upgrading encryption systems? Most organizations haven't yet — that's very normal.",
      suggestUnknown: true,
      title: 'Has anyone started upgrading the encryption?',
      description: "Most organizations haven't started yet — that's completely normal.",
    },
    'use-cases': {
      hint: 'Think about how encryption is used — websites, email, payments, digital signatures. Pick what applies or select "I don\'t know".',
      suggestUnknown: true,
    },
    retention: {
      hint: 'How long does your data need to stay secret? Medical records might be forever, financial records maybe 7 years. If unsure, pick "I don\'t know".',
      suggestUnknown: true,
    },
    credential: {
      hint: "This is about digital certificates and passwords. If you're not sure, select \"I don't know\" — most people aren't familiar with this.",
      suggestUnknown: true,
    },
    scale: {
      hint: 'Give your best guess. "Systems" means computers, servers, and applications. Don\'t worry about being exact.',
    },
    agility: {
      hint: 'This is a very technical question. Select "I don\'t know" — the assessment will use a safe default.',
      suggestUnknown: true,
      title: 'How easy is it to change the encryption?',
      description: 'This is technical — it\'s perfectly fine to select "I don\'t know".',
    },
    infra: {
      hint: 'This asks about specialized encryption hardware. Most people don\'t manage this directly. Select "I don\'t know" if unsure.',
      suggestUnknown: true,
      title: 'Is there special encryption hardware?',
      description: 'This is technical — select "I don\'t know" if you\'re not sure.',
    },
    vendors: {
      hint: 'Do you use outside companies for your technology? Cloud services like AWS, Google Cloud, or Microsoft Azure all count.',
      title: 'Do you rely on outside technology companies?',
      description: 'Cloud services, payment processors, and software vendors all count.',
    },
    timeline: {
      hint: 'When does the encryption need to be upgraded? If there\'s no deadline yet, select "I don\'t know" — most organizations are still figuring this out.',
      suggestUnknown: true,
    },
  },
}

/* ── Persona × Industry overrides ────────────────────────────────────────────
 *
 * Second-layer hint overrides keyed by (persona, normalized industry, step).
 * Fields specified here merge over the persona default. Only seed pairs
 * where the industry framing is clearly distinct from the generic persona
 * copy — otherwise let the persona default apply.
 *
 * Industry key is normalized: lower-case + non-alphanumerics stripped
 * (e.g. "Finance & Banking" → "financebanking"; "Healthcare" → "healthcare").
 */
export const PERSONA_INDUSTRY_STEP_HINTS: Record<
  PersonaId,
  Record<string, Record<string, Partial<PersonaStepHint>>>
> = {
  executive: {
    financebanking: {
      compliance: {
        hint: 'PCI-DSS, SOX, GLBA, Basel III, MiFID II, DORA (EU), FINRA, and the NIST CNSA 2.0 timeline are the most commonly cited frameworks in finance. If unsure, your compliance officer will know which apply.',
      },
      sensitivity: {
        hint: 'In finance, the highest-sensitivity data are customer PII, payment card data, and trading / settlement records. Regulators treat a breach of any as severe.',
      },
      'use-cases': {
        hint: 'In banking, cryptography typically backs SWIFT messaging, card-present / card-not-present payment authorization, trade settlement, and core banking database encryption.',
      },
      retention: {
        hint: 'Banks routinely retain transaction records 7–25 years (SOX, Basel III, FINRA). Long retention pushes HNDL risk higher.',
      },
    },
    healthcare: {
      compliance: {
        hint: 'HIPAA, HITECH, GDPR (for EU patient data), and FDA guidance for connected medical devices are the core frameworks. If unsure, your privacy or clinical-engineering team can confirm.',
      },
      sensitivity: {
        hint: 'In healthcare, the highest-sensitivity data are PHI (patient health records), clinical imaging, and genomic / research data. All are federally protected.',
      },
      'use-cases': {
        hint: 'In healthcare, cryptography typically backs EHR-system encryption, patient portal TLS, medical-device telemetry, and research-data exchange (DICOM, HL7).',
      },
      retention: {
        hint: 'HIPAA requires at least 6 years of medical-record retention; many states extend to 10+ years, and pediatric records can reach 25 years. Long retention pushes HNDL risk higher.',
      },
    },
  },
  developer: {},
  architect: {},
  researcher: {},
  ops: {},
  curious: {},
}
