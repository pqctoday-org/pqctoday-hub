# ANSSI PQC Transition Phases

**Source**: https://cyber.gouv.fr/en/publications/anssi-views-post-quantum-cryptography-transition
**Initial publication**: January 2022; Follow-up: December 2023

## Three-Phase Roadmap

### Phase 1 (Current — through ≥2025)

- Mandatory pre-quantum security measures
- PQC implementation optional but encouraged as defense-in-depth
- No claimed quantum resistance required

### Phase 2 (Not earlier than 2025 — through ≥2030)

- Mandatory pre-quantum security maintained
- PQC mandatory in hybrid mechanisms for systems claiming post-quantum security
- Hybridization (classical + PQC) required — not standalone PQC
- First security visas/evaluations including PQC expected

### Phase 3 (Not earlier than 2030)

- Standalone PQC becomes acceptable (optional without pre-quantum)
- PQC alone can claim quantum resistance
- **Note**: 2030 is when PQC alone becomes _acceptable_, not when it becomes _mandatory_

## Notes for CSV validation

- Row 61 (Phase 1, 2024-2025 Migration): Labeled "Pre-Quantum Security" — aligned ✅
- Row 67 (Phase 2, 2025-2030 Migration): "Hybridization Required" — aligned ✅
- Row 70 (Phase 3, 2030-2035 Migration): "Standalone PQC Optional" + correction note — aligned ✅. Status changed from "Corrected" to "Validated" in timeline_02192026.csv
