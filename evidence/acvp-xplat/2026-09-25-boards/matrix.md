# ACVP cross-target matrix — 2026-09-25-boards

Statuses are never collapsed: pass / fail / unsupported / not run / not comparable are counted separately. A pass is evidence only for the identified test, operation, parameters, implementation build and target — not an ACVTS verdict, a CAVP/CMVP certificate, or proof of exhaustive conformance.

Reference: WS-F golden responses (src/services/acvp/__fixtures__/goldens/*.response.json): identical from both WASM engines and equal to NIST ACVP-Server expectedResults.json for every answered case.

## Targets

| Target | Run | Publishable | Arch | Emulated | OpenSSL | Engine commit | Artifact SHA-256 |
|---|---|---|---|---|---|---|---|
| wasm-cpp | not run — Not part of this board-only run (plan 09-25 §3 P4, decision D4). Same bundles as run 2026-09-24b, where this target's result is recorded. | — | — | — | — | — | — |
| wasm-rust | not run — Not part of this board-only run (plan 09-25 §3 P4, decision D4). Same bundles as run 2026-09-24b, where this target's result is recorded. | — | — | — | — | — | — |
| macos-arm64-cpp | not run — Not part of this board-only run (plan 09-25 §3 P4, decision D4). Same bundles as run 2026-09-24b, where this target's result is recorded. | — | — | — | — | — | — |
| macos-arm64-rust | not run — Not part of this board-only run (plan 09-25 §3 P4, decision D4). Same bundles as run 2026-09-24b, where this target's result is recorded. | — | — | — | — | — | — |
| linux-x86_64-cpp | not run — Not part of this board-only run (plan 09-25 §3 P4, decision D4). Same bundles as run 2026-09-24b, where this target's result is recorded. | — | — | — | — | — | — |
| linux-x86_64-rust | not run — Not part of this board-only run (plan 09-25 §3 P4, decision D4). Same bundles as run 2026-09-24b, where this target's result is recorded. | — | — | — | — | — | — |
| linux-arm64-cpp | not run — Not part of this board-only run (plan 09-25 §3 P4, decision D4). Same bundles as run 2026-09-24b, where this target's result is recorded. | — | — | — | — | — | — |
| linux-arm64-rust | not run — Not part of this board-only run (plan 09-25 §3 P4, decision D4). Same bundles as run 2026-09-24b, where this target's result is recorded. | — | — | — | — | — | — |
| imx95-cpp | run — FRDM-IMX95 on its CURRENT image (build 20260920213212, card 0x232), the image's own /usr/lib/softhsm/libsofthsmv3.so, hsm 44e72072 (build-time SBOM + package version; on-board SHA-256 = the .wic's file). Not rebuilt, not reflashed. | yes | aarch64 | no | OpenSSL 3.6.3 9 Jun 2026 | 44e7207229f8 | 7829da1a43058bf9… |
| imx95-rust | run — FRDM-IMX95 on its CURRENT image (build 20260920213212, card 0x232), the image's own /usr/lib/softhsm/libsofthsmrustv3.so, hsm 44e72072 (build-time SBOM + package version; on-board SHA-256 = the .wic's file). Not rebuilt, not reflashed. | yes | aarch64 | no | not linked | 44e7207229f8 | 7d57ad56e8d06d9c… |
| kv260-cpp | run — KV260 on its CURRENT image (build 20260925131032, card 0x231, FPGA profile hashsig), the image's own /usr/lib/softhsm/libsofthsmv3.so, hsm 7f12c48d (build-time SBOM + package version; on-board SHA-256 = the .wic's file). Acceleration recorded as unknown (decision D4), so NOT publishable by design. | no (acceleration.state) | aarch64 | no | OpenSSL 3.6.3 9 Jun 2026 | 7f12c48d5e40 | d4eb794a0520b894… |
| kv260-rust | run — KV260 on its CURRENT image (build 20260925131032, card 0x231, FPGA profile hashsig), the image's own /usr/lib/softhsm/libsofthsmrustv3.so (hw-accel build), hsm 7f12c48d (build-time SBOM + package version; on-board SHA-256 = the .wic's file). Acceleration recorded as unknown (decision D4), so NOT publishable by design. | no (acceleration.state) | aarch64 | no | not linked | 7f12c48d5e40 | 3b75af8a0380d417… |

## ML-KEM-encapDecap-FIPS203 (vsId 42, 165 test cases)

Bundle manifest SHA-256: `d2ea5cd41c49bb156a0301ce033c09a12ccf61837a8edbecd1f9fcdbf8f702fd`

| Target | Headline | Counts |
|---|---|---|
| wasm-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| wasm-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| macos-arm64-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| macos-arm64-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| linux-x86_64-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| linux-x86_64-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| linux-arm64-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| linux-arm64-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| imx95-cpp | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| imx95-rust | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| kv260-cpp | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| kv260-rust | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |

## ML-DSA-sigVer-FIPS204 (vsId 42, 180 test cases)

Bundle manifest SHA-256: `966ec2faeba6d85fe862b3bead4f0aebf47b784cecd472c2e5fb3a30905f444f`

| Target | Headline | Counts |
|---|---|---|
| wasm-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| wasm-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| macos-arm64-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| macos-arm64-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| linux-x86_64-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| linux-x86_64-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| linux-arm64-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| linux-arm64-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| imx95-cpp | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| imx95-rust | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| kv260-cpp | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| kv260-rust | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |

## Totals per target

| Target | Counts |
|---|---|
| wasm-cpp | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| wasm-rust | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| macos-arm64-cpp | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| macos-arm64-rust | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| linux-x86_64-cpp | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| linux-x86_64-rust | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| linux-arm64-cpp | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| linux-arm64-rust | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| imx95-cpp | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| imx95-rust | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| kv260-cpp | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| kv260-rust | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |

## Divergences

None.
