# OpenFHE N-of-N threshold BFV on the KV260 Cortex-A53 (2026-10-03) vs. the Hub

- **What ran:** the unmodified `../openfhe-threshold-bfv` spike, at OpenFHE v1.6.0, built in a `debian:bookworm` arm64 container. The build commit is in `provenance.txt` (no uncommitted changes); the binary and libraries are hashed in `sha256*.txt`, and the board's hashes match.
- **How it ran:** on the KV260 as a transient systemd unit (`MemoryMax=3G`, no swap), once per party count. Each party count ran once with no warm-up.
- **Scope:** the spike runs **every party** on the board. These are per-role compute costs on a Cortex-A53, not an untrusted-server split.
- **Parameters:** n = 16384, log2 q = 300, 5 RNS towers, p = 65537, `NOISE_FLOODING_MULTIPARTY`.

## Correctness (`n3.json`, `n5.json`)

| | N = 3 | N = 5 |
|---|---|---|
| T1: all shares fused, add / mult / EvalSum | exact / exact / exact | exact / exact / exact |
| T2: N−1 shares decrypt? | no | no |

## Timing on the A53, compared with the M4 Pro reference run (`../../openfhe-threshold-bfv/README.md`)

| Step | A53, N = 3 | A53, N = 5 | M4 Pro, N = 3 |
|---|---|---|---|
| Public-key chain | 131 ms | 196 ms | 9 ms |
| Relinearization keys | 776 ms | 1,358 ms | 59 ms |
| EvalSum keys | 1,090 ms | 1,549 ms | 47 ms |
| Encrypt | 147 ms | 94 ms | 7.8 ms |
| Add | 10 ms | 9 ms | 0.1 ms |
| Mult (with relinearization) | 274 ms | 287 ms | 17.7 ms |
| All partial decryptions | 60 ms | 99 ms | 9.1 ms |

## Memory (`n3.log`, `n5.log`, last line)

Peak RSS is 392,996 kB for N = 3 and 396,960 kB for N = 5. It was taken by sampling the process's VmHWM every 10 ms, with 328 and 438 samples. The systemd cgroup peak is **not** used, because it was unreliable for these few-second units.

## Sizes (from the board; identical to the M4 Pro run)

Joint public key 1,311,909 B; one party's secret share 656,356 B; joint relinearization key 6,556,391 B; **joint EvalSum keys 78,667,237 B**; fresh ciphertext 1,311,953 B; partial decryption share 656,576 B.

## Against the Hub's OpenFHE-threshold figures

Line numbers are pqctoday-hub `origin/main` `205d38d0a`, `…/ConfidentialComputing/data/fheHsmCosts.ts`.

| Hub says | Measured | Verdict |
|---|---|---|
| Size basis: "BFV at ring dimension N = 2¹⁶, leveled" (`:21-30`) | The reference configuration with noise flooding runs at N = 2¹⁴ | ✘ Re-base on N = 2¹⁴, as the spike's README already notes |
| "public key of a few MB" (`:242`) | 1.3 MB | ✔ |
| Relinearization key-switching material "~100 MB/rnd" (`:246-250`) | the whole joint relinearization key is 6.3 MB | ✘ About 16× too large |
| Summation keys "~100s MB" (`:252-258`) | 75 MB | ≈ The right order but at the low end. Say "~75 MB" |
| Ciphertexts "~MB / ct" (`:260`) | 1.3 MB | ✔ |
| Encryption "10s of ms" (`:260`) | 7.8 ms on the M4 Pro; 94–147 ms on the A53 | ≈ Holds for desktops; ~0.1 s on a small ARM core |
| Evaluation "ms–s" (`:266`) | add 0.1 ms / mult 18 ms on the M4 Pro; 10 ms / 0.27 s on the A53 | ✔ |
| Partial decrypt "~ms" (`:272-274`) | about 3 ms per party on the M4 Pro; about 20 ms per party on the A53 | ✔ |
| Not stated | peak RAM ~385 MiB with all parties on one A53 board | new figure |
