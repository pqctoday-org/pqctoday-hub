/**
 * analyze-mechanism-dispatch.ts — WS-G G-7 advertise-vs-dispatch analysis.
 *
 * For each engine, reads the pqctoday-hsm source AT THE COMMIT THE SHIPPED
 * WASM WAS BUILT FROM (public/wasm/wasm-provenance.json) with
 * `git show <commit>:<path>` — no checkout, nothing built, the hsm working
 * tree is never touched — extracts the CKM_ mechanisms the PKCS#11 entry
 * points actually dispatch on, and compares them with what the shipped
 * engine ADVERTISES at runtime (src/data/validation/
 * mechanism-inventory.generated.json, produced by
 * scripts/generate-mechanism-inventory.ts).
 *
 * Writes src/data/validation/mechanism-dispatch-report.generated.json with,
 * per engine: advertised − dispatched and dispatched − advertised, a status
 * per advertised mechanism, and the source sites (file:line, enclosing
 * function) behind every verdict so each one can be checked by hand.
 *
 *   npm run analyze:mechanism-dispatch          # write
 *   npm run analyze:mechanism-dispatch:check    # exit 1 if stale; skip if no hsm checkout
 *
 * Override the hsm location with HSM_REPO_PATH=/path/to/pqctoday-hsm.
 *
 * WHAT "DISPATCHED" MEANS HERE (a lexical analysis, not a compiler):
 *   a CKM_ name is dispatched when it appears as
 *   - a `case CKM_X:` label of a C++ `switch` whose scrutinee names a
 *     mechanism (e.g. `pMechanism->mechanism`), or a pattern of a Rust `match`
 *     arm whose scrutinee names a mechanism (e.g. `mech_type`);
 *   - an `==`/`!=` comparison or `matches!` whose other side names a mechanism;
 *   - an entry of a file-scope static table (C++, e.g. kMacMechTable) — kept
 *     as its own evidence kind so a reviewer can see it is table-driven;
 *   and that site is not a pure rejection (`return CKR_MECHANISM_INVALID`).
 *   Scrutinees naming a hash/MGF/PRF/KDF/digest parameter (e.g.
 *   `oaepP->hashAlg`) are parameter values, not dispatch.
 * LIMITS: preprocessor `#if`/`#ifdef` and Rust `#[cfg(...)]` other than
 * `cfg(test)` are NOT evaluated, so code compiled out of the WASM build still
 * counts; dispatch through helper functions is attributed to wherever the
 * CKM_ name is written. Treat `dispatched` as "the source names this
 * mechanism on a dispatch path", and every non-`dispatched` status as a lead
 * to verify by hand — not a verdict.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatJson, INVENTORY_OUT } from './generate-mechanism-inventory'
import type {
  EngineId,
  GeneratedMechanismInventoryFile,
} from '../src/wasm/softhsm/mechanismInventory'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const REPORT_OUT = join(ROOT, 'src/data/validation/mechanism-dispatch-report.generated.json')
const CHECK = process.argv.includes('--check')
const HSM = process.env.HSM_REPO_PATH ?? resolve(ROOT, '..', 'pqctoday-hsm')

// ── Git access (read-only, by commit) ────────────────────────────────────────

/** See scripts/ci/check-wasm-provenance.ts: hook env vars would redirect -C. */
const cleanGitEnv = (): NodeJS.ProcessEnv => {
  const env = { ...process.env }
  for (const k of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_PREFIX', 'GIT_COMMON_DIR'])
    delete env[k]
  return env
}
const git = (...args: string[]): string =>
  execFileSync('git', ['-C', HSM, ...args], {
    encoding: 'utf8',
    env: cleanGitEnv(),
    maxBuffer: 64 * 1024 * 1024,
  })

// ── Engine source layout ─────────────────────────────────────────────────────

interface EngineSourceSpec {
  lang: 'cpp' | 'rust'
  /** Files holding the PKCS#11 entry points and what they call to dispatch. */
  dispatchFiles: string[]
  /** Files the engine's own CKM_ name → value table is parsed from. */
  constantFiles: string[]
  /** Function bodies that implement advertisement, not dispatch. */
  excludeFunctions: string[]
  provenanceBundle: string
}

const SPECS: Record<EngineId, EngineSourceSpec> = {
  cpp: {
    lang: 'cpp',
    // SoftHSM_slots.cpp (prepareSupportedMechanisms, C_GetMechanismList/Info)
    // is the ADVERTISE side and is deliberately not scanned.
    dispatchFiles: [
      'src/lib/SoftHSM.cpp',
      'src/lib/SoftHSM_cipher.cpp',
      'src/lib/SoftHSM_digest.cpp',
      'src/lib/SoftHSM_kem.cpp',
      'src/lib/SoftHSM_keygen.cpp',
      'src/lib/SoftHSM_objects.cpp',
      'src/lib/SoftHSM_sessions.cpp',
      'src/lib/SoftHSM_sign.cpp',
    ],
    constantFiles: ['src/lib/pkcs11/pkcs11t.h', 'src/lib/vendor_mechanisms.h'],
    excludeFunctions: [],
    provenanceBundle: 'softhsm-cpp-engine',
  },
  rust: {
    lang: 'rust',
    // ffi.rs holds every C_* entry point the wasm32 build exports; crypto/
    // holds what they call. native/ is a parallel typed Rust API that no
    // C_* call reaches, ck_abi.rs is cfg'd out of wasm32-unknown-unknown,
    // and constants.rs holds only SUPPORTED_MECHS (the advertise side).
    dispatchFiles: [
      'rust/src/ffi.rs',
      'rust/src/crypto/handlers.rs',
      'rust/src/crypto/multipart.rs',
      'rust/src/crypto/bip32.rs',
      'rust/src/crypto/keccak.rs',
      'rust/src/crypto/lms.rs',
      'rust/src/crypto/split_key.rs',
      'rust/src/crypto/xmss_bridge.rs',
    ],
    constantFiles: ['rust/src/constants.rs'],
    excludeFunctions: ['mechanism_info', 'C_GetMechanismInfo'],
    provenanceBundle: 'softhsmrustv3-engine',
  },
}

// ── Lexing helpers ───────────────────────────────────────────────────────────

/** Blank comments, string and char literals (newlines kept → line numbers hold). */
export const stripCommentsAndStrings = (src: string, lang: 'cpp' | 'rust'): string => {
  const out = src.split('')
  const blank = (from: number, to: number) => {
    for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' '
  }
  let i = 0
  while (i < src.length) {
    const c = src[i]
    const n = src[i + 1]
    if (c === '/' && n === '/') {
      const end = src.indexOf('\n', i)
      const stop = end === -1 ? src.length : end
      blank(i, stop)
      i = stop
    } else if (c === '/' && n === '*') {
      let depth = 1
      let j = i + 2
      while (j < src.length && depth > 0) {
        if (lang === 'rust' && src[j] === '/' && src[j + 1] === '*') {
          depth++
          j += 2
        } else if (src[j] === '*' && src[j + 1] === '/') {
          depth--
          j += 2
        } else j++
      }
      blank(i, j)
      i = j
    } else if (c === '"') {
      // Rust raw strings r"..." / r#"..."# are handled by the 'r' branch.
      let j = i + 1
      while (j < src.length && src[j] !== '"') j += src[j] === '\\' ? 2 : 1
      blank(i + 1, j)
      i = j + 1
    } else if (
      lang === 'rust' &&
      c === 'r' &&
      /^r#*"/.test(src.slice(i, i + 8)) &&
      !/\w/.test(src[i - 1] ?? '')
    ) {
      const hashes = /^r(#*)"/.exec(src.slice(i, i + 8))![1]
      const close = `"${hashes}`
      const start = i + 2 + hashes.length
      const end = src.indexOf(close, start)
      const stop = end === -1 ? src.length : end
      blank(start, stop)
      i = stop + close.length
    } else if (c === "'") {
      // C++ char literal, or Rust char literal (not a lifetime 'a).
      const m = /^'(\\.[^']*|[^\\'\n])'/.exec(src.slice(i, i + 12))
      if (m) {
        blank(i + 1, i + m[0].length - 1)
        i += m[0].length
      } else i++
    } else i++
  }
  return out.join('')
}

interface Block {
  open: number
  close: number
  /** `switch (X)` / `match X` scrutinee text, when this block is one. */
  scrutinee: string | null
  kind: 'switch' | 'match' | 'fn' | 'other'
  fnName: string | null
}

const KEYWORDS = new Set([
  'if',
  'for',
  'while',
  'switch',
  'catch',
  'return',
  'sizeof',
  'else',
  'do',
])

/** Index every `{…}` block, classifying switch/match/function bodies. */
export const indexBlocks = (s: string, lang: 'cpp' | 'rust'): Block[] => {
  const blocks: Block[] = []
  const stack: number[] = []
  let segStart = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '{') {
      const head = s.slice(segStart, i)
      let kind: Block['kind'] = 'other'
      let scrutinee: string | null = null
      let fnName: string | null = null
      const sw = /\bswitch\s*\(([\s\S]*)\)\s*$/.exec(head)
      const mt = lang === 'rust' ? /\bmatch\s+([\s\S]+?)\s*$/.exec(head) : null
      if (lang === 'cpp' && sw) {
        kind = 'switch'
        scrutinee = sw[1].replace(/\s+/g, ' ').trim()
      } else if (mt && !/=>\s*$/.test(head)) {
        kind = 'match'
        scrutinee = mt[1].replace(/\s+/g, ' ').trim()
      } else if (lang === 'rust') {
        const f = /\bfn\s+(\w+)\s*(?:<[^>]*>)?\s*\([\s\S]*$/.exec(head)
        if (f) {
          kind = 'fn'
          fnName = f[1]
        }
      } else {
        const f = /([A-Za-z_][\w:~]*)\s*\([^;{}]*\)\s*(?:const\s*)?$/.exec(head.trimEnd())
        const name = f?.[1].split('::').pop()
        if (f && name && !KEYWORDS.has(name)) {
          kind = 'fn'
          fnName = f[1]
        }
      }
      stack.push(blocks.length)
      blocks.push({ open: i, close: -1, scrutinee, kind, fnName })
      segStart = i + 1
    } else if (c === '}') {
      const idx = stack.pop()
      if (idx !== undefined) blocks[idx].close = i
      segStart = i + 1
    } else if (c === ';') {
      segStart = i + 1
    }
  }
  return blocks
}

/** Innermost block containing `pos` that satisfies `pred`. */
const innermost = (blocks: Block[], pos: number, pred: (b: Block) => boolean): Block | null => {
  let best: Block | null = null
  for (const b of blocks) {
    if (b.open < pos && (b.close === -1 || pos < b.close) && pred(b)) {
      if (!best || b.open > best.open) best = b
    }
  }
  return best
}

/** Character ranges excluded from the scan (cfg(test) items, advertise fns). */
const excludedRanges = (
  s: string,
  blocks: Block[],
  lang: 'cpp' | 'rust',
  excludeFns: string[]
): [number, number][] => {
  const ranges: [number, number][] = []
  for (const b of blocks) {
    if (b.kind === 'fn' && b.fnName && excludeFns.includes(b.fnName)) ranges.push([b.open, b.close])
  }
  if (lang === 'rust') {
    const re = /#\[cfg\((?:test|any\(\s*test\b[^\]]*)\)\]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(s))) {
      // The attributed item: its first `{…}` block, unless a `;` ends it first.
      const after = m.index + m[0].length
      const brace = s.indexOf('{', after)
      const semi = s.indexOf(';', after)
      if (brace === -1 || (semi !== -1 && semi < brace)) {
        ranges.push([m.index, semi === -1 ? after : semi])
        continue
      }
      const b = blocks.find((x) => x.open === brace)
      if (b) ranges.push([m.index, b.close])
    }
  }
  return ranges
}

