// SPDX-License-Identifier: GPL-3.0-only
/**
 * devSlot — finds or creates the Developer tabs' own PKCS#11 token slot,
 * LABELED so it is never confused with the rest of the HSM playground's
 * shared token (dev-tabs-pkcs11-kmip plan D6).
 *
 * WHY THIS EXISTS, AND WHY IT DOESN'T JUST CALL hsm_initToken:
 * `hsm_initToken` (session.ts) returns index 0 of the re-enumerated
 * INITIALIZED-slots list, not necessarily the slot it just initialized —
 * correct for the single-token case it was written for (HsmContext.autoInit,
 * the only caller today), wrong once a second token exists: with two
 * initialized tokens, that return value could hand back HsmContext's slot
 * instead of this tab's. Generated pipeline scripts end their session with
 * `s.logout()`, which is TOKEN-WIDE (PKCS#11 v3.2 §5.6.1 — confirmed live,
 * dev-tabs-pkcs11-kmip plan P1 debugging) — so if the Developer tab ever
 * mistakenly resolves to HsmContext's slot, running a pipeline would log the
 * OTHER HSM playground tabs out from under them.
 *
 * The fix: label the Developer tab's token 'DevSequences' at creation, and
 * find it (or an uninitialized physical slot to create it in) by walking
 * every slot's real CK_TOKEN_INFO.label — never by array position. A slot
 * already carrying a DIFFERENT label (e.g. HsmContext's 'SoftHSM3') is never
 * touched, initialized or not otherwise.
 *
 * "FREE" MEANS `!(flags & CKF_TOKEN_INITIALIZED)`, NOT `C_GetSlotList`'s
 * `tokenPresent` PARAMETER (dev-tabs-pkcs11-kmip plan G9, W1 — a real bug
 * found live). `tokenPresent` is about whether a token is PHYSICALLY
 * present in the slot (relevant for removable smart-card-style devices);
 * confirmed live that this hub's C++ SoftHSMv3 WASM build reports EVERY
 * slot as `tokenPresent=1` the moment it exists, including a slot that has
 * never had `C_InitToken` called on it — so the previous
 * `listAllSlots(M, true)` "initialized" set was actually just "all slots",
 * identical to the "all" set, and `free = all.find(s => !initialized.has(s))`
 * could never find anything. `CKF_TOKEN_INITIALIZED` (the actual PKCS#11
 * flag for "has this token been through C_InitToken") is unambiguous and
 * portable across engines — the Rust engine happened to make
 * `tokenPresent` behave the way this code assumed, which is why this was
 * never caught until the C++ lane was tested for the first time.
 */
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  allocUlong,
  readUlong,
  writeUlong,
  checkRV,
  writeStr,
} from '../../../../wasm/softhsm/helpers'
import { hsm_getTokenInfo } from '../../../../wasm/softhsm/pqc'

export const DEV_SLOT_LABEL = 'DevSequences'
const DEV_SLOT_SO_PIN = '12345678'
const DEV_SLOT_USER_PIN = '1234'
const CKF_TOKEN_INITIALIZED = 0x00000400

function listAllSlots(M: SoftHSMModule): number[] {
  const countPtr = allocUlong(M)
  try {
    checkRV(M._C_GetSlotList(0, 0, countPtr), 'C_GetSlotList(count)')
    const count = readUlong(M, countPtr)
    if (count === 0) return []
    const listPtr = M._malloc(count * 4)
    writeUlong(M, countPtr, count)
    try {
      checkRV(M._C_GetSlotList(0, listPtr, countPtr), 'C_GetSlotList')
      const n = readUlong(M, countPtr)
      const out: number[] = []
      for (let i = 0; i < n; i++) out.push(M.getValue(listPtr + i * 4, 'i32') >>> 0)
      return out
    } finally {
      M._free(listPtr)
    }
  } finally {
    M._free(countPtr)
  }
}

