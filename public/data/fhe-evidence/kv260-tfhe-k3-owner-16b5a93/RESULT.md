# Stage F with owner-side K3 attestation (2026-10-03, 19:12–19:16 UTC)

**Label:** custodian: software token on Mac; the signer was pinned from a verified attestation, not hardware custody.

This is the same flow as `../2026-10-03-kv260-a53-custody-r2/`, with one change. The data owner no longer takes the token's manifest signer on trust (given out of band, or read from the export). **Before anything is sent to the compute board**, the owner's Mac runs `fhe_custodian verify-signer` on the fetched export, and the signer is pinned only from a passing result.

- **verify-signer:** pqctoday-hsm `b3a6eb8d` on branch `feat/fhe-verify-signer-1003`, a child of PR #318's head `a0a60b69`; macOS binary sha256 `92759d01…f574`. It is not merged yet: per the owner's decision, it was built before the #320/#318 merges.
- **Board code:** pqctoday-fhe `ae0bc1f`, no uncommitted changes.
- **Board state:** the board had rebooted 3 minutes earlier, after another session's FPGA test, and was fully up with no failed units.

## What verify-signer checked (`owner-k3-verify.json`)

- **Evidence format:** strict DER, one ML-DSA-65 signature.
- **Chain:** key-attestation certificate (`fbeee82a`) → Device (`bb4b1cc8`) → Manufacturing Root (`815f54ee`, sha256 `2a437a71…9c85`), valid now.
- **CRLs:** current for both issuers, next update 2026-11-02.
- **Nonce:** equals the first 32 bytes of SHA-384 of `compressed_server_key.manifest.der`, so the evidence is bound to this export.
- **Attested key:** equals `signer_spki.der`; it is an ML-DSA-65 key that is sensitive, never extractable and generated in the token.
- **Identity:** lineage `1492bcc8…b107` and paramHash `2ce45553…78b5` match the manifests.

**Result: pass.** Signer `891ce509…c3bc` was pinned, the same key previously pinned out of band.

## Refusals (`owner-k3-negative-checks.txt`, each exit 1 with a reason)

| Case | Reason given |
|---|---|
| Manifest with one bit flipped | "evidence: nonce" |
| `signer_spki.der` replaced | "attested key is not signer_spki.der" |
| Device CRL missing | "no current CRL for issuer" |
| `--now` after the CRLs expire | "no current CRL for issuer" |

The genuine export passes (exit 0). `run-custody.sh` stops before contacting the board if verification fails, or if the attested key differs from the export's own SPKI or from a given pin.

## The rest of the flow (as before)

- **Board:** the KV260 refused 3 of 3 bad server keys (`board-negative-checks.txt`) and computed. The cgroup peak was 203.1M.
- **Token:** it decided 7 of 7 results; it released 6 correctly and refused FheUint64 (`token-decrypt.txt`).

Do not publish `provenance.txt`, `run.log`, `sizes.txt` or `board-*.txt`. Publish `journal.txt` only redacted.
