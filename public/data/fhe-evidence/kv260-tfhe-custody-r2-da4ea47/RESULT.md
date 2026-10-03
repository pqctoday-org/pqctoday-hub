# Stage F re-run with a byte-exact custodian binary (2026-10-03, 15:48–15:51 UTC)

**Label:** custodian: software token on Mac (MX95 pending).

This repeats `../2026-10-03-kv260-a53-custody/` with one change. The `fhe_custodian` binary was built from a clean tree at pqctoday-hsm commit `a0a60b6972135cc3fef58bf43c99f3691e1a849d` (PR #318), with features `educational-fhe`, a release build, and rustc 1.95.0. Its SHA-256 is `5e1eb3a5bb2f7417d868eeb0318688b9f23742767c8507df37e0cdf2860dfe9c`, and the builder's provenance file is quoted in `provenance.txt`. That gives the custodian byte-exact provenance, which the first run lacked. The token is the same one: the same signer key (`891ce509…c3bc`), lineage and keys.

The board code is pqctoday-fhe commit `2772e7a`, which has the same board-side code as `7a578fd`; only the run script's provenance capture changed.

| Check | First run | This run |
|---|---|---|
| Board negative checks (tampered key, wrong signer, another token's lineage) | 3/3 refused, genuine accepted | 3/3 refused, genuine accepted |
| Token releases | 6/6 correct, FheUint64 refused | 6/6 correct, FheUint64 refused (`token-decrypt.txt`) |
| u8 add / mul / lt (median) | 1.23 / 3.89 / 0.87 s | 1.56 / 3.87 / 0.86 s |
| u32 add / max / eq | 5.89 / 9.32 / 2.81 s | 6.05 / 9.59 / 2.73 s |
| u64 add | 12.31 s | 12.59 s |
| cgroup peak (journal) | 203.5M | 203.4M |

The other files are laid out as in the first run. `provenance.txt`, `run.log`, `sizes.txt` and `board-*.txt` contain internal hosts and usernames; do not publish them.