/** True if `slot` has genuinely been through C_InitToken — see this file's
 *  header for why that is NOT the same question as `C_GetSlotList`'s
 *  `tokenPresent` parameter answers. */
function isTokenInitialized(M: SoftHSMModule, slot: number): boolean {
  try {
    return (hsm_getTokenInfo(M, slot).flags & CKF_TOKEN_INITIALIZED) !== 0
  } catch {
    /* CKR_TOKEN_NOT_PRESENT race, or a slot with no token concept at all — not initialized. */
    return false
  }
}

/** Find the slot already labeled DEV_SLOT_LABEL, if one exists. */
function findLabeledSlot(M: SoftHSMModule): number | null {
  for (const slot of listAllSlots(M)) {
    try {
      if (hsm_getTokenInfo(M, slot).label === DEV_SLOT_LABEL) return slot
    } catch {
      /* CKR_TOKEN_NOT_PRESENT race between enumerate and read — skip */
    }
  }
  return null
}

/** Init a fresh Developer token on the first slot that is NOT yet
 *  initialized — never a slot that already carries a token under a
 *  different label. Returns the slot id it just initialized. */
function initFreshDevSlot(M: SoftHSMModule): number {
  const all = listAllSlots(M)
  const free = all.find((s) => !isTokenInitialized(M, s))
  if (free === undefined) {
    throw new Error(
      'No free PKCS#11 slot available for the Developer token — every physical ' +
        'slot in this browser session is already initialized (e.g. by the HSM ' +
        "playground tabs). Reload the page to reset the WASM engine's slot pool."
    )
  }
  const labelPtr = M._malloc(32)
  M.HEAPU8.fill(0x20, labelPtr, labelPtr + 32)
  M.HEAPU8.set(new TextEncoder().encode(DEV_SLOT_LABEL.slice(0, 32)), labelPtr)
  const pinPtr = writeStr(M, DEV_SLOT_SO_PIN)
  try {
    checkRV(M._C_InitToken(free, pinPtr, DEV_SLOT_SO_PIN.length, labelPtr), 'C_InitToken')
  } finally {
    M._free(labelPtr)
    M._free(pinPtr)
  }
  // C_InitToken can move the token to a different slot id than the one
  // requested (softhsm's own re-enumeration behavior — see hsm_initToken's
  // identical comment). Find it back by LABEL, not by assuming `free`.
  const found = findLabeledSlot(M)
  if (found === null) {
    throw new Error(
      'C_InitToken succeeded but the DevSequences token could not be found afterward.'
    )
  }
  return found
}

/** Set the Developer slot's USER PIN (SO login → C_InitPIN → logout), the
 *  same provisioning sequence hsm_openUserSession performs, but scoped to
 *  ONLY the Developer slot and returning nothing logged in — the caller's
 *  own script does its own login, proving that path rather than reusing a
 *  provisioning session. */
function provisionUserPin(M: SoftHSMModule, slot: number): void {
  const sessPtr = M._malloc(4)
  let hSession: number
  try {
    checkRV(M._C_OpenSession(slot, 0x0002 | 0x0004, 0, 0, sessPtr), 'C_OpenSession')
    hSession = M.getValue(sessPtr, 'i32') >>> 0
  } finally {
    M._free(sessPtr)
  }
  const soPinPtr = writeStr(M, DEV_SLOT_SO_PIN)
  let soLoginRv: number
  try {
    soLoginRv = M._C_Login(hSession, 0, soPinPtr, DEV_SLOT_SO_PIN.length) >>> 0
    // CKR_USER_ALREADY_LOGGED_IN (0x100) or CKR_USER_ANOTHER_ALREADY_LOGGED_IN
    // (0x104): this slot's PIN was already provisioned in an earlier call this
    // page session (findLabeledSlot found it, but the caller wants the PIN
    // guaranteed set) — nothing left to do.
    if (soLoginRv !== 0 && soLoginRv !== 0x100 && soLoginRv !== 0x104) {
      checkRV(soLoginRv, 'C_Login(SO)')
    }
  } finally {
    M._free(soPinPtr)
  }
  if (soLoginRv === 0) {
    const userPinPtr = writeStr(M, DEV_SLOT_USER_PIN)
    try {
      const initPinRv = M._C_InitPIN(hSession, userPinPtr, DEV_SLOT_USER_PIN.length) >>> 0
      if (initPinRv !== 0) checkRV(initPinRv, 'C_InitPIN')
    } finally {
      M._free(userPinPtr)
    }
    M._C_Logout(hSession)
  }
  M._C_CloseSession(hSession)
}

