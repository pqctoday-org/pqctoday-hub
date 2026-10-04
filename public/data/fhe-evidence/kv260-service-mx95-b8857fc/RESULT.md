# KV260 FHE network service with an MX95 token as custodian (2026-10-03, 22:24–22:26 UTC)

**Label:** custodian: software token on MX95; untrusted compute: the KV260 network service. These are educational software tokens, not hardware custody.

This file names no hosts, so it can be published as it is. It combines the two pieces that were previously only shown separately: the REST service on the KV260 (shown before with the Mac token), and a board token as custodian (shown before with the file-based runner).

## Setup

- **Custodian:** the replication session's token tool on the MX95 (pqctoday-hsm `76551268`, PR #326 head; `repl_edu_board` `82cf57b1…`). It was set up fresh for this run: seed, export, and a backup on the MX95 Pro that this run did not use.
- **Owner-side attestation:** pqctoday-hsm main `1bc4f859` (`verify-signer` `cddf4df9…`), with the trust anchors kept on the owner's Mac.
- **Service:** pqctoday-fhe `fed2dd3`. It ran on the KV260's loopback behind an SSH tunnel, with the board's own CACP certificates: mTLS over TLS 1.3, hybrid ML-KEM groups only.

## Flow and results

| Step | Result |
|---|---|
| The owner fetched the MX95 export and verified its attestation | **pass**; signer `1284b24b…` pinned. It matches the pin the replication session gave out of band |
| The owner encrypted the inputs under the MX95's compact public key | u8, u32 and u64 lists (`owner-encrypt.json`) |
| `POST /v1/keys`, tampered key | **refused, 403** ("SHA-384 of the server key does not match the manifest") |
| `POST /v1/keys`, signed MX95 server key | **admitted** under the pinned signer and lineage `f9998b94…`: verify 242 ms, conformant load + decompress 1.30 s |
| `POST /v1/jobs`, `examples/demo-program-u64.json` (7 steps over u32, u8 and u64) | **done in 42.7 s** on the board (44.4 s wall at the client). List expansion took 12.1 s. Steps: add 6.18 s, gt-const 1.56 s, select 5.81 s, min 2.28 s, xor-const 0.56 s, eq 2.62 s, u64 add 11.59 s |
| The MX95 token decrypted the 6 outputs under its policy | **5 released, all correct** (r = 2615157863, big = true, m = 92, x = 72, e = false); **the u64 output `t` was refused** (`CK_RV 0x1b`), as the policy requires |
| Memory (`memory.txt`) | cgroup peak 293,806,080 B (280 MiB) |

Do not publish `provenance.txt` or `run.log`, which contain internal hosts.
