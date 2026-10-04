# KV260 FHE service installed in the board image, Mac software token as custodian (2026-10-04, 16:46–16:53 UTC)

**Label:** custodian: educational software token on a Mac (not hardware custody); untrusted compute: the KV260 running the service **baked into its shipped image**. This is the first run of the installed service. Earlier runs copied the service binary to `/tmp` on the board.

## Setup

- **Image:** K26 build `20261004145201` (HSM pin `1e797dd7`, FHE source `609aa422` from pqctoday-fhe PR #21), written to a microSD card and verified structurally before the board booted from it. The build inputs are published as pqctoday-cacp PR #53.
- **Service:** the baked systemd unit `pqc-fhe-server`, listening on the board's crypto port 5730 with mTLS (CACP CA). It does not start without pins. The run wrote the three pins (signer, lineage, parameter hash) to `/run/pqc/fhe-server.env`, which lives in memory only, and started the unit. The client ran in a linux/arm64 container on the owner Mac and connected straight to the board (no tunnel), using pqctoday-fhe `cd2271ce`.
- **Binary check:** `/usr/bin/kv260-fhe-server` on the board is 10,040,640 bytes, sha256 `0a7cc68f4357cad9…`, identical to the file inside the image.
- **Custodian:** the software token on the owner Mac (created on 3 Oct), driven by the macOS build of the token tool from pqctoday-hsm `b3a6eb8d`. The owner-side attestation (`verify-signer`) passed against that token's own test root; signer `891ce509…` pinned. The attestation chain is labelled "EDUCATIONAL TEST ONLY".

## Flow and results

| Step | Result |
|---|---|
| Owner-side attestation of the token export | **pass**; signer `891ce509…` pinned |
| `POST /v1/keys`, tampered key | **refused, 403** ("SHA-384 of the server key does not match the manifest") |
| `POST /v1/keys`, signed key | **admitted** under the pinned signer; verify 235 ms, conformant load + decompress 1.50 s |
| `POST /v1/jobs`, `examples/demo-program-u64.json` (7 steps over u32, u8 and u64) | **done**, 50.2 s wall at the client: list expansion 14.3 s, then steps add 6.04 s, gt 1.90 s, select 7.02 s, min 3.06 s, xor 0.76 s, eq 3.51 s, u64 add 12.05 s (34.3 s in total). The cost model estimated 39.7 s |
| The token decrypted the 6 outputs under its policy | **5 released, all correct** (r = 2615157863, big = true, m = 92, x = 72, e = false); **the u64 output `t` was refused** (`CK_RV 0x1b`), as the policy requires. 6 of 6 as expected |
| Memory (`memory.txt`) | cgroup peak 278,200,320 B (265 MiB), 195,555,328 B at the end, process RSS 200,032 kB, against a 3 GiB limit |
| Unit limits (`installed-unit.txt`) | enabled; CPUWeight 800, CPUs 1–3, MemoryHigh and MemoryMax 3 GiB, no swap, runs as user `pqc` |
| After the run (read-only check on the board) | unit stopped, pin file removed, nothing listening on 5730, 0 failed units |

## Notes and limits

- The pins live in `/run` only, so they are gone after every reboot. Making them persist needs a `persist` partition, which the card does not have.
- The board image has no `ss` command, so the listening-socket line in `installed-unit.txt` is an error message. The successful connection on port 5730 shows the service was listening.
- The attestation uses the software token's own test root, not an independent trust anchor. It shows the check works end to end; it is not hardware attestation.
- `server.log` (the board's journal) is withheld because it names the board. `provenance.txt` and `run.log` are published with the board address replaced by `<kv260-ip>` and the board's certificate host name replaced by `kv260-board.local`. First 16 hex of the originals' sha256: provenance `238c7dde…`, run.log `8ee6693c…`, server.log `340eb789…`.
