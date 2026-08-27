import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import security from 'eslint-plugin-security'
import eslintConfigPrettier from 'eslint-config-prettier'
import testingLibrary from 'eslint-plugin-testing-library'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: [
      'dist',
      'public/dist',
      'src/wasm',
      'public/wasm',
      'src/vendor',
      '**/*.min.js',
      'public/coi-serviceworker.js',
      'public/embed/sdk.js',
    ],
  },

  // Base JS rules
  js.configs.recommended,
  {
    plugins: { security },
    rules: security.configs.recommended.rules,
  },

  // TypeScript rules - ONLY for TS files
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),

  // React/Browser config for src
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXElement[openingElement.name.name='button']",
          message:
            'Raw HTML <button> tags are blocked for UI consistency. Please import and use the <Button> component from `src/components/ui/button.tsx` instead.',
        },
        {
          selector: "JSXElement[openingElement.name.name='select']",
          message:
            'Raw HTML <select> tags are blocked for UI consistency. Please import and use the <FilterDropdown> component from `src/components/common/FilterDropdown.tsx` instead. If FilterDropdown genuinely cannot express the control (e.g. <optgroup> or per-option disabled), keep the <select>, document why inline, and add a narrow `eslint-disable-next-line no-restricted-syntax` with that reason.',
        },
      ],
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  // Node config for root files, scripts, and e2e
  {
    files: [
      '*.{js,cjs,mjs,ts}',
      'e2e/**/*.{ts,js}',
      'scripts/**/*.{js,cjs,mjs,ts}',
      'test-improvements.cjs',
    ],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'no-unused-vars': 'warn',
    },
  },

  // Test files config
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: {
      'testing-library': testingLibrary,
    },
    rules: {
      ...testingLibrary.configs.react.rules,
      'testing-library/no-node-access': 'warn', // Downgrade to warn or keep error but allow suppression
    },
  },

  // Educational components - allow console.log for teaching cryptographic flows
  {
    files: ['src/components/PKILearning/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off', // Educational components demonstrate crypto flows via console
    },
  },

  // Analytics and data loading - allow console for debugging
  {
    files: ['src/utils/analytics.ts', 'src/data/*.ts', 'src/services/storage/*.ts'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }], // Downgrade to warning
    },
  },

  // Debug scripts - allow console.log
  {
    files: ['src/scripts/**/*.ts'],
    rules: {
      'no-console': 'off', // Debug scripts can use console
    },
  },

  // Mobile UX layer isolation boundary (IMPLEMENTATION-PLAN.md §5.2 —
  // "Forbidden edits: viewport branches inside shared components"). Files
  // under src/components/Mobile/ may import data modules, hooks and stores
  // freely, but never a desktop VIEW component — that's exactly how a
  // "quick mobile tweak" turns into a change the laptop UI also renders.
  // ui/ is exempt (shared primitives, not desktop-specific views); Mobile/
  // itself is exempt (internal imports between its own files).
  //
  // A handful of pure logic/data modules (no JSX, no rendering) legitimately
  // live inside a Feature's components/ directory rather than under src/data/
  // — e.g. railNav.ts (Layout's rail-section logic) and usePatentKpis.ts
  // (Patents' KPI derivation hook). Reading these directly is exactly Rule 2
  // ("same data sources") working as intended, not a boundary violation, so
  // each gets an explicit, reviewed exception here rather than opening its
  // whole feature directory.
  //
  // A second, narrower category: a .tsx component EXPLICITLY built for reuse
  // across callers, with no baked-in desktop-only layout of its own — e.g.
  // RoleHomeView (its own doc comment: "Self-contained: not wired into
  // routing/LandingView here. The caller decides where this renders"), whose
  // per-role urgency/first-win copy is hand-authored editorial text that must
  // never be forked into a second copy. Importing it means an edit to that
  // file could still affect desktop's LandingView — accepted deliberately,
  // caught by the Rule 1 DOM-invariance gate (which already samples `/`) if
  // it ever actually happens. This is NOT a license to reach for any
  // component that merely looks reusable; each one is its own reviewed line.
  //
  // Each exception needs FOUR lines, not one — this is the `ignore` package
  // (gitignore semantics) `no-restricted-imports` runs on under the hood, and
  // gitignore refuses to un-ignore a file inside an already-fully-ignored
  // directory. `!@/components/Foo/bar` alone is silently a no-op. The
  // correct idiom: un-ignore the directory itself (so the matcher can look
  // inside it), immediately re-ignore everything else in it, then un-ignore
  // the one file. Verified against the `ignore` package directly before
  // landing this — a `!@/components/Layout` line with no matching
  // `@/components/Layout/*` re-block silently allowed MainLayout.tsx too,
  // which is exactly the desktop-view leak this rule exists to prevent.
  //
  // Add a new exception only for a genuinely non-view module (no JSX) — a
  // real .tsx component belongs behind a pure-move extraction (§5.4) instead.
  {
    files: ['src/components/Mobile/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/components/*',
                '!@/components/ui',
                '!@/components/ui/*',
                '!@/components/Mobile',
                '!@/components/Mobile/*',
                // railNav.ts (Layout) — pure rail-section logic, no JSX.
                '!@/components/Layout',
                '@/components/Layout/*',
                '!@/components/Layout/railNav',
                // usePatentKpis.ts (Patents/redesign) / patentColumns.ts
                // (isPqcPatent) — pure logic, no JSX. Real bug found and
                // fixed 2026-08-23 (Phase 7, Patents screen): this block was
                // missing the `@/components/Patents/*` re-block line the
                // doc comment above mandates — `!@/components/Patents` alone
                // silently allowed the WHOLE Patents directory through
                // (PatentsTable.tsx, PatentsViewRedesign.tsx, real desktop
                // views), not just usePatentKpis. Verified against the
                // `ignore` package before and after this fix.
                '!@/components/Patents',
                '@/components/Patents/*',
                '!@/components/Patents/patentColumns',
                '!@/components/Patents/redesign',
                '@/components/Patents/redesign/*',
                '!@/components/Patents/redesign/usePatentKpis',
                // aboutData.ts (About) — pure data, no JSX: DISCUSSIONS/
                // DISCUSSIONS_BASE/CRYPTO_BUFF_SITES/CRYPTO_BUFF_BOOKS, the
                // same real arrays CommunitySection/CryptoBuffSection read,
                // so the mobile About screen's counts and links can never
                // drift from desktop's.
                '!@/components/About',
                '@/components/About/*',
                '!@/components/About/aboutData',
                // useBusinessMetrics.ts (hooks) / cswp39Tier.ts (lib) — pure
                // hook + pure logic, no JSX: the real metrics hook and tier
                // computation every desktop Command Center panel reads, so
                // a zone's maturity tier can never drift from desktop's.
                // businessToolsRegistry.tsx — pure data (icon type refs, no
                // JSX). ActionItemsSection.tsx (sections) — explicitly
                // generic, already `max-md:flex-col`, no baked-in desktop-
                // only layout; imported directly so "Your next steps" can
                // never drift from desktop's.
                '!@/components/BusinessCenter',
                '@/components/BusinessCenter/*',
                '!@/components/BusinessCenter/businessToolsRegistry',
                '!@/components/BusinessCenter/hooks',
                '@/components/BusinessCenter/hooks/*',
                '!@/components/BusinessCenter/hooks/useBusinessMetrics',
                '!@/components/BusinessCenter/lib',
                '@/components/BusinessCenter/lib/*',
                '!@/components/BusinessCenter/lib/cswp39Tier',
                '!@/components/BusinessCenter/sections',
                '@/components/BusinessCenter/sections/*',
                '!@/components/BusinessCenter/sections/ActionItemsSection',
                // Cswp39SectionBadge.tsx (widgets) — explicitly generic
                // (own doc comment: a "hover-popover badge" with no
                // baked-in desktop-only layout; its optional hover/focus
                // tooltip just won't trigger on touch — the required
                // §-ref text always renders). Imported directly so a
                // business tool's CSWP.39 provenance chip can never
                // drift from desktop's.
                '!@/components/BusinessCenter/widgets',
                '@/components/BusinessCenter/widgets/*',
                '!@/components/BusinessCenter/widgets/Cswp39SectionBadge',
                // ReportUpgradeNudge.tsx (Report/redesign) — explicitly
                // generic, no baked-in desktop-only layout (already
                // grid-cols-1/flex-wrap below md). reportContentActions.ts
                // (Report/sections) — pure logic, no JSX: the real
                // share-token/navigator.share mechanism. Imported directly
                // so the mobile Report screen's share link and copy can
                // never drift from desktop's. (TopThreeActions.tsx's own
                // exception lives in the pre-existing common/ block below —
                // same reasoning: "so dense pages... can offer a 'do this
                // now' hero".)
                // faqData.ts (FAQ) — pure data, no JSX. The real FAQ_DATA
                // catalogue every desktop FAQ view reads, so the ⋯ sheet's
                // FAQ row count can never drift from the real question count.
                '!@/components/FAQ',
                '@/components/FAQ/*',
                '!@/components/FAQ/faqData',
                '!@/components/Report',
                '@/components/Report/*',
                '!@/components/Report/redesign',
                '@/components/Report/redesign/*',
                '!@/components/Report/redesign/ReportUpgradeNudge',
                '!@/components/Report/sections',
                '@/components/Report/sections/*',
                '!@/components/Report/sections/reportContentActions',
                // assessFlowModel.ts / useAssessFlow.ts (Assess/redesign) —
                // pure data/logic + a pure hook, no JSX. The identical
                // question copy, validators and step-navigation hook every
                // desktop Assess step already reads, so mobile's step
                // indexing can never disagree with desktop's (both read/
                // write the same persisted currentStep). reviewModel.ts —
                // pure answer-summarization, no JSX (AssessReview.tsx, the
                // JSX-bearing desktop review screen that uses it, stays
                // blocked) — the same real summarizeAnswer() desktop's
                // review reads, so a mobile review screen's answer text can
                // never drift from desktop's.
                '!@/components/Assess',
                '@/components/Assess/*',
                '!@/components/Assess/redesign',
                '@/components/Assess/redesign/*',
                '!@/components/Assess/redesign/assessFlowModel',
                '!@/components/Assess/redesign/useAssessFlow',
                '!@/components/Assess/redesign/reviewModel',
                // workbenchCatalog.ts / productStatus.ts / proofFreshness.ts /
                // useMigrationPlan.ts / waves.ts / cbomExport.ts
                // (Migrate/Workbench) — pure logic/data/hooks, no JSX. The
                // same product-domain lookup, PQC/FIPS badge logic, proof-
                // freshness labeling, plan/wave posture, wave copy and CBOM
                // export every desktop Migrate tab already reads, so the
                // mobile screen's numbers and export output can never drift
                // from desktop's.
                // vendorRoadmapDisplay.ts (Migrate root) — pure extraction
                // (2026-08-24, real production feedback), no JSX: every
                // derived/filtered value desktop's VendorRoadmapPanel.tsx
                // computes (GA status, scope chip, hybrid-mode text
                // cleanup, "None detected" guards), so the mobile Vendors
                // tab's roadmap sheet reads the same facts as desktop —
                // desktop's own .tsx was refactored to consume this same
                // file rather than keep a second, driftable copy.
                '!@/components/Migrate',
                '@/components/Migrate/*',
                '!@/components/Migrate/vendorRoadmapDisplay',
                '!@/components/Migrate/Workbench',
                '@/components/Migrate/Workbench/*',
                '!@/components/Migrate/Workbench/workbenchCatalog',
                '!@/components/Migrate/Workbench/productStatus',
                '!@/components/Migrate/Workbench/proofFreshness',
                '!@/components/Migrate/Workbench/useMigrationPlan',
                '!@/components/Migrate/Workbench/waves',
                '!@/components/Migrate/Workbench/cbomExport',
                '!@/components/Migrate/Workbench/vendorConcentrationRisk',
                // obligationsModel.ts / roleLens.ts (Compliance/obligations)
                // and requirementsModel.ts (Compliance/requirements) — pure
                // logic, no JSX. cswp39Data.ts (Compliance root) — pure data.
                // The same register/role-lens/reading-room model and CSWP.39
                // step data every desktop Compliance tab already reads, so
                // the mobile screen's obligations, requirements and CSWP.39
                // content can never drift from desktop's.
                '!@/components/Compliance',
                '@/components/Compliance/*',
                '!@/components/Compliance/cswp39Data',
                '!@/components/Compliance/obligations',
                '@/components/Compliance/obligations/*',
                '!@/components/Compliance/obligations/obligationsModel',
                '!@/components/Compliance/obligations/roleLens',
                '!@/components/Compliance/requirements',
                '@/components/Compliance/requirements/*',
                '!@/components/Compliance/requirements/requirementsModel',
                // pillarModel.ts (traceability-chain/deadline-phases/dossier
                // derivation for the "about this standard" detail view) and
                // tones.ts (Tone -> Tailwind-class mapping) — both pure logic,
                // no JSX. Same real ComplianceDetailDrawer.tsx data the
                // desktop redesign's Landscape drawer renders from.
                '!@/components/Compliance/redesign',
                '@/components/Compliance/redesign/*',
                '!@/components/Compliance/redesign/pillarModel',
                '!@/components/Compliance/redesign/tones',
                // RoleHomeView.tsx (RoleHome) — the "Who's asking?" first-run
                // picker, already self-contained and reused by LandingView;
                // its per-role copy must not be duplicated (see comment above).
                '!@/components/RoleHome',
                '@/components/RoleHome/*',
                '!@/components/RoleHome/RoleHomeView',
                // libraryRef.ts (Algorithms) — pure spec-id -> Library
                // deep-link resolution, no JSX. Same real alias table/index
                // PQCProtocolMatrix.tsx's own detail modal uses, so a mobile
                // Protocol Matrix reader gets the exact same Library link
                // desktop's would, not a re-derived one that could drift.
                '!@/components/Algorithms',
                '@/components/Algorithms/*',
                '!@/components/Algorithms/libraryRef',
                // Glossary.tsx / UserManualPanel.tsx (common) — same category
                // as RoleHomeView: self-contained isOpen/onClose content
                // panels already responsive (w-full with a max-w cap), reused
                // by their respective desktop trigger buttons. SourcesModal
                // is the same pattern but needs no exception — it already
                // lives under the exempt src/components/ui/.
                '!@/components/common',
                '@/components/common/*',
                '!@/components/common/Glossary',
                '!@/components/common/UserManualPanel',
                // DocumentAnalysis.tsx (common, pure-moved from Library
                // 2026-08-26) — same category: a self-contained collapsed-
                // by-default enrichment panel with no fixed-width/desktop-only
                // layout, already reused verbatim by four desktop popovers/
                // drawers. Mobile Library and Timeline had no equivalent to
                // the "Document Analysis" section those give desktop, so this
                // lets the mobile screens render the exact same component
                // rather than a re-derived one that could drift.
                '!@/components/common/DocumentAnalysis',
                // TopThreeActions.tsx (common) — same category: explicitly
                // generic ("so dense pages... can offer a 'do this now'
                // hero"), no baked-in desktop-only layout (grid-cols-1
                // below md already). Reused verbatim by Report's mobile
                // screen rather than rebuilt, so its 3-card cap/derivation
                // can never drift from desktop's.
                '!@/components/common/TopThreeActions',
                // WhenDoesThisReachMe.tsx / MobileTimelineList.tsx (Timeline)
                // — Phase 7's mobile Timeline screen reuses both verbatim
                // rather than rebuilding them. WhenDoesThisReachMe is
                // already self-contained data-driven prose (own doc
                // comment: renders nothing rather than guessing a
                // jurisdiction). MobileTimelineList is the pre-existing
                // <768px breakpoint's own mobile view — already phone-
                // tested, not a desktop layout being force-fit.
                '!@/components/Timeline',
                '@/components/Timeline/*',
                '!@/components/Timeline/WhenDoesThisReachMe',
                '!@/components/Timeline/MobileTimelineList',
                // threatClassification.ts (Threats) — pure derivation, no
                // JSX. getShorTier()/getThreatClass() plus the SHOR_TIER_DEFS/
                // THREAT_CLASS_DEFS blurb text are the exact same per-threat
                // classification every desktop Threats badge/dialog reads;
                // the mobile screen needs the identical functions so a
                // threat's tier/class can never differ between desktop and
                // mobile.
                '!@/components/Threats',
                '@/components/Threats/*',
                '!@/components/Threats/threatClassification',
                // useLibraryPipeline.ts / libraryPills.ts (Library/redesign)
                // — the real filter/sort pipeline and pill-formatting
                // helpers every desktop Library surface already reads (no
                // JSX in either). The mobile screen calls the identical
                // hook with fixed defaults for the filters it doesn't
                // expose UI for, rather than re-deriving search/purpose/
                // quick-view matching a second time.
                '!@/components/Library',
                '@/components/Library/*',
                '!@/components/Library/redesign',
                '@/components/Library/redesign/*',
                '!@/components/Library/redesign/useLibraryPipeline',
                '!@/components/Library/redesign/libraryPills',
                // LeaderCategorySidebar.tsx — imported only for its exported
                // LEADER_CATEGORIES array (a plain literal, no JSX reused).
                // The mobile Community screen's category filter reads the
                // same real 8-value taxonomy desktop's sidebar does, so the
                // two can never silently diverge.
                '!@/components/Leaders',
                '@/components/Leaders/*',
                '!@/components/Leaders/LeaderCategorySidebar',
                // PersonaBoardView.tsx (PersonaJourney) — imported only for
                // its exported PROVENANCE_LABEL map (Phase 4's Home board
                // reads the same three provenance strings the desktop board
                // and CuriousMobileBoard already both use, rather than a
                // third copy). The component itself is desktop-shaped
                // (flex-row hero + side card at lg+) and is NOT reused —
                // Phase 4 builds its own mobile layout for the same reason
                // CuriousMobileBoard already does (own doc comment: "not a
                // responsive variant of PersonaBoardView").
                '!@/components/PersonaJourney',
                '@/components/PersonaJourney/*',
                '!@/components/PersonaJourney/PersonaBoardView',
                // usePersonaPathItems.ts / manifest/registry.ts / manifest/types.ts
                // (PKILearning) — pure logic/data, no JSX. Phase 5's Learn list
                // needs the same phase-partitioned path data + manifest
                // collection LearnRedesignView/MyPathView already read, so the
                // module count, phase titles and per-module metadata can never
                // drift from what desktop shows for the identical persona.
                '!@/components/PKILearning',
                '@/components/PKILearning/*',
                '!@/components/PKILearning/usePersonaPathItems',
                // moduleData.ts — MODULE_CATALOG/MODULE_TO_TRACK/TRACK_COLORS, pure
                // data (.ts, cannot contain JSX). The same per-module title/duration/
                // lm_id lookup PersonaPathPhase/MyPathView/BrowseAllView all read —
                // needed to render a real module row from just a moduleId.
                '!@/components/PKILearning/moduleData',
                '!@/components/PKILearning/manifest',
                '@/components/PKILearning/manifest/*',
                '!@/components/PKILearning/manifest/registry',
                '!@/components/PKILearning/manifest/types',
                // learnRedesign.helpers.ts — CHECKPOINT_PASS_THRESHOLD /
                // isCheckpointPassed, the real per-category >=80% pass rule.
                // Reused directly rather than reimplemented so a checkpoint
                // can never read "passed" on mobile while desktop still shows
                // it locked.
                '!@/components/PKILearning/redesign',
                '@/components/PKILearning/redesign/*',
                '!@/components/PKILearning/redesign/learnRedesign.helpers',
                // Quiz's content-neutral pieces — types.ts (pure data, no
                // JSX), useQuizState.ts (pure reducer/scoring logic, no
                // JSX), and three components confirmed to carry no
                // desktop-only layout assumptions (QuestionCard/
                // FeedbackPanel already use plain flex/grid + min-h-[44px]
                // touch targets; QuizProgress already ships its own
                // sm:hidden/hidden:sm mobile branch). Reused directly by the
                // mobile checkpoint quiz rather than re-implemented, so
                // scoring/pass-threshold logic can never drift between
                // desktop and mobile. QuizIntro/QuizWizard/QuizResults/
                // ScoreBreakdown/TopicSelector/index.tsx stay blocked — real
                // desktop-shaped view components.
                '!@/components/PKILearning/modules',
                '@/components/PKILearning/modules/*',
                // quantumConstants.ts (QuantumThreats/data) — pure data/logic,
                // no JSX. getCrqcConsensus() reduces the same six real
                // CRQC_ESTIMATES rows every desktop Threats-page component
                // reads for its Q-Day figure; the mobile Threats screen needs
                // the identical function so its headline number can never
                // drift from desktop's.
                '!@/components/PKILearning/modules/QuantumThreats',
                '@/components/PKILearning/modules/QuantumThreats/*',
                '!@/components/PKILearning/modules/QuantumThreats/data',
                '@/components/PKILearning/modules/QuantumThreats/data/*',
                '!@/components/PKILearning/modules/QuantumThreats/data/quantumConstants',
                '!@/components/PKILearning/modules/Quiz',
                '@/components/PKILearning/modules/Quiz/*',
                '!@/components/PKILearning/modules/Quiz/types',
                '!@/components/PKILearning/modules/Quiz/hooks',
                '@/components/PKILearning/modules/Quiz/hooks/*',
                '!@/components/PKILearning/modules/Quiz/hooks/useQuizState',
                '!@/components/PKILearning/modules/Quiz/components',
                '@/components/PKILearning/modules/Quiz/components/*',
                '!@/components/PKILearning/modules/Quiz/components/QuestionCard',
                '!@/components/PKILearning/modules/Quiz/components/FeedbackPanel',
                '!@/components/PKILearning/modules/Quiz/components/QuizProgress',
                // workshopRegistry.tsx — WORKSHOP_TOOLS/CATEGORIES + types
                // (WorkshopTool/WorkshopCategory/ToolDifficulty/
                // ToolRuntimeRequirement), pure data + types; the file's only
                // JSX lives inside TOOL_COMPONENTS's lazy-load wrappers,
                // which this mobile screen never imports (it opens a tool via
                // a real Link to /playground/:id, letting PlaygroundToolRoute
                // — not Mobile — do that lookup). cryptoLabMeta.ts —
                // CATEGORY_META/SIDEBAR_CATEGORIES/PERSONA_CHIP_LABEL, pure
                // data, no JSX. cryptoLabTaxonomy.ts — expandSearchQuery(),
                // pure logic, no JSX. The same real tool registry, category
                // metadata and search-synonym expansion every desktop
                // Playground surface already reads, so the mobile catalogue's
                // tool list, categories and search results can never drift
                // from desktop's.
                '!@/components/Playground',
                '@/components/Playground/*',
                '!@/components/Playground/workshopRegistry',
                '!@/components/Playground/cryptoLabMeta',
                '!@/components/Playground/cryptoLabTaxonomy',
              ],
              message:
                'src/components/Mobile may not import a desktop view component. If the data it needs is trapped inside one, extract it as a pure-move (IMPLEMENTATION-PLAN.md §5.4) rather than importing the component. If this IS a pure logic/data module (no JSX), add an explicit 4-line exception above instead (see the comment above this rule).',
            },
          ],
        },
      ],
    },
  },

  eslintConfigPrettier,
])
