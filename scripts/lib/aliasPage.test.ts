// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PRERENDERED_ALIASES } from '../../src/seo/prerenderedAliases'
import { buildAliasPage, validateAliasPage } from './aliasPage'

const TARGET_PAGE =
  '<!doctype html><html><head><title>Lab</title>' +
  '<link rel="canonical" href="https://www.pqctoday.com/playground/cacp">' +
  '<script type="module" src="/assets/index-0001.js"></script></head>' +
  '<body><div id="root" data-prerender-route="/playground/cacp"><main><h1>Lab</h1></main></div></body></html>'

describe('alias pages', () => {
  it('lists the cacp-kmip address as an alias of cacp, and only addresses that differ', () => {
    expect(PRERENDERED_ALIASES).toContainEqual({
      from: '/playground/cacp-kmip',
      to: '/playground/cacp',
    })
    for (const { from, to } of PRERENDERED_ALIASES) expect(from).not.toBe(to)
  })

  it("is the target's own page, with the target as canonical", () => {
    const { html, errors } = buildAliasPage(TARGET_PAGE, '/playground/cacp')
    expect(errors).toEqual([])
    expect(html).toBe(TARGET_PAGE)
  })

  it.each([
    [
      'another canonical',
      TARGET_PAGE.replace('/playground/cacp"', '/playground/hsm"'),
      'does not name https://www.pqctoday.com/playground/cacp',
    ],
    [
      'a noindex mark',
      TARGET_PAGE.replace('</head>', '<meta name="robots" content="noindex"></head>'),
      'is marked noindex',
    ],
    ['no #root', TARGET_PAGE.replace('id="root"', 'id="app"'), 'no #root'],
    ['no heading', TARGET_PAGE.replace('<h1>Lab</h1>', ''), 'exactly one <h1>'],
    ['no app script', TARGET_PAGE.replace(/<script[^>]*><\/script>/, ''), 'does not load the app'],
  ])('rejects %s', (_name, html, message) => {
    expect(validateAliasPage(html, '/playground/cacp').join(' ')).toContain(message)
  })
})
