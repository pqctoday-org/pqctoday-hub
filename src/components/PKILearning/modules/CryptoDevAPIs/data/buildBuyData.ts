// SPDX-License-Identifier: GPL-3.0-only

export type SourcingStrategy = 'build' | 'open-source' | 'commercial'

export interface StrategyProCon {
  text: string
  impact: 'high' | 'medium' | 'low'
}

export interface SourcingStrategyData {
  id: SourcingStrategy
  name: string
  tagline: string
  description: string
  pros: StrategyProCon[]
  cons: StrategyProCon[]
  bestFor: string[]
  avoidWhen: string[]
  pqcImplications: string
  estimatedTCO: {
    year1: string
    year3: string
    year5: string
    breakdown: string
  }
}

export interface WizardQuestion {
  id: string
  question: string
  description: string
  options: {
    label: string
    weights: Record<SourcingStrategy, number> // -2 to +2 influence per strategy
  }[]
}

export interface CaseStudy {
  id: string
  company: string
  industry: string
  strategy: SourcingStrategy
  title: string
  situation: string
  decision: string
  outcome: string
  libraryUsed: string
  lessonsLearned: string[]
}

export const SOURCING_STRATEGIES: SourcingStrategyData[] = [
  {
    id: 'build',
    name: 'Build Your Own',
    tagline: 'Full control, full responsibility',
    description:
      'Develop a proprietary cryptographic library in-house. This gives maximum control over algorithm selection, optimization, and integration but carries enormous engineering and certification costs.',
    pros: [
      { text: 'Full control over algorithm selection and implementation details', impact: 'high' },
      { text: 'Custom optimizations for your specific hardware/use case', impact: 'medium' },
      { text: 'No external supply chain dependency', impact: 'high' },
      { text: 'IP ownership — can license/sell the library', impact: 'low' },
      { text: 'Exact feature set — no bloat from unused algorithms', impact: 'low' },
    ],
    cons: [
      {
        text: 'Extreme engineering cost — requires cryptography PhD-level expertise',
        impact: 'high',
      },
      { text: 'Side-channel resistance is extremely hard to get right', impact: 'high' },
      { text: 'FIPS 140-3 certification costs $200K-500K+ and takes 12-24 months', impact: 'high' },
      { text: 'Ongoing maintenance burden — security patches, algorithm updates', impact: 'high' },
      { text: 'Small team = small audit surface — fewer eyes finding bugs', impact: 'medium' },
      { text: 'Liability risk — if your implementation has a flaw, you own it', impact: 'high' },
    ],
    bestFor: [
      'Companies with dedicated cryptography teams (Google, Amazon, Signal)',
      'Highly specialized hardware platforms not served by existing libraries',
      'National security agencies with classified requirements',
      'Organizations needing algorithms not available in any library',
    ],
    avoidWhen: [
      'Your team lacks deep cryptographic engineering expertise',
      'You need FIPS certification quickly',
      'Budget is constrained (< $2M for crypto engineering)',
      'You are a small/medium enterprise',
    ],
    pqcImplications:
      'Building PQC from scratch is especially risky — NIST standards are recent, implementation subtleties are still being discovered, and side-channel attacks against lattice-based schemes are an active research area. Only Google, Amazon, and a handful of organizations have successfully built PQC implementations.',
    estimatedTCO: {
      year1: '$500K-2M (team, tooling, initial implementation)',
      year3: '$1.5M-5M (certification, ongoing patches, algorithm updates)',
      year5: '$3M-10M (PQC migration, re-certification, team retention)',
      breakdown: 'Engineering: 60%, Certification: 20%, Maintenance: 15%, Audit: 5%',
    },
  },
  {
    id: 'open-source',
    name: 'Open Source',
    tagline: 'Community-audited, transparent, free',
    description:
      'Use established open-source cryptographic libraries (OpenSSL, Bouncy Castle, liboqs, etc.). Benefit from community review and widespread testing, but accept the responsibility for integration, patching, and compliance.',
    pros: [
      { text: 'Free to use — no licensing costs', impact: 'high' },
      { text: 'Community-audited — thousands of developers review the code', impact: 'high' },
      { text: 'Transparent — full source code access for security review', impact: 'high' },
      {
        text: 'Large ecosystem — bindings, documentation, Stack Overflow answers',
        impact: 'medium',
      },
      { text: 'Rapid PQC adoption — OSS projects track NIST standards quickly', impact: 'high' },
      { text: 'No vendor lock-in — can switch between libraries', impact: 'medium' },
    ],
    cons: [
      { text: 'No SLA — security patches depend on community response time', impact: 'medium' },
      {
        text: 'Vulnerability disclosure timing — may be public before you patch',
        impact: 'medium',
      },
      { text: 'Integration burden — you own the build, test, and deployment', impact: 'medium' },
      {
        text: 'Supply chain risk — transitive dependencies may introduce vulnerabilities',
        impact: 'medium',
      },
      { text: 'FIPS validation may not be available or may lag behind', impact: 'medium' },
      { text: 'License compliance (GPL, LGPL) may conflict with your product', impact: 'low' },
    ],
    bestFor: [
      'Most software companies and enterprises',
      'Startups needing rapid PQC prototyping',
      'Organizations with in-house integration expertise',
      'Non-regulated industries or those with flexible compliance timelines',
      'Research and academic institutions',
    ],
    avoidWhen: [
      'You need guaranteed SLA for security response',
      'Regulatory requirements mandate vendor support contracts',
      'Your team cannot maintain and patch open-source dependencies',
    ],
    pqcImplications:
      'Open source leads PQC adoption. OpenSSL oqsprovider, Bouncy Castle, liboqs, and cloudflare/circl provide the fastest path to PQC. However, FIPS certification for PQC is only available through AWS-LC (commercial backing) and wolfSSL (commercial license).',
    estimatedTCO: {
      year1: '$50K-200K (integration engineering, testing)',
      year3: '$150K-500K (maintenance, patching, compliance verification)',
      year5: '$300K-1M (PQC migration, version upgrades, audit)',
      breakdown: 'Integration: 40%, Maintenance: 30%, Testing: 20%, Audit: 10%',
    },
  },
  {
    id: 'commercial',
    name: 'Commercial',
    tagline: 'Vendor support, pre-certified, SLA-backed',
    description:
      'Purchase a commercial cryptographic library or HSM SDK with vendor support (Thales, Entrust, Utimaco, wolfSSL commercial, etc.). Get SLA-backed support, pre-certified FIPS modules, and compliance documentation.',
    pros: [
      { text: 'Vendor SLA — guaranteed response times for security issues', impact: 'high' },
      { text: 'Pre-certified FIPS 140-2/3 — no certification burden', impact: 'high' },
      { text: 'Compliance documentation — audit-ready paperwork', impact: 'high' },
      { text: 'Professional services for integration and migration', impact: 'medium' },
      { text: 'Liability transfer — vendor assumes implementation correctness', impact: 'medium' },
      { text: 'HSM integration — hardware key protection included', impact: 'medium' },
    ],
    cons: [
      { text: 'Significant cost — $50K-500K+/year licensing', impact: 'high' },
      { text: 'Vendor lock-in — switching costs are high', impact: 'high' },
      { text: 'Opaque code — cannot inspect implementation details', impact: 'medium' },
      { text: 'Slower PQC adoption — vendor release cycles lag behind OSS', impact: 'high' },
      { text: 'Feature set dictated by vendor roadmap, not your needs', impact: 'medium' },
      { text: 'Business continuity risk — vendor acquisition/shutdown', impact: 'low' },
    ],
    bestFor: [
      'Financial services (FIPS mandatory, audit requirements)',
      'Healthcare (HIPAA compliance, liability concerns)',
      'Government/defense (Common Criteria, FIPS Level 3+)',
      'Organizations without crypto engineering expertise',
      'Companies needing HSM hardware key protection',
    ],
    avoidWhen: [
      'Budget is constrained',
      'You need cutting-edge PQC algorithms immediately',
      'Vendor lock-in is unacceptable',
      'You have strong in-house crypto expertise',
    ],
    pqcImplications:
      'Commercial vendors are slower to adopt PQC — they wait for final NIST standards and then go through internal QA and FIPS re-certification. Thales Luna HSMs support ML-KEM/ML-DSA via firmware updates. wolfSSL commercial provides PQC + FIPS. Expect 12-24 month lag behind open source for new PQC algorithms.',
    estimatedTCO: {
      year1: '$100K-500K (licensing, integration, training)',
      year3: '$300K-1.5M (annual licensing, support renewals)',
      year5: '$500K-2.5M (ongoing licensing, PQC upgrade fees, re-certification)',
      breakdown: 'Licensing: 50%, Integration: 20%, Support: 20%, Training: 10%',
    },
  },
]

