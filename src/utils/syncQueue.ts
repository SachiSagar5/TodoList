let _syncChain: Promise<void> = Promise.resolve();

export function enqueueSync(fn: () => Promise<void>): void {
  _syncChain = _syncChain.then(fn).catch(() => {});
}

export function flushSyncs(): Promise<void> {
  return _syncChain;
}
