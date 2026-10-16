// SPDX-License-Identifier: AGPL-3.0-only
// ML-KEM-768 round trip with the JDK (JEP 496, JDK 24+). Run: java MlKemSample.java

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.util.Arrays;
import javax.crypto.KEM;
import javax.crypto.SecretKey;

public class MlKemSample {
    static final String SAMPLE = "java-mlkem";

    public static void main(String[] args) throws Exception {
        // Receiver: generate a key pair and publish the public (encapsulation) key.
        KeyPair receiver = KeyPairGenerator.getInstance("ML-KEM-768").generateKeyPair();
        KEM kem = KEM.getInstance("ML-KEM");

        // Sender: derive a shared secret and a ciphertext from the public key.
        KEM.Encapsulated sent = kem.newEncapsulator(receiver.getPublic()).encapsulate();
        byte[] ciphertext = sent.encapsulation();
        byte[] senderSecret = sent.key().getEncoded();

        // Receiver: recover the same shared secret from the ciphertext.
        SecretKey recovered = kem.newDecapsulator(receiver.getPrivate()).decapsulate(ciphertext);

        if (!MessageDigest.isEqual(senderSecret, recovered.getEncoded())) {
            System.err.println("FAIL " + SAMPLE + ": shared secrets differ");
            System.exit(1);
        }

        System.out.println("SIZE encapsulation_key " + rawKey(receiver.getPublic().getEncoded()).length);
        System.out.println("SIZE ciphertext " + ciphertext.length);
        System.out.println("SIZE shared_secret " + senderSecret.length);
        System.out.println("OK " + SAMPLE);
    }

    // getEncoded() returns X.509 SubjectPublicKeyInfo:
    //   SEQUENCE { AlgorithmIdentifier, BIT STRING { 0x00 unused-bits, raw key } }
    // Walk the DER to return just the raw FIPS 203 encapsulation key.
    static byte[] rawKey(byte[] spki) {
        int[] pos = {0};
        readHeader(spki, pos); // outer SEQUENCE
        int algLen = readHeader(spki, pos); // AlgorithmIdentifier
        pos[0] += algLen;
        int bitsLen = readHeader(spki, pos); // BIT STRING
        return Arrays.copyOfRange(spki, pos[0] + 1, pos[0] + bitsLen);
    }

    // Reads a DER tag + length at pos, advances past them, returns the content length.
    static int readHeader(byte[] der, int[] pos) {
        pos[0]++; // tag
        int len = der[pos[0]++] & 0xff;
        if (len < 0x80) return len;
        int n = len & 0x7f;
        len = 0;
        for (int i = 0; i < n; i++) len = (len << 8) | (der[pos[0]++] & 0xff);
        return len;
    }
}
