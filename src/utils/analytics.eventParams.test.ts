// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// These run against the real react-ga4, with only window.gtag watched, so they prove what
// GA4 would actually receive: event names unchanged, extra parameters present.
type GtagCall = [command: string, name?: string | Record<string, unknown>, params?: unknown]

describe('analytics event parameters', () => {
  let calls: GtagCall[]

  const load = async () => {
    vi.resetModules()
    const analytics = await import('./analytics')
    const { usePersonaStore } = await import('@/store/usePersonaStore')
    const ga = (await import('react-ga4')).default
    // react-ga4 is one shared instance that remembers it has started; forget that so every
    // test sees the start-up commands it sends.
    Object.assign(ga as unknown as Record<string, unknown>, {
      isInitialized: false,
      _hasLoadedGA: false,
    })
    return { ga, usePersonaStore, ...analytics }
  }

  /** Every gtag('event', …) call so far, as [name, params]. */
  const events = () =>
    calls
      .filter((c) => c[0] === 'event')
      .map((c) => [c[1], c[2]] as [string, Record<string, unknown>])

  beforeEach(() => {
    calls = []
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST')
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'example.com',
        origin: 'https://example.com',
        pathname: '/learn/pqc-101',
        search: '',
        hash: '',
        href: 'https://example.com/learn/pqc-101',
      },
      writable: true,
      configurable: true,
    })
    Object.defineProperty(document, 'referrer', { value: '', configurable: true })
    // react-ga4 pushes gtag's `arguments` object onto window.dataLayer.
    ;(window as unknown as { dataLayer: unknown[] }).dataLayer = {
      push: (args: ArrayLike<unknown>) => calls.push(Array.from(args) as GtagCall),
    } as unknown as unknown[]
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    delete (document as unknown as { referrer?: string }).referrer
  })

  it('an event with parameters keeps the exact name, category and label that event() sends', async () => {
    const { ga, logEvent, initGA } = await load()
    initGA()
    calls.length = 0

    ga.event({ category: 'Learning', action: 'Module Start', label: 'pqc-101' })
    logEvent('Learning', 'Module Start', 'pqc-101', { module_id: 'pqc-101' })

    const [plain, withParams] = events()
    expect(withParams[0]).toBe(plain[0])
    expect(withParams[1]).toMatchObject({
      event_category: plain[1].event_category,
      event_label: plain[1].event_label,
      module_id: 'pqc-101',
    })
  })

  it('applies the same title-casing event() does, including to lower-case and acronym names', async () => {
    const { ga, logEvent, initGA } = await load()
    initGA()
    calls.length = 0

    for (const [category, action, label] of [
      ['business', 'tool export', 'roi-calculator:md'],
      ['Report', 'CTA Click', 'view-example'],
      ['Learning', 'Tab Switch', 'pqc-101:workshop'],
    ]) {
      ga.event({ category, action, label })
      logEvent(category, action, label, { module_id: 'x' })
    }

    const all = events()
    for (let i = 0; i < all.length; i += 2) {
      expect(all[i + 1][0]).toBe(all[i][0])
      expect(all[i + 1][1].event_category).toBe(all[i][1].event_category)
      expect(all[i + 1][1].event_label).toBe(all[i][1].event_label)
    }
  })

  it('an event without parameters is sent exactly as before', async () => {
    const { logEvent, initGA } = await load()
    initGA()
    calls.length = 0
    logEvent('Library', 'Search', 'kyber')
    expect(events()).toEqual([['Search', { event_category: 'Library', event_label: 'Kyber' }]])
  })

  it('leaves out parameters whose value is undefined', async () => {
    const { logEvent, initGA } = await load()
    initGA()
    calls.length = 0
    logEvent('Learning', 'Module Start', 'a', { module_id: undefined })
    expect(events()[0][1]).not.toHaveProperty('module_id')
  })

  it('module and tool events carry module_id and tool_id', async () => {
    const m = await load()
    m.initGA()
    calls.length = 0
    m.logModuleStart('pqc-101')
    m.logModuleComplete('pqc-101')
    m.logStepComplete('pqc-101', 2)
    m.logArtifactGenerated('pki-workshop', 'certificate')
    m.logModuleTabSwitch('pqc-101', 'workshop')
    m.logBusinessToolOpen('roi-calculator', 'ROI Calculator')
    m.logBusinessToolExport('roi-calculator', 'pdf')

    const byName = Object.fromEntries(events().map(([n, p]) => [n, p]))
    expect(byName['Module Start']).toMatchObject({ module_id: 'pqc-101' })
    expect(byName['Module Complete']).toMatchObject({ module_id: 'pqc-101' })
    expect(byName['Step Complete']).toMatchObject({ module_id: 'pqc-101' })
    expect(byName['Artifact Generated']).toMatchObject({ module_id: 'pki-workshop' })
    expect(byName['Tab Switch']).toMatchObject({ module_id: 'pqc-101' })
    expect(byName['Tool Open']).toMatchObject({ tool_id: 'roi-calculator' })
    expect(byName['Tool Export']).toMatchObject({ tool_id: 'roi-calculator' })
  })

  it('finishing the assessment also sends the uniquely named Assessment Complete event', async () => {
    const m = await load()
    m.initGA()
    calls.length = 0
    m.logAssessComplete('architect')
    expect(events().map(([n]) => n)).toEqual(['Complete', 'Assessment Complete'])
  })

  it('a library download uses its own event name', async () => {
    const m = await load()
    m.initGA()
    calls.length = 0
    m.logLibraryDownload('citations-all-bib')
    expect(events()[0][0]).toBe('Library Download')
  })

  describe('persona parameters', () => {
    const pageViews = () => calls.filter((c) => c[0] === 'event' && c[1] === 'page_view')

    it('are left off until the visitor has picked a persona', async () => {
      const m = await load()
      m.initGA()
      calls.length = 0
      m.logEvent('Library', 'Search', 'kyber')
      m.logPageView('/library')
      expect(events()[0][1]).not.toHaveProperty('persona')
      expect(events()[0][1]).not.toHaveProperty('experience_level')
      expect(pageViews()[0][2]).not.toHaveProperty('persona')
    })

    it('ride on every event once a persona is chosen, without changing event names', async () => {
      const m = await load()
      m.initGA()
      m.usePersonaStore.setState({ selectedPersona: 'developer', experienceLevel: 'expert' })
      calls.length = 0
      m.logEvent('Library', 'Search', 'kyber')
      m.logModuleStart('pqc-101')
      expect(events()).toEqual([
        [
          'Search',
          {
            event_category: 'Library',
            event_label: 'Kyber',
            persona: 'developer',
            experience_level: 'expert',
          },
        ],
        [
          'Module Start',
          expect.objectContaining({
            persona: 'developer',
            experience_level: 'expert',
            module_id: 'pqc-101',
          }),
        ],
      ])
    })

    it('ride on page views too', async () => {
      const m = await load()
      m.initGA()
      m.usePersonaStore.setState({ selectedPersona: 'executive', experienceLevel: 'curious' })
      calls.length = 0
      m.logPageView('/library')
      expect(pageViews()[0][2]).toMatchObject({
        persona: 'executive',
        experience_level: 'curious',
        page_path: '/library',
      })
    })

    it('say unknown when a persona is chosen but no experience level is', async () => {
      const m = await load()
      m.initGA()
      m.usePersonaStore.setState({ selectedPersona: 'researcher', experienceLevel: null })
      calls.length = 0
      m.logEvent('Library', 'Search', 'kyber')
      expect(events()[0][1]).toMatchObject({ persona: 'researcher', experience_level: 'unknown' })
    })

    it('follow a change of persona in the middle of a visit', async () => {
      const m = await load()
      m.initGA()
      m.usePersonaStore.setState({ selectedPersona: 'developer', experienceLevel: 'basics' })
      calls.length = 0
      m.logEvent('Library', 'Search', 'a')
      m.usePersonaStore.setState({ selectedPersona: 'executive' })
      m.logEvent('Library', 'Search', 'b')
      expect(events().map(([, p]) => p.persona)).toEqual(['developer', 'executive'])
    })

    it('are not sent through gtag set, which GA4 does not attach to events', async () => {
      const m = await load()
      m.initGA()
      m.usePersonaStore.setState({ selectedPersona: 'developer', experienceLevel: 'expert' })
      expect(
        calls.filter((c) => c[0] === 'set' && typeof c[1] === 'object' && c[1] && 'persona' in c[1])
      ).toEqual([])
    })
  })

  describe('internal traffic flag', () => {
    const tagConfig = () => calls.find((c) => c[0] === 'config')?.[2] as Record<string, unknown>
    const stubSearch = (search: string) =>
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'example.com',
          origin: 'https://example.com',
          pathname: '/',
          search,
          hash: '',
          href: `https://example.com/${search}`,
        },
        writable: true,
        configurable: true,
      })

    beforeEach(() => window.localStorage.removeItem('pqc-internal-traffic'))
    afterEach(() => window.localStorage.removeItem('pqc-internal-traffic'))

    it('tags nothing for an ordinary visitor', async () => {
      const m = await load()
      m.initGA()
      expect(tagConfig()).toEqual({ send_page_view: false })
    })

    it('?internal_traffic=on puts traffic_type in the tag configuration, for this and later visits, until off', async () => {
      stubSearch('?internal_traffic=on')
      let m = await load()
      m.initGA()
      expect(tagConfig()).toMatchObject({ traffic_type: 'internal' })

      calls.length = 0
      stubSearch('')
      m = await load()
      m.initGA()
      expect(tagConfig()).toMatchObject({ traffic_type: 'internal' })

      calls.length = 0
      stubSearch('?internal_traffic=off')
      m = await load()
      m.initGA()
      expect(tagConfig()).toEqual({ send_page_view: false })
    })

    it('never sends the flag in the page address', async () => {
      stubSearch('?internal_traffic=on')
      const m = await load()
      m.initGA()
      m.logPageView('/')
      const sent = JSON.stringify(calls.filter((c) => c[0] === 'set'))
      expect(sent).not.toContain('internal_traffic')
    })
  })

  it('sends nothing on localhost', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', origin: 'http://localhost', pathname: '/', search: '' },
      writable: true,
      configurable: true,
    })
    const m = await load()
    m.initGA()
    m.logModuleStart('pqc-101')
    expect(calls).toEqual([])
  })
})
