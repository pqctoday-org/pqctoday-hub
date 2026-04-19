// SPDX-License-Identifier: GPL-3.0-only

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
      'Displays the PQC migration phases and regulatory deadlines for the country you selected in the assessment wizard.',
    wizardInputs: [
      {
        label: 'Country (Step 2)',
        detail:
          'Determines which country timeline is shown. Each country has its own regulatory milestones, phases, and deadline targets sourced from government publications.',
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
    title: 'Risk Score',
    summary:
      'A composite score from 0 to 100 that quantifies your organization\u2019s quantum risk. Higher scores mean more urgent action is needed.',
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
          'Crypto Agility (Step 11), Infrastructure (Step 12), System Scale + Team Size (Step 10), Vendor Dependency (Step 13).',
      },
      {
        label: 'Regulatory Pressure inputs',
        detail:
          'Compliance Frameworks (Step 5), Industry (Step 1), Country (Step 2), Timeline Pressure (Step 13).',
      },
      {
        label: 'Organizational Readiness inputs',
        detail:
          'Migration Status (Step 6), Team Size (Step 10), Crypto Agility (Step 11), Vendor Dependency (Step 13).',
      },
      {
        label: 'See Risk Breakdown section',
        detail:
          'Full per-category weights and situational boosts are documented under the Risk Breakdown info panel.',
      },
    ],
    scoringPrinciples: [
      'Composite = (QE \u00d7 w1) + (MC \u00d7 w2) + (RP \u00d7 w3) + (OR \u00d7 w4), where weights are industry-specific.',
      'Situational boosts (up to +20%) apply for compounding risks: critical data with long retention and no migration started (HNDL), signing algorithms with long credential lifetime (HNFL), government with CNSA 2.0 obligations, or hardcoded crypto with legacy infrastructure.',
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
        detail: 'Flags frameworks with approaching PQC deadlines.',
      },
      {
        label: 'Data Retention (Step 8) / Credential Lifetime (Step 9)',
        detail: 'Highlights HNDL or HNFL risk windows.',
      },
      {
        label: 'Migration Status (Step 6)',
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
      'Shows your score across four risk categories, each computed from specific wizard inputs with industry-tuned weights.',
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
      'Compliance framework deadlines from Compliance database.',
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
          'The narrative references your specific algorithms, compliance gaps, infrastructure, and migration status.',
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
      'A direct snapshot of all the selections you made in the assessment wizard. No scoring is applied \u2014 this is purely for reference.',
    wizardInputs: [
      {
        label: 'All 14 wizard steps',
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
      'Calculates whether adversaries can harvest your encrypted data now and decrypt it later (HNDL), or forge your digital signatures retroactively (HNFL).',
    wizardInputs: [
      {
        label: 'Data Retention (Step 8)',
        detail:
          'HNDL: how many years your data must stay confidential. Longer retention = larger risk window.',
      },
      {
        label: 'Credential Lifetime (Step 9)',
        detail:
          'HNFL: how many years your signed artifacts must remain trusted. Longer lifetime = larger risk window.',
      },
      {
        label: 'Country (Step 2)',
        detail:
          'Determines the estimated quantum threat year. Countries with earlier regulatory deadlines (e.g., US and France target 2030) use an accelerated horizon.',
      },
      {
        label: 'Algorithms (Step 3)',
        detail: 'HNFL only applies when signing algorithms (RSA, ECDSA, EdDSA) are present.',
      },
      {
        label: 'Use Cases (Step 7)',
        detail:
          'Use cases with high HNFL relevance (code signing, PKI, digital identity) are flagged.',
      },
    ],
    scoringPrinciples: [
      'HNDL: At risk when (current year + retention years) > estimated quantum threat year.',
      'HNFL: At risk when signing algorithms are present AND (current year + credential lifetime) > estimated quantum threat year.',
      'Risk window = years of exposure beyond the quantum threat horizon.',
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

  algorithmMigration: {
    title: 'Algorithm Migration Priority',
    summary:
      'Maps each classical algorithm you selected to its NIST-recommended post-quantum replacement, with urgency and effort estimates.',
    wizardInputs: [
      {
        label: 'Algorithms (Step 3)',
        detail:
          'Each selected algorithm is looked up in the algorithm database to determine quantum vulnerability and recommended PQC replacement (e.g., RSA-2048 \u2192 ML-KEM, ECDSA \u2192 ML-DSA).',
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
        detail: 'Frameworks with PQC mandates increase urgency for vulnerable algorithms.',
      },
    ],
    scoringPrinciples: [
      'Urgency levels: Immediate (quantum-vulnerable + compliance deadline), Near-term (quantum-vulnerable, no immediate deadline), Long-term (not directly vulnerable).',
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
    dataSources: ['Algorithm database with NIST FIPS 203/204/205 replacement mappings.'],
  },

  complianceImpact: {
    title: 'Compliance Impact',
    summary:
      'Shows PQC mandates and deadlines for the compliance frameworks you selected, with links to relevant standards and timeline milestones.',
    wizardInputs: [
      {
        label: 'Compliance Frameworks (Step 5)',
        detail:
          'Each selected framework is looked up for PQC requirements, deadlines, and notes. Only frameworks matching your selected industry are available.',
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
      'Prioritized action items generated from your specific assessment inputs. Each action includes an effort estimate and links to relevant modules for next steps.',
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
        label: 'Migration Status (Step 6)',
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
      'Groups your recommended actions into Immediate, Short-term, and Long-term swim lanes, aligned with your country\u2019s regulatory deadline.',
    wizardInputs: [
      {
        label: 'Recommended Actions',
        detail:
          'The roadmap is a visual grouping of the same actions from the Recommended Actions section.',
      },
      {
        label: 'Country (Step 2)',
        detail:
          'The country\u2019s regulatory deadline is shown as a target marker on the timeline.',
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

  roiCalculator: {
    title: 'ROI Calculator',
    summary:
      'An interactive cost/benefit model for your PQC migration. All four inputs are auto-calculated from your assessment answers \u2014 infrastructure layers, vendor dependency, migration status, crypto agility, and team size all factor in. Override any field to match your organization\u2019s actuals.',
    wizardInputs: [
      {
        label: 'Algorithm Migrations (Step 3)',
        detail:
          'Number of quantum-vulnerable algorithms determines the base engineering cost ($30K per algorithm, scaled by system count).',
      },
      {
        label: 'Infrastructure Layers (Step 11)',
        detail:
          'Each selected layer (Hardware, Security Stack, OS, Network, Application, Cloud, Database) adds its estimated migration cost. Hardware/HSM is the most expensive; cloud is the least.',
      },
      {
        label: 'Vendor Dependency (Step 11)',
        detail:
          'Heavy vendor dependency increases cost (vendor coordination, licensing, upgrade cycles). Open-source and in-house reduce it.',
      },
      {
        label: 'Migration Status (Step 6)',
        detail:
          'Already-started migrations reduce remaining cost to 40%. Planning phase applies 70%. Not-started uses the full estimate.',
      },
      {
        label: 'Crypto Agility (Step 10)',
        detail:
          'Hardcoded crypto increases cost by 50% (major refactoring). Fully-abstracted reduces cost by 40%.',
      },
      {
        label: 'Team Size (Step 9)',
        detail:
          'Small teams (1\u201310) face 30% higher costs due to longer timelines. Large teams (200+) can parallelize for 15% savings.',
      },
      {
        label: 'Compliance Frameworks (Step 5)',
        detail:
          'Compliance penalty is auto-populated from framework-specific baselines (e.g., GDPR up to $20M, HIPAA $1.5M, PCI DSS $500K). Uses the highest applicable penalty as the default.',
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
      'Avoided Breach Cost = (breach probability %) \u00d7 industry breach baseline \u00d7 planning horizon (years). Breach probability seeded from risk score / 2, capped at 50%.',
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
      'Industry breach cost baselines from IBM Cost of a Data Breach Report 2024.',
      'Compliance penalty baselines from published regulatory enforcement data (GDPR Art. 83, HIPAA, PCI SSC, NERC, MiCA, etc.).',
      'Infrastructure layer cost estimates based on industry migration complexity analysis.',
    ],
  },

  kpiTrending: {
    title: 'KPI Trending',
    summary:
      'Tracks your PQC risk score and category breakdown across multiple assessments over time, showing your migration progress. Each completed assessment saves a snapshot of your scores. The line chart plots overall risk score history, while the radar chart compares your current category scores against the previous assessment.',
    wizardInputs: [
      {
        label: 'Assessment History',
        detail:
          'Each time you complete an assessment, a snapshot is saved with your risk score, risk level, and all four category scores. Up to 5 snapshots are retained.',
      },
      {
        label: 'All wizard inputs (indirectly)',
        detail:
          'Each snapshot captures the computed risk score and category scores at completion time. Changing wizard inputs and re-completing the assessment generates a new snapshot with updated scores.',
      },
    ],
    scoringPrinciples: [
      'Line chart: plots each snapshot\u2019s composite risk score (0\u2013100) over time. Reference lines at 70 (High) and 40 (Medium) show risk level thresholds.',
      'Radar chart: overlays your current four category scores (Quantum Exposure, Migration Complexity, Regulatory Pressure, Org Readiness) against the previous assessment\u2019s scores.',
      'Delta badge: the colored pill under the Risk Score gauge shows the point change since your last assessment (\u2212 green = improved, + red = worsened).',
      'The line chart requires at least 2 completed assessments to appear. The radar chart shows from the first assessment onward.',
      'History is preserved when you reset and re-take the assessment, so you can track progress over time.',
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
      'Current scores are recomputed live from your latest wizard inputs using the same scoring engine as the Risk Score section.',
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
