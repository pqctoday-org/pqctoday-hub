### What This Is About

Payments run on two halves that share cryptography, share vendors and increasingly share deadlines, but are usually migrated by different teams reading different documents. One half is cards: EMV is the global chip standard protecting 14.7 billion cards in circulation at the end of 2024, and when a card is used offline, authentication rests entirely on a chain of RSA certificates. The other half moves money between institutions — Swift messaging, domestic RTGS, correspondent banking chains — plus the bank key management and sector regulation around them.

### Why It Matters

A quantum computer able to break RSA-2048 could forge EMV certificates, letting criminals create counterfeit cards that pass offline terminal checks. Point-of-sale estates face a second exposure at Key Injection Facilities, where an RSA-wrapped Base Derivation Key protects millions of transactions — compromise it and every past and future key derived from it falls with it. On the banking side the threat is different: settlement traffic is long-lived and traverses parties you do not control, so harvest-now-decrypt-later exposure multiplies along a correspondent chain no single institution can migrate alone.

### The Key Takeaway

Because ML-DSA signatures (2,420 bytes) are large for constrained smart cards, the card industry is focused on FN-DSA (Falcon), whose 666-byte signatures fit card memory — though FIPS 206 is still in preparation, so it is not yet deployable. Unlike government, the financial sector has no dated algorithm mandate: the pressure comes from operational-resilience regulation and from how long data stays sensitive. Plan against the 3-5 year card replacement cycle, because cards issued today will still be in wallets at the end of the decade.

### What's Happening

Seven bodies across five jurisdictions now publish financial-sector PQC direction — BIS Project Leap, the G7 Cyber Expert Group, UK CMORG, the Europol Quantum Safe Financial Forum, FS-ISAC, MAS and DORA — and which one binds an institution depends on where it is regulated, not where it operates. EMVCo does not expect quantum computing to threaten EMV infrastructure before 2040, and says it may never; it is nevertheless considering mitigations for offline authentication and expects PQC to enter remote-payment protection in due course. Mastercard has published migration guidance and described prototype testing, Visa has published a quantum-readiness sequence for stablecoins and digital payments, and American Express publicly describes an enterprise readiness program. UnionPay and Discover have no network-specific public roadmap in this review, so their likely next steps are labelled as dependency-based inference rather than official commitments.
