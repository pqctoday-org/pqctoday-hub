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

## Authors

**Organization:** NIST/HQC Team

## Scope

**Industries:** IT; Gov; Critical Infrastructure
**Region:** USA; Global
**Document type:** Algorithm

## How It Relates to PQC

Future TLS/IPsec/SSH integration

**Dependencies:** NIST PQC Round 4

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                            |
| ---------------------- | -------------------------------- |
| Algorithm family       | Code-based                       |
| Security levels        | L1,L3,L5                         |
| Protocol / tool impact | Future TLS/IPsec/SSH integration |
| Toolchain support      | Reference implementation         |

## Short Description

Code-based KEM selected March 2025 as backup to ML-KEM. Draft FIPS expected 2026, final 2027.

## Long Description

Hamming Quasi-Cyclic (HQC) 22/08/2025 Submitters (by joining date then alphabetical order): • Philippe Gaborit (University of Limoges, FR) • Carlos Aguilar-Melchor (SandboxAQ, USA) • Nicolas Aragon (Naquidis Center, FR) • Slim Bettaieb (Technology Innovation Institute, UAE) • Loïc Bidoux (Technology Innovation Institute, UAE) • Olivier Blazy (Ecole Polytechnique, FR) • Jean-Christophe Deneuville (ENAC, University of Toulouse, FR) • Edoardo Persichetti (Florida Atlantic University, USA) • Gilles Zémor (IMB, University of Bordeaux, FR) • Jurjen Bos (Worldline, NL) • Arnaud Dion (ISAE-SUPAERO, University of Toulouse, FR) • Jérôme Lacan (ISAE-SUPAERO, University of Toulouse, FR) • Jean-Marc Robert (University of Toulon, FR) • Pascal Véron (University of Toulon, FR) • Paulo L. Barreto (University of Washington Tacoma, USA) • Santosh Ghosh (Intel, USA) • Shay Gueron (University of Haifa, Israel and Meta, USA) • Tim Güneysu (Ruhr-Universität Bochum, DE and DFKI, DE) • Rafael Misoczki (Meta, USA) • Jan Richter-Brokmann (Ruhr-Universität Bochum, DE) • Nicolas Sendrier (INRIA, FR) • Jean-Pierre Tillich (INRIA, FR) • Valentin Vasseur (Thales, FR) Contact: Changelog Hereafter, we list the main modifications made to HQC design. Modifications related to implementations are provided with the source code (available at https://pqc-hqc.org). 2025/08/22 • We have refactored this document to improve its readability notably adding detailed figures describing HQC-PKE and HQC-KEM and fixing several typographical errors. • We have updated the Fujisaki-Okamoto used to construct HQC-KEM from HQC-PKE by fixing the rejection of the scheme [34], using the salted SFO̸⊥ m transform instead of ̸⊥ the FO one [18] and adding (ekKEM , salt) within K and θ derivation. • We have updated HQC keypair format by adding seedKEM in the decapsulation key dkKEM so that the keypair can be easily checked if it is received from a third party and removing x from dkKEM as it is not used in HQC-KEM.Decaps. In addition, an alternative compressed format dkKEM = (seedKEM ) have been included. • We have updated fixed weight vectors sampling in HQC-PKE.Keygen by using a sampler that outputs uniformly distributed vectors but rely on rejection sampling (SampleFixedWeightVect$ ) instead of a sampler that don’t rely on rejection sampling but output a a slightly biased distribution (SampleFixedWeightVect). • We have made several minor modifications to align HQC specifications with design choices made in FIPS-203 such as computing (seedPKE.dk , seedPKE.ek ) using SHA3-512 instead of SHAKE256, absorbing all the bytes of ekKEM in the computation of (K, θ) and reducing the sizes of K and θ from 40 to 32 bytes. • Paulo L. Barreto, Santosh Ghosh, Shay Gueron, Tim Güneysu, Rafael Misoczki, Jan Richter-Brokmann, Nicolas Sendrier, Jean-Pierre Tillich, Valentin Vasseur have joined the HQC team. 2024/10/30 • We have modified the order of variable sampling in both key generation and encryption as this results in performance gains in hardware implementation as suggested by [2]. • We have updated the countermeasure against multi-target attacks by including only the first 32 bytes of the public key instead of the entire public key. 2 2023/04/30 • We have updated the Fujisaki-Okamoto used to construct HQC-KEM from HQC-PKE by considering the FO̸⊥ transform with implicit rejection for the scheme. • We have provided an analysis showing that sampling small weights vectors nonuniformly, yet close to uniform, has a negligible effect on HQC security following [36]. 2022/10/01 • We have updated the computation of the randomness θ used in HQC-PKE.Encrypt to include a salt and ekKEM as a counter-measure to multi-ciphertext attacks [32]. • We have updated constant-weight words sampling using the technique from [36] as a counter-measure to the timing attack from [20]. 2020/10/01 • We have removed the HQC variant using

---

_Hamming Quasi-Cyclic (HQC) 22/08/2025 Submitters (by joining date then alphabetical order): • Philippe Gaborit (University of Limoges, FR) • Carlos Aguilar-Melchor (SandboxAQ, USA) • Nicolas Aragon (Naquidis Center, FR) • Slim Bettaieb (Technology Innovation Institute, UAE) • Loïc Bidoux (Technology Innovation Institute, UAE) • Olivier Blazy (Ecole Polytechnique, FR) • Jean-Christophe Deneuville (ENAC, University of Toulouse, FR) • Edoardo Persichetti (Florida Atlantic University, USA) • Gilles Zémor (IMB, University of Bordeaux, FR) • Jurjen Bos (Worldline, NL) • Arnaud Dion_
