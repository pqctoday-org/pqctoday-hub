// SPDX-License-Identifier: AGPL-3.0-only
import { SECTION_READ_ATTR } from './SectionReadControl'

/** Every element a lesson uses to mark a section: an explicit anchor or a `<section id>`. */
export const SECTION_ANCHOR = '[data-section-id], section[id]'
const HEADING = 'h1, h2, h3, h4, h5, h6'

const idOf = (el: HTMLElement): string => el.dataset.sectionId ?? el.id
const textOf = (el: Element): string => (el.textContent ?? '').replace(/\s+/g, ' ').trim()

/**
 * An element that holds a heading and nothing else (the icon and the title in a row): it names a section, it
 * is not the section. A control put inside it would sit beside the title, not at the end of the body.
 */
export function isHeadingRow(el: HTMLElement): boolean {
  const heading = el.matches(HEADING) ? el : el.querySelector(HEADING)
  return heading !== null && textOf(el).length <= textOf(heading).length
}

export interface ControlSpot {
  /** The section the control is for. */
  id: string
  /** Where the control's host goes: inside `parent`, in front of `before` (or last when `before` is null). */
  parent: HTMLElement
  before: Node | null
}

/**
 * Where each required section's one "Mark section as read" control goes, for lessons that mark their
 * sections with plain anchors. A section gets exactly one control, at the end of its body:
 *  - a section that draws its own control (`data-section-read`, or a wrapper around one that does) gets none here;
 *  - when one id is on nested elements (a `<section id>` with the same id on its heading row), the outer one is the section;
 *  - when the anchor is only a heading row, the section is the heading row and what follows it, up to the next
 *    anchor, so the control goes after the body.
 */
export function planSectionControls(
  root: ParentNode,
  required: ReadonlySet<string>
): ControlSpot[] {
  const byId = new Map<string, HTMLElement[]>()
  root.querySelectorAll<HTMLElement>(SECTION_ANCHOR).forEach((el) => {
    const id = idOf(el)
    if (!id || !required.has(id)) return
    byId.set(id, [...(byId.get(id) ?? []), el])
  })
  const spots: ControlSpot[] = []
  for (const [id, els] of byId) {
    const drawsOwn = els.some(
      (el) =>
        el.hasAttribute(SECTION_READ_ATTR) ||
        el.querySelector(`[${SECTION_READ_ATTR}][data-section-id="${CSS.escape(id)}"]`) !== null
    )
    if (drawsOwn) continue
    const outer = els.find((el) => !els.some((other) => other !== el && other.contains(el)))
    if (!outer) continue
    if (isHeadingRow(outer) && outer.parentElement) {
      let next = outer.nextElementSibling
      while (next && !next.matches(SECTION_ANCHOR) && !next.querySelector(SECTION_ANCHOR)) {
        next = next.nextElementSibling
      }
      spots.push({ id, parent: outer.parentElement, before: next })
    } else {
      spots.push({ id, parent: outer, before: null })
    }
  }
  return spots
}
