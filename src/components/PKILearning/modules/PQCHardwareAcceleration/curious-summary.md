### What This Is About

Post-quantum signatures can be made faster in several ways — wider CPU instructions, built-in hash instructions, graphics cards, custom chips (FPGAs and ASICs) and AI accelerators. This module explains each one with an everyday analogy, and checks the claims against our own measurements on a MacBook, an NXP i.MX 95 board and an AMD Kria KV260 board with an FPGA.

### Why It Matters

The two main post-quantum signatures spend their time in completely different places. ML-DSA is mostly arithmetic and is already fast; SLH-DSA is mostly hashing and can take seconds on a small chip. So the same accelerator gave us only +29% on ML-DSA, but took an SLH-DSA signature from 12 seconds to 69 milliseconds.

### The Key Takeaway

Speed comes from matching the accelerator to where the time actually goes — and from moving the work cheaply. Moving data to an accelerator and back often costs more than the work itself, one accelerator is shared by all the processor cores, and a chip can own a fast instruction that the software never uses.

### What's Happening

Newer Arm cores (like Apple's M4) add SHA-3 and SHA-512 instructions that older cores lack; Intel chips still have no SHA-3 instruction. Chip vendors are adding fixed post-quantum engines to secure elements and roots of trust, while GPU libraries such as NVIDIA cuPQC target very large batches of operations in data centres.
