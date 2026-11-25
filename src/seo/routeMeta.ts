// SPDX-License-Identifier: AGPL-3.0-only
import { TOOL_ROUTE_META } from './toolRouteMeta.generated'
import { LEARN_MODULES, type LearnModuleRecord } from '../data/generated/learnModules.generated'

const BASE_URL = 'https://www.pqctoday.com'

export interface RouteMeta {
  title: string
  description: string
  canonical: string
  ogImage?: string
  structuredData?: Record<string, unknown>
  /** When true, PageMeta emits <meta name="robots" content="noindex,follow"> */
  noindex?: boolean
}

/** Per-route SEO metadata for all discoverable pages */
export const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'PQC Today — Post-Quantum Cryptography Migration Hub',
    description:
      'Your guided post-quantum cryptography transformation journey. Learn PQC fundamentals, assess your quantum risk, and migrate your cryptography infrastructure in full compliance with NIST, ANSSI, BSI, and applicable regulatory mandates.',
    canonical: `${BASE_URL}/`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'PQC Today',
          url: BASE_URL,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${BASE_URL}/library?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'Organization',
          name: 'PQC Today',
          url: BASE_URL,
          logo: `${BASE_URL}/pwa-512x512.png`,
          sameAs: [
            'https://github.com/pqctoday-org/pqctoday-hub',
            'https://github.com/pqctoday-org',
            'https://www.youtube.com/@pqctoday',
          ],
        },
        {
          '@type': 'WebApplication',
          name: 'PQC Today',
          url: BASE_URL,
          description:
            'Your guided post-quantum cryptography transformation journey. Learn PQC fundamentals, assess your quantum risk, and migrate your cryptography infrastructure in full compliance with NIST, ANSSI, BSI, and applicable regulatory mandates.',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'Post-Quantum Cryptography Timeline',
            'Interactive ML-KEM and ML-DSA Demos',
            'PKCS#11 HSM Mode via SoftHSMv3 WASM',
            'OpenSSL WASM Studio',
            'PQC Migration Planning',
            'Compliance Tracker (NIST, ANSSI, Common Criteria)',
            '{modules} Hands-on Learning Modules',
            'PQC Risk Assessment Wizard',
            'Migration Software Catalog',
            'PQC Patent Landscape',
            'Enterprise PQC Migration Simulation',
            'CRQC Threat Horizon Dashboard',
            'PQC Business & Governance Tools',
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is post-quantum cryptography (PQC)?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Post-quantum cryptography (PQC) refers to cryptographic algorithms designed to resist attacks from both classical and quantum computers. NIST finalized the first PQC standards in August 2024: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA), with FIPS 206 (FN-DSA) still in development.',
              },
            },
            {
              '@type': 'Question',
              name: 'When will quantum computers break current encryption?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Expert estimates for a Cryptographically Relevant Quantum Computer (CRQC) range from 2029 to 2040. However, "Harvest Now, Decrypt Later" attacks mean adversaries can collect encrypted data today and decrypt it once quantum computers become available, making migration urgent now.',
              },
            },
            {
              '@type': 'Question',
              name: 'What are the NIST PQC standards?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'NIST published three PQC standards in August 2024: FIPS 203 (ML-KEM for key encapsulation), FIPS 204 (ML-DSA for digital signatures), and FIPS 205 (SLH-DSA for hash-based signatures). FIPS 206 (FN-DSA for compact signatures) is still in development — no public draft yet. NIST IR 8547 (final, October 2026) sets the transition timeline: quantum-vulnerable public-key algorithms are deprecated after 2030 and disallowed after 2035.',
              },
            },
          ],
        },
      ],
    },
  },

  '/timeline': {
    title: 'PQC Migration Timeline — Global Deadlines & Milestones | PQC Today',
    description:
      'Track every PQC migration deadline that applies to your organization. Country-by-country regulatory timelines, NIST and EU mandates, and global transition milestones in one interactive view.',
    canonical: `${BASE_URL}/timeline`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Dataset',
          name: 'PQC Migration Timeline',
          description:
            'Global post-quantum cryptography migration deadlines and milestones by country.',
          creator: { '@type': 'Organization', name: 'PQC Today' },
          license: 'https://opensource.org/licenses/GPL-3.0',
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'When does NIST plan to deprecate classical cryptographic algorithms?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Under NIST IR 8547 (final, October 2026), quantum-vulnerable public-key algorithms such as RSA, ECDSA and ECDH are deprecated after 2030 and disallowed under NIST standards after 2035. Organizations should begin planning their migration now to meet these deadlines.',
              },
            },
            {
              '@type': 'Question',
              name: 'Which country has the most aggressive PQC migration deadline?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'France has one of the most aggressive timelines — ANSSI requires PQC support in qualified products by 2025. The CNSA 2.0 Suite requires US national security systems to adopt ML-KEM and ML-DSA by 2025, with all classical algorithms disallowed by 2033.',
              },
            },
            {
              '@type': 'Question',
              name: "What is the EU's coordinated PQC transition plan?",
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'EU Recommendation 2024/1101 calls on all member states to develop coordinated PQC migration plans. Combined with DORA (financial sector), NIS2 (critical infrastructure), and eIDAS 2.0 (digital identity), the EU is building a comprehensive quantum-readiness regulatory framework.',
              },
            },
          ],
        },
      ],
    },
  },

  '/algorithms': {
    title: 'PQC Algorithm Explorer — ML-KEM, ML-DSA, SLH-DSA, FN-DSA | PQC Today',
    description:
      'Compare NIST post-quantum algorithms: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205). Key sizes, performance benchmarks, and security levels.',
    canonical: `${BASE_URL}/algorithms`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ItemList',
          name: 'Post-Quantum Algorithms & Protocols',
          description:
            'NIST standardized and candidate PQC algorithms with key sizes and benchmarks.',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'ML-KEM (FIPS 203)',
              description: 'Module-Lattice Key Encapsulation Mechanism',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'ML-DSA (FIPS 204)',
              description: 'Module-Lattice Digital Signature Algorithm',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'SLH-DSA (FIPS 205)',
              description: 'Stateless Hash-based Digital Signature Algorithm',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'FN-DSA (planned FIPS 206)',
              description:
                'FFT over NTRU-Lattice Digital Signature Algorithm; FIPS 206 remains in development with no published public draft',
            },
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is ML-KEM and what FIPS standard covers it?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'ML-KEM (Module-Lattice Key Encapsulation Mechanism) is standardized in FIPS 203, published August 2024. It is a lattice-based KEM that replaces RSA and ECDH for key exchange, offering three parameter sets: ML-KEM-512 (Level 1), ML-KEM-768 (Level 3), and ML-KEM-1024 (Level 5).',
              },
            },
            {
              '@type': 'Question',
              name: 'What is the recommended PQC replacement for RSA-2048?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'For key exchange, ML-KEM-768 (FIPS 203, NIST Level 3) replaces RSA key transport. For digital signatures, ML-DSA-65 (FIPS 204, NIST Level 3) replaces RSA-2048 signing. Both provide equivalent or higher security against quantum attacks.',
              },
            },
            {
              '@type': 'Question',
              name: 'What is the difference between ML-DSA and SLH-DSA?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'ML-DSA (FIPS 204) is lattice-based with compact signatures (~2.4-4.6 KB) and fast verification, making it the primary choice. SLH-DSA (FIPS 205) is hash-based with larger signatures (~7-50 KB) but relies only on hash function security, serving as a conservative fallback if lattice assumptions are broken.',
              },
            },
          ],
        },
      ],
    },
  },

  '/playground': {
    title: 'PQC Crypto Playground — Test ML-KEM & ML-DSA in Your Browser | PQC Today',
    description:
      'Generate post-quantum keys, encrypt, sign, and verify using ML-KEM, ML-DSA, and 40+ algorithms. Real WASM-powered cryptographic operations in-browser.',
    canonical: `${BASE_URL}/playground`,
  },

  '/openssl': {
    title: 'OpenSSL WASM Studio — Run PQC Commands in Your Browser | PQC Today',
    description:
      'Execute OpenSSL 3.6 commands with PQC algorithm support directly in your browser. Generate ML-KEM keys, create certificates, and test post-quantum TLS.',
    canonical: `${BASE_URL}/openssl`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'OpenSSL WASM Studio',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      description: 'Browser-based OpenSSL 3.6 environment with PQC algorithm support.',
    },
  },

  '/compliance': {
    title: 'PQC Compliance Tracker — NIST, ANSSI, BSI, NCSC Standards | PQC Today',
    description:
      'Stay ahead of your regulatory obligations. Track PQC mandates from NIST, ANSSI, BSI, NCSC, and Common Criteria — with framework timelines, deadlines, and industry-specific requirements in one place.',
    canonical: `${BASE_URL}/compliance`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'PQC Compliance Frameworks',
      description:
        'Post-quantum cryptography compliance requirements from NIST, ANSSI, BSI, NCSC, and Common Criteria.',
      creator: { '@type': 'Organization', name: 'PQC Today' },
      license: 'https://opensource.org/licenses/GPL-3.0',
    },
  },

  '/migrate': {
    title: 'PQC Migration Workbench — Software & Infrastructure PQC Readiness | PQC Today',
    description:
      'Navigate every step of your PQC migration. Track software and infrastructure readiness across 9 infrastructure layers, with FIPS validation status and migration phases mapped to your regulatory obligations.',
    canonical: `${BASE_URL}/migrate`,
  },

  '/business': {
    title: 'Command Center — PQC Readiness Dashboard | PQC Today',
    description:
      'Your executive PQC command center. Live risk scores, compliance tracking, migration pipeline, vendor posture, and actionable next steps — all in one dashboard.',
    canonical: `${BASE_URL}/business`,
  },

  '/business/tools': {
    title: 'Business Tools — PQC Planning & Governance Toolkit | PQC Today',
    description:
      '{businessTools} interactive business planning tools for PQC migration — ROI calculators, RACI builders, vendor scorecards, roadmap planners, and compliance checklists.',
    canonical: `${BASE_URL}/business/tools`,
  },

  '/assess': {
    title: 'PQC Risk Assessment — Quantum Readiness Score for Your Organization | PQC Today',
    description:
      'Understand your quantum risk exposure with a 13-step guided assessment (6-step quick path). Get a personalized migration roadmap aligned with your industry, country, and applicable compliance mandates — NIST, ANSSI, BSI, and more.',
    canonical: `${BASE_URL}/assess`,
  },

  '/report': {
    title: 'PQC Assessment Report — Personalized Quantum Risk Analysis | PQC Today',
    description:
      'View your personalized PQC risk assessment report with migration roadmap, compliance gap analysis, threat landscape, and actionable recommendations.',
    canonical: `${BASE_URL}/report`,
  },

  '/threats': {
    title: 'Quantum Threat Dashboard — Cryptographic Risk Timeline | PQC Today',
    description:
      'Monitor quantum computing threats to cryptography. CRQC timeline estimates, harvest-now-decrypt-later risks, and algorithm vulnerability tracking.',
    canonical: `${BASE_URL}/threats`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a "Harvest Now, Decrypt Later" (HNDL) attack?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In a Harvest Now, Decrypt Later attack, an adversary records encrypted network traffic today and stores it until a sufficiently powerful quantum computer becomes available to decrypt it. This makes data with long confidentiality requirements — such as healthcare records, government secrets, and financial data — vulnerable right now.',
          },
        },
        {
          '@type': 'Question',
          name: 'When will quantum computers be able to break RSA and ECDSA?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Expert estimates for a Cryptographically Relevant Quantum Computer (CRQC) capable of running Shor's algorithm at scale range from 2029 to 2040. A CRQC with approximately 4,000 logical qubits could factor RSA-2048 in hours, breaking both RSA and ECDSA/ECDH.",
          },
        },
        {
          '@type': 'Question',
          name: 'Which industries are most vulnerable to quantum computing threats?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Financial services, healthcare, government/defense, and critical infrastructure face the highest quantum risk due to long data lifetimes, strict regulatory requirements, and the potential for HNDL attacks on currently encrypted communications.',
          },
        },
      ],
    },
  },

  '/leaders': {
    title: 'PQC Industry Leaders — Organizations Migrating to Post-Quantum | PQC Today',
    description:
      'Track which organizations are adopting post-quantum cryptography. Industry leaders, government agencies, and tech companies leading the PQC transition.',
    canonical: `${BASE_URL}/leaders`,
  },

  '/library': {
    title: 'PQC Reference Library — Standards, Research Papers & Guides | PQC Today',
    description:
      'Curated collection of post-quantum cryptography standards (FIPS 203-206), research papers, migration guides, and implementation references.',
    canonical: `${BASE_URL}/library`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'PQC Reference Library',
      description: 'Curated post-quantum cryptography standards, papers, and guides.',
    },
  },

  '/faq': {
    title: 'PQC FAQ — Post-Quantum Cryptography Questions & Answers | PQC Today',
    description:
      'Answers to 100+ common post-quantum cryptography questions: ML-KEM, ML-DSA, NIST FIPS standards, migration timelines, compliance requirements, algorithm comparisons, and industry-specific PQC guidance.',
    canonical: `${BASE_URL}/faq`,
    // FAQPage structured data is injected dynamically by FAQPage component
    // to avoid duplicating 100+ Q&A pairs in this static config
  },

  '/about': {
    title: 'About PQC Today — Open-Source Post-Quantum Cryptography Education',
    description:
      'PQC Today is an open-source platform for post-quantum cryptography education, migration planning, and interactive algorithm demonstrations. GPL-3.0 licensed.',
    canonical: `${BASE_URL}/about`,
  },

  '/terms': {
    title: 'Terms of Service — PQC Today',
    description:
      'Terms of Service for PQC Today, including export compliance (ECCN 5D002), sanctions restrictions, educational-use disclaimers, and privacy policy for embedded cryptographic software.',
    canonical: `${BASE_URL}/terms`,
  },

  '/simulation': {
    title: 'PQC Migration Simulation — Run Your Quantum-Safe Transition | PQC Today',
    description:
      'Play through a full post-quantum cryptography migration for your assessed organization — your sector, size, and jurisdiction. Watch a sample finance-sector run end to end or simulate your own multi-phase transition.',
    canonical: `${BASE_URL}/simulation`,
  },

  '/sponsor': {
    title: 'Sponsor PQC Today — Support Independent Post-Quantum Education | PQC Today',
    description:
      'Back PQC Today, the free and neutral post-quantum cryptography platform. Sponsorship tiers for individuals, teams, and vendors fund open education and reference data while preserving strict editorial independence.',
    canonical: `${BASE_URL}/sponsor`,
  },

  '/editorial-independence': {
    title: 'Editorial Independence Policy | PQC Today',
    description:
      'The binding policy governing how sponsorship and editorial content interact at PQC Today: what sponsorship buys and does not buy, inclusion and assessment criteria, and conflict-of-interest disclosure.',
    canonical: `${BASE_URL}/editorial-independence`,
  },

  '/changelog': {
    title: 'Changelog — PQC Today Version History & Release Notes',
    description:
      'Track new features, improvements, and bug fixes in PQC Today. Detailed version history of the post-quantum cryptography education platform.',
    canonical: `${BASE_URL}/changelog`,
  },

  '/revisions': {
    title: 'Content Revisions — PQC Today Data Trust Log',
    description:
      'Every correction to our compliance, vendor, and migration data, reviewed and logged: what changed, who reviewed it, and why — the audit trail behind the data you rely on.',
    canonical: `${BASE_URL}/revisions`,
  },

  // --- Learning modules ---

  '/learn': {
    title: 'Learn Post-Quantum Cryptography — {modules} Interactive Modules | PQC Today',
    description:
      'Begin your post-quantum transformation with {modules} guided learning modules across 9 tracks. Build the knowledge to assess your risk, plan your migration, and meet your regulatory requirements — from PQC fundamentals to advanced protocol implementation.',
    canonical: `${BASE_URL}/learn`,
  },

  // Every lesson route is a projection of the lessons data file
  // (src/data/learn_modules_*.csv). seo_title, seo_description and seo_name hold
  // the page-specific wording only where it differs from the lesson's own
  // title and description.
  ...Object.fromEntries(
    LEARN_MODULES.map((lesson) => [`/learn/${lesson.id}`, lessonRouteMeta(lesson)])
  ),

  // --- Modules that were in the catalog but had no page entry (title and description are the module's own) ---

  '/explore': {
    title: 'Explore | PQC Today',
    description:
      'Discover post-quantum cryptography resources — interactive timelines, {modules} learning modules, compliance tools, migration guides, and the PQC risk assessment.',
    canonical: `${BASE_URL}/explore`,
  },

  '/patents': {
    title: 'PQC Patent Landscape | PQC Today',
    description:
      'Cryptographic patents relevant to post-quantum migration, enriched with 25 technical dimensions. For research purposes only — not legal or IP advice.',
    canonical: `${BASE_URL}/patents`,
  },

  '/navigate': {
    title: 'Navigate the PQC Knowledge Graph | PQC Today',
    description:
      'Interactive 3D map of the post-quantum cryptography landscape — standards, algorithms, protocols, compliance mandates, industries, use cases, products, vendors, patents, and community leaders, linked by how they relate.',
    canonical: `${BASE_URL}/navigate`,
  },
}

