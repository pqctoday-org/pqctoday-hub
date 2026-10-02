### What This Is About

Smart meters, sensors, wearables and gateways run on tiny chips with a few kilobytes of memory and slow radios. This module looks at how post-quantum cryptography fits on them: which algorithms they can run, how their software updates are signed, and how their networks carry the larger keys.

### Why It Matters

A device sold today may still be working in 15 years. If its update signatures can be forged by a future quantum computer, an attacker could install anything on it — and many devices can only be fixed by replacing them.

### The Key Takeaway

Small devices mostly check signatures rather than make them, and checking is much cheaper. Many post-quantum algorithms fit when built for low memory; signing and heavy handshakes are best left to servers and gateways.

### What's Happening

New laws such as the EU Cyber Resilience Act require secure updates for years after sale, and chip makers have started shipping security chips with post-quantum algorithms built in.
