### What This Is About

A post-quantum migration is a multi-year program, and someone has to staff it. This module shows how to build the team: the core roles you need, how big the team should be, what to build in-house versus buy from outside, and how to train everyone.

### Why It Matters

The mix of skills PQC needs — deep cryptography, large-scale program management, and hands-on network/app/OT expertise — almost never sits in one person. Trying to hire a whole team of specialists is unrealistic. Instead, you build a small expert core, upskill the staff you already have, and bring in scarce specialists only where you must.

### The Key Takeaway

Team size follows your cryptographic estate, not your employee count. The rule of thumb is one dedicated person per 500 cryptographic "instances" (certificates, keys, TLS endpoints, HSMs) in the first couple of years, easing to one per 1,000 once tooling matures. A 50,000-person bank with a sprawling crypto estate needs a bigger team than a 200,000-person manufacturer whose crypto is concentrated in one platform.

### What's Happening

Leading programs designate a "crypto champion" on every platform team — web, mobile, data, infrastructure, OT, identity — so the program scales without every developer becoming a cryptographer. Champions sign off on crypto readiness in design reviews and shepherd library upgrades, and after migration they become a permanent network, much like long-running security champion programs.
