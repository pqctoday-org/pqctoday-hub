# Cryptography Bill of Materials — In Simple Terms

## What This Is About

A Cryptography Bill of Materials (CBOM) is a machine-readable list of all the cryptography an organization actually uses — the algorithms, keys, certificates and protocols, and where each one lives. It extends the idea of a Software Bill of Materials (SBOM): the SBOM lists your software, the CBOM lists the cryptography inside it.

## Why It Matters

You cannot migrate to post-quantum cryptography what you cannot find. Most enterprises have a long tail of "ghost" cryptography — forgotten certificates, hardcoded algorithms, crypto buried in cloud services — that never appears in any inventory, and that is exactly where the risk hides. A good CBOM is built by combining the discovery tools you already run with targeted net-new scanning, then normalizing everything into one standard format you can query.

## The Key Takeaway

A CBOM only becomes useful when it is complete, normalized, and machine-verifiable: every cryptographic asset discovered across source code, binaries, the network, infrastructure and the cloud; named consistently despite the many competing standards; tied to a key you can identify and trace; and checkable by policy-as-code so you can prove what is quantum-safe and what is not.
