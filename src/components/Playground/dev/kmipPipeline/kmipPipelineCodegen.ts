// SPDX-License-Identifier: GPL-3.0-only
/**
 * KMIP/CACP pipeline code generation (dev-tabs-pkcs11-kmip plan WS-E).
 *
 * Emits a Python script driving the pqctoday_kmip shim — real KmipClient
 * calls, the exact method names/signatures the real sandbox client uses
 * (confirmed by reading pqctoday-hsm/kmip/python-client's source directly
 * during P3), plus the shim's hub-only load_policy/dry_run convenience
 * methods for the policy-plane steps.
 *
 * Same run-result protocol as the PKCS#11 side (pipeline/pipelineCodegen.ts):
 * each step prints `###STEP <id> ok|error###`, parsed by the SAME
 * pipeline/pipelineRun.ts's parseRun — one shared marker contract, not a
 * second copy of it.
 *
 * UIDs address each other by step id, never by prose, mirroring the
 * PKCS#11 side's pub_<id>/priv_<id>/key_<id> convention:
 *   uid_<id>       a Create (symmetric)/Encapsulate/Decapsulate step's
 *                  own produced object uid
 *   priv_<id> / pub_<id>   a CreateKeyPair step's two produced uids
 */
import { KMIP_PRIMITIVES, type KmipOp, type KmipPrimSpec } from './kmipPipelinePrimitives'

export type KmipParamValue =
  | { bind: 'literal'; value: string }
  | { bind: 'ref'; step: string; part?: 'pub' | 'priv' | 'uid' | 'ciphertext' }

export type KmipStepStatus = 'idle' | 'running' | 'ok' | 'error' | 'skipped'

export interface KmipStepResult {
  text: string
  status: 'ok' | 'error'
}

export interface KmipOpStep {
  kind: 'op'
  id: string
  primId: string
  op: KmipOp
  params: Record<string, KmipParamValue>
  status?: KmipStepStatus
  output?: KmipStepResult | null
}

export interface KmipLoadPolicyStep {
  kind: 'load-policy'
  id: string
  /** Filename under /kmip-policies/ (fetched at run time, same real files
   *  the Policy plane's own preset picker uses). */
  policyFile: string
  status?: KmipStepStatus
  output?: KmipStepResult | null
}

export interface KmipExpectDenyStep {
  kind: 'expect-deny'
  id: string
  /** The preceding op step this asserts was REFUSED. Mirrors the real
   *  sample's expect_deny(): `denied = not result.ok`. */
  targetStepId: string
  status?: KmipStepStatus
  output?: KmipStepResult | null
}

export interface KmipDryRunStep {
  kind: 'dry-run'
  id: string
  op: string
  algorithm?: string
  status?: KmipStepStatus
  output?: KmipStepResult | null
}

export type KmipStep = KmipOpStep | KmipLoadPolicyStep | KmipExpectDenyStep | KmipDryRunStep

export const DEFAULT_KMIP_MESSAGE = 'pqctoday KMIP Developer tab payload'

/** 'text' (default): the message is UTF-8 and becomes a `b'...'` literal —
 *  unchanged behavior. 'hex': the message field holds a hex string and
 *  becomes `bytes.fromhex('...')`, so the generated script can carry a
 *  genuinely binary (non-UTF-8) payload — see the W3b comment on
 *  `_bytes_to_spec_field` in the pqctoday_kmip shim for why the engine
 *  already accepts this on Sign (and Encrypt, once that op exists here). */
export type KmipMessageMode = 'text' | 'hex'

export interface KmipEmitOptions {
  message?: string
  messageMode?: KmipMessageMode
}

const pyStr = (s: string) =>
  `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`
const pyBytes = (s: string) => `b${pyStr(s)}`
const pyBytesFromHex = (hex: string) => `bytes.fromhex(${pyStr(hex)})`

const sym = (id: string) => id.replace(/[^A-Za-z0-9_]/g, '_')
const privVar = (id: string) => `priv_${sym(id)}`
const pubVar = (id: string) => `pub_${sym(id)}`
const uidVar = (id: string) => `uid_${sym(id)}`
const ctVar = (id: string) => `ct_${sym(id)}`
const resultVar = (id: string) => `r_${sym(id)}`

function renderRef(pv: KmipParamValue | undefined, fallback = 'None'): string {
  if (!pv) return fallback
  if (pv.bind === 'literal') return pyStr(pv.value)
  switch (pv.part) {
    case 'priv':
      return privVar(pv.step)
    case 'pub':
      return pubVar(pv.step)
    case 'ciphertext':
      return ctVar(pv.step)
    default:
      return uidVar(pv.step)
  }
}

