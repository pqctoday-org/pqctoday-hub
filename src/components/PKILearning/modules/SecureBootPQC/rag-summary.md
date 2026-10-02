# Secure Boot & Firmware PQC

Module covering PQC migration for UEFI Secure Boot, firmware signing, TPM key hierarchies, and hardware attestation.

## Key Topics

- UEFI Secure Boot key hierarchy (PK/KEK/db) migration to ML-DSA-65
- Firmware signing with post-quantum algorithms
- TPM 2.0 path to post-quantum attestation
- Vendor roadmaps: AMI, Insyde, EDK2, Dell, HPE
- Hardware supply chain integrity at scale
- Boot-time signature verify latency on a microcontroller root of trust (Cortex-M4 class)

## Workshop Steps

1. Secure Boot Chain Analyzer
2. Firmware Signing Migrator
3. TPM Key Hierarchy Explorer
4. Firmware Vendor Matrix
5. Attestation Flow Designer
6. Boot Verify Latency — splits boot signature cost into SPI flash read time (signature + public key) and software verify time on a Cortex-M4-class MCU; adjustable SPI speed (1–20 MB/s) and clock (48–408 MHz). Outputs are model estimates.

## Boot Verify Latency — figures and sources (checked 2026-10-01)

| Algorithm   | Sig / pk (bytes)                             | Cortex-M4 verify cycles                   | Source                                   |
| ----------- | -------------------------------------------- | ----------------------------------------- | ---------------------------------------- |
| ECDSA P-256 | 64 / 64                                      | ~0.98 M (optimized asm; portable C 1–2 M) | Optimized Cortex-M4 assembly benchmarks  |
| RSA-3072    | 384 / 384                                    | ~25.3 M                                   | Oryx Embedded, STM32G4: 149 ms @ 170 MHz |
| ML-DSA-44   | 2,420 / 1,312 (FIPS 204)                     | ~1.42 M                                   | pqm4, m4f implementation                 |
| LMS H10/W4  | 2,508 / 56 (RFC 8554; HSS L=1 is 2,512 / 60) | ~2.66 M                                   | IACR ePrint 2020/470                     |

- At 2 MB/s SPI and 120 MHz: ECDSA ~8.2 ms, ML-DSA-44 ~13.7 ms, LMS ~23.4 ms, RSA-3072 ~211 ms total. Flash read is under 2 ms for every algorithm; verify time dominates.
- RSA-3072 software verify is the slowest of the four — larger PQC signatures do not make boot verify slow on an MCU.
- The 100 ms boot budget is an illustrative teaching value, not a standard; real budgets are product-specific.
- Model ignores firmware-image hashing (identical across algorithms), flash wait states, caches and crypto accelerators.

## Cross-References

- `iot-pqc` — IoT & Embedded Device PQC: memory, power and network constraints on constrained devices
