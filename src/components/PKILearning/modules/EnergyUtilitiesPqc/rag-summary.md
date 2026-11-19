---
module_id: energy-utilities-pqc
title: Energy, Utilities & Grid PQC
track: Industries
difficulty: intermediate
duration: 50 min
workshop_steps: 4
---

# Energy, Utilities & Grid PQC

## Topics Covered

- Power-grid quantum threat model: harvest-now-decrypt-later (HNDL) confidentiality exposure on long-lived control-center telemetry, topology models, and customer metering histories, paired with high-consequence integrity risks on telecontrol and field-device firmware signing
- Distinguishing operational grid services (SCADA telemetry/control service, AMI head-end collection service, substation firmware-update service) from protected assets (long-lived grid topology records, customer metering histories, field IED root-of-trust keys)
- Substation real-time protection constraints: IEC 61850 GOOSE and Sampled Values (SV) under IEC 62351-6 enforce strict <4 ms tripping budgets on 1,500-byte Layer 2 Ethernet frames; multi-kilobyte ML-DSA-44 (2,420 B) or ML-DSA-65 (3,309 B) signatures cannot sit inside the tripping loop — retain symmetric HMAC-SHA-256 (32-byte MAC) / AES-256-GCM on the real-time data plane while securing out-of-band key distribution (GDOI RFC 8052 / TLS 1.3 RFC 9846 + RFC 10024) with ML-KEM-768
- SCADA telecontrol and WAN gateways: DNP3-SA (IEEE 1815) uses symmetric HMAC-SHA-256 per-message authentication with PQC-protected update-key distribution; deploy hybrid ML-KEM-768 over TLS 1.3 (RFC 10024, X25519MLKEM768) and IKEv2 (RFC 9370) across both primary fiber and backup microwave/cellular failover links
- AMI smart-meter meshes (DLMS/COSEM, IEC 62056-5-3 over 127-byte IEEE 802.15.4g RF-mesh or NB-IoT) and DER/inverter edge gateways (IEEE 2030.5): separate 15–25 year hardware replacement windows from interim compensating controls (collector/gateway PQC VPNs and diversified 256-bit symmetric session keys) while specifying LMS-SHA256 (NIST SP 800-208) or ML-DSA firmware verification in next-generation RFPs
- Regulatory scoping without overclaiming: NERC CIP (CIP-005/007/010/011/012/013) governs North American Bulk Electric System (BES) cyber controls without setting a standalone PQC algorithm deadline; EU NIS2 sets cybersecurity risk-management duties for critical energy entities and does not set a fixed PQC deadline (2030/2035 targets come from the non-binding EU NIS Cooperation Group PQC Roadmap v1.1); US federal civilian energy systems (e.g., federal power marketing administrations) follow EO 14412 and OMB M-26-15 alongside NIST IR 8547 (final October 2026)

## Workshop

1. Grid Protocol Mapper — Interactive architecture mapper across Generation/Transmission Substation, SCADA Control Center, AMI Smart-Meter Mesh, and DER/Inverter Edge showing services vs. protected assets, latency budgets, and PQC migration patterns
2. Substation MTU & Latency Lab — Interactive byte-size and latency budget checker comparing ECDSA P-256, RSA-2048, ML-KEM-768, ML-DSA-44/65, and HMAC-SHA-256 across IEC 62351, DNP3-SA, RF-mesh, and ICCP links
3. Field Asset Lifecycle Planner — Interactive 15–25 year Mosca-window planner for IEDs, RTUs, smart meters, and DER inverters separating interim compensating controls from hardware replacement cycles
4. Grid Evidence Checklist — Interactive Yes/No/Unknown utility OT/IT and OEM supply-chain evidence checklist where unanswered items always report an unverified evidence gap rather than low exposure

## Key Standards

- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), NIST SP 800-208 (LMS/XMSS)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards, final Oct 2026) and NIST SP 800-82 Rev. 3 (OT Security)
- IEC 62351-6 (IEC 61850 security), IEC 62443-4-2 (IACS components), IEC 62056-5-3 (DLMS/COSEM)
- RFC 8052 (GDOI for IEC 62351), RFC 9370 (IKEv2 multiple key exchanges), RFC 9846 & RFC 10024 (TLS 1.3 hybrid key agreement)
- NERC CIP-005-7, CIP-007-6, CIP-010-4, CIP-011-3, CIP-012-2, CIP-013-2
- NIS2 Directive (2022/2555), EU NIS Cooperation Group PQC Roadmap v1.1, EO 14412, OMB M-26-15, FIPS 140-3
