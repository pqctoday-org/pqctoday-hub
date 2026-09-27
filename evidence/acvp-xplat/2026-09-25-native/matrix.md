# ACVP cross-target matrix — 2026-09-25-native

Statuses are never collapsed: pass / fail / unsupported / not run / not comparable are counted separately. A pass is evidence only for the identified test, operation, parameters, implementation build and target — not an ACVTS verdict, a CAVP/CMVP certificate, or proof of exhaustive conformance.

Reference: WS-F golden responses (src/services/acvp/__fixtures__/goldens/*.response.json): identical from both WASM engines and equal to NIST ACVP-Server expectedResults.json for every answered case.

## Targets

| Target | Run | Publishable | Arch | Emulated | OpenSSL | Engine commit | Artifact SHA-256 |
|---|---|---|---|---|---|---|---|
| wasm-cpp | run | yes | wasm32 | no | OpenSSL 3.6.3 (static libcrypto.a for wasm32) | 7795799b91c6 | 2187f9a80878b34c… |
| wasm-rust | run | yes | wasm32 | no | not linked | 417c47a224a9 | a4582ff0102e0d14… |
| macos-arm64-cpp | run — Native macOS arm64 on the host (bare metal, not emulated), engine built for this run with Xcode 27.0 / Apple clang 21.0.0 against Homebrew OpenSSL 3.6.3 from a clean detached hsm worktree at 7795799b (the C++ WASM bundle's commit); bit-reproducible. | yes | arm64 | no | OpenSSL 3.6.3 9 Jun 2026 | 7795799b91c6 | 3fb20289df65daf8… |
| macos-arm64-rust | run — Native macOS arm64 on the host (bare metal, not emulated), engine built for this run with host rustc 1.96.0 from a clean detached hsm worktree at 417c47a2 (the Rust WASM bundle's commit); bit-reproducible. | yes | arm64 | no | not linked | 417c47a224a9 | 0eef6de33a3d0fe3… |
| linux-x86_64-cpp | run — Emulated (Rosetta 2) in a throwaway linux/amd64 container; engine built for this run with GCC 13.3.0 against OpenSSL 3.6.3 from a clean detached hsm worktree at 7795799b (the C++ WASM bundle's commit); bit-reproducible across two fresh containers. | yes | x86_64 | yes | OpenSSL 3.6.3 9 Jun 2026 | 7795799b91c6 | fad6b2ae99737aa4… |
| linux-x86_64-rust | run — Emulated (Rosetta 2) in a throwaway linux/amd64 container; engine built for this run with rustc 1.96.0 from a clean detached hsm worktree at 417c47a2 (the Rust WASM bundle's commit); bit-reproducible across two fresh containers. | yes | x86_64 | yes | not linked | 417c47a224a9 | 4dba14a6ee677e21… |
| linux-arm64-cpp | run — Native arm64 in pqc-rust, the same engine as runs 2026-09-24/24b (SHA-256 ba5d00ac…), built from a clean detached hsm worktree at 7795799b. | yes | aarch64 | no | OpenSSL 3.6.3 9 Jun 2026 | 7795799b91c6 | ba5d00acf9a44a39… |
| linux-arm64-rust | run — Native arm64 in pqc-rust, the same engine as runs 2026-09-24/24b (SHA-256 e3cf1bd4…), built from a clean detached hsm worktree at 417c47a2. | yes | aarch64 | no | not linked | 417c47a224a9 | e3cf1bd4dfd21d42… |
| imx95-cpp | not run — Board target — WS-H phase 2 (H-3), not part of this run. | — | — | — | — | — | — |
| imx95-rust | not run — Board target — WS-H phase 2 (H-3), not part of this run. | — | — | — | — | — | — |
| kv260-cpp | not run — Board target — WS-H phase 2 (H-3), not part of this run. | — | — | — | — | — | — |
| kv260-rust | not run — Board target — WS-H phase 2 (H-3), not part of this run. | — | — | — | — | — | — |

## ML-KEM-encapDecap-FIPS203 (vsId 42, 165 test cases)

Bundle manifest SHA-256: `d2ea5cd41c49bb156a0301ce033c09a12ccf61837a8edbecd1f9fcdbf8f702fd`

| Target | Headline | Counts |
|---|---|---|
| wasm-cpp | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| wasm-rust | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| macos-arm64-cpp | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| macos-arm64-rust | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| linux-x86_64-cpp | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| linux-x86_64-rust | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| linux-arm64-cpp | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| linux-arm64-rust | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| imx95-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| imx95-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| kv260-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| kv260-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |

## ML-DSA-sigVer-FIPS204 (vsId 42, 180 test cases)

Bundle manifest SHA-256: `966ec2faeba6d85fe862b3bead4f0aebf47b784cecd472c2e5fb3a30905f444f`

| Target | Headline | Counts |
|---|---|---|
| wasm-cpp | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| wasm-rust | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| macos-arm64-cpp | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| macos-arm64-rust | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| linux-x86_64-cpp | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| linux-x86_64-rust | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| linux-arm64-cpp | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| linux-arm64-rust | pass | pass 127 · fail 0 · unsupported 53 · not run 0 · not comparable 0 |
| imx95-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| imx95-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| kv260-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| kv260-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |

## Totals per target

| Target | Counts |
|---|---|
| wasm-cpp | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| wasm-rust | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| macos-arm64-cpp | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| macos-arm64-rust | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| linux-x86_64-cpp | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| linux-x86_64-rust | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| linux-arm64-cpp | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| linux-arm64-rust | pass 157 · fail 0 · unsupported 188 · not run 0 · not comparable 0 |
| imx95-cpp | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| imx95-rust | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| kv260-cpp | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| kv260-rust | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |

## Divergences

None.
