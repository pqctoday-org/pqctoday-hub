// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  RELATED_RESOURCE_KINDS,
  RELATED_RESOURCE_KIND_LABEL,
  buildRelatedResource,
  parseRelatedResourceKind,
  parseRelatedResourceUrl,
  relatedResourceCbomReference,
  relatedResourceName,
  sameResourceAddress,
} from './relatedResources'

describe('related resource kinds', () => {
  it('knows the five kinds, including issue tracker', () => {
    expect([...RELATED_RESOURCE_KINDS].sort()).toEqual(
      ['documentation', 'issue_tracker', 'sdk', 'source_repository', 'test_suite'].sort()
    )
  })

  it('words every kind for the reader', () => {
    expect(RELATED_RESOURCE_KIND_LABEL).toEqual({
      test_suite: 'Test suite',
      sdk: 'SDK',
      source_repository: 'Source repository',
      documentation: 'Documentation',
      issue_tracker: 'Issue tracker',
    })
  })

  it('reads a kind case-insensitively and drops blank or unknown values', () => {
    expect(parseRelatedResourceKind(' SDK ')).toBe('sdk')
    expect(parseRelatedResourceKind('issue_tracker')).toBe('issue_tracker')
    expect(parseRelatedResourceKind('')).toBeUndefined()
    expect(parseRelatedResourceKind(undefined)).toBeUndefined()
    expect(parseRelatedResourceKind('mailing_list')).toBeUndefined()
  })
})

describe('related resource address', () => {
  it('accepts only http and https addresses', () => {
    expect(parseRelatedResourceUrl(' https://github.com/a/b ')).toBe('https://github.com/a/b')
    expect(parseRelatedResourceUrl('http://example.com/x')).toBe('http://example.com/x')
    expect(parseRelatedResourceUrl('javascript:alert(1)')).toBeUndefined()
    expect(parseRelatedResourceUrl('pkg:github/a/b')).toBeUndefined()
    expect(parseRelatedResourceUrl('')).toBeUndefined()
    expect(parseRelatedResourceUrl(undefined)).toBeUndefined()
  })

  it('reads a code-hosting address as owner/repo and any other as host and path', () => {
    expect(relatedResourceName('https://github.com/ARM-software/cca-rmm-acs')).toBe(
      'ARM-software/cca-rmm-acs'
    )
    expect(relatedResourceName('https://github.com/Yubico/yubihsm-shell.git')).toBe(
      'Yubico/yubihsm-shell'
    )
    expect(relatedResourceName('https://github.com/FusionAuth/fusionauth-issues/issues')).toBe(
      'FusionAuth/fusionauth-issues'
    )
    expect(relatedResourceName('https://www.example.com/docs/guide/')).toBe(
      'example.com/docs/guide'
    )
    expect(relatedResourceName('https://example.com')).toBe('example.com')
  })

  it('treats scheme, www, a trailing slash and .git as the same page, and only those', () => {
    expect(
      sameResourceAddress(
        'https://github.com/Yubico/yubihsm-shell',
        'http://www.github.com/yubico/yubihsm-shell.git/'
      )
    ).toBe(true)
    expect(
      sameResourceAddress(
        'https://github.com/Yubico/yubihsm-shell',
        'https://github.com/Yubico/other'
      )
    ).toBe(false)
    expect(sameResourceAddress('', '')).toBe(false)
    expect(sameResourceAddress(undefined, 'https://example.com')).toBe(false)
  })
})

describe('buildRelatedResource', () => {
  it('builds nothing without a usable address, whatever the kind says', () => {
    expect(buildRelatedResource('', 'sdk')).toBeUndefined()
    expect(buildRelatedResource(undefined, undefined)).toBeUndefined()
    expect(buildRelatedResource('not a url', 'sdk')).toBeUndefined()
  })

  it('carries the kind word and the link text', () => {
    expect(buildRelatedResource('https://github.com/MicrochipTech/cryptoauthlib', 'sdk')).toEqual({
      url: 'https://github.com/MicrochipTech/cryptoauthlib',
      kind: 'sdk',
      kindLabel: 'SDK',
      name: 'MicrochipTech/cryptoauthlib',
    })
  })

  it('keeps the link with no kind word when the kind is unknown', () => {
    const r = buildRelatedResource('https://example.com/x', 'unheard_of')
    expect(r?.kind).toBeUndefined()
    expect(r?.kindLabel).toBeNull()
    expect(r?.url).toBe('https://example.com/x')
  })
})

describe('relatedResourceCbomReference', () => {
  const url = 'https://example.com/x'
  it('uses the CycloneDX reference types that exist and "other" with a comment for the rest', () => {
    expect(relatedResourceCbomReference({ url, kind: 'source_repository' })).toEqual({
      type: 'vcs',
      url,
      comment: 'Source repository',
    })
    expect(relatedResourceCbomReference({ url, kind: 'documentation' }).type).toBe('documentation')
    expect(relatedResourceCbomReference({ url, kind: 'issue_tracker' }).type).toBe('issue-tracker')
    expect(relatedResourceCbomReference({ url, kind: 'sdk' })).toEqual({
      type: 'other',
      url,
      comment: 'SDK',
    })
    expect(relatedResourceCbomReference({ url, kind: 'test_suite' })).toEqual({
      type: 'other',
      url,
      comment: 'Test suite',
    })
    expect(relatedResourceCbomReference({ url })).toEqual({
      type: 'other',
      url,
      comment: 'Related resource',
    })
  })
})
