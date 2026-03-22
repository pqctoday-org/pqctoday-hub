# Email Signing PQC — In Simple Terms

## What This Is About
Enterprise email security is powered by Cryptographic Message Syntax (CMS) and S/MIME. It uses digital signatures to definitively prove the sender's identity, and encryption to securely protect the message contents.

## Why It Matters
Classical S/MIME relies on RSA "key transport", which directly encrypts the central message key and is totally vulnerable to Shor's algorithm. To survive quantum threats, PQC replaces this entirely by utilizing a Key Encapsulation Mechanism (KEM) to securely derive a shared secret instead.

## The Key Takeaway
Migrating S/MIME is uniquely difficult because it strictly requires bidirectional compatibility—both the sender and recipient must support the same algorithms simultaneously. Furthermore, new ML-DSA signatures are significantly larger (3.3 KB vs 72 bytes), which heavily impacts mobile clients.

## What's Happening
The IETF LAMPS working group has successfully published RFCs to natively bring PQC into CMS infrastructure, explicitly standardizing ML-DSA for message signing (RFC 9882) and KEM-based combinations for message encryption (RFC 9629).
