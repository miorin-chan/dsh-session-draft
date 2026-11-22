// DSH 0.2.2-rc.5, dsh-client-ui-conversation/src/client/stores.ts (readConversationDraft).
// Browser-local, read-only fallback for sessions whose composer has not mounted yet.
const conversationKey = 'dsh.conversation.'

export function hasDraftText(text: string): boolean {
  return text.trim() !== ''
}

function savedDraftPresent(raw: string | null): boolean {
  if (raw === null) return false
  try {
    const saved: unknown = JSON.parse(raw)
    if (typeof saved !== 'object' || saved === null || !('draft' in saved)) return false
    const { draft } = saved
    if (typeof draft === 'string') return hasDraftText(draft)
    return typeof draft === 'object' && draft !== null && 'text' in draft
      && typeof draft.text === 'string' && hasDraftText(draft.text)
  } catch {
    return false
  }
}

export function createDrafts(browser: Window) {
  const listeners = new Set<() => void>()
  let ids: ReadonlySet<string> = new Set()
  let storage: Storage | undefined

  try {
    storage = browser.localStorage
    const saved = new Set<string>()
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (key?.startsWith(conversationKey) && savedDraftPresent(storage.getItem(key))) {
        saved.add(key.slice(conversationKey.length))
      }
    }
    ids = saved
  } catch {
    // Live composer state is still available if storage is blocked.
  }

  function publish(next: ReadonlySet<string>): void {
    ids = next
    for (const listener of listeners) listener()
  }

  function update(sessionId: string, present: boolean): void {
    if (present === ids.has(sessionId)) return
    const next = new Set(ids)
    if (present) next.add(sessionId)
    else next.delete(sessionId)
    publish(next)
  }

  function onStorage(event: StorageEvent): void {
    if (storage === undefined || event.storageArea !== storage) return
    if (event.key === null) {
      if (ids.size > 0) publish(new Set())
    } else if (event.key.startsWith(conversationKey)) {
      update(event.key.slice(conversationKey.length), savedDraftPresent(event.newValue))
    }
  }

  browser.addEventListener('storage', onStorage)
  return {
    source: {
      getSnapshot: () => ids,
      subscribe(listener: () => void) {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    },
    update,
    dispose() {
      browser.removeEventListener('storage', onStorage)
      listeners.clear()
    },
  }
}
