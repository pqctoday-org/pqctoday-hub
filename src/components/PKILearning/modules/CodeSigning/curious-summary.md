# Code Signing — In Simple Terms

## What This Is About

When you download an app or install a software update, how do you know it actually came from the company that made it and was not secretly modified by an attacker along the way? The answer is code signing — a digital seal that software makers attach to their programs, much like the tamper-proof seal on a medicine bottle. If the seal is intact, you know nobody has interfered with the contents.

Code signing works by using a cryptographic signature — a mathematical stamp that only the real software maker can produce. Your computer checks this stamp every time you install or update software. If the stamp does not match, your computer warns you or refuses to install the program. This system protects everything from phone apps to operating system updates to the software running on medical devices and cars.

## Why It Matters

If someone could forge a code signing signature, they could distribute malicious software that looks perfectly legitimate. Your computer would accept it without complaint. Imagine a fake update to your banking app that secretly steals your passwords — and your phone's security check gives it a green light because the forged signature looks genuine.

This is not a hypothetical worry. Software supply chain attacks — where attackers sneak bad code into legitimate updates — have already caused major incidents. The SolarWinds attack in 2020 affected thousands of organizations, including U.S. government agencies. Quantum computers would make forging signatures dramatically easier, turning code signing from a strong defense into a broken one unless the underlying cryptography is upgraded.

## The Key Takeaway

Code signing is the trust system that lets your devices know which software is safe to run. If quantum computers break the math behind it, attackers could distribute fake software updates that pass every security check. Upgrading code signing to quantum-safe methods is essential to maintaining software trust.

## What's Happening

Major technology companies are already planning the transition. Microsoft, Apple, and Google — who control the largest software distribution platforms — are researching quantum-safe signing methods for their app stores and operating system updates. Open-source projects like Sigstore are exploring quantum-safe options for the software supply chain. NIST's new post-quantum signature standards (ML-DSA and SLH-DSA) are designed to replace the algorithms currently used in code signing. The challenge is that code signatures on old software need to remain verifiable for years, making the transition a long-term effort that needs to start well before quantum computers arrive.
