# ACVP cross-target evidence — run 2026-09-24 (WS-H phase 1)

This is a frozen evidence run for plan WS-H (H-1, H-2, H-4 to H-7). It executes one fixture
bundle on every baseline target that can be run today. Each run has an
ExecutionEnvironment record, and the runs are compared case by case.
`matrix.md` is the human-readable result and `matrix.json` is the machine-readable one.

> PQC Today executes selected public reference vectors, standards tests, conformance cases,
> and implementation probes. A passing result is evidence only for the identified test,
> operation, parameters, implementation build, and target. It is not an ACVTS verdict, a
> CAVP/CMVP certificate, or proof of exhaustive conformance.

## Inputs

| Fixture | Source | Bundle `manifest.json` SHA-256 |
|---|---|---|
| ML-KEM-encapDecap-FIPS203 (vsId 42, 165 cases) | NIST ACVP-Server @ 975de31e (public sample) | `d2ea5cd41c49bb156a0301ce033c09a12ccf61837a8edbecd1f9fcdbf8f702fd` |
| ML-DSA-sigVer-FIPS204 (vsId 42, 180 cases) | NIST ACVP-Server @ 975de31e (public sample) | `b56c38a23ade68d7d0809986fa2e56f33a8b6fdc5b30abac229ef0045dfea91f` |

Each fixture's `bundles/<fixture>/` directory holds three committed files:

- `manifest.json`: the manifest of the bundle every target consumed.
- `response.json`: the bundle's reference response. The manifest pins its SHA-256, and the
  comparator re-checks it against NIST `expectedResults.json`.
- `plan-index.json`: the plan's skeleton without payloads (tgId, tcId, execute or
  unsupported, operation, mechanism, reason).

The prompt itself is the committed fixture under
`src/services/acvp/__fixtures__/nist-acvp-server/`, and the manifest pins it. The full
`ir.json` and `plan.json` are regenerated deterministically. The comparator checks the
plan index against the live pipeline for as long as that pipeline still reproduces the
manifest's plan hash. Once dispatch grows, for example when WS-F adds externalMu groups,
the comparator only notes the change and keeps using the frozen index. The frozen run
therefore stays comparable.

## Targets

`targets.json` declares every plan §11 Q3 target:

- **run and publishable:** `wasm-cpp`, `wasm-rust`, `linux-arm64-cpp`, `linux-arm64-rust`
- **run, NOT publishable:** `linux-x86_64-cpp`, `linux-x86_64-rust`
  - The engine source commit is unknown, because the sandbox images were built from a
    working tree.
  - Both runs are emulated under Rosetta 2, and the records say so.
- **not run:**
  - `macos-arm64-*`: a macOS engine cannot be built without Xcode or host compilers.
  - `imx95-*`, `kv260-*`: these boards are phase 2.

### How each engine was obtained

| Target | Engine artifact (SHA-256) | Source | Where |
|---|---|---|---|
| wasm-cpp | `src/vendor/softhsm-wasm/wasm/softhsm.wasm` `2187f9a8…` | hsm `7795799b91c61097cb6cd28704c0ca1ab114a4c7` (`public/wasm/wasm-provenance.json`) | Node 22 on the macOS host (V8) |
| wasm-rust | `src/wasm/softhsmrustv3_bg.wasm` `a4582ff0…` | hsm `417c47a224a9859a4a02b90700ca0cdeb30cfebc` (provenance re-anchor, proven byte-identical) | Node 22 on the macOS host (V8) |
| linux-arm64-cpp | `libsofthsmv3.so` `ba5d00ac…` | hsm `7795799b…`, built for this run | `pqc-rust` container, native arm64 |
| linux-arm64-rust | `libsofthsmrustv3.so` `e3cf1bd4…` | hsm `417c47a2…`, built for this run | `pqc-rust` container, native arm64 |
| linux-x86_64-cpp | `/usr/local/lib/softhsm/libsofthsmv3.so` `c613dc02…` | **unknown** (image `pqc-dev-sandbox:latest` `sha256:cce738cd…`) | `pqc-dev-sandbox`, amd64 under Rosetta 2 |
| linux-x86_64-rust | `/usr/local/lib/hsm-perf-bench/libsofthsmrustv3.so` `631f8d74…` | **unknown** (image `pqc-sandbox-network:latest` `sha256:224ca807…`) | `pqc-network`, amd64 under Rosetta 2 |