/**
 * `mayBeDenied`: true when a LATER `expect-deny` step targets this one —
 * meaning failure here is the point (a governed refusal), not an error.
 * Mirrors the real sample's own shape exactly: `early = c.sign(priv,
 * b"too early", "ML_DSA_65")` never checks `.ok` or raises — the result is
 * just handed to `expect_deny()`, which does the pass/fail judgment.
 * Emitting an unconditional raise here (as every OTHER op step correctly
 * does) breaks that on the very first governed-refusal step — confirmed
 * live, dev-tabs-pkcs11-kmip plan P3b: a real WrongKeyLifecycleState
 * failure on the intentionally-early Sign step aborted the whole pipeline
 * before the expect-deny step ever got a chance to judge it.
 */
function emitOpStep(
  step: KmipOpStep,
  spec: KmipPrimSpec,
  message: string,
  messageMode: KmipMessageMode,
  mayBeDenied: boolean
): string[] {
  const lines: string[] = []
  const rv = resultVar(step.id)
  const raiseUnless = (label: string) =>
    mayBeDenied
      ? []
      : [`if not ${rv}.ok: raise RuntimeError(${rv}.message or ${pyStr(`${label} failed`)})`]
  switch (step.op) {
    case 'createKeyPair':
      lines.push(
        `${rv} = c.create_key_pair(${pyStr(spec.algorithm)}, 'Sign Verify Encapsulate Decapsulate')`
      )
      lines.push(`${privVar(step.id)} = ${rv}.get('PrivateKeyUniqueIdentifier')`)
      lines.push(`${pubVar(step.id)} = ${rv}.get('PublicKeyUniqueIdentifier')`)
      lines.push(...raiseUnless('CreateKeyPair'))
      lines.push(`print(f'  priv={${privVar(step.id)}}  pub={${pubVar(step.id)}}')`)
      break
    case 'create':
      lines.push(`${rv} = c.create_symmetric(${pyStr(spec.algorithm)}, 256)`)
      lines.push(`${uidVar(step.id)} = ${rv}.get('UniqueIdentifier')`)
      lines.push(...raiseUnless('Create'))
      lines.push(`print(f'  {${uidVar(step.id)}} · {${rv}.get("objectType")}')`)
      break
    case 'activate': {
      const uid = renderRef(step.params.uid)
      lines.push(`${rv} = c.activate(${uid})`)
      lines.push(...raiseUnless('Activate'))
      lines.push(`print(f'  now {${rv}.get("state")}')`)
      break
    }
    case 'sign': {
      const priv = renderRef(step.params.privUid)
      const text = step.params.text?.bind === 'literal' ? step.params.text.value : message
      const bytesExpr = messageMode === 'hex' ? pyBytesFromHex(text) : pyBytes(text)
      lines.push(`${rv} = c.sign(${priv}, ${bytesExpr}, ${pyStr(spec.algorithm)})`)
      lines.push(`print(f'  signature {len(${rv}.get("SignatureData") or "") // 2} bytes')`)
      lines.push(...raiseUnless('Sign'))
      break
    }
    case 'encapsulate': {
      const pub = renderRef(step.params.pubUid)
      lines.push(`${rv} = c.encapsulate(${pub})`)
      lines.push(`${ctVar(step.id)} = ${rv}.get('Data')`)
      lines.push(`${uidVar(step.id)} = ${rv}.get('UniqueIdentifier')`)
      lines.push(...raiseUnless('Encapsulate'))
      lines.push(`print(f'  ciphertext {len(${ctVar(step.id)} or "") // 2} bytes')`)
      break
    }
    case 'decapsulate': {
      const priv = renderRef(step.params.privUid)
      const ct = renderRef(step.params.ciphertext)
      lines.push(`${rv} = c.decapsulate(${priv}, bytes.fromhex(${ct}))`)
      lines.push(`${uidVar(step.id)} = ${rv}.get('UniqueIdentifier')`)
      lines.push(...raiseUnless('Decapsulate'))
      lines.push(`print(f'  secret={${uidVar(step.id)}}')`)
      break
    }
    case 'getAttributes': {
      const uid = renderRef(step.params.uid)
      lines.push(`${rv} = c.get_attributes(${uid})`)
      lines.push(...raiseUnless('GetAttributes'))
      lines.push(
        `print(f'  alg={${rv}.get("CryptographicAlgorithm")} state={${rv}.get("State")} usage={${rv}.get("CryptographicUsageMask")}')`
      )
      break
    }
    case 'locate':
      lines.push(`${rv} = c.locate()`)
      lines.push(...raiseUnless('Locate'))
      lines.push(`print(f'  found {len(${rv}.get("uids") or [])} object(s)')`)
      break
    case 'revoke': {
      const uid = renderRef(step.params.uid)
      lines.push(`${rv} = c.revoke(${uid})`)
      lines.push(...raiseUnless('Revoke'))
      lines.push(`print(f'  now {${rv}.get("state")}')`)
      break
    }
    case 'destroy': {
      const uid = renderRef(step.params.uid)
      lines.push(`${rv} = c.destroy(${uid})`)
      lines.push(...raiseUnless('Destroy'))
      lines.push(`print(f'  now {${rv}.get("state")}')`)
      break
    }
    default:
      lines.push(`raise RuntimeError(${pyStr(`${step.primId} does not support ${step.op}`)})`)
  }
  return lines
}

