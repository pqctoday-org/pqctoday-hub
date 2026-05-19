// SPDX-License-Identifier: GPL-3.0-only
/**
 * Crypto API Refactor Audit (M7 / CSWP.39 Section 4.1)
 *
 * Security-architect + senior-developer-facing tool that audits an application's
 * crypto call sites and emits a refactor checklist. Maps to NIST CSWP 39
 * Section 4.1 (Using an API in a Crypto Library Application) and Fig.2 (the
 * canonical Application -> Protocol -> Crypto-API -> Provider stack).
 *
 * Crypto agility lives at the API boundary between the protocol implementation
 * and the provider. An app that calls `RSA_sign()` directly is not agile; an
 * app that calls `EVP_DigestSign()` with the algorithm selected at run-time IS
 * agile. This audit grades the current agility state, recommends a refactor
 * phase, and emits language-specific call-site guidance.
 */
import React, { useCallback, useMemo } from 'react'
import { Code2, ShieldCheck, ArrowRight } from 'lucide-react'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import { useModuleStore } from '@/store/useModuleStore'

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation engine (pure function — testable in isolation)
// ─────────────────────────────────────────────────────────────────────────────

export interface CryptoApiInputs {
  /** server-side service / client SDK / embedded firmware / browser app / kernel module */
  applicationType: string
  /** Go / Java / .NET / Node.js / Python / Rust / C / C++ / JavaScript (browser) / Swift / Kotlin */
  language: string
  /** Multi-select of current crypto API surfaces in use. */
  currentCryptoApi: string[]
  /** Multi-select of providers in scope. */
  provider: string[]
  /** Multi-select of target PQC algorithm families. */
  targetAlgorithms: string[]
  /** small (<10) / medium (10-50) / large (50-200) / legacy-mass (>200). */
  callSiteCount: string
  /** agility-friendly / config-driven / partially-hardcoded / fully-hardcoded. */
  cryptoAgilityNow: string
  /** must-support / must-fail-closed / no-preference. */
  runtimeFallback: string
  /** Editable narrative carried into the export. */
  refactorPlan: string
}

