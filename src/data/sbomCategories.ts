// SPDX-License-Identifier: GPL-3.0-only
//
// The 11 dependency-category headings SbomSection.tsx renders on the
// desktop About page's SBOM accordion. Extracted (2026-08-24 audit R3.6) —
// these previously existed ONLY as inline JSX text in that file, with no
// exportable source; MobileAboutView.tsx had to hand-type its own second
// copy of all 11 strings to report "Built on N real dependency categories"
// in its own About summary. Both surfaces now render this same array —
// SbomSection.tsx by index, in the same order its accordion already uses.
export const SBOM_CATEGORIES = [
  'UI Frameworks & Libraries',
  'Utilities',
  'Cryptography & PQC',
  'Rust WASM Bindings',
  'Rust Crypto Crates',
  'Local AI & Embeddings',
  'State Management',
  'Analytics',
  'Notifications',
  'Build & Development',
  'Testing',
] as const
