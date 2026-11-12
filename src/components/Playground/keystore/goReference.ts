// SPDX-License-Identifier: AGPL-3.0-only
/** Reproducible local sample setup, carried with copied Go source. */
export const GO_REFERENCE_SETUP = `// Target: liboqs-go v0.16.0 + native liboqs 0.16.0; Go >=1.21, C compiler,
// CMake, Make and pkg-config required. POSIX shell setup in a fresh sample directory:
// git clone --depth 1 --branch 0.16.0 https://github.com/open-quantum-safe/liboqs.git
// test "$(git -C liboqs rev-parse HEAD)" = 5a1a854b0dc9f2141bdc771c555ee60c37950183
// git clone --depth 1 --branch v0.16.0 https://github.com/open-quantum-safe/liboqs-go.git
// test "$(git -C liboqs-go rev-parse HEAD)" = d457f4e3d3f65fc220a98aed85725b11cd05858e
// cmake -S liboqs -B oqs-build -G "Unix Makefiles" -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON -DOQS_BUILD_ONLY_LIB=ON -DOQS_USE_OPENSSL=OFF -DCMAKE_INSTALL_PREFIX="$PWD/oqs-prefix"
// cmake --build oqs-build --parallel 2
// cmake --install oqs-build
// mkdir -p pkgconfig .cache/go-tmp
// sed "s|/usr/local|$PWD/oqs-prefix|g" liboqs-go/.config/liboqs-go.pc > pkgconfig/liboqs-go.pc
// export PKG_CONFIG_PATH="$PWD/pkgconfig"
// export CGO_LDFLAGS="-Wl,-rpath,$PWD/oqs-prefix/lib"
// export GOCACHE="$PWD/.cache/go-build" GOMODCACHE="$PWD/.cache/go-mod" GOTMPDIR="$PWD/.cache/go-tmp"
// go mod init example.com/pqc-sample
// go get github.com/open-quantum-safe/liboqs-go@v0.16.0
// Save this source as main.go, then: go run .
// This is a functional sample, not a known-answer or conformance test.
// Init checks the exact selected name. Availability/names depend on this build;
// no replacement is made. Experimental profiles (including Frodo/FN-DSA) are
// not asserted interoperable with similarly named Hub engines or older releases.`

export function getGoReference(algorithm: string, isKEM: boolean): string {
  const selected = JSON.stringify(algorithm)
  const imports = isKEM ? '    "bytes"\n' : ''
  const body = isKEM
    ? `    var kem oqs.KeyEncapsulation
    if err := kem.Init(${selected}, nil); err != nil {
        return fmt.Errorf("initialize selected KEM: %w", err)
    }
    defer kem.Clean()

    pubKey, err := kem.GenerateKeyPair()
    if err != nil { return fmt.Errorf("generate key pair: %w", err) }
    ciphertext, sharedSecretEnc, err := kem.EncapSecret(pubKey)
    if err != nil { return fmt.Errorf("encapsulate: %w", err) }
    sharedSecretDec, err := kem.DecapSecret(ciphertext)
    if err != nil { return fmt.Errorf("decapsulate: %w", err) }
    if !bytes.Equal(sharedSecretEnc, sharedSecretDec) {
        return fmt.Errorf("shared secrets do not match")
    }
    fmt.Println("Selected KEM functional round-trip passed")`
    : `    var signer oqs.Signature
    if err := signer.Init(${selected}, nil); err != nil {
        return fmt.Errorf("initialize selected signer: %w", err)
    }
    defer signer.Clean()

    pubKey, err := signer.GenerateKeyPair()
    if err != nil { return fmt.Errorf("generate key pair: %w", err) }
    msg := []byte("Hello, post-quantum world!")
    signature, err := signer.Sign(msg)
    if err != nil { return fmt.Errorf("sign: %w", err) }

    var verifier oqs.Signature
    if err := verifier.Init(${selected}, nil); err != nil {
        return fmt.Errorf("initialize selected verifier: %w", err)
    }
    defer verifier.Clean()
    valid, err := verifier.Verify(msg, signature, pubKey)
    if err != nil { return fmt.Errorf("verify: %w", err) }
    if !valid { return fmt.Errorf("signature verification returned false") }
    fmt.Println("Selected signature functional round-trip passed")`
  return `// liboqs-go v0.16.0 — ${algorithm}
${GO_REFERENCE_SETUP}
package main

import (
${imports}    "fmt"
    "os"
    "github.com/open-quantum-safe/liboqs-go/oqs"
)

// Return through run so initialized objects are cleaned before a failing exit.
func run() error {
${body}
    return nil
}

func main() {
    if err := run(); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}`
}
