// SPDX-License-Identifier: GPL-3.0-only

export type FIPSStatus = 'validated' | 'in-progress' | 'planned' | 'none'
export type PerformanceTier = 'optimized' | 'reference' | 'mixed'
export type LibraryCategory = 'standalone' | 'fork' | 'wrapper' | 'framework'

export interface AlgorithmSupport {
  mlKem: boolean
  mlDsa: boolean
  slhDsa: boolean
  fnDsa: boolean
  lms: boolean
  hqc: boolean
  classicMcEliece: boolean
  bike: boolean
  frodoKem: boolean
  ntru: boolean
}

export interface PQCLibraryRadar {
  algorithmBreadth: number
  performance: number
  fipsMaturity: number
  communityMaintenance: number
  languageBindings: number
}

export interface DependencyLink {
  target: string
  relationship: 'fork-of' | 'wraps' | 'provides-to' | 'uses'
  description: string
}

export interface PQCLibrary {
  id: string
  name: string
  fullName: string
  maintainer: string
  language: string
  category: LibraryCategory
  license: string
  yearStarted: number
  description: string
  algorithmSupport: AlgorithmSupport
  fipsStatus: FIPSStatus
  fipsDetails: string
  platforms: string[]
  performanceTier: PerformanceTier
  performanceNotes: string
  bindings: string[]
  dependencies: DependencyLink[]
  keyDifferentiator: string
  strengths: string[]
  limitations: string[]
  radar: PQCLibraryRadar
  repositoryUrl: string
}

