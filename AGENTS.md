# jetbrains-git-graph 项目约定

## 1. 项目定位

- 本项目基于 `aotemj/jetbrains-git-graph` 的 VS Code / Cursor 插件源码调整。
- 当前目标是改善深色模式适配，不改变 Git 功能行为。
- 固定基线提交：`0141a3ae77feed024ef021d0b54889dab65441ae`。

## 2. 技术栈

- VS Code Extension Host：TypeScript。
- Webview 前端：React、Vite、TypeScript。
- 包管理器：`pnpm`，优先遵守仓库自带 `packageManager`。

## 3. 目录约定

- 根目录源码保持上游结构，不新建无关业务目录。
- `src`：VS Code 插件后端逻辑。
- `webview/src`：webview 前端界面。
- `webview/src/shared/theme/variables.css`：主题 token 与全局基础样式优先入口。
- 深色模式修复优先改主题变量和硬编码颜色，不重构功能模块。

## 4. 修改边界

- 不改 Git 命令行为、提交/拉取/合并/变基等业务逻辑。
- 不调整扩展 ID、发布者、版本号、Marketplace 发布配置，除非用户明确要求。
- 不安装全局依赖，不发布插件。
- 不删除上游文件；确需清理时先确认。

## 5. 深色模式规则

- 优先使用 VS Code webview 注入的 CSS 变量，例如：
  - `--vscode-editor-background`
  - `--vscode-editor-foreground`
  - `--vscode-list-hoverBackground`
  - `--vscode-button-background`
  - `--vscode-panel-border`
  - `--vscode-input-background`
- 禁止在组件里新增固定浅色背景作为常规 UI 色值。
- 状态提示色可以保留语义颜色，但必须同时保证深色背景下文字对比度可读。

## 6. 验证命令

- 依赖安装：`pnpm install`
- 构建验证：`pnpm run build`
- 打包验证：`pnpm run vsce:package`

普通深色模式样式修改至少运行 `pnpm run build`。
