# Quantum Threats — In Simple Terms

## What This Is About

Public-key systems use math problems (including factoring and discrete logarithms) that are hard for classical computers. A sufficiently capable Cryptographically Relevant Quantum Computer (CRQC) running Shor's algorithm could break RSA and elliptic-curve cryptography. No such machine is publicly known to exist, and estimates vary.

## Why It Matters

Government security agencies warn about "Harvest Now, Decrypt Later": an adversary may record selected encrypted sessions now and later recover their secrets if those sessions used quantum-vulnerable key establishment. Long-lived sensitive data carried in such sessions can therefore face future confidentiality risk. This does not mean every encrypted file, archive or network session is exposed.

## The Key Takeaway

Waiting for a quantum computer to appear before reacting could be too late for long-lived secrets in vulnerable recorded sessions. Organizations should identify the key-establishment and protection used for their sensitive data, then plan migration to applicable post-quantum standards (including NIST FIPS 203, 204 and 205) according to their risk and requirements.

## What's Happening

Several governments have published transition timelines. The U.S. has the most specific ones: CNSA 2.0 for National Security Systems and Executive Order 14412 for federal agencies. Others, such as the UK NCSC and the EU's coordinated roadmap, publish target dates and guidance rather than binding rules for everyone.

## Signatures and Long-Term Evidence

A future quantum attacker who recovers a classical signing key could create new signatures that verify under that key. That does not change old signed files. Trusted timestamps and preserved certificate or archive records can help show when an artifact existed; RFC 3161 describes proof-of-existence timestamps. Their usefulness depends on trusted time and sound long-term evidence handling.
