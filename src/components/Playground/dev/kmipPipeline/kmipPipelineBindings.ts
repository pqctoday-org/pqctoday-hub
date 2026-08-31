// SPDX-License-Identifier: GPL-3.0-only
/**
 * KMIP binding rules — which earlier steps' outputs may fill a given op
 * step's parameter slot, and what a KMIP pipeline is missing before it can
 * run. Same structural role as ../pipeline/pipelineBindings.ts on the
 * PKCS#11 side (dev-tabs-pkcs11-kmip plan, W2), adapted to the KMIP step
 * vocabulary: four step KINDS (op / load-policy / dry-run / expect-deny)
 * instead of one, and a single `{bind:'ref', step, part?}` shape instead of
 * the PKCS#11 side's two-bind-kind (`ref`/`key`) system — see
 * kmipPipelineCodegen.ts's `KmipParamValue`.
 *
 * `text` (the Sign step's message parameter) is deliberately never
 * validated as "must be bound": kmipPipelineCodegen.ts's `emitOpStep`
 * already falls back to the pipeline-wide message whenever `text` isn't a
 * literal binding, and nothing in the KMIP vocabulary produces a
 * `text`-shaped output for it to bind TO — the pipeline-wide "Message to
 * sign" input (KmipPipelineBuilder's own state) is the only real source.
 * Requiring an explicit binding here would flag every shipped template's
 * Sign step as broken for no reason.
 */
import { KMIP_PRIMITIVES, type KmipParamKind } from './kmipPipelinePrimitives'
import type { KmipParamValue, KmipStep } from './kmipPipelineCodegen'

export interface BindingOption {
  label: string
  value: KmipParamValue
}

const sameValue = (a: KmipParamValue | undefined, b: KmipParamValue): boolean =>
  !!a && JSON.stringify(a) === JSON.stringify(b)

/**
 * Options for one op step's parameter slot, drawn only from `op`-kind steps
 * BEFORE this one — a step can never bind forward, so the pipeline stays a
 * straight line by construction (same rule as the PKCS#11 side).
 */