export interface CryptoApiRecommendation {
  refactorPhase: string
  rationale: string
  callSiteChecklist: string[]
  recommendedFacadePattern: string
  providerCompatNotes: string[]
  watchOuts: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Refactor-phase classification
// ─────────────────────────────────────────────────────────────────────────────

function isLargeCallSiteCount(v: string): boolean {
  return v === 'large' || v === 'legacy-mass'
}

function classifyPhase(inputs: CryptoApiInputs): { phase: string; rationale: string } {
  const { cryptoAgilityNow, callSiteCount } = inputs

  if (cryptoAgilityNow === 'fully-hardcoded' && isLargeCallSiteCount(callSiteCount)) {
    return {
      phase: 'Phase 1 - Wrap, do not refactor',
      rationale:
        'A large fully-hardcoded surface cannot be refactored in one pass. Introduce a thin facade module that intercepts current calls and exposes algorithm-parameterised methods; migrate call sites incrementally behind that facade.',
    }
  }
  if (cryptoAgilityNow === 'fully-hardcoded') {
    return {
      phase: 'Phase 1 - Wrap, do not refactor',
      rationale:
        'Even a small fully-hardcoded surface benefits from a facade-first pattern; the call sites are few enough to migrate quickly, but introducing the abstraction first keeps the diff reviewable.',
    }
  }
  if (cryptoAgilityNow === 'partially-hardcoded') {
    return {
      phase: 'Phase 2 - Complete the facade',
      rationale:
        'A facade exists in places but is bypassed elsewhere. Find the remaining direct calls (grep + AST scan), route them through the facade, and add a CI guard that fails the build when direct provider APIs are imported outside the facade module.',
    }
  }
  if (cryptoAgilityNow === 'config-driven') {
    return {
      phase: 'Phase 3 - Add PQC algorithm IDs to config',
      rationale:
        'The facade is in place but the algorithm catalogue does not include PQC entries. Extend the config schema (algorithm name, parameter set, provider hint) and teach the facade to dispatch to the new providers.',
    }
  }
  return {
    phase: 'Phase 4 - Provider-compatibility test',
    rationale:
      'The app is agility-friendly today. Verify each provider supports the target algorithm set; add explicit fallback paths if the runtime-fallback policy requires it.',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Language-specific call-site checklists
// ─────────────────────────────────────────────────────────────────────────────

const UNIVERSAL_PATTERNS: string[] = [
  'Replace hardcoded algorithm names with run-time-selected algorithm parameters',
  'Push provider selection above the call sites (config or dependency injection) - the call site should not know whether the provider is software, HSM, TPM, or KMS',
  'Add a fallback path when a provider lacks the requested algorithm; CSWP-39 Section 4.1 warns providers vary in PQC support timing',
  'Centralise algorithm IDs (OIDs, IANA codepoints, JWA names) in one constant table - the facade reads from this table, never inlines literals',
  'Wrap the facade with a feature flag so a problematic algorithm can be hot-disabled without redeploy',
]

const LANGUAGE_CHECKLISTS: Record<string, string[]> = {
  Go: [
    'Grep for `crypto/rsa`, `crypto/ecdsa`, `crypto/ed25519` direct imports outside the facade package',
    'Replace `rsa.SignPKCS1v15` / `ecdsa.Sign` call sites with a `crypto.Signer` interface dispatched via the facade',
    'For PQC: import an ML-DSA / ML-KEM provider (e.g. CIRCL, liboqs-go) behind the same `crypto.Signer` / KEM interfaces',
    'Add a `golangci-lint` forbidigo rule banning direct `crypto/rsa` and `crypto/ecdsa` imports outside `internal/cryptofacade/`',
  ],
  Java: [
    'Grep for `Signature.getInstance("SHA256withRSA")`, `Cipher.getInstance("RSA/...")`, `KeyPairGenerator.getInstance("RSA")` literals',
    'Replace literal algorithm strings with a parameter sourced from config: `Signature.getInstance(algorithmFromConfig, providerFromConfig)`',
    'Register the BouncyCastle PQC provider (`bouncycastle.pqc.crypto`) or wait for the JDK 25+ native ML-DSA implementation',
    'Use `Security.addProvider(new BouncyCastlePQCProvider())` once at app start; the facade is provider-agnostic from that point',
  ],
  '.NET': [
    'Grep for `RSACryptoServiceProvider`, `RSACng`, `ECDsaCng`, `ECDsaOpenSsl` instantiations',
    'Replace with `AsymmetricAlgorithm` base + a factory that returns the concrete subclass per algorithm + provider',
    '.NET 10 ships native `MLDsa` and `MLKem` types - target that runtime where possible; for .NET 8/9 use BouncyCastle.NET PQC',
    'Pin algorithm names to constants in `CryptoAlgorithmNames` to avoid stringly-typed regressions',
  ],
  'Node.js': [
    'Grep for `crypto.sign("RSA-SHA256", ...)`, `crypto.createSign("RSA-SHA256")`, `crypto.publicEncrypt({...padding...})`',
    'Replace literal algorithm strings with a parameter; route through a facade module that re-exports `sign` / `verify` / `encapsulate` / `decapsulate`',
    'Node native crypto does not yet ship ML-KEM / ML-DSA - use `liboqs-node` or `node-pqcrypto` behind the facade',
    'Keep the facade async-only so future WASM-backed providers (browser parity) drop in without API changes',
  ],
  Python: [
    'Grep for `cryptography.hazmat.primitives.asymmetric.rsa`, `...asymmetric.ec`, `...asymmetric.ed25519` direct imports',
    'Replace `rsa.generate_private_key(...)` with `cryptofacade.generate_key(algorithm=cfg.algorithm)`',
    'For PQC use `pqcrypto` (PyPI) or the `liboqs-python` binding; both expose ML-KEM and ML-DSA',
    'Add a `flake8-tidy-imports` rule banning direct `cryptography.hazmat.primitives.asymmetric.*` imports outside the facade package',
  ],
  Rust: [
    'Grep for direct `rsa`, `ed25519-dalek`, `p256`, `k256` crate references outside the facade module',
    'Define a `Signer` / `Verifier` / `Encapsulator` trait set and dispatch via `Box<dyn Signer>` trait objects',
    'For PQC use the `pqcrypto-mldsa`, `pqcrypto-mlkem`, or `liboqs-rust` crates behind the trait set',
    'Add a clippy lint or a custom build-time check banning the underlying crates outside the facade crate',
  ],
  C: [
    'Replace deprecated `RSA_sign` / `EC_KEY_*` direct calls with `EVP_DigestSign` + `EVP_PKEY_CTX_set_signature_md`',
    'Use `EVP_PKEY_id()` at run-time to branch on algorithm rather than baking the algorithm into the call site',
    'For PQC load the oqs-provider at run-time: `OSSL_PROVIDER_load(NULL, "oqsprovider")`; future OpenSSL 3.5+ ships native FIPS 203 / 204 / 205',
    'Audit every `EVP_sha256()` literal - the hash should be a parameter, not a baked-in constant',
  ],
  'C++': [
    'Replace deprecated `RSA_sign` / `EC_KEY_*` direct calls with `EVP_DigestSign` + `EVP_PKEY_CTX_set_signature_md`',
    'Wrap the EVP handles in a RAII `CryptoFacade` class; the rest of the codebase never touches `EVP_PKEY*` directly',
    'For PQC load the oqs-provider at run-time: `OSSL_PROVIDER_load(NULL, "oqsprovider")`; future OpenSSL 3.5+ ships native FIPS 203 / 204 / 205',
    'Audit every `EVP_sha256()` literal - the hash should be a parameter, not a baked-in constant',
  ],
  'JavaScript (browser)': [
    'Grep for `window.crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, ...)` and other literal-algorithm subtle calls',
    'Replace literal algorithm specifiers with a parameter; encapsulate the `subtle` calls in a single `webCryptoFacade` module',
    'Web Crypto has NO native ML-KEM / ML-DSA support yet - bridge to a WASM-bundled liboqs build for PQC operations',
    'Plan for a future drop-in switch when browser vendors ship native PQC: the facade should keep the same shape',
  ],
  Swift: [
    'Grep for `SecKeyCreate*`, `SecKeyRawSign`, `CryptoKit` `P256.Signing.PrivateKey` direct uses',
    'Wrap with a `CryptoFacade` protocol; the rest of the app speaks the protocol, not the underlying framework',
    'No native PQC on iOS / macOS today - bridge via a Rust / C library (liboqs) compiled into the app',
    'Use `SecKey` attribute parameterisation rather than hardcoding `kSecAttrKeyType` values',
  ],
  Kotlin: [
    'Grep for direct JCA calls (`Signature.getInstance`, `KeyPairGenerator.getInstance`) outside the facade module',
    'Define a `CryptoFacade` interface and inject the provider via Dagger / Hilt',
    'For PQC on Android use BouncyCastle PQC; the facade picks `BC` or `BCPQC` at register time',
    'Pin algorithm names to a `sealed class` enumeration to keep the type system honest',
  ],
}

function getLanguageChecklist(language: string): string[] {
  // eslint-disable-next-line security/detect-object-injection
  return LANGUAGE_CHECKLISTS[language] ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// Facade pattern selection
// ─────────────────────────────────────────────────────────────────────────────

function pickFacadePattern(language: string): string {
  switch (language) {
    case 'Go':
      return 'Define a `package crypto` facade with `Sign(algo, key, msg)` / `Verify(algo, key, msg, sig)` / `Encapsulate(algo, pub)` exported functions; the rest of the codebase imports only this package.'
    case 'Java':
      return 'Define a `CryptoFacade` class with static methods; back it with a registered JCA provider chain (BouncyCastle PQC + JDK).'
    case '.NET':
      return 'Define an `ICryptoFacade` interface with `Sign` / `Verify` / `Encapsulate` / `Decapsulate`; ship it as a separate assembly so the call sites cannot transitively pull `System.Security.Cryptography` provider types.'
    case 'Node.js':
      return 'Export an async `cryptoFacade` module from a single file; the rest of the codebase imports only this module - no direct `require("crypto")` outside it.'
    case 'Python':
      return 'Define a `cryptofacade` package with `sign(algorithm, key, msg)` etc.; gate `cryptography.hazmat.primitives` imports behind it via lint.'
    case 'Rust':
      return 'Define a `crypto-facade` crate with `Signer` / `Verifier` / `Encapsulator` traits; the rest of the workspace depends only on this crate.'
    case 'C':
    case 'C++':
      return 'Define a `crypto_facade.h` / `crypto_facade.cpp` translation unit with `crypto_sign(ctx, algo, msg)` etc.; ban direct `<openssl/evp.h>` includes outside this TU via a clang-tidy rule.'
    case 'JavaScript (browser)':
      return 'Define a `webCryptoFacade.ts` module that wraps `window.crypto.subtle` and a WASM-liboqs adapter; routes by algorithm.'
    case 'Swift':
      return 'Define a `CryptoFacade` protocol with `sign` / `verify` / `encapsulate` requirements; back it with `SecKey` + a liboqs-Swift wrapper.'
    case 'Kotlin':
      return 'Define a `CryptoFacade` interface; inject the JCA / BouncyCastle PQC implementation via DI.'
    default:
      return 'Define a `CryptoFacade` abstraction in your language idiom with `sign` / `verify` / `encapsulate` / `decapsulate` entry points; the rest of the codebase imports only this abstraction.'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider compatibility notes
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER_NOTES: Record<string, string> = {
  software:
    'Software providers: OpenSSL 3.x via oqs-provider for ML-KEM / ML-DSA today; native FIPS 203 / 204 support landing post-OpenSSL 3.5; BouncyCastle PQC `org.bouncycastle.pqc.crypto.*`; .NET 10+ adds native `MLDsa` / `MLKem` types.',
  hsm: 'HSM providers: Thales Luna FIPS 203 / 204 firmware on roadmap (vendor advisory); Entrust nCipher Connect+ generally available; AWS CloudHSM ML-DSA-65 + ML-KEM-768 available 2025-Q4. Check each vendor for PKCS#11 v3.2 mechanism IDs.',
  tpm: 'TPM providers: TCG PQC profiles draft as of 2025; PC Client Spec v1.85 adds ML-DSA, SLH-DSA, and LMS algorithms; full vendor firmware support 2026 onwards.',
  kms: 'KMS-backed providers: AWS KMS, GCP KMS, and Azure Key Vault are rolling out ML-DSA-65 + ML-KEM-768 through 2025-2026; verify region availability and pricing before pinning.',
  accelerator:
    'Hardware accelerators (Intel QAT, AWS Nitro): firmware roadmap includes ML-KEM lattice ops 2026; today still RSA / ECC only. Fallback to software for PQC paths.',
  browser:
    'Browser TPM / secure element providers: WebAuthn / Passkey ecosystem is RSA / ECDSA only; PQC for WebAuthn is in IETF draft. No native PQC in browsers today - WASM bridge required.',
}

function getProviderNotes(providers: string[]): string[] {
  const out: string[] = []
  for (const p of providers) {
    // eslint-disable-next-line security/detect-object-injection
    const note = PROVIDER_NOTES[p]
    if (note) out.push(note)
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Watch-outs
// ─────────────────────────────────────────────────────────────────────────────

function computeWatchOuts(inputs: CryptoApiInputs): string[] {
  const out: string[] = []

  if (inputs.cryptoAgilityNow === 'fully-hardcoded' && inputs.callSiteCount === 'legacy-mass') {
    out.push(
      'Fully-hardcoded with > 200 call sites: plan for a 6-12 month refactor minimum. Stage the work behind a feature flag and ship incremental PRs.'
    )
  }
  if (inputs.applicationType === 'embedded firmware') {
    out.push(
      'Embedded firmware: flash budget matters. SLH-DSA-SHA2-128s ~ 32 KB code; ML-DSA-65 ~ 18 KB; ML-KEM-768 ~ 12 KB. Measure against the target chip before committing.'
    )
  }
  if (inputs.applicationType === 'browser app') {
    out.push(
      'Browser app: Web Crypto API has NO native PQC support. A WASM bridge to liboqs (or similar) is required; budget for the 1-2 MB WASM payload and worker-thread isolation.'
    )
  }
  if (inputs.applicationType === 'kernel module / driver') {
    out.push(
      'Kernel space: provider APIs differ (Linux Kernel Crypto API, BSD opencrypto). Refactor inside the kernel facade equivalent; userspace facade patterns do not transfer.'
    )
  }
  if (inputs.runtimeFallback === 'must-support') {
    const hardwarePqcLikelyMissing =
      inputs.provider.includes('tpm') || inputs.provider.includes('accelerator')
    if (hardwarePqcLikelyMissing) {
      out.push(
        'Runtime-fallback "must-support" with TPM / accelerator providers: today these providers lack PQC. Build the software-fallback path explicitly and exercise it in CI.'
      )
    }
  }
  if (inputs.runtimeFallback === 'must-fail-closed' && inputs.provider.length > 1) {
    out.push(
      'Fail-closed with multiple providers: ensure the negotiation logic does not silently downgrade to a non-PQC provider when the PQC provider is unavailable.'
    )
  }
  if (
    inputs.targetAlgorithms.some((a) => /SLH-DSA/.test(a)) &&
    inputs.applicationType === 'embedded firmware'
  ) {
    out.push(
      'SLH-DSA on embedded: signature size 7-50 KB; verify your over-the-air update budget and any signed-record-in-flash store.'
    )
  }
  if (inputs.targetAlgorithms.some((a) => /Falcon|FN-DSA/.test(a))) {
    out.push(
      'Falcon / FN-DSA: signing requires floating-point or constant-time integer arithmetic. Embedded chips without FPU need the integer variant - validate before adopting.'
    )
  }

  // Always emit the API-boundary reminder (echoes CSWP-39 §4.1).
  out.push(
    'CSWP-39 Section 4.1 reminder: crypto agility lives at the API boundary. Keep the facade narrow, well-documented, and the only path between the application and the provider.'
  )

  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Public engine entry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Audit an application's crypto API surface and emit a refactor plan.
 * Pure function — no React, no state, no I/O. Unit-tested directly.
 */
export function auditCryptoApi(inputs: CryptoApiInputs): CryptoApiRecommendation {
  const { phase, rationale } = classifyPhase(inputs)
  const universal = [...UNIVERSAL_PATTERNS]
  const langSpecific = getLanguageChecklist(inputs.language)
  const checklist = universal.concat(langSpecific)
  const facade = pickFacadePattern(inputs.language)
  const provNotes = getProviderNotes(inputs.provider)
  const watchOuts = computeWatchOuts(inputs)

  return {
    refactorPhase: phase,
    rationale,
    callSiteChecklist: checklist,
    recommendedFacadePattern: facade,
    providerCompatNotes: provNotes,
    watchOuts,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSWP-39 §4.1 verbatim quote (sanitised to ASCII)
// ─────────────────────────────────────────────────────────────────────────────

const CSWP39_41_QUOTE =
  'A cryptographic application programming interface (crypto API) separates the implementation of applications that use cryptographic algorithms from implementation of the cryptographic algorithms themselves. To achieve crypto agility, system designers must introduce mechanisms that simplify the replacement of cryptographic algorithms in software, libraries, hardware, firmware, and infrastructures.'

// ─────────────────────────────────────────────────────────────────────────────
// Wizard section definitions
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS: ArtifactSection[] = [
  {
    id: 'stackInventory',
    title: 'Step 1 - Stack inventory',
    description:
      'Tell the audit engine what the application looks like today - language, providers, and the API surface in use.',
    fields: [
      {
        id: 'applicationType',
        label: 'Application type',
        type: 'select',
        options: [
          {
            value: 'server-side service',
            label: 'Server-side service (Go / Java / Node / .NET / Python / Rust)',
          },
          { value: 'client SDK', label: 'Client SDK (mobile / desktop)' },
          { value: 'embedded firmware', label: 'Embedded firmware (C / C++ / Rust)' },
          { value: 'browser app', label: 'Browser app (Web Crypto API)' },
          { value: 'kernel module / driver', label: 'Kernel module / driver' },
        ],
        defaultValue: 'server-side service',
      },
      {
        id: 'language',
        label: 'Primary language',
        type: 'select',
        options: [
          { value: 'Go', label: 'Go' },
          { value: 'Java', label: 'Java' },
          { value: '.NET', label: '.NET' },
          { value: 'Node.js', label: 'Node.js' },
          { value: 'Python', label: 'Python' },
          { value: 'Rust', label: 'Rust' },
          { value: 'C', label: 'C' },
          { value: 'C++', label: 'C++' },
          { value: 'JavaScript (browser)', label: 'JavaScript (browser)' },
          { value: 'Swift', label: 'Swift' },
          { value: 'Kotlin', label: 'Kotlin' },
        ],
        defaultValue: 'Go',
      },
      {
        id: 'currentCryptoApi',
        label: 'Current crypto API(s) in use',
        type: 'checklist',
        options: [
          { value: 'openssl-evp', label: 'OpenSSL (libcrypto / EVP)' },
          { value: 'boringssl', label: 'BoringSSL' },
          { value: 'openssl-legacy', label: 'OpenSSL legacy RSA_* / EC_* direct' },
          { value: 'libsodium', label: 'libsodium' },
          { value: 'bouncycastle', label: 'BouncyCastle' },
          { value: 'dotnet-syscrypto', label: '.NET System.Security.Cryptography' },
          { value: 'web-crypto', label: 'Web Crypto API' },
          { value: 'jce-provider', label: 'JCE provider' },
          { value: 'pkcs11', label: 'PKCS#11' },
          { value: 'kms-backed', label: 'KMS-backed (AWS KMS / GCP KMS / Azure Key Vault)' },
          { value: 'proprietary-hsm', label: 'Proprietary HSM SDK' },
          { value: 'hand-rolled', label: 'Hand-rolled crypto' },
        ],
        defaultValue: ['openssl-evp'],
      },
      {
        id: 'provider',
        label: 'Provider(s) in scope',
        type: 'checklist',
        options: [
          { value: 'software', label: 'Software (any of the libs above)' },
          { value: 'hsm', label: 'HSM (Luna / nCipher / AWS CloudHSM / etc.)' },
          { value: 'tpm', label: 'TPM' },
          { value: 'kms', label: 'KMS-backed' },
          { value: 'accelerator', label: 'Hardware accelerator (Intel QAT / AWS Nitro)' },
          { value: 'browser', label: 'Browser TPM / secure element' },
        ],
        defaultValue: ['software'],
      },
    ],
  },
  {
    id: 'refactorScope',
    title: 'Step 2 - Refactor scope',
    description:
      'Pick the PQC target algorithms, estimate how many call sites are affected, and grade your current crypto-agility state.',
    fields: [
      {
        id: 'targetAlgorithms',
        label: 'Target PQC algorithms',
        type: 'checklist',
        options: [
          { value: 'ML-KEM', label: 'ML-KEM (FIPS 203 KEM)' },
          { value: 'ML-DSA', label: 'ML-DSA (FIPS 204 signature)' },
          { value: 'SLH-DSA', label: 'SLH-DSA (FIPS 205 signature)' },
          { value: 'HQC', label: 'HQC (KEM)' },
          { value: 'Falcon/FN-DSA', label: 'Falcon / FN-DSA (signature)' },
          { value: 'LMS/HSS', label: 'LMS / HSS (stateful hash-based signature)' },
          { value: 'hybrid', label: 'Hybrid pairings (traditional + PQC)' },
        ],
        defaultValue: ['ML-KEM', 'ML-DSA'],
      },
      {
        id: 'callSiteCount',
        label: 'Approximate call-site count',
        type: 'select',
        options: [
          { value: 'small', label: '< 10 call sites' },
          { value: 'medium', label: '10 - 50 call sites' },
          { value: 'large', label: '50 - 200 call sites' },
          { value: 'legacy-mass', label: '> 200 call sites (legacy mass)' },
        ],
        defaultValue: 'medium',
      },
      {
        id: 'cryptoAgilityNow',
        label: 'Crypto-agility state today',
        type: 'select',
        options: [
          {
            value: 'agility-friendly',
            label: 'Agility-friendly facade (algorithm is a runtime parameter)',
          },
          {
            value: 'config-driven',
            label: 'Config-driven (algorithm name in config, providers still hardcoded)',
          },
          {
            value: 'partially-hardcoded',
            label: 'Partially hardcoded (some sites call provider-specific APIs)',
          },
          {
            value: 'fully-hardcoded',
            label: 'Fully hardcoded (RSA / ECDSA specific calls everywhere)',
          },
        ],
        defaultValue: 'partially-hardcoded',
      },
      {
        id: 'runtimeFallback',
        label: 'Runtime fallback policy',
        type: 'select',
        options: [
          {
            value: 'must-support',
            label: 'Must support provider-lacks-algorithm path (fail open with alternate)',
          },
          { value: 'must-fail-closed', label: 'Must fail closed (no fallback acceptable)' },
          { value: 'no-preference', label: 'No preference' },
        ],
        defaultValue: 'must-support',
      },
    ],
  },
  {
    id: 'plan',
    title: 'Step 3 - Refactor plan (editable)',
    description:
      'Edit the narrative carried into the exported audit. The audit checklist, facade pattern, and watch-outs are generated automatically.',
    fields: [
      {
        id: 'refactorPlan',
        label: 'Refactor plan narrative',
        type: 'textarea',
        placeholder:
          'e.g., We will introduce a `crypto` package facade over the next two quarters, migrate the top-20 RSA call sites first, and gate further direct `crypto/rsa` imports with a forbidigo lint rule. ML-KEM-768 + ML-DSA-65 wired via liboqs-go behind the facade.',
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Markdown preview
// ─────────────────────────────────────────────────────────────────────────────

const APPLICATION_TYPE_LABELS: Record<string, string> = {
  'server-side service': 'Server-side service',
  'client SDK': 'Client SDK (mobile / desktop)',
  'embedded firmware': 'Embedded firmware',
  'browser app': 'Browser app',
  'kernel module / driver': 'Kernel module / driver',
}

const CURRENT_API_LABELS: Record<string, string> = {
  'openssl-evp': 'OpenSSL (libcrypto / EVP)',
  boringssl: 'BoringSSL',
  'openssl-legacy': 'OpenSSL legacy RSA_* / EC_* direct',
  libsodium: 'libsodium',
  bouncycastle: 'BouncyCastle',
  'dotnet-syscrypto': '.NET System.Security.Cryptography',
  'web-crypto': 'Web Crypto API',
  'jce-provider': 'JCE provider',
  pkcs11: 'PKCS#11',
  'kms-backed': 'KMS-backed',
  'proprietary-hsm': 'Proprietary HSM SDK',
  'hand-rolled': 'Hand-rolled crypto',
}

const PROVIDER_LABELS: Record<string, string> = {
  software: 'Software',
  hsm: 'HSM',
  tpm: 'TPM',
  kms: 'KMS-backed',
  accelerator: 'Hardware accelerator',
  browser: 'Browser TPM / secure element',
}

const AGILITY_LABELS: Record<string, string> = {
  'agility-friendly': 'Agility-friendly facade',
  'config-driven': 'Config-driven',
  'partially-hardcoded': 'Partially hardcoded',
  'fully-hardcoded': 'Fully hardcoded',
}

const CALL_SITE_LABELS: Record<string, string> = {
  small: '< 10 call sites',
  medium: '10 - 50 call sites',
  large: '50 - 200 call sites',
  'legacy-mass': '> 200 call sites (legacy mass)',
}

const FALLBACK_LABELS: Record<string, string> = {
  'must-support': 'Must support provider-lacks-algorithm path',
  'must-fail-closed': 'Must fail closed',
  'no-preference': 'No preference',
}

function labelOr(map: Record<string, string>, key: string): string {
  // eslint-disable-next-line security/detect-object-injection
  return map[key] ?? key
}

function joinLabels(map: Record<string, string>, keys: string[]): string {
  if (keys.length === 0) return 'None specified'
  return keys.map((k) => labelOr(map, k)).join('; ')
}

function sanitiseAscii(md: string): string {
  return md
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/→/g, '->')
    .replace(/§/g, 'Section ')
}

export function renderCryptoApiMarkdown(
  data: Record<string, Record<string, string | string[]>>
): string {
  const si = data.stackInventory ?? {}
  const rs = data.refactorScope ?? {}
  const plan = data.plan ?? {}

  const inputs: CryptoApiInputs = {
    applicationType: (si.applicationType as string) || 'server-side service',
    language: (si.language as string) || 'Go',
    currentCryptoApi: Array.isArray(si.currentCryptoApi) ? (si.currentCryptoApi as string[]) : [],
    provider: Array.isArray(si.provider) ? (si.provider as string[]) : [],
    targetAlgorithms: Array.isArray(rs.targetAlgorithms) ? (rs.targetAlgorithms as string[]) : [],
    callSiteCount: (rs.callSiteCount as string) || 'medium',
    cryptoAgilityNow: (rs.cryptoAgilityNow as string) || 'partially-hardcoded',
    runtimeFallback: (rs.runtimeFallback as string) || 'must-support',
    refactorPlan: (plan.refactorPlan as string) || '',
  }

  const rec = auditCryptoApi(inputs)

  let md = `# Crypto API Refactor Audit\n\n`
  md += `*Aligned to NIST CSWP 39 Section 4.1 (Using an API in a Crypto Library Application) and Fig.2 (Application -> Protocol -> Crypto-API -> Provider stack).*\n`
  md += `*https://doi.org/10.6028/NIST.CSWP.39*\n\n`

  md += `## 1. Stack Inventory\n\n`
  md += `- Application type: ${labelOr(APPLICATION_TYPE_LABELS, inputs.applicationType)}\n`
  md += `- Language: ${inputs.language}\n`
  md += `- Current crypto API(s): ${joinLabels(CURRENT_API_LABELS, inputs.currentCryptoApi)}\n`
  md += `- Provider(s): ${joinLabels(PROVIDER_LABELS, inputs.provider)}\n\n`

  md += `## 2. Refactor Scope\n\n`
  md += `- Target algorithms: ${inputs.targetAlgorithms.length === 0 ? 'None specified' : inputs.targetAlgorithms.join('; ')}\n`
  md += `- Call-site count: ${labelOr(CALL_SITE_LABELS, inputs.callSiteCount)}\n`
  md += `- Crypto-agility state today: ${labelOr(AGILITY_LABELS, inputs.cryptoAgilityNow)}\n`
  md += `- Runtime fallback policy: ${labelOr(FALLBACK_LABELS, inputs.runtimeFallback)}\n\n`

  md += `## 3. Recommended Refactor Phase\n\n`
  md += `**${rec.refactorPhase}**\n\n`
  md += `${rec.rationale}\n\n`

  md += `### Recommended facade pattern\n\n`
  md += `${rec.recommendedFacadePattern}\n\n`

  md += `## 4. Call-Site Checklist\n\n`
  md += `### Universal patterns\n\n`
  for (const u of UNIVERSAL_PATTERNS) md += `- ${u}\n`
  md += `\n`

  const langSpecific = getLanguageChecklist(inputs.language)
  if (langSpecific.length > 0) {
    md += `### Language-specific (${inputs.language})\n\n`
    for (const item of langSpecific) md += `- ${item}\n`
    md += `\n`
  }

  md += `## 5. Provider Compatibility\n\n`
  if (rec.providerCompatNotes.length === 0) {
    md += `(No providers selected - revisit Step 1.)\n\n`
  } else {
    for (const note of rec.providerCompatNotes) md += `- ${note}\n`
    md += `\n`
  }

  md += `## 6. Watch-Outs\n\n`
  for (const w of rec.watchOuts) md += `- ${w}\n`
  md += `\n`

  md += `## 7. Refactor Plan Narrative\n\n`
  if (inputs.refactorPlan.trim().length > 0) {
    md += `${inputs.refactorPlan.trim()}\n\n`
  } else {
    md += `(No narrative recorded.)\n\n`
  }

  md += `---\n\n`
  md += `> "${CSWP39_41_QUOTE}"\n`
  md += `> -- NIST CSWP 39 Section 4.1\n\n`
  md += `*Generated by PQC Today Hub. Standards citations: NIST CSWP 39 Section 4.1, Fig.2. https://doi.org/10.6028/NIST.CSWP.39*\n`

  return sanitiseAscii(md)
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const CryptoApiRefactorAudit: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)

  const sections = useMemo(() => SECTIONS, [])

  const handleExport = useCallback(
    (data: Record<string, Record<string, string | string[]>>) => {
      const language = (data.stackInventory?.language as string) || 'Go'
      const markdown = renderCryptoApiMarkdown(data)
      addExecutiveDocument({
        id: `crypto-api-refactor-${Date.now()}`,
        moduleId: 'crypto-mgmt-modernization',
        type: 'crypto-api-refactor',
        title: `Crypto API Refactor Audit - ${language}`,
        data: markdown,
        createdAt: Date.now(),
      })
    },
    [addExecutiveDocument]
  )

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 border-l-4 border-status-info flex items-start gap-3">
        <Code2 size={20} className="text-status-info mt-0.5 shrink-0" />
        <div>
          <h2 className="text-base font-semibold text-foreground">Crypto API Refactor Audit</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Architect + senior-developer decision tool from NIST CSWP 39 Section 4.1 - Using an API
            in a Crypto Library Application. Grades the application's current crypto-agility state
            and emits a phased refactor checklist with language-specific call-site guidance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="glass-panel p-3 flex items-start gap-2">
          <Code2 size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Agility lives at the API boundary</p>
            <p className="text-muted-foreground">
              An app that calls `RSA_sign()` directly is NOT agile; one that calls
              `EVP_DigestSign()` with the algorithm selected at run-time IS.
            </p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-2">
          <ArrowRight size={16} className="text-status-info shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Wrap then refactor</p>
            <p className="text-muted-foreground">
              Large fully-hardcoded surfaces refactor faster behind a thin facade than as a single
              big-bang change.
            </p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-2">
          <ShieldCheck size={16} className="text-status-success shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Providers vary in PQC timing</p>
            <p className="text-muted-foreground">
              Build the fallback path explicitly - CSWP-39 Section 4.1 warns providers ship PQC at
              different times.
            </p>
          </div>
        </div>
      </div>

      <ArtifactBuilder
        title="Crypto API Refactor Audit"
        description="Fill in the stack inventory and refactor scope; the engine returns a phased refactor plan with language-specific call-site checklist."
        sections={sections}
        onExport={handleExport}
        exportFilename="crypto-api-refactor-audit"
        renderPreview={renderCryptoApiMarkdown}
        exportFormats={['markdown', 'pdf']}
      />
    </div>
  )
}