export const PQC_LIBRARIES: PQCLibrary[] = [
  {
    id: 'liboqs',
    name: 'liboqs',
    fullName: 'Open Quantum Safe — liboqs',
    maintainer: 'Open Quantum Safe Project (University of Waterloo + community)',
    language: 'C',
    category: 'framework',
    license: 'MIT',
    yearStarted: 2017,
    description:
      'The reference open-source C library for PQC algorithm experimentation and integration. Provides a unified API across multiple PQC algorithms with both reference and optimized implementations. Powers oqsprovider (OpenSSL), oqs-python, oqs-go, and many other language bindings.',
    algorithmSupport: {
      mlKem: true,
      mlDsa: true,
      slhDsa: true,
      fnDsa: true,
      lms: false,
      hqc: true,
      classicMcEliece: true,
      bike: true,
      frodoKem: true,
      ntru: false,
    },
    fipsStatus: 'none',
    fipsDetails:
      'Not FIPS validated. Designed for research and prototyping. Some downstream consumers (AWS-LC) pursue FIPS independently.',
    platforms: ['Linux', 'macOS', 'Windows', 'FreeBSD', 'WASM (Emscripten)'],
    performanceTier: 'mixed',
    performanceNotes:
      'Includes both reference and AVX2/NEON optimized implementations. Performance varies by algorithm — optimized builds are competitive with standalone implementations.',
    bindings: [
      'C (native)',
      'Python (liboqs-python)',
      'Go (liboqs-go)',
      'Rust (oqs-rs)',
      'Java (liboqs-java)',
      '.NET (liboqs-dotnet)',
      'OpenSSL (oqsprovider)',
    ],
    dependencies: [
      {
        target: 'pqclean',
        relationship: 'uses',
        description: 'Incorporates PQClean reference implementations for some algorithms',
      },
      {
        target: 'oqsprovider',
        relationship: 'provides-to',
        description: 'oqsprovider wraps liboqs for OpenSSL 3.x integration',
      },
    ],
    keyDifferentiator:
      'Broadest PQC algorithm coverage with unified API — the "clearing house" for PQC implementations',
    strengths: [
      'Broadest algorithm coverage of any PQC library',
      'Unified C API across all algorithms',
      'Bindings for 7+ languages',
      'Active community and rapid standard tracking',
      'Powers the oqsprovider for OpenSSL PQC',
    ],
    limitations: [
      'Not FIPS validated — not suitable for regulated production use',
      'Algorithm implementations may lag behind final NIST standards',
      'API surface changes with each release as algorithms evolve',
      'Build configuration complexity (cmake options for algorithm selection)',
      'Some algorithms use reference (slow) implementations only',
    ],
    radar: {
      algorithmBreadth: 10,
      performance: 6,
      fipsMaturity: 1,
      communityMaintenance: 8,
      languageBindings: 10,
    },
    repositoryUrl: 'https://github.com/open-quantum-safe/liboqs',
  },
  {
    id: 'pqcrypto-rust',
    name: 'pqcrypto',
    fullName: 'pqcrypto — PQC for Rust',
    maintainer: 'Thom Wiggers + community',
    language: 'Rust',
    category: 'wrapper',
    license: 'MIT / Apache-2.0',
    yearStarted: 2019,
    description:
      'Rust crates wrapping PQClean C implementations. Compile-time algorithm selection via Cargo features. Each algorithm is a separate crate (e.g. pqcrypto-kyber, pqcrypto-dilithium — pre-standardisation crate names for what FIPS 203/204 now call ML-KEM and ML-DSA respectively) for minimal binary size.',
    algorithmSupport: {
      mlKem: true,
      mlDsa: true,
      slhDsa: true,
      fnDsa: true,
      lms: false,
      hqc: true,
      classicMcEliece: true,
      bike: false,
      frodoKem: true,
      ntru: true,
    },
    fipsStatus: 'none',
    fipsDetails:
      'No FIPS validation. Wraps PQClean reference/optimized C code compiled via cc crate.',
    platforms: ['Linux', 'macOS', 'Windows', 'WASM (wasm32)'],
    performanceTier: 'mixed',
    performanceNotes:
      'Performance depends on underlying PQClean implementation. AVX2 optimizations available on supported platforms. Compile-time feature flags control optimization level.',
    bindings: ['Rust (native)'],
    dependencies: [
      {
        target: 'pqclean',
        relationship: 'wraps',
        description: 'Compiles PQClean C implementations into Rust crates via build.rs',
      },
    ],
    keyDifferentiator:
      'Idiomatic Rust API with compile-time algorithm selection and minimal dependency footprint',
    strengths: [
      'Idiomatic Rust types — no unsafe in public API',
      'Compile-time algorithm selection via Cargo features',
      'Minimal binary size — only include algorithms you use',
      'Memory safety from Rust ownership model',
      'Easy integration with Rust crypto ecosystem (RustCrypto traits)',
    ],
    limitations: [
      'Wraps C code — not pure Rust (uses cc crate for compilation)',
      'No FIPS certification path',
      'Smaller community than liboqs',
      'Crate names pqcrypto-kyber and pqcrypto-dilithium predate NIST standardisation — they wrap ML-KEM (FIPS 203) and ML-DSA (FIPS 204) but the ml-kem / ml-dsa crate names are not yet published',
      'Build requires C compiler toolchain',
    ],
    radar: {
      algorithmBreadth: 8,
      performance: 6,
      fipsMaturity: 1,
      communityMaintenance: 6,
      languageBindings: 2,
    },
    repositoryUrl: 'https://github.com/rustpq/pqcrypto',
  },
  {
    id: 'bouncy-castle-pqc',
    name: 'Bouncy Castle PQC',
    fullName: 'Bouncy Castle Post-Quantum Cryptography',
    maintainer: 'Legion of the Bouncy Castle (Australian non-profit)',
    language: 'Java / C#',
    category: 'framework',
    license: 'MIT',
    yearStarted: 2020,
    description:
      'The most comprehensive PQC implementation in managed languages. Pure Java and C# implementations (no native dependencies). Provides both JCA provider integration and standalone lightweight API.',
    algorithmSupport: {
      mlKem: true,
      mlDsa: true,
      slhDsa: true,
      fnDsa: true,
      lms: true,
      hqc: true,
      classicMcEliece: true,
      bike: true,
      frodoKem: true,
      ntru: true,
    },
    fipsStatus: 'in-progress',
    fipsDetails:
      'BC-FIPS variant is FIPS 140-2 validated for classical algorithms. PQC algorithms are being added to BC-FIPS as NIST standards finalize.',
    platforms: ['Any JVM (Java)', 'Any CLR (.NET)', 'Android', 'Xamarin'],
    performanceTier: 'reference',
    performanceNotes:
      'Pure managed code — no AVX2/NEON SIMD optimizations. Performance is adequate for most use cases but 2-5x slower than optimized C implementations for key generation.',
    bindings: ['Java (native)', 'C# (native)', 'Kotlin', 'Scala', 'F#'],
    dependencies: [],
    keyDifferentiator:
      'Broadest PQC coverage in managed languages — pure Java/C# with no native dependencies',
    strengths: [
      'Most complete PQC algorithm set (all NIST finalists + candidates)',
      'Pure managed code — runs anywhere JVM/.NET runs',
      'Dual API: JCA provider (transparent) + lightweight (direct)',
      'BC-FIPS variant for regulated environments',
      'Rapid NIST standard adoption — usually first to implement new specs',
      'Available for both Java and C#',
    ],
    limitations: [
      'Slower than native C implementations (no SIMD)',
      'Large library size (~6MB JAR)',
      'BC-FIPS PQC support lags behind main BC release',
      'GC prevents guaranteed key material zeroing (Java)',
      'API surface is very large — learning curve',
    ],
    radar: {
      algorithmBreadth: 10,
      performance: 4,
      fipsMaturity: 5,
      communityMaintenance: 9,
      languageBindings: 5,
    },
    repositoryUrl: 'https://github.com/bcgit/bc-java',
  },
  {
    id: 'pqclean',
    name: 'PQClean',
    fullName: 'PQClean — Clean PQC Reference Implementations',
    maintainer: 'PQClean Project (academic community)',
    language: 'C',
    category: 'standalone',
    license: 'Public domain / MIT (per algorithm)',
    yearStarted: 2018,
    description:
      'Clean, portable, auditable C implementations of PQC algorithms. Designed as a reference — no external dependencies, minimal build system, consistent coding style. Used as the upstream source for pqcrypto (Rust) and partially by liboqs.',
    algorithmSupport: {
      mlKem: true,
      mlDsa: true,
      slhDsa: true,
      fnDsa: true,
      lms: false,
      hqc: true,
      classicMcEliece: true,
      bike: false,
      frodoKem: false,
      ntru: true,
    },
    fipsStatus: 'none',
    fipsDetails:
      'Reference implementations — not intended for FIPS validation. Used as basis for validated implementations elsewhere.',
    platforms: ['Any C compiler target'],
    performanceTier: 'reference',
    performanceNotes:
      'Both reference and optimized (AVX2) implementations available. Reference implementations prioritize clarity over speed. Optimized variants are competitive.',
    bindings: ['C (native)', 'Rust (via pqcrypto)', 'Python (via ctypes wrappers)'],
    dependencies: [
      {
        target: 'pqcrypto-rust',
        relationship: 'provides-to',
        description: 'pqcrypto Rust crates compile PQClean implementations',
      },
      {
        target: 'liboqs',
        relationship: 'provides-to',
        description: 'liboqs incorporates some PQClean implementations',
      },
    ],
    keyDifferentiator:
      'Auditable reference implementations — the upstream source for many other PQC projects',
    strengths: [
      'Cleanest, most auditable PQC code',
      'No external dependencies — fully self-contained',
      'Consistent coding style across all algorithms',
      'Both reference and optimized implementations',
      'Academic rigor — close to NIST specification',
    ],
    limitations: [
      'Not a usable library — no unified API, no build system',
      'Requires integration effort to use in production',
      'No key serialization or high-level abstractions',
      'Reference implementations are slow',
      'Not designed for direct production use',
    ],
    radar: {
      algorithmBreadth: 8,
      performance: 5,
      fipsMaturity: 1,
      communityMaintenance: 7,
      languageBindings: 3,
    },
    repositoryUrl: 'https://github.com/PQClean/PQClean',
  },
  {
    id: 'aws-lc',
    name: 'AWS-LC',
    fullName: 'AWS Libcrypto',
    maintainer: 'Amazon Web Services',
    language: 'C',
    category: 'fork',
    license: 'Apache-2.0 / ISC',
    yearStarted: 2019,
    description:
      "Amazon's fork of BoringSSL, enhanced with FIPS 140-3 validation and PQC support. Powers AWS services (S2N-TLS, AWS SDK). Designed for high-performance server-side crypto with a focus on FIPS compliance.",
    algorithmSupport: {
      mlKem: true,
      mlDsa: true,
      slhDsa: false,
      fnDsa: false,
      lms: false,
      hqc: false,
      classicMcEliece: false,
      bike: false,
      frodoKem: false,
      ntru: false,
    },
    fipsStatus: 'validated',
    fipsDetails:
      'FIPS 140-3 validated (CMVP certificate). ML-KEM-768 included in FIPS boundary. First FIPS-validated PQC KEM implementation.',
    platforms: ['Linux', 'macOS', 'Windows', 'ARM64', 'x86-64'],
    performanceTier: 'optimized',
    performanceNotes:
      'Highly optimized with AVX2/AVX-512 and ARM NEON. Designed for server-scale throughput. Performance is competitive with or exceeds OpenSSL for supported algorithms.',
    bindings: [
      'C (native)',
      'Rust (aws-lc-rs)',
      'Python (via s2n-tls)',
      'Java (Amazon Corretto Crypto Provider)',
    ],
    dependencies: [
      {
        target: 'boringssl',
        relationship: 'fork-of',
        description: "Forked from Google's BoringSSL with FIPS and PQC additions",
      },
    ],
    keyDifferentiator:
      'First FIPS 140-3 validated library with PQC (ML-KEM) — the choice for regulated AWS workloads',
    strengths: [
      'FIPS 140-3 validated with ML-KEM in FIPS boundary',
      'Highly optimized for server-scale performance',
      'Amazon corporate backing and long-term maintenance',
      'Rust bindings (aws-lc-rs) enable memory-safe usage',
      'Powers production AWS services at massive scale',
    ],
    limitations: [
      'Limited PQC algorithm set (ML-KEM, ML-DSA only — no SLH-DSA, FN-DSA)',
      'Smaller community than OpenSSL',
      'FIPS boundary restricts available algorithms',
      'API compatibility with BoringSSL, not OpenSSL (different from most Linux deployments)',
      'Focused on server-side — not designed for embedded/IoT',
    ],
    radar: {
      algorithmBreadth: 3,
      performance: 10,
      fipsMaturity: 10,
      communityMaintenance: 9,
      languageBindings: 5,
    },
    repositoryUrl: 'https://github.com/aws/aws-lc',
  },
  {
    id: 'boringssl',
    name: 'BoringSSL',
    fullName: 'BoringSSL',
    maintainer: 'Google',
    language: 'C',
    category: 'fork',
    license: 'ISC / OpenSSL',
    yearStarted: 2014,
    description:
      "Google's fork of OpenSSL, stripped down for Google's needs. Powers Chrome, Android, and Google Cloud. First major deployment of a NIST PQC candidate in TLS at scale — Chrome shipped draft Kyber-768 in 2023 (before FIPS 203 was finalised); the algorithm is now standardised as ML-KEM.",
    algorithmSupport: {
      mlKem: true,
      mlDsa: true,
      slhDsa: false,
      fnDsa: false,
      lms: false,
      hqc: false,
      classicMcEliece: false,
      bike: false,
      frodoKem: false,
      ntru: false,
    },
    fipsStatus: 'validated',
    fipsDetails:
      'BoringCrypto module is FIPS 140-2 validated. Used by Google Cloud and Go crypto/tls. ML-KEM being added to FIPS boundary.',
    platforms: ['Linux', 'macOS', 'Windows', 'Android', 'iOS', 'Fuchsia'],
    performanceTier: 'optimized',
    performanceNotes:
      "Extremely optimized for Google's use cases. AVX2/NEON assembly for critical paths. ML-KEM key exchange adds <1ms to Chrome TLS handshake.",
    bindings: [
      'C (native)',
      'Go (crypto/tls uses BoringCrypto)',
      'Rust (ring crate wraps BoringSSL)',
    ],
    dependencies: [],
    keyDifferentiator:
      'First production PQC deployment at scale — ML-KEM in Chrome TLS for billions of connections',
    strengths: [
      'Battle-tested at Google scale (billions of TLS connections/day)',
      'First to deploy ML-KEM in production (Chrome)',
      'FIPS 140-2 validated (BoringCrypto module)',
      'Minimal API surface — less room for misuse',
      'Powers Go crypto/tls and ring (Rust) indirectly',
    ],
    limitations: [
      'No stable API — not intended for external consumption',
      'Google-centric — feature additions driven by Google needs',
      'Very limited PQC algorithm set',
      'No package manager distribution — build from source',
      'Documentation is sparse — "read the source"',
    ],
    radar: {
      algorithmBreadth: 3,
      performance: 10,
      fipsMaturity: 8,
      communityMaintenance: 8,
      languageBindings: 3,
    },
    repositoryUrl: 'https://github.com/google/boringssl',
  },
  {
    id: 'wolfssl',
    name: 'wolfSSL',
    fullName: 'wolfSSL / wolfCrypt',
    maintainer: 'wolfSSL Inc. (commercial + open source)',
    language: 'C',
    category: 'standalone',
    license: 'GPLv2 (open source) / Commercial',
    yearStarted: 2006,
    description:
      'Lightweight embedded TLS and crypto library optimized for constrained devices. Dual-licensed (GPLv2 + commercial). FIPS 140-2/3 validated wolfCrypt module. PQC support via liboqs integration and native implementations.',
    algorithmSupport: {
      mlKem: true,
      mlDsa: true,
      slhDsa: false,
      fnDsa: true,
      lms: true,
      hqc: false,
      classicMcEliece: false,
      bike: false,
      frodoKem: false,
      ntru: false,
    },
    fipsStatus: 'validated',
    fipsDetails:
      'wolfCrypt FIPS 140-2 Level 1 validated (certificate #3389). FIPS 140-3 validation in progress. PQC algorithms in non-FIPS module.',
    platforms: [
      'Linux',
      'macOS',
      'Windows',
      'RTOS (FreeRTOS, Zephyr, ThreadX)',
      'Bare metal',
      'Arduino',
    ],
    performanceTier: 'optimized',
    performanceNotes:
      'Optimized for small footprint (20-100KB). ARM assembly optimizations. Designed for microcontrollers and IoT devices. Performance competitive with OpenSSL on constrained platforms.',
    bindings: ['C (native)', 'Python (wolfssl-py)', 'Java (wolfJSSE)', 'C# (.NET wrapper)', 'Ada'],
    dependencies: [
      {
        target: 'liboqs',
        relationship: 'uses',
        description: 'Optional liboqs integration for broader PQC algorithm support',
      },
    ],
    keyDifferentiator: 'The embedded/IoT PQC choice — smallest footprint with FIPS validation',
    strengths: [
      'Smallest footprint — runs on microcontrollers (ARM Cortex-M)',
      'FIPS 140-2/3 validated (wolfCrypt)',
      'Commercial support with SLA',
      'Designed for constrained devices (RTOS, bare metal)',
      'LMS/XMSS support for firmware signing (stateful hash-based)',
      'Dual-licensed — open source + commercial',
    ],
    limitations: [
      'GPLv2 open-source license — viral clause for linked software',
      'PQC support narrower than liboqs or Bouncy Castle',
      'Commercial license required for many use cases',
      'Smaller community than OpenSSL',
      'API less standardized than OpenSSL EVP',
    ],
    radar: {
      algorithmBreadth: 5,
      performance: 8,
      fipsMaturity: 8,
      communityMaintenance: 7,
      languageBindings: 5,
    },
    repositoryUrl: 'https://github.com/wolfSSL/wolfssl',
  },
  {
    id: 'botan',
    name: 'Botan',
    fullName: 'Botan — Crypto and TLS for Modern C++',
    maintainer: 'Jack Lloyd + community',
    language: 'C++',
    category: 'standalone',
    license: 'BSD-2-Clause',
    yearStarted: 2001,
    description:
      'A modern C++ crypto library with native PQC support since version 3.x. Provides a clean C++20 API without C legacy. Includes ML-KEM, ML-DSA, SLH-DSA, FrodoKEM, and XMSS/LMS. Used in GnuPG-compatible implementations.',
    algorithmSupport: {
      mlKem: true,
      mlDsa: true,
      slhDsa: true,
      fnDsa: false,
      lms: true,
      hqc: false,
      classicMcEliece: true,
      bike: false,
      frodoKem: true,
      ntru: false,
    },
    fipsStatus: 'none',
    fipsDetails:
      'No FIPS validation. BSI (German Federal Office) has evaluated Botan for government use.',
    platforms: ['Linux', 'macOS', 'Windows', 'FreeBSD', 'iOS', 'Android'],
    performanceTier: 'optimized',
    performanceNotes:
      'Native C++ implementations with SIMD optimizations (AVX2, NEON). Performance competitive with OpenSSL for PQC operations. Modern C++ enables efficient memory management.',
    bindings: ['C++ (native)', 'C (FFI)', 'Python (botan-python)', 'Rust (botan-rs)'],
    dependencies: [],
    keyDifferentiator:
      'Modern C++ crypto with native PQC — no C API legacy, clean type-safe interface',
    strengths: [
      'Native PQC support — not a wrapper around C code',
      'Modern C++20 API — type-safe, RAII-based',
      'Broad algorithm coverage including LMS/XMSS stateful signatures',
      'BSI evaluated for German government use',
      'Clean build system (cmake/meson) with fine-grained feature selection',
      'TLS 1.3 implementation with PQC key exchange',
    ],
    limitations: [
      'Smaller community than OpenSSL',
      'No FIPS validation (BSI evaluation only)',
      'C++ dependency may be a barrier for C-only embedded projects',
      'No FN-DSA (Falcon) support yet',
      'Less battle-tested than OpenSSL at scale',
    ],
    radar: {
      algorithmBreadth: 7,
      performance: 8,
      fipsMaturity: 2,
      communityMaintenance: 7,
      languageBindings: 4,
    },
    repositoryUrl: 'https://github.com/randombit/botan',
  },
]

