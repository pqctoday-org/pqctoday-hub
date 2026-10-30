# Software Supply Chain PQC — In Simple Terms

## What This Is About

When software or a firmware update reaches a device, a digital signature is one of the main ways the receiver can check that what arrived is what was sent. This module reads the documents that govern those signatures, one link at a time, and asks a precise question of each: what does it say about signatures that a large quantum computer could not break, and where is it silent?

## Why It Matters

The documents differ. Some specify post-quantum and hash-based signatures for common formats such as CMS, X.509 and COSE; some are still drafts; one registry marks the post-quantum entries experimental; and two documents that govern signing, the CA/Browser Forum code signing requirements v3.11 and the UEFI Specification Release 2.11, contain no post-quantum term in the editions read here.

## The Key Takeaway

A document that does not mention quantum computers is a fact about that document, not about anyone's plans. Reading each link precisely — which document, which edition, what it says — is more useful than a general statement that the supply chain is vulnerable.

## What's Happening

Update frameworks such as TUF and Uptane spread trust across several roles and keys, and require a threshold of signatures for a role to be trusted. SLSA and in-toto describe provenance and attestations but name no signature algorithm in the pages read here. For a verifier that has already shipped, the documents describe carrying two signatures during a change, combining algorithms, and, for unchangeable boot code, recommending hash-based signatures.
