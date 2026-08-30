/**
 * Pipeline code generation.
 *
 * Emits one Python script driving the bundled `p11` package (PKCS#11 v3.2, negotiated
 * through C_GetInterface), so ML-KEM encapsulate/decapsulate are real C_EncapsulateKey /
 * C_DecapsulateKey calls on the pipeline's own keys.
 *
 * The single rule that makes this safe: **no user-supplied string ever reaches the
 * generated source unquoted.** Every value goes through `render()`, which either emits a
 * Python literal via `pyStr`/`pyBytes` or an identifier derived from a step id. The
 * previous generator interpolated free-text config directly into expressions, so a
 * default value of `'ciphertext.bin || KEM ct'` became a SyntaxError and shipped that way.
 *
 * Steps address each other by id, never by prose:
 *   result_<id>          the step's data output
 *   pub_<id> / priv_<id> its keypair handles
 *   key_<id>             its secret-key handle
 *   pipeline_input       the pipeline-level input
 */
import { PRIMITIVES, mechName, type Op, type PrimSpec } from './pipelinePrimitives'

/** Tells the regression harness this module takes typed params, not legacy config strings. */
export const SUPPORTS_TYPED_PARAMS = true

export const PIPELINE_INPUT_ID = '__input__'
export const DEFAULT_PIPELINE_INPUT = 'pqctoday sandbox payload'

export type ParamValue =
  | { bind: 'literal'; value: string }
  | { bind: 'bytes'; value: string }
  | { bind: 'ref'; step: string }
  | { bind: 'key'; step: string; part: 'pub' | 'priv' | 'secret' }

export type StepStatus = 'idle' | 'running' | 'ok' | 'error' | 'skipped'

export interface StepResult {
  text: string
  status: 'ok' | 'error'
}

export interface PipelineStep {
  id: string
  primId: string
  op: Op
  params: Record<string, ParamValue>
  status?: StepStatus
  output?: StepResult | null
}

export interface EmitOptions {
  /** The pipeline-level input node's value. */
  input?: string
  /**
   * PKCS#11 slot to open the session on (dev-tabs-pkcs11-kmip plan D6: the
   * Developer tab gets its OWN slot, separate from the rest of the HSM
   * playground's shared token). Hub-specific: the sandbox's real p11
   * package always targets `avail[0]` (its container has exactly one HSM
   * state, no sibling browser tabs sharing an engine instance) — omitting
   * this falls back to that same behavior for parity with the sandbox's
   * emitted code. Passing a slot changes ONE line of the emitted script
   * (`open_session(slot=N, pin=...)` instead of `open_session(pin=...)`);
   * every other line, including the p11 API surface itself, is identical.
   */
  slot?: number
}

/* ── identifiers ─────────────────────────────────────────────────────────────── */

const sym = (id: string) => id.replace(/[^A-Za-z0-9_]/g, '_')
const resultVar = (id: string) =>
  id === PIPELINE_INPUT_ID ? 'pipeline_input' : `result_${sym(id)}`
const pubVar = (id: string) => `pub_${sym(id)}`
const privVar = (id: string) => `priv_${sym(id)}`
const secretVar = (id: string) => `key_${sym(id)}`

/** Python single-quoted string literal. The only path by which user text becomes source. */
const pyStr = (s: string) =>
  `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`

const pyBytes = (s: string) => `b${pyStr(s)}`

function render(pv: ParamValue | undefined, fallback = 'None'): string {
  if (!pv) return fallback
  switch (pv.bind) {
    case 'literal':
      return pyStr(pv.value)
    case 'bytes':
      return pyBytes(pv.value)
    case 'ref':
      return resultVar(pv.step)
    case 'key':
      return pv.part === 'pub'
        ? pubVar(pv.step)
        : pv.part === 'priv'
          ? privVar(pv.step)
          : secretVar(pv.step)
  }
}

/* ── per-op emission ─────────────────────────────────────────────────────────── */

/** `p11.CKM_ML_DSA`, not `0x1d` — the generated script is read as much as it is run. */
const mechConst = (n: number) => `p11.${mechName(n)}`

