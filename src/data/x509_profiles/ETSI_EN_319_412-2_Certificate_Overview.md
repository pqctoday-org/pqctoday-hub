# ETSI EN 319 412-2: Natural Person Certificate Example

The two financial certificate profile aliases use the same fictional **Jane Doe / QCP-n-qscd** example. The alias filenames remain stable; they are not claims that an older standards edition is current.

Current reference editions checked for this example:

- [EN 319 412-2 V2.5.1 (August 2026)](https://www.etsi.org/deliver/etsi_en/319400_319499/31941202/02.05.01_60/en_31941202v020501p.pdf): natural-person certificate attributes.
- [EN 319 412-5 V2.6.1 (May 2026)](https://www.etsi.org/deliver/etsi_en/319400_319499/31941205/02.06.01_60/en_31941205v020601p.pdf): QC statement syntax and non-criticality.
- [EN 319 411-2 V2.6.1 (June 2025), section 5.3](https://www.etsi.org/deliver/etsi_en/319400_319499/31941102/02.06.01_60/en_31941102v020601p.pdf): policy identifiers.
- [RFC 3739, section 3.2.6](https://www.rfc-editor.org/rfc/rfc3739.html#section-3.2.6): the outer QCStatements extension.

## Worked Person / Device Example

| Encoded element    | Selected value                       | Meaning of the sample field                                                                     |
| ------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Subject            | Existing Jane Doe distinguished name | Fictional person; the organization fields are retained sample context.                          |
| Certificate policy | `0.4.0.194112.1.2`                   | QCP-n-qscd: natural person, with the private key related to the certified public key in a QSCD. |
| Outer extension    | `1.3.6.1.5.5.7.1.3`                  | QCStatements container, marked **non-critical**.                                                |
| QcCompliance       | `0.4.0.1862.1.1`                     | Statement identifier with no statement-information value.                                       |
| QcSSCD             | `0.4.0.1862.1.4`                     | Device-related statement identifier with no statement-information value.                        |
| QcType             | `0.4.0.1862.1.6`                     | A sequence containing exactly one type OID, `0.4.0.1862.1.6.1` for electronic signatures.       |

The existing CSR supplies the sample subject and requested extensions. The certificate profile adds the selected policy and QC statements at issuance. The shared serializer emits an explicit 43-byte payload rather than referring to an undefined OpenSSL configuration section:

```ini
qcStatements = DER:30293008060604008e4601013008060604008e4601043013060604008e4601063009060704008e46010601
certificatePolicies = 0.4.0.194112.1.2
```

There is no `critical,` prefix on QCStatements. `QcLimitValue` is optional and is absent from this example: no currency, amount or exponent has been selected.

## What to Inspect

Generate the fictional CSR and leaf using the existing certificate tools, then inspect the issued certificate and decode the extension payload. Check the outer OID, non-critical flag, all three statement identifiers, the one electronic-signature type OID and the separate policy OID. Check the CSR signature and issued certificate chain separately. A truncated payload, trailing bytes, repeated ETSI statement or altered known statement structure must not be treated as the selected example. An unknown statement identifier has no known QC meaning merely because its encoding parses.

These checks establish the sample's encoding and cryptographic verification results. They do not demonstrate that a key was held by a QSCD, that identity checks occurred, that an issuer is a qualified trust service provider, or that the whole certificate meets a legal qualification regime. The retained subject example is not a complete identity-validation or standards-conformance test.

For your production tools, evaluate whether they encode and display the selected policy and QC statement structures without silently substituting identifiers, preserve unknown statements without assigning them a familiar meaning, reject malformed inputs, and expose the actual device, issuer, identity and policy evidence needed for the intended use. Use the applicable standards and trust framework to assess that evidence; the presence of these sample fields provides no substitute.
