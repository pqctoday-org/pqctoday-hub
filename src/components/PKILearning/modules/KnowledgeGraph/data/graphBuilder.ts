// SPDX-License-Identifier: GPL-3.0-only

import { libraryData } from '@/data/libraryData'
import { complianceFrameworks } from '@/data/complianceData'
import { timelineData } from '@/data/timelineData'
import { threatsData } from '@/data/threatsData'
import { softwareData } from '@/data/migrateData'
import { certificationXrefs } from '@/data/certificationXrefData'
import { leadersData } from '@/data/leadersData'
import { glossaryTerms } from '@/data/glossaryData'
import { quizQuestions } from '@/data/quizDataLoader'
import { authoritativeSources } from '@/data/authoritativeSourcesData'
import { MODULE_CATALOG, MODULE_TRACKS, MODULE_TO_TRACK } from '@/components/PKILearning/moduleData'
import { PERSONAS } from '@/data/learningPersonas'
import { moduleQaCrossRefs } from '@/data/moduleQaData'
import { vendors } from '@/data/vendorData'
import { algorithmsData as algorithmTransitions } from '@/data/algorithmsData'
import type {
  EntityType,
  RelationshipType,
  GraphNode,
  GraphEdge,
  GraphStats,
  KnowledgeGraph,
} from './graphTypes'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function makeNodeId(type: EntityType, id: string): string {
  return `${type}:${id}`
}

function makeEdgeId(type: RelationshipType, source: string, target: string): string {
  return `${type}:${source}→${target}`
}

function addNode(nodes: Map<string, GraphNode>, node: GraphNode): void {
  nodes.set(node.id, node)
}

function addEdge(
  edges: GraphEdge[],
  edgeSet: Set<string>,
  nodes: Map<string, GraphNode>,
  type: RelationshipType,
  sourceId: string,
  targetId: string,
  label?: string
): void {
  if (!nodes.has(sourceId) || !nodes.has(targetId)) return
  if (sourceId === targetId) return

  const id = makeEdgeId(type, sourceId, targetId)
  if (edgeSet.has(id)) return
  edgeSet.add(id)

  edges.push({
    id,
    source: sourceId,
    target: targetId,
    relationshipType: type,
    label,
    weight: 1,
  })
}

/** Canonical algorithm family patterns derived from libraryData.algorithmFamily */
const ALGORITHM_CANONICAL: { pattern: RegExp; canonical: string }[] = [
  { pattern: /\bml-kem\b/i, canonical: 'ML-KEM' },
  { pattern: /\bml-dsa\b/i, canonical: 'ML-DSA' },
  { pattern: /\bslh-dsa\b/i, canonical: 'SLH-DSA' },
  { pattern: /hash-based\s*\(stateless\)/i, canonical: 'SLH-DSA' },
  { pattern: /hash-based\s*\(stateful\)/i, canonical: 'LMS/XMSS' },
  { pattern: /\bfrodokem\b/i, canonical: 'FrodoKEM' },
  { pattern: /unstructured lattice/i, canonical: 'FrodoKEM' },
  { pattern: /pq\/t hybrid/i, canonical: 'Hybrid PQC' },
  { pattern: /hybrid\s+(pqc|kem)/i, canonical: 'Hybrid PQC' },
  { pattern: /\bqkd\b/i, canonical: 'QKD' },
  { pattern: /\bfn-dsa\b/i, canonical: 'FN-DSA' },
  { pattern: /\bfalcon\b/i, canonical: 'FN-DSA' },
  { pattern: /\bhqc\b/i, canonical: 'HQC' },
  { pattern: /\bclassic[\s-]?mceliece\b/i, canonical: 'Classic McEliece' },
  { pattern: /\bbike\b/i, canonical: 'BIKE' },
  { pattern: /\bntru\b/i, canonical: 'NTRU' },
  { pattern: /\bsphincs\+?\b/i, canonical: 'SLH-DSA' },
  { pattern: /\becdsa\b/i, canonical: 'Classical' },
  { pattern: /\baes\b/i, canonical: 'Classical' },
  { pattern: /hash-based/i, canonical: 'Hash-based' },
  { pattern: /lattice[\s-]based/i, canonical: 'Lattice-based' },
  { pattern: /code[\s-]based/i, canonical: 'Code-based' },
  { pattern: /\bclassical\b/i, canonical: 'Classical' },
  { pattern: /\brsa\b/i, canonical: 'Classical' },
  { pattern: /elliptic curve/i, canonical: 'Classical' },
]