// --- Counts quoted in page copy -------------------------------------------------------------------
// A title or description writes "{modules}" where it quotes the number of Learn modules and
// "{businessTools}" where it quotes the number of Business Tools, in titles, descriptions and structured
// data alike. The /learn course data carries the
// module count and the total study time. They all come from the pages themselves (the module pages
// below, counted the way the app counts them: the catalog without the quiz, and the generated tool
// list), so adding a module or a tool updates every place at once. learnRoutes.test.ts and
// searchRoutes.test.ts tie those sources to the real catalog and registry.
const moduleStudyMinutes = (iso: unknown): number => {
  const text = String(iso ?? '')
  return Number(/(\d+)H/.exec(text)?.[1] ?? 0) * 60 + Number(/(\d+)M/.exec(text)?.[1] ?? 0)
}
const modulePages = Object.entries(ROUTE_META).filter(
  ([path]) => path.startsWith('/learn/') && path !== '/learn/quiz'
)
export const LEARN_MODULE_COUNT = modulePages.length
const LEARN_STUDY_MINUTES = modulePages.reduce(
  (sum, [, meta]) => sum + moduleStudyMinutes(meta.structuredData?.timeRequired),
  0
)

const BUSINESS_TOOL_COUNT = TOOL_ROUTE_META.filter((tool) => tool.kind === 'business-tool').length
const QUOTED_COUNTS: Record<string, number> = {
  '{modules}': LEARN_MODULE_COUNT,
  '{businessTools}': BUSINESS_TOOL_COUNT,
}

