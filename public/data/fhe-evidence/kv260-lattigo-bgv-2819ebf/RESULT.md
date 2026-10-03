# Lattigo v6.2.0 t-of-N threshold BGV reference spike on the KV260 Cortex-A53 (2026-10-03)

- **What ran:** `../../../lattigo-threshold-bgv` at commit `28966bc`, **unmodified**. It was built as a static `CGO_ENABLED=0` linux/arm64 binary in `golang:1.24-bookworm`; its hash is in `sha256.txt`, and the board's hashes match. Because the Go version differs from the M4 Pro reference build, the binary's hash differs too.
- **How it ran:** once per configuration, as a transient systemd unit (`MemoryMax=3G`, no swap). Peak RSS comes from VmHWM sampling (last line of each `.err` file).
- **Scope:** all parties run in one process, so these are per-role compute costs on an A53, not a network split.
- **Parameters:** LogN 14, LogQP 438, 6 levels, T = 65537, noise-flooding sigma 2^30.

## Checks (`bgv_n3_t2.out`, `bgv_n2_t2.out`): all pass for 2-of-3 and 2-of-2

- **L1:** with the active parties, add, mult and rotate are exact.
- **L2:** a different active set is also exact.
- **L3:** with one share missing, the result does **not** decrypt.
- **L4:** a multiparty refresh from level 1 to level 5 still decrypts exactly.
- **L5 / L6:** sizes and parameters recorded.

The retry-refusal demonstration mentioned in planning is not among this binary's checks.

## Timing on the A53 vs. the M4 Pro (`../../../lattigo-threshold-bgv/README.md`)

| Step | A53, 2-of-3 | A53, 2-of-2 | M4 Pro, 2-of-3 |
|---|---|---|---|
| Shamir re-sharing | 139 ms | n/a | 6.2 ms |
| Public / relinearization / rotation key | 201 / 1,416 / 590 ms | 154 / 1,019 / 473 ms | 7.0 / 43.8 / 20.8 ms |
| Encrypt / add / mult / rotate | 170 / 2.1 / 194 / 183 ms | 171 / 2.1 / 192 / 180 ms | 4.8 / 0.1 / 5.2 / 4.6 ms |
| Refresh | 251 ms | 226 ms | n/a |
| Threshold decrypt (public-key switch to the owner) | **353 ms** | 348 ms | 9.8 ms |
| Peak RSS | 124,608 kB | 97,156 kB | 122 MB / 94 MB |

## Sizes (bytes)

| Object | Bytes |
|---|---|
| Public-key share | 1,048,656 |
| Joint public key | 2,097,320 |
| Relinearization share, round 1 / round 2 | 6,292,000 / 3,146,032 |
| Joint relinearization key | 6,292,000 |
| Galois-key share / joint Galois key (one rotation) | 3,146,040 / 6,292,016 |
| Shamir secret share | 1,048,656 |
| Refresh share | 1,048,933 |
| Key-switch (decryption) share | 1,573,262 |
| Fresh ciphertext | 1,573,262 |

## Against the Hub's Lattigo-threshold figures

Line numbers are pqctoday-hub `origin/main` `205d38d0a`, `…/ConfidentialComputing/data/fheHsmCosts.ts`.

| Hub says | Measured | Verdict |
|---|---|---|
| Size basis "BGV at N = 2¹⁶" (`:21-30`) | the spike uses LogN 14 (int_psi's parameters) | ✘ Re-base on N = 2¹⁴, or state 2¹⁶ as a deliberate choice |
| "~MB/party" (`:279`) | public-key share 1.0 MB | ✔ |
| Two rounds of relinearization shares, "~100 MB ea." (`:282, :286`) | 6.3 MB and 3.1 MB | ✘ About 16–30× too large |
| "~100 MB/key" per Galois key (`:290-294`) | 3.1 MB per share; 6.3 MB joint per rotation | ✘ About 16× too large |
| "~100s MB", "ms–s" (`:298`) | keys are tens of MB for a few rotations; ops 2–194 ms on the A53 | ≈ The time holds; the size is too large |
| Refresh / key-switch shares "~MB/party", "10s of ms" (`:301-315`) | 1.0–1.6 MB; 226–353 ms on the A53 (M4 Pro decrypt 9.8 ms) | ✔ for size; the time holds only for desktops |

Do not publish `provenance.txt`, `run.log` or `board-*.txt`, which contain internal hosts.
