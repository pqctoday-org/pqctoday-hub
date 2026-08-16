# Trust Services & Signature Longevity — In Simple Terms

## What This Is About

When you sign a mortgage, a will or a land registry entry electronically, that signature has to stay provable for decades. The certificate behind it expires in a year or two. The revocation records that prove it was good at the time disappear after a few more. And eventually the algorithm itself gets broken. This module is about how a signature stays believable long after everything that originally supported it has gone.

## Why It Matters

The answer is timestamping. A trusted authority signs a hash of your document together with the time, which fixes the moment the signature existed. That is what lets a court accept a signature made with a certificate that has since expired, or with an algorithm since broken — because the evidence points at the moment it was made rather than at today.

## The Key Takeaway

The deadline that matters is not the day quantum computers arrive. It is the day by which every signature you have _already_ made must be re-stamped using a quantum-safe algorithm. That work scales with the size of your archive, not with how many new documents you sign — and it has to be planned when the document is signed, because once the supporting evidence has aged out it cannot be recovered.

## What's Happening

Europe's rulebook has already moved. The ETSI cryptographic suites standard was updated in June 2026 to add the new quantum-safe signature algorithms and, importantly, hybrid modes where a classical and a quantum-safe signature must _both_ be valid. That is the opposite of the American position for national security systems, where hybrids are not required. Same algorithms, two authorities, opposite defaults — which one applies to you depends on where you operate, not on the mathematics.
