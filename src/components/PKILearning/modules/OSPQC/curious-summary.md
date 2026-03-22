# OS Cryptography PQC — In Simple Terms

## What This Is About

Modern operating systems have a deep cryptographic stack. When you upgrade the system's foundational TLS configurations (like OpenSSL), those quantum protections automatically cascade to every tool and application running on the OS.

## Why It Matters

System TLS traffic and SSH sessions are actively being recorded today by adversaries for "Harvest Now, Decrypt Later" (HNDL) attacks. If an attacker captures an SSH session today, they could eventually use a quantum computer to break the SSH host key and authenticate as your server in the future.

## The Key Takeaway

While upgrading a system's TLS is as simple as a configuration change (like enabling `X25519MLKEM768`), upgrading OS package managers (like RPM or DEB files) to new ML-DSA signatures is incredibly hard. It requires massive, perfectly coordinated upgrades across the signing server, repository metadata, and end-user client.

## What's Happening

Major OS vendors are moving at different speeds. Microsoft has enabled ML-KEM by default within TLS 1.3 on Windows Server 2025, while major Linux distributions are targeting full PQC FIPS certification between 2026 and 2028.
