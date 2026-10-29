# Government & Defense PQC — In Simple Terms

## What This Is About

Most organisations decide for themselves when to adopt post-quantum cryptography. US government systems do not. A stack of laws, executive orders and policies turns it into a requirement with dates attached — and the dates depend on which kind of system you run. National Security Systems follow one instrument with hard deadlines; federal civilian agencies follow a different set of rules: inventories, reports and migration plans, plus, since June 2026, their own dated deadlines for their most important systems (key exchange moved by the end of 2030, digital signatures by the end of 2031).

## Why It Matters

The deadlines reach much further than government itself. From 1 January 2027, CNSA 2.0 algorithms will be required in all new acquisitions for National Security Systems. Separately, the rules covering Controlled Unclassified Information reach contractors, universities and suppliers who never go near a classified system. A June 2026 executive order also directs a proposed rule that would require covered contractors to comply with NIST's Federal Information Processing Standards, including all applicable ones that cover post-quantum algorithms, by the end of 2030. If you sell to the US government, someone else's deadline has become yours.

## The Key Takeaway

Only the public-key half of the estate is being replaced. The NSA suite swaps out key exchange and digital signatures, but AES-256 encryption and the SHA hash functions carry on essentially unchanged. Budgeting to "replace all our cryptography" overstates the work considerably — the honest first step is finding out which half of your systems is actually affected.

## What's Happening

The dates are set: new purchases must use the new algorithms from January 2027, equipment that cannot be upgraded must be gone by the end of 2030 unless an exception is granted, and, unless otherwise noted, the new algorithms become mandatory at the end of 2031. One practical wrinkle catches people out — the 2022 advisory called the algorithms Kyber and Dilithium, while the October 2026 update calls the same things ML-KEM and ML-DSA. Because the two documents use different names for the same algorithms, searching your own estate for only one set of names will quietly miss half of what you have.