function emitGenerate(step: PipelineStep, spec: PrimSpec): string[] {
  const kg = spec.keygen
  if (!kg) return [`raise RuntimeError(${pyStr(`${spec.label} has no key generation`)})`]
  const pub = pubVar(step.id),
    priv = privVar(step.id),
    key = secretVar(step.id)
  const L = pyStr(spec.label)

  // token=True: these keys need to survive past the generating session
  // closing (s.logout() at the end of this very script) so the Developer
  // tab's own Key inspector — a real PKCS#11 attribute query, not a
  // reconstruction — can still find them afterward. Scoped to the
  // Developer tab's own isolated DevSequences slot (devSlot.ts); nothing
  // else on the token shares it.
  switch (kg.kind) {
    case 'ml-dsa':
      return [
        `${pub}, ${priv} = s.generate_ml_dsa(p11.${kg.paramSetName}, token=True)`,
        `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`,
      ]
    case 'ml-kem':
      return [
        `${pub}, ${priv} = s.generate_ml_kem(p11.${kg.paramSetName}, token=True)`,
        `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`,
      ]
    case 'slh-dsa':
      return [
        `${pub}, ${priv} = s.generate_slh_dsa(p11.${kg.paramSetName}, token=True)`,
        `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`,
      ]
    case 'hss':
      // Stateful: the token tracks CKA_HSS_KEYS_REMAINING and the key is spent when it hits 0.
      return [
        `# CKA_HSS_KEYS_REMAINING decrements on every signature (PKCS#11 v3.2 §6.65)`,
        `${pub}, ${priv} = s.generate_hss(p11.${kg.lmsName}, p11.${kg.lmotsName}, token=True)`,
        `print('%s keypair · pub=%d priv=%d · %d signatures available'`,
        `      % (${L}, ${pub}, ${priv}, s.hss_keys_remaining(${priv})))`,
      ]
    case 'rsa':
      return [
        `${pub}, ${priv} = s.generate_rsa(${kg.bits}, token=True)`,
        `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`,
      ]
    case 'ec-p256':
      return [
        `${pub}, ${priv} = s.generate_ec_p256(token=True)`,
        `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`,
      ]
    case 'ed25519':
      return [
        `${pub}, ${priv} = s.generate_ed25519(token=True)`,
        `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`,
      ]
    case 'aes256':
      return [
        `${key} = s.generate_aes256(token=True)`,
        `print('%s key · handle=%d' % (${L}, ${key}))`,
      ]
  }
}

/** RSA-PSS and RSA-OAEP need a CK_MECHANISM parameter; everything else passes None. */
function mechParam(primId: string, op: Op): string {
  if (primId === 'rsa-pss' && (op === 'sign' || op === 'verify')) return ', s.pss_params()'
  if (primId === 'rsa-oaep' && (op === 'encrypt' || op === 'decrypt')) return ', s.oaep_params()'
  return ''
}

