# PQC Candidates — The Curious Take

Think of post-quantum cryptography as an Olympic trial that never stops. FN-DSA (FIPS 206) has not been published yet, not even as a draft.

**Why?** Because we don't want all our eggs in one mathematical basket. If clever attackers find a flaw in lattice math (the family most of the first standards use), we need backup algorithms based on completely different math. So NIST opened a second competition just for signatures. In May 2026 it moved nine candidates from four different mathematical worlds to a third round of evaluation (one, HAWK, has since withdrawn). NIST has not said when standards from this round will come.

**The four families, in plain English:**

- **MPC-in-the-Head** — Prove you know a secret by simulating what would happen if a group of people computed something together. The security rests on well-studied building blocks such as AES (the same cipher protecting your wifi). Signatures are pretty big; the security arguments are well understood but, like every candidate, still under review.
- **Multivariate** — Build a giant puzzle of quadratic equations with a hidden shortcut. You can solve it; an attacker can't. Tiny signatures, huge keys. Some parameters got dinged by a clever attack in 2025 — fixes are in progress.
- **Isogeny** — Walk a graph of mathematical curves. Among the smallest signatures in the contest, small enough to fit in a single network packet. But the math is new and one cousin (SIKE) was broken spectacularly in 2022.
- **Lattice (the HAWK variant)** — Same family as the first standards, but uses integers instead of decimal numbers, which makes it easier to implement on small devices. Its team withdrew it in July 2026 after a new attack, so it is no longer in the running.

**The bigger picture.** Korea ran its own competition (KpqC), which picked its winners in January 2025. China is running its own (CACR). The ISO body is turning NIST's standards into international standards. The Internet engineering folks at IETF decide how to actually use them in TLS, SSH and certificates. Lots of parallel work — and your software will eventually need to handle whichever combination your country / industry ends up using.

**What this means for you.** Don't bet on a single algorithm. Build your systems so you can swap crypto modules without rewriting your application. The phrase for this is _crypto-agility_ — and it's why this module exists.
