// SPDX-License-Identifier: AGPL-3.0-only

// ML-KEM-768 round trip with the Go standard library (crypto/mlkem, Go 1.24+).
package main

import (
	"crypto/mlkem"
	"crypto/subtle"
	"fmt"
	"os"
)

func main() {
	// Receiver: generate a key pair and publish the encapsulation key.
	dk, err := mlkem.GenerateKey768()
	if err != nil {
		fail("keygen: %v", err)
	}
	ek := dk.EncapsulationKey()

	// Sender: derive a shared secret and a ciphertext from the encapsulation key.
	senderSecret, ciphertext := ek.Encapsulate()

	// Receiver: recover the same shared secret from the ciphertext.
	receiverSecret, err := dk.Decapsulate(ciphertext)
	if err != nil {
		fail("decapsulate: %v", err)
	}
	if subtle.ConstantTimeCompare(senderSecret, receiverSecret) != 1 {
		fail("shared secrets differ")
	}

	fmt.Println("SIZE encapsulation_key", len(ek.Bytes()))
	fmt.Println("SIZE ciphertext", len(ciphertext))
	fmt.Println("SIZE shared_secret", len(senderSecret))
	fmt.Println("OK go-mlkem")
}

func fail(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "FAIL go-mlkem: "+format+"\n", args...)
	os.Exit(1)
}
