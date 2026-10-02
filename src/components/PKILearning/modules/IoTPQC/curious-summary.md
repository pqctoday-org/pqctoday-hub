# IoT & OT PQC — In Simple Terms

## What This Is About

Internet of Things (IoT) and Operational Technology (OT) devices power SCADA infrastructure with 15–30 year asset lifespans, but face extreme constraints in processing, memory, and bandwidth.

## Why It Matters

Standard PQC algorithms are massive. For example, ML-KEM-768 requires roughly 6 KB of RAM just to execute a single key exchange. This completely exceeds the total memory of many ultra-constrained Class 0/1 sensor modules operating in the field today.

## The Key Takeaway

Because IoT cannot handle thousands of bytes of PQC certificates, lightweight workarounds are mandatory. Networks often rely on "Gateway-Mediated" PQC, where tiny field devices use classic crypto to connect to a powerful gateway, which then handles the heavy PQC encryption up to the cloud.

## What's Happening

To bring PQC directly to the edge, hardware vendors (like Infineon and Thales) are rapidly upgrading internal Hardware Secure Elements (like TPMs) to physically accelerate ML-KEM operations, allowing tiny devices to safely run massive algorithms.
