// Reference spike: OpenFHE v1.6.0 N-of-N threshold BFV, the reference lane for the FHE plan's
// N-of-N threshold scenario (Hub "OpenFHE threshold", plan §6.4–§6.5). No HSM code.
//
// Follows the BFV run of src/pke/examples/threshold-fhe.cpp (RunBFVrns: p = 65537, batch 16,
// multiplicative depth 2, NOISE_FLOODING_MULTIPARTY), extended from that example's 2 parties to N
// with the key-generation chain of threshold-fhe-5p.cpp. Default N = 3 (the Hub's 3-of-3).
//
// T1  All N parties fuse their partial decryptions: EvalAdd, EvalMult and EvalSum results are exact.
// T2  N-1 shares do not decrypt: fusing without one party's share does not give the plaintext.
//     (An observation for this run, not a proof of the N-of-N security property.)
// T3  Serialized sizes (OpenFHE BINARY): joint public key, each party's secret share, the joint
//     relinearization key, the joint EvalSum keys, a fresh ciphertext, one partial decryption.
// T4  Parameters actually generated, and per-step timings.
// Output: one JSON object on stdout.

#include <chrono>
#include <cmath>
#include <cstdint>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "openfhe.h"
#include "ciphertext-ser.h"
#include "cryptocontext-ser.h"
#include "key/key-ser.h"
#include "scheme/bfvrns/bfvrns-ser.h"

using namespace lbcrypto;
using Clock = std::chrono::steady_clock;

static double ms(Clock::time_point t) {
    return std::chrono::duration<double, std::milli>(Clock::now() - t).count();
}
template <typename T>
static size_t serSize(const T& obj) {
    std::stringstream ss;
    Serial::Serialize(obj, ss, SerType::BINARY);
    return ss.str().size();
}
static std::string esc(const std::string& s) {
    std::string o;
    for (char c : s) {
        if (c == '"' || c == '\\') o += '\\';
        o += c;
    }
    return o;
}

