# FHE key custody round trip on two MX95 boards with the KV260 as compute (2026-10-03, 22:00–22:15 UTC)

**Label:** custodian: software token on MX95, with a backup software token on MX95 Pro; backup and restore over KMIP. These are educational software tokens, not hardware custody.

This file names no hosts and no network segments, so it can be published as it is. It covers the two gaps the owner asked to close:
- **Gap 1:** a seed destroyed on the custodian and then restored from the backup.
- **Gap 2:** phase 2 on the final binaries.

## Setup

- **Token tool:** the replication session's `repl_edu_board`, from pqctoday-hsm `76551268` (PR #326 head with final main `496f9e52` merged in; the engine source is identical to main). Binary sha256 `82cf57b1…b980`; built with `educational-fhe`, without `test-support`.
- **KMIP server:** the replication session's test server (`f5947867…`).
- **Owner-side attestation:** pqctoday-hsm main `1bc4f859` (`fhe_custodian verify-signer`, macOS binary `cddf4df9…419d`), with the trust anchors (test root + CRLs) kept on the owner's Mac.
- **Board code:** pqctoday-fhe `a279e31`, with no uncommitted changes. The runs happened inside the replication session's own board window, after it handed the boards over.
- **Key identity:** lineage `7651d012…` throughout.

## Sequence and results

| Step | Who | Result |
|---|---|---|
| P: seed on the MX95, export, backup to the Pro over KMIP, Pro export | replication session | receipt verified; 6/6 ceremony negative checks refused |
| **A1** normal | here | attestation **pass** (MX95 signer `cb7719e2…`); KV260 refused 3/3 bad keys; **MX95 7/7** and **Pro 7/7** on the same ciphertexts (`../2026-10-03-gap1-a1-normal/`) |
| **A2** failover | here | attestation **pass** (Pro signer `02b37907…`, generated on restore); the Pro's own export went through the KV260: **Pro 7/7**, **MX95 7/7** (`../2026-10-03-gap1-a2-failover/`) |
| **A3** destroy | here | attestation **pass**; KV260 computed; then `destroy-lineage` on the MX95 ("destroyed the key with this lineage on slot 0"). The **MX95 refused all 7**, and the **Pro still decided 7/7** on those ciphertexts (`../2026-10-03-gap1-a3-destroy/`) |
| B: restore Pro → MX95 over KMIP | replication session | MX95 key count 0 → 1; receipt verified. A clone under a policy without the FHE constraint was refused (`CKR 0x1b`, nothing installed) |
| **C** same ciphertexts | here | the **restored MX95 decided A3's ciphertexts 7/7**; their hashes matched A3's (`../2026-10-03-gap1-c-restored-same/`) |
| **D** fresh export | here | the restored MX95's new export passed attestation; KV260 refused 3/3 bad keys; **MX95 7/7** (`../2026-10-03-gap1-d-restored-fresh/`) |

"7/7" means all 7 results reached the token: 6 permitted results (u8/u32/bool) were released with the correct values, and the FheUint64 result was refused by policy.

**Signer after the restore:** the restored MX95 kept its manifest signer `cb7719e2…`. `destroy-lineage` removes only the FHE seed; the token's manifest-signing key survives, so restoring the seed does not create a new signer. The Pro's signer, by contrast, was generated when its backup was restored.

**KV260, in every run:**
- server-key verification took about 296 ms;
- medians: u8 add 1.4 s, mul 3.8 s, lt 0.9 s; u32 add 6.0 s, max 9.4 s, eq 2.7 s; u64 add 12.4 s;
- cgroup peak 203.1–203.3M.

Do not publish `provenance.txt`, `run.log`, `sizes.txt` or `board-*.txt` in the run folders. Publish `journal.txt` only redacted.
