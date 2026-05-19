# MLS — Group Messaging (RAG summary)

Module: `mls-group-messaging` (LM-054). Covers RFC 9420 Messaging Layer
Security, TreeKEM ratcheting, HPKE-based path-update encryption, and the
PQ ciphersuite drafts (`draft-ietf-mls-pq-ciphersuites-04`,
`draft-ietf-mls-combiner-02`, `draft-ietf-mls-extensions-09`).

Architecture lab: `pqctoday-hsm/openmls-provider/` — a Rust crate that
implements OpenMLS's `OpenMlsProvider` trait by routing the
`OpenMlsCrypto` surface through PKCS#11 v3.2 against softhsmv3.

## Capability matrix (v0.2)

| OpenMLS operation                         | PKCS#11 path                             | HSM-resident |
| ----------------------------------------- | ---------------------------------------- | ------------ |
| hash / hmac / hkdf                        | CKM_SHA\*\_HMAC + RFC 5869 over HSM HMAC | yes          |
| aead_encrypt / aead_decrypt               | CKM_AES_GCM                              | yes          |
| signature_key_gen / sign / verify         | CKM_EC_EDWARDS_KEY_PAIR_GEN, CKM_EDDSA   | yes          |
| HPKE (DhKem25519 + SHA-256 + AES-128-GCM) | CKM_ECDH1_DERIVE + HKDF + AES-GCM        | yes          |
| HPKE (all other suites)                   | hpke-rs-rust-crypto fallback             | Phase 2.1    |

## Signature custody

Generated as token objects with `CKA_SENSITIVE=TRUE` /
`CKA_EXTRACTABLE=FALSE`. What OpenMLS persists as the &quot;private key&quot; is
an opaque `HsmKeyHandle` blob (PQTH magic + CKA_ID), never raw bytes.

## Library cross-references

- RFC 9420 — MLS base protocol
- RFC 9180 — HPKE (used inside MLS for path updates)
- draft-ietf-mls-pq-ciphersuites-04 — ML-KEM + ML-DSA ciphersuites
- draft-ietf-mls-combiner-02 — classical + PQ hybrid combiner
- draft-ietf-mls-extensions-09 — MLS extensions framework

## Status

Module marked `workInProgress`. Future work tracked as Phase 3 (HSM
storage) + Phase 4 (PQ ciphersuites) + Phase 5 (WASM provider so the
hub can drive a real OpenMLS group in-browser) in
`pqctoday-hsm/openmls-provider/README.md`.
