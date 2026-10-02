// SPDX-License-Identifier: GPL-3.0-only
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __BUILD_TIMESTAMP__: string
declare const __APP_VERSION__: string
declare const __WASM_HASH__: string

// wasm-bindgen's generated `_bg.js` glue ships no .d.ts. The cert-discovery
// worker imports it only to pass it as the wasm import object, and casts it
// to `unknown` itself, so an untyped shorthand declaration is accurate.
declare module '@/wasm/softhsmrustv3_bg.js'