function emitOp(step: PipelineStep, spec: PrimSpec): string[] {
  const p = step.params
  const L = pyStr(spec.label)
  const out = resultVar(step.id)
  const mech = spec.ops[step.op]?.mech
  const m = mech === undefined ? 'None' : mechConst(mech)
  const extra = mechParam(step.primId, step.op)

  switch (step.op) {
    case 'generate':
      return emitGenerate(step, spec)

    case 'sign': {
      const lines = [
        `${out} = s.sign(${render(p.privKey)}, ${render(p.input, 'pipeline_input')}, ${m}${extra})`,
      ]
      if (spec.stateful) {
        lines.push(
          `print('%s signature · %d B · %d signatures remaining'`,
          `      % (${L}, len(${out}), s.hss_keys_remaining(${render(p.privKey)})))`
        )
      } else {
        lines.push(`print('%s signature · %d B' % (${L}, len(${out})))`)
      }
      return lines
    }

    case 'verify':
      return [
        `${out} = s.verify(${render(p.pubKey)}, ${render(p.input, 'pipeline_input')}, ` +
          `${render(p.signature)}, ${m}${extra})`,
        `print('%s verify · %s' % (${L}, 'PASS' if ${out} else 'FAIL'))`,
      ]

    case 'encapsulate':
      return [
        `${out}, ${secretVar(step.id)} = s.encapsulate(${render(p.pubKey)})`,
        `print('%s encapsulate · ct=%d B secret=%d B'`,
        `      % (${L}, len(${out}), len(s.value(${secretVar(step.id)}))))`,
      ]

    case 'decapsulate':
      return [
        `${secretVar(step.id)} = s.decapsulate(${render(p.privKey)}, ${render(p.ciphertext)})`,
        `${out} = s.value(${secretVar(step.id)})`,
        `print('%s decapsulate · secret=%d B match=%s'`,
        `      % (${L}, len(${out}), ${out} == s.value(${secretVar(refStep(p.ciphertext))})))`,
      ]

    case 'derive':
      return [
        `# ${mechName(mech ?? 0)} with CKD_NULL — key agreement, not encapsulation`,
        `${secretVar(step.id)} = s.ecdh_derive(${render(p.privKey)}, s.ec_point(${render(p.peer)}))`,
        `${out} = s.value(${secretVar(step.id)})`,
        `print('%s derive · secret=%d B' % (${L}, len(${out})))`,
      ]

    case 'encrypt': {
      if (step.primId === 'aes-256-gcm') {
        return [
          `iv_${sym(step.id)} = os.urandom(12)`,
          `${out} = s.encrypt_gcm(${render(p.key)}, ${render(p.input, 'pipeline_input')}, iv_${sym(step.id)})`,
          `print('%s ciphertext · %d B' % (${L}, len(${out})))`,
        ]
      }
      return [
        `${out} = s.encrypt(${render(p.pubKey)}, ${m}, ${render(p.input, 'pipeline_input')}${extra})`,
        `print('%s ciphertext · %d B' % (${L}, len(${out})))`,
      ]
    }

    case 'decrypt': {
      const src = p.input?.bind === 'ref' ? p.input.step : null
      if (step.primId === 'aes-256-gcm') {
        return [
          `${out} = s.decrypt_gcm(${render(p.key)}, ${render(p.input)}, iv_${src ? sym(src) : 'MISSING'})`,
          `print('%s plaintext · %d B match=%s' % (${L}, len(${out}), ${out} == pipeline_input))`,
        ]
      }
      return [
        `${out} = s.decrypt(${render(p.privKey)}, ${m}, ${render(p.input)}${extra})`,
        `print('%s plaintext · %d B match=%s' % (${L}, len(${out}), ${out} == pipeline_input))`,
      ]
    }

    case 'digest':
      return [
        `${out} = s.digest(${m}, ${render(p.input, 'pipeline_input')})`,
        `print('%s · %s' % (${L}, ${out}.hex()[:32]))`,
      ]
  }
}

/** The step a ciphertext binding came from, so decapsulate can compare both secrets. */
function refStep(pv: ParamValue | undefined): string {
  return pv && pv.bind === 'ref' ? pv.step : PIPELINE_INPUT_ID
}

/* ── whole-pipeline emission ─────────────────────────────────────────────────── */

/** The delimiter comment `emitPipeline` writes ahead of every step — kept as its own
 *  function so `tryParsePipelineFromEditedCode` below never has to duplicate the exact
 *  format it needs to recognize. */
function emitStepMarker(step: PipelineStep, spec: PrimSpec | undefined): string {
  return `        # ── ${step.id} · ${spec?.label ?? step.primId} · ${step.op} ──`
}

/**
 * Everything for one step AFTER its marker comment: the try/except wrapper plus
 * whatever `emitOp` produces. Factored out of `emitPipeline`'s loop so
 * `tryParsePipelineFromEditedCode` can regenerate the exact same text — with a
 * step's literal/bytes params swapped for unique placeholder tokens — and use it as
 * a matching template against edited code, rather than re-deriving this shape by
 * hand and risking the two falling out of sync.
 */
