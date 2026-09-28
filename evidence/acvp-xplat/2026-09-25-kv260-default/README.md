# ACVP cross-target evidence — run 2026-09-25-kv260-default

This run executes the frozen fixture bundles of [run 2026-09-24b](../2026-09-24b/README.md) again
on the KV260. It uses the same image, the same boot and the same engine bytes as
[run 2026-09-25-boards](../2026-09-25-boards/README.md). That run recorded the KV260's
acceleration as `unknown`. This run records it as **`none`**, and gives the per-operation source
finding behind that. Nothing on the board was rebuilt, reflashed, reconfigured or rebooted.

This is **variant A**: the appliance-default environment, exactly as in run 2026-09-25-boards.
Its control is [run 2026-09-25-kv260-control-hw-disabled](../2026-09-25-kv260-control-hw-disabled/README.md)
(**variant B**, with `PQC_HW_DISABLE=1`). Only the KV260 targets were run here; every other target
is declared `not run`.

> PQC Today executes selected public reference vectors, standards tests, conformance cases,
> and implementation probes. A passing result is evidence only for the identified test,
> operation, parameters, implementation build, and target. It is not an ACVTS verdict, a
> CAVP/CMVP certificate, or proof of exhaustive conformance.

## Result

Both KV260 targets pass 157 of 157 executable cases, and both are **publishable**:

- 30 ML-KEM decapsulations
- 82 ML-DSA external-interface verifications
- 45 ML-DSA externalMu verifications (vendor mechanism `CKM_ML_DSA_EXTERNAL_MU`)

The other 188 cases are unsupported, each with a declared reason. No case failed and none was
`not comparable`.

Every `response.json` is byte-identical across all of these:

- both engines;
- variants A and B;
- run 2026-09-25-boards;
- the bundle's reference response;
- the WS-F goldens (`src/services/acvp/__fixtures__/goldens/`).

The SHA-256 values are ML-KEM `b967f579…` and ML-DSA `17426869…`.

## Why acceleration is `none`

The finding comes from reading the source at hsm `7f12c48d5e406c075076b5ea2eaf2d2de63c879b`, the
image's build-time commit. It was re-checked against that commit for this run.

**Rust engine** (`libsofthsmrustv3.so`, built with `--features hw-accel`):

- **ML-KEM decapsulation** runs in `rust/src/crypto/handlers.rs:1700-1713`. It goes to AWS-LC
  (`rust/src/crypto/awslc_pq.rs:585-587`) or to `ml-kem`.
- **ML-DSA verification** has two entry points:
  - pure and HashML-DSA: `handlers.rs:2824-2840`;
  - external-mu: `handlers.rs:1495-1517`.

  Both go to AWS-LC or to fips204 `verify_internal`. That function
  (`rust/fips204-patched/src/ml_dsa.rs:559-561`) uses the plain `expand_a`/`mat_vec_mul`, with no
  hook.
- **The engine installs only three fips204 hooks:**
  - the ML-DSA-65 sign hook (`rust/src/hw_accel.rs:177`);
  - the ML-DSA-65 matvec hook (`hw_accel.rs:344`), used only by keygen and sign
    (`ml_dsa.rs:134`, `ml_dsa.rs:360`);
  - a stage-timing hook used only for diagnostics (`hw_accel.rs:255`).

  The ExpandA hook is installed only by a `cfg(test)` test (`rust/fips204-patched/src/hashing.rs:43`).
- **The hashsig profile** loaded on this board (bitstream `619571de…`) hooks only SLH-DSA, LMS and
  XMSS (`hw_accel.rs:396-419`).
- **`C_Initialize`** runs the hashsig probe and its KAT (`hw_accel.rs:311-388`). That is not a
  tested operation. Variant B removes even this step.

**C++ engine** (`libsofthsmv3.so`): there is no FPGA or UIO code anywhere under `src/`. Its only
`mmap` is the behaviour ring (`src/lib/common/BehaviourRing.cpp:177`), which is inactive because
`PQC_BEHAVIOUR_RING` is unset. Every tested operation runs through OpenSSL 3.6.3 EVP on the
Cortex-A53 cores.

The board also shows what the code says. A separate process called only
`C_Initialize`/`C_Finalize` on the Rust engine, with `PQC_HW_DIAGNOSTICS=1`
(`observations/c-initialize-diagnostics.json`). It was not an evidence run. It reported:

