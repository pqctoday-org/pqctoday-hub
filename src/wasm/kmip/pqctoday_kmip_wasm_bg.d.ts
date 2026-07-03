// SPDX-License-Identifier: GPL-3.0-only
//
// Hand-authored declaration stub for the wasm-bindgen glue module. The bundler
// target emits pqctoday_kmip_wasm_bg.js WITHOUT a matching .d.ts (only
// pqctoday_kmip_wasm_bg.wasm.d.ts, which types the raw wasm exports), so a
// direct TS import of the glue trips TS7016. Consumers instantiate the wasm
// by hand and cast the module to their own interface (see
// policyEditModel.local.test.ts) — keep this stub minimal and permissive.
// build-kmip-wasm.sh only copies files into this directory, so this stub
// survives wasm rebuilds.
export function __wbg_set_wasm(wasm: WebAssembly.Exports): void
