# SOC Implementation for PQC

## Overview

The SOC Implementation for PQC module equips SOC directors and senior analysts to build the quantum-related detection, threat-intelligence, and incident-response capabilities that have no equivalent in their current library. It maps quantum security onto existing detection infrastructure — the SIEM, network monitoring tools, and certificate management systems already in place — rather than introducing exotic quantum-specific technology. The SOC has a dual mandate: during migration it verifies that hybrid implementations are not silently downgraded and migrated systems do not drift back to classical-only cryptography; permanently after migration it maintains cryptographic posture, detects drift, and responds to the inevitable future algorithm transitions. The module covers five detection use cases, three-horizon Cyber Threat Intelligence, four incident-response playbooks, five named tabletop exercises, a SOC metrics summary, the recurring skills/tooling gaps, and a four-phase implementation roadmap. Source: Applied Quantum — The Applied Quantum PQC Migration Framework, "SOC Implementation" (pp. 165–175), CC BY 4.0.

## Prerequisite: Cryptographic Posture Registry

Every detection capability depends on one prerequisite: a queryable, continuously updated cryptographic posture registry that maps each system to its expected cryptographic configuration — hybrid, classical-only (pending migration), or PQC-only; the specific algorithms and cipher suites expected; and when the system's migration status last changed. The registry is a derivative of the Phase 1/2 cryptographic inventory and CBOM: the migration program builds it, the GRC function governs it, the SOC consumes it. If it lives in a quarterly GRC spreadsheet emailed around, the detection rules cannot function. It must be machine-readable and SIEM-integrated, ideally via API or automated feed — a Phase 1 architecture decision.

## Key Concepts

- **Use Case 1 — Hybrid Downgrade Detection** — SIEM correlation rules flag connections negotiating classical-only key shares (NamedGroups) when the registry expects hybrid; a TLS 1.3 session between two ML-KEM-capable systems should not complete using only ECDH. Severity High. Hybrid key exchanges are negotiated by IANA NamedGroup codepoints (ML-KEM-768, ML-KEM-1024, hybrid groups), not X.509 OIDs, so those codepoints must be added to traffic-analysis rules manually (1–2 weeks of custom engineering per platform as of mid-2026). The most common false positive is the organization's own middleboxes: oversized hybrid ClientHello messages are fragmented or stripped by legacy firewalls and SSL inspection proxies, forcing a benign fallback that looks identical to an attack.
- **Use Case 2 — Cryptographic Drift Monitoring** — Migration is not a one-time event; systems drift via new microservices on classical libraries, pre-migration backup restores, vendor updates reverting to RSA, and shadow IT. Continuous network monitoring alerts when a migration-complete system negotiates a classical-only key share (Medium, escalating to High on repeat). Tracked as the "Cryptographic Migration Coverage" metric — % of monitored TLS sessions using PQC or hybrid, measured weekly, trending monotonically toward 100% with regressions investigated within 24 hours. Requires east-west (internal) traffic visibility, not just north-south perimeter flows.
- **Use Case 3 — Certificate Lifecycle Anomalies** — The wholesale transition to ML-DSA/SLH-DSA certificates, new intermediate CAs, and reconfigured chains creates elevated risk. Detection targets: failed PQC certificate chain validations (Medium), unauthorized issuance from the internal CA using a PQC signature algorithm not on the approved list (High), and CA signing-key access outside scheduled windows during the transition (Critical). Tooling gap: Certificate Transparency monitoring for PQC certificates is immature, so the SOC may need custom monitoring around internal CA logs.
- **Use Case 4 — TNFL & Signature Integrity Monitoring** — Trust Now, Forge Later enables present-tense exploitation once an adversary can forge signatures (forged software updates, fabricated financial instructions, impersonation) — unlike HNDL, which compromises past data. Heightened monitoring of code-signing, software-update authentication, and automated signature-verification trust decisions (firmware, financial authorization, identity federation). Alert Critical on unexpected signing keys/identities or unusual signing times and on any change to production signature-verification policy; alert High on signing volume more than two standard deviations above baseline. Metric: MTD-Signing under 15 minutes for production code signing, measured via red-team exercises. Challenge: signing telemetry is fragmented across dev, OT, and PKI teams.
- **Use Case 5 — Enhanced HNDL-Indicator Detection** — The Harvest Now, Decrypt Later threat is active today. This is existing exfiltration monitoring with quantum-informed reprioritization by data sensitivity and longevity: a slow exfiltration of archived diplomatic correspondence or pharmaceutical R&D outweighs a one-time transactional dump. Alert High on sustained outbound transfers from segments hosting 10+ year secrecy data (even below DLP volume thresholds) and on bulk archival access by accounts that do not normally touch those systems. The "HNDL Exposure Score" composites DLP coverage, detection latency, and classification completeness; target 100% coverage for 10+ year stores with detection under 4 hours. Hard dependency on information-governance data classification.
- **Three-Horizon Cyber Threat Intelligence** — Tactical (hours–days): triage liboqs CVEs, hardware ML-KEM side-channels, and cryptanalysis papers with implementation impact; TTAssess-PQC target under 4 hours for deployed implementations; sources include the NIST PQC mailing list, IETF pquip/lamps, CERT and vendor advisories. Operational (weeks–months): watch adversary collection shifts toward long-lived archives and PQC supply-chain probing — a watch-and-wait posture since no campaign is publicly attributed as of mid-2026. Strategic (months–years): track quantum hardware against the CRQC Quantum Capability Framework (error correction, logical gate operations, decoder performance, continuous operation, engineering scale) and national programs, producing a quarterly Quantum Threat Landscape Assessment for the CISO. Strategic CTI is scarce — most organizations should borrow it.
- **Four Incident-Response Playbooks** — Developed during Phase 0 governance setup, each with trigger, immediate actions, coordination, and drill metric. (1) PQC Algorithm Vulnerability Disclosure — distinguish full algorithm break from implementation bug, query the registry for affected systems, deliver impact assessment under 4 hours, emergency-patch or activate crypto-agility rotation; needs a named incident commander and pre-authorized change windows. (2) Confirmed Hybrid Downgrade Attack — isolate the path, preserve packet captures, determine mechanism and scope, escalate to the CISO. (3) Credible CRQC Announcement — crisis communications and emergency migration; prior preparation matters most. (4) Emergency Algorithm Rotation — the SOC must not mistake an authorized rotation (mass revocations, cipher-suite changes, KMS spikes) for an attack; rotation-drill false-positive rate under 10%.
- **Five Named Tabletop Exercises** — Run at least annually with the migration program office, CISO, GRC, and application owners, each producing an after-action report: (1) The Friday Afternoon CVE; (2) The Ambiguous Cryptanalysis Paper; (3) Silent Downgrade; (4) The CRQC Announcement; (5) Signing Key Compromise.
- **Skills & Tooling Gaps** — The protocol-parsing gap (2–4 weeks of custom Suricata/Zeek/SIEM engineering per platform plus maintenance), the CTI skills gap (tactical in-house, strategic contracted externally over 12–18 months), and the east-west visibility gap (a prerequisite for drift monitoring).

