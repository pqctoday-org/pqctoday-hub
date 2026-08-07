// SPDX-License-Identifier: GPL-3.0-only
//
// Pins a capability claim about the RUST softhsm engine: C_SetAttributeValue
// is really implemented, not stubbed.
//
// Why this exists: VpnSimulationPanel.tsx swaps the shared module for the C++
// build at runtime on the stated grounds that "the Rust softhsm-wasm module
// stubs C_SetAttributeValue (-> CKR_MECHANISM_INVALID)". That claim traced
// back to a capability map in a since-deleted duplicate loader, not to the
// engine. A source read is not enough to retire it — the question is what the
// SHIPPED binary does, so this drives the real wasm in a real browser and
// round-trips the attribute: write CKA_ID, then read it back and compare.
//
// A half-test (call it, assert CKR_OK) would pass against an engine that
// accepts the call and discards the value, which is exactly the failure mode
// that would break strongSwan's C_FindObjects({CKA_ID=ski}) lookup. Hence the
// read-back.
//
// Venue: *.local + dev server — it imports app source directly.
import { test, expect } from '@playwright/test'

test('rust softhsm implements C_SetAttributeValue (write + read-back)', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/playground/hsm')

  const result = await page.evaluate(async () => {
    const H = await import('/src/wasm/softhsm.ts')
    const M = await H.getSoftHSMRustModule()

    H.hsm_initialize(M)
    const slot = H.hsm_getFirstFreeSlot(M)
    H.hsm_initToken(M, slot, '1234', 'setattr-probe')
    const hSession = H.hsm_openUserSession(M, slot, '1234', '1234')

    // Generate with a known CKA_ID so we can prove the value CHANGED rather
    // than merely being present.
    const idAtGen = new Uint8Array(20).fill(0xaa)
    const { privHandle } = H.hsm_generateMLDSAKeyPair(M, hSession, 65, false, true, idAtGen)

    // ── write a different CKA_ID via C_SetAttributeValue ──
    const idAfter = new Uint8Array(20).fill(0xbb)
    const valPtr = M._malloc(idAfter.length)
    M.HEAPU8.set(idAfter, valPtr)
    const tpl = H.buildTemplate(M, [{ type: H.CKA_ID, bytesPtr: valPtr, bytesLen: idAfter.length }])
    const setRv = M._C_SetAttributeValue(hSession, privHandle, tpl.ptr, 1)
    H.freeTemplate(M, tpl, 1)
    M._free(valPtr)

    // ── read it back ──
    const outPtr = M._malloc(64)
    const readTpl = H.buildTemplate(M, [{ type: H.CKA_ID, bytesPtr: outPtr, bytesLen: 64 }])
    const getRv = M._C_GetAttributeValue(hSession, privHandle, readTpl.ptr, 1)
    const readLen = M.getValue(readTpl.ptr + 8, 'i32')
    const readBack = Array.from(M.HEAPU8.subarray(outPtr, outPtr + Math.max(0, readLen)))
    H.freeTemplate(M, readTpl, 1)
    M._free(outPtr)

    return { setRv, getRv, readLen, readBack }
  })

  // CKR_OK === 0. A stubbed implementation returns CKR_MECHANISM_INVALID (0x70)
  // or CKR_FUNCTION_NOT_SUPPORTED (0x54).
  expect(
    result.setRv,
    `C_SetAttributeValue returned 0x${result.setRv.toString(16)} — not CKR_OK`
  ).toBe(0)
  expect(result.getRv, `C_GetAttributeValue returned 0x${result.getRv.toString(16)}`).toBe(0)
  expect(result.readLen, 'CKA_ID read back with the wrong length').toBe(20)
  // The value must be what C_SetAttributeValue wrote (0xbb), NOT the value
  // baked in at keygen (0xaa) — that difference is the whole point.
  expect(
    result.readBack,
    'CKA_ID did not change — the engine accepted the call but discarded the value'
  ).toEqual(new Array(20).fill(0xbb))
})
