import { describe, expect, it } from 'vitest'
import { isResourceDeepLink, isSameRoute, resourceDeepLinkRoute } from './resourceDeepLink'

describe('isResourceDeepLink', () => {
  it.each([
    ['/threats', '?id=FIN-001'],
    ['/library', '?ref=FIPS%20203'],
    ['/library/', '?ref=FIPS%20203'],
    ['/patents', '?patent=US12676741'],
    ['/algorithms', '?tab=support&protocol=ssh'],
    ['/algorithms', '?highlight=ML-KEM-768'],
    ['/timeline', '?event=PQC%20Best%20Practices%20Published'],
    ['/timeline', '?country=France'],
    ['/migrate', '?productIds=softhsm2'],
    ['/leaders', '?leader=Stavros%20Kousidis'],
    ['/compliance', '?framework=CNSA-2'],
    ['/compliance', '?cert=5528'],
    ['/compliance', '?tab=cswp39&evref=CMMC-2.0-MODEL'],
    ['/timeline', '?spec=KpqC-Competition-Results'],
  ])('%s%s is a resource link', (path, search) => {
    expect(isResourceDeepLink(path, search)).toBe(true)
  })

  it.each([
    ['/library', ''],
    ['/library', '?view=table'],
    ['/compliance', '?tab=records'],
    ['/algorithms', '?tab=detailed'],
    ['/leaders', '?leader='],
    ['/', '?ref=FIPS%20203'],
  ])('%s%s is not a resource link', (path, search) => {
    expect(isResourceDeepLink(path, search)).toBe(false)
  })
})

describe('resourceDeepLinkRoute', () => {
  it('returns the normalised route for a resource link and null otherwise', () => {
    expect(resourceDeepLinkRoute('/library/', '?ref=X')).toBe('/library')
    expect(resourceDeepLinkRoute('/library', '')).toBeNull()
  })

  it('compares routes ignoring a trailing slash', () => {
    expect(isSameRoute('/library/', '/library')).toBe(true)
    expect(isSameRoute('/library', '/patents')).toBe(false)
  })
})
