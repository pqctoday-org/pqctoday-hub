// SPDX-License-Identifier: GPL-3.0-only
/**
 * The crypto-agility story, in three steps — B+ remediation 4.5 (2026-08-10).
 *
 * The hub's KMIP control plane and the sandbox's agility console are the two
 * strongest demonstrations of crypto agility either product has, and both were
 * delivered as consoles: sixty-six operations and raw wire responses. An
 * executive could extract nothing from either. Worse, the hub's response to an
 * executive arriving was a banner redirecting them somewhere else — the site's
 * central argument, and the one audience it most needs to convince was pointed
 * at the door.
 *
 * This module is the shared script. Both consoles read it, so they tell the
 * same story in the same words rather than two different stories twice — which
 * is the handoff's own argument for doing it this way, and it halves the work
 * on the sandbox side.
 *
 * COSTS ARE DERIVED. Every figure quoted below is computed from the same
 * registries the rest of the site quotes (`ALGORITHM_REGISTRY` via
 * `mlDsaSignatureBytes`, `CLASSICAL_HSM_DEFAULT`, `MIGRATION_KEYS`), never
 * typed. An executive-facing number that drifted from the engineering pages
 * would undermine exactly the credibility this panel exists to build.
 */
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { CLASSICAL_HSM_DEFAULT } from './hsmCapacityDefaults'
import { MIGRATION_KEYS } from '../components/Playground/kmip/migration/migrationKeys'

const ML_DSA_65 = ALGORITHM_REGISTRY['ML-DSA-65']
const ECDSA = ALGORITHM_REGISTRY['ECDSA P-256']

export interface AgilityStep {
  /** 1-based, for "Step N of three". */
  n: number
  title: string
  /** What the reader is about to watch happen, in plain terms. */
  body: string
  /** The cost or consequence, stated. Derived — see the module comment. */
  cost: string
  /** What to click in the console to make it happen. */
  action: string
}

/** Signature growth, straight from the registry rather than remembered. */
const SIG_GROWTH =
  ECDSA && ECDSA.signatureOrCiphertextBytes > 0
    ? `${ECDSA.signatureOrCiphertextBytes} B → ${ML_DSA_65.signatureOrCiphertextBytes.toLocaleString()} B`
    : `${ML_DSA_65.signatureOrCiphertextBytes.toLocaleString()} B`

const HSM_OPS = CLASSICAL_HSM_DEFAULT.opsPerSec['ml-dsa-65']
const HSM_OPS_CLASSICAL = CLASSICAL_HSM_DEFAULT.opsPerSec['ecdsa-p256']
const ESTATE_KEYS = MIGRATION_KEYS.length

export const AGILITY_STORY_TITLE = 'Crypto agility in three steps'

export const AGILITY_STORY_PROMISE =
  'Agility is the ability to change algorithm without changing the application. This is what that looks like when it works — three steps, about two minutes, running against a real control plane rather than a slide.'

export const AGILITY_STEPS: AgilityStep[] = [
  {
    n: 1,
    title: 'Set the policy',
    body: 'One rule, written once, in the control plane rather than in any application: this estate no longer issues classical signing keys. Nothing is rewritten and nothing is redeployed — the rule is data, not code.',
    cost: `Cost: the policy itself is a few lines. What it replaces is a change request against every application that mints a key — which is the reason most estates cannot do this at all.`,
    action: 'Activate a policy in the Policy plane',
  },
  {
    n: 2,
    title: 'Watch a request be refused',
    body: 'Ask the control plane for exactly what the policy forbids. It says no, gives the rule it applied, and writes the refusal to the audit trail. This is the step that matters: the enforcement is central, so it holds for applications nobody has reviewed.',
    cost: `Cost: the refusal is the control working, not an outage — the caller retries with a compliant algorithm. What you are buying is that you never have to ask each team whether they complied.`,
    action: 'Run a scenario the policy refuses',
  },
  {
    n: 3,
    title: 'Watch the estate rekey',
    body: `Rotate the affected keys to the post-quantum algorithm. The control plane reissues them and the applications carry on against the same key names — ${ESTATE_KEYS} keys in this worked estate, and the same operation at any size.`,
    cost: `Cost, stated: signatures grow ${SIG_GROWTH}, so certificate chains, tokens and firmware headers all get bigger, and an HSM that does ${HSM_OPS_CLASSICAL.toLocaleString()} ECDSA P-256 signatures per second manages roughly ${HSM_OPS.toLocaleString()} with ML-DSA-65. That is the capacity conversation this migration actually is — not whether to move, but what to buy.`,
    action: 'Run the rekey in the Migration plane',
  },
]

/** One line for the close, so the story ends on a claim rather than a screen. */
export const AGILITY_STORY_CLOSE =
  'That is the whole argument for agility: the algorithm changed, the applications did not, and there is a record of both. An estate that cannot do this has to repeat the whole migration the next time an algorithm is retired — and there will be a next time.'
