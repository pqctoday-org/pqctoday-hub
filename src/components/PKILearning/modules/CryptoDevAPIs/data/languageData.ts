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
      'Maximum performance — zero-cost abstractions, SIMD intrinsics',
      'Direct access to all C crypto libraries without FFI overhead',
      'Deterministic memory management via RAII',
      'Mature toolchain (compilers, debuggers, sanitizers)',
      'Template metaprogramming for compile-time algorithm selection',
    ],
    cons: [
      'Memory safety is developer responsibility — high bug surface',
      'Side-channel leaks from compiler optimizations (dead-code elimination)',
      'Complex build systems (CMake, Bazel) with dependency management pain',
      'No built-in package manager (vcpkg/Conan are bolt-ons)',
      'Long compile times for template-heavy crypto code',
    ],
    cryptoDevContext:
      'C++ is the language of choice when you need both performance and access to the full ecosystem of C crypto libraries. Botan 3.x provides a modern C++ PQC experience without C API friction. However, memory safety issues make auditing harder and side-channel resistance requires constant vigilance.',
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
      'Compile-time ownership and borrowing system eliminates use-after-free, double-free, and data races. unsafe blocks required for raw pointer operations (clearly marked for audit).',
    ffi: 'excellent',
    ffiDescription:
      'Native C ABI via extern "C". Excellent bindgen for auto-generating C/C++ bindings. Can compile to C-callable shared libraries. WASM target support.',
    cryptoLibraries: [
      {
        name: 'RustCrypto',
        description: 'Community crates: aes, sha2, rsa, ecdsa, ed25519-dalek — pure Rust',
        pqcSupport: false,
      },
      {
        name: 'ring',
        description: 'BoringSSL-backed, high-performance, limited algorithm set',
        pqcSupport: false,
      },
      {
        name: 'pqcrypto',
        description: 'Rust bindings to PQClean — compile-time PQC algorithm selection',
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
      'pqcrypto (PQClean wrappers)',
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
      'Memory safety guaranteed at compile time — no buffer overflows',
      'Type system prevents key material misuse (newtype patterns)',
      'Excellent side-channel resistance: constant-time crate (subtle)',
      'Cargo package manager — reproducible builds, security audits (cargo audit)',
      'Zero-cost abstractions — performance comparable to C',
      'WASM compilation for browser crypto',
    ],
    cons: [
      'Steep learning curve — ownership/lifetime annotations',
      'Smaller crypto ecosystem than C/Java (growing rapidly)',
      'FIPS certification path immature (aws-lc-rs is first Rust-wrapper FIPS effort)',
      'unsafe blocks in crypto code reduce safety guarantees',
      'Compile times can be long for complex crypto crates',
    ],
    cryptoDevContext:
      'Rust is the best choice for new crypto library development. The ownership system catches memory bugs that plague C code, and the type system can encode invariants like "this key is only usable for signing." The pqcrypto crate provides immediate PQC access. The main gap is FIPS certification — aws-lc-rs is closing this.',
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
      'Seamless C interop — can @cImport any C header directly. Zig code compiles to C ABI. Can be used as a C/C++ cross-compiler. No binding generators needed.',
    cryptoLibraries: [
      {
        name: 'std.crypto',
        description: 'Built-in crypto: AES, ChaCha20, SHA-2/3, Ed25519, X25519, HKDF',
        pqcSupport: false,
      },
      {
        name: 'C interop',
        description: 'Direct @cImport of OpenSSL, liboqs, or any C crypto library',
        pqcSupport: true,
      },
    ],
    pqcBindings: ['liboqs via @cImport', 'OpenSSL 3.5+ via @cImport'],
    notableDeployments: [
      'Bun JavaScript runtime uses Zig + BoringSSL for TLS',
      'TigerBeetle financial database uses Zig for deterministic computation',
    ],
    pros: [
      'comptime enables compile-time constant-time verification',
      'Zero-overhead C interop — no FFI bridging cost',
      'Explicit allocator model prevents hidden allocations in crypto code',
      'Built-in std.crypto covers common operations',
      'Cross-compilation to any target from one machine',
      'No hidden control flow — easier to audit for side channels',
    ],
    cons: [
      'Small ecosystem — limited crypto-specific libraries',
      'Language still pre-1.0 — API stability not guaranteed',
      'No PQC libraries native to Zig — must use C interop',
      'Tiny community — few crypto experts writing Zig',
      'No FIPS-certified Zig crypto library exists',
      'Limited IDE/tooling compared to Rust/C++',
    ],
    cryptoDevContext:
      'Zig is compelling for new crypto implementations due to comptime evaluation (verify constant-time properties at compile time) and zero-cost C interop. However, the ecosystem is nascent — you will write C interop wrappers. Best suited for teams with existing C crypto expertise who want better tooling.',
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
      'Garbage collected — no manual memory management. No buffer overflows or use-after-free. However, sensitive key material may linger in memory until GC collects it (use char[] and explicit zeroing).',
    ffi: 'moderate',
    ffiDescription:
      'JNI (Java Native Interface) for C/C++ calls — significant boilerplate and performance overhead. Panama API (JDK 22+) improves FFI ergonomics but is still incubating.',
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
      'Bouncy Castle provides best-in-class PQC for managed languages',
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
      'Java is the dominant language for enterprise crypto applications. The JCA provider model is the gold standard for algorithm agility. JDK 24+ ships ML-KEM and ML-DSA in the default providers (JDK 25 LTS has them, and Oracle backported them to Oracle JDK 21.0.13 and 17.0.21 in October 2026). Bouncy Castle provides the most complete PQC implementation in any managed language, including SLH-DSA. The main challenge is memory safety for key material — GC cannot guarantee timely zeroing.',
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
      'Rapid prototyping — fastest path from idea to working crypto code',
      'Excellent for crypto research and experimentation',
      'Large data science ecosystem for crypto analysis',
      'cryptography 48+ wheels include ML-KEM and ML-DSA; liboqs-python covers the rest for experimentation',
      'Widely used for PKI tooling and certificate management',
    ],
    cons: [
      'Python itself is too slow for crypto — all real crypto calls native C code',
      'Immutable bytes/strings prevent secure key material zeroing',
      'GIL limits true parallel crypto operations',
      'No compile-time type checking (without mypy)',
      'Not suitable for production crypto libraries — only as a wrapper/consumer',
    ],
    cryptoDevContext:
      'Python excels for crypto prototyping, PKI tooling, and research. It is not the language to write a crypto library in — all Python crypto libraries are thin wrappers around C code (OpenSSL, libsodium, liboqs). Use it for scripting, testing, and proof-of-concept, then implement in C/Rust for production.',
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
      'Garbage collected with no manual memory management. Bounds-checked slices prevent buffer overflows. crypto/subtle package provides constant-time comparison. Key material zeroing is manual but possible via slice clearing.',
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
      'Excellent standard library crypto — well-audited, constant-time',
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
      "Go is excellent for crypto infrastructure tools (PKI, Vault, TLS services) where the standard library covers most needs — including PQC: crypto/mlkem since Go 1.24 (with X25519MLKEM768 on by default in crypto/tls) and crypto/mldsa since Go 1.27. Cloudflare's circl fills the remaining gaps such as SLH-DSA in pure Go. Avoid cgo for crypto — it negates Go's cross-compilation advantage.",
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
      'P/Invoke for C library calls — lower overhead than Java JNI. Source generators can auto-generate marshalling code. COM interop for Windows APIs. NativeAOT compilation eliminates runtime overhead.',
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
      'CNG integration gives hardware key isolation on Windows',
      'Span<T> and stackalloc enable secure memory management for crypto',
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
      'FIPS story depends on platform (Windows CNG validated, Linux OpenSSL validated)',
    ],
    cryptoDevContext:
      '.NET is the enterprise choice for Windows-centric environments. System.Security.Cryptography auto-selects the best platform backend (CNG/OpenSSL), and in .NET 10 it gains MLKem and MLDsa plus an [Experimental] SlhDsa — available only where that backend has PQC (OpenSSL 3.5+ or a PQC-capable Windows CNG), so check IsSupported. Bouncy Castle C# is the alternative when you need older .NET or an OS backend without PQC. Span<T> makes .NET better than Java for sensitive key material handling.',
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
