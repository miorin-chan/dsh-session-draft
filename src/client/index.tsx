import { useEffect, useSyncExternalStore } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { InputState } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { createDrafts, hasDraftText } from './drafts.js'

const namespace = 'dsh-session-draft'
const service = 'sessionDraftIndicators'
// DSH 0.2.2-rc.5, dsh-client-ui-schedule's SessionScheduleMark occupies the entire 16px cell.
const schedulePriority = `
  [data-slot="sidebar.session.row.leading"]:has([data-session-schedule-mark]) [data-dsh-session-draft] {
    display: none;
  }
`
const labels = {
  en: { draft: 'Unsent draft' },
  zh: { draft: '有未发送的草稿' },
  ja: { draft: '未送信の下書き' },
  de: { draft: 'Ungesendeter Entwurf' },
  es: { draft: 'Borrador sin enviar' },
  fr: { draft: 'Brouillon non envoyé' },
  pt: { draft: 'Rascunho não enviado' },
  ru: { draft: 'Неотправленный черновик' },
} as const

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    [namespace]: keyof typeof labels.en
  }
}

export const inject = ['slots', 'locale']

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(namespace, labels), `${namespace}: locale`)
  ctx.effect(() => {
    const drafts = createDrafts(window)
    const unprovide = ctx.provide(service, drafts.source)
    const unwatch = ctx.slots.inject('conversation.input.overlay', () => ctx.slots.register({
      name: 'conversation.input.overlay', id: namespace,
    }, function ObserveDraft({ sessionId, useInput }) {
      const present = useInput(({ draft }: InputState) => hasDraftText(draft))
      useEffect(() => { drafts.update(sessionId, present) }, [sessionId, present])
      return null
    }))
    const unmark = ctx.slots.inject('sidebar.session.row.leading', () => ctx.slots.register({
      name: 'sidebar.session.row.leading', id: namespace, locale: namespace, order: 20,
    }, function DraftMark({ sessionId, t }) {
      const present = useSyncExternalStore(drafts.source.subscribe, () => drafts.source.getSnapshot().has(sessionId))
      if (!present) return null
      const description = t('draft')
      return <>
        <style>{schedulePriority}</style>
        <svg data-dsh-session-draft="" role="img" aria-label={description} width="14" height="14"
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35"
          strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--dsw-alias-label-secondary)' }}>
          <title>{description}</title>
          <path d="m3 10.6-.7 3.1 3.1-.7L13 5.4a1.65 1.65 0 0 0-2.4-2.4L3 10.6Zm6.6-6.5 2.3 2.3" />
        </svg>
      </>
    }))
    return () => {
      unmark()
      unwatch()
      unprovide()
      drafts.dispose()
    }
  }, `${namespace}: draft observer and row mark`)
}
