# Ardot 手势增强（Edge / Chrome 扩展）v1.0.0

![icon](icons/icon128.png)

非官方的 Ardot 画布手势增强：**滚轮直接缩放、右键按住拖拽平移**，不用再按 Ctrl 或碰中键。

| 操作 | 行为 |
|---|---|
| 滚轮 | 以指针为中心缩放 |
| Shift + 滚轮 | 横向平移（保留原生） |
| 右键按住拖拽 | 平移画布 |
| Ctrl + Alt + J | 开关本扩展 |

## 安装 / 更新

1. `edge://extensions/`（Chrome 为 `chrome://extensions/`）→ 打开「开发人员模式」
2. 「加载解压缩的扩展」→ 选择本目录（含 `manifest.json` 那一层）
   - 已装过旧版：点卡片上的**重新加载**图标即可，无需删除
3. **刷新 Ardot 页面**（content script 不会注入已缓存的页面）

要求 Edge / Chrome 111+。

## 原理

- `world: "MAIN"` + `run_at: "document_start"`：注入页面主世界，早于 Ardot 注册监听。
- 滚轮：在 `window` 捕获阶段 `preventDefault + stopImmediatePropagation` 掐掉原生平移，
  再派发 `ctrlKey:true` 的 `WheelEvent`，走 Ardot 自己的缩放逻辑。
- 右键拖拽：屏蔽 `contextmenu`，把 `button:2` 的 `pointerdown/move/up` 改写成
  **中键拖拽**（`button:1, buttons:4`）后重新派发，并**复用真实 pointerId**、提前替 App 调用
  `setPointerCapture`（避免它内部捕获抛异常中断处理）。
- 每个动作同时发 `PointerEvent` 和 `MouseEvent` 两套，兼容只监听 `mousedown` 的老式画布引擎。

## 调参（content.js 顶部 CFG）

```js
const CFG = {
  zoomKey: 'ctrl',    // Ardot 缩放修饰键：'ctrl' | 'alt'
  onlyCanvas: true,   // 只对 canvas 生效，避免干扰侧栏滚动
  toggleKey: 'j',     // Ctrl+Alt+J 开关
  invertWheel: false, // 滚轮方向反了就 true
};
```

## 图标

源文件在 `icons/icon.svg`（抽象鼠标：米白胶囊 + 金色右键 + 滚轮圆点），
各尺寸 PNG（16/32/48/128）由它栅格化生成；改完 SVG 重新跑一遍 qlmanage + sips 即可。

## 已知局限

1. 合成事件 `isTrusted === false`。滚轮缩放已证明 Ardot 不校验该标志；若右键平移无响应，
   说明其平移逻辑对输入更严格，需要改用浏览器级可信输入（如 `chrome.debugger`）。
2. 只对浏览器版有效。Codex 桌面端内嵌编辑器是沙箱 iframe，扩展注入不进去。
3. Ardot 前端改版可能失效；一般是改 `onCanvas()` 或平移改写逻辑。

## 免责声明

本项目为非官方第三方浏览器扩展，与腾讯 Ardot 及其官方团队无任何关联，
仅供个人提升画布操作效率使用；使用过程中产生的任何问题由使用者自行承担。
Ardot 前端更新可能导致本扩展失效，将持续视情况维护。

## 开源协议

[MIT](LICENSE)