## SOC Metrics Summary

| Metric                           | What it measures                                               | Target                                                       |
| -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| Cryptographic Migration Coverage | % of monitored TLS sessions using PQC or hybrid                | Monotonically increasing; regression investigated within 24h |
| Cryptographic Drift Incidents    | Systems reverting to classical-only after migration            | Zero; any non-zero value triggers investigation              |
| TTAssess-PQC                     | Time from PQC vulnerability disclosure to CTI assessment       | Under 4 hours for deployed implementations                   |
| Impact Assessment Speed          | Time from disclosure to identifying all affected systems       | Under 4 hours                                                |
| MTD-Signing                      | Mean time to detect unauthorized signing events                | Under 15 minutes for production signing keys                 |
| HNDL Exposure Score              | DLP coverage + detection latency + classification completeness | 100% coverage for 10+ year secrecy data stores               |
| Algorithm Rotation Drill FP Rate | False-positive rate during rotation exercises                  | Under 10%                                                    |

## SOC Implementation Roadmap

- **Phase 1 (0–3 months)** — Operationalize the posture registry for SOC access; stand up tactical CTI monitoring; draft the PQC Algorithm Vulnerability Disclosure playbook and run the first tabletop.
- **Phase 2 (3–9 months)** — Implement hybrid downgrade detection for priority segments; build/acquire PQC cipher-suite parsing; begin drift monitoring; run the first HNDL-focused data-classification/DLP review.
- **Phase 3 (9–18 months)** — Extend detection to full enterprise scope; integrate certificate lifecycle monitoring; implement TNFL signing-event monitoring; establish the quarterly Quantum Threat Landscape Assessment; run a full algorithm rotation drill.
- **Phase 4 (Ongoing)** — Refine rules from operational experience; update playbooks from exercise findings; report SOC quantum security metrics; adapt as implementations, standards, and the threat landscape evolve.

## Workshop / Interactive Activities

The workshop has 5 interactive steps:

1. **Why It Matters** — the five detection use cases presented as threat impacts with example scenarios and severities, plus the posture-registry prerequisite as the urgency statement.
2. **What to Learn** — detection-engineering, threat-intelligence, and incident-response skill gaps mapped to target levels and cross-linked modules.
3. **How to Act** — a phased action plan mirroring the four-phase SOC Implementation Roadmap, with quick wins and the SOC metrics as KPIs.
4. **Detection Coverage Planner** — an interactive planner over the five detection use cases; each capability cycles Not started → Building → Operational and the SOC detection coverage score updates live with prioritization guidance.
5. **SOC Readiness Self-Assessment** — a nine-criterion checklist (posture registry, NamedGroup parsing, east-west visibility, unified signing view, data classification, tactical CTI, strategic CTI, drafted playbooks, tabletop run) producing a readiness band and next-step guidance.

## Related Standards

- FIPS 203 (ML-KEM — the key-encapsulation NamedGroups hybrid downgrade detection must parse)
- FIPS 204 (ML-DSA — certificate and code-signing signatures behind certificate-lifecycle and TNFL monitoring)
- FIPS 205 (SLH-DSA — stateless hash-based signatures in the PQC certificate hierarchy)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — hybrid configuration basis)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards — program context the posture registry derives from)
- RFC 8446 (TLS 1.3 — where hybrid key shares are negotiated by NamedGroup codepoints, not X.509 OIDs)

## Cross-References

- `ops-quantum-impact` — operational downgrade/drift handling, monitoring threshold recalibration, certificate operations at scale
- `tls-basics` — TLS 1.3 cipher suites, key shares, and the NamedGroup negotiation downgrade detection inspects
- `network-security-pqc` — east-west visibility, Suricata/Zeek PQC parsing, hybrid key exchange on the wire
- `pki-workshop` — certificate chains, internal CA operations, and PQC certificate issuance monitored in Use Case 3
- `code-signing` — code/firmware signing telemetry unification behind TNFL monitoring
- `crypto-agility` — the algorithm-rotation capability Playbook 1 and Playbook 4 invoke
- `research-quantum-impact` — strategic CTI inputs: arXiv preprints, resource-estimation models, CRQC hardware milestones
- `migration-program` — the Phase 1/2 inventory and CBOM that produce the cryptographic posture registry
