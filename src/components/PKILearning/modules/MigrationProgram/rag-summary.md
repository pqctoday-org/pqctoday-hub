# Migration Program Management

## Overview

The Migration Program Management module teaches executives how to plan, execute, and track a PQC migration program at enterprise scale. It covers roadmap building with milestone planning overlaid on real country and compliance deadlines, stakeholder communication planning with audience-specific messaging frameworks, and KPI tracking for measuring migration progress. The module aligns with a phased migration model (per CISA / NIST NCCoE guidance) — NIST IR 8547 itself is the algorithm deprecation/disallow timeline, not a migration framework — and integrates live timeline data from the app's country deadline database.

## Key Concepts

- **Phased Migration Model** — Discovery, Inventory, Prioritization, Planning, Pilot, Migration, Validation
- **Migration Roadmap** — Gantt-style timeline with organizational milestones overlaid on external compliance deadlines (CNSA 2.0, NIST, EU/ANSSI); enables gap analysis between planned milestones and regulatory requirements
- **Stakeholder Communication** — structured framework covering stakeholder mapping, audience-specific messaging (board/C-suite, technical leadership, development teams, external partners), reporting cadence, and escalation criteria
- **KPI Tracking** — role-specific planning measures, with catalogue-derived vendor measures restricted to selected products. Progress, compliance closure and pace require organization-entered values. Missing values stay unscored; the combined worksheet score requires at least 70% of the weight of the KPIs that can be scored to have values; KPIs marked data unavailable are left out of that total. That display rule does not establish organizational readiness.
- **Critical Success Factors** — executive sponsorship, cross-functional team formation, phased approach with gate reviews, measurable KPIs, and continuous communication
- **Program vs. Project** — PQC migration is a multi-year program encompassing multiple projects across infrastructure layers, not a single project with a fixed timeline

## Workshop / Interactive Activities

The workshop has 4 interactive steps:

1. **Roadmap Builder** — interactive timeline planner with draggable milestones overlaid on country-specific compliance deadlines; default milestones for crypto inventory, TLS pilot, and full migration; exports as Markdown
2. **Stakeholder Communications Planner** — 4-section artifact builder covering stakeholder map, message framework (per audience), communication cadence, and escalation criteria; produces a structured communications plan document
3. **KPI Tracker Template** — role-specific planning scorecard; screen and saved Markdown withhold the combined score below the same coverage threshold. Restoring an untouched saved worksheet preserves its missing-input state. Assessment-index history is distinct from measured migration progress.
4. **Deployment Playbook** — a planning template for deployment activities, responsibilities and validation checks.

## Related Standards

- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0)
- PMI PMBOK (Project Management Body of Knowledge)
- CISA Post-Quantum Cryptography Initiative

Measurement evidence fields in KPI Tracker (numerator, denominator, unit, period, as-of date, owner, reference and verification state) are saved with the scorecard, restored on reopening and included in Markdown and CSV exports. Entering a reference does not verify it; the default verification state remains not verified.
