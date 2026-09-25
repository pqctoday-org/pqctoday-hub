# acvp-native — native ACVP-format runner (WS-H)

A Python runner that uses only the standard library and `ctypes`. It executes the hub's
ACVP-format fixture bundle against a native PKCS#11 v3.2 shared library: the
softhsmv3 C++ `libsofthsmv3.so` or the Rust `libsofthsmrustv3.so`. It writes the same
`response.json` as the hub's Node CLI (`scripts/acvp-respond.ts`), plus an
`evidence.json` sidecar and an `execution-environment.json` record (plan WS-H H-1).

> PQC Today executes selected public reference vectors, standards tests, conformance cases,
> and implementation probes. A passing result is evidence only for the identified test,
> operation, parameters, implementation build, and target. It is not an ACVTS verdict, a
> CAVP/CMVP certificate, or proof of exhaustive conformance.
>
> Import and response generation do not submit results to NIST and do not establish
> validation. The laboratory or authorized submitter remains responsible for the ACVTS
> session and submission.

## What it does and does not do

- **Consumes, never re-derives.** The runner executes the bundle's `plan.json`. The hub's
  TypeScript pipeline produces that plan by applying rules P1–P6 (prompt → IR) and D1–D7
  (IR → plan). Before it runs anything, the runner checks the SHA-256 of every file listed in
  `manifest.json`. It also checks the canonical-JSON SHA-256 of `ir.json` and `plan.json`.
  If any check fails, it exits with code 3.
- **Same PKCS#11 calls as the TypeScript engine adapter** (`src/services/acvp/engine.ts`):
  - For decapsulation: `C_CreateObject` → `C_DecapsulateKey` → `C_GetAttributeValue(CKA_VALUE)`.
  - For verification: `C_CreateObject` → `C_MessageVerifyInit(CK_SIGN_ADDITIONAL_CONTEXT)` →
    `C_VerifyMessage` → `C_MessageVerifyFinal`. This covers pure ML-DSA and HashML-DSA pre-hash.
  - For ML-DSA externalMu, which uses the **vendor-defined** `CKM_ML_DSA_EXTERNAL_MU`
    (`0x0000403c`) and is not PKCS#11 v3.2: `C_VerifyInit` → `C_Verify(mu, sig)`.
  - The runner does not seed an RNG and has no test hooks. It passes `pReserved = NULL`.
- **Output formats are versioned.** The runner writes `evidence.json` as
  `pqctoday.acvp-evidence/2` with `codePath: "native"`. Every evidence version, environment
  version and comparator-policy version stays pinned. A frozen run is always validated
  against the versions it declares, never against whatever is current.
- **Constants are generated, not copied.** `pkcs11_constants.py` and `hub_contract.json`
  (disclaimers, pinned schema metadata, known public fixtures) are generated from the hub's
  TypeScript tables. Run `npm run gen:acvp-native-constants` to regenerate them. Run the
  `:check` variant to detect drift; the local gate does this.
- **No PyKCS11** (by policy) and no third-party Python modules. Python 3.8 or later.
- **Import order is deliberate.** `hashlib` is imported only after the engine is loaded.
  Python's own `libcrypto.so.3` would otherwise satisfy the engine's `libcrypto.so.3` by
  soname. The C++ engine would then run on the interpreter's OpenSSL instead of the one it
  was linked against. The environment record reports the OpenSSL that was actually mapped
  (`/proc/self/maps` + `OpenSSL_version()`).
- **macOS runs on the host.** On macOS the runner reads the same facts from macOS itself.
  Libraries come from dyld's image list instead of `/proc/self/maps`. The CPU model,
  feature flags and Rosetta status come from `sysctl` (`machdep.cpu.brand_string`,
  `hw.optional`, `sysctl.proc_translated`). A framework build of Python loads the system
  LibreSSL (`/usr/lib/libcrypto.*.dylib`) when it starts. Mach-O two-level namespace binds
  the engine only to the libraries its load commands name. So on macOS the record reports
  the libcrypto that loading the engine newly mapped, and names the one that was already
  loaded.

## Run it

1. **Emit the bundle** on the host, with the hub's Node CLI. The WASM baseline script does
   this for every fixture:

   ```bash
   npx tsx scripts/acvp-xplat-wasm.ts --run evidence/acvp-xplat/<runId> --bundle-dir /tmp/acvp-bundles
   ```