Arm64 native builds were done inside the `pqc-rust` container, never with Xcode or host
compilers. Each came from a clean detached hsm worktree:

```bash
git -C pqctoday-hsm worktree add --detach ../pqctoday-hsm-acvp-h-7795799b 7795799b91c61097cb6cd28704c0ca1ab114a4c7
git -C pqctoday-hsm worktree add --detach ../pqctoday-hsm-acvp-h-417c47a2 417c47a224a9859a4a02b90700ca0cdeb30cfebc
# C++ needs the two stateful-hash gitlinks (liboqs is not needed with WITH_LIBOQS=OFF):
for p in src/lib/crypto/stateful/hash-sigs src/lib/crypto/stateful/xmss-reference; do
  sha=$(git -C ../pqctoday-hsm-acvp-h-7795799b ls-tree HEAD $p | awk '{print $3}')
  mkdir -p ../pqctoday-hsm-acvp-h-7795799b/$p
  git -C pqctoday-hsm/$p archive $sha | tar -x -C ../pqctoday-hsm-acvp-h-7795799b/$p
done
docker exec pqc-rust bash -c 'T=/tmp/acvp-h-<pid>;
  cmake -S /ag/pqctoday-hsm-acvp-h-7795799b -B $T/build-cpp -DCMAKE_BUILD_TYPE=Release \
    -DWITH_CRYPTO_BACKEND=openssl -DBUILD_TESTS=OFF -DENABLE_STATIC=OFF -DWITH_LIBOQS=OFF \
    -DOPENSSL_ROOT_DIR=/usr/local/ssl && cmake --build $T/build-cpp --target softhsmv3 -j10
  cd /ag/pqctoday-hsm-acvp-h-417c47a2/rust &&
    CARGO_TARGET_DIR=$T/target-rust cargo build --release --locked --offline -p softhsmrustv3 --lib'
```

Both builds were **bit-reproducible**. A second build into a separate build directory in
the same container gave identical SHA-256s: `ba5d00ac…` for C++ and `e3cf1bd4…` for Rust.
A replay can therefore regenerate the exact engines instead of trusting an archived binary.
The build directories and worktrees were removed after the runs, and no binary is
committed here. The facts the runner cannot observe are in
`targets/<target>/build-info.json`.

## Replay

Run everything from the hub root with Node 22.

1. **Check that the inputs are the frozen ones.** This regenerates both bundles and checks
   that each `manifest.json` is byte-identical to the committed one:

   ```bash
   npx tsx scripts/acvp-xplat-wasm.ts --run evidence/acvp-xplat/2026-09-24 --bundle-dir /tmp/acvp-bundles --verify-bundles-only
   ```

2. **Recompute the matrix from the frozen outputs**, with no engine needed. This is the demo
   fallback if live infrastructure fails. It exits 1 if `matrix.*` or `divergences/` would
   change:

   ```bash
   npx tsx scripts/acvp-xplat-compare.ts --run evidence/acvp-xplat/2026-09-24 --check
   ```

   CI runs the same check in `src/services/acvp-xplat/compare.test.ts`.

3. **Re-execute a target.** WASM:
   `npx tsx scripts/acvp-xplat-wasm.ts --run <new run dir> --bundle-dir /tmp/acvp-bundles`.
   Native: rebuild the engine as above and confirm its SHA-256 matches the table. Then run
   `tools/acvp-native/run-in-container.sh` with the arguments recorded in each
   `execution-environment.json`: target, image, host machine and acceleration. Finally,
   compare with step 2.

## Result

On every run target, all 112 executable cases pass, byte-equal to the reference: 30 ML-KEM
decapsulations and 82 ML-DSA verifications. The other 233 cases are `unsupported`, and the
plan declares them structurally with a reason each:

- ML-KEM encapsulation AFT and the key checks
- ML-DSA `internal` interface
- two HashML-DSA hashAlgs with no PKCS#11 mechanism

No case was `fail` or `not comparable`, so there are no divergences. Targets that were not
run show `not run` for all 345 cases.
