// SPDX-License-Identifier: AGPL-3.0-only
import { handleWorkerRequest, type WorkerRequest } from './engineWorkerProtocol'

/**
 * The answer engine on its own thread: it fetches the two knowledge files, builds the indexes and answers, so the page
 * never freezes while the engine starts. Started by `adapter.ts`, on the first question.
 */
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  void handleWorkerRequest(event.data).then((reply) => self.postMessage(reply))
}
