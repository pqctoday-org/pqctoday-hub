# Cryptographic Management Modernization (LM-052)

## Thesis

Cryptographic Management Modernization (CMM) is the management discipline of
**Cryptographic Posture Management (CPM)** — a continuous, iterative program covering
certificates, cryptographic libraries, application software, and key material. It is distinct
from crypto-agility (a technical capability: "can we change?") and from a Cryptographic Center
of Excellence (an operating model: "who owns it?"). CPM answers: "do we know what we have, is
it healthy, can we prove it, and does the investment pay off whether quantum arrives on
schedule or never?"

## Why now — three forcing functions independent of quantum arrival

1. **47-day TLS certificate cadence** by March 2029 (CA/B Forum Ballot SC-081v3, April 2025).
   Validity reduces from 398d → 200d (2026) → 100d (2027) → 47d (2029). Manual CLM becomes
   mathematically impossible at this cadence.
2. **FIPS 140-3 Level 3 validation drift**. Every CMVP certificate is bound to a specific
   version, firmware, and platform. The September 2025 FIPS 140-3 Implementation Guidance
   retroactively added new self-test requirements for ML-KEM/ML-DSA/SLH-DSA. The CMVP
   Modules-in-Process queue runs 18–24 months. Tracking this is a continuous monthly monitor,
   not an annual audit.
3. **Library EoL and CVE cadence**. OpenSSL 1.1.1 EoL (September 2023). Bouncy Castle
   high-severity CVEs per release. OMB M-23-02 annual cryptographic inventory mandate for US
   federal agencies through 2035. CNSA 2.0 National Security Systems deadlines (2030/2033).

## Five pillars of CPM

1. **Inventory** — unified CBOM across four asset classes (certificates, libraries, software,
   keys). Continuously refreshed, not point-in-time.
2. **Governance** — policy, standards, exception handling, ownership (deep-dive in
   `pqc-governance` LM-037).
3. **Lifecycle / CLM** — provisioning → rotation → retirement. 47-day ACME/EST/CMP automation,
   shadow-cert discovery via CT logs, root and intermediate CA rotation, revocation propagation.
4. **Observability** — posture metrics, SIEM drift alerts, coverage trends.
5. **Assurance / FIPS** — audit, attestation, CMVP validation tracking for libraries and
   hardware, ACVP re-certification cadence, IG-update compliance deltas.

## Dual-loop iterative process

- **Strategic annual PDCA** (Plan → Do → Check → Act).
- **Operational continuous 6-stage loop**: Discover → Classify → Score → Remediate → Attest →
  Reassess. Canonical examples: CLM quarterly auto-renewal review; FIPS monthly CMVP monitor.

## No-regret ROI streams

1. Cert-outage avoidance (~$11M/event × 86% annual incidence — Entrust/Ponemon 2024 PKI & PQC Trends Study).
2. CLM automation (312% ROI, $10.1M NPV over 3 years — Forrester TEI of DigiCert ONE, July 2025; vendor-commissioned, treat as upper-bound benchmark).
3. FIPS 140-3 drift remediation avoided.
4. Library CVE response acceleration.
5. Time-to-market and M&A readiness (~50% lower PQC transition cost for orgs with a CryptoCOE
   before 2028 — Gartner: Mahdi/Lowans).

Quantum-dependent benefits are additive, never load-bearing.

## Workshop tools

1. **CPM Maturity Self-Assessment** — 5 pillars × 5 levels with per-asset-class indicators.
2. **Inventory Lifecycle Simulator** — sample assets through the 6-stage loop with canonical
   CLM scenarios.
3. **Library & Hardware CBOM Builder** — SBOM → CBOM mapper, library + HSM FIPS 140-3 L3
   status trackers.
4. **No-Regret ROI Builder** — ROI, NPV, and payback under quantum-happens / never-happens. Every headline (program cost + 6 benefit streams) expands into an editable sub-model with formula, parameters, source citation, and plain-English explanation. Globals: horizon, discount rate, P(CRQC within horizon). "Pull from Step 3 CBOM" populates HSM/library counts.
5. **Posture KPI Dashboard Designer** — KPI taxonomy across five pillars.
6. **CLM Vendor Evaluator** — interactive scorecard for evaluating Venafi, AppViewX, and Keyfactor based on PQC readiness criteria (HSM orchestration, hybrid certificates, ACME automation).

## Key standards

CA/B Forum SC-081v3 · NIST FIPS 140-3 IG Sep 2025 · SP 800-140B · CMVP Validated Modules + MIP
· OMB M-23-02 · NSA CNSA 2.0 · ENISA PQC Integration Study · BSI/ANSSI joint 2025 · OWASP
CycloneDX CBOM · RFC 8555/7030/4210 · Forrester TEI of DigiCert ONE (2025) · Entrust/Ponemon 2024 Global PKI & PQC Trends Study · NIST IR 8547 (HNDL) · Microsoft
CPM (2026-04) · Keyfactor/EJBCA CPM · Gartner (Mahdi, Lowans).

## Pairs with

Crypto Agility (LM-007) · PQC Governance (LM-037) · KMS & PQC (LM-024) · Business Case (LM-036).
