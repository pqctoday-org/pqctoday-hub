// SPDX-License-Identifier: GPL-3.0-only
/**
 * kmipBridge — exposes the hub's in-browser KmipEngine to Pyodide, so the
 * Python-side `pqctoday_kmip` shim can reimplement the SAME operation
 * surface the real `pqctoday_kmip.KmipClient` package
 * (pqctoday-hsm/kmip/python-client) exposes — just backed by a synchronous
 * in-page wasm call instead of a real TLS/TTLV connection to a pqc-kmip
 * server.
 *
 * JSON-STRING in, JSON-string out — deliberately, not a plain JS object.
 * Passing a live JS object/Python dict across the Pyodide ffi boundary has
 * real, easy-to-get-wrong auto-conversion behavior (confirmed the hard way
 * in the p11Bridge work: a bare JS `number` vs `BigInt` mismatch broke a
 * PKCS#11 call in a way that only showed up at runtime). A JSON string has
 * none of that ambiguity on either side, and it is exactly what the
 * underlying wasm binding (`WasmKmipPlayground.run_op`) already does
 * internally — `KmipEngine.runOp` itself is just
 * `JSON.parse(this.pg.run_op(JSON.stringify(spec)))`. This bridge mirrors
 * that shape one layer up instead of introducing a different one.
 */
import type { KmipEngine, OpSpec } from '../kmip/kmipEngine'

export interface KmipBridgeHandle {
  /** specJson: a JSON-encoded OpSpec. Returns a JSON-encoded OpResult. */
  runOpJson: (specJson: string) => string
  /** listObjects()'s metadata-only view (algorithm/length/state/name/
   *  usageMask — no key material), JSON-encoded. Backs the shim's
   *  get_attributes(uid): genuinely correct there in a way routing through
   *  Get is not — Get legitimately refuses a non-extractable private key's
   *  material (confirmed live, dev-tabs-pkcs11-kmip plan P3: "KMIP
   *  NotExtractable... material is held by the engine and is not
   *  extractable"), while a real GetAttributes never touches key material
   *  at all. listObjects() is the metadata-only surface that actually
   *  matches GetAttributes' real semantics. */
  listObjectsJson: () => string
}

export function createKmipBridge(engine: KmipEngine): KmipBridgeHandle {
  return {
    runOpJson: (specJson: string) => {
      const spec = JSON.parse(specJson) as OpSpec
      return JSON.stringify(engine.runOp(spec))
    },
    listObjectsJson: () => JSON.stringify(engine.listObjects()),
  }
}
