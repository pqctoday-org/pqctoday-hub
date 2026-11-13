### What This Is About

This module compares ways to speed up post-quantum signatures — wider CPU instructions, built-in hash instructions, graphics cards and custom chips (FPGAs and ASICs) — and examines whether AI accelerators support the required workload. This module explains each one with an everyday analogy, and checks the claims against our own measurements across Apple M4 Pro/M5 Max, NXP i.MX95, AMD Kria KV260, Ventuno Q and an AMD AI X1 Pro, plus focused KV260 FPGA experiments.

### Why It Matters

The two main post-quantum signatures spend their time in completely different places. ML-DSA is mostly arithmetic and is already fast; SLH-DSA is mostly hashing and can take seconds on a small chip. So on our KV260 board the FPGA gave only +29% on ML-DSA, but took an SLH-DSA-SHAKE-128s signature from 2.12 seconds on the board's own CPU to 69 milliseconds.

### The Key Takeaway

Speed comes from matching the accelerator to where the time actually goes — and from moving the work cheaply. Moving data to an accelerator and back often costs more than the work itself, one accelerator is shared by all the processor cores, and a chip can own a fast instruction that the software never uses. The X1 tests make this concrete: AVX-512/IFMA helped the measured RSA path, but explicit VAES candidates were correct and slower, so they were not deployed.

### What's Happening

Newer Arm cores (like Apple's M4) add SHA-3 and SHA-512 instructions that older cores lack; x86 has AVX2, AVX-512/IFMA, AES-NI and SHA-NI but no SHA-3 instruction. The common benchmark also measures ML-DSA + ECDSA hybrid signatures and ML-KEM + X25519 hybrid KEMs directly inside the HSM. Chip vendors are adding fixed post-quantum engines to secure elements and roots of trust, while GPU libraries such as NVIDIA cuPQC target very large batches of operations in data centres.

The model-fit exercises compare actual measured GPU batches where the CPU wins and where the GPU wins. A separate exact arithmetic example reconstructs a large number from three bytes: small arithmetic units do not make the mathematics impossible, but the chosen backend still needs working kernels and an efficient way to move and recombine the data. The i.MX95 PQC NPU discussion is a desk assessment, not a measured cryptographic implementation.
