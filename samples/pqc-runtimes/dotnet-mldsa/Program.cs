// SPDX-License-Identifier: GPL-3.0-only
// ML-DSA-65 sign / verify with .NET 10 System.Security.Cryptography.MLDsa.
// Needs OpenSSL 3.5+ on Linux/macOS, or Windows with CNG ML-DSA (Windows Server 2025 / Windows 11).
using System.Security.Cryptography;
using System.Text;

const string Sample = "dotnet-mldsa";

if (!MLDsa.IsSupported)
{
    Console.WriteLine($"SKIP {Sample} platform-unsupported");
    return 0;
}

using MLDsa signer = MLDsa.GenerateKey(MLDsaAlgorithm.MLDsa65);
byte[] publicKey = signer.ExportMLDsaPublicKey();

byte[] message = Encoding.UTF8.GetBytes("post-quantum hello");
byte[] signature = signer.SignData(message);

// Verify with a key built from the public key bytes alone.
using MLDsa verifier = MLDsa.ImportMLDsaPublicKey(MLDsaAlgorithm.MLDsa65, publicKey);
if (!verifier.VerifyData(message, signature))
{
    Console.Error.WriteLine($"FAIL {Sample}: valid signature rejected");
    return 1;
}

// A modified message must be rejected.
byte[] tampered = (byte[])message.Clone();
tampered[0] ^= 0x01;
if (verifier.VerifyData(tampered, signature))
{
    Console.Error.WriteLine($"FAIL {Sample}: tampered message verified");
    return 1;
}

Console.WriteLine($"SIZE public_key {publicKey.Length}");
Console.WriteLine($"SIZE signature {signature.Length}");
Console.WriteLine($"OK {Sample}");
return 0;