export const WIZARD_QUESTIONS: WizardQuestion[] = [
  {
    id: 'regulation',
    question: 'What are your regulatory requirements?',
    description: 'FIPS 140-3, Common Criteria, or other certifications needed',
    options: [
      {
        label: 'FIPS 140-3 Level 2+ mandatory',
        weights: { build: -1, 'open-source': -1, commercial: 2 },
      },
      {
        label: 'FIPS preferred but not mandatory',
        weights: { build: 0, 'open-source': 1, commercial: 1 },
      },
      {
        label: 'No certification requirements',
        weights: { build: 1, 'open-source': 2, commercial: -1 },
      },
    ],
  },
  {
    id: 'expertise',
    question: "What is your team's cryptographic expertise?",
    description: 'Depth of in-house crypto engineering knowledge',
    options: [
      {
        label: 'Dedicated crypto engineering team',
        weights: { build: 2, 'open-source': 1, commercial: 0 },
      },
      {
        label: 'Some crypto knowledge across team',
        weights: { build: -1, 'open-source': 2, commercial: 1 },
      },
      {
        label: 'No specialized crypto expertise',
        weights: { build: -2, 'open-source': 0, commercial: 2 },
      },
    ],
  },
  {
    id: 'budget',
    question: 'What is your crypto infrastructure budget?',
    description: 'Annual budget for cryptographic library/services',
    options: [
      { label: '> $1M / year', weights: { build: 2, 'open-source': 1, commercial: 2 } },
      { label: '$100K - $1M / year', weights: { build: -1, 'open-source': 2, commercial: 1 } },
      { label: '< $100K / year', weights: { build: -2, 'open-source': 2, commercial: -1 } },
    ],
  },
  {
    id: 'maintenance',
    question: 'What is your long-term maintenance capacity?',
    description: 'Ability to patch, update, and maintain crypto code over 5-10 years',
    options: [
      {
        label: 'Dedicated maintenance team',
        weights: { build: 2, 'open-source': 1, commercial: 0 },
      },
      {
        label: 'Shared responsibility across teams',
        weights: { build: -1, 'open-source': 1, commercial: 1 },
      },
      {
        label: 'Minimal maintenance capacity',
        weights: { build: -2, 'open-source': -1, commercial: 2 },
      },
    ],
  },
  {
    id: 'pqc-urgency',
    question: 'How urgent is your PQC migration timeline?',
    description: 'When do you need production PQC support?',
    options: [
      { label: 'Immediate (< 6 months)', weights: { build: -2, 'open-source': 2, commercial: 0 } },
      { label: 'Near-term (6-18 months)', weights: { build: -1, 'open-source': 1, commercial: 1 } },
      { label: 'Long-term (18+ months)', weights: { build: 1, 'open-source': 1, commercial: 1 } },
    ],
  },
  {
    id: 'liability',
    question: 'What is your liability and compliance exposure?',
    description: 'Legal/financial risk if crypto implementation has a flaw',
    options: [
      {
        label: 'High (financial services, healthcare, government)',
        weights: { build: -1, 'open-source': 0, commercial: 2 },
      },
      {
        label: 'Medium (enterprise B2B, SaaS)',
        weights: { build: 0, 'open-source': 1, commercial: 1 },
      },
      {
        label: 'Low (internal tools, non-sensitive data)',
        weights: { build: 1, 'open-source': 2, commercial: -1 },
      },
    ],
  },
  {
    id: 'vendor-lock-in',
    question: 'How important is avoiding vendor lock-in?',
    description: 'Flexibility to switch crypto providers in the future',
    options: [
      {
        label: 'Critical — must be portable',
        weights: { build: 1, 'open-source': 2, commercial: -2 },
      },
      {
        label: 'Important but not critical',
        weights: { build: 0, 'open-source': 1, commercial: 0 },
      },
      { label: 'Not a concern', weights: { build: 0, 'open-source': 0, commercial: 1 } },
    ],
  },
  {
    id: 'source-audit',
    question: 'Do you need to audit the source code?',
    description: 'Requirement to inspect and review implementation details',
    options: [
      {
        label: 'Yes — must have full source access',
        weights: { build: 2, 'open-source': 2, commercial: -2 },
      },
      {
        label: 'Preferred but not mandatory',
        weights: { build: 1, 'open-source': 1, commercial: 0 },
      },
      {
        label: 'No — vendor certification is sufficient',
        weights: { build: 0, 'open-source': 0, commercial: 2 },
      },
    ],
  },
]

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'google-boringssl',
    company: 'Google',
    industry: 'Technology',
    strategy: 'build',
    title: 'Google forked OpenSSL to create BoringSSL',
    situation:
      'Google needed a crypto library optimized for their specific use cases (Chrome, Android, Google Cloud) with faster release cycles than OpenSSL and no backward compatibility constraints.',
    decision:
      'Forked OpenSSL in 2014, stripped unused code, added their own optimizations, and deployed ML-KEM (Kyber) for TLS in Chrome years before any other browser.',
    outcome:
      'BoringSSL powers billions of daily TLS connections. First production ML-KEM deployment. FIPS 140-2 validated (BoringCrypto module). However, requires a dedicated team of ~15 crypto engineers.',
    libraryUsed: 'BoringSSL (fork of OpenSSL)',
    lessonsLearned: [
      'Only viable with dedicated crypto engineering team (15+ engineers)',
      'Forking is more practical than building from zero',
      'First-mover advantage on PQC was significant',
      'Ongoing maintenance cost is substantial but manageable at Google scale',
    ],
  },
  {
    id: 'amazon-awslc',
    company: 'Amazon Web Services',
    industry: 'Cloud / Technology',
    strategy: 'build',
    title: 'AWS forked BoringSSL to create AWS-LC with FIPS',
    situation:
      'AWS needed FIPS 140-3 validated crypto for government cloud workloads (GovCloud, FedRAMP) while also shipping PQC (ML-KEM) for commercial customers.',
    decision:
      'Forked BoringSSL, added FIPS 140-3 validation process, integrated ML-KEM into the FIPS boundary, and created Rust bindings (aws-lc-rs) for memory safety.',
    outcome:
      'First FIPS 140-3 validated library with PQC (ML-KEM). Powers S2N-TLS across all AWS services. aws-lc-rs enables Rust developers to use FIPS-validated crypto. Cost: dedicated team of ~20 engineers.',
    libraryUsed: 'AWS-LC (fork of BoringSSL)',
    lessonsLearned: [
      'FIPS validation with PQC is possible but requires dedicated effort',
      'Rust bindings (aws-lc-rs) provide memory safety over C code',
      'Fork strategy reduces risk vs building from scratch',
      'FIPS process took 18+ months even with dedicated team',
    ],
  },
  {
    id: 'signal-libsignal',
    company: 'Signal Foundation',
    industry: 'Communications / Privacy',
    strategy: 'build',
    title: 'Signal built custom crypto in Rust for messaging',
    situation:
      'Signal Protocol requires unique cryptographic constructions (Double Ratchet, X3DH) not available in any standard library. Privacy requirements demand full control over implementation.',
    decision:
      'Built libsignal-protocol-rust from scratch using Rust for memory safety. Uses standard primitives (Curve25519, AES-GCM) from established crates but implements protocol logic in-house.',
    outcome:
      'Secure messaging for hundreds of millions of users. Rust ownership model prevents the memory bugs that plague C crypto code. Open-sourced the protocol library.',
    libraryUsed: 'libsignal-protocol-rust (custom) + RustCrypto primitives',
    lessonsLearned: [
      'Building is justified when your protocol is truly unique',
      'Use standard primitives from established libraries — only build protocol logic',
      'Rust significantly reduces implementation bug risk',
      'Open-sourcing enables community audit even for proprietary protocols',
    ],
  },
  {
    id: 'enterprise-openssl',
    company: 'Typical Enterprise (Finance)',
    industry: 'Financial Services',
    strategy: 'open-source',
    title: 'Enterprise bank uses OpenSSL + Bouncy Castle',
    situation:
      'Mid-size bank needs TLS for web services (OpenSSL/Nginx), Java backend crypto (Bouncy Castle), and is beginning PQC readiness assessment under regulatory pressure.',
    decision:
      'Use OpenSSL for TLS termination, Bouncy Castle for Java application crypto, and plan oqsprovider integration for PQC. Supplement with Thales HSM for key protection (commercial component).',
    outcome:
      'Cost-effective crypto stack covering all needs. PQC prototyping via Bouncy Castle ML-KEM/ML-DSA. Hybrid approach: open source for algorithms + commercial HSM for key protection.',
    libraryUsed: 'OpenSSL + Bouncy Castle + Thales Luna HSM',
    lessonsLearned: [
      'Hybrid open-source + commercial is the most common enterprise pattern',
      'Open source for algorithms, commercial for key protection (HSM)',
      'Bouncy Castle provides fastest path to PQC for Java shops',
      'Start PQC prototyping with open source before committing to commercial upgrades',
    ],
  },
  {
    id: 'startup-bc',
    company: 'Typical Startup (SaaS)',
    industry: 'Technology / SaaS',
    strategy: 'open-source',
    title: 'SaaS startup uses Bouncy Castle for PQC-ready signing',
    situation:
      'Document signing SaaS needs to add PQC signature support to differentiate from competitors. Small team (3 developers), limited budget, needs fast time-to-market.',
    decision:
      "Use Bouncy Castle's ML-DSA implementation via JCA provider. Entire PQC integration done in 2 sprints. No FIPS requirement (not in regulated industry).",
    outcome:
      'PQC-ready document signing launched in 4 weeks. Zero licensing cost. JCA provider model means classical and PQC signatures use identical application code.',
    libraryUsed: 'Bouncy Castle (Java, JCA provider)',
    lessonsLearned: [
      'JCA provider model is ideal for algorithm agility',
      'Open source PQC is production-ready for non-regulated use cases',
      'Small teams benefit most from open source — no vendor negotiations',
      'Bouncy Castle lightweight API is more flexible than JCA for advanced use cases',
    ],
  },
]

export const INDUSTRY_FILTER_OPTIONS = [
  { id: 'All', label: 'All Industries' },
  { id: 'finance', label: 'Financial Services' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'government', label: 'Government' },
  { id: 'technology', label: 'Technology' },
]

export const COMPANY_SIZE_FILTER_OPTIONS = [
  { id: 'All', label: 'All Sizes' },
  { id: 'startup', label: 'Startup (< 50)' },
  { id: 'midsize', label: 'Mid-size (50-500)' },
  { id: 'enterprise', label: 'Enterprise (500+)' },
]
