// SPDX-License-Identifier: GPL-3.0-only
// ML-KEM-768 round trip with .NET 10 System.Security.Cryptography.MLKem.
// Needs OpenSSL 3.5+ on Linux/macOS, or Windows with CNG ML-KEM (Windows Server 2025 / Windows 11).
using System.Security.Cryptography;

const string Sample = "dotnet-mlkem";

if (!MLKem.IsSupported)
{
    Console.WriteLine($"SKIP {Sample} platform-unsupported");
    return 0;
}

// Receiver: generate a key pair and publish the encapsulation key.
using MLKem receiver = MLKem.GenerateKey(MLKemAlgorithm.MLKem768);
byte[] encapsulationKey = receiver.ExportEncapsulationKey();

// Sender: import the encapsulation key, derive a shared secret and a ciphertext.
using MLKem sender = MLKem.ImportEncapsulationKey(MLKemAlgorithm.MLKem768, encapsulationKey);
sender.Encapsulate(out byte[] ciphertext, out byte[] senderSecret);

// Receiver: recover the same shared secret from the ciphertext.
byte[] receiverSecret = receiver.Decapsulate(ciphertext);

if (!CryptographicOperations.FixedTimeEquals(senderSecret, receiverSecret))
{
    Console.Error.WriteLine($"FAIL {Sample}: shared secrets differ");
    return 1;
}

Console.WriteLine($"SIZE encapsulation_key {encapsulationKey.Length}");
Console.WriteLine($"SIZE ciphertext {ciphertext.Length}");
Console.WriteLine($"SIZE shared_secret {senderSecret.Length}");
Console.WriteLine($"OK {Sample}");
return 0;
