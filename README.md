# Morget v0.1.0-Dev-v1（Phase 0）

轻量插件平台 Morget 的阶段 0 可落盘版本：Tauri 2.X + TypeScript 5（前端 `frontend/`）+ Rust（后端 `src-tauri/`），前后端分离、仅真实状态（未接入服务时明确报错，无任何模拟数据）。

## 目录结构

```text
├─ .github/workflows/build.yml   # Windows x64 CI（nsis/msi/便携 zip）
├─ scripts/makeDefaultIcon.js    # 生成默认图标 PNG（纯 Node，无依赖）
├─ src-tauri/                    # Rust 后端（Tauri 2 命令层/配置/平台能力）
└─ frontend/src/                 # TS 前端（Lang/主题/桥接/热键/验证屏）
```

## 本地验证命令

```bash
npm install
npm run icon                                    # 生成 assets/appIcon.png 并产出 src-tauri/icons
cargo check --manifest-path src-tauri/Cargo.toml
npm run build                                   # tsc --noEmit + vite build
npm run tauri dev                               # 启动桌面端（Phase 0 验证屏）
npm run tauri build                             # 产出 nsis/msi 安装器与便携 exe
```

## 本版已验证

- `tsc --noEmit`（strict）：0 错误
- `vite build`：构建成功
- 全部 JSON（配置/语言包/能力清单）：格式合法
- 修复点 1：`theme.ts` 中 `uiScale/fontScale` 原引用 `cfg.style`（不存在，编译阻断），已改为 `cfg.graphics`
- 修复点 2：三个语言包补充原文档缺失的 `p0.section.lang` 键（验证屏「语言」分组标题）

## Phase 0 验收清单（需在本地 Windows 执行）

- `cargo check` 0 error；`npm run tauri dev` 不白屏
- 托盘图标 / 左键聚焦 / 菜单 Exit
- 关闭流程：Esc 取消后窗口存活；抑制 ack 10 秒强退；「下次不再提醒」持久化
- UAC：同意后单进程提权重启；拒绝后原实例存活并报 `ELEVATION_DENIED`
- 市场：`marketApiUrl` 为空时真实报 `SERVICE_NOT_CONFIGURED`，无假插件
- 导出路径为真实 `baseDir`（Windows 默认 `%APPDATA%\com.morget.app`）