const ALGORITHM_SKIP = new Set([
  'n/a',
  'n/a (certificate framework)',
  'various',
  'various pqc families',
  'all',
  'all pqc families',
  '',
])

function extractAlgorithmFamilies(algorithmFamily: string): string[] {
  if (!algorithmFamily) return []
  if (ALGORITHM_SKIP.has(algorithmFamily.toLowerCase().trim())) return []
  const found = new Set<string>()
  for (const { pattern, canonical } of ALGORITHM_CANONICAL) {
    if (pattern.test(algorithmFamily)) {
      found.add(canonical)
    }
  }
  return Array.from(found)
}

/** Map quiz categories to module IDs where they don't match directly */
const QUIZ_CATEGORY_TO_MODULE: Record<string, string> = {
  'pqc-fundamentals': 'pqc-101',
  'algorithm-families': 'pqc-101',
  'nist-standards': 'pqc-101',
  'migration-planning': 'migration-program',
  compliance: 'compliance-strategy',
  'protocol-integration': 'tls-basics',
  'industry-threats': 'quantum-threats',
  'crypto-operations': 'pki-workshop',
  'pki-infrastructure': 'pki-workshop',
  'key-management': 'kms-pqc',
}

export function buildKnowledgeGraph(): KnowledgeGraph {
  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const edgeSet = new Set<string>()

  // ── 1. Create nodes from each data source ──

  // Library items
  for (const item of libraryData) {
    addNode(nodes, {
      id: makeNodeId('library', item.referenceId),
      entityType: 'library',
      label: item.referenceId,
      description: item.documentTitle,
      metadata: {
        title: item.documentTitle,
        categories: item.categories,
        status: item.status,
      },
      connectionCount: 0,
    })
  }

  // Algorithm family nodes (derived synchronously from libraryData.algorithmFamily)
  const algorithmLibraryCount = new Map<string, number>()
  for (const item of libraryData) {
    for (const family of extractAlgorithmFamilies(item.algorithmFamily)) {
      algorithmLibraryCount.set(family, (algorithmLibraryCount.get(family) ?? 0) + 1)
    }
  }
  for (const [family, count] of algorithmLibraryCount) {
    addNode(nodes, {
      id: makeNodeId('algorithm', slugify(family)),
      entityType: 'algorithm',
      label: family,
      description: `Referenced by ${count} library record${count !== 1 ? 's' : ''}`,
      metadata: { libraryCount: count },
      connectionCount: 0,
    })
  }

  // Compliance frameworks
  for (const fw of complianceFrameworks) {
    addNode(nodes, {
      id: makeNodeId('compliance', fw.id),
      entityType: 'compliance',
      label: fw.label,
      description: fw.description,
      metadata: {
        deadline: fw.deadline,
        requiresPQC: fw.requiresPQC,
        industries: fw.industries,
        countries: fw.countries,
        bodyType: fw.bodyType,
      },
      connectionCount: 0,
    })
  }

  // Timeline events — derive stable IDs from country+org+title
  const timelineEventIds = new Map<string, string>()
  const allTimelineEvents: { countryName: string; orgName: string; title: string }[] = []

  for (const country of timelineData) {
    // Country nodes
    const countryId = makeNodeId('country', country.countryName)
    if (!nodes.has(countryId)) {
      addNode(nodes, {
        id: countryId,
        entityType: 'country',
        label: country.countryName,
        metadata: { flagCode: country.flagCode },
        connectionCount: 0,
      })
    }

    for (const body of country.bodies) {
      for (const event of body.events) {
        const eventSlug = slugify(`${country.countryName}-${body.name}-${event.title}`)
        const eventId = makeNodeId('timeline', eventSlug)
        addNode(nodes, {
          id: eventId,
          entityType: 'timeline',
          label: event.title,
          description: event.description,
          metadata: {
            country: country.countryName,
            org: body.name,
            phase: event.phase,
            startYear: event.startYear,
            endYear: event.endYear,
            type: event.type,
          },
          connectionCount: 0,
        })

        // Store for fuzzy matching with compliance.timelineRefs
        timelineEventIds.set(event.title.toLowerCase(), eventId)
        allTimelineEvents.push({
          countryName: country.countryName,
          orgName: body.name,
          title: event.title,
        })

        // timeline → country edge
        addEdge(edges, edgeSet, nodes, 'timeline-country', eventId, countryId)
      }
    }
  }

  // Ensure country nodes exist for leaders and vendors (not just timeline)
  for (const leader of leadersData) {
    if (!leader.country) continue
    const cid = makeNodeId('country', leader.country)
    if (!nodes.has(cid)) {
      addNode(nodes, {
        id: cid,
        entityType: 'country',
        label: leader.country,
        metadata: {},
        connectionCount: 0,
      })
    }
  }
  for (const vendor of vendors) {
    if (!vendor.hqCountry || vendor.vendorId === 'VND-000') continue
    const cid = makeNodeId('country', vendor.hqCountry)
    if (!nodes.has(cid)) {
      addNode(nodes, {
        id: cid,
        entityType: 'country',
        label: vendor.hqCountry,
        metadata: {},
        connectionCount: 0,
      })
    }
  }

  // Threats
  for (const threat of threatsData) {
    addNode(nodes, {
      id: makeNodeId('threat', threat.threatId),
      entityType: 'threat',
      label: threat.threatId,
      description: threat.description,
      metadata: {
        industry: threat.industry,
        criticality: threat.criticality,
        cryptoAtRisk: threat.cryptoAtRisk,
        pqcReplacement: threat.pqcReplacement,
      },
      connectionCount: 0,
    })
  }

  // Software (migrate)
  for (const sw of softwareData) {
    addNode(nodes, {
      id: makeNodeId('software', sw.softwareName),
      entityType: 'software',
      label: sw.softwareName,
      description: sw.pqcCapabilityDescription,
      metadata: {
        category: sw.categoryId,
        layer: sw.infrastructureLayer,
        pqcSupport: sw.pqcSupport,
        fipsValidated: sw.fipsValidated,
      },
      connectionCount: 0,
    })
  }

  // Certifications
  for (const cert of certificationXrefs) {
    const certNodeId = makeNodeId(
      'certification',
      `${cert.softwareName}-${cert.certType}-${cert.certId}`
    )
    addNode(nodes, {
      id: certNodeId,
      entityType: 'certification',
      label: `${cert.certType}: ${cert.certId}`,
      description: `${cert.certVendor} — ${cert.pqcAlgorithms}`,
      metadata: {
        certType: cert.certType,
        certId: cert.certId,
        vendor: cert.certVendor,
        algorithms: cert.pqcAlgorithms,
        level: cert.certificationLevel,
      },
      connectionCount: 0,
    })

    // software → certification edge
    const swId = makeNodeId('software', cert.softwareName)
    addEdge(edges, edgeSet, nodes, 'software-certified', swId, certNodeId, 'certified by')

    // certification → algorithm (pqcAlgorithms field)
    for (const family of extractAlgorithmFamilies(cert.pqcAlgorithms)) {
      const algoNodeId = makeNodeId('algorithm', slugify(family))
      if (!nodes.has(algoNodeId)) {
        addNode(nodes, {
          id: algoNodeId,
          entityType: 'algorithm',
          label: family,
          description: 'Validated by certifications',
          metadata: { libraryCount: 0 },
          connectionCount: 0,
        })
      }
      addEdge(edges, edgeSet, nodes, 'certification-validates-algorithm', certNodeId, algoNodeId, 'validates')
    }
  }

  // Leaders
  for (const leader of leadersData) {
    addNode(nodes, {
      id: makeNodeId('leader', leader.id),
      entityType: 'leader',
      label: leader.name,
      description: `${leader.title} — ${leader.organizations.join(', ')}`,
      metadata: {
        country: leader.country,
        type: leader.type,
        category: leader.category,
        organizations: leader.organizations,
      },
      connectionCount: 0,
    })

    // leader → country edge
    const countryId = makeNodeId('country', leader.country)
    if (nodes.has(countryId)) {
      addEdge(edges, edgeSet, nodes, 'leader-country', makeNodeId('leader', leader.id), countryId)
    }

    // leader → library (keyResourceUrl — library referenceId values)
    if (leader.keyResourceUrl?.length) {
      for (const ref of leader.keyResourceUrl) {
        addEdge(
          edges,
          edgeSet,
          nodes,
          'leader-references-library',
          makeNodeId('leader', leader.id),
          makeNodeId('library', ref),
          'references'
        )
      }
    }
  }

  // Glossary terms
  for (const term of glossaryTerms) {
    addNode(nodes, {
      id: makeNodeId('glossary', term.term),
      entityType: 'glossary',
      label: term.term,
      description: term.definition,
      metadata: {
        category: term.category,
        complexity: term.complexity,
        acronym: term.acronym,
      },
      connectionCount: 0,
    })
  }

  // Learn modules
  for (const [moduleId, mod] of Object.entries(MODULE_CATALOG)) {
    addNode(nodes, {
      id: makeNodeId('module', moduleId),
      entityType: 'module',
      label: mod.title,
      description: mod.description,
      metadata: {
        duration: mod.duration,
        difficulty: mod.difficulty,
        track: MODULE_TO_TRACK[moduleId] ?? null,
      },
      connectionCount: 0,
    })
  }

  // Learning tracks
  for (const trackDef of MODULE_TRACKS) {
    const trackSlug = slugify(trackDef.track)
    addNode(nodes, {
      id: makeNodeId('track', trackSlug),
      entityType: 'track',
      label: trackDef.track,
      description: `${trackDef.modules.length} learning modules`,
      metadata: {
        moduleCount: trackDef.modules.length,
      },
      connectionCount: 0,
    })
  }

  // Learning personas
  for (const persona of Object.values(PERSONAS)) {
    const pathModules = persona.recommendedPath.filter((id) => id !== 'quiz')
    addNode(nodes, {
      id: makeNodeId('persona', persona.id),
      entityType: 'persona',
      label: persona.label,
      description: persona.description,
      metadata: {
        estimatedMinutes: persona.estimatedMinutes,
        moduleCount: pathModules.length,
      },
      connectionCount: 0,
    })
  }

  // Quiz questions (group by category rather than individual questions)
  const quizByCategory = new Map<string, number>()
  for (const q of quizQuestions) {
    quizByCategory.set(q.category, (quizByCategory.get(q.category) ?? 0) + 1)
  }
  for (const [category, count] of quizByCategory) {
    addNode(nodes, {
      id: makeNodeId('quiz', category),
      entityType: 'quiz',
      label: `Quiz: ${category}`,
      description: `${count} questions in ${category}`,
      metadata: { questionCount: count },
      connectionCount: 0,
    })
  }

  // Authoritative sources
  for (const source of authoritativeSources) {
    addNode(nodes, {
      id: makeNodeId('source', source.sourceName),
      entityType: 'source',
      label: source.sourceName,
      description: source.description,
      metadata: {
        type: source.sourceType,
        region: source.region,
        url: source.primaryUrl,
      },
      connectionCount: 0,
    })
  }

  // Vendors
  for (const vendor of vendors) {
    if (!vendor.vendorId || vendor.vendorId === 'VND-000') continue
    addNode(nodes, {
      id: makeNodeId('vendor', vendor.vendorId),
      entityType: 'vendor',
      label: vendor.vendorDisplayName,
      description: `${vendor.vendorName} — ${vendor.entityCategory}`,
      metadata: {
        country: vendor.hqCountry,
        type: vendor.vendorType,
        category: vendor.entityCategory,
        pqcCommitment: vendor.pqcCommitment,
        productCount: vendor.productCount ?? 0,
      },
      connectionCount: 0,
    })
  }

  // ── 2. Create edges from relationship fields ──

  // library → library (dependencies)
  for (const item of libraryData) {
    if (!item.dependencies) continue
    const deps = item.dependencies
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
    for (const dep of deps) {
      addEdge(
        edges,
        edgeSet,
        nodes,
        'library-depends-on',
        makeNodeId('library', item.referenceId),
        makeNodeId('library', dep),
        'depends on'
      )
    }
  }

  // library → module (moduleIds)
  for (const item of libraryData) {
    if (!item.moduleIds?.length) continue
    for (const modId of item.moduleIds) {
      addEdge(
        edges,
        edgeSet,
        nodes,
        'library-teaches',
        makeNodeId('library', item.referenceId),
        makeNodeId('module', modId),
        'teaches'
      )
    }
  }

  // library → algorithm (algorithmFamily field)
  for (const item of libraryData) {
    for (const family of extractAlgorithmFamilies(item.algorithmFamily)) {
      addEdge(
        edges,
        edgeSet,
        nodes,
        'library-covers-algorithm',
        makeNodeId('library', item.referenceId),
        makeNodeId('algorithm', slugify(family)),
        'covers'
      )
    }
  }

  // compliance → library (libraryRefs)
  for (const fw of complianceFrameworks) {
    for (const ref of fw.libraryRefs) {
      if (!ref) continue
      addEdge(
        edges,
        edgeSet,
        nodes,
        'compliance-references',
        makeNodeId('compliance', fw.id),
        makeNodeId('library', ref),
        'references'
      )
    }
  }

  // compliance → timeline (timelineRefs — fuzzy match on title)
  for (const fw of complianceFrameworks) {
    for (const ref of fw.timelineRefs) {
      if (!ref) continue
      const matchedId = timelineEventIds.get(ref.toLowerCase())
      if (matchedId) {
        addEdge(
          edges,
          edgeSet,
          nodes,
          'compliance-timeline',
          makeNodeId('compliance', fw.id),
          matchedId,
          'cites'
        )
      }
    }
  }

  // compliance → country (countries array)
  for (const fw of complianceFrameworks) {
    if (!fw.countries?.length) continue
    for (const country of fw.countries) {
      if (!country) continue
      addEdge(
        edges,
        edgeSet,
        nodes,
        'compliance-applies-to-country',
        makeNodeId('compliance', fw.id),
        makeNodeId('country', country)
      )
    }
  }

  // threat → module (relatedModules)
  for (const threat of threatsData) {
    if (!threat.relatedModules?.length) continue
    for (const modId of threat.relatedModules) {
      addEdge(
        edges,
        edgeSet,
        nodes,
        'threat-teaches',
        makeNodeId('threat', threat.threatId),
        makeNodeId('module', modId),
        'informs'
      )
    }
  }

  // glossary → module/entity (relatedModule)
  // /learn/X           → module node
  // /library?ref=X     → specific library node
  // /algorithms        → algorithm node matched by term name
  // /threats           → threat node matched by term name
  // /migrate, /compliance, /timeline, /library, /playground, /openssl → no single entity anchor; skip
  for (const term of glossaryTerms) {
    if (!term.relatedModule) continue
    const route = term.relatedModule
    const glossaryNodeId = makeNodeId('glossary', term.term)

    if (route.startsWith('/learn/')) {
      const modId = route.replace('/learn/', '')
      addEdge(edges, edgeSet, nodes, 'glossary-teaches', glossaryNodeId, makeNodeId('module', modId))
    } else if (route.startsWith('/library?ref=')) {
      const refId = decodeURIComponent(route.replace('/library?ref=', ''))
      addEdge(edges, edgeSet, nodes, 'glossary-teaches', glossaryNodeId, makeNodeId('library', refId))
    } else if (route === '/algorithms') {
      // Exact match first, then substring fallback
      const exactId = makeNodeId('algorithm', term.term)
      if (nodes.has(exactId)) {
        addEdge(edges, edgeSet, nodes, 'glossary-teaches', glossaryNodeId, exactId)
      } else {
        for (const [nid, node] of nodes) {
          if (node.entityType === 'algorithm' && node.label.toLowerCase().includes(term.term.toLowerCase())) {
            addEdge(edges, edgeSet, nodes, 'glossary-teaches', glossaryNodeId, nid)
            break
          }
        }
      }
    } else if (route === '/threats') {
      for (const [nid, node] of nodes) {
        if (
          node.entityType === 'threat' &&
          (node.label.toLowerCase().includes(term.term.toLowerCase()) ||
            (node.description ?? '').toLowerCase().includes(term.term.toLowerCase()))
        ) {
          addEdge(edges, edgeSet, nodes, 'glossary-teaches', glossaryNodeId, nid)
          break
        }
      }
    }
  }

  // quiz (by category) → module
  for (const category of quizByCategory.keys()) {
    const moduleId = QUIZ_CATEGORY_TO_MODULE[category] ?? category
    addEdge(
      edges,
      edgeSet,
      nodes,
      'quiz-teaches',
      makeNodeId('quiz', category),
      makeNodeId('module', moduleId)
    )
  }

  // software → module (learningModules)
  for (const sw of softwareData) {
    if (!sw.learningModules) continue
    const mods = sw.learningModules
      .split(';')
      .map((m) => m.trim())
      .filter(Boolean)
    for (const modId of mods) {
      addEdge(
        edges,
        edgeSet,
        nodes,
        'software-teaches',
        makeNodeId('software', sw.softwareName),
        makeNodeId('module', modId)
      )
    }
  }

  // vendor → software (via vendorId on softwareData)
  for (const sw of softwareData) {
    if (!sw.vendorId) continue
    addEdge(
      edges,
      edgeSet,
      nodes,
      'vendor-produces',
      makeNodeId('vendor', sw.vendorId),
      makeNodeId('software', sw.softwareName),
      'produces'
    )
  }

  // vendor → country
  for (const vendor of vendors) {
    if (!vendor.vendorId || vendor.vendorId === 'VND-000' || !vendor.hqCountry) continue
    const countryId = makeNodeId('country', vendor.hqCountry)
    if (nodes.has(countryId)) {
      addEdge(edges, edgeSet, nodes, 'vendor-country', makeNodeId('vendor', vendor.vendorId), countryId)
    }
  }

  // software → algorithm (via pqcSupport field)
  for (const sw of softwareData) {
    if (!sw.pqcSupport) continue
    for (const family of extractAlgorithmFamilies(sw.pqcSupport)) {
      const algoNodeId = makeNodeId('algorithm', slugify(family))
      if (!nodes.has(algoNodeId)) {
        addNode(nodes, {
          id: algoNodeId,
          entityType: 'algorithm',
          label: family,
          description: 'Implemented by software products',
          metadata: { libraryCount: 0 },
          connectionCount: 0,
        })
      }
      addEdge(edges, edgeSet, nodes, 'software-implements-algorithm', makeNodeId('software', sw.softwareName), algoNodeId, 'implements')
    }
  }

  // authoritative sources → entity types (via boolean flags)
  // Pre-compute first node per entity type to avoid O(n²) scan inside the loop
  const sourceFieldMap: {
    field: keyof (typeof authoritativeSources)[0]
    targetType: EntityType
  }[] = [
    { field: 'libraryCsv', targetType: 'library' },
    { field: 'complianceCsv', targetType: 'compliance' },
    { field: 'timelineCsv', targetType: 'timeline' },
    { field: 'threatsCsv', targetType: 'threat' },
    { field: 'migrateCsv', targetType: 'software' },
    { field: 'leadersCsv', targetType: 'leader' },
  ]

  const firstByType = new Map<EntityType, string>()
  for (const node of nodes.values()) {
    if (!firstByType.has(node.entityType)) {
      firstByType.set(node.entityType, node.id)
    }
  }

  for (const source of authoritativeSources) {
    const sourceId = makeNodeId('source', source.sourceName)
    for (const { field, targetType } of sourceFieldMap) {
      const targetId = firstByType.get(targetType)
      if (source[field] && targetId) {
        addEdge(edges, edgeSet, nodes, 'source-feeds', sourceId, targetId, `feeds ${targetType}`)
      }
    }
  }

  // module → track edges
  for (const trackDef of MODULE_TRACKS) {
    const trackNodeId = makeNodeId('track', slugify(trackDef.track))
    for (const mod of trackDef.modules) {
      addEdge(
        edges,
        edgeSet,
        nodes,
        'module-in-track',
        makeNodeId('module', mod.id),
        trackNodeId,
        'in track'
      )
    }
  }

  // persona → module edges (recommended learning paths)
  for (const persona of Object.values(PERSONAS)) {
    const personaNodeId = makeNodeId('persona', persona.id)
    for (const moduleId of persona.recommendedPath) {
      if (moduleId === 'quiz') continue
      addEdge(
        edges,
        edgeSet,
        nodes,
        'persona-recommends',
        personaNodeId,
        makeNodeId('module', moduleId),
        'recommends'
      )
    }
  }

  // module → * edges (QA cross-references from module_qa_combined CSV)
  for (const qa of moduleQaCrossRefs) {
    const moduleNodeId = makeNodeId('module', qa.moduleId)
    if (!nodes.has(moduleNodeId)) continue

    for (const ref of qa.libraryRefs) {
      addEdge(edges, edgeSet, nodes, 'module-qa-references', moduleNodeId, makeNodeId('library', ref), 'references')
    }
    for (const ref of qa.complianceRefs) {
      addEdge(edges, edgeSet, nodes, 'module-qa-references', moduleNodeId, makeNodeId('compliance', ref), 'references')
    }
    for (const ref of qa.threatRefs) {
      addEdge(edges, edgeSet, nodes, 'module-qa-references', moduleNodeId, makeNodeId('threat', ref), 'references')
    }
    for (const ref of qa.leaderRefs) {
      addEdge(edges, edgeSet, nodes, 'module-qa-references', moduleNodeId, makeNodeId('leader', ref), 'references')
    }
    for (const ref of qa.migrateRefs) {
      addEdge(edges, edgeSet, nodes, 'module-qa-references', moduleNodeId, makeNodeId('software', ref), 'references')
    }
    for (const ref of qa.algorithmRefs) {
      const algoSlug = slugify(ref)
      const algoNodeId = makeNodeId('algorithm', algoSlug)
      if (!nodes.has(algoNodeId)) {
        addNode(nodes, {
          id: algoNodeId,
          entityType: 'algorithm',
          label: ref,
          description: 'Referenced by module Q&A',
          metadata: { libraryCount: 0 },
          connectionCount: 0,
        })
      }
      addEdge(edges, edgeSet, nodes, 'module-qa-references', moduleNodeId, algoNodeId, 'references')
    }
  }

  // threat → algorithm edges (cryptoAtRisk and pqcReplacement fields)
  for (const threat of threatsData) {
    const threatNodeId = makeNodeId('threat', threat.threatId)

    const atRisk = extractAlgorithmFamilies(threat.cryptoAtRisk)
    for (const family of atRisk) {
      const algoNodeId = makeNodeId('algorithm', slugify(family))
      if (!nodes.has(algoNodeId)) {
        addNode(nodes, {
          id: algoNodeId,
          entityType: 'algorithm',
          label: family,
          description: 'Targeted by threats',
          metadata: { libraryCount: 0 },
          connectionCount: 0,
        })
      }
      addEdge(
        edges,
        edgeSet,
        nodes,
        'threat-targets-algorithm',
        threatNodeId,
        algoNodeId,
        'targets'
      )
    }

    const replacements = extractAlgorithmFamilies(threat.pqcReplacement)
    for (const family of replacements) {
      const algoNodeId = makeNodeId('algorithm', slugify(family))
      if (!nodes.has(algoNodeId)) {
        addNode(nodes, {
          id: algoNodeId,
          entityType: 'algorithm',
          label: family,
          description: 'PQC replacement algorithm',
          metadata: { libraryCount: 0 },
          connectionCount: 0,
        })
      }
      addEdge(
        edges,
        edgeSet,
        nodes,
        'threat-targets-algorithm',
        threatNodeId,
        algoNodeId,
        'replaced by'
      )
    }
  }

  // algorithm transitions (classical → PQC replacement chains)
  for (const transition of algorithmTransitions) {
    const classicalFamilies = extractAlgorithmFamilies(transition.classical)
    const pqcFamilies = extractAlgorithmFamilies(transition.pqc)

    for (const classical of classicalFamilies) {
      const classicalNodeId = makeNodeId('algorithm', slugify(classical))
      if (!nodes.has(classicalNodeId)) {
        addNode(nodes, {
          id: classicalNodeId,
          entityType: 'algorithm',
          label: classical,
          description: 'Classical algorithm being replaced',
          metadata: { libraryCount: 0 },
          connectionCount: 0,
        })
      }

      for (const pqc of pqcFamilies) {
        const pqcNodeId = makeNodeId('algorithm', slugify(pqc))
        if (!nodes.has(pqcNodeId)) {
          addNode(nodes, {
            id: pqcNodeId,
            entityType: 'algorithm',
            label: pqc,
            description: 'PQC replacement algorithm',
            metadata: { libraryCount: 0 },
            connectionCount: 0,
          })
        }
        addEdge(edges, edgeSet, nodes, 'algorithm-replaces', pqcNodeId, classicalNodeId, 'replaces')
      }
    }
  }

  // ── 3. Build adjacency map and compute connection counts ──

  const adjacency = new Map<string, Set<string>>()
  for (const node of nodes.values()) {
    adjacency.set(node.id, new Set())
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target)
    adjacency.get(edge.target)?.add(edge.source)
  }

  // Update connection counts on nodes
  for (const [nodeId, neighbors] of adjacency) {
    const node = nodes.get(nodeId)
    if (node) {
      node.connectionCount = neighbors.size
    }
  }

  // ── 4. Build nodesByType map ──

  const nodesByType = new Map<EntityType, GraphNode[]>()
  for (const node of nodes.values()) {
    const list = nodesByType.get(node.entityType) ?? []
    list.push(node)
    nodesByType.set(node.entityType, list)
  }

  // ── 5. Compute stats ──

  const nodeCountsByType = {} as Record<EntityType, number>
  for (const [type, list] of nodesByType) {
    nodeCountsByType[type] = list.length
  }

  const edgeCountsByType = {} as Record<RelationshipType, number>
  for (const edge of edges) {
    edgeCountsByType[edge.relationshipType] = (edgeCountsByType[edge.relationshipType] ?? 0) + 1
  }

  const orphanedNodes = Array.from(nodes.values()).filter((n) => n.connectionCount === 0).length

  const sortedByConnections = Array.from(nodes.values())
    .sort((a, b) => b.connectionCount - a.connectionCount)
    .slice(0, 10)
    .map((n) => ({ id: n.id, label: n.label, count: n.connectionCount }))

  const totalNodes = nodes.size
  const totalEdges = edges.length

  const stats: GraphStats = {
    totalNodes,
    totalEdges,
    nodesByType: nodeCountsByType,
    edgesByType: edgeCountsByType,
    orphanedNodes,
    avgConnectionsPerNode:
      totalNodes > 0 ? Math.round(((totalEdges * 2) / totalNodes) * 10) / 10 : 0,
    mostConnectedNodes: sortedByConnections,
  }

  return { nodes, edges, nodesByType, adjacency, stats }
}

/** Get neighbors of a node up to a given depth via BFS */
export function getNeighborhood(
  graph: KnowledgeGraph,
  nodeId: string,
  maxDepth: number = 1,
  maxNodes: number = 50
): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const visited = new Set<string>()
  const edgeIds = new Set<string>()
  const queue: { id: string; depth: number }[] = [{ id: nodeId, depth: 0 }]

  while (queue.length > 0 && visited.size < maxNodes) {
    const current = queue.shift()!
    if (visited.has(current.id)) continue
    visited.add(current.id)

    if (current.depth < maxDepth) {
      const neighbors = graph.adjacency.get(current.id)
      if (neighbors) {
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId) && visited.size < maxNodes) {
            queue.push({ id: neighborId, depth: current.depth + 1 })
          }
        }
      }
    }
  }

  // Collect edges between visited nodes
  for (const edge of graph.edges) {
    if (visited.has(edge.source) && visited.has(edge.target)) {
      edgeIds.add(edge.id)
    }
  }

  return { nodeIds: visited, edgeIds }
}