/** Fill the count placeholders in a string, or in every string inside structured data. */
function fillCounts(value: unknown): unknown {
  if (typeof value === 'string') {
    return Object.entries(QUOTED_COUNTS).reduce(
      (text, [token, count]) => text.replaceAll(token, String(count)),
      value
    )
  }
  if (Array.isArray(value)) return value.map(fillCounts)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, fillCounts(inner)]))
  }
  return value
}

for (const meta of Object.values(ROUTE_META)) {
  meta.title = fillCounts(meta.title) as string
  meta.description = fillCounts(meta.description) as string
  if (meta.structuredData)
    meta.structuredData = fillCounts(meta.structuredData) as Record<string, unknown>
}

ROUTE_META['/learn']!.structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Post-Quantum Cryptography Learning Path',
  description: `${LEARN_MODULE_COUNT} interactive modules covering PQC fundamentals, protocols, infrastructure, applications, industry verticals, and role-based guides with real cryptographic operations.`,
  provider: { '@type': 'Organization', name: 'PQC Today', url: BASE_URL },
  isAccessibleForFree: true,
  numberOfCredits: LEARN_MODULE_COUNT,
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: `PT${Math.round(LEARN_STUDY_MINUTES / 60)}H`,
  },
}

/** Build a CourseInstance JSON-LD schema for a learning module */
/** Capitalised level word schema.org readers expect: 'advanced' -> 'Advanced'. */
function levelLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function lessonRouteMeta(lesson: LearnModuleRecord): RouteMeta {
  return {
    title: lesson.seoTitle ?? lesson.title,
    description: lesson.seoDescription ?? lesson.description,
    canonical: `${BASE_URL}/learn/${lesson.id}`,
    ...(lesson.difficulty
      ? {
          structuredData: buildModuleSchema(
            lesson.seoName ?? lesson.title,
            `PT${lesson.durationMin}M`,
            levelLabel(lesson.difficulty)
          ),
        }
      : {}),
  }
}

