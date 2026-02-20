---
reference_id: HQC Specification
document_type: Algorithm
document_status: NIST Round 4 Selection
date_published: 2024-02-23
date_updated: 2025-08-22
region: USA; Global
migration_urgency: Medium
local_file: public/library/HQC_Specification.pdf
preview: HQC Specification.png
---

# Hamming Quasi-Cyclic (HQC) Algorithm Specification

## Author & Organization

**Organization:** NIST/HQC Team

## Scope

**Industries:** IT; Gov; Critical Infrastructure
**Region:** USA; Global
**Document type:** Algorithm

## How It Relates to PQC

Future TLS/IPsec/SSH integration

**Dependencies:** NIST PQC Round 4

## Risks Addressed

**Migration urgency:** Medium
**Security levels:** L1,L3,L5

## PQC Key Types & Mechanisms

| Field                  | Value                            |
| ---------------------- | -------------------------------- |
| Algorithm family       | Code-based                       |
| Security levels        | L1,L3,L5                         |
| Protocol / tool impact | Future TLS/IPsec/SSH integration |
| Toolchain support      | Reference implementation         |

## Description

Code-based KEM selected March 2025 as backup to ML-KEM. Draft FIPS expected 2026, final 2027.

---

_Hamming Quasi-Cyclic (HQC) 22/08/2025 Submitters (by joining date then alphabetical order): • Philippe Gaborit (University of Limoges, FR) • Carlos Aguilar-Melchor (SandboxAQ, USA) • Nicolas Aragon (Naquidis Center, FR) • Slim Bettaieb (Technology Innovation Institute, UAE) • Loïc Bidoux (Technology Innovation Institute, UAE) • Olivier Blazy (Ecole Polytechnique, FR) • Jean-Christophe Deneuville (ENAC, University of Toulouse, FR) • Edoardo Persichetti (Florida Atlantic University, USA) • Gilles Zémor (IMB, University of Bordeaux, FR) • Jurjen Bos (Worldline, NL) • Arnaud Dion (ISAE-SUPAERO, University of Toulouse, FR) • Jérôme Lacan (ISAE-SUPAERO, University of Toulouse, FR) • Jean-Marc Robert (University of Toulon, FR) • Pascal Véron (University of Toulon, FR) • Paulo L. Barreto (University of Washington Tacoma, USA) • Santosh Ghosh (Intel, USA) • Shay Gueron (University of Haifa, Israel and Meta, USA) • Tim Güneysu (Ruhr-Universität Bochum, DE and DFKI, DE) • Rafael Misoczki (Meta, USA) • Jan Richter-Brokmann (Ruhr-Universität Bochum, DE) • Nicolas Sendrier (INRIA, FR) • Jean-Pierre Tillich (INRIA, FR) • Valentin Vasseur (Thales, FR) Contact: team@pqc-hqc.org Changelog Hereafter, we list the main modifications made to HQC design. Modifications related to implementations are provided with the source code (available at https://pqc-hqc.org). 2025/08/22 • We have refactored this document to improve its readability notably adding detailed figures describing HQC-PKE and HQC-KEM and fixing several typographical errors. • We have updated the Fujisaki-Okamoto used to construct HQC-KEM from HQC-PKE by fixing the rejection of the scheme [34], using the salted SFO̸⊥ m transform instead of ̸⊥ the FO one [18] and adding (ekKEM , salt) within K and θ derivation. • We have updated HQC keypair format by adding seedKEM in the decapsulation key dkKEM so that the keypair can be easily checked if it is received from a third party and removing x from dkKEM as it is not used_