function emitStepBody(step: PipelineStep, spec: PrimSpec | undefined): string[] {
  const lines: string[] = ['        try:']
  if (!spec || !spec.ops[step.op]) {
    lines.push(
      `            raise RuntimeError(${pyStr(`${step.primId} does not support ${step.op}`)})`
    )
  } else {
    for (const l of emitOp(step, spec)) lines.push(`            ${l}`)
  }
  lines.push(`            print('###STEP ${step.id} ok###')`)
  lines.push('        except Exception as _e:')
  lines.push(`            print('###STEP ${step.id} error### %s: %s' % (type(_e).__name__, _e))`)
  lines.push('            raise')
  lines.push('')
  return lines
}

export function emitPipeline(steps: PipelineStep[], opts: EmitOptions = {}): string {
  const input = opts.input ?? DEFAULT_PIPELINE_INPUT
  const lines: string[] = [
    '"""Generated by the pqctoday sandbox pipeline builder.',
    '',
    'Runs against the softhsmv3 token through the bundled p11 package, which negotiates',
    'the PKCS#11 v3.2 interface with C_GetInterface. Keys are session objects: they are',
    'destroyed when the session closes.',
    '"""',
    'import os',
    'import p11',
    'from p11 import Module',
    '',
    `PIN = os.environ.get('PKCS11_PIN', '1234')`,
    `pipeline_input = ${pyBytes(input)}`,
    '',
    'with Module() as hsm:',
    `    print('PKCS#11 interface · v%d.%d' % hsm.interface_version)`,
    opts.slot != null
      ? `    s = hsm.open_session(slot=${opts.slot}, pin=PIN)`
      : '    s = hsm.open_session(pin=PIN)',
    '    try:',
  ]

  if (!steps.length) {
    lines.push('        pass  # empty pipeline')
  }

  for (const step of steps) {
    const spec = PRIMITIVES[step.primId]
    lines.push(emitStepMarker(step, spec))
    lines.push(...emitStepBody(step, spec))
  }

  lines.push('    finally:')
  lines.push('        s.logout()')
  lines.push('        s.close()')
  return lines.join('\n')
}

/** Back-compat alias — the page imported `generatePython` before the rewrite. */
export const generatePython = emitPipeline

/* ── reverse-parse: edited Code-tab text → pipeline steps (Change 3) ────────────
 *
 * The inverse of emitPipeline, scoped deliberately narrowly: it recognizes exactly
 * three kinds of edit — a literal/bytes param's rendered value changed, a step's
 * whole marker+body block removed, or the surviving blocks reordered — and refuses
 * (with a specific, named reason) anything else, including a genuinely new step or
 * any change to a ref/key-bound identifier or the surrounding code shape. It never
 * attempts general Python parsing: recognition works by regenerating exactly what
 * `emitStepBody` would still produce for the original step with its literal/bytes
 * params swapped for placeholder tokens, then matching that as a template against
 * the edited text.
 */

export interface ParseSuccess {
  ok: true
  steps: PipelineStep[]
}
export interface ParseFailure {
  ok: false
  reason: string
}
export type ParseResult = ParseSuccess | ParseFailure

/** Matches emitStepMarker's own format, tolerant of the label/op text after the id
 *  (which isn't part of the id and is never compared) — id is whatever sits between
 *  the opening "── " and the first " · ". */
const STEP_MARKER_LINE_RE = /^[ \t]*#[ \t]*──[ \t]*([^\s·]+)[ \t]*·/

/** emitPipeline's fixed closer, written after the LAST step's block — with no
 *  marker following it to bound that step's body, it has to be recognized and
 *  stripped explicitly so it is never mistaken for part of the last step's own
 *  edited text. */
const TRAILING_BOILERPLATE = ['    finally:', '        s.logout()', '        s.close()']

function stripTrailingBoilerplate(bodyLines: string[]): string[] {
  let end = bodyLines.length
  while (end > 0 && bodyLines[end - 1].trim() === '') end--
  const n = TRAILING_BOILERPLATE.length
  if (end < n) return bodyLines
  const tail = bodyLines.slice(end - n, end).map((l) => l.trimEnd())
  if (tail.every((l, i) => l === TRAILING_BOILERPLATE[i])) return bodyLines.slice(0, end - n)
  return bodyLines
}

/** Trailing/leading blank lines and trailing per-line whitespace are the only
 *  "insignificant" differences this tolerates — everything else, including
 *  reflowed indentation, is a real difference the pattern match below must catch. */
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

