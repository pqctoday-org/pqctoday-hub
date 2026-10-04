### What This Is About

Fully homomorphic encryption (FHE) lets a server do calculations on data that stays encrypted the whole time. The server returns an encrypted answer that only the data owner can open. Unlike a trusted-hardware enclave, it relies on mathematics instead of trusting a chip.

### Why It Matters

Whoever holds the secret key can open everything, and the public keys that make the computation possible are huge. Where the secret key lives, and who may ask for a decryption, decides whether the scheme protects anything.

### The Key Takeaway

Keep the FHE secret key inside a hardware security module and never let it act as a decryption service for anyone who asks: published attacks can recover the key from the answers.

### What's Happening

The international standard for FHE (ISO/IEC 28033) is still in draft, and open-source libraries such as TFHE-rs, OpenFHE and Lattigo already implement the schemes it covers.
