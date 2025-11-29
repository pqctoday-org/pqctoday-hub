export type WorkerMessage =
    | { type: 'COMMAND'; command: string; args: string[]; files?: { name: string; data: Uint8Array }[] }
    | { type: 'LOAD'; url: string }
    | { type: 'FILE_UPLOAD'; name: string; data: Uint8Array };

export type WorkerResponse =
    | { type: 'LOG'; stream: 'stdout' | 'stderr'; message: string }
    | { type: 'FILE_CREATED'; name: string; data: Uint8Array }
    | { type: 'READY' }
    | { type: 'ERROR'; error: string }
    | { type: 'DONE' };
