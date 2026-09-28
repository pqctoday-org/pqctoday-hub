# ACVP cross-target evidence — run 2026-09-25-native

This run adds two sets of native targets to [run 2026-09-24b](../2026-09-24b/README.md):

- **Linux x86-64**, built for this run. In run 2026-09-24b these targets were not
  publishable, because the engine source commits were unknown.
- **Native macOS arm64**. Run 2026-09-24b did not run these targets.

The fixture bundle, plan, evidence format (`pqctoday.acvp-evidence/2`) and comparator
policy (`pqctoday.acvp-comparator-policy/2`) are the same as in run 2026-09-24b. Both
bundle manifests are byte-identical: `d2ea5cd4…` (ML-KEM) and `966ec2fa…` (ML-DSA).

A run directory must hold every target it compares. The WASM and Linux Arm64 targets were
therefore run again here, on the same engines as run 2026-09-24b. Runs 2026-09-24 and
2026-09-24b stay frozen.

> PQC Today executes selected public reference vectors, standards tests, conformance cases,
> and implementation probes. A passing result is evidence only for the identified test,
> operation, parameters, implementation build, and target. It is not an ACVTS verdict, a
> CAVP/CMVP certificate, or proof of exhaustive conformance.

## Engines

Every engine was built at the hsm commit its Hub WASM bundle uses
(`public/wasm/wasm-provenance.json`). This keeps the rows comparable:

- C++: `7795799b91c61097cb6cd28704c0ca1ab114a4c7`
- Rust: `417c47a224a9859a4a02b90700ca0cdeb30cfebc`

| Target | Engine artifact (SHA-256) | Built with | Where it ran |
|---|---|---|---|
| wasm-cpp | `softhsm.wasm` `2187f9a8…` | emcc 6.0.4 (as in run 2026-09-24b) | Node 22 on the macOS host (V8) |
| wasm-rust | `softhsmrustv3_bg.wasm` `a4582ff0…` | rustc 1.96.0, wasm-pack (as in run 2026-09-24b) | Node 22 on the macOS host (V8) |
| macos-arm64-cpp | `libsofthsmv3.dylib` `3fb20289…` | Apple clang 21.0.0, Xcode 27.0, macOS SDK 27.0, Homebrew OpenSSL 3.6.3 | macOS 26.6.2 host, **native** |
| macos-arm64-rust | `libsofthsmrustv3.dylib` `0eef6de3…` | rustc 1.96.0 (host rustup toolchain) + Apple clang for C build dependencies | macOS 26.6.2 host, **native** |
| linux-x86_64-cpp | `libsofthsmv3.so` `fad6b2ae…` | GCC 13.3.0, CMake 3.28.3, OpenSSL 3.6.3 (`/usr/local/ssl`) | throwaway amd64 container, **emulated** (Rosetta 2) |
| linux-x86_64-rust | `libsofthsmrustv3.so` `4dba14a6…` | rustc 1.96.0 | throwaway amd64 container, **emulated** (Rosetta 2) |
| linux-arm64-cpp | `libsofthsmv3.so` `ba5d00ac…` | GCC 14.2.0 (run 2026-09-24 build) | `pqc-rust` container, native |
| linux-arm64-rust | `libsofthsmrustv3.so` `e3cf1bd4…` | rustc 1.96.0 (run 2026-09-24 build) | `pqc-rust` container, native |

Every native build is **bit-reproducible**. A second build gave the same SHA-256 each time:

- x86-64: the second build ran in a second fresh throwaway container, in a different build
  directory.
- macOS C++: the second build used a separate build directory.
- macOS Rust: the Mach-O install name embeds the absolute `CARGO_TARGET_DIR`. The target
  directory was therefore deleted and rebuilt from scratch at the same path.

No binary is committed here. Each `targets/<target>/build-info.json` records the facts the
runner cannot observe: commit proof, compiler, flags, features, crypto backend and entropy
source.

### Linux x86-64 (emulated)

The build used two new throwaway containers, started from the existing
`pqc-dev-sandbox:latest` image (`sha256:cce738cd…`) for its toolchain. The image
provides GCC 13.3.0, CMake 3.28.3 and OpenSSL 3.6.3 in `/usr/local/ssl`. Inside the build
container, `rustup` added Rust 1.96.0 so the Rust build matches the other targets. The shared
`pqc-dev-sandbox` container and image were not touched, and both throwaway containers were
removed afterwards. The records mark these runs `emulated: true`, with Rosetta 2 as the
mechanism.

