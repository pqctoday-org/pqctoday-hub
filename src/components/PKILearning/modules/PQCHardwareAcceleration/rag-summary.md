# PQC Hardware Acceleration

## Overview

This module explains how post-quantum signature algorithms are accelerated and why the same accelerator helps ML-DSA and SLH-DSA very differently. It covers seven acceleration models (scalar CPU, SIMD vector units, dedicated crypto instructions, GPU, FPGA, ASIC/secure element, NPU), the five primitives they target (Montgomery reduction, the NTT, the Keccak permutation, SHA-3, SHAKE), and the practical limits of offloading (area, clock, CPU↔accelerator round trip, sharing one engine between cores, batch vs latency). Every performance claim is either PQC Today's own measurement — on an Apple M4 Pro, an NXP i.MX 95 (6× Cortex-A55) and an AMD Kria KV260 (4× Cortex-A53 + FPGA) — or a clearly labelled published source.

## Key Concepts

- **Where the time goes** — ML-DSA: NTT polynomial arithmetic mod 8,380,417 plus SHAKE sampling inside a rejection loop (~4–5 attempts per signature); SLH-DSA: almost pure hashing (about two million Keccak permutations per SLH-DSA-SHAKE-128s signature); RSA/ECC: Montgomery big-integer arithmetic
- **Montgomery reduction** — modular multiplication without trial division (Montgomery 1985; FIPS 204 Appendix A)
- **NTT** — 256-coefficient polynomial multiplication in ~3,300 instead of 65,536 multiplications; ML-DSA uses a full 8-layer NTT, ML-KEM (q = 3,329) a 7-layer one
- **Keccak / SHA-3 / SHAKE** (FIPS 202) — 24-round bitwise permutation of a 1,600-bit state; SHA3-256 and SHAKE256 use rate 1,088 / capacity 512, SHAKE128 rate 1,344 / capacity 256
- **Instruction sets** — Arm FEAT_SHA256/AES (optional since Armv8.0) and FEAT_SHA512/FEAT_SHA3 (Armv8.2 extension; EOR3, RAX1, XAR, BCAX); Cortex-A53/A55 have AES and SHA-256 but not SHA-512 or SHA-3; Apple M4 has both. x86 has AES-NI and SHA-NI (SHA-1/SHA-256 only), SHA-512 instructions only from Arrow Lake-S/Lunar Lake, and no SHA-3/Keccak instruction
- **Measured: the instruction set picks the variant** — on today's engine SLH-DSA-SHA2-128s signs 9–12× faster than SLH-DSA-SHAKE-128s on every CPU (M4 Pro 124 vs 13.5/s, i.MX 95 10.9 vs 0.94/s), while the KV260's FPGA reverses it (SHAKE-128s 13.0/s = 96% of the whole M4 Pro CPU's 13.49/s, which does not yet use its SHA-3 instructions); SHA-256 runs ~3× faster than SHA-512 on those cores
- **Measured: owning an instruction is not using it** — AES ran in software until a build flag was set (7–13× after); SLH-DSA's Keccak did not use the M4's SHA-3 instructions, and switching them on (A/B on the M4 Pro) gave only 1.17–1.21×; an AWS-LC Montgomery kernel tuned for server cores was 22–62% slower than scalar code on the A55
- **Measured: AWS-LC NEON on vs off (M4 Pro)** — ML-DSA sign/verify about 4×, ML-DSA-65/87 keygen 7.7–8.3×, ML-KEM-768 decapsulation 1.5×
- **Measured: KV260 FPGA on vs off, same board** — SLH-DSA-SHAKE-128s signing 0.46 → 13.0/s (28.4×); the KV260's lead over the i.MX 95 on SLH-DSA-SHAKE is entirely the fabric
- **Measured: board engine update (2026-09-27)** — RSA-OAEP decrypt 2×, AES-GCM 16 KiB 6–7.6×, small-AES multi-core scaling 3.2–5×, on both the KV260 and the i.MX 95 Pro
- **Measured: FPGA outcomes** — KV260 ML-DSA-65 with two FPGA signers: 404.45 → 522.50 sign/s (+29.2%), capped by ARM-side work (key decode, ExpandA, copies, cache sync, PKCS#11); SLH-DSA-SHAKE-128s with a 4-lane Keccak engine at 240 MHz: 12.3 s → 69 ms per signature
- **Measured: software can overtake hardware** — after the engine moved ML-DSA onto AWS-LC's NEON assembly, the KV260's A53 alone signed ML-DSA-65 at 2,675/s (2026-09-26), about five times the older FPGA-assisted figure
- **FPGA: narrow but powerful** — built for one workload (SLH-DSA-SHAKE signing), the KV260's FPGA is 13–15× faster than the i.MX 95 CPU and reaches 84–97% of a whole Apple M4 Pro CPU; on every other workload it adds nothing
- **FPGA limits** — LUTs, flip-flops, DSP slices and block RAM (KV260: 117,120 LUTs, 144 BRAM tiles); the clock is set by the design's critical path (the 4-lane engine missed 250 MHz by 0.010 ns and ships at 240 MHz); per-call round-trip cost (first Keccak engine: 1,481 µs fixed + 58.7 µs per hash vs ~12 µs on the A53); one engine shared by all cores
- **GPU** — throughput, not latency: our Metal ML-DSA-65 key generation lost to the CPU at a batch of 256 and won 9.3× at 65,536; NVIDIA cuPQC's published ML-KEM figures (175×/120×/135× vs one CPU core) were measured on an H100 (Hopper), but cuPQC also supports Ampere GPUs including the embedded Jetson Orin (compute capability 8.7)
- **ASIC** — same bus and sharing limits as an FPGA, plus fixed parameter sets at tape-out (Caliptra's Adams Bridge supports ML-DSA-87 and ML-KEM-1024 only); OpenTitan verifies boot images with SLH-DSA-SHA2-128s on its SHA-256 block
- **NPU** — int8 multiply-accumulate arrays for neural networks; evaluated for the i.MX 95 and ruled out for PQC (exact modular arithmetic, bitwise Keccak, per-stage round trips)

## Workshop / Interactive Activities

The workshop has 5 steps:

1. **Acceleration Models, Explained** — seven models, each with an everyday analogy, an animated mechanism diagram and a fit grid (ML-DSA, SLH-DSA, single op, big batch)
2. **Building Blocks, Explained** — Montgomery (worked decimal example), NTT butterfly network, Keccak round steps, SHA-3 and SHAKE sponges
3. **Our Measurements** — sign throughput on M4 Pro, i.MX 95 and KV260 for 12 algorithms; before/after the engine update
4. **FPGA Limits Lab** — resource budget, clock-vs-critical-path slider, anatomy of the +29% ML-DSA result
5. **Offload, Sharing and Batching** — round-trip break-even calculator, shared-engine concurrency, GPU batch crossover

## Related Standards

- FIPS 202 (SHA-3 / SHAKE)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- FIPS 205 (SLH-DSA)
- CRYSTALS-Dilithium (TCHES 2018) — AVX2 implementation results
- SPHINCS+ (CCS 2019)
