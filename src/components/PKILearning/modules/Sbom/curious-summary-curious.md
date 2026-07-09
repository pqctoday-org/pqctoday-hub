# Software Bill of Materials — For the Curious

## What This Is About

Imagine buying a pre-built car and having no idea which factory made the brakes, the airbags, or the engine control unit — you'd have no way to know if any of them were just recalled. An SBOM is that missing parts list for software: every component a product is built from, where it came from, and what version it is.

## Why It Matters

Almost no software is written entirely from scratch anymore — it's assembled from hundreds of open-source and third-party packages. When one of those packages turns out to have a security flaw, an SBOM is what lets an organization answer "are we affected?" in minutes instead of weeks of manual auditing. It's also the reason regulators (the US government via Executive Order 14028, the EU via the Cyber Resilience Act) now require one for many products.

## The Key Takeaway

An SBOM tells you what's inside the box; a companion document called VEX tells you whether what's inside is actually dangerous in this particular product, since not every known flaw in a library is reachable in every product that uses it. And an SBOM is only the first layer — a separate, cryptography-specific inventory (a CBOM) has to be built on top of it before an organization can find and replace vulnerable encryption ahead of quantum computers.