```bash
git -C pqctoday-hsm worktree add --detach ../pqctoday-hsm-x86-7795799b 7795799b91c61097cb6cd28704c0ca1ab114a4c7
git -C pqctoday-hsm worktree add --detach ../pqctoday-hsm-x86-417c47a2 417c47a224a9859a4a02b90700ca0cdeb30cfebc
git -C ../pqctoday-hsm-x86-7795799b submodule update --init \
  src/lib/crypto/stateful/hash-sigs src/lib/crypto/stateful/xmss-reference   # liboqs not needed
docker run -d --platform linux/amd64 --name <unique> --entrypoint sleep \
  -v "$PWD/../pqctoday-hsm-x86-7795799b:/src/hsm-cpp" -v "$PWD/../pqctoday-hsm-x86-417c47a2:/src/hsm-rust" \
  pqc-dev-sandbox:latest infinity
docker exec <unique> bash -c '
  cmake -S /src/hsm-cpp -B /build/cpp1 -DCMAKE_BUILD_TYPE=Release -DWITH_CRYPTO_BACKEND=openssl \
    -DBUILD_TESTS=OFF -DENABLE_STATIC=OFF -DWITH_LIBOQS=OFF -DOPENSSL_ROOT_DIR=/usr/local/ssl &&
  cmake --build /build/cpp1 --target softhsmv3 -j16
  export PATH=/root/.cargo/bin:$PATH; rustup toolchain install 1.96.0 --profile minimal
  cd /src/hsm-rust/rust && CARGO_TARGET_DIR=/build/rust1 cargo +1.96.0 build --release --locked -p softhsmrustv3 --lib'
tools/acvp-native/run-in-container.sh --container <unique> --module /build/cpp1/src/lib/libsofthsmv3.so \
  --engine cpp --target linux-x86_64-cpp --label "Native Linux x86-64 (emulated) — C++ engine" \
  --run evidence/acvp-xplat/2026-09-25-native --bundles <bundle dir> \
  --image-name pqc-dev-sandbox:latest --image-id sha256:cce738cdaddf38eb15661a5f9d9b91ea7c95f3d7ade7a777273fdbc25eea125f \
  --host-machine "arm64 (Apple M5 Max, macOS 26.6.2, OrbStack; amd64 via Rosetta 2)" --acceleration none \
  --acceleration-detail "no hardware accelerator (no FPGA/NPU/crypto offload); CPU ISA extensions only, as translated by Rosetta 2"
# The Rust target uses the same arguments with /build/rust1/release/libsofthsmrustv3.so, --engine rust and --target linux-x86_64-rust.
```

### Native macOS arm64

Plan §P4 allows the host toolchain here, and only for this row. A native macOS engine
cannot be produced any other way. Each engine was built from its own detached worktree
(`pqctoday-hsm-mac-<sha8>`), with a reset environment that keeps `~/.cargo/bin` off `PATH`:

```bash
env -i HOME=$HOME PATH=/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin \
  cmake -S ../pqctoday-hsm-mac-7795799b -B <scratch>/cpp1 -DCMAKE_BUILD_TYPE=Release -DWITH_CRYPTO_BACKEND=openssl \
    -DBUILD_TESTS=OFF -DENABLE_STATIC=OFF -DWITH_LIBOQS=OFF -DOPENSSL_ROOT_DIR=/opt/homebrew/opt/openssl@3
env -i HOME=$HOME PATH=/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin cmake --build <scratch>/cpp1 --target softhsmv3
TC=$HOME/.rustup/toolchains/1.96.0-aarch64-apple-darwin
(cd ../pqctoday-hsm-mac-417c47a2/rust && env -i HOME=$HOME PATH=$TC/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin \
  RUSTC=$TC/bin/rustc CARGO_TARGET_DIR=<scratch>/rust1 $TC/bin/cargo build --release --locked -p softhsmrustv3 --lib)
env -i HOME=$HOME PATH=/usr/bin:/bin /opt/homebrew/bin/python3 tools/acvp-native/acvp_native_runner.py \
  --bundle <bundle dir>/cpp/<fixture> --module <scratch>/cpp1/src/lib/libsofthsmv3.dylib --engine-id cpp \
  --out evidence/acvp-xplat/2026-09-25-native/targets/macos-arm64-cpp/<fixture> \
  --target-id macos-arm64-cpp --target-label "Native macOS arm64 — C++ engine" \
  --build-info evidence/acvp-xplat/2026-09-25-native/targets/macos-arm64-cpp/build-info.json \
  --host-machine "arm64 (Apple M5 Max, macOS 26.6.2, bare metal — no VM, no container)" --acceleration none \
  --acceleration-detail "no hardware accelerator (no FPGA/NPU/crypto offload); CPU ISA extensions only" --work-dir <scratch>/work
```

Runner 2.1.0 reads macOS identity from macOS itself: the dyld image list, `sysctl` and
`sysctl.proc_translated`. The Python interpreter already has the system LibreSSL
(`/usr/lib/libcrypto.46.dylib`) loaded before the engine. The C++ record reports the
OpenSSL that loading the engine newly mapped: Homebrew OpenSSL 3.6.3. It also names the
LibreSSL that was already loaded. Homebrew's current stable release is 3.6.4. It was not
installed for this run.

### WASM and Linux Arm64

```bash
npx tsx scripts/acvp-xplat-wasm.ts --run evidence/acvp-xplat/2026-09-25-native --bundle-dir <bundle dir>
```

This command writes the WASM targets and the bundle files. The Linux Arm64 engines are the
kept run 2026-09-24 builds, with the same SHA-256. They were re-staged with
`run-in-container.sh --container pqc-rust --module-from-host …`, using the arguments recorded
in their records.

## Replay

Run from the hub root with Node 22:

```bash
npx tsx scripts/acvp-xplat-wasm.ts --run evidence/acvp-xplat/2026-09-25-native --bundle-dir /tmp/acvp-bundles --verify-bundles-only
npx tsx scripts/acvp-xplat-compare.ts --run evidence/acvp-xplat/2026-09-25-native --check
```

To re-execute a native target:

1. Rebuild its engine as above.
2. Confirm the SHA-256 matches the table.
3. Run it with the arguments recorded in its `execution-environment.json`.

## Result

All eight run targets are **publishable**. Each one passes 157 of 157 executable cases,
byte-equal to the reference:

- 30 ML-KEM decapsulations
- 82 ML-DSA external-interface verifications
- 45 ML-DSA externalMu verifications through the vendor-defined `CKM_ML_DSA_EXTERNAL_MU`

The other 188 cases are unsupported, and each has a declared reason. No case failed and
none was `not comparable`, so there are no divergences. The x86-64 rows are emulated under
Rosetta 2 on Apple silicon, not run on native x86 hardware, and their records say so. The
i.MX95 and KV260 boards are `not run` (phase 2).
