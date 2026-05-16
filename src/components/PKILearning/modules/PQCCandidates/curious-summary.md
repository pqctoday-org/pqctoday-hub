# PQC Candidates — The Curious Take

Think of post-quantum cryptography as an Olympic trial that never stops. NIST picked the first round of winners in 2024 — ML-KEM, ML-DSA, SLH-DSA, FN-DSA. But the trials are still running.

**Why?** Because we don't want all our eggs in one mathematical basket. If clever attackers find a flaw in lattice math (the family most of the first winners use), we need backup algorithms based on completely different math. So NIST opened a second competition just for signatures, and nine candidates from four totally different mathematical worlds are now in the final stretch.

**The four families, in plain English:**

- **MPC-in-the-Head** — Prove you know a secret by simulating what would happen if a group of people computed something together. The math relies on AES (the same cipher protecting your wifi). Signatures are pretty big, but the security argument is rock-solid.
- **Multivariate** — Build a giant puzzle of quadratic equations with a hidden shortcut. You can solve it; an attacker can't. Tiny signatures, huge keys. Some parameters got dinged by a clever attack in 2025 — fixes are in progress.
- **Isogeny** — Walk a graph of mathematical curves. Has the absolute smallest signatures of anything in the contest, fits in a single network packet. But the math is new and one cousin (SIKE) was broken spectacularly in 2022.
- **Lattice (the HAWK variant)** — Same family as the winners, but uses integers instead of decimal numbers. Easier and safer to implement on small devices.

**The bigger picture.** Korea is running its own competition (KpqC). China is running theirs (CACR). The ISO body is turning NIST winners into international standards. The Internet engineering folks at IETF decide which numbers to actually use in TLS, SSH, certificates. Lots of parallel work — and your software will eventually need to handle whichever combination your country / industry ends up using.

**What this means for you.** Don't bet on a single algorithm. Build your systems so you can swap crypto modules without rewriting your application. The phrase for this is _crypto-agility_ — and it's why this module exists.
