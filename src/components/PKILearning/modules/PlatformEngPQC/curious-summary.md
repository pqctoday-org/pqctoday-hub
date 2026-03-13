# Platform Engineering & PQC — In Simple Terms

## What This Is About

When a developer writes code for an app, that code does not magically appear on your phone. It goes through a long assembly line — a software delivery pipeline — that builds, tests, packages, signs, and deploys the code. Think of it like a car factory: raw materials come in one end, go through dozens of stations where they are shaped, inspected, and assembled, and a finished car rolls out the other end.

Platform engineering is the discipline of building and maintaining this factory. At almost every station along the assembly line, encryption is used: verifying that code has not been tampered with, signing the finished product so your device trusts it, encrypting secrets like passwords and API keys, and scanning for vulnerabilities. Each of these encryption steps currently relies on math that quantum computers could break.

## Why It Matters

If an attacker can break into the software delivery pipeline, they do not need to attack individual users — they can compromise the software at the source, and every user who installs it becomes a victim. This is called a supply chain attack, and it is one of the most dangerous types of cyberattack because it exploits trust. You install an update because you trust the company that made it, not realizing the update was tampered with during the delivery process.

Quantum computers would make several parts of the pipeline vulnerable. The digital signatures that prove code is authentic could be forged. The encrypted secrets used during the build process could be exposed. The secure connections between pipeline components could be intercepted. A single weak link in this chain could compromise software used by millions of people.

## The Key Takeaway

The software delivery pipeline is where trust in software is built, piece by piece, from developer to user. Every encryption step in that pipeline needs to be upgraded to quantum-safe methods, because a compromise at any point affects everyone who uses the finished product.

## What's Happening

Organizations are beginning to audit their software delivery pipelines to identify which encryption steps need upgrading. Container signing tools like Sigstore and Notation are exploring quantum-safe signature support. Infrastructure-as-code tools are being evaluated for quantum-safe default settings. Policy enforcement systems that check whether software meets security standards are being updated to recognize quantum-safe algorithms. The software supply chain security community, already energized by recent high-profile attacks, is starting to treat the quantum threat as the next major challenge to address.
