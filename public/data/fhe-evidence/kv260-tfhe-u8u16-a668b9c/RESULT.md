# u8 / u16 on the KV260 Cortex-A53 (2026-10-03, 18:15–18:18 UTC)

This run follows the owner's workload decision: "both, u8/u16 first". It uses the same method as `../2026-10-03-kv260-a53/`: the client/server split, conformant size-capped loads on the board, 3 reps per op, medians, and a client-side decrypt check. The background load was the same (HSM services idle, `pqc-health` timers on). The board code is pqctoday-fhe `1c604d1`, with no uncommitted changes. The parameters are the CPU custody parameters: TFHE-rs 1.8.1, `PARAM_MESSAGE_2_CARRY_2_KS_PBS_TUNIFORM_2M128`, `use_dedicated_oprf_key(false)`. Keys are software-held, from the TEST seed.

**Correctness:** 18 of 18 results decrypt correctly (`client-verify.json`). **RAM:** the cgroup peak was 202.7M, with 0 B swap (journal); process peak RSS was 211,360 kB.

| Op (median, seconds) | u8 | u16 |
|---|---|---|
| add | 1.35 | 2.63 |
| sub | 1.35 | 3.13 |
| mul | 4.09 | **14.67** |
| scalar add | 1.70 | 2.55 |
| bitand | 0.41 | 0.87 |
| shift right (scalar) | 0.39 | 1.12 |
| max | 2.29 | 4.46 |
| lt | 0.80 | 1.59 |
| eq | 0.80 | 1.85 |

**Ciphertext sizes:** FheUint8 66,101 B; **FheUint16 132,101 B**; a FheBool result 16,593 B.

## Cross-checks

- **Against the 3-rep run 2 hours earlier** (`../2026-10-03-kv260-a53/`): u8 is within about 10% (for example, mul 4.09 vs 3.86 s).
- **Against session 2b's run on the same board and day:** 2b used its own tool (in-process keys, not this split, and unpublished), with 3 reps, medians and the same load. With the same CPU parameters it measured u16 add 2.80, mul 14.24 and bitand 0.86 s, which agrees with this table to within about 7%. With the HPU parameter set (`V1_8_HPU_…_KS32_2M128`) it measured 2.59 / 13.88 / 0.78 s.
- **The service's cost table** (`../../../kv260-fhe-server/src/expr.rs`, where the u16 row was interpolated): add 3.0, mul 14, bit 1.0, shift 0.9, min/max 4.5, compare 1.6 s. The measured values are close; only shift (1.12 vs 0.9) is under-estimated. A follow-up should replace the u16 row with these medians.

## What this means for the u8/u16 demos

- A 16-bit multiply takes about 15 s on the A53, against about 3.5 min for 64-bit. Additions and comparisons on u16 take 1.6–3 s each.
- A demo program of 10–20 u16 steps without many multiplies fits in about 1 minute on the board.

Do not publish `provenance.txt`, `run.log` or `board-*.txt`. Publish `journal.txt` only redacted.
