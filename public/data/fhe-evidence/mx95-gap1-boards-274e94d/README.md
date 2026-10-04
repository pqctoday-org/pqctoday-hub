# FHE seed destroy → restore over KMIP, and phase 2 on final main — MX95 + MX95 Pro, 2026-10-03

PQCTODAY EDUCATIONAL TEST ONLY. Software token (`softhsmrustv3`), pre-ceremony-ABI test bridge.
Custodian `mx95-board`, backup `mx95pro-board`. KV260 compute and decrypt legs: session e5, pqctoday-fhe
`feat/kv260-gap1-destroy-1003` @ `7eaf1282` (`results/2026-10-03-gap1/RESULT.md`).

## Code

| Piece | Commit |
|---|---|
| Engine | pqctoday-hsm main `496f9e52` (after #323, #325, #327, #324) — `rust/src` byte-identical in the build commit |
| Board tool, courier, KMIP test bridge | pqctoday-hsm `76551268` = PR #326 head (final main merged in; remote gate 26/26) |
| Runner | `validation/replication/run-gap-boards.sh` (stages prep / restore / cleanup) |

Binaries (`binaries.sha256`), built `--release --features educational-fhe`, no `test-support`.

## Sequence and results

| Step | Who | Result |
|---|---|---|
| P: bootstrap, MX95 seed + export, offline backup MX95 → Pro over KMIP, Pro export | 1c | receipt verified on the host; 6/6 protocol negatives; KMIP window 4 s |
| A1 phase 2 normal (MX95 custodian) | e5 | K3 pass; KV260 3/3 tampered keys refused; MX95 7/7, Pro 7/7 |
| A2 failover (Pro export, own signer) | e5 | K3 pass; Pro 7/7, MX95 7/7 |
| A3 destroy on MX95 | e5 | after `destroy-lineage`, MX95 refuses 7/7; Pro still decides 7/7 on the same ciphertexts |
| B: MX95 holds 0 keys → RESTORE Pro → MX95 over KMIP | 1c | receipt verified on the host; MX95 count 0 → 1; KMIP window 7 s |
| B: N2 live clone to a destination policy without the FHE constraint | 1c | refused at `CreateReplicationPackage` (CK_RV 0x1b); nothing installed (Pro count still 1) |
| C: restored MX95 on A3's ciphertexts | e5 | 7/7 (ciphertext hashes match A3) |
| D: fresh export from the restored MX95 → KV260 → MX95 | e5 | K3 pass; KV260 3/3 refused; MX95 7/7 |

Afterwards: `/tmp/repl-test` removed on both boards, `lab-verify-boards.sh` 45 passed / 0 failed.

## Notes

- The restored MX95 kept its manifest signer (`destroy-lineage` removes only the seed), so its export
  signer pin is unchanged (`cb7719e2…`, `signer-pins.txt`). The Pro's signer was generated on restore.
- N1 (destination without the FHE decrypt policy) needs a third, differently bootstrapped token; it
  stays covered by the host rehearsal `rehearse-fhe-restore-negatives-host.sh`, re-run PASS on the
  merged tree before this window.
- Sealed packages, requests and receipts stay out of the repository; the ceremony logs record their
  sizes and return codes.
