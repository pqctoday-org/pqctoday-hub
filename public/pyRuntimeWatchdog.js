// SPDX-License-Identifier: GPL-3.0-only
// pyRuntimeWatchdog — dedicated timeout worker for the Developer tabs'
// Pyodide runtime (dev-tabs-pkcs11-kmip plan, G9/W4).
//
// Pyodide runs on the main thread (see pyRuntime.ts's header), so the only
// way to deliver a genuine mid-run KeyboardInterrupt is to write SIGINT into
// its shared interrupt buffer from a DIFFERENT thread — this worker.
// Deliberately a plain static script (not bundled): avoids the G8
// bundled-worker chunk-race class of bug entirely.
//
// Design constraint found the hard way (G9/W4 root cause): a worker does not
// begin executing until its script load has been serviced by the PARENT's
// event loop — so this worker must be created and handshaken while the main
// thread is still free (pyRuntime.ts pre-warms it during boot), and NOTHING
// after that handshake may depend on the parent's event loop. Hence the
// protocol below: postMessage is used exactly once (the SAB handover), and
// every arm/disarm afterwards is pure Atomics on the shared buffer — no
// timers on the parent side, no further messages.
//
// SAB layout (8 bytes):
//   byte 0        — Pyodide's interrupt byte (write 2 = SIGINT → KeyboardInterrupt)
//   bytes 4..7    — Int32 control word: 0 = disarmed; N>0 = armed, generation N
//
// Protocol:
//   parent → worker, once:  postMessage({ sab, deadlineMs })
//   worker → parent, once:  postMessage('ready')   (pre-warm handshake)
//   arm:     parent Atomics.store(ctrl, 0, ++generation) + notify
//   disarm:  parent Atomics.store(ctrl, 0, 0) + notify
//   fire:    if a generation stays armed for deadlineMs, write SIGINT, then
//            self-disarm via compareExchange (a re-arm that raced in wins).

let inited = false

self.onmessage = (event) => {
  if (inited) return
  inited = true
  const sig = new Uint8Array(event.data.sab, 0, 1)
  const ctrl = new Int32Array(event.data.sab, 4, 1)
  const deadlineMs = event.data.deadlineMs
  self.postMessage('ready')
  // This loop never returns — all control from here on is via Atomics, and
  // Atomics.wait keeps the thread genuinely asleep (zero CPU) while disarmed.
  for (;;) {
    Atomics.wait(ctrl, 0, 0) // sleep until armed (ctrl becomes non-zero)
    const gen = Atomics.load(ctrl, 0)
    if (gen === 0) continue
    const r = Atomics.wait(ctrl, 0, gen, deadlineMs) // until disarm/re-arm or deadline
    if (r === 'timed-out' && Atomics.load(ctrl, 0) === gen) {
      Atomics.store(sig, 0, 2) // SIGINT — Pyodide raises KeyboardInterrupt mid-run
      Atomics.compareExchange(ctrl, 0, gen, 0) // self-disarm unless already re-armed
    }
  }
}
