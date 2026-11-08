// SPDX-License-Identifier: AGPL-3.0-only
//
// Pure helpers for a product's "related resource": a project page that sits
// beside a product (its test suite, SDK, source repository, documentation or
// issue tracker). It is read from the package-identifier file's
// `related_resource_url` and `related_resource_kind` columns and is never the
// product's package identifier. No data loading here (no import.meta.glob), so
// the page, the CBOM export and the build-time CBOM script all read one
// definition of the kinds, their wording and their CycloneDX mapping.

import type { RelatedResourceKind } from '../types/MigrateTypes'

export const RELATED_RESOURCE_KINDS: readonly RelatedResourceKind[] = [
  'test_suite',
  'sdk',
  'source_repository',
  'documentation',
  'issue_tracker',
]

/** The word shown before the link: "Test suite: ARM-software/cca-rmm-acs". */
export const RELATED_RESOURCE_KIND_LABEL: Record<RelatedResourceKind, string> = {
  test_suite: 'Test suite',
  sdk: 'SDK',
  source_repository: 'Source repository',
  documentation: 'Documentation',
  issue_tracker: 'Issue tracker',
}

export interface RelatedResource {
  url: string
  /** Absent when the file names a kind this site does not know. */
  kind?: RelatedResourceKind
  /** The word shown before the link; null when the kind is unknown. */
  kindLabel: string | null
  /** What the link reads: "owner/repo" for a code-hosting address, else host and path. */
  name: string
}

/** The kind named in the file, or undefined when blank or not one of the known kinds. */
export function parseRelatedResourceKind(raw: string | undefined): RelatedResourceKind | undefined {
  const value = (raw ?? '').trim().toLowerCase()
  return RELATED_RESOURCE_KINDS.find((k) => k === value)
}

/** The address named in the file, only when it is a usable http or https address. */
export function parseRelatedResourceUrl(raw: string | undefined): string | undefined {
  const value = (raw ?? '').trim()
  if (!/^https?:\/\//i.test(value)) return undefined
  try {
    new URL(value)
  } catch {
    return undefined
  }
  return value
}

const CODE_HOSTS = new Set(['github.com', 'gitlab.com', 'codeberg.org', 'bitbucket.org'])

/** What a related-resource link reads, so a reader sees where it leads. */
export function relatedResourceName(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()
    const segments = u.pathname.split('/').filter(Boolean)
    if (CODE_HOSTS.has(host) && segments.length >= 2) {
      return `${segments[0]}/${segments[1].replace(/\.git$/i, '')}`
    }
    const path = segments.join('/')
    return path ? `${host}/${path}` : host
  } catch {
    return url
  }
}

/** One related resource from the two file columns, or undefined when there is no usable address. */
export function buildRelatedResource(
  rawUrl: string | undefined,
  rawKind: string | undefined
): RelatedResource | undefined {
  const url = parseRelatedResourceUrl(rawUrl)
  if (!url) return undefined
  const kind = parseRelatedResourceKind(rawKind)
  return {
    url,
    kind,
    kindLabel: kind ? RELATED_RESOURCE_KIND_LABEL[kind] : null,
    name: relatedResourceName(url),
  }
}

function addressKey(url: string | undefined): string | null {
  const value = (url ?? '').trim()
  if (!value) return null
  try {
    const u = new URL(value)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()
    const path = u.pathname.replace(/\/+$/, '').replace(/\.git$/i, '')
    return `${host}${path.toLowerCase()}${u.search}`
  } catch {
    return value.replace(/\/+$/, '').toLowerCase()
  }
}

/** True when two addresses are the same page (scheme, "www.", a trailing slash and ".git" aside). */
export function sameResourceAddress(a: string | undefined, b: string | undefined): boolean {
  const ka = addressKey(a)
  const kb = addressKey(b)
  return ka !== null && ka === kb
}

/**
 * How a related resource is written into a CycloneDX 1.7 `externalReferences`
 * entry. `vcs`, `documentation` and `issue-tracker` are CycloneDX reference
 * types; an SDK and a test suite have no type of their own, so they are
 * `other` with a comment that says what they are. Never a package identifier.
 */
export function relatedResourceCbomReference(resource: Pick<RelatedResource, 'url' | 'kind'>): {
  type: string
  url: string
  comment: string
} {
  switch (resource.kind) {
    case 'source_repository':
      return {
        type: 'vcs',
        url: resource.url,
        comment: RELATED_RESOURCE_KIND_LABEL.source_repository,
      }
    case 'documentation':
      return {
        type: 'documentation',
        url: resource.url,
        comment: RELATED_RESOURCE_KIND_LABEL.documentation,
      }
    case 'issue_tracker':
      return {
        type: 'issue-tracker',
        url: resource.url,
        comment: RELATED_RESOURCE_KIND_LABEL.issue_tracker,
      }
    case 'sdk':
      return { type: 'other', url: resource.url, comment: RELATED_RESOURCE_KIND_LABEL.sdk }
    case 'test_suite':
      return { type: 'other', url: resource.url, comment: RELATED_RESOURCE_KIND_LABEL.test_suite }
    default:
      return { type: 'other', url: resource.url, comment: 'Related resource' }
  }
}
