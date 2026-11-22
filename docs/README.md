# 项目文档

- [使用说明](../README.zh.md)
- [开发约定](../AGENTS.local.md)

草稿状态来自 `conversation.input.overlay` 的 `useInput`。
插件按会话 ID 记录输入框中是否有非空白文字，引用会随编辑器的文字表示计入。
恢复页面时，插件按 DeepSeek Harness 0.2.2-rc.5 的 `readConversationDraft` 格式只读浏览器原生草稿存储，
兼容纯字符串和结构化草稿。
存储不可用时，可继续跟踪当前页内的输入。
插件仅公布会话 ID 集合，供左侧插槽和三态插件订阅。

`sidebar.session.row.leading` 由原生会话行选择渲染，因此状态优先级由 DSH 控制。
铅笔本身无交互，使用主题文字色和本地化辅助标签。
原生定时任务时钟出现时已占满 16px 插槽，铅笔让出位置，草稿仍计入「需关注」。
三态插件通过可选 Client 服务 `sessionDraftIndicators` 订阅集合，随服务启用或停用自动接入或取消。

升级后复验输入、清空、切换会话、刷新、原生状态优先级，以及聚合包内单独停用草稿时的列表行为。
在本目录运行 `npm run build`、`npm run check`，再从工作区根运行插件骨架检查。
