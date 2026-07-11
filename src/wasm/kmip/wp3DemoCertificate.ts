// SPDX-License-Identifier: GPL-3.0-only
//
// WP-3 showcase fixture — a real, self-signed ECDSA-P256 X.509 certificate,
// used by `Pkcs11CertificateDemo.tsx` to demonstrate KMIP Register's
// certificate-to-engine projection (PKCS#11 v3.2 §4.6). Native CA issuance
// (`Certify`) isn't reachable in wasm (its rcgen backend doesn't cross-compile
// to wasm32), so this stands in for "a certificate the caller already holds
// and wants the engine to manage" — exactly the strongSwan / raw-PKCS#11-client
// pattern Register's projection serves, not a full in-browser CA workflow.
//
// Generated once via:
//   openssl ecparam -genkey -name prime256v1 -noout -out demo.key
//   openssl req -new -x509 -key demo.key -days 3650 \
//     -subj "/CN=pqctoday-cacp-demo.example/O=PQCToday CACP Playground/C=US" \
//     -out demo.crt
//   openssl x509 -in demo.crt -outform der -out demo.der
//
// The private key was discarded after generation — this fixture is public,
// non-secret, self-signed DER only, never used to sign or verify anything
// security-relevant.
export const WP3_DEMO_CERT_DER_HEX =
  '308201ff308201a5a00302010202141582ad86b5b8bda0b52466b2207ff9abbfec2606300a06082a8648ce3d04030230553123302106035504030c1a707163746f6461792d636163702d64656d6f2e6578616d706c653121301f060355040a0c18505143546f646179204341435020506c617967726f756e64310b3009060355040613025553301e170d3236303731313033313430365a170d3336303730383033313430365a30553123302106035504030c1a707163746f6461792d636163702d64656d6f2e6578616d706c653121301f060355040a0c18505143546f646179204341435020506c617967726f756e64310b30090603550406130255533059301306072a8648ce3d020106082a8648ce3d030107034200047dbe2caf87156d2e8313215e177f2ad87631843705941ea4bc9fc12a7affc5e24d32bbefab1834913d7276bb4a2b803702a1599c8c3b9ac6ac66fddc30ae0780a3533051301d0603551d0e04160414dbe18ec8543d63c6e3a4273f58970c23af8ec812301f0603551d23041830168014dbe18ec8543d63c6e3a4273f58970c23af8ec812300f0603551d130101ff040530030101ff300a06082a8648ce3d0403020348003045022100d89247ac0541656252555fdd5f8f9da082e8f217ed62688e2dd723a17d1dacb3022038c68e65853f2d3bd21675c5c602226cca862483d4ed3c9f5c68e774fbdcdae5'

export const WP3_DEMO_CERT_SUBJECT_CN = 'pqctoday-cacp-demo.example'