function buildModuleSchema(name: string, duration: string, level: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name,
    provider: { '@type': 'Organization', name: 'PQC Today', url: BASE_URL },
    isAccessibleForFree: true,
    educationalLevel: level,
    timeRequired: duration,
    learningResourceType: 'interactive module',
    inLanguage: 'en',
  }
}

/** Dynamic/child route prefixes that inherit a parent section's title + description. */
const PARENT_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ['/business/tools/', '/business/tools'],
  ['/learn/', '/learn'],
  ['/playground/', '/playground'],
  ['/migrate/', '/migrate'],
  ['/assess/', '/assess'],
  ['/patents/', '/patents'],
  ['/library/', '/library'],
]

const TOOL_META_BY_PATH = new Map(TOOL_ROUTE_META.map((route) => [route.path, route]))

/**
 * Routes that exist but must not be indexed: legacy duplicates of redesigned
 * pages and the signed embed surface. They still resolve to real metadata so the
 * canonical stays self-referential, but PageMeta marks them noindex.
 */
export function isNoindexRoute(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const tool = TOOL_META_BY_PATH.get(normalized)
  return (
    tool?.index === false ||
    normalized.endsWith('/legacy') ||
    normalized === '/embed' ||
    normalized.startsWith('/embed/') ||
    (normalized.startsWith('/business/tools/') && !tool) ||
    (normalized.startsWith('/playground/') && !tool && !Object.hasOwn(ROUTE_META, normalized))
  )
}

