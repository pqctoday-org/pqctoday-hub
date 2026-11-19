# Software Bill of Materials — In Simple Terms

## What This Is About

A Software Bill of Materials (SBOM) is a machine-readable inventory of software components within a product's stated scope, with fields such as component name, version, supplier or producer, and dependency relationships. Its coverage depends on how the SBOM is generated, reviewed and maintained; it should not be assumed to list every dependency automatically.

## Why It Matters

When a vulnerability is found in a widely-used library, teams need to determine whether it appears in their products and where. A current, sufficiently complete SBOM can make that search easier, but it does not prove that a vulnerable code path is reachable or that the inventory is complete. An SBOM is one useful input to a Cryptography Bill of Materials (CBOM), alongside crypto-scanner results, certificate and key inventories, runtime observation and manual investigation; it is not a mandatory prerequisite or a complete crypto inventory by itself.

## The Key Takeaway

A useful SBOM records consistent component identifiers, versions, provenance and dependency relationships for its stated scope, and is kept current. VEX adds product-specific status and justification to vulnerability findings; neither an SBOM nor VEX alone proves exploitability or non-exploitability. Treat an SBOM as an operational input that downstream disciplines can combine with other evidence, not as a one-off compliance checkbox.

## What's Happening

CISA's 2026 Minimum Elements for a Software Bill of Materials (version 2.1, published 29 July 2026 with NSA, FBI and international partner agencies) updates and replaces the 2021 NTIA baseline. It is not a strict superset. Ten elements are new: SBOM Author Signature, SBOM Data Format Name, SBOM Data Format Version, SBOM Generation Context, SBOM Tool Name, SBOM Tool Version, SBOM Version, Component Hash Value, Component Hash Algorithm and Component License. Several 2021 elements are renamed or redefined: Supplier Name became Component Producer, Author of SBOM Data became SBOM Author, Other Unique Identifiers became Component Identifiers, Version of the Component became Component Version, Depth became Coverage, Accommodation of Mistakes became Accommodation of Updates to SBOM Data, Known Unknowns became Explicitly Identifying Unknown Information, and Automation Support became Machine-Processable Data (with SWID tags dropped from the list of data formats). One element is removed as a stand-alone item: Access Control, whose considerations move into Distribution and Delivery. Timestamp now points to RFC 9557, and Component Name may have multiple entries.
