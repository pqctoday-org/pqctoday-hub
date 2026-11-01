### What This Is About

Fully homomorphic encryption (FHE) lets a server do calculations on data that stays encrypted the whole time. The server returns an encrypted answer that only the data owner can open. Unlike a trusted-hardware enclave, it relies on mathematics instead of trusting a chip.

### Why It Matters

Whoever holds the secret key can open everything, and the public keys that make the computation possible are huge. Where the secret key lives, and who may ask for a decryption, decides whether the scheme protects anything.

### The Key Takeaway

FHE keeps data hidden from the server, but it is much slower than ordinary computing and suits some kinds of data better than others. Its secret key is best kept inside a hardware security module, and whoever is allowed to ask that module to decrypt can, in principle, recover the key from the answers, so who may ask decides how well the data is protected.

### What's Happening

Standardisation of FHE is very active, for example under ISO/IEC 28033, though performance is still a concern for some applications.
