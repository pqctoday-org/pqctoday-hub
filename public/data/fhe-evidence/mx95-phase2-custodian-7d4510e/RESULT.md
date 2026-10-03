# Stage F, phase 2: custodian MX95 + KMIP-restored backup MX95 Pro, KV260 untrusted compute (2026-10-03, 17:27–17:34 UTC)

**Label:** custodian: software token on MX95, with a backup software token on MX95 Pro restored over KMIP. These are software tokens on the appliance boards, so this is not hardware custody.

This file is written so it can be published as it is: it names no hosts and no network segments.

## Setup

- **Tokens:** the replication session's educational board tool (`repl_edu_board`, `educational-fhe`, binary sha256 `110626ae…60f1`). It was built from pqctoday-hsm `c176fffb` (on `origin/feat/hsm-replication-m12-1003`). The replication session first reported `99698fa8`, but corrected it on 2026-10-03: `99698fa8` lacks the signer-on-restore code that the MX95 Pro's export used (its console log shows the "generated-on-restore" label). The tokens ran in a test directory on each board, with the appliance services untouched outside that session's own short KMIP window.
- **Before these runs** (the replication session's window, 17:26:38–17:26:42Z): both boards were bootstrapped under one test root with an FHE-constrained policy. The MX95 generated the FHE seed and exported. The seed was backed up to the MX95 Pro with the **offline-backup ceremony over KMIP**; the receipt was host-verified and 6 of 6 negative checks passed. The Pro then re-derived its own public material, with its own manifest signer ("generated-on-restore").
- **Board code:** pqctoday-fhe `d1a2cb0`, no uncommitted changes.
- **Pins:** the KV260 accepted exactly two pinned signers, one per token (MX95 `4193d908…6dbc`, MX95 Pro `fcfc2a4b…4368`), under the same lineage `b01b0a4a…` and paramHash `2ce45553…78b5`. Both pins were given out of band by the session that ran the ceremony; the owner-side `signer_evidence.der` check was not done in this run.
- **Transport:** owner ↔ MX95 boards over SSH on the owner's management network, the phase-1 exception. KMIP on the crypto network was used only for the backup ceremony. The KV260 used its own network over SSH. The KV260 never talked to either token.

## Run 1: normal path (`2026-10-03-mx95-phase2-custodian/`)

| Step | Result |
|---|---|
| Owner verifies the custodian's CPK and encrypts (3 compact lists) | ok |
| KV260 checks the server key (pinned signer, lineage, paramHash, SHA-384, ML-DSA-65) | 296 ms; **3 of 3 bad keys refused**, genuine accepted |
| KV260 computes (3 reps; medians) | u8 add 1.46 s, mul 3.77 s, lt 0.98 s; u32 add 6.00 s, max 9.30 s, eq 2.73 s; u64 add 12.78 s. cgroup peak 203.1M |
| **MX95 custodian** decrypts under policy | **7 of 7 decided:** 6 released correctly (19, 196, false, 2615157863, 2309737967, false), FheUint64 refused (`CKR 0x1b`). About 0.46–0.49 s each, including SSH (`token-decrypt.txt`) |
| **MX95 Pro backup** decrypts the **same ciphertexts** | **The same 7 of 7 decisions** (`token-decrypt-backup.txt`) |

## Run 2: failover, compute under the backup's own export (`2026-10-03-mx95-phase2-failover/`)

| Step | Result |
|---|---|
| The owner fetched the **Pro's** export: same lineage `b01b0a4a…`, its own signer `fcfc2a4b…`, a different CPK and server-key value (SHA-384 differs; the public material is re-issued per D9) | ok |
| KV260 checks the Pro's server key against the same pin set | 295 ms; **3 of 3 bad keys refused**, genuine accepted |
| KV260 computes | u8 add 1.35 s, mul 3.76 s, lt 0.87 s; u32 add 6.07 s, max 9.36 s, eq 2.67 s; u64 add 12.47 s. cgroup peak 203.3M |
| **MX95 Pro** (now the custodian) decrypts | **7 of 7 decided**, 6 released correctly, FheUint64 refused |
| **MX95** decrypts the same new ciphertexts | **7 of 7, the same decisions**. The client key is the same on both tokens; only the public material and the signers differ |

## What this shows

- An FHE client key held in one token can be backed up to a second board over KMIP.
- After the backup, both tokens can decrypt the same results under the same policy.
- If the custodian is lost, the backup can re-issue public material that the compute server accepts, but only because the owner pinned the backup's signer in advance under the same key identity.
- In every run the compute server refused the tampered or foreign keys before parsing them.

**Not shown here:**
- destroying the seed on the custodian before the backup decrypts (the tooling does not have that step yet);
- the owner-side attestation check of each signer;
- hardware custody.

Do not publish `provenance.txt`, `run.log`, `sizes.txt`, `board-*.txt` or `journal.txt` (or publish a redacted journal); they contain internal hosts and usernames.