/** The delimiter comment written ahead of every step's block — its own function so
 *  `tryParsePipelineFromEditedCode` below shares the exact format with the emitter
 *  instead of re-deriving it. */
function emitStepMarker(step: KmipStep): string {
  return `# ── ${step.id} · ${describeStep(step)} ──`
}

/**
 * Everything for one step AFTER its marker: the try/except wrapper plus whatever
 * that step kind emits. Factored out of `emitKmipPipeline`'s loop so
 * `tryParsePipelineFromEditedCode` can regenerate this exact text — with an op
 * step's literal params (and a Sign step's effective message) swapped for unique
 * placeholder tokens — and use it as a matching template against edited code.
 */
function emitStepBody(
  step: KmipStep,
  message: string,
  messageMode: KmipMessageMode,
  mayBeDenied: boolean
): string[] {
  const lines: string[] = ['try:']
  if (step.kind === 'op') {
    const spec = KMIP_PRIMITIVES[step.primId]
    if (!spec || !spec.ops[step.op]) {
      lines.push(`    raise RuntimeError(${pyStr(`${step.primId} does not support ${step.op}`)})`)
    } else {
      for (const l of emitOpStep(step, spec, message, messageMode, mayBeDenied))
        lines.push(`    ${l}`)
    }
  } else if (step.kind === 'load-policy') {
    lines.push(`    from pyodide.http import pyfetch`)
    lines.push(`    _resp = await pyfetch(${pyStr(`/kmip-policies/${step.policyFile}`)})`)
    lines.push(`    _yaml = await _resp.string()`)
    lines.push(`    ${resultVar(step.id)} = c.load_policy(_yaml)`)
    lines.push(
      `    if not ${resultVar(step.id)}.ok: raise RuntimeError(${resultVar(step.id)}.message or 'LoadPolicy failed')`
    )
    lines.push(`    print(${pyStr(`  policy loaded: ${step.policyFile}`)})`)
  } else if (step.kind === 'dry-run') {
    lines.push(
      `    ${resultVar(step.id)} = c.dry_run(${pyStr(step.op)}${step.algorithm ? `, algorithm=${pyStr(step.algorithm)}` : ''})`
    )
    lines.push(
      `    print(f'  dry-run: {${resultVar(step.id)}.get("Kind")} ({${resultVar(step.id)}.get("Reason")})')`
    )
  } else if (step.kind === 'expect-deny') {
    const targetRv = resultVar(step.targetStepId)
    lines.push(`    _denied = not ${targetRv}.ok`)
    lines.push(
      `    _reason = ${targetRv}.get('ResultReason') or ${targetRv}.get('ResultMessage') or 'denied'`
    )
    lines.push(
      `    print(f'  expect-deny: {"refused (" + str(_reason) + ")" if _denied else "UNEXPECTEDLY ALLOWED — governance hole"}')`
    )
    lines.push(
      `    if not _denied: raise RuntimeError('governance hole: operation was allowed when it should have been denied')`
    )
  }
  lines.push(`    print('###STEP ${step.id} ok###')`)
  lines.push('except Exception as _e:')
  lines.push(`    print('###STEP ${step.id} error### %s: %s' % (type(_e).__name__, _e))`)
  lines.push('    raise')
  lines.push('')
  return lines
}

