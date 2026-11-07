# Software Bill of Materials — In Simple Terms

## What This Is About

A Software Bill of Materials (SBOM) is a machine-readable ingredients list for software: every package and library a product depends on, its version, its supplier, and how the pieces connect. It's the software equivalent of the ingredients label on a food package — except most organizations don't have one yet.

## Why It Matters

When a vulnerability is found in a widely-used library, the first question is always "do we use that, and where?" Without an SBOM, answering that takes days of digging. With one, it's a search. That's also why an SBOM is a required input to a Cryptography Bill of Materials (CBOM): you can't build a complete list of the cryptography inside your software without first knowing what software you're running.

## The Key Takeaway

An SBOM only becomes useful when it lists the right fields consistently (supplier, name, version, and how components depend on each other), is paired with a VEX statement so a listed vulnerability doesn't trigger a false alarm, and is treated as an input other disciplines build on — not a one-off compliance checkbox.

## What's Happening

CISA's 2026 Minimum Elements for a Software Bill of Materials (version 2.1, published 29 July 2026 with NSA, FBI and international partner agencies) updates and replaces the 2021 NTIA baseline. It is not a strict superset. Ten elements are new: SBOM Author Signature, SBOM Data Format Name, SBOM Data Format Version, SBOM Generation Context, SBOM Tool Name, SBOM Tool Version, SBOM Version, Component Hash Value, Component Hash Algorithm and Component License. Several 2021 elements are renamed or redefined: Supplier Name became Component Producer, Author of SBOM Data became SBOM Author, Other Unique Identifiers became Component Identifiers, Version of the Component became Component Version, Depth became Coverage, Accommodation of Mistakes became Accommodation of Updates to SBOM Data, Known Unknowns became Explicitly Identifying Unknown Information, and Automation Support became Machine-Processable Data (with SWID tags dropped from the list of data formats). One element is removed as a stand-alone item: Access Control, whose considerations move into Distribution and Delivery. Timestamp now points to RFC 9557, and Component Name may have multiple entries.
