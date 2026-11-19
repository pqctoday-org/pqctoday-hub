### What This Is About

Power grids run on equipment designed to last 15 to 25 years, from high-voltage substation protection relays to millions of smart meters. Moving energy infrastructure to post-quantum cryptography (PQC) is not a simple software swap — protection relays must trip in under 4 milliseconds, and narrowband smart-meter radios cannot carry multi-kilobyte quantum-safe signatures on every packet.

### Why It Matters

If a utility tries to drop large post-quantum signatures straight into real-time substation links, protection messages miss their timing budgets. At the same time, waiting 20 years for field equipment to retire leaves long-lived grid topology records, control-center links, and customer metering archives exposed to harvest-now-decrypt-later interception.

### The Key Takeaway

Keep fast symmetric cryptography (`HMAC-SHA-256` and `AES-256`) on real-time protection and constrained meter links, move key distribution and WAN gateways (`TLS 1.3` RFC 10024 and `IKEv2` RFC 9370) to hybrid `ML-KEM-768` first, and build PQC firmware verification (`LMS-SHA256` or `ML-DSA`) into every new equipment RFP now.

### What's Happening

NIST finalized NIST IR 8547 in October 2026 (2030 classical deprecation, 2035 disallowance), while energy regulations remain layered: NERC CIP and EU NIS2 govern cybersecurity risk management without setting standalone PQC algorithm deadlines, whereas the non-binding EU PQC Roadmap v1.1 targets 2030/2035 milestones and US federal power systems follow EO 14412 and OMB M-26-15.