export function emitKmipPipeline(steps: KmipStep[], opts: KmipEmitOptions = {}): string {
  const message = opts.message ?? DEFAULT_KMIP_MESSAGE
  const messageMode = opts.messageMode ?? 'text'
  const lines: string[] = [
    '"""Generated by the PQC Today hub\'s KMIP/CACP Developer tab pipeline builder.',
    '',
    'Runs against the KMIP + crypto-agility policy engine through the pqctoday_kmip',
    "client's real API surface — every operation crosses the CACP policy plane.",
    '"""',
    'import os',
    'from pqctoday_kmip import KmipClient',
    '',
    `c = KmipClient(os.environ.get('KMIP_HOST', 'pqc-kmip'), int(os.environ.get('KMIP_PORT', '5696')))`,
    '',
  ]

  if (!steps.length) {
    lines.push('pass  # empty pipeline')
  }

  const deniableStepIds = new Set(
    steps
      .filter((s): s is Extract<KmipStep, { kind: 'expect-deny' }> => s.kind === 'expect-deny')
      .map((s) => s.targetStepId)
  )

  for (const step of steps) {
    lines.push(emitStepMarker(step))
    lines.push(...emitStepBody(step, message, messageMode, deniableStepIds.has(step.id)))
  }

  return lines.join('\n')
}

function describeStep(step: KmipStep): string {
  if (step.kind === 'op')
    return `${KMIP_PRIMITIVES[step.primId]?.label ?? step.primId} · ${step.op}`
  if (step.kind === 'load-policy') return `Load policy: ${step.policyFile}`
  if (step.kind === 'dry-run') return `Dry-run: ${step.op}`
  return `Expect deny: ${step.targetStepId}`
}

/* ── reverse-parse: edited Code-tab text → KMIP steps (Change 3) ────────────────
 *
 * Same scope and mechanism as the PKCS#11 side's tryParsePipelineFromEditedCode
 * in ../pipeline/pipelineCodegen.ts — read that module's header comment for the
 * full rationale. The one structural difference worth calling out: KMIP steps
 * come in four different KINDS (op/load-policy/dry-run/expect-deny), and only
 * 'op' steps ever render a literal/bytes-bound ParamValue through `renderRef`'s
 * 'literal' branch. `load-policy`'s policyFile and `dry-run`'s op/algorithm are
 * plain string fields, not ParamValues — never rendered through renderRef — so
 * editing THOSE is correctly treated as "changes beyond literal inputs" (a safe,
 * honest failure) rather than a recognized literal edit, even though a human
 * reading the generated code might expect it to "just" be a literal. A Sign
 * step's message is a second, KMIP-specific wrinkle: by default it comes from
 * the pipeline-wide `message`/`messageMode`, not a per-step param at all, so a
 * synthetic literal slot is added for the SIGN op specifically (only when the
 * step has no explicit `params.text` of its own) so editing the signed message
 * in generated code is still recognized — decoding it back onto that one step's
 * `params.text` as an explicit literal, which the existing renderer already
 * prefers over the pipeline-wide message.
 */

export interface KmipParseSuccess {
  ok: true
  steps: KmipStep[]
}
export interface KmipParseFailure {
  ok: false
  reason: string
}
export type KmipParseResult = KmipParseSuccess | KmipParseFailure

const STEP_MARKER_LINE_RE = /^[ \t]*#[ \t]*──[ \t]*([^\s·]+)[ \t]*·/

function normalizeBody(s: string): string {
  return s
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\s+$/, '')
}

function regexEscapeLiteral(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Reverses pyStr's escaping — see the PKCS#11 side's identical helper for why
 *  this is a char scan rather than chained global replaces. */
function unpyStr(inner: string): string {
  let out = ''
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]
    if (c === '\\' && i + 1 < inner.length) {
      const n = inner[i + 1]
      if (n === '\\') {
        out += '\\'
        i++
      } else if (n === "'") {
        out += "'"
        i++
      } else if (n === 'n') {
        out += '\n'
        i++
      } else if (n === 'r') {
        out += '\r'
        i++
      } else {
        out += c
      }
    } else {
      out += c
    }
  }
  return out
}

interface KmipLiteralSlot {
  name: string
  token: string
  /** The value this slot rendered as BEFORE any edit — for a declared literal
   *  param this is its own value; for the synthetic Sign-message slot it's the
   *  pipeline-wide `message`, since that step had no param of its own yet. */
  originalValue: string
}

/** Same template-then-regex technique as the PKCS#11 side's buildStepPattern:
 *  regenerate emitStepBody's exact text with every literal-bearing slot swapped
 *  for a unique token, then turn the fixed surrounding text into an escaped
 *  regex with each token's quoted form replaced by a capture group. */
