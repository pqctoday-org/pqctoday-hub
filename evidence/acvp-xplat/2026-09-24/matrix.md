# ACVP cross-target matrix — 2026-09-24

Statuses are never collapsed: pass / fail / unsupported / not run / not comparable are counted separately. A pass is evidence only for the identified test, operation, parameters, implementation build and target — not an ACVTS verdict, a CAVP/CMVP certificate, or proof of exhaustive conformance.

Reference: WS-F golden responses (src/services/acvp/__fixtures__/goldens/*.response.json): identical from both WASM engines and equal to NIST ACVP-Server expectedResults.json for every answered case.

## Targets

| Target | Run | Publishable | Arch | Emulated | OpenSSL | Engine commit | Artifact SHA-256 |
|---|---|---|---|---|---|---|---|
| wasm-cpp | run | yes | wasm32 | no | OpenSSL 3.6.3 (static libcrypto.a for wasm32) | 7795799b91c6 | 2187f9a80878b34c… |
| wasm-rust | run | yes | wasm32 | no | not linked | 417c47a224a9 | a4582ff0102e0d14… |
| macos-arm64-cpp | not run — No native macOS engine without Xcode/host compilers: the only macOS dylibs on this machine (pqctoday-hsm/build_union, build_audit_0812) were host-built from dirty working trees with no provable commit, and building one would need Xcode/host cc, which the hsm build policy forbids. | — | — | — | — | — | — |
| macos-arm64-rust | not run — No native macOS engine without Xcode/host cargo: the only macOS libsofthsmrustv3.dylib files (pqctoday-hsm/rust/target, kmip/target, openmls-provider/target) were host-built from dirty working trees with no provable commit, and building one would need host cargo, which the hsm build policy forbids. | — | — | — | — | — | — |
| linux-x86_64-cpp | run — Emulated (Rosetta 2) inside pqc-dev-sandbox, on the image's existing libsofthsmv3.so, whose source commit is unknown (image built from a working tree). | no (engine.sourceCommit) | x86_64 | yes | OpenSSL 3.6.3 9 Jun 2026 | — | c613dc02507fd26d… |
| linux-x86_64-rust | run — Emulated (Rosetta 2) inside pqc-network, on the image's existing libsofthsmrustv3.so, whose source commit is unknown (image built from a working tree). | no (engine.sourceCommit, dependencies.cryptoBackend) | x86_64 | yes | not linked | — | 631f8d742227fe9a… |
| linux-arm64-cpp | run — Native arm64 in pqc-rust, engine built for this run from a clean detached hsm worktree at 7795799b (the C++ WASM bundle's commit). | yes | aarch64 | no | OpenSSL 3.6.3 9 Jun 2026 | 7795799b91c6 | ba5d00acf9a44a39… |
| linux-arm64-rust | run — Native arm64 in pqc-rust, engine built for this run from a clean detached hsm worktree at 417c47a2 (the Rust WASM bundle's commit). | yes | aarch64 | no | not linked | 417c47a224a9 | e3cf1bd4dfd21d42… |
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
| macos-arm64-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| macos-arm64-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| linux-x86_64-cpp | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| linux-x86_64-rust | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| linux-arm64-cpp | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| linux-arm64-rust | pass | pass 30 · fail 0 · unsupported 135 · not run 0 · not comparable 0 |
| imx95-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| imx95-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| kv260-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |
| kv260-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 165 · not comparable 0 |

## ML-DSA-sigVer-FIPS204 (vsId 42, 180 test cases)

Bundle manifest SHA-256: `b56c38a23ade68d7d0809986fa2e56f33a8b6fdc5b30abac229ef0045dfea91f`

| Target | Headline | Counts |
|---|---|---|
| wasm-cpp | pass | pass 82 · fail 0 · unsupported 98 · not run 0 · not comparable 0 |
| wasm-rust | pass | pass 82 · fail 0 · unsupported 98 · not run 0 · not comparable 0 |
| macos-arm64-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| macos-arm64-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| linux-x86_64-cpp | pass | pass 82 · fail 0 · unsupported 98 · not run 0 · not comparable 0 |
| linux-x86_64-rust | pass | pass 82 · fail 0 · unsupported 98 · not run 0 · not comparable 0 |
| linux-arm64-cpp | pass | pass 82 · fail 0 · unsupported 98 · not run 0 · not comparable 0 |
| linux-arm64-rust | pass | pass 82 · fail 0 · unsupported 98 · not run 0 · not comparable 0 |
| imx95-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| imx95-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| kv260-cpp | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |
| kv260-rust | not run | pass 0 · fail 0 · unsupported 0 · not run 180 · not comparable 0 |

## Totals per target

| Target | Counts |
|---|---|
| wasm-cpp | pass 112 · fail 0 · unsupported 233 · not run 0 · not comparable 0 |
| wasm-rust | pass 112 · fail 0 · unsupported 233 · not run 0 · not comparable 0 |
| macos-arm64-cpp | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| macos-arm64-rust | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| linux-x86_64-cpp | pass 112 · fail 0 · unsupported 233 · not run 0 · not comparable 0 |
| linux-x86_64-rust | pass 112 · fail 0 · unsupported 233 · not run 0 · not comparable 0 |
| linux-arm64-cpp | pass 112 · fail 0 · unsupported 233 · not run 0 · not comparable 0 |
| linux-arm64-rust | pass 112 · fail 0 · unsupported 233 · not run 0 · not comparable 0 |
| imx95-cpp | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| imx95-rust | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| kv260-cpp | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |
| kv260-rust | pass 0 · fail 0 · unsupported 0 · not run 345 · not comparable 0 |

## Divergences

None.
