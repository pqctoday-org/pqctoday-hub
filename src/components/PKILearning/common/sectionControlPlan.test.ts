// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { planSectionControls, isHeadingRow } from './sectionControlPlan'

const page = (html: string): HTMLElement => {
  const root = document.createElement('div')
  root.innerHTML = html
  return root
}
const plan = (html: string, ids: string[]) => {
  const root = page(html)
  return { root, spots: planSectionControls(root, new Set(ids)) }
}

describe('where a lesson section gets its one tick', () => {
  it('puts it at the end of a plain section', () => {
    const { root, spots } = plan(
      '<section data-section-id="a"><h2>A</h2><p>body of a</p></section>',
      ['a']
    )
    expect(spots).toHaveLength(1)
    expect(spots[0].parent).toBe(root.querySelector('section'))
    expect(spots[0].before).toBeNull()
  })

  it('skips a section that draws its own tick, and a wrapper around one (Key Escrow & Recovery)', () => {
    const own = plan('<section data-section-id="a" data-section-read="own"><p>x</p></section>', [
      'a',
    ])
    expect(own.spots).toEqual([])
    const wrapped = plan(
      '<div data-section-id="a"><section data-section-id="a" data-section-read="own"><p>x</p></section></div>',
      ['a']
    )
    expect(wrapped.spots).toEqual([])
  })

  it('does not take a wrapper for a section that draws its own tick for a different id', () => {
    const { spots } = plan(
      '<div data-section-id="outer"><section data-section-id="inner" data-section-read="own"></section></div>',
      ['outer']
    )
    expect(spots).toHaveLength(1)
  })

  it('puts it after the body, not in the heading row (Executive Quantum Impact)', () => {
    const { root, spots } = plan(
      `<section class="panel">
         <div data-section-id="why"><svg></svg><h2>Why it matters</h2></div>
         <div class="body"><p>one</p><p>two</p></div>
       </section>`,
      ['why']
    )
    expect(isHeadingRow(root.querySelector('[data-section-id]') as HTMLElement)).toBe(true)
    expect(spots).toHaveLength(1)
    expect(spots[0].parent).toBe(root.querySelector('section'))
    expect(spots[0].before).toBeNull()
  })

  it('in a run of sections with only heading rows, each tick goes before the next heading row', () => {
    const { root, spots } = plan(
      `<div>
         <div data-section-id="a"><h2>A</h2></div><p>body a</p>
         <div data-section-id="b"><h2>B</h2></div><p>body b</p>
       </div>`,
      ['a', 'b']
    )
    const next = root.querySelector('[data-section-id="b"]')
    expect(spots.map((s) => s.id)).toEqual(['a', 'b'])
    expect(spots[0].before).toBe(next)
    expect(spots[1].before).toBeNull()
  })

  it('counts one section once when the same id is on a <section> and on its heading row (Crypto Management)', () => {
    const { root, spots } = plan(
      `<section id="why">
         <div data-section-id="why"><h2>Why</h2></div><p>body</p>
       </section>`,
      ['why']
    )
    expect(spots).toHaveLength(1)
    expect(spots[0].parent).toBe(root.querySelector('section'))
  })

  it('ignores anchors that are not required', () => {
    expect(plan('<section data-section-id="a"><p>x</p></section>', ['b']).spots).toEqual([])
  })
})
