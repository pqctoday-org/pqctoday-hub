# NICE Framework v2.2.0 — vendored reference & migration map

## Source (authoritative)
- **File:** `NICE-Framework-Components-v2.2.0.json` (this folder) — official NIST CPRT export.
- **Download:** https://csrc.nist.gov/csrc/media/Projects/cprt/documents/nice/v2-2-0_nf_components.json
- **Doc identifier:** `SP_800_181_2_2_0` — *Workforce Framework for Cybersecurity (NICE Framework), NIST SP 800-181 Rev 1*, **Components version 2.2.0, released 2025-04-28.**
- **Browse:** https://niccs.cisa.gov/tools/nice-framework · CPRT: https://csrc.nist.gov/projects/cprt
- Retrieved 2026-06-18.

## Why this matters
The hub's NICE data layer (`src/data/niceFramework.ts`) reflects the **2017** framework: job-title
work roles (`Security Architect`), repo-invented competency-area codes (`CA-CRYPTO`), and 2017-era
TKS IDs. The current framework (v2.2.0) is a **structural rewrite**. Verified against the JSON above:

- **Categories:** 7 (2017) → **5** today: DD (Design & Development), IO (Implementation & Operation),
  PD (Protection & Defense), IN (Investigation), OG (Oversight & Governance).
- **Work roles:** now **42**, named as *activities* not job titles, with new IDs `XX-WRL-NNN`.
- **Competency Areas:** now **11 official** with real IDs `NF-COM-001…011` (Cryptography = **NF-COM-006**).
  Our 8 `CA-*` codes are **repo-invented**, not NIST codes.
- **TKS statements:** only **6 of our 32** IDs still exist in v2.2.0 (26 retired/renumbered).

## Work-role map (our 8 internal slugs → v2.2.0)

| Hub slug | Old title (2017) | Old code | → v2.2.0 ID | v2.2.0 work role |
|---|---|---|---|---|
| `security-architect` | Security Architect | SP-ARC-001 | **DD-WRL-001** | Cybersecurity Architecture |
| `security-developer` | Security Developer | SP-DEV-001 | **DD-WRL-003** | Secure Software Development |
| `system-administrator` | System Administrator | OM-ADM-001 | **IO-WRL-005** | Systems Administration |
| `network-security-specialist` | Network Operations Specialist | OM-NET-001 | **IO-WRL-004** | Network Operations |
| `systems-security-analyst` | Systems Security Analyst | SP-SYS-001 | **IO-WRL-006** | Systems Security Analysis |
| `is-security-manager` | Information Systems Security Manager | OV-MGT-001 | **OG-WRL-014** | Systems Security Management |
| `risk-manager` | Risk Manager | SP-RSK-001 | **⚠ no 1:1** | nearest: OG-WRL-013 Systems Authorization / OG-WRL-002 Cybersecurity Policy & Planning |
| `iam-specialist` | IAM Specialist | (—) | **⚠ no work role** | Access Controls is now a *Competency Area* (NF-COM-001); nearest role IO-WRL-005 Systems Administration |

The first 6 are confirmed by matching the v2.2.0 role descriptions. The last 2 have **no clean
equivalent** because the framework reorganized risk and identity/access out of the work-role layer —
they need a human decision (see remediation plan).

## Official Competency Areas (v2.2.0)
NF-COM-001 Access Controls · 002 AI Security · 003 Asset Management · 004 Cloud Security ·
005 Communications Security · **006 Cryptography** · 007 Cyber Resiliency · 008 DevSecOps ·
009 OS Security · 010 OT Security · 011 Supply Chain Security.
