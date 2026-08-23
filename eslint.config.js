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
                // usePatentKpis.ts (Patents/redesign) — pure KPI derivation hook, no JSX.
                '!@/components/Patents',
                '!@/components/Patents/redesign',
                '@/components/Patents/redesign/*',
                '!@/components/Patents/redesign/usePatentKpis',
                // RoleHomeView.tsx (RoleHome) — the "Who's asking?" first-run
                // picker, already self-contained and reused by LandingView;
                // its per-role copy must not be duplicated (see comment above).
                '!@/components/RoleHome',
                '@/components/RoleHome/*',
                '!@/components/RoleHome/RoleHomeView',
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
