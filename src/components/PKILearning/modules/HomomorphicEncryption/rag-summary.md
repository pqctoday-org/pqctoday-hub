# Homomorphic Encryption (FHE) & HSM Key Custody

## Overview

This advanced Hardware Infrastructure module (LM-076) was split out of LM-019 _Confidential Computing & TEEs_. It covers fully homomorphic encryption (FHE) as the way to protect data in use by trusting mathematics instead of hardware, and how an HSM can hold the FHE secret key without becoming a decryption oracle. TEEs, remote attestation and the TEE-HSM channel stay in LM-019.

One ~45-minute route: five learn sections and one workshop step with six scenarios.

## Key Concepts

- **FHE trusts mathematics, a TEE trusts hardware** — the server computes directly on ciphertexts and never sees input or output, and there is no enclave to attest. The cost is speed (orders of magnitude slower than computing in the clear). FHE does not prove the result is correct: ciphertexts are malleable.
- **Four schemes in ISO/IEC 28033 (drafts)** — BGV and BFV (exact integers, ISO/IEC DIS 28033-2), CKKS (approximate real and complex numbers, DIS 28033-3) and TFHE/CGGI with FHEW (bits and small integers, FDIS 28033-4). No part is published yet. Every ciphertext carries noise that grows with each operation; bootstrapping refreshes it.
- **One small secret key, many large public keys** — the secret key can be regenerated from a 32-byte seed; the public encryption, relinearization, rotation and bootstrapping keys are large and need integrity protection. There is no standard encoding yet: no PKCS#11 or KMIP object type and no X.509 OID.
- **FHE does not work directly with AES** — an AES ciphertext has no structure a server can compute on. Transciphering runs the symmetric cipher's decryption inside FHE; TFHE-rs ships it for Kreyvium and AES-128-CTR.
- **Quantum threat** — lattice-based FHE has no known quantum break (it rests on the (Ring-)Learning With Errors family behind ML-KEM). The parts around the scheme, such as classical key exchange and signatures on the key set, are usually still classical and need a post-quantum fix.
- **The HSM as FHE key custodian** — generate a non-extractable 32-byte seed in the HSM, derive the secret key inside it, sign the parameter set and evaluation-key hashes with ML-DSA, decrypt under policy with an audit log, and back the seed up only HSM to HSM. The HSM can run key generation and decryption but not homomorphic evaluation. This is a deployment pattern; no FHE library or paper defines an HSM role. No standard PKCS#11 mechanism exists.
- **An HSM must not be a raw decryption oracle** — published attacks recover the key from decryptions of honestly computed ciphertexts. CKKS needs noise flooding on decryption; BFV, BGV and TFHE need negligible decryption-failure probability; the HSM releases only approved result shapes with rate limits.
- **Threshold FHE** — split the key across several parties so no single decryptor exists. OpenFHE (BFV, N-of-N) and Lattigo (BGV, t-of-N) implement it.

## Workshop / Interactive Activities

_FHE + HSM Flows_: step through six scenarios (CKKS and TFHE single-HSM custody, OpenFHE and Lattigo threshold FHE, what fits in the HSM, and Kreyvium transciphering). Each step shows who holds which key and which data state, and a quantum overlay marks the links a quantum computer breaks.

## Related Standards

- `ISO-IEC-28033`
- `tfhe-rs-v1.8.1`
- `openfhe-v1.6.0`
- `lattigo-v6.2.0`
- `fhe-rs-v0.1.1`
- `IACR-ePrint-2025-075`
- FIPS 203 (ML-KEM-768) and FIPS 204 (ML-DSA-65) for post-quantum signing and sealing of the key set and the seed backup