- both ML-DSA probes failed with `FPGA UIO device not found`;
- the hashsig engine was selected, with `hooks: SLH_SIGN, SLH_KEYGEN`.

This is a source-level attestation for each operation plus one diagnostic observation. It is
**not** a hardware trace of each case. Plan decision D4 recorded `unknown` "until a per-operation
attestation proves the fabric path". This run relies on that source attestation.

## Effective OpenSSL configuration

The runner's own process recorded this. A wrapper read the facts, then called `execv()` into
`acvp_native_runner.py` with the same pid and environment. The facts are in
`observations/runner-process-openssl.json`, and they were identical for all four runs and for a
probe taken before the runs:

- `OPENSSL_CONF` is **unset**. libcrypto therefore uses its compiled-in default,
  `CONF_get1_default_config_file()` = `/usr/lib/ssl-3/openssl.cnf`.
- `openssl version -d` gives `OPENSSLDIR: "/usr/lib/ssl-3"`.
- That file is a symlink to `/etc/ssl/openssl.cnf`, SHA-256 `4af7b005…`.
- Its `[provider_sect]` names only `default`, with `activate` commented out, so the default
  provider loads implicitly.
- Its `.include /etc/ssl/openssl.cnf.d` points to an empty directory.
- No engine is configured, and `OPENSSL_MODULES` is unset.
- The Rust engine maps no libcrypto, so this configuration does not reach it.

## Board, identity and read-only procedure

The board was reached at 192.168.4.53 (en0, lab /22), with MAC `00:0a:35:2b:9d:f4` (KV260, Xilinx
OUI). It was on the same boot as run 2026-09-25-boards: up since 13:30 UTC, and that run was
recorded at 15:34 UTC.

Before the runs, the board was checked for activity from other sessions (`loginctl`, `ps`). Only
the appliance's own services and its periodic `pqc-health.py` timers were running. There was no
other login session.

Identity was re-verified on the board:

- `libsofthsmv3.so`: `d4eb794a…`
- `libsofthsmrustv3.so`: `3b75af8a…`

Both are equal to run 2026-09-25-boards, which tied them to the image's `.wic`. The board also
showed `root=PARTUUID=beb82b10…`, card serial `0x231`, FPGA `operating`, and profile `hashsig`
`619571de…`.

The image, build and source-commit facts are unchanged from run 2026-09-25-boards. Its README
explains where each one came from.

The procedure was the same as in run 2026-09-25-boards:

- a private `mktemp -d /tmp/acvp-h-XXXXXX`;
- a private `SOFTHSM2_CONF`;
- `SOFTHSMRUST_STATE_FILE`, `PQC_BEHAVIOUR_RING`, `PQC_BEHAVIOUR_SRC`, `PQC_AUTH_LOG` and
  `SOFTHSM3_OP_LOG` unset;
- `PQC_AWSLC_PQ_DISABLE` not set.

Afterwards the directory was removed and `/tmp` was checked clean. The runner is v2.1.0, where
run 2026-09-25-boards used v2.0.0. The runner's `execution-environment` records differ from that
run only in `runner.version`, `acceleration` and `notes`.

```bash
env -u SOFTHSMRUST_STATE_FILE -u PQC_BEHAVIOUR_RING -u PQC_BEHAVIOUR_SRC -u PQC_AUTH_LOG -u SOFTHSM3_OP_LOG \
  python3 $T/wrap.py $T/facts/<run>.json $T/runner/acvp_native_runner.py --bundle $T/bundles/<fixture> \
  --module /usr/lib/softhsm/libsofthsm{v3,rustv3}.so --engine-id cpp|rust --out $T/out/A/<target>/<fixture> \
  --target-id <target> --target-label "<label>" --target-class board --board "<board>" \
  --image-name "<image>" --image-id "wic.zst sha256:7cdec7d5…" --host-machine "bare metal (no hypervisor or container)" \
  --build-info $T/bi/A-<engine>.json --acceleration none --acceleration-detail "<finding above>" \
  --work-dir $T/work-A-<engine>-<fixture>
```

## Replay

```bash
npx tsx scripts/acvp-xplat-wasm.ts --run evidence/acvp-xplat/2026-09-25-kv260-default --bundle-dir /tmp/acvp-bundles --verify-bundles-only
npx tsx scripts/acvp-xplat-compare.ts --run evidence/acvp-xplat/2026-09-25-kv260-default --check
```
