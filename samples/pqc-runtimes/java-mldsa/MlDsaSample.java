// SPDX-License-Identifier: GPL-3.0-only
// ML-DSA-65 sign / verify with the JDK (JEP 497, JDK 24+). Run: java MlDsaSample.java

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.util.Arrays;

public class MlDsaSample {
    static final String SAMPLE = "java-mldsa";

    public static void main(String[] args) throws Exception {
        KeyPair kp = KeyPairGenerator.getInstance("ML-DSA-65").generateKeyPair();
        byte[] message = "post-quantum hello".getBytes(StandardCharsets.UTF_8);

        Signature signer = Signature.getInstance("ML-DSA");
        signer.initSign(kp.getPrivate());
        signer.update(message);
        byte[] signature = signer.sign();

        if (!verify(kp, message, signature)) {
            System.err.println("FAIL " + SAMPLE + ": valid signature rejected");
            System.exit(1);
        }

        // A modified message must be rejected.
        byte[] tampered = message.clone();
        tampered[0] ^= 0x01;
        if (verify(kp, tampered, signature)) {
            System.err.println("FAIL " + SAMPLE + ": tampered message verified");
            System.exit(1);
        }

        System.out.println("SIZE public_key " + rawKey(kp.getPublic().getEncoded()).length);
        System.out.println("SIZE signature " + signature.length);
        System.out.println("OK " + SAMPLE);
    }

    static boolean verify(KeyPair kp, byte[] message, byte[] signature) throws Exception {
        Signature verifier = Signature.getInstance("ML-DSA");
        verifier.initVerify(kp.getPublic());
        verifier.update(message);
        return verifier.verify(signature);
    }

    // getEncoded() returns X.509 SubjectPublicKeyInfo:
    //   SEQUENCE { AlgorithmIdentifier, BIT STRING { 0x00 unused-bits, raw key } }
    // Walk the DER to return just the raw FIPS 204 public key.
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
