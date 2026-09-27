# ACVP cross-target evidence — run 2026-09-25-boards

This run executes the frozen fixture bundles of [run 2026-09-24b](../2026-09-24b/README.md)
on the two lab boards, each on its **current** image, as plan decision D4 requires
(`pqctoday-priv/nextfeature/acvp-gap-closure-plan-09252026.md` §2 and §3 P4). Nothing on the
boards was rebuilt, reflashed, reconfigured or rebooted. Only the board targets were run. The
other targets are declared `not run` here, and their results are in run 2026-09-24b.

> PQC Today executes selected public reference vectors, standards tests, conformance cases,
> and implementation probes. A passing result is evidence only for the identified test,
> operation, parameters, implementation build, and target. It is not an ACVTS verdict, a
> CAVP/CMVP certificate, or proof of exhaustive conformance.

## Result

All four board targets pass 157 of 157 executable cases byte-equal to the reference
response and to NIST `expectedResults.json`:

- 30 ML-KEM decapsulations
- 82 ML-DSA external-interface verifications
- 45 ML-DSA externalMu verifications through the vendor mechanism `CKM_ML_DSA_EXTERNAL_MU`

The other 188 cases are unsupported, each with a declared reason. None failed and none was
`not comparable`, so there are no divergences.

| Target | Publishable | Why |
|---|---|---|
| `imx95-cpp`, `imx95-rust` | yes | every identity requirement met |
| `kv260-cpp`, `kv260-rust` | **no** | `acceleration.state` is `unknown` (decision D4), pending a per-operation fabric attestation |

## Bundles

The bundles are the same as in run 2026-09-24b. They were regenerated with
`--verify-bundles-only` against 2026-09-24b, and the regenerated manifests were byte-identical:

- ML-DSA: `966ec2fa…`
- ML-KEM: `d2ea5cd4…`

`bundles/` holds copies of 2026-09-24b's `manifest.json`, `plan-index.json` and `response.json`.

## Boards and engines

Each board has two engines, and both are the image's own `/usr/lib/softhsm/*.so`, run as found.
The source commits differ from the WASM bundles (C++ `7795799b`, Rust `417c47a2`). Every case
still compared byte-equal under comparator policy v2.

| | i.MX95 | KV260 |
|---|---|---|
| Reached at | 192.168.4.30 (en0, lab /22), MAC `00:04:9f:0b:4f:48` | 192.168.4.53 (en0, lab /22), MAC `00:0a:35:2b:9d:f4` |
| Board | FRDM-IMX95; i.MX95 SoC rev 2.0; 6× Cortex-A55 | KV260, DT model "ZynqMP KV260 revB"; K26 SOM; 4× Cortex-A53 |
| Image build | `20260920213212`, cacp `c047274a…-dirty` | `20260925131032`, cacp `520d7861` |
| Boot card | SD serial `0x232` | SD serial `0x231`, root PARTUUID `beb82b10…` |
| hsm commit | `44e72072` | `7f12c48d` |
| C++ `.so` SHA-256 | `7829da1a…` | `d4eb794a…` |
| Rust `.so` SHA-256 | `7d57ad56…` | `3b75af8a…` |
| Toolchain | GCC 15.2.0, rustc 1.94.1 | GCC 13.4.0, rustc 1.96.1 |
| Python, OpenSSL | 3.14.4, 3.6.3 | 3.12.12, 3.6.3 |
| FPGA | — | profile `hashsig`, bitstream `619571de…` (state `operating`) |

Rust crypto backends differ between the two boards:

- **i.MX95:** pure-Rust `ml-kem`/`fips204`.
- **KV260:** `awslc-pq` is on by default at `7f12c48d`, so ML-KEM decapsulation and pure/µ
  ML-DSA verification go through AWS-LC. HashML-DSA stays on `fips204`.

### Where each identity fact came from

Neither board carries a build-identity file:

- `/etc/version` and `/etc/timestamp` hold the reproducible-build constant `20180309123456`.
- `/etc/pqc/build-epoch` holds `SOURCE_DATE_EPOCH`.

