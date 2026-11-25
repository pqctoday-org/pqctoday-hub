// SPDX-License-Identifier: AGPL-3.0-only
/** The shape of `public/data/knowledge-core.json` (schema `knowledge-core/1`), as far as the Hub reads it. */
export interface KnowledgeRecord {
  id: string
  /** The kind of resource as the Hub names it ("library document", "module", "stage", ...). */
  kind: string
  type: string
  family: string
  label: string
  /** The Hub's own address for the resource: where `/go/<tag>` sends the visitor. */
  link: string
  status: string
  /** False for a retired or planned record; absent means active. */
  active?: boolean
  extract?: string
  verified?: string
  /** The tag of the record this one is a part of (a lesson's stage, a section's lesson, a parameter set's family). */
  parent?: string
  pos?: number | string
  /** The lesson (tag) the record belongs to in the Learn tree, and how that is known. */
  place?: string
  pb?: string
  fields?: Record<string, string | string[]>
  /** Dimensions: nice, role, ind, geo, prof; each with its basis in `b`. */
  d?: Record<string, string | string[]>
  b?: Record<string, string>
  /** A path's members in order, and the modules shown under "more". */
  parts?: string[]
  more?: string[]
  /** True for a library document that is a paid standard: the Hub links to it and never quotes it. */
  paid?: boolean
  facets?: Record<string, string>
}

export type KnowledgeLink = [from: string, rel: string, to: string, basis: string, source: string]

export interface KnowledgeCore {
  schema: string
  meta: {
    counts: { records: number; links: number; aliases: number; by_kind: Record<string, number> }
    inputs: [path: string, sha256: string][]
    input_patterns: { pattern: string; select: string }[]
    [k: string]: unknown
  }
  records: KnowledgeRecord[]
  /** Normalised name (see `normName`) to the records and kinds it names. */
  aliases: Record<string, [id: string, kind: string][]>
  links: KnowledgeLink[]
  /** Per lesson tag: how general or applied it is, and the topics it explains (what the Learn ranking reads). */
  curriculum?: Record<string, { breadth?: string; explains?: string[] }>
  /** "<from>|replaced_by|<to>": the checked passage that says the second document replaces the first. */
  successors?: Record<
    string,
    { kind: string; passage: string; source_url?: string; doc_sha256?: string }
  >
  relations: Record<string, { forward: string; inverse: string; [k: string]: unknown }>
}
