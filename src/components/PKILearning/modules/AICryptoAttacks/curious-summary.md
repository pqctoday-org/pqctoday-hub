# AI as an Attacker of Cryptography — In Simple Terms

## What This Is About

As artificial intelligence tools become part of software engineering and security testing, organisations ask a straightforward question: can AI break our encryption or steal our keys? This module looks at the actual published evidence across five layers—keys stored in software, bugs in cryptographic libraries, physical side-channel leaks, key-management policies, and the underlying mathematics—and labels every finding as demonstrated, reported, or still hypothesised.

## Why It Matters

Headlines often blur together very different results. In published research through November 2026, AI tools have helped discover real software bugs in cryptographic libraries (such as wolfSSL CVE-2026-5194 and OpenSSL CVE-2026-45445) and weakened an unstandardised candidate signature scheme called HAWK (which its authors promptly withdrew) as well as a reduced 7-round version of AES-128 that requires an impractical 2^105 chosen plaintexts. Meanwhile, AI has NOT broken standardised FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), or full-round AES.

## The Key Takeaway

The immediate practical risk from AI is not a sudden collapse of post-quantum or symmetric mathematics—it is faster discovery of software bugs, insecure code written with AI assistants, and stolen developer or cloud credentials. Nothing in the reviewed evidence justifies delaying or altering standards-based post-quantum migration deadlines (NIST IR 8547 and NSA CNSA 2.0).

## What's Happening

Defenders protect cryptographic systems against AI-assisted attackers with disciplined engineering: pre-commit secret push protection and short-lived workload identity, fast patching of cryptographic libraries (especially new PQC-enabled builds), human-in-the-loop review around AI coding tools, immutable non-exportable HSM key policies, and attack-based side-channel evaluation for embedded targets.
