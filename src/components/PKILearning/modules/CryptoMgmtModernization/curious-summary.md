# Cryptographic Management Modernization — quick tour

## The one-sentence version

Crypto Management Modernization (CMM) is about running a **continuous program** to know what
crypto you have, keep it healthy, and prove it — across certificates, crypto libraries,
software, and keys.

## Why it matters even if quantum never happens

- Public website (TLS) certificates will last only **47 days** by March 2029. Manually tracking thousands of
  them stops working.
- Some crypto libraries and HSMs hold a FIPS 140-3 "driver's license" (a CMVP certificate), and
  many products hold none. A certificate covers one named module: its version, its approved
  algorithms and its caveats, and it counts for new systems only while its status is Active.
  Certificates can move to the Historical list or be revoked, so check the certificate for the
  exact build you run and watch for status changes (this module suggests a monthly check).
- A **single expired certificate** can cause an outage. This module's cost model uses an
  illustrative assumption of about **$11M** per outage and 86% annual incidence; these are the
  module's own assumptions, not sourced figures.
- A DigiCert-commissioned Forrester study **modeled a 312% return over three years** for a
  composite programme combining several benefit types. This is not measured pure labour savings
  or a promised return for another organisation. The workshop lets you compare explicit costs
  and benefit assumptions, including a case without quantum-related benefits.

## How it's different from "crypto agility"

- **Crypto agility:** can we swap algorithms? (capability)
- **CMM / Posture management:** do we know what we have? (program)
- **CryptoCOE:** who owns it? (operating model)

You need all three, but they are different things.

## Four asset classes to track

1. **Certificates** (TLS, code-signing, internal PKI)
2. **Cryptographic libraries** (OpenSSL, BoringSSL, Bouncy Castle, liboqs, wolfSSL)
3. **Application software** (code that uses crypto — including home-grown)
4. **Key material** (keys and secrets in HSMs and KMS)

## Five pillars

Inventory · Governance · Lifecycle (CLM) · Observability · Assurance (FIPS tracking).

## The iteration loop

Discover → Classify → Score → Remediate → Attest → Reassess. Run this monthly for operations,
then wrap it in an annual Plan-Do-Check-Act cycle for strategy and budget.

## What you'll practice

- Score your own organization on a maturity radar
- Walk sample assets through the 6-stage loop
- Map an SBOM into a crypto-focused CBOM
- Track FIPS 140-3 Level 3 status for both libraries and HSMs
- Model ROI with and without a quantum threat
- Pick the KPIs your board needs to see