So the build identity comes from the cacp export bundles in `pqctoday-cacp/out/{imx95,k26}/<build>/`.
Each board is tied to its bundle in three independent ways:

1. **Which image is running.**
   - i.MX95: the card serial matches the cacp release note
     `docs/releases/2026-09-20-mx95-network-separation.md`, which records card `0x232` as
     build `20260920213212`. The rootfs partition size (2057482 KiB) also equals the `.wic`'s.
   - KV260: the kernel `root=PARTUUID` equals the `.wic`'s rootfs partition UUID.
2. **Which engine bytes.** Each on-board SHA-256 was computed on the board. It equals the same
   file extracted read-only (`debugfs`) from the bundle's `.wic` rootfs.
3. **Which source commit.** The commit comes from build-time records, not from the export stamp:
   - the SBOM `downloadLocation` `pqctoday-hsm.git@<sha>`;
   - the image package manifest (`softhsmv3 3.0.0+git0+<sha>`);
   - the recipe pin `PQCTODAY_HSM_SRCREV` at the image's cacp revision.

   Both commits are ancestors of `pqctoday-hsm` `origin/main`.

Board, SoM, kernel, OS, Python, OpenSSL and FPGA state were read on the board. Compiler versions
come from the image's `testdata.json` and manifest, because the installed `.so` files are
stripped and have no ELF `.comment`. `builtAt` is null because the engine file times are clamped
to `SOURCE_DATE_EPOCH`. Details are in each `targets/<target>/build-info.json`.

**i.MX95 caveat.** The i.MX95 image was built from a **dirty** cacp tree (`c047274a…-dirty`).
The hsm source commit is still fixed by the SBOM and the package version. The recipe-level
settings are those of `c047274a` only if the uncommitted changes did not touch the engine
recipes, and that cannot be proven after the fact.

## How it was run (read-only)

The engine-side environment variables for persistence and the behaviour ring/log were **unset**:

- `SOFTHSMRUST_STATE_FILE`
- `PQC_BEHAVIOUR_RING`
- `PQC_BEHAVIOUR_SRC`
- `PQC_AUTH_LOG`
- `SOFTHSM3_OP_LOG`

With those unset, and with a private `SOFTHSM2_CONF`, neither engine touched the appliance's
token store or monitoring ring. On each board, over SSH as `admin` without sudo:

```bash
T=$(mktemp -d /tmp/acvp-h-XXXXXX)   # runner + bundles + build-info.json copied in with scp
env -u SOFTHSMRUST_STATE_FILE -u PQC_BEHAVIOUR_RING -u PQC_BEHAVIOUR_SRC -u PQC_AUTH_LOG -u SOFTHSM3_OP_LOG \
  python3 $T/runner/acvp_native_runner.py --bundle $T/bundles/<fixture> \
  --module /usr/lib/softhsm/libsofthsm{v3,rustv3}.so --engine-id cpp|rust --out $T/out/<target>/<fixture> \
  --target-id <target> --target-label "<label>" --target-class board --board "<board>" \
  --image-name "<image>" --image-id "wic.zst sha256:<wic>" --host-machine "bare metal (no hypervisor or container)" \
  --build-info $T/bi-<engine>/build-info.json --acceleration none|unknown --acceleration-detail "<detail>" \
  --work-dir $T/work-<target>-<fixture>
# outputs copied back with scp; rm -rf $T; /tmp checked clean afterwards
```

Before the runs, both boards were checked for activity from other sessions (`loginctl`, `ps`).
Only the appliance's own services were running. There was no benchmark, FPGA or other user job.

## Replay

```bash
npx tsx scripts/acvp-xplat-wasm.ts --run evidence/acvp-xplat/2026-09-25-boards --bundle-dir /tmp/acvp-bundles --verify-bundles-only
npx tsx scripts/acvp-xplat-compare.ts --run evidence/acvp-xplat/2026-09-25-boards --check
```
