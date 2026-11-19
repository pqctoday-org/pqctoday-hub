# Software Bill of Materials — For the Curious

## What This Is About

Imagine buying a pre-built car with a parts list that says which parts the maker recorded and where they came from. An SBOM is a machine-readable version for software: components within the inventory's stated scope, their versions, and how they relate. The list can miss dependencies if its generation or maintenance is incomplete.

## Why It Matters

When a package has a reported security flaw, a current SBOM can help teams search where it may be present. It does not prove that vulnerable code is reachable or that the inventory is complete. Requirements depend on the applicable contract or law: US agencies may require SBOMs in solicitations, and the EU Cyber Resilience Act sets SBOM duties for manufacturers of in-scope products.

## The Key Takeaway

An SBOM lists software components. A VEX statement records a product's status for a vulnerability and supporting rationale; neither one alone proves exploitability. A Cryptography Bill of Materials (CBOM) is another useful input for finding cryptographic assets, alongside scanners, certificate and key inventories, runtime observation, and manual investigation. It is not a complete inventory by itself or a mandatory output built only from an SBOM.
