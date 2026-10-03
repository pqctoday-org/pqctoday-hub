# KV260 FHE network service with the MX95 Pro backup token as custodian, i.e. failover (2026-10-03, 22:35–22:37 UTC)

**Label:** custodian: backup software token on MX95 Pro (seed restored over KMIP); untrusted compute: the KV260 network service. These are educational software tokens, not hardware custody.

This file names no hosts, so it can be published as it is. It is the failover counterpart of `../2026-10-03-kv260-service-mx95/`. The data owner switches to the **backup** token, which holds the same FHE seed (backed up from the MX95 over KMIP by the replication session) but has its **own** manifest signer, generated when the backup was restored. The service admits the backup's key only because that signer was pinned from a verified attestation.

- **Token tool:** pqctoday-hsm `76551268` (`repl_edu_board` `82cf57b1…`).
- **Owner-side attestation:** hsm main `1bc4f859` (`verify-signer` `cddf4df9…`).
- **Service:** pqctoday-fhe main (scripts from PR #17).

| Step | Result |
|---|---|
| The owner verified the attestation of the Pro's export | **pass**; signer `37d643cc…` pinned (the backup's own signer, generated on restore) |
| Tampered key | **refused, 403** |
| The Pro-signed server key | **admitted** (same lineage as the MX95's key) |
| Demo job (7 steps over u32, u8 and u64) | **done in 42.5 s** on the KV260 |
| The **MX95 Pro** decrypted the 6 outputs | **5 released, all correct; the u64 output refused** (`token-decrypt.txt`) |
| Cross-check: the original **MX95** decrypted the **same** 6 outputs (the hashes match `sha256-results.txt`) | **the same decisions: 5 released, all correct; u64 refused** (`token-decrypt-mx95-crosscheck.txt`) |

Do not publish `provenance.txt` or `run.log`, which contain internal hosts.
