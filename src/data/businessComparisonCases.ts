// SPDX-License-Identifier: AGPL-3.0-only
/** Each prompt uses an input exposed by the named planning tool. */
export const BUSINESS_COMPARISON_CASES: Record<string, { change: string; interpret: string }> = {
  'roi-calculator': {
    change: 'Set annual breach probability to 0% and leave the system count unchanged.',
    interpret:
      'Annual breach savings should fall to zero. Capital cost still follows the system count, and a separate compliance assumption can still contribute a benefit.',
  },
  'board-pitch': {
    change:
      'In Recommended Actions, replace a general funding request with a named pilot, owner and decision date.',
    interpret:
      'Read the request as a board member. Identify exactly what a vote would authorize and which assumption would make the pilot a poor investment.',
  },
  'breach-simulator': {
    change: 'Increase Years of Stored Data and keep migration time and the threat horizon fixed.',
    interpret:
      'Compare the retention-plus-migration window against the horizon. A longer window can change exposure even when the assumed annual breach probability is unchanged.',
  },
  'cost-of-inaction': {
    change:
      'Increase the migration delay and hold the annual breach probability and discount rate fixed.',
    interpret:
      'Check which years of modeled exposure move into the delayed case. Separate extra exposure from investment costs deferred to a later year.',
  },
  'cost-model-explorer': {
    change: 'Double systems in scope while holding the annual IT budget fixed.',
    interpret:
      'Compare the cost estimates separately. A method tied to estate size and a method tied to budget can respond differently.',
  },
  'crqc-scenario': {
    change:
      'Move the assumed CRQC arrival year earlier while keeping the same selected milestones.',
    interpret:
      'The assumed arrival changes time available for planning. A published milestone date still comes from the selected source.',
  },
  'risk-register': {
    change:
      'Give one sample risk a named owner role and next review date. Keep likelihood and impact fixed.',
    interpret:
      'The entry should become easier to act on while its numerical risk score stays the same. Assigning an owner alone does not reduce exposure.',
  },
  'risk-treatment-plan': {
    change:
      'Load sample register entries, keep a baseline, then change the treatment of one listed risk.',
    interpret:
      'Look for the affected risk and the proposed treatment. Distinguish a planned control from evidence that residual risk has fallen.',
  },
  'audit-checklist': {
    change:
      'Add an evidence row with a fictional asset and module certificate reference, then compare the checklist preview.',
    interpret:
      'Locate the reference in the report. Check its module version and operating environment before using it to support a claim about the asset.',
  },
  'compliance-checklist': {
    change:
      'Load the sample frameworks, then change the jurisdiction or the scope text used for the checklist.',
    interpret:
      'Identify which obligation still applies to the fictional organization. A framework appearing on a checklist is a prompt to investigate applicability.',
  },
  'compliance-timeline': {
    change: 'Load the US and EU sample, then remove one jurisdiction.',
    interpret:
      'Check which dated milestones disappear and which remain in scope. Retain the issuing authority when explaining a deadline.',
  },
  'raci-builder': {
    change:
      'Change the CTO assignment in the Crypto Inventory row and compare it with the CISO assignment.',
    interpret:
      'Check who owns the decision and who performs the work. If the row has two accountable parties, resolve who has final authority.',
  },
  'policy-generator': {
    change:
      'Change the policy owner and approver in the fictional policy, then open Preview again.',
    interpret:
      'Check whether an operator can identify who maintains the policy and who approves it. Names alone do not demonstrate enforcement.',
  },
  'kpi-dashboard': {
    change: 'Change the numerator for Systems Inventoried while holding the denominator fixed.',
    interpret:
      'Check what changed in the reported score and which systems the denominator covers. A percentage without a scope or measurement date is hard to defend.',
  },
  'contract-clause': {
    change:
      'Remove one required signature algorithm and leave the validation and evidence requirements in place.',
    interpret:
      'Check which supplier obligation disappeared. A named algorithm and evidence for the exact delivered module answer different procurement questions.',
  },
  'vendor-scorecard': {
    change: 'Adjust the weight for PQC Algorithm Support and keep the vendor evidence fixed.',
    interpret:
      'A changed ranking reflects your weighting decision. It does not create new evidence about a vendor’s product.',
  },
  'roadmap-builder': {
    change: 'Select a dated deadline and compare the resulting roadmap with your baseline.',
    interpret:
      'Identify which planning milestone changed and who issued the source deadline. Check its jurisdiction before treating it as binding.',
  },
  'stakeholder-comms': {
    change:
      'Give the board message a funding decision and the development message a concrete compatibility test.',
    interpret:
      'A board reader should know what to approve. A developer should know what to test and which failure to escalate.',
  },
  'supply-chain-matrix': {
    change: 'Open Document your pipeline, then change Refresh cadence from quarterly to weekly.',
    interpret:
      'Find the new cadence in the report. Decide which dependency records could become stale between refreshes and what would trigger an earlier inventory update.',
  },
  'kpi-tracker': {
    change:
      'Change the evidence owner or reporting period for Systems Inventoried while keeping the measured count fixed.',
    interpret:
      'The supporting record should change independently of the count. Confirm the periods and populations match before comparing two reported percentages.',
  },
  'deployment-playbook': {
    change: 'Check Prepare rollback automation scripts in Pre-Deployment Preparation.',
    interpret:
      'The checklist should record one completed preparation activity. A successful rollback still needs a separate test with a stated pass condition.',
  },
  'hybrid-transition-planner': {
    change:
      'Toggle the requirement to interoperate with non-PQC peers and review the transition plan again.',
    interpret:
      'Look for the compatibility assumption that changed. Explain which peer could now fail or fall back and what a negotiation trace would establish.',
  },
  'mti-negotiator': {
    change:
      'Add a requirement to interoperate with pure-PQC peers and compare the proposed implementation profile.',
    interpret:
      'Compare what peers must implement with what a particular session actually negotiates. A deployment still needs an interoperability test.',
  },
  'crypto-api-refactor-audit': {
    change: 'Add the legacy direct OpenSSL RSA or EC API to the sample inventory.',
    interpret:
      'Check whether the plan identifies algorithm-specific call sites. A provider configuration change alone cannot replace a hard-coded API contract.',
  },
  'cloud-responsibility-matrix': {
    change: 'Add a second cloud provider and inspect the revised assignment of responsibilities.',
    interpret:
      'For one key operation, identify who configures it, who operates it and who can provide evidence. Resolve any assignment that still says only “shared”.',
  },
  'crypto-architecture-diagram': {
    change:
      'Change a component dependency in the sample architecture and inspect the diagram source.',
    interpret:
      'Trace the changed edge to the relying component. Confirm that its trust or key-management dependency matches the intended design.',
  },
  'management-tools-audit': {
    change:
      'Reduce the number of systems covered by the crypto scanner and leave the tooling maturity rating fixed.',
    interpret:
      'Distinguish automation capability from estate coverage. An automated scanner can still leave a material blind spot.',
  },
  'crypto-cbom-builder': {
    change:
      'Compare the SBOM-derived view with the HSM inventory and review the generated inventory output.',
    interpret:
      'Check which cryptographic objects each input can observe. A package name establishes a dependency but needs runtime evidence to establish negotiated use.',
  },
  'program-charter': {
    change: 'Remove a system from scope and record it under Out of scope with an explicit owner.',
    interpret:
      'Check whether the charter clearly assigns the exclusion and its follow-up. A signed mandate authorizes work only within its stated scope.',
  },
  'initial-scoping': {
    change: 'Change one system’s ownership or priority while keeping the rest of the estate fixed.',
    interpret:
      'Identify who must resolve that system’s unknowns. A scope entry is a planning claim until discovery confirms its dependencies.',
  },
  'skills-team-plan': {
    change:
      'Use the same estate size under the first-two-years and production-rollout staffing assumptions.',
    interpret:
      'Compare the implied staffing need for the same population. Treat the ratio as a planning assumption and check whether specialist skills are available.',
  },
  'crypto-vulnerability-watch': {
    change: 'Load the sample watchlist and inspect the entries for the chosen products.',
    interpret:
      'Check product and version scope before assigning follow-up. A match against the watchlist records a lead, and a missing match does not establish safety.',
  },
  'refresh-cycle-alignment': {
    change: 'Move the next refresh year for one program beyond the planning horizon.',
    interpret:
      'Identify the asset that can no longer wait for the scheduled refresh. Record an earlier intervention or an explicit exception.',
  },
  'infra-modernization-planner': {
    change: 'Extend the root CA lifetime while keeping the end-entity certificate lifetime fixed.',
    interpret:
      'Compare the trust-anchor and leaf lifecycles separately. Frequent leaf renewal does not shorten the lifetime of the trust anchor.',
  },
  'accelerated-execution-profile': {
    change: 'Replace the escalation trigger or change who can authorize the compressed rollout.',
    interpret:
      'Check whether the new trigger leads to an identifiable decision owner, staffing request and risk acceptance before execution.',
  },
  'data-at-rest-strategy': {
    change:
      'For one sample store, switch from re-encrypting with a fresh data key to re-wrapping its existing data key.',
    interpret:
      'Re-wrapping changes how the existing data key is protected. Re-encryption changes the protection of the data itself. Check which action the report assigns.',
  },
  'migration-verification': {
    change: 'Replace an observed negotiation reference with evidence from a different system.',
    interpret:
      'The field can remain populated in both cases. Compare the actual references and system identity before accepting the evidence for closure.',
  },
}
