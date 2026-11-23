import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { createDrafts } from '../src/client/drafts.ts'

let registration
const browser = new EventTarget()
Object.assign(browser, { __ModuleLoader__: { load(entry) { registration = entry } } })
globalThis.window = browser
await import('../client.js')
const plugin = registration.factory(createRequire(import.meta.url))

function withStorage(records) {
  const entries = Object.entries(records)
  return Object.assign(new EventTarget(), {
    localStorage: {
      length: entries.length,
      key: index => entries[index]?.[0] ?? null,
      getItem: key => records[key] ?? null,
    },
  })
}

function storageChange(browser, key, newValue) {
  const event = Object.assign(new Event('storage'), { key, newValue, storageArea: browser.localStorage })
  browser.dispatchEvent(event)
}

test('restores existing drafts and publishes only presence changes', () => {
  const browser = withStorage({
    'dsh.conversation.old': JSON.stringify({ draft: 'legacy draft' }),
    'dsh.conversation.rich': JSON.stringify({ draft: { text: 'rich draft', references: [] } }),
    'dsh.conversation.whitespace': JSON.stringify({ draft: '  \n' }),
    'dsh.conversation.invalid': '{',
    'other-store': JSON.stringify({ draft: 'unrelated' }),
  })
  const drafts = createDrafts(browser)
  const snapshots = []
  drafts.source.subscribe(() => snapshots.push([...drafts.source.getSnapshot()]))
  assert.deepEqual([...drafts.source.getSnapshot()], ['old', 'rich'])

  drafts.update('old', true)
  drafts.update('live', true)
  drafts.update('live', false)
  storageChange(browser, 'dsh.conversation.old', null)
  assert.deepEqual(snapshots, [['old', 'rich', 'live'], ['old', 'rich'], ['rich']])

  drafts.dispose()
  storageChange(browser, 'dsh.conversation.rich', null)
  assert.deepEqual([...drafts.source.getSnapshot()], ['rich'])
})

test('registers the native slots and withdraws its optional service on unload', () => {
  const cleanups = []
  const slots = new Map()
  const services = new Map()
  const ctx = {
    effect(setup) { cleanups.push(setup()) },
    provide(key, value) {
      services.set(key, value)
      return () => services.delete(key)
    },
    locale: {
      register(namespace, labels) {
        assert.equal(namespace, 'dsh-session-draft')
        assert.equal(Object.keys(labels).length, 8)
        return () => {}
      },
    },
    slots: {
      inject(name, setup) { return setup() },
      register(options, component) {
        assert.equal(typeof component, 'function')
        slots.set(options.name, options)
        return () => slots.delete(options.name)
      },
    },
  }

  assert.equal(registration.id, '@miorin/dsh-session-draft')
  assert.deepEqual(plugin.inject, ['slots', 'locale'])
  plugin.apply(ctx)
  assert.deepEqual([...slots.keys()], ['conversation.input.overlay', 'sidebar.session.row.leading'])
  assert.deepEqual([...services.get('sessionDraftIndicators').getSnapshot()], [])
  for (const cleanup of cleanups.reverse()) cleanup()
  assert.equal(slots.size, 0)
  assert.equal(services.size, 0)
})
