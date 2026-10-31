# OS Cryptography PQC — In Simple Terms

## What This Is About

Modern operating systems have a deep cryptographic stack. When you upgrade the system's foundational TLS configurations (like OpenSSL), those quantum protections automatically cascade to every tool and application running on the OS.

## Why It Matters

System TLS traffic and SSH sessions are actively being recorded today by adversaries for "Harvest Now, Decrypt Later" (HNDL) attacks. If an attacker captures an SSH session today, they could eventually use a quantum computer to break the SSH host key and authenticate as your server in the future.

## The Key Takeaway

While upgrading a system's TLS is as simple as a configuration change (like enabling `X25519MLKEM768`), upgrading OS package managers (like RPM or DEB files) to new ML-DSA signatures is incredibly hard. It requires massive, perfectly coordinated upgrades across the signing server, repository metadata, and end-user client.

## What's Happening

Operating system vendors are adding post-quantum support in stages. Microsoft's November 2025 Windows update added API support for the ML-KEM and ML-DSA algorithms (FIPS 203 and FIPS 204), and its July 14, 2026 update for Windows Server 2025 (KB5099536) added hybrid post-quantum key exchange to TLS 1.3. Microsoft's documentation lists the new key exchange groups as disabled by default, so an administrator turns them on, for example with Group Policy.
