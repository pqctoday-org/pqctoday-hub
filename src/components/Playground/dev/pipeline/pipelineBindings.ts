/**
 * Binding rules: which earlier outputs may fill a given parameter slot, and what a
 * pipeline is missing before it can run.
 *
 * This is the machinery that replaces free-text config. The previous builder let any
 * step reference any string, validated almost nothing (one check, which only fired when
 * a `privKey` string was set), and displayed a hardcoded green "softhsmv3 token
 * available" tick regardless of state.
 */
import { PRIMITIVES, type Op, type ParamKind } from './pipelinePrimitives'
import { PIPELINE_INPUT_ID, type ParamValue, type PipelineStep } from './pipelineCodegen'

export interface BindingOption {
  label: string
  value: ParamValue
}

const sameValue = (a: ParamValue | undefined, b: ParamValue): boolean =>
  !!a && JSON.stringify(a) === JSON.stringify(b)

/**
 * Options for one parameter slot, drawn only from steps BEFORE this one — a step can
 * never bind forward, so the pipeline stays a straight line by construction.
 */
export function optionsFor(kind: ParamKind, steps: PipelineStep[], index: number): BindingOption[] {
  const out: BindingOption[] = []

  if (kind === 'bytes') {
    out.push({ label: 'pipeline input', value: { bind: 'ref', step: PIPELINE_INPUT_ID } })
  }

  for (let i = 0; i < index; i++) {
    const st = steps[i]
    const spec = PRIMITIVES[st.primId]
    const produces = spec?.ops[st.op]?.produces
    if (!produces || produces === 'none') continue
    const tag = `${i + 1}. ${spec?.label ?? st.primId}`

    switch (kind) {
      case 'pubKey':
      case 'peerPoint':
        if (produces === 'keypair')
          out.push({
            label: `${tag} · public key`,
            value: { bind: 'key', step: st.id, part: 'pub' },
          })
        break
      case 'privKey':
        if (produces === 'keypair')
          out.push({
            label: `${tag} · private key`,
            value: { bind: 'key', step: st.id, part: 'priv' },
          })
        break
      case 'secretKey':
        if (produces === 'secretKey')
          out.push({
            label: `${tag} · secret key`,
            value: { bind: 'key', step: st.id, part: 'secret' },
          })
        break
      case 'ciphertext':
        if (produces === 'ciphertext')
          out.push({ label: `${tag} · ciphertext`, value: { bind: 'ref', step: st.id } })
        break
      case 'signature':
        if (produces === 'signature')
          out.push({ label: `${tag} · signature`, value: { bind: 'ref', step: st.id } })
        break
      case 'bytes':
        // Anything with a byte-shaped value can feed a data input.
        if (
          produces === 'bytes' ||
          produces === 'ciphertext' ||
          produces === 'signature' ||
          produces === 'secretKey'
        ) {
          out.push({ label: `${tag} · ${st.op} output`, value: { bind: 'ref', step: st.id } })
        }
        break
      case 'bool':
        // Currently only `verify` produces 'bool' — an ACVP sigVer KAT's
        // assert-verified step binds here.
        if (produces === 'bool')
          out.push({ label: `${tag} · ${st.op} result`, value: { bind: 'ref', step: st.id } })
        break
      case 'label':
        break
    }
  }
  return out
}

export interface Finding {
  stepIndex: number | null
  text: string
  severity: 'error' | 'warn'
}

/** Everything that would stop this pipeline running, named by step. */
export function validate(steps: PipelineStep[]): Finding[] {
  const findings: Finding[] = []

  if (!steps.length) {
    findings.push({ stepIndex: null, text: 'Pipeline is empty', severity: 'warn' })
    return findings
  }

  const hssSignsByKey = new Map<string, number>()

  steps.forEach((st, i) => {
    const spec = PRIMITIVES[st.primId]
    if (!spec) {
      findings.push({ stepIndex: i, text: `Unknown primitive "${st.primId}"`, severity: 'error' })
      return
    }
    const opSpec = spec.ops[st.op as Op]
    if (!opSpec) {
      findings.push({
        stepIndex: i,
        text: `${spec.label} does not support "${st.op}"`,
        severity: 'error',
      })
      return
    }

    for (const [name, kind] of Object.entries(opSpec.requires)) {
      if (!kind) continue
      const bound = st.params[name]
      if (kind === 'label') {
        // 'hex' also lands here — an ACVP template's fixed key/ciphertext
        // material (see pipelinePrimitives.ts's 'import' op comment) is
        // free-text from the same "no earlier step to bind to" family as
        // a display label, just rendered as bytes.fromhex(...) instead of
        // a quoted string.
        if (!bound || (bound.bind !== 'literal' && bound.bind !== 'hex') || !bound.value.trim()) {
          findings.push({
            stepIndex: i,
            text: `Step ${i + 1} · ${spec.label}: "${name}" is empty`,
            severity: 'error',
          })
        }
        continue
      }
      if (!bound) {
        findings.push({
          stepIndex: i,
          text: `Step ${i + 1} · ${spec.label}: "${name}" is not bound`,
          severity: 'error',
        })
        continue
      }
      // A binding must still resolve to a step that exists and comes earlier.
      const targetId = bound.bind === 'ref' ? bound.step : bound.bind === 'key' ? bound.step : null
      if (targetId && targetId !== PIPELINE_INPUT_ID) {
        const at = steps.findIndex((x) => x.id === targetId)
        if (at < 0) {
          findings.push({
            stepIndex: i,
            text: `Step ${i + 1} · ${spec.label}: "${name}" points at a deleted step`,
            severity: 'error',
          })
        } else if (at >= i) {
          findings.push({
            stepIndex: i,
            text: `Step ${i + 1} · ${spec.label}: "${name}" points at a later step`,
            severity: 'error',
          })
        } else if (!optionsFor(kind, steps, i).some((o) => sameValue(bound, o.value))) {
          findings.push({
            stepIndex: i,
            text: `Step ${i + 1} · ${spec.label}: "${name}" is bound to an incompatible output`,
            severity: 'error',
          })
        }
      }
    }

    // AES-GCM decrypt needs the IV from the encrypt step that produced its ciphertext.
    if (st.primId === 'aes-256-gcm' && st.op === 'decrypt') {
      const src = st.params.input
      const ok =
        src?.bind === 'ref' &&
        steps.some((x) => x.id === src.step && x.primId === 'aes-256-gcm' && x.op === 'encrypt')
      if (!ok) {
        findings.push({
          stepIndex: i,
          text: `Step ${i + 1} · AES-256-GCM decrypt must take its input from an AES-256-GCM encrypt step (the IV comes with it)`,
          severity: 'error',
        })
      }
    }

    // HSS keys hold a finite number of one-time signatures.
    if (spec.stateful && st.op === 'sign') {
      const key = st.params.privKey
      if (key?.bind === 'key') {
        const used = (hssSignsByKey.get(key.step) ?? 0) + 1
        hssSignsByKey.set(key.step, used)
        const max = spec.maxSignatures ?? Infinity
        if (used > max) {
          findings.push({
            stepIndex: i,
            text: `Step ${i + 1} · ${spec.label}: this key has only ${max} one-time signatures and the pipeline uses ${used}`,
            severity: 'error',
          })
        }
      }
    }
  })

  return findings
}
