# Cryptographic Management Modernization — quick tour

## The one-sentence version

Crypto Management Modernization (CMM) is about running a **continuous program** to know what
crypto you have, keep it healthy, and prove it — across certificates, crypto libraries,
software, and keys.

## Why it matters even if quantum never happens

- TLS certificates will last only **47 days** by March 2029. Manually tracking thousands of
  them stops working.
- Every crypto library and HSM has a FIPS 140-3 "driver's license" (a CMVP certificate) that
  can **expire or be revoked**. You have to watch for those notices monthly.
- A **single expired certificate** costs organizations $11–15M on average when it causes an
  outage.
- Forrester measured a **312% return** on automating certificate lifecycle management — pure
  savings, unrelated to quantum.

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
