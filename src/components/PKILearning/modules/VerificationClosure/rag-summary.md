# Decommissioning & Program Closure

## Overview

This module covers the end of a post-quantum migration — two jobs that are routinely neglected: decommissioning classical cryptography on a defensible schedule, and closing the program into business-as-usual. The independently-sourced spine is the deprecation timeline (NIST IR 8547: deprecate classical public-key by 2030, disallow by 2035; NCSC-UK 2028/2031/2035; ETSI), executed via the inventory→plan→execute lifecycle (ETSI TR 103 619, ETSI TR 104 016, the Dutch PQC Migration Handbook). Verification-by-observed-behaviour, the estate-scale sampling approach, and the PQC-specific closure detail are presented as practitioner guidance, with generic governance anchored to ISO/IEC 27001 and the NIST Risk Management Framework.

## Key Concepts

- **Decommissioning** — the migration is done when the classical cryptography is gone, not when PQC is added. Discipline: deprecate → remove → **verify removed** → log. Schedule anchored to NIST IR 8547 (deprecate 2030 / disallow 2035) and SP 800-131A.
- **Verification by observed behaviour** (practitioner) — prove migration by capturing the handshake and confirming ML-KEM/ML-DSA was negotiated, not by trusting a change ticket. Reuse the Active PQC Scanner and passive handshake capture. Control basis: NIST CSWP 48 (draft) → CSF 2.0 / SP 800-53.
- **Coverage at estate scale** (practitioner) — verify business-critical systems fully, sample lower tiers per migration wave, widen the check on any sampled failure.
- **Program closure** (practitioner + ISO/RMF) — define closure criteria in advance; accept residual risk with a named owner and re-evaluation date; transfer standing capabilities (CBOM, continuous discovery, vendor cadence, SOC content, KRIs, crypto-agility) to permanent owners; archive an evidence dossier. Generic governance: ISO/IEC 27001, NIST SP 800-37 (RMF).

## Standards & Sources

NIST IR 8547, NIST SP 800-131A, NIST CSWP 48 (draft), NIST CSF 2.0, NIST SP 800-53, NIST SP 800-37 (RMF), NCSC-UK migration timelines, ETSI TR 103 619 / TR 104 016, Dutch PQC Migration Handbook (AIVD/CWI/TNO), ISO/IEC 27001.
