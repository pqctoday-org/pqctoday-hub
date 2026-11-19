# PQC Risk Management

## Overview

The PQC Risk Management module teaches CISOs and security leaders how to identify, quantify, and prioritize quantum computing risks to their organization. It covers CRQC (Cryptographically Relevant Quantum Computer) scenario planning with adjustable timelines from 2028-2045, building editable risk registers for cryptographic assets in scope, and generating editable likelihood-by-impact worksheets. A scenario year, stored example score or deadline-name match is not a forecast, measured probability or compliance determination.

## Key Concepts

- **CRQC Scenario Planning** — model an assumed CRQC year; shows scenario-vulnerable algorithm rows, configured scope-labeled reference dates and a retention/date-overlap illustration. Actual HNDL exposure also depends on captured ciphertext, vulnerable public-key key establishment and recoverable secrets
- **Risk Register Construction** — systematic cataloging of cryptographic assets with fields for asset name, current algorithm, threat vector, likelihood (1-5), impact (1-5), and mitigation strategy; auto-calculates risk scores
- **Risk Heatmap** — 5×5 likelihood-by-impact grid that visually plots risk register entries, color-coded by severity (Critical, High, Medium, Low)
- **HNDL Exposure Window** — compares retention periods with an assumed year; it does not establish whether data was captured or whether key establishment/secrets meet HNDL conditions
- **Threat Vectors** — six categories used in the risk register: Harvest Now, Decrypt Later (HNDL); Shor's Algorithm (Key Exchange/Signing); Grover's Algorithm (Symmetric Weakening); Signature Forgery (Code Signing/Certs); Identity Impersonation (TLS/Auth); Supply Chain Attack (Firmware/Updates)
- **Risk Scoring** — Likelihood × Impact matrix producing four severity bands: Critical (20-25), High (12-19), Medium (6-11), Low (1-5)

## Workshop / Interactive Activities

The workshop has 4 interactive steps:

1. **CRQC Scenario Planner** — adjust a scenario-year slider (2028-2045) to view modeled vulnerable algorithm rows, configured scope-labeled reference dates and retention overlap for 7 data-lifetime examples
2. **Risk Register Builder** — create a multi-row risk register with pre-populated examples (TLS certificates, database encryption, code signing, VPN tunnels); export as Markdown and save to learning portfolio
3. **Risk Heatmap** — plots risk register entries on a 5×5 heatmap grid; click any cell to see detailed entries and assign a draft treatment strategy; compare baseline and projected sample scores and set your migration priority order
4. **Compliance Gap Analysis** — inspect algorithm-name patterns and configured CNSA 2.0/NIST IR 8547 reference years; applicability and compliance are not determined

## Related Standards

- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards, final October 2026)
- NSA CNSA 2.0 (FAQ v2.2, October 2026 — National Security Systems only)
- Executive Order 14412 & OMB M-26-15 (June 2026 — U.S. federal civilian agencies)
- EU Coordinated Implementation Roadmap v1.1 (June 2025 — advisory Member State guidance; DORA and NIS2 impose cyber risk-management duties rather than fixed PQC cutoff dates)
- NIST SP 800-30 (Guide for Conducting Risk Assessments)
- ISO 27005 (Information Security Risk Management)
