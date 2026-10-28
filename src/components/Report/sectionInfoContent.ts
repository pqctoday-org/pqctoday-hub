// SPDX-License-Identifier: AGPL-3.0-only

export interface SectionInfoEntry {
  title: string
  summary: string
  wizardInputs: { label: string; detail: string }[]
  scoringPrinciples?: string[]
  personaEffects?: { persona: string; effect: string }[]
  dataSources?: string[]
}

export const SECTION_INFO: Record<string, SectionInfoEntry> = {
  countryTimeline: {
    title: 'Country PQC Timeline',
    summary:
      'Displays sourced PQC milestones for the selected jurisdiction, distinguishing binding requirements from guidance where the data supports that distinction.',
    wizardInputs: [
      {
        label: 'Country (Step 2)',
        detail:
          'Determines which jurisdiction timeline is shown. A published target is not automatically a legal deadline for every organization.',
      },
    ],
    personaEffects: [
      { persona: 'Executive', effect: 'Section is collapsed by default.' },
      { persona: 'Developer / Architect / Researcher', effect: 'Section is collapsed by default.' },
      { persona: 'Ops', effect: 'Section is collapsed by default.' },
    ],
    dataSources: [
      'Timeline database — government PQC milestone documents archived in the Timeline module.',
    ],
  },

  riskScore: {
    title: 'Educational Priority Index',
    summary:
      'An educational 0–100 priority index derived from self-reported answers and model defaults. It is not a measured probability, audit grade, or compliance determination.',
    wizardInputs: [
      {
        label: 'Industry (Step 1)',
        detail:
          'Determines category weights. For example, government and finance weight regulatory pressure higher, while telecom and energy weight migration complexity higher.',
      },
      {
        label: 'Quantum Exposure inputs',
        detail:
          'Algorithms (Step 3), Crypto Use Cases (Step 7), Data Retention (Step 8), Data Sensitivity (Step 4).',
      },
      {
        label: 'Migration Complexity inputs',
        detail:
          'Crypto Agility (Step 11), Infrastructure and its nested vendor model (Step 12), System Scale + Team Size (Step 10).',
      },
      {
        label: 'Regulatory Pressure inputs',
        detail:
          'Compliance Frameworks (Step 5), Industry (Step 1), Country (Step 2), Timeline Pressure (Step 13). Scope still needs source-level verification.',
      },
      {
        label: 'Organizational Readiness inputs',
        detail:
          'Migration Status (Step 9), Team Size (Step 10), Crypto Agility (Step 11), and the nested vendor model in Step 12.',
      },
      {
        label: 'See Risk Breakdown section',
        detail:
          'Full per-category weights and situational boosts are documented under the Risk Breakdown info panel.',
      },
    ],
    scoringPrinciples: [
      'Composite = (QE × w1) + (MC × w2) + (RP × w3) + ((100 − OR) × w4), where OR is readiness (higher is better) and the other categories are attention needs (higher is worse).',
      'Situational boosts (up to +20%) are model rules for compounding answer combinations; they are not empirical loss probabilities.',
      'Risk level thresholds: Low (0\u201325), Medium (26\u201355), High (56\u201375), Critical (76\u2013100).',
    ],
    personaEffects: [
      {
        persona: 'Executive',
        effect:
          'Softer penalties for \u201cI don\u2019t know\u201d on technical questions (crypto agility, infrastructure) because executives delegate these details.',
      },
      {
        persona: 'Developer / Architect / Researcher / Ops',
        effect: 'Standard scoring \u2014 no adjustments.',
      },
    ],
  },

  keyFindings: {
    title: 'Key Findings',
    summary:
      'The 3\u20135 most critical insights automatically identified from your assessment: vulnerable algorithms, compliance gaps, HNDL/HNFL exposure, and migration blockers.',
    wizardInputs: [
      {
        label: 'Algorithms (Step 3)',
        detail: 'Identifies which of your algorithms are quantum-vulnerable.',
      },
      {
        label: 'Compliance (Step 5)',
        detail:
          'Flags selected frameworks recorded with PQC requirements or transition targets; selection does not prove applicability.',
      },
      {
        label: 'Data Retention (Step 7) / Credential Lifetime (Step 8)',
        detail: 'Highlights HNDL or HNFL risk windows.',
      },
      {
        label: 'Migration Status (Step 9)',
        detail: 'Flags if migration has not started.',
      },
    ],
    personaEffects: [
      {
        persona: 'All personas',
        effect: 'Same findings are generated regardless of persona. Visibility is always open.',
      },
    ],
  },

  riskBreakdown: {
    title: 'Risk Breakdown',
    summary:
      'Shows four answer-derived model categories. The weights are editorial planning assumptions, not an external benchmark or maturity certification.',
    wizardInputs: [
      {
        label: 'Quantum Exposure',
        detail:
          'Algorithms (40%), Use Cases (25%), Data Retention (20%), Data Sensitivity (15%). Measures how exposed your data and operations are to quantum attacks.',
      },
      {
        label: 'Migration Complexity',
        detail:
          'Crypto Agility (40%), Infrastructure (30%), System Scale (15%), Vendor Dependency (15%). Measures effort to transition to PQC.',
      },
      {
        label: 'Regulatory Pressure',
        detail:
          'Compliance Frameworks (45%), Industry Regulation (30%), Country Urgency + Timeline Pressure (25%). Measures external pressure to migrate.',
      },
      {
        label: 'Organizational Readiness',
        detail:
          'Migration Status (40%), Team Capacity (25%), Crypto Agility (20%), Vendor Dependency (15%). Measures your organization\u2019s current ability to execute.',
      },
    ],
    scoringPrinciples: [
      'Each category is scored 0\u2013100 independently.',
      'Category weights are industry-specific (e.g., Finance: QE=0.30, MC=0.25, RP=0.25, OR=0.20).',
      'Category drivers (the text under each bar) explain what specifically is pulling each score up or down.',
    ],
    personaEffects: [
      {
        persona: 'Executive',
        effect:
          'Reduced penalties for unknown crypto agility (\u221215%) and unknown infrastructure (\u22123 pts) in Migration Complexity. Reduced penalty for unknown migration status (\u22125 pts) in Org Readiness.',
      },
      {
        persona: 'Developer / Architect / Researcher / Ops',
        effect: 'Standard scoring with no adjustments.',
      },
    ],
    dataSources: [
      'Industry composite weights from assessment configuration.',
      'Requirement and target text from the Compliance dataset; scope still needs source-level verification.',
    ],
  },

  executiveSummary: {
    title: 'Executive Summary',
    summary:
      'A narrative summary of your key risks and recommended priorities, written in language tailored to your persona.',
    wizardInputs: [
      {
        label: 'All wizard inputs',
        detail:
          'The narrative references selected algorithms, potential requirement-review items, infrastructure answers, and migration status. It does not validate the estate.',
      },
    ],
    personaEffects: [
      {
        persona: 'Executive',
        effect:
          'Business and risk language \u2014 board-level urgency, regulatory penalties, budget framing. No algorithm names.',
      },
      {
        persona: 'Developer',
        effect:
          'Technical migration paths with FIPS references, library recommendations, refactoring patterns.',
      },
      {
        persona: 'Architect',
        effect:
          'System topology analysis, infrastructure layer breakdown, dependency mapping, crypto-agility architecture guidance.',
      },
      {
        persona: 'Researcher',
        effect:
          'Scoring formula details, category weights, HNDL/HNFL risk window math, NIST standard references.',
      },
      {
        persona: 'Ops',
        effect:
          'Infrastructure and configuration management focus, automation readiness, operational deployment guidance.',
      },
      {
        persona: 'No persona selected',
        effect: 'Generic narrative covering key risks without role-specific framing.',
      },
    ],
  },

  assessmentProfile: {
    title: 'Assessment Profile',
    summary:
      'A direct snapshot of the selections made in the assessment wizard. No independent evidence or scanning is added.',
    wizardInputs: [
      {
        label: 'All 13 wizard steps',
        detail:
          'Industry, Country, Algorithms, Data Sensitivity, Compliance Frameworks, Migration Status, Use Cases, Data Retention, Credential Lifetime, System Scale, Crypto Agility, Infrastructure, Vendor Dependency, Timeline Pressure.',
      },
    ],
    personaEffects: [
      {
        persona: 'Architect / Researcher',
        effect: 'Section is expanded by default for full visibility.',
      },
      {
        persona: 'Executive / Developer / Ops',
        effect: 'Section is collapsed by default (click to expand).',
      },
    ],
  },

  hndlHnfl: {
    title: 'HNDL & HNFL Risk Windows',
    summary:
      'Compares self-reported retention or credential lifetime with an explicit planning horizon. It illustrates exposure timing; it does not predict CRQC arrival.',
    wizardInputs: [
      {
        label: 'Data Retention (Step 7)',
        detail:
          'HNDL: how many years your data must stay confidential. Longer retention = larger risk window.',
      },
      {
        label: 'Credential Lifetime (Step 8)',
        detail:
          'HNFL: how many years your signed artifacts must remain trusted. Longer lifetime = larger risk window.',
      },
      {
        label: 'Country (Step 2)',
        detail:
          'Adds a separately labelled jurisdiction planning milestone when one is available. It does not change the site-wide CRQC planning assumption used by the HNDL/HNFL illustration.',
      },
      {
        label: 'Algorithms (Step 3)',
        detail: 'HNFL only applies when signing algorithms (RSA, ECDSA, EdDSA) are present.',
      },
      {
        label: 'Use Cases (Step 6)',
        detail:
          'Use cases with high HNFL relevance (code signing, PKI, digital identity) are flagged.',
      },
    ],
    scoringPrinciples: [
      'HNDL attention flag: (current year + retention years) > the site-wide CRQC planning anchor.',
      'HNFL attention flag: signing algorithms are present AND (current year + credential lifetime) > the site-wide CRQC planning anchor.',
      'Illustrative window = years beyond the CRQC planning anchor; it is not a measured probability or predicted arrival date.',
      '\u201cI don\u2019t know\u201d responses use conservative industry defaults (e.g., 75 years for government retention, 10 years for credential lifetime).',
    ],
    personaEffects: [
      {
        persona: 'Executive / Ops',
        effect: 'Section is hidden in summary mode (visible in full report).',
      },
      { persona: 'Developer / Architect / Researcher', effect: 'Section is open by default.' },
    ],
  },

  discovery: {
    title: 'Cryptographic Discovery',
    summary:
      'Frames "where is my crypto" — the standard first pillar of a PQC migration — using your self-reported algorithms/families as a starting inventory, not a scan of your actual systems.',
    wizardInputs: [
      {
        label: 'Algorithms (Step 3)',
        detail:
          'The specific algorithms (or, if unknown, the coarse families) you selected are listed as your starting inventory.',
      },
    ],
    personaEffects: [{ persona: 'All personas', effect: 'Section is collapsed by default.' }],
    dataSources: ['Your own assessment answers only — no external inventory or scan data.'],
  },

  cbom: {
    title: 'Cryptographic Bill of Materials (CBOM)',
    summary:
      'Renders the latest CBOM you saved from the Library CBOM Builder (Command Center) as real numbers — component/crypto-asset counts, a quantum-safe vs. quantum-vulnerable split, and per-algorithm standard citations from the CycloneDX Cryptography Registry.',
    wizardInputs: [],
    scoringPrinciples: [
      'Every algorithm is either post-quantum (safe) or classical (quantum-vulnerable) at detection time — there is no "unknown" bucket, since text-based detection either identifies a specific algorithm or finds nothing at all.',
      'Standard citations (e.g. FIPS 203/204/205) come only from the official CycloneDX Cryptography Registry — never fabricated. Algorithms without a published standard yet (e.g. Falcon, pending FIPS 206) show that honestly instead of a placeholder citation.',
    ],
    personaEffects: [{ persona: 'All personas', effect: 'Section is collapsed by default.' }],
    dataSources: [
      'Your own saved CBOM export from the Library CBOM Builder — not a scan of your actual systems, and independent of the assessment wizard.',
    ],
  },

  algorithmMigration: {
    title: 'Candidate Algorithm Transitions',
    summary:
      'Maps each selected primitive to candidate PQC transitions and modelled complexity. The correct choice depends on function, protocol, security category, interoperability and authority.',
    wizardInputs: [
      {
        label: 'Algorithms (Step 3)',
        detail:
          'Each selected primitive is looked up for quantum vulnerability and candidate transitions. RSA is dual-use, so its KEM or signature path must be confirmed.',
      },
      {
        label: 'Crypto Agility (Step 11)',
        detail:
          'Affects effort estimate \u2014 hardcoded crypto means higher migration effort per algorithm.',
      },
      {
        label: 'Infrastructure (Step 12)',
        detail: 'HSM and legacy systems increase migration complexity and effort scope.',
      },
      {
        label: 'Compliance (Step 5)',
        detail:
          'Selected sources recorded with PQC requirements increase modelled urgency; applicability requires separate verification.',
      },
    ],
    scoringPrinciples: [
      'Urgency labels are planning heuristics generated from the answers, not authoritative implementation deadlines.',
      'Effort scope: Quick-win, Moderate, Major project, or Multi-year \u2014 based on crypto agility and infrastructure complexity.',
    ],
    personaEffects: [
      {
        persona: 'Executive',
        effect: 'Section is hidden in summary mode (visible in full report).',
      },
      {
        persona: 'Developer / Architect / Researcher / Ops',
        effect: 'Section is open by default.',
      },
    ],
    dataSources: [
      'Algorithm database aligned to NIST FIPS 203/204/205 primitives; application-level transition choices still require protocol and authority review.',
    ],
  },

  complianceImpact: {
    title: 'Compliance Impact',
    summary:
      'Shows recorded PQC requirement status and transition targets for selected frameworks, with scope context and source-navigation links.',
    wizardInputs: [
      {
        label: 'Compliance Frameworks (Step 5)',
        detail:
          'Each selected framework is looked up for PQC requirement status, targets and notes. The profile filter is educational support, not a legal applicability decision.',
      },
      {
        label: 'Industry (Step 1)',
        detail: 'Filters the available compliance frameworks to those relevant to your industry.',
      },
      {
        label: 'Country (Step 2)',
        detail: 'Country-specific compliance frameworks (e.g., CNSA 2.0 for US) are highlighted.',
      },
    ],
    personaEffects: [
      {
        persona: 'All personas',
        effect:
          'Same compliance data is shown regardless of persona. Section is always open by default.',
      },
    ],
    dataSources: [
      'Compliance database with framework requirements and deadlines.',
      'Library references linking to NIST standards and specifications.',
      'Timeline milestones for country-specific regulatory events.',
    ],
  },

  recommendedActions: {
    title: 'Recommended Actions',
    summary:
      'Prioritized learning and investigation prompts generated from the assessment inputs. Effort labels are coarse model bands, not project estimates.',
    wizardInputs: [
      {
        label: 'Algorithms (Step 3)',
        detail: 'Generates migration actions for each quantum-vulnerable algorithm.',
      },
      {
        label: 'Infrastructure (Step 12)',
        detail: 'Infrastructure-specific actions (e.g., HSM firmware upgrades, PKI re-issuance).',
      },
      {
        label: 'Compliance (Step 5)',
        detail: 'Actions for meeting compliance framework deadlines.',
      },
      {
        label: 'Migration Status (Step 9)',
        detail:
          'Actions are prioritized differently based on whether migration has started, is planned, or has not begun.',
      },
      {
        label: 'Crypto Agility (Step 11)',
        detail: 'If hardcoded, an action to introduce an abstraction layer is prioritized.',
      },
      {
        label: '\u201cI don\u2019t know\u201d responses',
        detail:
          'Each unknown generates a specific awareness-gap action recommending an audit of that area.',
      },
    ],
    scoringPrinciples: [
      'Actions are categorized as Immediate, Short-term, or Long-term based on urgency.',
      'Effort levels (Low, Medium, High) are assigned based on scope and infrastructure complexity.',
      'Actions are numbered by priority, with the most urgent and impactful first.',
    ],
    personaEffects: [
      {
        persona: 'Executive',
        effect:
          'Only the top 5 actions are shown in summary mode. Full list available in full report.',
      },
      {
        persona: 'Developer / Architect / Researcher / Ops',
        effect: 'All actions are shown by default.',
      },
    ],
  },

  migrationRoadmap: {
    title: 'Migration Roadmap',
    summary:
      'Groups suggested actions into planning lanes and shows a sourced jurisdiction milestone. Guidance targets and binding deadlines remain distinct.',
    wizardInputs: [
      {
        label: 'Recommended Actions',
        detail:
          'The roadmap is a visual grouping of the same actions from the Recommended Actions section.',
      },
      {
        label: 'Country (Step 2)',
        detail:
          'The selected jurisdiction’s next sourced milestone is shown as either guidance or a regulatory deadline according to its recorded mandate type.',
      },
    ],
    personaEffects: [
      { persona: 'Executive', effect: 'Section is collapsed by default.' },
      { persona: 'Ops', effect: 'Section is open by default.' },
      { persona: 'Developer / Architect / Researcher', effect: 'Section is open by default.' },
    ],
  },

  migrationToolkit: {
    title: 'Migration Toolkit',
    summary:
      'Shows products from the Migrate catalog that match your infrastructure and industry, helping you identify tools for your PQC migration.',
    wizardInputs: [
      {
        label: 'Infrastructure (Step 12)',
        detail:
          'Products are filtered to match your selected infrastructure layers and sub-categories (e.g., TLS libraries, PKI platforms, HSM vendors).',
      },
      {
        label: 'Industry (Step 1)',
        detail: 'Products are further filtered by industry relevance.',
      },
    ],
    personaEffects: [
      { persona: 'Executive', effect: 'Section is collapsed by default.' },
      { persona: 'Ops', effect: 'Section is open by default.' },
      { persona: 'Developer / Architect / Researcher', effect: 'Section is open by default.' },
    ],
    dataSources: [
      'Migrate catalog \u2014 PQC-ready software products with FIPS status, algorithm support, and infrastructure layer classification.',
    ],
  },

  vendorRisk: {
    title: 'Third-Party & Vendor PQC Risk',
    summary:
      'Frames the selected vendor-dependency model and lists catalog examples matched to the profile. Matches are not detected products or an estate inventory.',
    wizardInputs: [
      {
        label: 'Vendor Dependency (Step 12, part of Infrastructure)',
        detail:
          'Heavy-vendor, open-source, mixed, or in-house \u2014 determines the framing text shown for how much of your migration is bound by third parties.',
      },
      {
        label: 'Infrastructure + Industry (Steps 1, 12)',
        detail:
          'Same matching used by the Migration Toolkit — filters the Migrate catalog to examples worth investigating, not products known to be deployed.',
      },
    ],
    personaEffects: [{ persona: 'All personas', effect: 'Section is collapsed by default.' }],
    dataSources: [
      'Migrate catalog + vendor registry \u2014 the same proof-gated product and vendor PQC-commitment data used on the Migrate page.',
    ],
  },

  roiCalculator: {
    title: 'ROI Calculator',
    summary:
      'An illustrative cost/benefit scenario seeded from assessment answers and editorial assumptions. It is not a quote, forecast, regulatory exposure calculation, or finance-approved business case; replace every assumption with organization-specific evidence.',
    wizardInputs: [
      {
        label: 'Algorithm Migrations (Step 3)',
        detail:
          'Number of quantum-vulnerable algorithms determines the base engineering cost ($30K per algorithm, scaled by system count).',
      },
      {
        label: 'Infrastructure Layers (Step 12)',
        detail:
          'Each selected layer (Hardware, Security Stack, OS, Network, Application, Cloud, Database) adds its estimated migration cost. Hardware/HSM is the most expensive; cloud is the least.',
      },
      {
        label: 'Vendor Dependency (nested in Step 12)',
        detail:
          'Heavy vendor dependency increases cost (vendor coordination, licensing, upgrade cycles). Open-source and in-house reduce it.',
      },
      {
        label: 'Migration Status (Step 9)',
        detail:
          'Already-started migrations reduce remaining cost to 40%. Planning phase applies 70%. Not-started uses the full estimate.',
      },
      {
        label: 'Crypto Agility (Step 11)',
        detail:
          'Hardcoded crypto increases cost by 50% (major refactoring). Fully-abstracted reduces cost by 40%.',
      },
      {
        label: 'Team Size (Step 10)',
        detail:
          'Small teams (1\u201310) face 30% higher costs due to longer timelines. Large teams (200+) can parallelize for 15% savings.',
      },
      {
        label: 'Compliance Frameworks (Step 5)',
        detail:
          'A rough penalty scenario may be seeded from a selected framework. Selection does not establish applicability, violation, enforcement likelihood, or recoverable savings.',
      },
      {
        label: 'Industry (Step 1)',
        detail:
          'Industry breach cost baselines (e.g., Healthcare $9.8M, Finance $6.1M) seed the risk-avoidance benefit calculation.',
      },
    ],
    scoringPrinciples: [
      'Migration Cost = (Algorithm Base + Infrastructure Base) \u00d7 Vendor \u00d7 Migration Status \u00d7 Agility \u00d7 Team Size. Floor: $50K.',
      'Algorithm Base = Vulnerable algorithm count \u00d7 $30K \u00d7 system scale multiplier.',
      'Infrastructure Base = sum of per-layer costs for selected layers (Hardware $120K, Security Stack $80K, OS $60K, Network $50K, Application $40K, Database $35K, Cloud $30K).',
      'Illustrative avoided-cost scenario = editable scenario probability \u00d7 industry baseline \u00d7 planning horizon. The initial probability is a model seed derived from half the priority index and capped at 50%; it is not a measured breach probability.',
      'Compliance Savings = compliance penalty per incident \u00d7 number of PQC-mandating frameworks. Penalty seeded from the highest framework-specific baseline.',
      'Net ROI = ((Avoided Breach Cost + Compliance Savings \u2212 Migration Cost) / Migration Cost) \u00d7 100%.',
      'Payback Period = Migration Cost / (Total Benefit / 12 months).',
    ],
    personaEffects: [
      {
        persona: 'All personas',
        effect:
          'Same calculator is available to all personas. Section is collapsed by default for everyone.',
      },
    ],
    dataSources: [
      'Industry breach cost baselines: insurance-claim incident costs (lower bound) from the NetDiligence Cyber Claims Study 2025.',
      'Illustrative regulatory maximums or baselines used as editable scenario inputs, not predicted penalties.',
      'Editorial infrastructure-layer cost assumptions; no measured market benchmark is claimed.',
    ],
  },

  kpiTrending: {
    title: 'KPI Trending',
    summary:
      'Compares the educational priority index and category values across multiple self-assessments. Each completion saves a model snapshot. The line chart plots index history, while the radar chart compares current category values with the previous snapshot; neither proves migration progress.',
    wizardInputs: [
      {
        label: 'Assessment History',
        detail:
          'Each completed assessment saves the educational priority index, model band, and four category values. Up to five snapshots are retained.',
      },
      {
        label: 'All wizard inputs (indirectly)',
        detail:
          'Each snapshot captures the computed priority index and category values at completion time. Changing answers and completing again creates a new model snapshot.',
      },
    ],
    scoringPrinciples: [
      'Line chart: plots each snapshot\u2019s educational priority index (0\u2013100). Reference lines at 70 and 40 show editorial model-band thresholds, not externally validated risk thresholds.',
      'Radar chart: overlays your current four category scores (Quantum Exposure, Migration Complexity, Regulatory Pressure, Org Readiness) against the previous assessment\u2019s scores.',
      'Delta badge: the colored pill under the priority gauge shows the point change since the previous self-assessment (\u2212 green, + red); it reflects answer/model changes, not measured risk reduction.',
      'The line chart requires at least 2 completed assessments to appear. The radar chart shows from the first assessment onward.',
      'History is preserved when you reset and re-take the assessment so you can compare model snapshots over time.',
    ],
    personaEffects: [
      {
        persona: 'All personas',
        effect:
          'Same charts are shown regardless of persona. Requires at least two completed assessments to show the line chart trend.',
      },
    ],
    dataSources: [
      'Assessment snapshots stored in your browser\u2019s local storage (up to 5 most recent).',
      'Current values are recomputed live from the latest answers using the same model as the Educational Priority Index section.',
    ],
  },

  threatLandscape: {
    title: 'Industry Threat Landscape',
    summary:
      'Shows industry-specific quantum threats matched against your current algorithms, sourced from the Threats database.',
    wizardInputs: [
      {
        label: 'Industry (Step 1)',
        detail:
          'Filters threats to your industry. Each industry has a specific set of quantum threat scenarios.',
      },
      {
        label: 'Algorithms (Step 3)',
        detail:
          'Threats are matched against your selected algorithms to highlight which are relevant to your stack.',
      },
    ],
    personaEffects: [
      {
        persona: 'Architect / Researcher',
        effect: 'Section is expanded by default for deeper analysis.',
      },
      {
        persona: 'Executive / Developer / Ops',
        effect: 'Section is collapsed by default.',
      },
    ],
    dataSources: [
      'Threats database \u2014 industry-specific quantum threat scenarios with affected algorithms and mitigation strategies.',
    ],
  },
}
