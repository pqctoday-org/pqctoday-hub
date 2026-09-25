# ACVP cross-target evidence — run 2026-09-25-kv260-control-hw-disabled

This is **variant B**, the control for
[run 2026-09-25-kv260-default](../2026-09-25-kv260-default/README.md) (variant A). It uses the same
board, boot, engine bytes, bundles and read-only procedure as variant A, with one difference:
**`PQC_HW_DISABLE=1`** is set in the runner's environment.

In the Rust engine, that variable makes `C_Initialize` skip every accelerator probe
(`rust/src/hw_accel.rs:316-318` at hsm `7f12c48d`), so no hook is installed at all. The C++ engine
has no accelerator code, so the variable has no effect there. It was set for symmetry.

A separate `C_Initialize`/`C_Finalize` with `PQC_HW_DIAGNOSTICS=1` printed no accelerator line
(`observations/c-initialize-diagnostics.json`).

> PQC Today executes selected public reference vectors, standards tests, conformance cases,
> and implementation probes. A passing result is evidence only for the identified test,
> operation, parameters, implementation build, and target. It is not an ACVTS verdict, a
> CAVP/CMVP certificate, or proof of exhaustive conformance.

## Result

Both KV260 targets pass 157 of 157 executable cases, with 188 unsupported, 0 failed and 0 not
comparable. Both targets are publishable, with acceleration recorded as `none`. Variant A's
README gives the per-operation finding and the effective OpenSSL configuration, which is
identical here (`observations/runner-process-openssl.json`).

Every `response.json` is byte-identical to variant A's, to the bundle's reference response and to
the WS-F goldens: ML-KEM `b967f579…`, ML-DSA `17426869…`. Removing even the `C_Initialize`
probe changes no answer.

In the `execution-environment` records, variant B differs from variant A only in `recordedAt`,
`acceleration.detail` and `notes`, which state that `PQC_HW_DISABLE=1` was set.

This run is named so that it sorts **before** variant A. The release-evidence report judges each
target by the most recent run in which it was run, so its KV260 basis stays the appliance-default
run.

## Replay

```bash
npx tsx scripts/acvp-xplat-wasm.ts --run evidence/acvp-xplat/2026-09-25-kv260-control-hw-disabled --bundle-dir /tmp/acvp-bundles --verify-bundles-only
npx tsx scripts/acvp-xplat-compare.ts --run evidence/acvp-xplat/2026-09-25-kv260-control-hw-disabled --check
```
