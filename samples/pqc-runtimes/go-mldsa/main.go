// SPDX-License-Identifier: AGPL-3.0-only

// ML-DSA-65 sign / verify with the Go standard library (crypto/mldsa, Go 1.27+).
package main

import (
	"crypto/mldsa"
	"fmt"
	"os"
)

func main() {
	sk, err := mldsa.GenerateKey(mldsa.MLDSA65())
	if err != nil {
		fail("keygen: %v", err)
	}
	pk := sk.PublicKey()
	opts := &mldsa.Options{} // empty context string

	msg := []byte("post-quantum hello")
	// The io.Reader argument is ignored: ML-DSA draws its own randomness.
	sig, err := sk.Sign(nil, msg, opts)
	if err != nil {
		fail("sign: %v", err)
	}
	if err := mldsa.Verify(pk, msg, sig, opts); err != nil {
		fail("verify: %v", err)
	}

	// A modified message must be rejected.
	tampered := append([]byte{}, msg...)
	tampered[0] ^= 0x01
	if mldsa.Verify(pk, tampered, sig, opts) == nil {
		fail("tampered message verified")
	}

	fmt.Println("SIZE public_key", len(pk.Bytes()))
	fmt.Println("SIZE signature", len(sig))
	fmt.Println("OK go-mldsa")
}

func fail(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "FAIL go-mldsa: "+format+"\n", args...)
	os.Exit(1)
}