function buildKmipStepPattern(
  step: KmipStep,
  message: string,
  messageMode: KmipMessageMode,
  mayBeDenied: boolean
): { pattern: RegExp; slots: KmipLiteralSlot[] } {
  const candidates: KmipLiteralSlot[] = []
  let templated: KmipStep = step

  if (step.kind === 'op') {
    const params: Record<string, KmipParamValue> = { ...step.params }
    let i = 0
    for (const [name, v] of Object.entries(step.params)) {
      if (v.bind !== 'literal') continue
      const token = `PQCLITTOKEN${i}`
      candidates.push({ name, token, originalValue: v.value })
      params[name] = { bind: 'literal', value: token }
      i++
    }
    if (step.op === 'sign' && !step.params.text) {
      const token = `PQCLITTOKEN${i}`
      candidates.push({ name: 'text', token, originalValue: message })
      params.text = { bind: 'literal', value: token }
      i++
    }
    templated = { ...step, params }
  }

  const templatedBody = normalizeBody(
    emitStepBody(templated, message, messageMode, mayBeDenied).join('\n')
  )

  // See the PKCS#11 side's identical filter/sort in buildStepPattern: a
  // candidate whose token never made it into the rendered text (not currently
  // possible for KMIP's op vocabulary, but kept for the same safety reason)
  // must not claim a capture group, and survivors are ordered by where they
  // actually occur in the text rather than by param object key order.
  const slots = candidates
    .filter((c) => templatedBody.includes(`'${c.token}'`))
    .sort((a, b) => templatedBody.indexOf(`'${a.token}'`) - templatedBody.indexOf(`'${b.token}'`))

  let source = regexEscapeLiteral(templatedBody)
  for (const slot of slots) {
    const marker = `'${slot.token}'`
    source = source.split(marker).join(`'((?:[^'\\\\]|\\\\.)*)'`)
  }
  return { pattern: new RegExp(`^${source}$`), slots }
}

/**
 * Reverse-parses edited Code-tab text back into KMIP steps. See this module's
 * header comment above for scope. `originalSteps` must be the steps the edited
 * code was generated FROM, and `opts` must be the SAME message/messageMode that
 * generated it — both are needed to know what a Sign step's message looked like
 * before any edit.
 */
export function tryParsePipelineFromEditedCode(
  editedCode: string,
  originalSteps: KmipStep[],
  opts: KmipEmitOptions = {}
): KmipParseResult {
  const message = opts.message ?? DEFAULT_KMIP_MESSAGE
  const messageMode = opts.messageMode ?? 'text'

  const deniableStepIds = new Set(
    originalSteps
      .filter((s): s is Extract<KmipStep, { kind: 'expect-deny' }> => s.kind === 'expect-deny')
      .map((s) => s.targetStepId)
  )

  const lines = editedCode.replace(/\r\n/g, '\n').split('\n')
  const markers: { id: string; lineIndex: number }[] = []
  lines.forEach((line, idx) => {
    const m = line.match(STEP_MARKER_LINE_RE)
    if (m) markers.push({ id: m[1], lineIndex: idx })
  })

  const originalById = new Map(originalSteps.map((s) => [s.id, s]))
  const seen = new Set<string>()
  for (const m of markers) {
    if (!originalById.has(m.id)) {
      return {
        ok: false,
        reason: `Step \`${m.id}\` looks new — added steps aren't recognized from code yet. Add it via the Builder, then edit code again.`,
      }
    }
    if (seen.has(m.id)) {
      return {
        ok: false,
        reason: `Step \`${m.id}\` appears more than once in the edited code — can't tell which block is which.`,
      }
    }
    seen.add(m.id)
  }

  const resultSteps: KmipStep[] = []
  for (let i = 0; i < markers.length; i++) {
    const { id, lineIndex } = markers[i]
    const original = originalById.get(id) as KmipStep
    const bodyStart = lineIndex + 1
    const bodyEnd = i + 1 < markers.length ? markers[i + 1].lineIndex : lines.length
    const body = normalizeBody(lines.slice(bodyStart, bodyEnd).join('\n'))

    const { pattern, slots } = buildKmipStepPattern(
      original,
      message,
      messageMode,
      deniableStepIds.has(id)
    )
    const match = pattern.exec(body)
    if (!match) {
      return {
        ok: false,
        reason: `Step \`${id}\` (${describeStep(original)}) has changes beyond its literal inputs — kept as a custom script.`,
      }
    }

    if (slots.length === 0) {
      resultSteps.push(original)
      continue
    }

    let changed = false
    const nextParams: Record<string, KmipParamValue> =
      original.kind === 'op' ? { ...original.params } : {}
    slots.forEach((slot, idx) => {
      const decoded = unpyStr(match[idx + 1])
      if (decoded !== slot.originalValue) {
        changed = true
        nextParams[slot.name] = { bind: 'literal', value: decoded }
      }
    })
    resultSteps.push(
      changed && original.kind === 'op' ? { ...original, params: nextParams } : original
    )
  }

  return { ok: true, steps: resultSteps }
}
