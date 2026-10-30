# 5G Security — In Simple Terms

## What This Is About

Pre-5G networks exposed subscriber identities to "IMSI catchers." 5G fixes this with SUCI concealment, ensuring privacy over the airwaves. However, the current encryption method (ECIES) is vulnerable to quantum computer attacks.

## Why It Matters

"Harvest now, decrypt later" is the risk: someone could record encrypted cellular traffic today and decrypt it once quantum computers arrive. ATIS describes roaming signalling between operators as exposed to this threat. Without quantum protection, the mobile privacy of 5G subscribers could be stripped retroactively, allowing attackers to track past movements.

## The Key Takeaway

The fix everyone points to is a post-quantum SUCI scheme built on ML-KEM, usually called "Profile C". Be careful with that name: **3GPP has not standardised it.** TS 33.501 Annex C defines exactly three schemes — the null-scheme, Profile A and Profile B — and both real profiles are ECIES. "Profile C" and its 0x3 identifier come from a research proposal, not from the standard.

So the honest position is that the quantum weakness in SUCI concealment is real and the ML-KEM answer is well understood, but there is nothing to comply with yet. Treat Profile C as the shape of the likely fix, not as a specification you can implement against.

## What's Happening

Quantum-safe schemes need heavier processing and larger messages, so operators and equipment makers need to plan how to adopt them without degrading network latency. As of TS 33.501 Release 19 (V19.5.0, February 2026), the guidance comes from bodies such as ATIS and GSMA, and 3GPP has not specified a post-quantum protection scheme for subscriber identities.
