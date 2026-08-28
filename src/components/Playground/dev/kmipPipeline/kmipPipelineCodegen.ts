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

export interface KmipEmitOptions {
  message?: string
}

const pyStr = (s: string) =>
  `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`
const pyBytes = (s: string) => `b${pyStr(s)}`

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
    case 'priv': return privVar(pv.step)
    case 'pub': return pubVar(pv.step)
    case 'ciphertext': return ctVar(pv.step)
    default: return uidVar(pv.step)
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
function emitOpStep(step: KmipOpStep, spec: KmipPrimSpec, message: string, mayBeDenied: boolean): string[] {
  const lines: string[] = []
  const rv = resultVar(step.id)
  const raiseUnless = (label: string) =>
    mayBeDenied ? [] : [`if not ${rv}.ok: raise RuntimeError(${rv}.message or ${pyStr(`${label} failed`)})`]
  switch (step.op) {
    case 'createKeyPair':
      lines.push(`${rv} = c.create_key_pair(${pyStr(spec.algorithm)}, 'Sign Verify Encapsulate Decapsulate')`)
      lines.push(`${privVar(step.id)} = ${rv}.get('PrivateKeyUniqueIdentifier')`)
      lines.push(`${pubVar(step.id)} = ${rv}.get('PublicKeyUniqueIdentifier')`)
      lines.push(...raiseUnless('CreateKeyPair'))
      lines.push(`print(f'  priv={${privVar(step.id)}}  pub={${pubVar(step.id)}}')`)
      break
    case 'create':
      lines.push(`${rv} = c.create_symmetric(${pyStr(spec.algorithm)}, 256)`)
      lines.push(`${uidVar(step.id)} = ${rv}.get('UniqueIdentifier')`)
      lines.push(...raiseUnless('Create'))
      break
    case 'activate': {
      const uid = renderRef(step.params.uid)
      lines.push(`${rv} = c.activate(${uid})`)
      lines.push(...raiseUnless('Activate'))
      break
    }
    case 'sign': {
      const priv = renderRef(step.params.privUid)
      const text = step.params.text?.bind === 'literal' ? step.params.text.value : message
      lines.push(`${rv} = c.sign(${priv}, ${pyBytes(text)}, ${pyStr(spec.algorithm)})`)
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
      break
    }
    case 'getAttributes': {
      const uid = renderRef(step.params.uid)
      lines.push(`${rv} = c.get_attributes(${uid})`)
      lines.push(...raiseUnless('GetAttributes'))
      break
    }
    case 'locate':
      lines.push(`${rv} = c.locate()`)
      lines.push(...raiseUnless('Locate'))
      break
    case 'revoke': {
      const uid = renderRef(step.params.uid)
      lines.push(`${rv} = c.revoke(${uid})`)
      lines.push(...raiseUnless('Revoke'))
      break
    }
    case 'destroy': {
      const uid = renderRef(step.params.uid)
      lines.push(`${rv} = c.destroy(${uid})`)
      lines.push(...raiseUnless('Destroy'))
      break
    }
    default:
      lines.push(`raise RuntimeError(${pyStr(`${step.primId} does not support ${step.op}`)})`)
  }
  return lines
}

export function emitKmipPipeline(steps: KmipStep[], opts: KmipEmitOptions = {}): string {
  const message = opts.message ?? DEFAULT_KMIP_MESSAGE
  const lines: string[] = [
    '"""Generated by the PQC Today hub\'s KMIP/CACP Developer tab pipeline builder.',
    '',
    'Runs against the KMIP + crypto-agility policy engine through the pqctoday_kmip',
    'client\'s real API surface — every operation crosses the CACP policy plane.',
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
    steps.filter((s): s is Extract<KmipStep, { kind: 'expect-deny' }> => s.kind === 'expect-deny')
      .map((s) => s.targetStepId)
  )

  for (const step of steps) {
    lines.push(`# ── ${step.id} · ${describeStep(step)} ──`)
    lines.push('try:')
    if (step.kind === 'op') {
      const spec = KMIP_PRIMITIVES[step.primId]
      if (!spec || !spec.ops[step.op]) {
        lines.push(`    raise RuntimeError(${pyStr(`${step.primId} does not support ${step.op}`)})`)
      } else {
        for (const l of emitOpStep(step, spec, message, deniableStepIds.has(step.id))) lines.push(`    ${l}`)
      }
    } else if (step.kind === 'load-policy') {
      lines.push(`    from pyodide.http import pyfetch`)
      lines.push(`    _resp = await pyfetch(${pyStr(`/kmip-policies/${step.policyFile}`)})`)
      lines.push(`    _yaml = await _resp.string()`)
      lines.push(`    ${resultVar(step.id)} = c.load_policy(_yaml)`)
      lines.push(`    if not ${resultVar(step.id)}.ok: raise RuntimeError(${resultVar(step.id)}.message or 'LoadPolicy failed')`)
      lines.push(`    print(${pyStr(`  policy loaded: ${step.policyFile}`)})`)
    } else if (step.kind === 'dry-run') {
      lines.push(`    ${resultVar(step.id)} = c.dry_run(${pyStr(step.op)}${step.algorithm ? `, algorithm=${pyStr(step.algorithm)}` : ''})`)
      lines.push(`    print(f'  dry-run: {${resultVar(step.id)}.get("Kind")} ({${resultVar(step.id)}.get("Reason")})')`)
    } else if (step.kind === 'expect-deny') {
      const targetRv = resultVar(step.targetStepId)
      lines.push(`    _denied = not ${targetRv}.ok`)
      lines.push(`    _reason = ${targetRv}.get('ResultReason') or ${targetRv}.get('ResultMessage') or 'denied'`)
      lines.push(`    print(f'  expect-deny: {"refused (" + str(_reason) + ")" if _denied else "UNEXPECTEDLY ALLOWED — governance hole"}')`)
      lines.push(`    if not _denied: raise RuntimeError('governance hole: operation was allowed when it should have been denied')`)
    }
    lines.push(`    print('###STEP ${step.id} ok###')`)
    lines.push('except Exception as _e:')
    lines.push(`    print('###STEP ${step.id} error### %s: %s' % (type(_e).__name__, _e))`)
    lines.push('    raise')
    lines.push('')
  }

  return lines.join('\n')
}

function describeStep(step: KmipStep): string {
  if (step.kind === 'op') return `${KMIP_PRIMITIVES[step.primId]?.label ?? step.primId} · ${step.op}`
  if (step.kind === 'load-policy') return `Load policy: ${step.policyFile}`
  if (step.kind === 'dry-run') return `Dry-run: ${step.op}`
  return `Expect deny: ${step.targetStepId}`
}
