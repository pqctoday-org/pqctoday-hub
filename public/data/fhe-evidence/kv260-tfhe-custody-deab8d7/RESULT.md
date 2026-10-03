# Stage F: HSM token → KV260 untrusted compute → token (2026-10-03, 15:32–15:35 UTC)

**Label:** custodian: software token on Mac (MX95 pending).

This is the first end-to-end run of the TFHE single-HSM custody flow with the client key held in the token:
- **Custodian:** the pqctoday-hsm `fhe_custodian` CLI (FHE plan P2), running on the M4 Pro. The engine is `a0a60b69` on `feat/fhe-p2-1003`, but the binary (SHA-256 `ff7ab755…e0d0`, in `provenance.txt`) was built from the tree just before that commit. The building session reports the source as identical apart from rustfmt formatting of the example and a CHANGELOG entry. A rebuild from `a0a60b69` may therefore not reproduce the binary's hash byte for byte. For byte-exact provenance, re-run against a binary built from the commit.
- **Untrusted compute:** the KV260's Cortex-A53, running the board code from pqctoday-fhe commit `7a578fd`, with no uncommitted changes.

The token was software, running on a Mac. That makes this a software-token result; it says nothing about hardware custody.

## What happened, in flow order

| Step (Hub scenario `tfhe-single-hsm`) | Where | Result |
|---|---|---|
| `generate-client-key`, `generate-server-key` | token | Done by the custodian at `init`. The client key never left the token |
| `publish-compact-public-key` | token → owner | The owner checked the CPK against the **pinned** signer key (`signer_spki.der` sha256 `891ce509…c3bc`), the manifest kind (2), and the SHA-384 of the blob. It also checked the ML-DSA-65 signature, with the upstream `fips204` 0.4.6 crate (the token signs with its own patched copy) |
| `owner-encrypts-locally` | owner | Two values per type, encrypted as packed compact lists: u8 **16,675 B**, u32 **16,771 B**, u64 **16,899 B**. The size is almost all fixed overhead, about 8.3 KB per value for a pair (`owner-encrypt.json`) |
| `export-server-key` | token → board | Before parsing anything, the board checked: the pinned signer key; manifest kind 1; the pinned lineage `1492bcc8…b107` and paramHash `2ce45553…78b5`; the SHA-384 `0d167d4f…d65f`; and the ML-DSA-65 signature. That took **294 ms** on the A53. Then it did a conformant load in 132 ms and decompressed in 1.44 s |
| negative checks | board | Each was **refused** before the key was parsed (`board-negative-checks.txt`): a server key with one bit flipped (SHA-384 mismatch), the wrong signer pin, and a different token's lineage. The genuine export was accepted |
| `upload-ciphertexts` | owner → board | The board expanded the lists: u8 in 1.03 s, u32 in 4.64 s, u64 in 7.62 s |
| `compute-with-pbs` | board | 3 reps of each op; medians: u8 add 1.23 s, mul 3.89 s, lt 0.87 s; u32 add 5.89 s, max 9.32 s, eq 2.81 s; u64 add 12.31 s |
| `return-encrypted-result` → `owner-requests-decrypt` → `decrypt-under-policy` → `release-result` | board → token | The token **released 6 of 6** permitted results, all correct: 19, 196, false, 2615157863, 2309737967, false. It **refused** the FheUint64 result with `CKR_ACTION_PROHIBITED` (0x1b), as its policy says (`token-decrypt.txt`) |

## RAM

- **systemd cgroup peak** (from the journal): 203.5M, with 0 B swap; 6 min 28.7 s of CPU time.
- **Process peak RSS:** 211,196 kB. RSS after the server key was decompressed was 123,672 kB.

## Not covered

- The owner did not verify `signer_evidence.der` (the K3 attestation that the signing key lives in the token and can't be extracted) in this run. The board, as agreed, checks only the pinned key, the manifest and the signature.
- No hardware token; the i.MX 95 boards come later.
- No network service; files went over scp.

## Files

| File | Contents |
|---|---|
| `owner-encrypt.json` | CPK check, pins, list sizes |
| `board-negative-checks.txt` | The refusals and the acceptance |
| `server.json`, `server.log` | The board's output, including the server-key check |
| `journal.txt` | RAM figure of record |
| `token-decrypt.txt`, `expected.txt` | The token's release decisions and the expected values |
| `sha256*.txt`, `sizes.txt` | Hashes and sizes |
| `provenance.txt`, `run.log`, `board-*.txt` | Internal hosts. Do not publish these |
