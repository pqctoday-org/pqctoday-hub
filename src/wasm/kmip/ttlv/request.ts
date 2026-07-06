// SPDX-License-Identifier: GPL-3.0-only
//
// request.ts — wrap a payload in a full KMIP 3.0 Request Message envelope.
// Ported from pqctoday-hsm/kmip/python-client/src/pqctoday_kmip/kmip.py's
// `KmipClient.request()` — the same RequestHeader{ProtocolVersion 3.0} +
// BatchItem{Operation, RequestPayload} shape, minus the socket I/O (the
// caller submits the encoded bytes via `KmipEngine.submit` instead).

import { leaf, struct, type KmipNode } from './nodes'

const protocolVersion = (): KmipNode =>
  struct(
    'ProtocolVersion',
    leaf('ProtocolVersionMajor', 'Integer', 3),
    leaf('ProtocolVersionMinor', 'Integer', 0)
  )

/** One single-batch-item KMIP 3.0 Request Message for `operation`, carrying
 * `payload` as its RequestPayload's children. */
export function buildRequest(operation: string, ...payload: KmipNode[]): KmipNode {
  return struct(
    'RequestMessage',
    struct('RequestHeader', protocolVersion()),
    struct(
      'BatchItem',
      leaf('Operation', 'Enumeration', operation),
      struct('RequestPayload', ...payload)
    )
  )
}
