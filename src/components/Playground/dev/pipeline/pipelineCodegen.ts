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
const resultVar = (id: string) => (id === PIPELINE_INPUT_ID ? 'pipeline_input' : `result_${sym(id)}`)
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
    case 'literal': return pyStr(pv.value)
    case 'bytes': return pyBytes(pv.value)
    case 'ref': return resultVar(pv.step)
    case 'key':
      return pv.part === 'pub' ? pubVar(pv.step)
        : pv.part === 'priv' ? privVar(pv.step)
          : secretVar(pv.step)
  }
}

/* ── per-op emission ─────────────────────────────────────────────────────────── */

/** `p11.CKM_ML_DSA`, not `0x1d` — the generated script is read as much as it is run. */
const mechConst = (n: number) => `p11.${mechName(n)}`

function emitGenerate(step: PipelineStep, spec: PrimSpec): string[] {
  const kg = spec.keygen
  if (!kg) return [`raise RuntimeError(${pyStr(`${spec.label} has no key generation`)})`]
  const pub = pubVar(step.id), priv = privVar(step.id), key = secretVar(step.id)
  const L = pyStr(spec.label)

  switch (kg.kind) {
    case 'ml-dsa':
      return [`${pub}, ${priv} = s.generate_ml_dsa(p11.${kg.paramSetName})`,
              `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`]
    case 'ml-kem':
      return [`${pub}, ${priv} = s.generate_ml_kem(p11.${kg.paramSetName})`,
              `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`]
    case 'slh-dsa':
      return [`${pub}, ${priv} = s.generate_slh_dsa(p11.${kg.paramSetName})`,
              `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`]
    case 'hss':
      // Stateful: the token tracks CKA_HSS_KEYS_REMAINING and the key is spent when it hits 0.
      return [`# CKA_HSS_KEYS_REMAINING decrements on every signature (PKCS#11 v3.2 §6.65)`,
              `${pub}, ${priv} = s.generate_hss(p11.${kg.lmsName}, p11.${kg.lmotsName})`,
              `print('%s keypair · pub=%d priv=%d · %d signatures available'`,
              `      % (${L}, ${pub}, ${priv}, s.hss_keys_remaining(${priv})))`]
    case 'rsa':
      return [`${pub}, ${priv} = s.generate_rsa(${kg.bits})`,
              `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`]
    case 'ec-p256':
      return [`${pub}, ${priv} = s.generate_ec_p256()`,
              `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`]
    case 'ed25519':
      return [`${pub}, ${priv} = s.generate_ed25519()`,
              `print('%s keypair · pub=%d priv=%d' % (${L}, ${pub}, ${priv}))`]
    case 'aes256':
      return [`${key} = s.generate_aes256()`,
              `print('%s key · handle=%d' % (${L}, ${key}))`]
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
          `      % (${L}, len(${out}), s.hss_keys_remaining(${render(p.privKey)})))`)
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
    lines.push(`        # ── ${step.id} · ${spec?.label ?? step.primId} · ${step.op} ──`)
    lines.push('        try:')
    if (!spec || !spec.ops[step.op]) {
      lines.push(`            raise RuntimeError(${pyStr(`${step.primId} does not support ${step.op}`)})`)
    } else {
      for (const l of emitOp(step, spec)) lines.push(`            ${l}`)
    }
    lines.push(`            print('###STEP ${step.id} ok###')`)
    lines.push('        except Exception as _e:')
    lines.push(`            print('###STEP ${step.id} error### %s: %s' % (type(_e).__name__, _e))`)
    lines.push('            raise')
    lines.push('')
  }

  lines.push('    finally:')
  lines.push('        s.logout()')
  lines.push('        s.close()')
  return lines.join('\n')
}

/** Back-compat alias — the page imported `generatePython` before the rewrite. */
export const generatePython = emitPipeline
