# FHE stage F phase 2 on the boards — 2026-10-03

PQCTODAY EDUCATIONAL TEST ONLY · pre-ceremony-ABI · software token (not hardware custody).

- **Custodian:** mx95-board. **Backup:** mx95pro-board. **Engine:** pqctoday-hsm #318 `a0a60b69` (educational-fhe).
  **Board tool / courier / bridge:** branch `feat/hsm-replication-kmip-admin-1003` @ `c176fffb` (test tooling,
  not engine code; board tool built without test-support). Binary SHA-256s are in `binaries.sha256`.
- **Owner approvals (session 1c):** window "Yes, run it now"; FHE transport "Crypto network only"; decrypt
  "On the board first".
- **KMIP window:** 17:26:38Z–17:26:42Z (4 s); both boards 18/18 afterwards.

| Step | Result |
|---|---|
| bootstrap --fhe (board-local) | both boards under one test root; FHE-constrained replication policy + typed decrypt policy |
| MX95 fhe-genkey + fhe-export | compressed server key 30,147,061 B, compact public key 33,034 B, signed manifests, attested signer |
| Offline backup MX95 → Pro over KMIP (crypto network, TLS 1.3 X25519MLKEM768) | PASS; receipt host-verified; 6/6 negatives (exact retry same receipt; tamper and wrong recipient 0x1b; fn 0 → 0x07; CloneKey → 0x54; unknown UID → 0x60) |
| Pro fhe-export (re-derived) | own manifests + signer labelled `generated-on-restore` with K3 evidence |

**Stated properties** (7f review + host rehearsal):
1. Public material is **re-issued**, not reproduced: the backup's manifests differ from the custodian's only
   in `valueSha384` (lineage and paramHash equal), and a re-export on the custodian differs too (FHE plan
   D9). The client key is identical, so ciphertexts made under the custodian's public key decrypt on the
   backup. Compute-side trust = same lineage + paramHash + attested signer under the same root (signer
   pins in `signer-pins.txt`), not a single SPKI pin.
2. The decrypt budget is **per object**: a replica starts at 0, so the total for a lineage is
   max_decrypts × (1 + replicas), bounded by the replication policy's maxReplicas (lineage-wide budget = v1.1).
3. The FHE type extension (FheRecoveryDescriptor) travels inside the signed, recipient-sealed package. The
   base K0B spec rev 3 has no normative pointer to it yet (R5, a spec gap).

Next: e5's KV260 compute + decrypt on both boards (run-custody.sh), then `CLEANUP_ONLY=1 run-fhe-boards.sh`.
