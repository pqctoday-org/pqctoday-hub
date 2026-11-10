// SPDX-License-Identifier: AGPL-3.0-only
import { describeRuntimeSupport, runtimeHasNativePqc } from './pqcSupportData'

export type MemorySafety = 'manual' | 'ownership' | 'gc' | 'refcount' | 'comptime'
export type FFICapability = 'native' | 'excellent' | 'good' | 'moderate' | 'limited'

export interface CryptoLibEntry {
  name: string
  description: string
  /** For libraries covered by pqcSupportData, derive this with runtimeHasNativePqc() */
  pqcSupport: boolean
}

export interface LanguageRadar {
  memorySafety: number // 0-10
  cryptoEcosystem: number
  ffiCapability: number
  buildTooling: number
  compileTimeGuarantees: number
  auditCertHistory: number
}

export interface DevLanguage {
  id: string
  name: string
  paradigm: string
  memorySafety: MemorySafety
  memorySafetyDescription: string
  ffi: FFICapability
  ffiDescription: string
  cryptoLibraries: CryptoLibEntry[]
  pqcBindings: string[]
  notableDeployments: string[]
  pros: string[]
  cons: string[]
  cryptoDevContext: string
  radar: LanguageRadar
  compiledOrInterpreted: 'compiled' | 'interpreted' | 'jit' | 'both'
  yearIntroduced: number
}

