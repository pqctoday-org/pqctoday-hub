// SPDX-License-Identifier: GPL-3.0-only
//
// bindings.ts — per-test `$NAME` → resolved-value map. Built up as
// responses come back: the first time an expected response contains
// `$UNIQUE_IDENTIFIER_0`, it's bound to whatever UID the actual response
// returned at the same tree position; subsequent requests referencing
// `$UNIQUE_IDENTIFIER_0` get the bound value. `$NOW` is bound once at test
// start.
//
// Ported from pqctoday-hsm/kmip/conformance/harness/dispatcher_replay.py's
// `Bindings` class.
import type { TtlvNode } from '../kmipEngine'
import { norm, type KmipNode } from '../ttlv/nodes'
import { isVolatileTag, tagToPlaceholder } from './tagRules'

export class Bindings {
  private readonly values = new Map<string, unknown>()
  // Tag-name auto-binds ($MAC_DATA et al.) — a RESOLUTION FALLBACK only,
  // kept separate from `values` so an eager tag-name bind never shadows
  // the comparator's bind-on-first-use of an explicit corpus placeholder.
  private readonly autoValues = new Map<string, unknown>()

  bind(name: string, value: unknown): void {
    if (this.values.has(name) && this.values.get(name) !== value) {
      throw new Error(`placeholder '${name}' re-bound: was ${String(this.values.get(name))}, now ${String(value)}`)
    }
    this.values.set(name, value)
  }

  has(name: string): boolean {
    return this.values.has(name)
  }

  get(name: string): unknown {
    return this.values.get(name)
  }

  /** Return a deep copy of `node` with every `$NAME` value replaced by the
   * bound value. Throws on an unresolved placeholder. */
  resolveTree(node: KmipNode): KmipNode {
    const children = node.children?.map((c) => this.resolveTree(c))
    let value = node.value
    if (typeof value === 'string' && value.startsWith('$')) {
      if (value === '$NOW') {
        value = String(Math.floor(Date.now() / 1000))
      } else if (value.startsWith('$NOW-') || value.startsWith('$NOW+')) {
        // `$NOW-3600` / `$NOW+86400` arithmetic — OASIS uses these for
        // ActivationDate / DeactivationDate sentinel values.
        const offset = Number(value.slice(4))
        if (Number.isNaN(offset)) throw new Error(`malformed NOW arithmetic '${value}'`)
        value = String(Math.floor(Date.now() / 1000) + offset)
      } else if (this.values.has(value)) {
        value = this.values.get(value) as typeof value
      } else if (this.autoValues.has(value)) {
        value = this.autoValues.get(value) as typeof value
      } else {
        throw new Error(`unresolved placeholder '${value}' on ${node.tag}`)
      }
    }
    return { tag: node.tag, type: node.type, value, children }
  }

  /** Walk `expected` (from the XML transcript) and `actual` (the decoded,
   * name-annotated real response); whenever `expected` has a `$NAME`
   * value, bind `NAME` to actual's corresponding value. Also auto-binds
   * `$TAG_NAME` (upper-underscore form of the tag) to the actual value at
   * every leaf, so a later request can reference e.g. `$MAC_DATA` against
   * the `MACData` leaf of an earlier response without an explicit
   * placeholder in the XML.
   *
   * Container traversal is positional EXCEPT inside an `Attributes`
   * Structure, where order is variable per §4.1.2 item 5 — there children
   * are matched by tag name so a placeholder attached to a specific
   * attribute binds against THAT attribute's actual value. */
  harvestFromResponse(expected: KmipNode, actual: TtlvNode): void {
    if (isVolatileTag(expected.tag)) return
    if (typeof expected.value === 'string' && expected.value.startsWith('$') && expected.value !== '$NOW') {
      try {
        this.bind(expected.value, actual.value)
      } catch {
        // Mismatch — the comparator will catch it.
      }
    }
    if (actual.value !== undefined && !(expected.value === '$NOW')) {
      const auto = tagToPlaceholder(expected.tag)
      if (auto) {
        const key = `$${auto}`
        if (!this.autoValues.has(key)) {
          // First-write wins — the fallback map, so an explicit corpus
          // placeholder of the same name still binds on first use.
          this.autoValues.set(key, actual.value)
        }
      }
    }

    if (norm(expected.tag) === norm('Attributes')) {
      const actualByName = new Map<string, TtlvNode[]>()
      for (const c of actual.children ?? []) {
        const key = norm(c.tag)
        const list = actualByName.get(key) ?? []
        list.push(c)
        actualByName.set(key, list)
      }
      for (const ec of expected.children ?? []) {
        const candidates = actualByName.get(norm(ec.tag))
        const ac = candidates?.shift()
        if (ac) this.harvestFromResponse(ec, ac)
      }
    } else {
      const ecs = expected.children ?? []
      const acs = actual.children ?? []
      for (let i = 0; i < Math.min(ecs.length, acs.length); i++) {
        this.harvestFromResponse(ecs[i], acs[i])
      }
    }
  }
}
