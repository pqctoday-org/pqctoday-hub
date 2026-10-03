# Hub FHE claims vs. measurements: TFHE on the KV260 (2026-10-03)

This folder is the evidence run of record. It was built from pqctoday-fhe commit `ff63d55` (`provenance.txt`). The run went from the trusted side (a linux/arm64 container on the M4 Pro) to the KV260 Cortex-A53 and back to the trusted side, using TFHE-rs 1.8.1 (`187fc0b9`) with the custody config `ConfigBuilder::default().use_dedicated_oprf_key(false)`.

All 27 results decrypt correctly (`client-verify.json`). The binary and input hashes on the board match the build (`sha256*.txt`). A pilot run 20 minutes earlier (`../2026-10-03-kv260-a53-pilot/`) agrees with it: the median op differs by 2.9% and the worst by 11.6%, and the memory peak is the same.

**What it validates:** the TFHE single-HSM flow's cloud steps `export-server-key` (the server side), `upload-ciphertexts`, `compute-with-pbs` and `return-encrypted-result`, plus all key and ciphertext sizes. Keys are software-held, from the TEST seed, so this run says nothing about HSM custody.

The Hub line numbers below are pqctoday-hub `origin/main` `205d38d0a`, `src/components/PKILearning/modules/ConfidentialComputing/data/`.

## Sizes (platform-independent; `client-gen.json`, `sizes.txt`)

| Item | Measured | Hub says | Verdict |
|---|---|---|---|
| Client key, as stored | 24,087 B | "~24 KB as stored" (`fheHsmCosts.ts:183`, `fheHsmStepIO.ts:130`); `KEY_SIZES` label "~3 KB" (`fheHsmCosts.ts:485-491`) | ✔ for the ~24 KB text. ✘ for the "~3 KB" label, which the evidence-plumbing branch already fixes |
| Compressed server key | 30,147,061 B (28.8 MiB) | "~30 MB" (`fheHsmCosts.ts:199, 503-509`) | ✔ for the size. ✘ for the wording "TFHE-rs 1.8.1 default" (`:8, :509`): the default config gives 57.4 MB (see `tfhe-custody` C3b). It should say "custody config (OPRF key off)" |
| Server key once expanded (decompressed) | 120,419,371 B serialized. RSS after loading it on the board was 123,396 kB | "≈130 MB once the cloud expands it" (`fheHsmCosts.ts:199, 509`) | ≈ About 8% high. Suggest "~120 MB" |
| Compact public key | 33,034 B | "~16–32 KB", bytes 32,000 (`fheHsmCosts.ts:494-500`); "~10s of KB" (`:201`) | ≈ Just above the range. Suggest "~33 KB" |
| One FheUint64 ciphertext (expanded) | 528,101 B | "~0.5 MB (32 blocks × 2,049 × 8 B)" (`fheHsmCosts.ts:208`, `fheHsmStepIO.ts:154`) | ✔ |
| One FheUint8 ciphertext | 66,101 B | "~65 KB each expanded" (transciphering, `fheHsmCosts.ts:335`) | ✔ |
| One FheBool result (lt/eq) | 16,593 B | none | new figure |
| Upload as a compact list, "a few KB per value" (`fheHsmCosts.ts:208`) | not measured (this run uploads expanded ciphertexts) | — | open |

## Server-side compute (`server.json`, `server.log`)

Board: KV260 revB, 4× Cortex-A53, 4 GB, Linux 6.18.10, CACP image. Its HSM services were running idle, and the `pqc-health` timers took up to one core at nice 10 (`board-during.txt`), which is a realistic appliance load. Each op ran 3 times; the medians are shown, and min/max are in the JSON.

| Op | u8 | u32 | u64 |
|---|---|---|---|
| add | 1.51 s | 5.99 s | 12.66 s |
| sub | 1.36 s | 6.26 s | 12.07 s |
| mul | 3.86 s | 54.87 s | **210.59 s** |
| scalar add | 1.59 s | 5.65 s | 11.30 s |
| bitand | 0.44 s | 2.08 s | 3.77 s |
| shift right (scalar) | 0.39 s | 1.79 s | 3.71 s |
| max | 2.29 s | 9.00 s | 17.27 s |
| lt | 0.82 s | 3.13 s | 6.04 s |
| eq | 0.86 s | 2.68 s | 5.46 s |

Server-key handling on the board: conformant, size-capped load 133 ms; decompression 1.13 s.

| Hub claim | Measured | Verdict |
|---|---|---|
| "A 64-bit add takes tens of ms and a multiply hundreds of ms" (`fheHsmCosts.ts:217`) | KV260 A53: add 12.7 s, mul 210.6 s. M4 Pro, 14 cores, from `tfhe-custody`: add 183–211 ms, mul 2.5–2.8 s | ✘ Too fast by about 10× even on a desktop CPU, and by about 1000× on a small ARM board. Suggest "a 64-bit add takes ~0.2 s and a multiply ~2.5 s on a 14-core desktop CPU; ~13 s and ~3.5 min on a 4-core Cortex-A53" |
| "ms–s / op" (transciphering cloud step, `fheHsmCosts.ts:353`) | 0.4 s to 210 s per op on the A53 | ≈ The low end holds only for desktop CPUs and small types |
| "10³–10⁶× slower; needs GPU/FPGA at scale" (`HomomorphicEncryptionSection.tsx:49`) | consistent with the above | ✔ (qualitative) |
| "Decryption … microseconds" (`fheHsmFlows.ts:516, 1222`) | 0.01 ms (`tfhe-custody`, M4 Pro); not timed on the board | ✔ on desktop |
| Server-key generation "seconds on an HSM-class CPU (est.)" (`fheHsmCosts.ts:187-191`) | 191 ms on the M4 Pro; not yet measured on an A53/A55 | open. Measure on the MX95 (the HSM board) or the A53 |

## RAM

| Measure | Value |
|---|---|
| Process peak RSS (VmHWM) | 211,104 kB (206 MiB) |
| systemd cgroup peak (journal of record) | 203.0M, with 0 B swap |
| RSS after the server key is loaded and decompressed | 123,396 kB |
| CPU time / wall time | 1 h 4 min 55 s / 19 min 28 s (≈ 3.3 of 4 cores busy) |

The FHE service fits easily inside the owner's 3 GB limit for it. It would also fit inside the 512 MB the other CACP services get.

## Not covered by this run

- CKKS, BFV and BGV figures (OpenFHE, Lattigo): next in the lane order.
- A compact-list upload, the board's network-service path, and HSM-held keys (lane F).
- PBS timing on a single core.
- The ML-DSA-65 manifest signature (placeholder here).
