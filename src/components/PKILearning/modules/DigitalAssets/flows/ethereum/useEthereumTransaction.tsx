// SPDX-License-Identifier: AGPL-3.0-only
import type { Step } from '../../components/StepWizard'
import { InfoTooltip } from '../../components/InfoTooltip'
import { useArtifactManagement } from '../../hooks/useArtifactManagement'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import type { EthereumFlowState, EthereumFlowActions } from './types'

interface UseEthereumTransactionProps {
  state: EthereumFlowState
  actions: EthereumFlowActions
  artifacts: ReturnType<typeof useArtifactManagement>
}

export function useEthereumTransaction({
  state,
  actions,
  artifacts,
}: UseEthereumTransactionProps): { steps: Step[]; execute: (stepId: string) => Promise<string> } {
  const steps: Step[] = [
    {
      id: 'format_tx',
      title: '6. Prepare Sample Transaction Fields',
      description: (
        <>
          Define the transaction details including nonce
          <InfoTooltip term="nonce" />, gas <InfoTooltip term="gas" /> parameters, and value in wei{' '}
          <InfoTooltip term="wei" />
          .Verify the recipient address carefully!
          <br /> <br />
          <strong> Transaction Fields: </strong>
          <br />• Nonce: Transaction counter(prevents replay attacks)
          <br />• Gas Price: Cost per gas unit in wei(often measured in gwei{' '}
          <InfoTooltip term="gwei" />)
          <br />• Gas Limit: Max computation allowed(21000 for simple transfers)
          <br />• To: Recipient's Ethereum address (destination for the transfer)
          <br />• Value: Amount to send in wei(1 ETH = 10 ^ 18 wei)
          <br />• Data: Contract call data(empty for simple transfers)
          <br />• Chain ID: Network identifier (1 = mainnet)
        </>
      ),
      code: `const transaction = {\n  nonce: 0,\n  gasPrice: "20000000000", // 20 Gwei\n  gasLimit: 21000,\n  to: "${state.editableRecipientAddress || state.recipientAddress || '...'}",\n  value: "100000000000000000", // 0.1 ETH\n  data: "",\n  chainId: 1\n};`,
      language: 'javascript',
      actionLabel: 'Prepare Sample Fields',
    },
    {
      id: 'visualize_msg',
      title: '7. Encode Sample JSON Payload',
      description: (
        <>
          This step encodes a teaching object as UTF-8 JSON, saves those exact bytes, hashes them
          with Keccak-256 <InfoTooltip term="keccak256" /> and uses that sample digest for signing.
          It does not emit an Ethereum transaction. The legacy EIP-155 RLP{' '}
          <InfoTooltip term="rlp" /> structure below is related-format guidance, not this artifact;
          an EIP-1559 type-2 transaction has its own encoding and fields.
          <br />
          Related reading:{' '}
          <a
            href="https://eips.ethereum.org/EIPS/eip-155"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            EIP-155
          </a>{' '}
          and{' '}
          <a
            href="https://eips.ethereum.org/EIPS/eip-1559"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            EIP-1559
          </a>
          .
        </>
      ),
      code: `// Illustrative summary of the JSON teaching payload, not an Ethereum wire encoding
const sampleJson = JSON.stringify({
  nonce: transactionData.nonce,
  gasPrice: transactionData.gasPrice,
  gasLimit: transactionData.gasLimit,
  to: transactionData.to,
  value: transactionData.value,
  data: transactionData.data,
  v: transactionData.chainId,
  r: 0,
  s: 0
});
const sampleBytes = new TextEncoder().encode(sampleJson);
const digest = keccak_256(sampleBytes);`,
      language: 'javascript',
      actionLabel: 'Encode Sample JSON',
      explanationTable: [
        {
          label: 'Nonce',
          value: '0',
          description: 'Counter to prevent replay attacks. Starts at 0 for new accounts.',
        },
        {
          label: 'Gas Price',
          value: '20 Gwei',
          description: 'Price per unit of gas (in Wei) the sender is willing to pay.',
        },
        {
          label: 'Gas Limit',
          value: '21000',
          description: 'Maximum gas allowed for the transaction (21000 is standard for transfers).',
        },
        {
          label: 'To',
          value: state.editableRecipientAddress || state.recipientAddress || '...',
          description: 'The destination address (20 bytes).',
        },
        {
          label: 'Value',
          value: '0.1 ETH (100000000000000000 wei)',
          description: 'Amount of Ether to transfer (in Wei).',
        },
        {
          label: 'Data',
          value: '0x',
          description: 'Input data for contract calls. Empty for simple transfers.',
        },
        {
          label: 'Chain ID',
          value: '1',
          description:
            'Fixed sample network identifier (1 = Mainnet). This JSON demonstration does not test replay protection.',
        },
        {
          label: 'Related legacy EIP-155 RLP structure (not emitted)',
          value: 'RLP([nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0])',
          description:
            'EIP-155 describes the protected legacy signing fields as an ordered RLP list. This sample emits JSON UTF-8 instead. EIP-1559 type-2 uses a type prefix and its own RLP fields; this exercise does not implement that format.',
        },
      ],
    },
  ]

  const execute = async (stepId: string) => {
    let result = ''

    if (stepId === 'format_tx') {
      if (!state.sourceAddress || !state.recipientAddress)
        throw new Error('Addresses not generated')

      // Use a consistent nonce for demo
      const txData = {
        nonce: 0,
        gasPrice: '20000000000', // 20 Gwei
        gasLimit: 21000,
        to: state.editableRecipientAddress || state.recipientAddress,
        value: '100000000000000000', // 0.1 ETH
        data: '',
        chainId: 1, // Mainnet
      }
      actions.setTransactionData(txData)

      result = `Transaction Details:\n${JSON.stringify(txData, null, 2)}`
    } else if (stepId === 'visualize_msg') {
      // Visualize RLP Structure
      const rlpStructure = {
        nonce: state.transactionData?.nonce,
        gasPrice: state.transactionData?.gasPrice,
        gasLimit: state.transactionData?.gasLimit,
        to: state.transactionData?.to,
        value: state.transactionData?.value,
        data: state.transactionData?.data,
        v: state.transactionData?.chainId, // Simplified
        r: 0,
        s: 0,
      }

      const rlpJson = JSON.stringify(rlpStructure)
      const rlpBytes = new TextEncoder().encode(rlpJson)

      // Save artifacts
      const transFilename = artifacts.saveTransaction('ethereum', rlpBytes)

      // Calculate Hash (Critical for next step)
      const hash = keccak_256(rlpBytes)
      const hashHex = bytesToHex(hash)
      actions.setTxHash(hashHex)
      const hashFilename = artifacts.saveHash('ethereum', hash)

      result = `Sample JSON structure (to be hashed):
${JSON.stringify(rlpStructure, null, 2)}

========================================
JSON TEACHING PAYLOAD BYTES (Hex)
========================================
These are the UTF-8 bytes of the JSON teaching object above. Their Keccak-256 digest is signed in step 8; no Ethereum wire transaction is encoded.

JSON Payload Length: ${rlpBytes.length} bytes

Hex String:
${bytesToHex(rlpBytes)}

Keccak-256 Hash (to sign):
0x${hashHex}

📂 Sample Artifacts Saved:
- JSON UTF-8 payload: ${transFilename}
- Digest of that JSON payload: ${hashFilename}`
    }

    return result
  }

  return { steps, execute }
}
