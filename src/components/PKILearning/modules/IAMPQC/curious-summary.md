# Identity & Access Management PQC — In Simple Terms

## What This Is About

Identity and Access Management (IAM) is built entirely on cryptographic signatures. Every time you log in, protocols like SAML, JWT, or Kerberos use math to assert your identity.

## Why It Matters

Adversaries are actively capturing and storing these secure exchanges today. Kerberos is the highest priority risk: if a quantum computer breaks the initial RSA authentication exchange (PKINIT), the attacker could forge tickets and move laterally across an entire enterprise network, creating a catastrophic "Quantum Golden Ticket."

## The Key Takeaway

All enterprise token signing will soon migrate to the new ML-DSA (FIPS 204) standard. Because ML-DSA comes in different sizes, engineers will calibrate it to the task: ML-DSA-44 for short-lived access tokens, ML-DSA-65 for enterprise SAML logins, and ML-DSA-87 for highly classified government infrastructure.

## What's Happening

Our product catalogue records no post-quantum token signing for most of the identity providers this module lists, so Active Directory teams should plan the Kerberos PKINIT upgrade that prevents the catastrophic "Quantum Golden Ticket" scenario before vendors deliver it.