2. **Run the bundle** inside an existing container or on a board, against an engine `.so`
   that is already there:

   ```bash
   tools/acvp-native/run-in-container.sh --container pqc-rust \
     --module /tmp/acvp-h-XXXX/build-cpp/src/lib/libsofthsmv3.so --engine cpp \
     --target linux-arm64-cpp --label "Native Linux Arm64 — C++ engine" \
     --run evidence/acvp-xplat/<runId> --bundles /tmp/acvp-bundles \
     --image-name rust:1 --image-id sha256:… --host-machine "arm64 (…)" \
     --acceleration none --acceleration-detail "no hardware accelerator"
   ```

   To use an engine kept on the host instead, for example one built earlier and verified
   by SHA-256, pass `--module-from-host <path>` in place of `--module`.

   The script stages the runner and the bundle in a private `/tmp/acvp-h-<pid>` directory
   inside the container. It copies `response.json`, `evidence.json` and
   `execution-environment.json` back to `<run>/targets/<target>/<fixture>/`, then removes
   the staging directory. If `<run>/targets/<target>/build-info.json` exists, the script
   passes it to the runner. That file holds the facts the runner cannot observe: engine
   source commit and how it was proven, compiler, flags, features, crypto backend and
   entropy source.

   On the macOS host, run `acvp_native_runner.py` directly with Homebrew Python. Use
   `/opt/homebrew/bin/python3`, never `/usr/bin/python3`. The arguments are the ones
   `run-in-container.sh` passes, plus `--build-info` and `--work-dir`. The steps used for run
   `2026-09-25-native` are in that run's README.

   On a board (plan phase 2), copy `acvp_native_runner.py`, `pkcs11_constants.py`,
   `hub_contract.json`, the bundle directory and `build-info.json` to the board, then run:

   ```bash
   python3 acvp_native_runner.py --bundle <bundle> --module <engine.so> --engine-id cpp|rust \
     --out <dir> --target-id imx95-cpp --target-label "…" --target-class board \
     --board "<board/SoM + revision>" --build-info build-info.json \
     --acceleration none|enabled --acceleration-detail "<bitstream/driver identity>"
   ```

3. **Compare** on the host:

   ```bash
   npx tsx scripts/acvp-xplat-compare.ts --run evidence/acvp-xplat/<runId>
   ```

## Engine builds (hsm policy)

Linux engines are **never** built with Xcode, host `cc` or host `cargo`. Build them only in
a container, from a **detached hsm worktree at an exact commit**:

- Arm64: the `pqc-rust` container.
- x86-64: a new throwaway `--platform linux/amd64` container that you remove afterwards.

Use a private build directory, never the shared `/cargo-target`. Remove the worktree
afterwards with `git worktree remove`, without `--force`.

The one exception is the **macOS arm64** target (acvp-gap-closure plan §P4). A native macOS
engine can only come from the host toolchain, so it is built on the host from its own
detached worktree:

- Xcode clang and Homebrew OpenSSL for C++.
- A rustup toolchain called by absolute path for Rust, with `~/.cargo/bin` kept off `PATH`.

The steps are in the READMEs of runs `2026-09-24` (Arm64) and `2026-09-25-native` (x86-64
and macOS).

An artifact whose source commit cannot be proven can still be run. An image built from a
working tree is one example. The runner records such a run with `engine.sourceCommit = null`,
and the ExecutionEnvironment validator marks it **non-publishable**.

## Tests

- `src/services/acvp-xplat/nativeRunner.local.test.ts` is local-only and needs Docker. It
  checks that the runner reproduces the goldens byte for byte and writes schema-valid
  evidence and environment records. It also checks that the runner refuses a tampered
  bundle. Run it with
  `npx vitest run --config vitest.local.config.ts src/services/acvp-xplat/nativeRunner.local.test.ts`.
  Set `ACVP_NATIVE_CONTAINER`, `ACVP_NATIVE_MODULE` and `ACVP_NATIVE_ENGINE` to use a
  different engine.
- `src/services/acvp-xplat/compare.test.ts` and
  `src/data/validation/executionEnvironment.test.ts` run in CI.
