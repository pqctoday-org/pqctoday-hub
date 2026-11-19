### What This Is About

Global governments and standards bodies—including NIST (NIST IR 8547, final October 2026), NSA (CNSA 2.0 FAQ v2.2 for U.S. National Security Systems), the EU (EU PQC Roadmap v1.1), ETSI, ANSSI, and BSI—are publishing direction for the transition to Post-Quantum Cryptography (PQC) with different legal force. Organizations operating internationally must verify scope and reconcile differing priorities: CNSA 2.0 sets pure-PQC milestones for U.S. National Security Systems (acquisitions from 1 January 2027, phase-out by 31 December 2030, mandated by 31 December 2031), EO 14412 and OMB M-26-15 mandate federal civilian agency HVAs/high-impact systems (2030 key establishment / 2031 digital signatures) plus a directed FAR contractor rule, while European agencies like ANSSI recommend a "Hybrid" phase (mandatory inside France's regulated perimeter) before full migration.

### Why It Matters

Failure to map compliance correctly means missing the dates that actually bind you — for example CNSA 2.0 acquisition milestones from 2027 for U.S. National Security Systems. Organizations cannot simply migrate unilaterally; they are gated by external dependencies such as FIPS 140-3 Cryptographic Module Validation Program (CMVP) queues and sector frameworks such as eIDAS 2.0 and DORA, which do not name PQC but require state-of-the-art cryptography and cryptographic agility. Furthermore, the June 2026 PQC Executive Order (EO 14412) directs CISA to publish guidance on the minimum elements of a Cryptographic Bill of Materials (CBOM), due 19 March 2027 (EO 14306 had earlier removed EO 14144's binding procurement trigger).

### The Key Takeaway

Many jurisdictions follow a two-phase arc — hybrid first, pure PQC later — but not all: CNSA 2.0 targets pure PQC and does not require hybrids. Organizations must construct a Jurisdiction Map to identify their earliest global deadlines, compile a strict CBOM to assess exposure, and prepare Audit Readiness Checklists aligned across all jurisdictions in which they operate.

### What's Happening

Compliance dates are arriving in overlapping waves: CNSA 2.0 sets dates for U.S. National Security Systems (new acquisitions from 1 January 2027, unsupported equipment phased out by 31 December 2030, its algorithms mandated by 31 December 2031 unless otherwise noted), ANSSI requires hybrid inside France's regulated perimeter and recommends it elsewhere, and the CMVP certification backlog means vendors must begin validation years in advance.