export const PQC_LIBRARY_RADAR_AXES = [
  { key: 'algorithmBreadth' as const, label: 'Algorithm Breadth' },
  { key: 'performance' as const, label: 'Performance' },
  { key: 'fipsMaturity' as const, label: 'FIPS Maturity' },
  { key: 'communityMaintenance' as const, label: 'Community' },
  { key: 'languageBindings' as const, label: 'Language Bindings' },
]

export const FIPS_FILTER_OPTIONS = [
  { id: 'All', label: 'All FIPS Status' },
  { id: 'validated', label: 'FIPS Validated' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'none', label: 'Not Validated' },
]

export const LANGUAGE_LIB_FILTER_OPTIONS = [
  { id: 'All', label: 'All Languages' },
  { id: 'C', label: 'C' },
  { id: 'C++', label: 'C++' },
  { id: 'Rust', label: 'Rust' },
  { id: 'Java / C#', label: 'Java / C#' },
]

export const PQC_ALGORITHMS_LIST = [
  { key: 'mlKem', label: 'ML-KEM', family: 'KEM' },
  { key: 'mlDsa', label: 'ML-DSA', family: 'Signature' },
  { key: 'slhDsa', label: 'SLH-DSA', family: 'Signature' },
  { key: 'fnDsa', label: 'FN-DSA', family: 'Signature' },
  { key: 'lms', label: 'LMS/XMSS', family: 'Hash-based Sig' },
  { key: 'hqc', label: 'HQC', family: 'KEM' },
  { key: 'classicMcEliece', label: 'Classic McEliece', family: 'KEM' },
  { key: 'bike', label: 'BIKE', family: 'KEM' },
  { key: 'frodoKem', label: 'FrodoKEM', family: 'KEM' },
  { key: 'ntru', label: 'NTRU', family: 'KEM' },
] as const