/** Reverses pyStr's escaping — the inner text of a Python single-quoted literal
 *  (quotes already stripped by the caller). Written as an explicit char scan
 *  rather than chained global replaces, since reversing pyStr's ordered escaping
 *  with regex replaces would need the exact reverse order to stay unambiguous. */
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

interface LiteralSlot {
  name: string
  bind: 'literal' | 'bytes'
  token: string
}

/**
 * Regenerates emitStepBody's exact text for `step`, but with every literal/bytes
 * param's value swapped for a unique token first — then turns that into a regex:
 * the fixed surrounding text (identifiers, mechanism constants, control flow) is
 * escaped literally, and each token's rendered quoted form becomes a capture
 * group matching any Python single-quoted literal. A step with no literal/bytes
 * params gets a pattern with no capture groups at all, which makes this the same
 * check as an exact (whitespace-normalized) text comparison for those steps.
 */
function buildStepPattern(
  step: PipelineStep,
  spec: PrimSpec | undefined
): { pattern: RegExp; slots: LiteralSlot[] } {
  const candidates: LiteralSlot[] = []
  const templated: PipelineStep = { ...step, params: { ...step.params } }
  let i = 0
  for (const [name, v] of Object.entries(step.params)) {
    if (v.bind !== 'literal' && v.bind !== 'bytes') continue
    const token = `PQCLITTOKEN${i}`
    candidates.push({ name, bind: v.bind, token })
    templated.params[name] = { bind: v.bind, value: token } as ParamValue
    i++
  }

  const templatedBody = normalizeBody(emitStepBody(templated, spec).join('\n'))

  // Not every literal/bytes-bound param necessarily reaches the emitted text —
  // `generate`'s `keyLabel` is UI-display-only and never rendered by emitOp at
  // all (confirmed by reading emitGenerate directly) — so a candidate whose
  // token never appears must not claim a capture group. The survivors are then
  // ordered by where they actually occur in the text: capture-group numbering
  // in the final regex follows textual left-to-right position, not param
  // object key order, and those can differ.
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
 * Reverse-parses edited Code-tab text back into pipeline steps. See this module's
 * header comment above for the exact scope. `originalSteps` must be the steps the
 * edited code was generated FROM (i.e. what `pipeline` state held when the editor
 * detached) — this never re-derives step identity from anything but ids already
 * present in `originalSteps`.
 */
export function tryParsePipelineFromEditedCode(
  editedCode: string,
  originalSteps: PipelineStep[]
): ParseResult {
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

  const resultSteps: PipelineStep[] = []
  for (let i = 0; i < markers.length; i++) {
    const { id, lineIndex } = markers[i]
    const original = originalById.get(id) as PipelineStep
    const bodyStart = lineIndex + 1
    const isLast = i === markers.length - 1
    let bodyLines = lines.slice(
      bodyStart,
      i + 1 < markers.length ? markers[i + 1].lineIndex : lines.length
    )
    if (isLast) bodyLines = stripTrailingBoilerplate(bodyLines)
    const body = normalizeBody(bodyLines.join('\n'))

    const spec = PRIMITIVES[original.primId]
    const { pattern, slots } = buildStepPattern(original, spec)
    const match = pattern.exec(body)
    if (!match) {
      const label = spec?.label ?? original.primId
      return {
        ok: false,
        reason: `Step \`${id}\` (${label}) has changes beyond its literal inputs — kept as a custom script.`,
      }
    }

    if (slots.length === 0) {
      resultSteps.push(original)
      continue
    }

    let changed = false
    const nextParams = { ...original.params }
    slots.forEach((slot, idx) => {
      const decoded = unpyStr(match[idx + 1])
      const originalValue = (original.params[slot.name] as { value?: string } | undefined)?.value
      if (decoded !== originalValue) {
        changed = true
        nextParams[slot.name] = { bind: slot.bind, value: decoded } as ParamValue
      }
    })
    resultSteps.push(changed ? { ...original, params: nextParams } : original)
  }

  return { ok: true, steps: resultSteps }
}
