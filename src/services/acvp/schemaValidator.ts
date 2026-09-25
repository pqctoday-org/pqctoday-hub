// SPDX-License-Identifier: GPL-3.0-only
/**
 * A deliberately small JSON Schema (draft 2020-12) SUBSET interpreter for the
 * pinned ACVP schemas in ./schemas/.
 *
 * Why not ajv at runtime: ajv is a dev-only dependency here and compiles
 * schemas with `new Function`, which the Hub's CSP/OWASP rules forbid in
 * production code. The schema FILES stay the single, language-neutral source
 * of truth (a Python runner can feed the very same files to `jsonschema`);
 * `schemaValidator.test.ts` cross-checks this interpreter against ajv on the
 * fixtures and on malformed mutations so the two cannot silently disagree.
 *
 * Supported keywords: $ref (local "#/$defs/…" only), type, const, enum,
 * required, properties, additionalProperties (boolean or schema), items,
 * minItems, minimum, maxLength, pattern (whitelisted — see PATTERNS), allOf,
 * if/then/else, boolean schemas. Annotation keywords are ignored. ANY other
 * keyword throws at validation time, so a schema edit can never be silently
 * weaker than it reads.
 */

export interface SchemaDiagnostic {
  /** JSONPath-style location of the offending value, e.g. `$.testGroups[3].tests[0].c`. */
  path: string
  /** The JSON Schema keyword that failed (or `parse`/`envelope`/`unique`/… for non-schema checks). */
  keyword: string
  /** Human-readable reason. */
  reason: string
}

type Schema = boolean | { [k: string]: unknown }

const ANNOTATIONS = new Set(['$schema', '$id', '$comment', '$defs', 'title', 'description'])
const SUPPORTED = new Set([
  '$ref',
  'type',
  'const',
  'enum',
  'required',
  'properties',
  'additionalProperties',
  'items',
  'minItems',
  'minimum',
  'maxLength',
  'pattern',
  'allOf',
  'if',
  'then',
  'else',
])

/**
 * `pattern` values are mapped to literal RegExps instead of `new RegExp(str)`:
 * the schemas are data, and a non-literal RegExp built from data is exactly
 * what eslint-plugin-security's detect-non-literal-regexp exists to stop.
 */
const PATTERNS: Record<string, RegExp> = {
  '^([0-9A-Fa-f]{2})*$': /^([0-9A-Fa-f]{2})*$/,
  '^[0-9a-f]{64}$': /^[0-9a-f]{64}$/,
  '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$':
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
}

const jsonType = (v: unknown): string => {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number'
  return typeof v
}

const typeMatches = (v: unknown, t: string): boolean => {
  const actual = jsonType(v)
  if (t === 'number') return actual === 'number' || actual === 'integer'
  return actual === t
}

const deepEqual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

const describe = (v: unknown): string => {
  const s = JSON.stringify(v)
  return s === undefined ? String(v) : s.length > 60 ? `${s.slice(0, 57)}...` : s
}

const childPath = (path: string, key: string | number): string =>
  typeof key === 'number'
    ? `${path}[${key}]`
    : /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
      ? `${path}.${key}`
      : `${path}[${JSON.stringify(key)}]`

