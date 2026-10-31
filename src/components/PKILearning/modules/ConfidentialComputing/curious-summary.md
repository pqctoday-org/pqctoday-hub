### What This Is About

Confidential Computing uses hardware-based Trusted Execution Environments (TEEs) to protect Data-in-Use. Unlike standard volume encryption (Data-at-Rest) or TLS (Data-in-Transit), TEE enclaves encrypt data transparently within the processor's DRAM. This hardware isolation provides guarantees that even if the host operating system, hypervisor, or cloud administrator is fully compromised, code and data remain inaccessible from the outside.

### Why It Matters

Quantum computers threaten the TEE trust model in two ways. Grover's algorithm roughly halves the effective strength of symmetric keys (a crude figure): memory encryption with 128-bit AES keys drops to about 64 bits. Shor's algorithm, run on a cryptographically relevant quantum computer, could break the public-key signatures that remote attestation relies on: an attestation report is signed by the TEE's attestation key, and Intel documents ECDSA-based attestation for its SGX processors. An attacker who could forge those signatures could impersonate an enclave and receive secrets provisioned from an HSM.

### The Key Takeaway

All attestation chains are currently quantum-vulnerable. Hardware vendors must rapidly upgrade CPU architectures to support AES-256 for memory encryption, while the ecosystem transitions Remote Attestation protocols to Post-Quantum signatures (ML-DSA) to guarantee trusted TEE-HSM communication.

### What's Happening

Hardware vendors are beginning to evaluate AES-256 upgrades for TEE memory encryption engines and exploring ML-DSA integration into Remote Attestation protocols, as the quantum threat to classical ECDSA attestation signatures across Intel SGX/TDX, AMD SEV-SNP, and ARM CCA becomes increasingly urgent.
