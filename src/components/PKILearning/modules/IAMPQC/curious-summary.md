# Identity & Access Management PQC — In Simple Terms

## What This Is About

Identity and Access Management (IAM) combines passwords, symmetric authenticators, public-key signatures, key exchange, and policy checks. Protocols such as SAML, JWT, and Kerberos use different combinations of these mechanisms.

## Why It Matters

Adversaries are actively capturing and storing these secure exchanges today. Kerberos is the highest priority risk: breaking a captured PKINIT exchange could expose that client's session key for as long as its ticket is valid; forging tickets for any account is a Golden Ticket, which needs the KRBTGT key and is a classical key-theft attack.

## The Key Takeaway

Public-key token signatures may need a post-quantum migration, but there is no universal rollout date or rule assigning ML-DSA parameter sets by token lifetime or application type. Choose algorithms and deployment profiles from applicable standards, vendor support, security requirements, interoperability, and measured size/performance constraints. HMAC-signed tokens have a different quantum-risk analysis.

## What's Happening

Our product catalogue records no post-quantum token signing for most of the identity providers this module lists, so Active Directory teams should plan the Kerberos PKINIT upgrade once Microsoft documents it; protect the KRBTGT key separately.
