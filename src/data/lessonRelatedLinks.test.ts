// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { resolveIndustryParam } from '@/components/Threats/threatsUrlParams'
import { algorithmsData } from '@/data/algorithmsData'
import { LIBRARY_CATEGORIES } from '@/data/libraryData'
import { DOMAINS } from '@/data/migrationAssets'
import { threatsData } from '@/data/threatsData'
import { timelineData } from '@/data/timelineData'
import type { KnowledgeCore, KnowledgeRecord } from '@/services/knowledge/knowledgeTypes'
import {
  LESSON_RELATED_LINKS,
  lessonLabelOf,
  pageLabelOf,
  relatedLinksOf,
  type RelatedLink,
} from './lessonRelatedLinks'

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf-8')

const core = JSON.parse(read('public/data/knowledge-core.json')) as KnowledgeCore
const byId = new Map<string, KnowledgeRecord>(core.records.map((r) => [r.id, r]))
const lessonRecords = new Map(
  core.records
    .filter((r) => r.family === 'module' && r.type === 'module')
    .map((r) => [r.link.replace(/^\/learn\//, ''), r])
)
const isLive = (r: KnowledgeRecord | undefined) =>
  !!r && r.active !== false && r.status === 'active'

const entries = Object.entries(LESSON_RELATED_LINKS)
const all: { lesson: string; kind: 'lessons' | 'pages'; link: RelatedLink }[] = entries.flatMap(
  ([lesson, v]) => [
    ...v.lessons.map((link) => ({ lesson, kind: 'lessons' as const, link })),
    ...v.pages.map((link) => ({ lesson, kind: 'pages' as const, link })),
  ]
)

/** The links whose lesson gave no reason (the old PQC Business Case "Related Modules" list had titles only). */
const EMPTY_BY_INTENT = new Set([
  'pqc-business-case /learn/pqc-risk-management',
  'pqc-business-case /learn/migration-program',
  'pqc-business-case /learn/vendor-risk',
  'pqc-business-case /learn/compliance-strategy',
])

const parts = (to: string) => {
  const url = new URL(to, 'https://hub.invalid')
  return {
    segments: url.pathname.split('/').filter(Boolean),
    params: [...url.searchParams.entries()],
  }
}

describe('kept lesson links: what the data holds', () => {
  it('holds every link the lessons listed by hand, in two groups', () => {
    const lessons = all.filter((l) => l.kind === 'lessons').length
    const pages = all.filter((l) => l.kind === 'pages').length
    expect({ lessons, pages }).toEqual({ lessons: 182, pages: 74 })
    expect(entries.length).toBe(50)
  })

  it('keeps a title on every link, and a full-sentence reason unless the reason is empty by intent', () => {
    for (const { lesson, link } of all) {
      expect(link.title.trim(), `${lesson} -> ${link.to}: empty title`).not.toBe('')
      const reason = link.reason.trim()
      if (EMPTY_BY_INTENT.has(`${lesson} ${link.to}`)) {
        expect(reason, `${lesson} -> ${link.to} is listed as having no reason`).toBe('')
        continue
      }
      expect(
        reason,
        `${lesson} -> ${link.to}: empty reason (list it in EMPTY_BY_INTENT if intended)`
      ).not.toBe('')
      expect(reason, `${lesson} -> ${link.to}: reason ends mid-sentence`).not.toMatch(/[,:;-]$/)
      expect(
        reason.split(/\s+/).length,
        `${lesson} -> ${link.to}: reason is one or two words`
      ).toBeGreaterThanOrEqual(3)
    }
    // Nothing is listed as empty that is not in the data.
    for (const key of EMPTY_BY_INTENT) {
      expect(
        all.some((l) => `${l.lesson} ${l.link.to}` === key),
        key
      ).toBe(true)
    }
    for (const [lesson, v] of entries) {
      const to = [...v.lessons, ...v.pages].map((l) => l.to)
      expect(new Set(to).size, `${lesson} lists a link twice`).toBe(to.length)
    }
  })

  it('puts lesson addresses in "lessons" and every other address in "pages"', () => {
    for (const { lesson, kind, link } of all) {
      expect(link.to.startsWith('/learn/'), `${lesson} -> ${link.to}`).toBe(kind === 'lessons')
    }
  })

  it('gives the "no list" answer for a lesson without kept links', () => {
    expect(relatedLinksOf('quiz')).toEqual({ lessons: [], pages: [] })
    expect(relatedLinksOf('constructor')).toEqual({ lessons: [], pages: [] })
  })

  it('labels a workshop step and a page by what they are', () => {
    expect(lessonLabelOf('/learn/arch-quantum-impact?tab=workshop&step=5')).toBe('Workshop step')
    expect(lessonLabelOf('/learn/hsm-pqc')).toBe('Module')
    expect(pageLabelOf('/library?q=CMS')).toBe('Page: Library')
    expect(pageLabelOf('/openssl')).toBe('Page: OpenSSL Studio')
  })

  it('offers the trust-hardware comparison from the five lessons that carried it', () => {
    const TRUST = '/learn/arch-quantum-impact?tab=workshop&step=5'
    const offering = entries
      .filter(([, v]) =>
        v.lessons.some(
          (l) => l.to === TRUST && /Compare with the other trust hardware/.test(l.title)
        )
      )
      .map(([lesson]) => lesson)
      .sort()
    expect(offering).toEqual([
      'confidential-computing',
      'hsm-pqc',
      'kms-pqc',
      'pqc-hw-acceleration',
      'secure-boot-pqc',
    ])
    // Each gives a reason, as the lesson did.
    for (const [lesson, v] of entries) {
      const link = v.lessons.find((l) => l.to === TRUST)
      if (link) expect(link.reason, lesson).not.toBe('')
    }
  })
})

describe('kept lesson links: lessons', () => {
  it('lists links only under lessons that exist and are not retired', () => {
    for (const [lesson] of entries) {
      expect(MANIFEST_BY_ID[lesson], `${lesson} is not a lesson`).toBeDefined()
      expect(isLive(lessonRecords.get(lesson)), `${lesson} is retired or unknown`).toBe(true)
    }
  })

  it('points only at lessons that exist and are not retired', () => {
    for (const { lesson, link } of all.filter((l) => l.kind === 'lessons')) {
      const { segments } = parts(link.to)
      const target = segments[1] ?? ''
      expect(MANIFEST_BY_ID[target], `${lesson} -> ${link.to}`).toBeDefined()
      expect(isLive(lessonRecords.get(target)), `${lesson} -> ${link.to} is retired`).toBe(true)
    }
  })

  it('opens a workshop step only with a tab and a step the lesson page reads', () => {
    const shell =
      read('src/components/PKILearning/common/ModuleShell.tsx') +
      read('src/hooks/useModuleDeepLink.ts')
    for (const { lesson, link } of all.filter((l) => l.kind === 'lessons')) {
      for (const [key] of parts(link.to).params) {
        expect(['tab', 'step'], `${lesson} -> ${link.to}`).toContain(key)
        expect(shell, `The lesson page does not read "${key}"`).toMatch(
          new RegExp(`['"]${key}['"]`)
        )
      }
    }
  })
})

/** The routes of the router (`path="..."` in App.tsx), first segment only. */
const routes = new Set(
  [...read('src/App.tsx').matchAll(/path="([^"*:]+)/g)].map(
    (m) => m[1]!.split('/').filter(Boolean)[0] ?? ''
  )
)

/**
 * Where each page reads its query parameters: the desktop sources and, where the phone draws its own screen, the
 * phone's. A parameter must appear in at least one file of each list.
 */
const PAGE_PARAMS: Record<string, { params: string[]; desktop: string[]; phone?: string[] }> = {
  library: {
    params: ['q', 'cat', 'ref'],
    desktop: ['src/components/Library/redesign/LibraryViewRedesign.tsx'],
    phone: ['src/components/Mobile/screens/MobileLibraryView.tsx'],
  },
  algorithms: {
    params: ['tab', 'protocol', 'highlight', 'q'],
    desktop: [
      'src/components/Algorithms/AlgorithmsView.tsx',
      'src/components/Algorithms/useAlgorithmExplorer.ts',
      'src/components/Algorithms/PQCProtocolMatrix.tsx',
    ],
  },
  threats: {
    params: ['industry'],
    desktop: ['src/components/Threats/threatsUrlParams.ts'],
    phone: ['src/components/Mobile/screens/MobileThreatsView.tsx'],
  },
  compliance: {
    params: ['framework'],
    desktop: ['src/components/Compliance/useComplianceUrlState.ts'],
    phone: ['src/components/Mobile/screens/MobileComplianceView.tsx'],
  },
  timeline: {
    params: ['country', 'event'],
    desktop: ['src/components/Timeline/TimelineView.tsx'],
    phone: ['src/components/Mobile/screens/MobileTimelineView.tsx'],
  },
  migrate: {
    params: ['domain'],
    desktop: [
      'src/components/Migrate/Workbench/MigrationWorkbench.tsx',
      'src/components/Migrate/Workbench/workbenchCatalog.ts',
    ],
    phone: ['src/components/Mobile/screens/MobileMigrateView.tsx'],
  },
  openssl: { params: [], desktop: [] },
  assess: { params: [], desktop: [] },
  playground: { params: [], desktop: [] },
}

const pageLinks = all.filter((l) => l.kind === 'pages')
const readsKey = (files: string[], key: string) =>
  files.some((f) => new RegExp(`['"]${key}['"]`).test(read(f)))

describe('kept lesson links: pages', () => {
  it('opens only routes that exist in the router', () => {
    for (const { lesson, link } of pageLinks) {
      const route = parts(link.to).segments[0] ?? ''
      expect(routes.has(route), `${lesson} -> ${link.to}: no route "${route}"`).toBe(true)
      expect(
        Object.keys(PAGE_PARAMS),
        `${lesson} -> ${link.to}: page not described here`
      ).toContain(route)
    }
  })

  it('uses only query parameters the page reads, on the desktop and on the phone', () => {
    for (const { lesson, link } of pageLinks) {
      const route = parts(link.to).segments[0] ?? ''
      const page = PAGE_PARAMS[route]!
      for (const [key] of parts(link.to).params) {
        expect(
          page.params,
          `${lesson} -> ${link.to}: "${key}" is not a ${route} parameter`
        ).toContain(key)
        expect(readsKey(page.desktop, key), `${route} (desktop) does not read "${key}"`).toBe(true)
        if (page.phone) {
          expect(readsKey(page.phone, key), `${route} (phone) does not read "${key}"`).toBe(true)
        }
      }
    }
  })

  const filters = (route: string, key: string) =>
    pageLinks.flatMap(({ lesson, link }) =>
      parts(link.to).segments[0] === route
        ? parts(link.to)
            .params.filter(([k]) => k === key)
            .map(([, value]) => ({ lesson, to: link.to, value }))
        : []
    )

  it('library: a category is one of the Library categories, and a search finds a document', () => {
    for (const { lesson, to, value } of filters('library', 'cat')) {
      expect(LIBRARY_CATEGORIES as readonly string[], `${lesson} -> ${to}`).toContain(value)
    }
    const titles = core.records
      .filter((r) => r.family === 'library' && r.active !== false)
      .map((r) => r.label.toLowerCase())
    for (const { lesson, to, value } of filters('library', 'q')) {
      expect(
        titles.some((t) => t.includes(value.toLowerCase())),
        `${lesson} -> ${to}: no Library document matches "${value}"`
      ).toBe(true)
    }
  })

  it('library: a record address is a live Library record, keeps its title, and opens a document the Hub holds', () => {
    for (const { lesson, to, value } of filters('library', 'ref')) {
      const record = byId.get(`LIB:${value}`)
      expect(isLive(record), `${lesson} -> ${to}: no live Library record "${value}"`).toBe(true)
      const link = pageLinks.find((l) => l.link.to === to)!.link
      expect(link.title, `${lesson} -> ${to}`).toBe(record!.label)
    }
    // The RFC 10033 link the Stateful Signatures lesson carried (it was an outside address) points at the Hub's record.
    expect(
      pageLinks.some(
        (l) =>
          l.lesson === 'stateful-signatures' &&
          l.link.to === '/library?ref=RFC-10033-Hash-Based-Signatures-State-and-Backup-Management'
      )
    ).toBe(true)
  })

  it('has no address outside the Hub', () => {
    for (const { lesson, link } of all) {
      expect(link.to.startsWith('/'), `${lesson} -> ${link.to}`).toBe(true)
      expect(link.to.startsWith('//'), `${lesson} -> ${link.to}`).toBe(false)
    }
  })

  it('algorithms: a protocol, an algorithm and a search exist in the Hub data', () => {
    for (const { lesson, to, value } of filters('algorithms', 'protocol')) {
      expect(byId.has(`protocol:${value}`), `${lesson} -> ${to}: no protocol "${value}"`).toBe(true)
    }
    const names = core.records
      .filter((r) => r.family === 'algorithm' || r.family === 'algorithmfamily')
      .flatMap((r) => [r.id.replace(/^ALG:/i, ''), r.label])
      .map((n) => n.toLowerCase())
    for (const { lesson, to, value } of filters('algorithms', 'highlight')) {
      for (const one of value.split(',')) {
        expect(
          names.some((n) => n === one.toLowerCase() || n.startsWith(one.toLowerCase())),
          `${lesson} -> ${to}: no algorithm "${one}"`
        ).toBe(true)
      }
    }
    const text = JSON.stringify(algorithmsData).toLowerCase()
    for (const { lesson, to, value } of filters('algorithms', 'q')) {
      expect(
        text.includes(value.toLowerCase()),
        `${lesson} -> ${to}: "${value}" finds nothing`
      ).toBe(true)
    }
    for (const { lesson, to, value } of filters('algorithms', 'tab')) {
      expect(
        read('src/components/Algorithms/AlgorithmsView.tsx'),
        `${lesson} -> ${to}: no tab "${value}"`
      ).toMatch(new RegExp(`['"]${value}['"]`))
    }
  })

  it('threats: an industry resolves to at least one threat', () => {
    for (const { lesson, to, value } of filters('threats', 'industry')) {
      expect(
        resolveIndustryParam(value, threatsData).length,
        `${lesson} -> ${to}: no threat industry "${value}"`
      ).toBeGreaterThan(0)
    }
  })

  it('compliance: a framework is a Hub compliance record', () => {
    for (const { lesson, to, value } of filters('compliance', 'framework')) {
      expect(isLive(byId.get(`CMP:${value}`)), `${lesson} -> ${to}: no framework "${value}"`).toBe(
        true
      )
    }
  })

  it('timeline: a country has events and an event exists', () => {
    const countries = new Set(timelineData.map((c) => c.countryName))
    for (const { lesson, to, value } of filters('timeline', 'country')) {
      expect(countries.has(value), `${lesson} -> ${to}: no country "${value}"`).toBe(true)
    }
    for (const { lesson, to, value } of filters('timeline', 'event')) {
      expect(isLive(byId.get(`TL:${value}`)), `${lesson} -> ${to}: no event "${value}"`).toBe(true)
    }
  })

  it('migrate: a domain is one of the Workbench domains', () => {
    for (const { lesson, to, value } of filters('migrate', 'domain')) {
      expect(Object.keys(DOMAINS), `${lesson} -> ${to}`).toContain(value)
    }
  })
})
