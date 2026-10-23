// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Simulate State Loss" in the State Management simulator asks the HSM engine to
 * take an HSS/LMS private key back to an earlier state, the three ways a restore
 * or a clone would: write the leaf counter back, read the key state out so it can
 * be saved and restored, and copy the key object. Each attempt is a real PKCS#11
 * call on the live key and the page prints the return value the engine gave.
 *
 * Both engines refuse all three for these keys (CKR_ATTRIBUTE_READ_ONLY,
 * CKR_ATTRIBUTE_SENSITIVE, CKR_ACTION_PROHIBITED), so no leaf is ever reused
 * here. The result is reported as it came back: an attempt the engine accepts is
 * shown as accepted, and the caller reads the counter from the engine afterwards
 * rather than assuming it.
 */
import { buildTemplate, freeTemplate } from '@/wasm/softhsm/helpers'
import { CKA_HSS_KEYS_REMAINING, CKA_VALUE } from '@/wasm/softhsm/constants'
import { rvName } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

/** PKCS#11 v3.2 return values the engine answers with; rvName does not know CKR_ACTION_PROHIBITED. */
const CKR_NAMES: Record<number, string> = {
  0x10: 'CKR_ATTRIBUTE_READ_ONLY',
  0x11: 'CKR_ATTRIBUTE_SENSITIVE',
  0x1b: 'CKR_ACTION_PROHIBITED',
}
const returnName = (rv: number): string => CKR_NAMES[rv] ?? rvName(rv)

export interface RollbackAttempt {
  id: 'write-counter' | 'read-state' | 'copy-key'
  /** What was tried, in plain words. */
  action: string
  /** The PKCS#11 call. */
  call: string
  /** The engine's return value, by name. */
  returned: string
  /** True when the engine said no (any return other than CKR_OK). */
  refused: boolean
  /** What the answer means for rolling the key back. */
  meaning: string
}

export interface RollbackProbe {
  attempts: RollbackAttempt[]
  /** Signatures left on the key before and after the attempts, as the engine reports them (null: no counter published). */
  remainingBefore: number | null
  remainingAfter: number | null
  /** True when the engine's counter is different after the attempts, i.e. it let the rewrite through. */
  counterMoved: boolean
}

const MEANING: Record<RollbackAttempt['id'], { refused: string; accepted: string }> = {
  'write-counter': {
    refused: 'The leaf counter cannot be written from outside the module.',
    accepted: 'The engine accepted the write, so the counter can be set from outside.',
  },
  'read-state': {
    refused: 'The key state cannot be read out, so there is nothing to snapshot and restore.',
    accepted: 'The engine returned the key state, so it can be saved and restored.',
  },
  'copy-key': {
    refused: 'The key cannot be cloned to a second signer.',
    accepted: 'The engine made a copy of the key, so two signers could hold the same state.',
  },
}

export function probeStateRollback(
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  /** The counter value that would put the key back at the earlier signature. */
  targetRemaining: number,
  /** Reads the key's remaining-signature counter from the engine. */
  readRemaining: () => number | null
): RollbackProbe {
  const remainingBefore = readRemaining()
  const attempts: RollbackAttempt[] = []
  const record = (
    id: RollbackAttempt['id'],
    action: string,
    call: string,
    rv: number
  ): RollbackAttempt => {
    const refused = rv !== 0
    const a: RollbackAttempt = {
      id,
      action,
      call,
      returned: returnName(rv),
      refused,
      meaning: refused ? MEANING[id].refused : MEANING[id].accepted,
    }
    attempts.push(a)
    return a
  }

  // 1. Write the leaf counter back to its earlier value.
  {
    const buf = M._malloc(4)
    M.setValue(buf, targetRemaining, 'i32')
    const tpl = buildTemplate(M, [{ type: CKA_HSS_KEYS_REMAINING, bytesPtr: buf, bytesLen: 4 }])
    try {
      const rv = M._C_SetAttributeValue(hSession, privHandle, tpl.ptr, 1) >>> 0
      record(
        'write-counter',
        'Write the leaf counter back to its earlier value',
        'C_SetAttributeValue(CKA_HSS_KEYS_REMAINING)',
        rv
      )
    } finally {
      freeTemplate(M, tpl, 1)
      M._free(buf)
    }
  }

  // 2. Read the private key state, to save it and restore it later.
  {
    const tpl = buildTemplate(M, [{ type: CKA_VALUE }])
    try {
      const rv = M._C_GetAttributeValue(hSession, privHandle, tpl.ptr, 1) >>> 0
      record(
        'read-state',
        'Read the key state out, to save a snapshot',
        'C_GetAttributeValue(CKA_VALUE)',
        rv
      )
    } finally {
      freeTemplate(M, tpl, 1)
    }
  }

  // 3. Copy the key object, as a backup or a second signer would.
  {
    const out = M._malloc(4)
    try {
      const rv = M._C_CopyObject(hSession, privHandle, 0, 0, out) >>> 0
      record('copy-key', 'Copy the key to a second signer', 'C_CopyObject', rv)
      if (rv === 0) {
        // the engine made a copy: remove it again so the probe leaves nothing behind
        M._C_DestroyObject(hSession, M.getValue(out, 'i32') >>> 0)
      }
    } finally {
      M._free(out)
    }
  }

  const remainingAfter = readRemaining()
  return {
    attempts,
    remainingBefore,
    remainingAfter,
    counterMoved: remainingBefore !== remainingAfter,
  }
}