/** Validate `value` against `root`; returns every diagnostic found (empty = valid). */
export const validateAgainstSchema = (
  root: Record<string, unknown>,
  value: unknown,
  basePath = '$'
): SchemaDiagnostic[] => {
  const defs = (root.$defs ?? {}) as Record<string, Schema>

  const resolve = (ref: string): Schema => {
    const m = /^#\/\$defs\/([A-Za-z0-9_-]+)$/.exec(ref)
    if (!m) throw new Error(`schemaValidator: unsupported $ref "${ref}" (local #/$defs/* only)`)
    const target = defs[m[1]]
    if (target === undefined) throw new Error(`schemaValidator: unresolved $ref "${ref}"`)
    return target
  }

  const walk = (schema: Schema, v: unknown, path: string, out: SchemaDiagnostic[]): void => {
    if (schema === true) return
    if (schema === false) {
      out.push({ path, keyword: 'false', reason: 'property is not permitted here' })
      return
    }
    for (const k of Object.keys(schema)) {
      if (!SUPPORTED.has(k) && !ANNOTATIONS.has(k)) {
        throw new Error(`schemaValidator: unsupported keyword "${k}" at schema for ${path}`)
      }
    }
    const s = schema as Record<string, unknown>

    if (typeof s.$ref === 'string') walk(resolve(s.$ref), v, path, out)

    if (s.type !== undefined) {
      const types = (Array.isArray(s.type) ? s.type : [s.type]) as string[]
      if (!types.some((t) => typeMatches(v, t))) {
        out.push({
          path,
          keyword: 'type',
          reason: `expected ${types.join(' or ')}, got ${jsonType(v)}`,
        })
        return // further keywords would only add noise about the same value
      }
    }
    if ('const' in s && !deepEqual(v, s.const)) {
      out.push({
        path,
        keyword: 'const',
        reason: `expected ${describe(s.const)}, got ${describe(v)}`,
      })
    }
    if (Array.isArray(s.enum) && !s.enum.some((e) => deepEqual(e, v))) {
      out.push({
        path,
        keyword: 'enum',
        reason: `${describe(v)} is not one of ${s.enum.map((e) => describe(e)).join(', ')}`,
      })
    }
    if (typeof s.minimum === 'number' && typeof v === 'number' && v < s.minimum) {
      out.push({ path, keyword: 'minimum', reason: `${v} is below the minimum ${s.minimum}` })
    }
    if (typeof s.maxLength === 'number' && typeof v === 'string' && v.length > s.maxLength) {
      out.push({
        path,
        keyword: 'maxLength',
        reason: `string length ${v.length} exceeds ${s.maxLength}`,
      })
    }
    if (typeof s.pattern === 'string' && typeof v === 'string') {
      const re = PATTERNS[s.pattern]
      if (!re) throw new Error(`schemaValidator: pattern not whitelisted: ${s.pattern}`)
      if (!re.test(v)) {
        out.push({
          path,
          keyword: 'pattern',
          reason:
            s.pattern === '^([0-9A-Fa-f]{2})*$'
              ? 'expected an even-length hex string'
              : `does not match ${s.pattern}`,
        })
      }
    }

    if (jsonType(v) === 'object') {
      const obj = v as Record<string, unknown>
      const props = (s.properties ?? {}) as Record<string, Schema>
      if (Array.isArray(s.required)) {
        for (const r of s.required as string[]) {
          if (!(r in obj)) {
            out.push({
              path: childPath(path, r),
              keyword: 'required',
              reason: 'required property is missing',
            })
          }
        }
      }
      for (const [k, sub] of Object.entries(props)) {
        if (k in obj) walk(sub, obj[k], childPath(path, k), out)
      }
      if ('additionalProperties' in s) {
        const ap = s.additionalProperties as Schema
        for (const k of Object.keys(obj)) {
          if (k in props) continue
          if (ap === false) {
            out.push({
              path: childPath(path, k),
              keyword: 'additionalProperties',
              reason: 'property is not defined by the pinned schema',
            })
          } else {
            walk(ap, obj[k], childPath(path, k), out)
          }
        }
      }
    }

    if (Array.isArray(v)) {
      if (typeof s.minItems === 'number' && v.length < s.minItems) {
        out.push({
          path,
          keyword: 'minItems',
          reason: `expected at least ${s.minItems} item(s), got ${v.length}`,
        })
      }
      if (s.items !== undefined) {
        v.forEach((item, i) => walk(s.items as Schema, item, childPath(path, i), out))
      }
    }

    if (Array.isArray(s.allOf)) for (const sub of s.allOf as Schema[]) walk(sub, v, path, out)

    if (s.if !== undefined) {
      const probe: SchemaDiagnostic[] = []
      walk(s.if as Schema, v, path, probe)
      const branch = probe.length === 0 ? s.then : s.else
      if (branch !== undefined) walk(branch as Schema, v, path, out)
    }
  }

  const out: SchemaDiagnostic[] = []
  walk(root, value, basePath, out)
  // A conditional branch can restate a constraint the base schema already
  // reported (e.g. a `required` repeated inside `then`) — report it once.
  const seen = new Set<string>()
  return out.filter((d) => {
    const key = `${d.path}|${d.keyword}|${d.reason}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