export const DEV_LANGUAGES: DevLanguage[] = [
  {
    id: 'cpp',
    name: 'C++',
    paradigm: 'Multi-paradigm (OOP, generic, procedural)',
    memorySafety: 'manual',
    memorySafetyDescription:
      'Manual memory management. Raw pointers, RAII smart pointers (unique_ptr, shared_ptr). Buffer overflows and use-after-free are possible without discipline.',
    ffi: 'native',
    ffiDescription:
      'Native C ABI compatibility. Directly calls C libraries without wrappers. Can expose C++ classes via extern "C" for other languages.',
    cryptoLibraries: [
      {
        name: 'OpenSSL',
        description: `De facto standard — libcrypto/libssl. ${describeRuntimeSupport('openssl')}`,
        pqcSupport: runtimeHasNativePqc('openssl'),
      },
      {
        name: 'Botan',
        description:
          'Modern C++ crypto library with native PQC (ML-KEM, ML-DSA, SLH-DSA since 3.x)',
        pqcSupport: true,
      },
      {
        name: 'Crypto++',
        description: 'Header-heavy C++ library, extensive algorithm coverage',
        pqcSupport: false,
      },
      {
        name: 'libsodium',
        description: 'NaCl-based, high-level API, misuse-resistant',
        pqcSupport: false,
      },
      {
        name: 'wolfSSL',
        description: 'Embedded-focused TLS + crypto, FIPS validated, PQC support',
        pqcSupport: true,
      },
    ],
    pqcBindings: [
      'OpenSSL 3.5+ (native ML-KEM, ML-DSA, SLH-DSA)',
      'oqsprovider (OpenSSL before 3.5, or non-standardised algorithms)',
      'Botan 3.x (native)',
      'liboqs (C, direct)',
      'wolfSSL',
    ],
    notableDeployments: [
      'OpenSSL powers most web servers (Apache, Nginx)',
      'Chrome/BoringSSL uses ML-KEM for TLS',
      'AWS-LC (C, compiled as C++) for AWS services',
    ],
    pros: [
      'Close to the hardware — SIMD intrinsics and direct use of C crypto libraries',
      'Direct access to all C crypto libraries without FFI overhead',
      'Deterministic memory management via RAII',
      'Mature toolchain (compilers, debuggers, sanitizers)',
      'Template metaprogramming for compile-time algorithm selection',
    ],
    cons: [
      'Memory safety is developer responsibility — high bug surface',
      'Compilers can drop writes that clear key material and can turn constant-time source into branches — check the generated code',
      'Complex build systems (CMake, Bazel) with dependency management pain',
      'No built-in package manager (vcpkg/Conan are bolt-ons)',
      'Long compile times for template-heavy crypto code',
    ],
    cryptoDevContext:
      "C++ gives direct access to the full ecosystem of C crypto libraries. Botan 3.x provides a modern C++ PQC experience without C API friction. Memory safety is the developer's responsibility, and side-channel resistance needs review and timing tests.",
    radar: {
      memorySafety: 3,
      cryptoEcosystem: 9,
      ffiCapability: 10,
      buildTooling: 6,
      compileTimeGuarantees: 7,
      auditCertHistory: 8,
    },
    compiledOrInterpreted: 'compiled',
    yearIntroduced: 1985,
  },
  {
    id: 'rust',
    name: 'Rust',
    paradigm: 'Systems programming (ownership + traits)',
    memorySafety: 'ownership',
    memorySafetyDescription:
      'Ownership and borrowing rules enforce memory-safety guarantees at compile time in safe Rust. unsafe blocks, and calls into C libraries through FFI, are outside those guarantees: the programmer must uphold them, and unsafe code is marked so it can be reviewed.',
    ffi: 'excellent',
    ffiDescription:
      'Native C ABI via extern "C". Excellent bindgen for auto-generating C/C++ bindings. Can compile to C-callable shared libraries. WASM target support.',
    cryptoLibraries: [
      {
        name: 'RustCrypto',
        description:
          'Pure Rust community crates, including standardized ML-DSA and ML-KEM; evaluate each crate and version separately',
        pqcSupport: true,
      },
      {
        name: 'ring',
        description: 'BoringSSL-backed, high-performance, limited algorithm set',
        pqcSupport: false,
      },
      {
        name: 'pqcrypto',
        description:
          'Archived Rust bindings to PQClean with legacy Dilithium/Kyber APIs; upstream recommends maintained alternatives for new projects',
        pqcSupport: true,
      },
      {
        name: 'openssl crate',
        description: 'Rust bindings to OpenSSL libcrypto',
        pqcSupport: true,
      },
      {
        name: 'aws-lc-rs',
        description: 'Rust bindings to AWS-LC (FIPS-validated)',
        pqcSupport: true,
      },
    ],
    pqcBindings: [
      'RustCrypto ml-dsa 0.1.2 (standardized ML-DSA; unaudited)',
      'pqcrypto (archived PQClean wrappers; legacy profiles)',
      'oqs-rs (liboqs bindings)',
      'aws-lc-rs (ML-KEM)',
      'openssl crate (OpenSSL 3.5+ native PQC)',
    ],
    notableDeployments: [
      'Rustls — pure Rust TLS library (used by curl, Hyper)',
      'Signal Protocol — libsignal-protocol-rust',
      'AWS Nitro Enclaves use aws-lc-rs',
    ],
    pros: [
      'Safe Rust enforces memory-safety guarantees at compile time; unsafe blocks and FFI calls to C libraries are not covered',
      'The type system can encode invariants (newtype patterns) that turn some key misuse into compile errors',
      'The subtle crate offers constant-time-oriented primitives, which its authors call a best-effort attempt: timing behaviour still depends on the compiler and hardware, so review and test it',
      'Cargo package manager — reproducible builds, security audits (cargo audit)',
      'No garbage collector or runtime to ship — measure performance on your own workload',
      'WASM compilation for browser crypto',
    ],
    cons: [
      'Steep learning curve — ownership/lifetime annotations',
      'Smaller crypto ecosystem than C/Java (growing rapidly)',
      'FIPS validation applies to a specific module build: for Rust, check the certificate for the exact module version and the binding you use (for example aws-lc-rs wrapping AWS-LC)',
      'unsafe blocks in crypto code reduce safety guarantees',
      'Compile times can be long for complex crypto crates',
    ],
    cryptoDevContext:
      'Rust\'s ownership rules remove many classes of memory bug in safe code, and its type system can encode invariants like "this key is only usable for signing", which suits new crypto library work. The language does not provide constant-time execution: use primitives such as subtle, keep unsafe code and C bindings small and reviewed, and test timing. For new standardized ML-DSA work, evaluate maintained RustCrypto crates and their exact versions; the archived pqcrypto APIs include pre-standard algorithms. The worked example uses unaudited ml-dsa 0.1.2. For FIPS, check the validation status of the exact module you use.',
    radar: {
      memorySafety: 9,
      cryptoEcosystem: 7,
      ffiCapability: 9,
      buildTooling: 10,
      compileTimeGuarantees: 10,
      auditCertHistory: 4,
    },
    compiledOrInterpreted: 'compiled',
    yearIntroduced: 2015,
  },
  {
    id: 'zig',
    name: 'Zig',
    paradigm: 'Systems programming (comptime + manual memory)',
    memorySafety: 'comptime',
    memorySafetyDescription:
      'No garbage collector, no hidden control flow. comptime evaluation enables compile-time algorithm verification. Runtime safety checks (bounds checking, null detection) can be toggled. Explicit allocator passing.',
    ffi: 'excellent',
    ffiDescription:
      "C interop through Zig's C translation (zig translate-c), so C headers can be turned into Zig declarations without hand-written bindings. The C code you call is outside any Zig safety check.",
    cryptoLibraries: [
      {
        name: 'std.crypto',
        description: 'Built-in crypto: AES, ChaCha20, SHA-2/3, Ed25519, X25519, HKDF',
        pqcSupport: false,
      },
      {
        name: 'C interop',
        description: 'Call OpenSSL, liboqs or another C crypto library through C translation',
        pqcSupport: true,
      },
    ],
    pqcBindings: ['liboqs via C translation', 'OpenSSL 3.5+ via C translation'],
    notableDeployments: [
      'Bun JavaScript runtime uses Zig + BoringSSL for TLS',
      'TigerBeetle financial database uses Zig for deterministic computation',
    ],
    pros: [
      'comptime runs ordinary Zig code at compile time (generics, tables, parameter checks); it is not a constant-time checker, so side channels still need review and timing tests',
      "Direct C interop without a binding generator; the C code you call is outside Zig's safety checks",
      'Explicit allocator passing makes allocations visible at the call site (Zig advertises no hidden memory allocations)',
      'Built-in std.crypto covers common operations',
      'Cross-compilation to many targets from one machine',
      'Zig advertises no hidden control flow, which helps reading code; timing side channels still need dedicated review',
    ],
    cons: [
      'Small ecosystem — limited crypto-specific libraries',
      'Language still pre-1.0 — API stability not guaranteed',
      'No PQC libraries native to Zig — must use C interop',
      'Tiny community — few crypto experts writing Zig',
      'FIPS validation: none is known to this lesson for std.crypto — check the CMVP list',
      'Limited IDE/tooling compared to Rust/C++',
    ],
    cryptoDevContext:
      "Zig's comptime (compile-time code execution) and C translation make it interesting for new crypto code, but comptime does not verify constant-time behaviour, so review and timing tests are still required. The ecosystem is nascent — you will write C interop wrappers. Best suited for teams with existing C crypto expertise who want better tooling.",
    radar: {
      memorySafety: 6,
      cryptoEcosystem: 2,
      ffiCapability: 10,
      buildTooling: 7,
      compileTimeGuarantees: 9,
      auditCertHistory: 1,
    },
    compiledOrInterpreted: 'compiled',
    yearIntroduced: 2017,
  },
  {
    id: 'java',
    name: 'Java',
    paradigm: 'Object-oriented (JVM)',
    memorySafety: 'gc',
    memorySafetyDescription:
      'Garbage collected — no manual memory management, and ordinary Java code has no C-style buffer overflows or use-after-free; JNI and foreign-function calls fall outside that guarantee. However, sensitive key material may linger in memory until GC collects it (use char[] and explicit zeroing).',
    ffi: 'moderate',
    ffiDescription:
      "JNI (Java Native Interface) for C/C++ calls — brittle native-method machinery. The Foreign Function & Memory API (java.lang.foreign) is final in JDK 22 (JEP 454): a pure-Java way to call native libraries and use native memory, with unsafe operations marked restricted. The native code you call is still outside the JVM's memory safety.",
    cryptoLibraries: [
      {
        name: 'JCA/JCE',
        description: `Built-in Java crypto framework with provider architecture. ${describeRuntimeSupport('java')}`,
        pqcSupport: runtimeHasNativePqc('java'),
      },
      {
        name: 'Bouncy Castle',
        description:
          'Comprehensive crypto library — supports ML-KEM, ML-DSA, SLH-DSA, FN-DSA, LMS/HSS, XMSS, HQC, Classic McEliece, FrodoKEM, NTRU',
        pqcSupport: true,
      },
      {
        name: 'BC-FIPS',
        description: 'FIPS 140-2 certified Bouncy Castle variant',
        pqcSupport: true,
      },
      { name: 'Conscrypt', description: "Google's OpenSSL-backed JCA provider", pqcSupport: false },
      {
        name: 'Amazon Corretto Crypto Provider',
        description: "AWS's OpenSSL-backed JCA provider",
        pqcSupport: true,
      },
    ],
    pqcBindings: [
      'JDK 24+ built-in (ML-KEM via javax.crypto.KEM, ML-DSA via Signature)',
      'Bouncy Castle (native Java; adds SLH-DSA and more)',
      'BC-FIPS (certified)',
      'Amazon Corretto Crypto Provider (via AWS-LC)',
    ],
    notableDeployments: [
      'Android platform cryptography',
      'Enterprise banking and payment systems',
      'Apache Kafka, Spring Security, Keycloak',
    ],
    pros: [
      'JCA provider architecture — swap providers without touching call sites (algorithm names, key sizes and encodings still change)',
      'Bouncy Castle provides a broad set of PQC algorithms on any JDK (see the support table)',
      'Massive enterprise ecosystem and developer pool',
      'Platform independent — same code runs on any JVM',
      'Strong typing and null safety (with modern Java features)',
    ],
    cons: [
      'GC makes key material zeroing unreliable',
      'JNI FFI is painful — performance and complexity overhead',
      'JVM startup time can be an issue for crypto microservices',
      'No compile-time constant-time guarantees',
      'String-based algorithm names in JCA are error-prone',
    ],
    cryptoDevContext:
      'Java is the dominant language for enterprise crypto applications. The JCA provider model lets algorithm implementations be swapped without changing call sites (algorithm names, sizes and encodings still change). JDK 24+ ships ML-KEM and ML-DSA in the default providers (JDK 25 LTS has them, and Oracle backported them to Oracle JDK 21.0.13 and 17.0.21 in October 2026). Bouncy Castle implements a broad set of PQC algorithms, including SLH-DSA (see the support table). The main challenge is memory safety for key material — GC cannot guarantee timely zeroing.',
    radar: {
      memorySafety: 7,
      cryptoEcosystem: 10,
      ffiCapability: 4,
      buildTooling: 8,
      compileTimeGuarantees: 5,
      auditCertHistory: 9,
    },
    compiledOrInterpreted: 'jit',
    yearIntroduced: 1995,
  },
  {
    id: 'python',
    name: 'Python',
    paradigm: 'Multi-paradigm (OOP, functional, scripting)',
    memorySafety: 'gc',
    memorySafetyDescription:
      'Reference-counted with cycle collector. No manual memory management. However, immutable bytes/strings cannot be zeroed — sensitive key material is problematic in Python.',
    ffi: 'good',
    ffiDescription:
      'ctypes for C library loading, cffi for C function calling, pybind11 for C++ bindings. NumPy-style C extensions common. Performance-critical crypto always calls native C code.',
    cryptoLibraries: [
      {
        name: 'cryptography',
        description: `High-level API wrapping OpenSSL — Fernet, X.509, AEAD. ${describeRuntimeSupport('python-cryptography')}`,
        pqcSupport: runtimeHasNativePqc('python-cryptography'),
      },
      {
        name: 'pyOpenSSL',
        description: 'Direct OpenSSL bindings for TLS and X.509',
        pqcSupport: false,
      },
      {
        name: 'PyCryptodome',
        description: 'Fork of PyCrypto — AES, RSA, ECC, ChaCha20',
        pqcSupport: false,
      },
      {
        name: 'liboqs-python',
        description: 'Python bindings for liboqs — full PQC suite',
        pqcSupport: true,
      },
      {
        name: 'pqcrypto (pip)',
        description: 'Python wrappers for PQClean implementations',
        pqcSupport: true,
      },
    ],
    pqcBindings: [
      'cryptography 48.0.0+ (ML-KEM, ML-DSA with OpenSSL 3.5+; 47.0.0+ with AWS-LC/BoringSSL)',
      'liboqs-python (SLH-DSA and non-standardised algorithms)',
    ],
    notableDeployments: [
      "Certbot (Let's Encrypt client)",
      'Paramiko SSH library',
      'Django/Flask web framework TLS',
      'AWS SDK crypto operations',
    ],
    pros: [
      'Quick to prototype crypto workflows and scripts',
      'Excellent for crypto research and experimentation',
      'Large data science ecosystem for crypto analysis',
      'cryptography 48+ wheels include ML-KEM and ML-DSA; liboqs-python covers the rest for experimentation',
      'Widely used for PKI tooling and certificate management',
    ],
    cons: [
      'Heavy crypto work is delegated to native code (OpenSSL, libsodium, liboqs), so the native boundary matters for security review',
      'Immutable bytes/strings prevent secure key material zeroing',
      'GIL limits true parallel crypto operations',
      'No compile-time type checking (without mypy)',
      'Not suitable for production crypto libraries — only as a wrapper/consumer',
    ],
    cryptoDevContext:
      'Python is mostly a consumer of native crypto libraries (OpenSSL, libsodium, liboqs). It suits scripting, PKI tooling, prototypes and research; immutable bytes objects cannot be zeroed in place, so plan key lifetime deliberately. Choose a production language by your own requirements, not by a ranking.',
    radar: {
      memorySafety: 6,
      cryptoEcosystem: 7,
      ffiCapability: 7,
      buildTooling: 8,
      compileTimeGuarantees: 1,
      auditCertHistory: 5,
    },
    compiledOrInterpreted: 'interpreted',
    yearIntroduced: 1991,
  },
  {
    id: 'go',
    name: 'Go',
    paradigm: 'Compiled, concurrent, garbage-collected',
    memorySafety: 'gc',
    memorySafetyDescription:
      'Garbage collected with no manual memory management. Bounds-checked slices prevent buffer overflows. crypto/subtle package provides constant-time comparison. Clearing a slice zeroes only that slice; copies made elsewhere are not cleared.',
    ffi: 'limited',
    ffiDescription:
      'cgo enables C library calls but with significant overhead (goroutine stack switching, memory copying). Cross-compilation breaks when using cgo. Pure Go preferred.',
    cryptoLibraries: [
      {
        name: 'crypto/*',
        description: `Standard library: AES, SHA, RSA, ECDSA, Ed25519, HKDF, plus crypto/mlkem and crypto/mldsa. ${describeRuntimeSupport('go')}`,
        pqcSupport: runtimeHasNativePqc('go'),
      },
      {
        name: 'x/crypto',
        description: 'Extended crypto: ChaCha20-Poly1305, NaCl, Argon2',
        pqcSupport: false,
      },
      {
        name: 'cloudflare/circl',
        description:
          'Cloudflare crypto: HPKE, ML-KEM, ML-DSA, SLH-DSA, hybrid KEM — use it for what the standard library lacks (e.g. SLH-DSA)',
        pqcSupport: true,
      },
      {
        name: 'open-quantum-safe/liboqs-go',
        description: 'Go bindings to liboqs (requires cgo)',
        pqcSupport: true,
      },
    ],
    pqcBindings: [
      'Standard library: crypto/mlkem (Go 1.24+), crypto/mldsa (Go 1.27+)',
      'cloudflare/circl (pure Go; SLH-DSA and more)',
      'liboqs-go (cgo)',
    ],
    notableDeployments: [
      'Cloudflare edge servers (circl for hybrid TLS)',
      'Kubernetes PKI (cfssl)',
      'HashiCorp Vault crypto operations',
      'Docker content trust (Notary)',
    ],
    pros: [
      'Broad standard library crypto; Trail of Bits published an independent security assessment of the core packages in 2025 (TLS and X.509 were out of scope), and constant-time behaviour is per primitive and platform — it reported one timing finding on Power ISA targets for operations expected to be constant time',
      'Simple concurrency (goroutines) for parallel crypto operations',
      'Fast compilation — rapid development cycle',
      'Strong cross-compilation without cgo dependency',
      'ML-KEM (Go 1.24) and ML-DSA (Go 1.27) are in the standard library; crypto/tls negotiates X25519MLKEM768 by default',
    ],
    cons: [
      'cgo overhead makes C library integration expensive',
      'GC prevents reliable key material zeroing',
      'No generics until Go 1.18 — limited type-level algorithm abstraction',
      'Smaller crypto library ecosystem than Java/C++',
      'FIPS 140-3 mode (GOFIPS140, Go 1.24+) is newer than C/Java validated modules — check the CMVP listing for status',
    ],
    cryptoDevContext:
      "Go suits crypto infrastructure tools (PKI, Vault, TLS services) where the standard library covers most needs — including PQC: crypto/mlkem since Go 1.24 (with X25519MLKEM768 on by default in crypto/tls) and crypto/mldsa since Go 1.27. Cloudflare's circl fills the remaining gaps such as SLH-DSA in pure Go. Avoid cgo for crypto — it negates Go's cross-compilation advantage.",
    radar: {
      memorySafety: 7,
      cryptoEcosystem: 7,
      ffiCapability: 3,
      buildTooling: 9,
      compileTimeGuarantees: 4,
      auditCertHistory: 7,
    },
    compiledOrInterpreted: 'compiled',
    yearIntroduced: 2009,
  },
  {
    id: 'dotnet',
    name: '.NET (C#)',
    paradigm: 'Multi-paradigm (OOP, functional, CLR)',
    memorySafety: 'gc',
    memorySafetyDescription:
      'Garbage collected CLR runtime. Span<T> and stackalloc enable stack-based crypto buffers that avoid GC. CryptographicOperations.ZeroMemory() for explicit key material clearing. SafeHandle for native resource management.',
    ffi: 'good',
    ffiDescription:
      "P/Invoke for C library calls. Source generators can auto-generate marshalling code. COM interop for Windows APIs. NativeAOT compiles ahead of time. Native code you call is outside the runtime's memory safety.",
    cryptoLibraries: [
      {
        name: 'System.Security.Cryptography',
        description: `Built-in: AES, RSA, ECDSA, ECDH, SHA-2/3 — wraps CNG on Windows, OpenSSL on Linux. ${describeRuntimeSupport('dotnet')}`,
        pqcSupport: runtimeHasNativePqc('dotnet'),
      },
      {
        name: 'Bouncy Castle C#',
        description:
          'C# edition of Bouncy Castle with ML-KEM, ML-DSA and SLH-DSA support (Bouncy Castle announcement, 9 June 2025)',
        pqcSupport: true,
      },
      {
        name: 'NSec',
        description: 'Modern .NET crypto using libsodium — NaCl-based',
        pqcSupport: false,
      },
      {
        name: 'CNG interop',
        description: `Direct access to Windows CNG via P/Invoke or CngKey. ${describeRuntimeSupport('windows-cng')}`,
        pqcSupport: runtimeHasNativePqc('windows-cng'),
      },
    ],
    pqcBindings: [
      '.NET 10 System.Security.Cryptography (MLKem, MLDsa; SlhDsa [Experimental])',
      'Bouncy Castle C# (pure managed alternative; works on older .NET and any OS)',
      'CNG via P/Invoke (ML-KEM, ML-DSA on Windows 11 24H2+ / Server 2025)',
    ],
    notableDeployments: [
      'ASP.NET Core web applications (Kestrel TLS)',
      'Azure services and SDKs',
      'Windows certificate management (certutil)',
      'NuGet package signing',
    ],
    pros: [
      'On Windows, CNG key storage providers decide where keys live: the default Microsoft software provider isolates keys in a separate process, hardware storage needs a hardware-backed provider, and export is set per key',
      'CryptographicOperations.ZeroMemory clears the buffer you pass it and is designed not to be optimised away; copies elsewhere are not cleared',
      'Cross-platform via .NET 6+ (Windows, Linux, macOS)',
      '.NET 10 adds MLKem, MLDsa and SlhDsa; Bouncy Castle C# remains an alternative',
      'Strong typing with nullable reference types',
      'NativeAOT for high-performance crypto services',
    ],
    cons: [
      'Built-in PQC needs .NET 10 plus OpenSSL 3.5+ (Linux) or a PQC-capable Windows build; SlhDsa is still [Experimental] (SYSLIB5006)',
      'Cross-platform crypto behavior differs (CNG on Windows vs OpenSSL on Linux)',
      'Smaller open-source crypto ecosystem than Java',
      'GC pause during key operations (mitigated by Span<T>)',
      "FIPS status depends on the operating system cryptographic libraries being validated (Microsoft's cross-platform cryptography page explains the dependency)",
    ],
    cryptoDevContext:
      'System.Security.Cryptography uses the platform backend (CNG on Windows, OpenSSL on Linux), and in .NET 10 it gains MLKem and MLDsa plus an [Experimental] SlhDsa — available only where that backend has PQC (OpenSSL 3.5+ or a PQC-capable Windows CNG), so check IsSupported. Bouncy Castle C# is the alternative when you need older .NET or an OS backend without PQC. Span<T> and CryptographicOperations.ZeroMemory help with short-lived key buffers, but key lifetime still needs deliberate handling.',
    radar: {
      memorySafety: 7,
      cryptoEcosystem: 7,
      ffiCapability: 7,
      buildTooling: 9,
      compileTimeGuarantees: 6,
      auditCertHistory: 7,
    },
    compiledOrInterpreted: 'jit',
    yearIntroduced: 2002,
  },
]

export const LANGUAGE_RADAR_AXES = [
  { key: 'memorySafety' as const, label: 'Memory Safety' },
  { key: 'cryptoEcosystem' as const, label: 'Crypto Ecosystem' },
  { key: 'ffiCapability' as const, label: 'FFI / C Interop' },
  { key: 'buildTooling' as const, label: 'Build Tooling' },
  { key: 'compileTimeGuarantees' as const, label: 'Compile-time Checks' },
  { key: 'auditCertHistory' as const, label: 'Audit/FIPS History' },
]

export const LANGUAGE_FILTER_OPTIONS = [
  { id: 'All', label: 'All Languages' },
  { id: 'compiled', label: 'Compiled' },
  { id: 'jit', label: 'JIT (JVM/CLR)' },
  { id: 'interpreted', label: 'Interpreted' },
]
