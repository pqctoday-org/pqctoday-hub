// SPDX-License-Identifier: GPL-3.0-only
//
// WS8e (2026-08-15) — the hub-only routing rule, locked in.
//
// The Industry Landscape tile links to hub resources: Library, Learn modules,
// workshop tools, sandbox scenarios, Protocol Support, migrate catalog,
// Compliance, Threats. A source that cannot be reached through a hub resource
// is cited as TEXT, not as an outbound link.
//
// Before this, three external `href=` shipped on the tile: the use-case source
// (76 rows, only 20 of which had a Library entry), the market-size source
// (19 rows, 0 in the Library — BEA/Census/IMF statistics), and the CycloneDX
// registry landing page. This test exists because a rule with no gate decays
// at the next new field, and nothing else in the repo would notice.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const VIEW = join(process.cwd(), 'src/components/Algorithms/IndustryLandscapeView.tsx')

describe('industry landscape — hub-only routing', () => {
  it('renders no external anchors', () => {
    const src = readFileSync(VIEW, 'utf8')
    // `href=` at all: every link must be a react-router <Link to=…>. An
    // in-app href would also be wrong here (it breaks client-side routing),
    // so the check is deliberately absolute rather than protocol-aware.
    const offenders = src
      .split('\n')
      .map((line, i) => ({ line: line.trim(), n: i + 1 }))
      .filter((l) => /\bhref=/.test(l.line))

    expect(
      offenders,
      `IndustryLandscapeView must link only through hub routes (<Link to=…>). ` +
        `Cite an unreachable source as text instead:\n` +
        offenders.map((o) => `  line ${o.n}: ${o.line}`).join('\n')
    ).toEqual([])
  })

  it('does not import an external-link affordance', () => {
    // An ExternalLink icon on this view means someone re-added an outbound
    // link, or is about to. Cheap early warning.
    const src = readFileSync(VIEW, 'utf8')
    expect(src.includes('ExternalLink'), 'ExternalLink icon reintroduced on a hub-only view').toBe(
      false
    )
  })

  it('never opens a new tab', () => {
    const src = readFileSync(VIEW, 'utf8')
    expect(src.includes('target="_blank"'), 'target="_blank" implies an external destination').toBe(
      false
    )
  })
})