export function optionsFor(kind: KmipParamKind, steps: KmipStep[], index: number): BindingOption[] {
  if (kind === 'text') return [] // see module header — never bindable, always the pipeline message
  const out: BindingOption[] = []

  for (let i = 0; i < index; i++) {
    const st = steps[i]
    if (st.kind === 'register') {
      // A Register step is a valid bind source too — it produces exactly
      // the private OR public half a fresh createKeyPair step would (see
      // kmipPipelineCodegen.ts's emitStepBody 'register' case, which
      // stores into the SAME priv_<id>/pub_<id> variable a keypair step
      // would). ACVP known-answer templates are the only current caller.
      const tag = `${i + 1}. Register (${st.objectType})`
      if (st.objectType === 'PrivateKey' && (kind === 'privUid' || kind === 'uid')) {
        out.push({
          label: `${tag} · private key`,
          value: { bind: 'ref', step: st.id, part: 'priv' },
        })
      }
      if (st.objectType === 'PublicKey' && (kind === 'pubUid' || kind === 'uid')) {
        out.push({ label: `${tag} · public key`, value: { bind: 'ref', step: st.id, part: 'pub' } })
      }
      continue
    }
    if (st.kind !== 'op') continue
    const spec = KMIP_PRIMITIVES[st.primId]
    const produces = spec?.ops[st.op]?.produces
    if (!produces || produces === 'none' || produces === 'bool') continue
    const tag = `${i + 1}. ${spec?.label ?? st.primId}`

    switch (kind) {
      case 'pubUid':
        if (produces === 'keypairUids')
          out.push({
            label: `${tag} · public key`,
            value: { bind: 'ref', step: st.id, part: 'pub' },
          })
        break
      case 'privUid':
        if (produces === 'keypairUids')
          out.push({
            label: `${tag} · private key`,
            value: { bind: 'ref', step: st.id, part: 'priv' },
          })
        break
      case 'ciphertextHex':
        if (produces === 'ciphertextAndUid')
          out.push({
            label: `${tag} · ciphertext`,
            value: { bind: 'ref', step: st.id, part: 'ciphertext' },
          })
        break
      case 'uid':
        if (produces === 'keypairUids') {
          out.push({
            label: `${tag} · private key`,
            value: { bind: 'ref', step: st.id, part: 'priv' },
          })
          out.push({
            label: `${tag} · public key`,
            value: { bind: 'ref', step: st.id, part: 'pub' },
          })
        } else if (produces === 'uid' || produces === 'ciphertextAndUid') {
          out.push({ label: `${tag} · key`, value: { bind: 'ref', step: st.id } })
        }
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

/** Everything that would stop this KMIP pipeline running, named by step. */
export function validate(steps: KmipStep[]): Finding[] {
  const findings: Finding[] = []

  if (!steps.length) {
    findings.push({ stepIndex: null, text: 'Pipeline is empty', severity: 'warn' })
    return findings
  }

  // Forward-accumulated: the id of any op step (create/createKeyPair/...)
  // whose produced object has been destroyed by an earlier `destroy` step.
  const destroyedTargets = new Set<string>()

  steps.forEach((st, i) => {
    if (st.kind === 'op') {
      const spec = KMIP_PRIMITIVES[st.primId]
      if (!spec) {
        findings.push({ stepIndex: i, text: `Unknown primitive "${st.primId}"`, severity: 'error' })
        return
      }
      const opSpec = spec.ops[st.op]
      if (!opSpec) {
        findings.push({
          stepIndex: i,
          text: `${spec.label} does not support "${st.op}"`,
          severity: 'error',
        })
        return
      }

      for (const [name, kind] of Object.entries(opSpec.requires)) {
        if (!kind || kind === 'text') continue
        const bound = st.params[name]
        if (!bound) {
          findings.push({
            stepIndex: i,
            text: `Step ${i + 1} · ${spec.label}: "${name}" is not bound`,
            severity: 'error',
          })
          continue
        }
        if (bound.bind !== 'ref') continue
        const targetId = bound.step
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
        } else if (destroyedTargets.has(targetId)) {
          findings.push({
            stepIndex: i,
            text: `Step ${i + 1} · ${spec.label}: "${name}" references a key already destroyed at an earlier step`,
            severity: 'error',
          })
        }
      }

      if (st.op === 'destroy') {
        const uidParam = st.params.uid
        if (uidParam?.bind === 'ref') destroyedTargets.add(uidParam.step)
      }
      return
    }

    if (st.kind === 'load-policy') {
      if (!st.policyFile) {
        findings.push({
          stepIndex: i,
          text: `Step ${i + 1} · Load policy: no policy file selected`,
          severity: 'error',
        })
      }
      return
    }

    if (st.kind === 'dry-run') {
      if (!st.op) {
        findings.push({
          stepIndex: i,
          text: `Step ${i + 1} · Dry-run: no operation selected`,
          severity: 'error',
        })
      }
      return
    }

    // register/assert-equals: ACVP known-answer template steps, not
    // palette-draggable — every field is already fixed by the template
    // that created them, so there's nothing here for a learner to bind
    // incorrectly.
    if (st.kind === 'register' || st.kind === 'assert-equals') return

    // expect-deny
    if (!st.targetStepId) {
      findings.push({
        stepIndex: i,
        text: `Step ${i + 1} · Expect deny: no target step selected`,
        severity: 'error',
      })
      return
    }
    const at = steps.findIndex((x) => x.id === st.targetStepId)
    if (at < 0) {
      findings.push({
        stepIndex: i,
        text: `Step ${i + 1} · Expect deny: target step was deleted`,
        severity: 'error',
      })
    } else if (at >= i) {
      findings.push({
        stepIndex: i,
        text: `Step ${i + 1} · Expect deny: target step must come earlier in the pipeline`,
        severity: 'error',
      })
    } else if (steps[at].kind !== 'op') {
      findings.push({
        stepIndex: i,
        text: `Step ${i + 1} · Expect deny: target step must be an operation, not a policy/dry-run step`,
        severity: 'error',
      })
    }
  })

  return findings
}