let cachedSlot: number | null = null

/** Idempotent: returns the Developer tab's slot id, creating + provisioning
 *  it on first call this page session and reusing the cached id afterward. */
export function ensureDevSlot(M: SoftHSMModule): number {
  if (cachedSlot !== null) return cachedSlot
  let slot = findLabeledSlot(M)
  if (slot === null) slot = initFreshDevSlot(M)
  provisionUserPin(M, slot)
  cachedSlot = slot
  return slot
}

/**
 * (Re-)authenticates a session on the Developer slot as USER. Login AND
 * logout are per-TOKEN, not per-session (PKCS#11 v3.2 §5.6) — real bug
 * found live 2026-08-30: the generated script's own `s.logout()`, the
 * last line of every run, deauthenticates the WHOLE token, including this
 * kept-open session's login state. Without re-logging in before a
 * post-run scan, private objects (CKA_PRIVATE=true, the common case for
 * private keys) become invisible to C_FindObjects — the scan doesn't
 * error, it just silently sees fewer objects than exist. Both RVs that
 * mean "already logged in" are tolerated (same as the Python shim's own
 * `login()` tolerates for the identical reason on the script's side), so
 * calling this unconditionally before every scan is always safe.
 */
export function reloginDevSlotSession(M: SoftHSMModule, hSession: number): void {
  const userPinPtr = writeStr(M, DEV_SLOT_USER_PIN)
  try {
    const rv = M._C_Login(hSession, 1 /* CKU_USER */, userPinPtr, DEV_SLOT_USER_PIN.length) >>> 0
    if (
      rv !== 0 &&
      rv !== 0x100 /* CKR_USER_ALREADY_LOGGED_IN */ &&
      rv !== 0x104 /* CKR_USER_ANOTHER_ALREADY_LOGGED_IN */
    ) {
      checkRV(rv, 'C_Login(USER)')
    }
  } finally {
    M._free(userPinPtr)
  }
}

/**
 * Opens a session against the Developer slot for the UI's own use —
 * inspecting a key's real PKCS#11 attributes after a run, not the session
 * the script itself runs under (that one opens and logs out inside the
 * generated Python, same as `provisionUserPin`'s doc comment describes
 * for the provisioning case). Meant to be opened once and kept open for
 * as long as the tab needs it (generated keys are token=True — see
 * pipelineCodegen.ts — specifically so this session can still find them
 * after the script's own session has closed). Caller owns its lifecycle:
 * close with `M._C_CloseSession(hSession)` on unmount, and must call
 * `reloginDevSlotSession` again before EVERY use after this — see that
 * function's own doc comment for why a kept-open session doesn't stay
 * authenticated on its own.
 */
export function openDevSlotSession(M: SoftHSMModule, slot: number): number {
  const sessPtr = M._malloc(4)
  let hSession: number
  try {
    checkRV(M._C_OpenSession(slot, 0x0002 | 0x0004, 0, 0, sessPtr), 'C_OpenSession')
    hSession = M.getValue(sessPtr, 'i32') >>> 0
  } finally {
    M._free(sessPtr)
  }
  reloginDevSlotSession(M, hSession)
  return hSession
}