/** 1-based line number of `pos`, by binary search over precomputed line starts. */
const lineIndex = (s: string): ((pos: number) => number) => {
  const starts = [0]
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) starts.push(i + 1)
  return (pos) => {
    let lo = 0
    let hi = starts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (starts[mid] <= pos) lo = mid
      else hi = mid - 1
    }
    return lo + 1
  }
}

export type ScrutineeClass = 'mechanism' | 'parameter' | 'other'
export const classifyScrutinee = (expr: string): ScrutineeClass => {
  if (/hash|mgf|prf|kdf|digest/i.test(expr)) return 'parameter'
  if (/mech/i.test(expr)) return 'mechanism'
  return 'other'
}

export type SiteKind =
  'switch-case' | 'match-arm' | 'comparison' | 'matches-macro' | 'static-table' | 'reference'

export interface Site {
  token: string
  file: string
  line: number
  fn: string | null
  kind: SiteKind
  scrutineeClass: ScrutineeClass | null
  scrutinee: string | null
  rejects: boolean
  /** Enclosing C preprocessor conditions / Rust cfg attributes (not evaluated). */
  conditions: string[]
}

const REJECT_RE =
  /^\s*(?:\{\s*)?(?:return\s+)?(?:Err\s*\(\s*)?CKR_(?:MECHANISM_INVALID|FUNCTION_NOT_SUPPORTED|MECHANISM_PARAM_INVALID)\b/

/** Rust match arms: [patternStart, patternEnd, bodyStart] at the arm level. */
const matchArms = (s: string, b: Block): { pat: [number, number]; body: number }[] => {
  const arms: { pat: [number, number]; body: number }[] = []
  let depth = 0
  let mode: 'pat' | 'body' = 'pat'
  let patStart = b.open + 1
  let bodyStart = -1
  let bodyIsBlock = false
  for (let i = b.open + 1; i < b.close; i++) {
    const c = s[i]
    if (c === '(' || c === '[' || c === '{') {
      if (mode === 'body' && depth === 0 && c === '{' && /^\s*$/.test(s.slice(bodyStart, i)))
        bodyIsBlock = true
      depth++
    } else if (c === ')' || c === ']' || c === '}') {
      depth--
      if (mode === 'body' && depth === 0 && c === '}' && bodyIsBlock) {
        // Block-bodied arm ends at its closing brace (comma optional).
        mode = 'pat'
        patStart = i + 1
        while (/[\s,]/.test(s[patStart] ?? '')) patStart++
        i = patStart - 1
      }
    } else if (depth === 0 && mode === 'pat' && c === '=' && s[i + 1] === '>') {
      arms.push({ pat: [patStart, i], body: i + 2 })
      mode = 'body'
      bodyStart = i + 2
      bodyIsBlock = false
      i++
    } else if (depth === 0 && mode === 'body' && c === ',') {
      mode = 'pat'
      patStart = i + 1
    }
  }
  return arms
}

/**
 * C/C++: the stack of #if/#ifdef/#ifndef/#elif/#else conditions active on each
 * line (1-based), plus the line ranges of multi-line #define bodies.
 */
const preprocessorMap = (src: string): { cond: string[][]; defineLines: Set<number> } => {
  const lines = src.split('\n')
  const cond: string[][] = [[]]
  const defineLines = new Set<number>()
  const stack: string[] = []
  let inDefine = false
  lines.forEach((raw, idx) => {
    const lineNo = idx + 1
    const t = raw.trim()
    if (inDefine) defineLines.add(lineNo)
    const d = /^#\s*(if|ifdef|ifndef|elif|else|endif|define)\b\s*(.*)$/.exec(t)
    if (d) {
      const arg = d[2].replace(/\/\/.*$|\/\*.*?\*\//g, '').trim()
      if (d[1] === 'if') stack.push(arg)
      else if (d[1] === 'ifdef') stack.push(`defined(${arg})`)
      else if (d[1] === 'ifndef') stack.push(`!defined(${arg})`)
      else if (d[1] === 'elif') stack[stack.length - 1] = `(elif) ${arg}`
      else if (d[1] === 'else') stack[stack.length - 1] = `!(${stack[stack.length - 1]})`
      else if (d[1] === 'endif') stack.pop()
      else if (d[1] === 'define') defineLines.add(lineNo)
    }
    cond[lineNo] = [...stack]
    inDefine = (inDefine || /^#\s*define\b/.test(t)) && t.endsWith('\\')
  })
  return { cond, defineLines }
}

/** Rust: `#[cfg(...)]` attributes directly above the text ending at `pos`. */
const cfgAttrsBefore = (s: string, pos: number): string[] => {
  const head = s.slice(Math.max(0, pos - 400), pos)
  const m =
    /((?:\s*#\[[^\]]*\]\s*)+)(?:pub(?:\([^)]*\))?\s+)?(?:unsafe\s+)?(?:extern\s+"C"\s+)?(?:fn\s+\w+[^{]*)?$/.exec(
      head
    )
  if (!m) return []
  return [...m[1].matchAll(/#\[(cfg\([^\]]*\))\]/g)].map((x) => x[1])
}

/** All CKM_ sites in one file, classified. */
export const scanFile = (
  file: string,
  src: string,
  spec: Pick<EngineSourceSpec, 'lang' | 'excludeFunctions'>
): Site[] => {
  const s = stripCommentsAndStrings(src, spec.lang)
  const blocks = indexBlocks(s, spec.lang)
  const excluded = excludedRanges(s, blocks, spec.lang, spec.excludeFunctions)
  const isExcluded = (p: number) => excluded.some(([a, z]) => p >= a && p <= z)
  const lineOf = lineIndex(s)
  const pp = spec.lang === 'cpp' ? preprocessorMap(src) : null

  // Rust: map every match-arm pattern range to its match block.
  const armPatterns: { a: number; z: number; body: number; block: Block }[] = []
  if (spec.lang === 'rust') {
    for (const b of blocks) {
      if (b.kind !== 'match' || b.close === -1) continue
      for (const arm of matchArms(s, b)) {
        armPatterns.push({ a: arm.pat[0], z: arm.pat[1], body: arm.body, block: b })
      }
    }
  }

  // C++ function-like macros that expand to `case <first param>:` (e.g.
  // SoftHSM_sign.cpp's HASH_MLDSA_CASE) — an invocation is a case label.
  const caseMacros = new Set<string>()
  if (spec.lang === 'cpp') {
    const defRe = /^[ \t]*#[ \t]*define[ \t]+(\w+)\(\s*(\w+)[^)]*\)((?:[^\n]*\\\n)*[^\n]*)/gm
    let d: RegExpExecArray | null
    while ((d = defRe.exec(src))) {
      if (new RegExp(`\\bcase\\s+${d[2]}\\s*:`).test(d[3])) caseMacros.add(d[1])
    }
  }

  const sites: Site[] = []
  const re = /\bCKM_[A-Z0-9_]+\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    const pos = m.index
    const token = m[0]
    if (isExcluded(pos)) continue
    const lineStart = s.lastIndexOf('\n', pos) + 1
    const lineText = s.slice(
      lineStart,
      s.indexOf('\n', pos) === -1 ? s.length : s.indexOf('\n', pos)
    )
    if (/^\s*#\s*define\b/.test(lineText)) continue
    if (spec.lang === 'rust' && new RegExp(`\\bconst\\s+${token}\\s*:`).test(lineText)) continue

    const line = lineOf(pos)
    if (pp?.defineLines.has(line)) continue
    const fnBlock = innermost(blocks, pos, (b) => b.kind === 'fn')
    const fn = fnBlock?.fnName ?? null
    const conditions =
      spec.lang === 'cpp'
        ? (pp?.cond[line] ?? [])
        : [
            ...(fnBlock ? cfgAttrsBefore(s, s.lastIndexOf('fn', fnBlock.open)) : []),
            ...cfgAttrsBefore(s, pos),
          ]
    const base = { token, file, line, fn, conditions: [...new Set(conditions)] }
    const before = s.slice(Math.max(0, pos - 160), pos)
    const after = s.slice(pos + token.length, pos + token.length + 200)

    // C++ case label.
    const viaMacro = /(\w+)\s*\(\s*$/.exec(before)?.[1]
    if (spec.lang === 'cpp' && viaMacro && caseMacros.has(viaMacro)) {
      const sw = innermost(blocks, pos, (b) => b.kind === 'switch')
      sites.push({
        ...base,
        kind: 'switch-case',
        scrutinee: sw?.scrutinee ?? null,
        scrutineeClass: sw?.scrutinee ? classifyScrutinee(sw.scrutinee) : 'other',
        rejects: false,
      })
      continue
    }
    if (spec.lang === 'cpp' && /\bcase\s*$/.test(before)) {
      const sw = innermost(blocks, pos, (b) => b.kind === 'switch')
      // Body of this case group: text after the group's last consecutive label.
      const rest = s.slice(pos + token.length)
      const grp = /^\s*:(?:\s*case\s+[\w:]+\s*:)*/.exec(rest)
      const body = grp ? rest.slice(grp[0].length, grp[0].length + 200) : ''
      sites.push({
        ...base,
        kind: 'switch-case',
        scrutinee: sw?.scrutinee ?? null,
        scrutineeClass: sw?.scrutinee ? classifyScrutinee(sw.scrutinee) : 'other',
        rejects: REJECT_RE.test(body),
      })
      continue
    }
    // Rust match-arm pattern.
    const arm = armPatterns
      .filter((p) => pos >= p.a && pos < p.z)
      .sort((x, y) => y.block.open - x.block.open)[0]
    if (arm) {
      const body = s.slice(arm.body, arm.body + 200)
      sites.push({
        ...base,
        kind: 'match-arm',
        scrutinee: arm.block.scrutinee,
        scrutineeClass: arm.block.scrutinee ? classifyScrutinee(arm.block.scrutinee) : 'other',
        rejects: REJECT_RE.test(body),
      })
      continue
    }
    // Comparisons: `X == CKM_…` / `CKM_… == X`.
    const lhs = /([\w.\->()[\]]+)\s*[!=]=\s*$/.exec(before)
    const rhs = /^\s*[!=]=\s*([\w.\->()[\]]+)/.exec(after)
    if (lhs || rhs) {
      const other = (lhs?.[1] ?? rhs?.[1] ?? '').trim()
      sites.push({
        ...base,
        kind: 'comparison',
        scrutinee: other,
        scrutineeClass: classifyScrutinee(other),
        rejects: false,
      })
      continue
    }
    // Rust matches!(expr, PATTERN).
    const mm = /matches!\s*\(\s*([^,]+),[^)]*$/.exec(before)
    if (spec.lang === 'rust' && mm) {
      sites.push({
        ...base,
        kind: 'matches-macro',
        scrutinee: mm[1].trim(),
        scrutineeClass: classifyScrutinee(mm[1]),
        rejects: false,
      })
      continue
    }
    // C++ file-scope static table entry (e.g. kMacMechTable).
    if (spec.lang === 'cpp' && !fnBlock) {
      // Walk out through nested initializer braces to the `name[] = {` head.
      const name =
        blocks
          .filter((b) => b.open < pos && (b.close === -1 || pos < b.close))
          .map(
            (b) =>
              /(\w+)\s*\[\s*\w*\s*\]\s*=\s*$/.exec(s.slice(Math.max(0, b.open - 200), b.open))?.[1]
          )
          .find(Boolean) ?? null
      if (name) {
        sites.push({
          ...base,
          kind: 'static-table',
          scrutinee: name,
          scrutineeClass: 'mechanism',
          rejects: false,
        })
        continue
      }
    }
    sites.push({
      ...base,
      kind: 'reference',
      scrutinee: null,
      scrutineeClass: null,
      rejects: false,
    })
  }
  return sites
}

/**
 * CKM_ name → value from the engine's own headers / constants. Values may be
 * literals, aliases (`#define CKM_A CKM_B`) or simple OR/+ expressions
 * (`(CKM_VENDOR_DEFINED | 0x00000100UL)`); each is resolved or dropped.
 */
export const parseConstants = (
  files: { lang: 'cpp' | 'rust'; src: string }[]
): Map<string, number> => {
  const exprs = new Map<string, string>()
  for (const { lang, src } of files) {
    const re =
      lang === 'cpp'
        ? /^[ \t]*#[ \t]*define[ \t]+(CKM_[A-Z0-9_]+)[ \t]+([^\n/]+)/gm
        : /\bconst\s+(CKM_[A-Z0-9_]+)\s*:\s*u\d+\s*=\s*([^;]+);/gm
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) exprs.set(m[1], m[2].trim())
  }
  const values = new Map<string, number>()
  const evalExpr = (expr: string): number | undefined => {
    const terms = expr
      .replace(/[()]/g, ' ')
      .split(/[|+]/)
      .map((t) => t.trim())
      .filter(Boolean)
    if (terms.length === 0) return undefined
    let acc = 0
    for (const t of terms) {
      const lit = /^(0x[0-9a-fA-F_]+|\d+)(?:[uU]?[lL]{0,2}|_?u\d+)?$/.exec(t)
      const v = lit ? Number(lit[1].replace(/_/g, '')) : values.get(t)
      if (v === undefined || Number.isNaN(v)) return undefined
      acc = terms.length > 1 && expr.includes('|') ? (acc | v) >>> 0 : (acc + v) >>> 0
    }
    return acc >>> 0
  }
  for (let pass = 0; pass < 6; pass++) {
    for (const [name, expr] of exprs) {
      if (values.has(name)) continue
      const v = evalExpr(expr)
      if (v !== undefined) values.set(name, v)
    }
  }
  return values
}

// ── Report ───────────────────────────────────────────────────────────────────

export type AdvertisedStatus =
  'dispatched' | 'referenced-not-dispatched' | 'rejected-only' | 'not-referenced'

const siteRef = (x: Site) =>
  `${x.file}:${x.line}${x.fn ? ` (${x.fn})` : ''}${x.conditions.length ? ` [only if ${x.conditions.join(' && ')}]` : ''}`
const MAX_SITES = 12

interface MechanismDispatchRecord {
  typeHex: string
  name: string | null
  /** Every CKM_ name the engine's constants give this value (aliases). */
  sourceNames: string[]
  status: AdvertisedStatus
  /** Every dispatch site sits under an (unevaluated) #if / cfg condition. */
  dispatchOnlyUnderCondition: boolean
  dispatchKinds: SiteKind[]
  dispatchFunctions: string[]
  dispatchSites: string[]
  otherSites: string[]
}

const hex32 = (n: number) => `0x${(n >>> 0).toString(16).padStart(8, '0')}`

const analyzeEngine = (engine: EngineId, inv: GeneratedMechanismInventoryFile) => {
  const spec = SPECS[engine]
  const recorded = inv.engines[engine].identity.sourceCommit
  if (!recorded) throw new Error(`${engine}: no sourceCommit recorded — cannot pick source`)
  const commit = git('rev-parse', '--verify', `${recorded}^{commit}`).trim()
  const read = (path: string) => ({
    path,
    blob: git('rev-parse', `${commit}:${path}`).trim(),
    src: git('show', `${commit}:${path}`),
  })
  const dispatch = spec.dispatchFiles.map(read)
  const constants = spec.constantFiles.map(read)
  const values = parseConstants(constants.map((c) => ({ lang: spec.lang, src: c.src })))
  const namesByValue = new Map<number, string[]>()
  for (const [n, v] of values) namesByValue.set(v, [...(namesByValue.get(v) ?? []), n].sort())

  const sites = dispatch.flatMap((f) => scanFile(f.path, f.src, spec))
  const isDispatch = (x: Site) =>
    !x.rejects &&
    x.scrutineeClass === 'mechanism' &&
    ['switch-case', 'match-arm', 'comparison', 'matches-macro', 'static-table'].includes(x.kind)

  const byValue = new Map<number, Site[]>()
  const unresolvedTokens = new Set<string>()
  for (const x of sites) {
    const v = values.get(x.token)
    if (v === undefined) {
      unresolvedTokens.add(x.token)
      continue
    }
    byValue.set(v, [...(byValue.get(v) ?? []), x])
  }

  const advertised = inv.engines[engine].inventory.mechanisms
  const advertisedTypes = new Set(advertised.map((m) => m.type))
  const records: MechanismDispatchRecord[] = advertised.map((m) => {
    const all = byValue.get(m.type) ?? []
    const d = all.filter(isDispatch)
    const status: AdvertisedStatus =
      d.length > 0
        ? 'dispatched'
        : all.length === 0
          ? 'not-referenced'
          : all.every((x) => x.rejects)
            ? 'rejected-only'
            : 'referenced-not-dispatched'
    return {
      typeHex: m.typeHex,
      name: m.name,
      sourceNames: namesByValue.get(m.type) ?? [],
      status,
      dispatchOnlyUnderCondition: d.length > 0 && d.every((x) => x.conditions.length > 0),
      dispatchKinds: [...new Set(d.map((x) => x.kind))].sort(),
      dispatchFunctions: [...new Set(d.map((x) => x.fn ?? '(file scope)'))].sort(),
      dispatchSites: d.slice(0, MAX_SITES).map(siteRef),
      otherSites: all
        .filter((x) => !isDispatch(x))
        .slice(0, MAX_SITES)
        .map(
          (x) =>
            `${siteRef(x)} [${x.kind}${x.rejects ? ', rejects' : ''}${x.scrutinee ? `: ${x.scrutinee}` : ''}]`
        ),
    }
  })

  const dispatchedNotAdvertised = [...byValue.entries()]
    .filter(([v, xs]) => !advertisedTypes.has(v) && xs.some(isDispatch))
    .sort(([a], [b]) => a - b)
    .map(([v, xs]) => {
      const d = xs.filter(isDispatch)
      return {
        typeHex: hex32(v),
        sourceNames: namesByValue.get(v) ?? [],
        dispatchOnlyUnderCondition: d.every((x) => x.conditions.length > 0),
        dispatchKinds: [...new Set(d.map((x) => x.kind))].sort(),
        dispatchFunctions: [...new Set(d.map((x) => x.fn ?? '(file scope)'))].sort(),
        dispatchSites: d.slice(0, MAX_SITES).map(siteRef),
      }
    })

  const advertisedNotDispatched = records.filter((r) => r.status !== 'dispatched')
  return {
    source: {
      repo: inv.engines[engine].identity.sourceRepo,
      recordedCommit: recorded,
      commitRead: commit,
      commitMatchesWasmBuild: true as const,
      readMethod: 'git show <commitRead>:<path> (no checkout; hsm working tree untouched)',
      dispatchFiles: dispatch.map((f) => ({ path: f.path, blob: f.blob })),
      constantFiles: constants.map((f) => ({ path: f.path, blob: f.blob })),
    },
    advertisedInventorySha256: inv.engines[engine].inventory.inventorySha256,
    counts: {
      advertised: advertised.length,
      advertisedAndDispatched: records.length - advertisedNotDispatched.length,
      advertisedMinusDispatched: advertisedNotDispatched.length,
      dispatchedMinusAdvertised: dispatchedNotAdvertised.length,
      byStatus: Object.fromEntries(
        (
          ['dispatched', 'referenced-not-dispatched', 'rejected-only', 'not-referenced'] as const
        ).map((st) => [st, records.filter((r) => r.status === st).length])
      ),
    },
    advertisedMinusDispatched: advertisedNotDispatched,
    dispatchedMinusAdvertised: dispatchedNotAdvertised,
    unresolvedTokens: [...unresolvedTokens].sort(),
    advertised: records,
  }
}

const buildReport = (inv: GeneratedMechanismInventoryFile) => ({
  _comment:
    'GENERATED by scripts/analyze-mechanism-dispatch.ts — do not edit. WS-G G-7: what each shipped engine ADVERTISES (runtime, mechanism-inventory.generated.json) versus the CKM_ names its PKCS#11 dispatch paths name in the hsm source at the commit the WASM was built from. LEXICAL analysis: preprocessor #if/#ifdef and Rust cfg (other than cfg(test)) are NOT evaluated, dispatch through helpers is attributed to where the name is written. Every non-"dispatched" status is a lead to verify by hand, not a verdict; "dispatched" means the source names the mechanism on a dispatch path, not that it works. Nothing here changes what an engine advertises.',
  schema: 'pqctoday.mechanism-dispatch-report/v1',
  generator: 'scripts/analyze-mechanism-dispatch.ts',
  inventoryFile: relative(ROOT, INVENTORY_OUT),
  engines: {
    cpp: analyzeEngine('cpp', inv),
    rust: analyzeEngine('rust', inv),
  },
})

const main = async (): Promise<void> => {
  const rel = relative(ROOT, REPORT_OUT)
  if (!existsSync(join(HSM, '.git'))) {
    const msg = `pqctoday-hsm not found at ${HSM} — cannot read engine source.`
    if (CHECK) {
      console.log(`⏭  ${msg} Skipping ${rel} freshness check.`)
      return
    }
    console.error(`✗ ${msg} Set HSM_REPO_PATH.`)
    process.exit(2)
  }
  const inv = JSON.parse(readFileSync(INVENTORY_OUT, 'utf8')) as GeneratedMechanismInventoryFile
  const report = buildReport(inv)
  const formatted = await formatJson(report, REPORT_OUT)
  for (const e of ['cpp', 'rust'] as const) {
    const r = report.engines[e]
    console.log(
      `${e}: hsm ${r.source.commitRead.slice(0, 10)} — advertised ${r.counts.advertised}, ` +
        `advertised−dispatched ${r.counts.advertisedMinusDispatched}, ` +
        `dispatched−advertised ${r.counts.dispatchedMinusAdvertised}`
    )
  }
  if (CHECK) {
    const onDisk = existsSync(REPORT_OUT) ? readFileSync(REPORT_OUT, 'utf8') : null
    if (onDisk === formatted) {
      console.log(`✓ ${rel} is current`)
      return
    }
    console.error(
      `✗ ${rel} is ${onDisk === null ? 'missing' : 'STALE'}. Run: npm run analyze:mechanism-dispatch`
    )
    process.exit(1)
  }
  writeFileSync(REPORT_OUT, formatted)
  console.log(`Wrote ${rel}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? (e.stack ?? e.message) : e)
    process.exit(1)
  })
}