int main(int argc, char* argv[]) {
    const size_t N = argc > 1 ? std::stoul(argv[1]) : 3;
    const uint32_t batchSize = 16;
    std::vector<std::string> checks;
    int failures = 0;
    auto record = [&](const std::string& id, bool pass, const std::string& detail) {
        if (!pass) failures++;
        checks.push_back("{\"id\":\"" + id + "\",\"pass\":" + (pass ? "true" : "false") + ",\"detail\":\"" +
                         esc(detail) + "\"}");
    };

    // Context: the exact settings of threshold-fhe.cpp's BFV run.
    CCParams<CryptoContextBFVRNS> parameters;
    parameters.SetPlaintextModulus(65537);
    parameters.SetBatchSize(batchSize);
    parameters.SetMultiplicativeDepth(2);
    parameters.SetMultipartyMode(NOISE_FLOODING_MULTIPARTY);
    auto t = Clock::now();
    CryptoContext<DCRTPoly> cc = GenCryptoContext(parameters);
    cc->Enable(PKE);
    cc->Enable(KEYSWITCH);
    cc->Enable(LEVELEDSHE);
    cc->Enable(ADVANCEDSHE);
    cc->Enable(MULTIPARTY);
    double tCtx = ms(t);

    // Key generation chain (threshold-fhe-5p.cpp pattern, N parties).
    t = Clock::now();
    std::vector<KeyPair<DCRTPoly>> kp(N);
    kp[0] = cc->KeyGen();
    for (size_t i = 1; i < N; i++) kp[i] = cc->MultipartyKeyGen(kp[i - 1].publicKey);
    double tPk = ms(t);
    const auto jointPk = kp[N - 1].publicKey;
    const auto tag = jointPk->GetKeyTag();

    t = Clock::now();
    auto evalMultKey = cc->KeySwitchGen(kp[0].secretKey, kp[0].secretKey);
    auto evalMultSum = evalMultKey;  // accumulates the joint key for (s_1 + ... + s_N)
    for (size_t i = 1; i < N; i++) {
        auto share = cc->MultiKeySwitchGen(kp[i].secretKey, kp[i].secretKey, evalMultKey);
        evalMultSum = cc->MultiAddEvalKeys(evalMultSum, share, kp[i].publicKey->GetKeyTag());
    }
    // Each party multiplies the joint key by its secret; the results are summed.
    auto evalMultFinal = cc->MultiMultEvalKey(kp[N - 1].secretKey, evalMultSum, tag);
    for (size_t i = N - 1; i-- > 0;) {
        auto part = cc->MultiMultEvalKey(kp[i].secretKey, evalMultSum, tag);
        evalMultFinal = cc->MultiAddEvalMultKeys(part, evalMultFinal, part->GetKeyTag());
    }
    cc->InsertEvalMultKey({evalMultFinal});
    double tRelin = ms(t);

    t = Clock::now();
    cc->EvalSumKeyGen(kp[0].secretKey);
    auto evalSumKeys =
        std::make_shared<std::map<uint32_t, EvalKey<DCRTPoly>>>(cc->GetEvalSumKeyMap(kp[0].secretKey->GetKeyTag()));
    auto evalSumJoin = evalSumKeys;
    for (size_t i = 1; i < N; i++) {
        auto share = cc->MultiEvalSumKeyGen(kp[i].secretKey, evalSumKeys, kp[i].publicKey->GetKeyTag());
        evalSumJoin = cc->MultiAddEvalSumKeys(evalSumJoin, share, kp[i].publicKey->GetKeyTag());
    }
    cc->InsertEvalSumKey(evalSumJoin);
    double tSum = ms(t);

    // Data, encryption under the joint public key, evaluation.
    std::vector<int64_t> v1 = {1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0};
    std::vector<int64_t> v2 = {1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0};
    std::vector<int64_t> v3 = {2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 0};
    t = Clock::now();
    auto c1 = cc->Encrypt(jointPk, cc->MakePackedPlaintext(v1));
    double tEnc = ms(t);
    auto c2 = cc->Encrypt(jointPk, cc->MakePackedPlaintext(v2));
    auto c3 = cc->Encrypt(jointPk, cc->MakePackedPlaintext(v3));
    t = Clock::now();
    auto cAdd = cc->EvalAdd(cc->EvalAdd(c1, c2), c3);
    double tAdd = ms(t);
    t = Clock::now();
    auto cMul = cc->EvalMult(c1, c3);
    double tMul = ms(t);
    auto cSum = cc->EvalSum(c3, batchSize);

    // Threshold decryption: lead share from party 1, main shares from the others, then fusion.
    auto decrypt = [&](const Ciphertext<DCRTPoly>& ct, size_t skip, double* tShares) {
        auto t0 = Clock::now();
        std::vector<Ciphertext<DCRTPoly>> parts;
        for (size_t i = 0; i < N; i++) {
            if (i == skip) continue;
            auto p = i == 0 ? cc->MultipartyDecryptLead({ct}, kp[i].secretKey)
                            : cc->MultipartyDecryptMain({ct}, kp[i].secretKey);
            parts.push_back(p[0]);
        }
        if (tShares) *tShares = ms(t0);
        Plaintext out;
        cc->MultipartyDecryptFusion(parts, &out);
        out->SetLength(v1.size());
        return out->GetPackedValue();
    };
    std::vector<int64_t> wantAdd(v1.size()), wantMul(v1.size()), wantSum(v1.size());
    int64_t s3 = 0;
    for (auto x : v3) s3 += x;
    for (size_t i = 0; i < v1.size(); i++) {
        wantAdd[i] = v1[i] + v2[i] + v3[i];
        wantMul[i] = v1[i] * v3[i];
        wantSum[i] = s3;  // only slot 0 is checked below; the other slots are reported
    }
    double tShares = 0;
    auto gotAdd = decrypt(cAdd, N, &tShares);
    auto gotMul = decrypt(cMul, N, nullptr);
    auto gotSum = decrypt(cSum, N, nullptr);
    // EvalSum(ct, batchSize) is checked on slot 0, which must hold the total of the batch; the
    // other slots hold partial rotation sums in OpenFHE's packed layout and are reported, not asserted.
    bool okAdd = gotAdd == wantAdd, okMul = gotMul == wantMul, okSum = !gotSum.empty() && gotSum[0] == s3;
    std::string sumSlots;
    for (size_t i = 0; i < gotSum.size(); i++) sumSlots += (i ? "," : "") + std::to_string(gotSum[i]);
    record("T1", okAdd && okMul && okSum,
           std::to_string(N) + " parties fused: add exact=" + (okAdd ? "true" : "false") +
               ", mult exact=" + (okMul ? "true" : "false") + ", evalsum slot0==" + std::to_string(s3) + " " +
               (okSum ? "true" : "false") + " (slots: " + sumSlots + ")");

    // N-1 shares (drop the last party): must not reproduce the plaintext.
    auto partialAdd = decrypt(cAdd, N - 1, nullptr);
    record("T2", partialAdd != wantAdd,
           std::string("fusing ") + std::to_string(N - 1) + " of " + std::to_string(N) +
               " shares reproduces the plaintext=" + (partialAdd == wantAdd ? "true" : "false"));

    // Sizes.
    std::stringstream relinSs, sumSs;
    cc->SerializeEvalMultKey(relinSs, SerType::BINARY);
    cc->SerializeEvalSumKey(sumSs, SerType::BINARY);
    auto lead = cc->MultipartyDecryptLead({cAdd}, kp[0].secretKey);
    std::ostringstream sizes;
    sizes << "joint public key " << serSize(jointPk) << " B; secret share (party 1) " << serSize(kp[0].secretKey)
          << " B; joint relinearization key " << relinSs.str().size() << " B; joint EvalSum keys "
          << sumSs.str().size() << " B; fresh ciphertext " << serSize(c1) << " B; partial decryption share "
          << serSize(lead[0]) << " B";
    record("T3", true, sizes.str());

    const auto& ep = cc->GetCryptoParameters()->GetElementParams();
    std::ostringstream params;
    params << "ring dimension n = " << ep->GetCyclotomicOrder() / 2 << "; log2 q = " << std::log2(ep->GetModulus().ConvertToDouble())
           << "; RNS towers = " << ep->GetParams().size() << "; p = " << cc->GetCryptoParameters()->GetPlaintextModulus()
           << "; multiparty mode = NOISE_FLOODING_MULTIPARTY; context " << tCtx << " ms, public-key chain " << tPk
           << " ms, relinearization keys " << tRelin << " ms, EvalSum keys " << tSum << " ms, encrypt " << tEnc
           << " ms, add " << tAdd << " ms, mult " << tMul << " ms, " << N << " partial decryptions " << tShares << " ms";
    record("T4", true, params.str());

    std::cout << "{\"spike\":\"openfhe-threshold-bfv\",\"openfhe\":\"v1.6.0\",\"parties\":" << N
              << ",\"failures\":" << failures << ",\"checks\":[";
    for (size_t i = 0; i < checks.size(); i++) std::cout << (i ? "," : "") << checks[i];
    std::cout << "]}" << std::endl;
    return failures ? 1 : 0;
}
