# PQC Risk Management

## Overview

The PQC Risk Management module teaches CISOs and security leaders how to identify, quantify, and prioritize quantum computing risks to their organization. It covers CRQC (Cryptographically Relevant Quantum Computer) scenario planning with adjustable timelines from 2028-2045, building comprehensive risk registers for quantum-vulnerable cryptographic assets, and generating likelihood-by-impact risk heatmaps. The module integrates live data from the app's threat landscape, compliance frameworks, and assessment engine to provide personalized risk analysis.

## Key Concepts

- **CRQC Scenario Planning** — model the cascading impact of a cryptographically relevant quantum computer arriving in a given year; shows which algorithms break, which compliance deadlines are missed, and the HNDL (Harvest Now, Decrypt Later) exposure window
- **Risk Register Construction** — systematic cataloging of cryptographic assets with fields for asset name, current algorithm, threat vector, likelihood (1-5), impact (1-5), and mitigation strategy; auto-calculates risk scores
- **Risk Heatmap** — 5×5 likelihood-by-impact grid that visually plots risk register entries, color-coded by severity (Critical, High, Medium, Low)
- **HNDL Exposure Window** — calculates how many years of harvested encrypted data could be decrypted based on data retention periods and estimated CRQC arrival date
- **Threat Vectors** — six categories used in the risk register: Harvest Now, Decrypt Later (HNDL); Shor's Algorithm (Key Exchange/Signing); Grover's Algorithm (Symmetric Weakening); Signature Forgery (Code Signing/Certs); Identity Impersonation (TLS/Auth); Supply Chain Attack (Firmware/Updates)
- **Risk Scoring** — Likelihood × Impact matrix producing four severity bands: Critical (20-25), High (12-19), Medium (6-11), Low (1-5)

## Workshop / Interactive Activities

The workshop has 3 interactive steps:

1. **CRQC Scenario Planner** — adjust a year slider (2028-2045) to model when a quantum computer could break current algorithms; see cascading impacts on 10 algorithms, 6 compliance deadlines, and HNDL exposure windows across 7 data retention periods
2. **Risk Register Builder** — create a multi-row risk register with pre-populated examples (TLS certificates, database encryption, code signing, VPN tunnels); export as Markdown and save to learning portfolio
3. **Risk Heatmap Generator** — automatically plots risk register entries on a 5×5 heatmap grid; click any cell to see detailed entries; view risk distribution summary across severity bands

## Related Standards

- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0)
- NIST SP 800-30 (Guide for Conducting Risk Assessments)
- ISO 27005 (Information Security Risk Management)
