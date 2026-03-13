# Operating System & Platform Crypto PQC — In Simple Terms

## What This Is About

Your computer's operating system — Windows, macOS, or Linux — is like the manager of a building. It controls who gets in, what they can access, and how everything stays secure. One of its most important jobs is handling encryption: scrambling data so outsiders cannot read it, verifying that software updates are genuine, and securing your internet connections.

Every time you connect to Wi-Fi, install a software update, or log into a website, your operating system is quietly doing encryption work behind the scenes. It uses built-in encryption engines with names like OpenSSL (on Linux), Schannel (on Windows), and Secure Transport (on macOS). These engines are like the locks on every door in the building. Right now, those locks use math that quantum computers could eventually pick, so every operating system needs to swap out its locks for quantum-safe ones.

## Why It Matters

Operating systems sit at the foundation of everything. Your phone, your laptop, web servers, ATMs, hospital equipment — they all run on operating systems. If the encryption at this foundational level is not upgraded, then nothing built on top of it is truly safe, no matter how secure the individual apps try to be. It is like reinforcing every apartment door in a building while leaving the main entrance wide open.

The scale of this problem is staggering. There are billions of devices running these operating systems worldwide. Upgrading them all requires coordination between operating system makers, hardware manufacturers, software developers, and IT departments at every organization. Some older systems may not be powerful enough to run the new quantum-safe encryption, forcing difficult decisions about replacement.

## The Key Takeaway

Operating systems are the security foundation for every digital device. Until they are upgraded to quantum-safe encryption, no application or service running on top of them is fully protected. This makes OS-level upgrades one of the most critical and far-reaching parts of the quantum security transition.

## What's Happening

Microsoft has begun adding quantum-safe options to Windows through its cryptographic framework. Red Hat and Ubuntu are testing quantum-safe algorithms in Linux distributions. Apple is researching updates for macOS and iOS. The OpenSSL project, which powers most of the internet's servers, already supports quantum-safe algorithms through a provider plugin. SSH, the tool used to securely manage servers remotely, is also being updated with quantum-safe key types. Governments are setting deadlines — the U.S. aims to have critical systems migrated by 2035, pushing operating system vendors to accelerate their timelines.
