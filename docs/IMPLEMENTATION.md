# 会话草稿实现说明

产品体验与成功标准见[产品设计](DESIGN.md)。

## 草稿跟踪与跨窗口同步

- 通过 `conversation.input.overlay` 的 `useInput` 监听当前页面内各会话输入框 `draft` 文本变化，
  以非空白字符作为存在草稿判定。
- 页面恢复与初始化时，
  按 DSH `0.2.2-rc.5` `readConversationDraft` 格式只读浏览器 `localStorage` 中 `dsh.conversation.<sessionId>`，
  同时兼容纯字符串草稿与结构化对象草稿，并监听 `storage` 事件同步其他窗口变化；存储受限时降级为仅跟踪当前页内存状态。
- 插件通过 `ctx.provide('sessionDraftIndicators', source)` 公布只读会话 ID 集合作为可选 Client 服务，
  供侧栏标记和「左侧栏列表三态切换」按启用生命周期自动订阅或退订。

## 侧栏状态插槽与图标

- DSH `0.2.2-rc.5` 原生图标仅提供面向编辑动作的 `IconEditOutlineRegular`，缺少「有未发送草稿」的纯状态标记，
  因此插件使用自定义 14px 铅笔描边 SVG（取 `--dsw-alias-label-secondary` 与本地化八语言 `aria-label` / `<title>`）。
- 注册于 `sidebar.session.row.leading`（`order: 20`）；
  针对 `dsh-client-ui-schedule` 的 `[data-session-schedule-mark]` 占满 16px 插槽的情况，
  通过 CSS `:has([data-session-schedule-mark])` 隐藏铅笔以避免视觉重叠。
