# Automotive PQC — In Simple Terms

## What This Is About

Modern vehicles are essentially massive, high-speed computers on wheels. They have a 15+ year lifespan on the road. The digital cryptography and certificates embedded in the hardware today to secure firmware updates could outlive their security if a quantum computer arrives during the car's life.

## Why It Matters

An attacker equipped with a quantum computer could mathematically forge over-the-air (OTA) update signatures. This would allow them to bypass security checks and push highly malicious, weaponized firmware directly into the engine, brakes, and steering modules of many vehicles simultaneously.

## The Key Takeaway

Automotive manufacturers should plan for post-quantum signatures (like LMS/HSS or ML-DSA) when designing secure boot, because the root key often cannot be changed later.

## What's Happening

Automotive standard bodies are racing to update the secure-by-design hardware specifications to handle the significantly larger file sizes of Post-Quantum signatures, ensuring that the heavy math can run smoothly on resource-constrained microcontrollers.
