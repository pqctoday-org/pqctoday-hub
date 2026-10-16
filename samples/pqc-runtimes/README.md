<!-- SPDX-License-Identifier: GPL-3.0-only -->

# Post-quantum runtime samples

One small program per language and algorithm, each using only the language's
built-in or standard crypto library. Every program does a full round trip
(ML-KEM-768 encapsulate / decapsulate, or ML-DSA-65 sign / verify plus a
tampered-message check), prints `SIZE <name> <bytes>` lines and ends with
`OK <sampleId>`. Any mismatch exits non-zero.

These samples back the site's "which language supports PQC" table: a language
is listed as supported only if its sample here compiles and runs. The
`PQC runtime samples` GitHub workflow runs them weekly and on changes to this
folder. It is a test job only and is never part of the site build.

## Samples and minimum versions

| Sample id      | Library                              | Minimum                                               |
| -------------- | ------------------------------------ | ----------------------------------------------------- |
| `go-mlkem`     | `crypto/mlkem`                       | Go 1.24                                               |
| `go-mldsa`     | `crypto/mldsa`                       | Go 1.27                                               |
| `python-mlkem` | `cryptography` (`asymmetric.mlkem`)  | cryptography 48 with OpenSSL 3.5+ (or 47 with AWS-LC) |
| `python-mldsa` | `cryptography` (`asymmetric.mldsa`)  | cryptography 48 with OpenSSL 3.5+ (or 47 with AWS-LC) |
| `dotnet-mlkem` | `System.Security.Cryptography.MLKem` | .NET 10 + OpenSSL 3.5+ or Windows CNG ML-KEM          |
| `dotnet-mldsa` | `System.Security.Cryptography.MLDsa` | .NET 10 + OpenSSL 3.5+ or Windows CNG ML-DSA          |
| `java-mlkem`   | `javax.crypto.KEM` (`ML-KEM-768`)    | JDK 24                                                |
| `java-mldsa`   | `java.security.Signature` (`ML-DSA`) | JDK 24                                                |

The PyPI `cryptography` wheels bundle their own OpenSSL, so `pip install
"cryptography>=48"` is enough. The .NET samples print
`SKIP <id> platform-unsupported` and exit 0 when the operating system's crypto
provider lacks the algorithm (for example Ubuntu 24.04, which ships OpenSSL 3.0).

Expected sizes and versions are in [`expected.json`](expected.json): ML-KEM-768
encapsulation key 1184, ciphertext 1088, shared secret 32 bytes (FIPS 203);
ML-DSA-65 public key 1952, signature 3309 bytes (FIPS 204).

## Running

```bash
./run-all.sh                 # every sample (needs jq and all four toolchains)
./run-all.sh go-mlkem        # one sample
./run-all.sh --list          # sample ids
```

Or run a sample directly:

```bash
(cd go-mlkem && go run .)
python3 python-mldsa/main.py
dotnet run --project dotnet-mlkem/dotnet-mlkem.csproj
java java-mldsa/MlDsaSample.java
```