/**
 * Match a pathname to its route metadata.
 *
 * Unknown routes NEVER fall back to the homepage's canonical (that would tell
 * search engines the page is a duplicate of the homepage and drop it). Instead
 * the canonical is always self-referential; only the human-readable
 * title/description are inherited from the parent section when available.
 */
export function getRouteMeta(pathname: string): RouteMeta {
  // Normalize trailing slash (but keep the root "/")
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  const noindex = isNoindexRoute(normalized) || undefined
  const selfCanonical = `${BASE_URL}${normalized === '/' ? '/' : normalized}`

  // Exact match — hasOwn guard makes these accesses safe
  if (Object.hasOwn(ROUTE_META, normalized)) {
    // eslint-disable-next-line security/detect-object-injection
    const meta = ROUTE_META[normalized]!
    return noindex ? { ...meta, noindex } : meta
  }

  const tool = TOOL_META_BY_PATH.get(normalized)
  if (tool) {
    return {
      title: tool.title,
      description: tool.description,
      canonical: selfCanonical,
      noindex: tool.index ? undefined : true,
    }
  }

  // Dynamic/child routes — inherit the parent section's title + description, but
  // keep a self-referential canonical and drop the parent's structured data.
  for (const [prefix, parent] of PARENT_PREFIXES) {
    if (normalized.startsWith(prefix) && Object.hasOwn(ROUTE_META, parent)) {
      // eslint-disable-next-line security/detect-object-injection
      const meta = ROUTE_META[parent]!
      return {
        title: meta.title,
        description: meta.description,
        canonical: selfCanonical,
        ogImage: meta.ogImage,
        noindex,
      }
    }
  }

  // Unknown top-level route — generic title + homepage description, self canonical.
  return {
    title: ROUTE_META['/']!.title,
    description: ROUTE_META['/']!.description,
    canonical: selfCanonical,
    noindex,
  }
}
