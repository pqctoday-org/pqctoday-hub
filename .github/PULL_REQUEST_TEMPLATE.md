<!-- markdownlint-disable MD041 -->

## Change type

<!-- Select one: data:library | data:compliance | data:migrate | data:threats | enrichment | xref | module:content | tool:registry | tool:wasm-backend | vocab:change | schema:change | validation:vector | validation:adapter -->

Change type:

## Domain

<!-- library | compliance | migrate | threats | timeline | module | tool | vocabulary | schema -->

Domain:

## Scope summary (≤120 chars)

<!-- What changed and why — shown in the revisions feed -->

## Records / modules / tools affected

<!-- List IDs or names -->

## Evidence

<!-- Link to source document section, NIST publication, or rationale -->

## LLM-authored?

<!-- Yes / No — if Yes, add bot:llm-authored label; requires SME approval regardless of CI status -->

## Offline SME approval (if SME has no GitHub account)

<!-- If the reviewing SME cannot approve via GitHub, commit an approvals/offline-{PR}-{reviewer_id}.json file to this branch.
     Leave this section blank if the SME will approve directly via GitHub. -->

Offline reviewer:
Approval method (email | call | meeting | signed-doc):
Evidence reference:

## Validation vectors / adapters (only if this PR touches src/data/acvp, the vector manifest, the test registry or a runner)

<!-- A contributed vector cannot merge as trusted without every box below; the manifest gate enforces 1–4. -->

- [ ] 1. Manifest record with immutable source identity (repository + commit + path + upstream SHA-256, or document URL + revision + reviewed-document SHA-256; oracle name AND version)
- [ ] 2. Reviewed license / redistribution note (`license.reviewed: true`)
- [ ] 3. Every case states operation, expectation (positive/negative) and test type; transformations recorded in `lineage`
- [ ] 4. Two-person review record `src/data/validation/reviews/<id>.review.json` (source verification + implementation review, two distinct named people, approved, matching subject SHA-256)
- [ ] 5. Registered in `src/data/validation/testRegistry.ts`; `npm run gen:case-evidence` / `gen:coverage-matrix` outputs regenerated
- [ ] 6. Proposal issue linked (template: "Propose a validation vector, adapter, correction or test case")

Proposal issue:
