// SPDX-License-Identifier: GPL-3.0-only
//
// openssh_worker.js — runs the REAL OpenSSH WASM handshake off the main thread.
//
// The bundle (openssh-server.{js,wasm}, built from pqctoday-hsm/openssh-pkcs11)
// is self-contained: it embeds softhsmv3 and drives a single-process loopback
// (client + server in one instance via ssh_api.c). It needs no network and no
// SharedArrayBuffer — it just emits a structured handshake event stream through
// the onHandshakeEvent callback, which we forward to the bridge via postMessage.
//
// Protocol with the bridge (src/wasm/openssh-real.ts):
//   ← { type: 'RUN' }
//   → { type: 'EVENT', evType, payload }   (one per onHandshakeEvent)
//   → { type: 'LOG', level, text }         (stdout/stderr from the binary)
//   → { type: 'DONE', rv }                 (handshake finished; rv from __wrap_main)
//   → { type: 'ERROR', message }           (load/run failure)

/* global createSshdModule */

let factory = null

function loadFactory() {
  if (factory) return factory
  // importScripts evaluates the MODULARIZE glue in global scope; the non-ESM
  // output assigns `var createSshdModule`, which becomes a worker global.
  importScripts('/wasm/openssh-server.js')
  factory = self.createSshdModule
  if (typeof factory !== 'function') {
    throw new Error('openssh-server.js did not expose createSshdModule')
  }
  return factory
}

async function run(cfg) {
  const create = loadFactory()
  const Module = await create({
    noInitialRun: true,
    // The emscripten glue requests its internal name; map every .wasm to the
    // bundle's public path.
    locateFile: (p) => (p.endsWith('.wasm') ? '/wasm/openssh-server.wasm' : '/wasm/' + p),
    onHandshakeEvent: (evType, payload) => {
      self.postMessage({ type: 'EVENT', evType, payload })
    },
    print: (text) => self.postMessage({ type: 'LOG', level: 'info', text }),
    printErr: (text) => self.postMessage({ type: 'LOG', level: 'error', text }),
  })

  // Select the KEX + host-key profile before running (defaults to the PQC combo
  // if not provided). set_handshake_config is a no-op for unknown values.
  if (cfg && (cfg.kex || cfg.hostalg)) {
    Module.ccall(
      'set_handshake_config',
      null,
      ['string', 'string'],
      [cfg.kex || '', cfg.hostalg || '']
    )
  }

  // __wrap_main is exported directly (native main() is GC'd); ASYNCIFY => Promise.
  let rv = Module.ccall('__wrap_main', 'number', [], [], { async: true })
  if (rv && typeof rv.then === 'function') rv = await rv
  self.postMessage({ type: 'DONE', rv })
}

self.onmessage = (e) => {
  const msg = e.data || {}
  if (msg.type === 'RUN') {
    run({ kex: msg.kex, hostalg: msg.hostalg }).catch((err) => {
      self.postMessage({ type: 'ERROR', message: err && err.message ? err.message : String(err) })
    })
  }
}
