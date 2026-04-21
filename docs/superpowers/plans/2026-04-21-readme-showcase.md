# README Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a polished GitHub-homepage `README.md` for the project and publish it to the remote repository.

**Architecture:** Treat this as a documentation-only change. Build a single top-level `README.md` that combines project positioning, feature highlights, controls, local development, deployment, and repository structure without drifting into speculative or internal-only details.

**Tech Stack:** Markdown, Git, GitHub

---

## Planned File Structure

- `README.md`: GitHub-facing project homepage document

### Task 1: Author the README Content

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README file**

Create `README.md` with:

```md
# Jelly Into Door

> 一个涂鸦纸面风格的轻量物理解谜小游戏。
> 你要拖拽软乎乎的果冻团子，蓄力、弹射、反弹，最后冲进终点的小门里。

`Jelly Into Door` 是一个基于 **Vanilla JavaScript + HTML5 Canvas + Vite** 的单页浏览器游戏项目。  
它把“拖拽蓄力发射”这种简单直觉的交互，和手绘纸面感的视觉风格、短关卡重试节奏、评分与解锁系统结合在一起，做成了一个适合桌面和触屏设备游玩的 casual web game。

## 项目亮点

- 涂鸦纸面视觉风格：Canvas 游戏画面 + DOM 叠层 UI，整体偏手绘、轻松、可爱。
- 拖拽蓄力弹射玩法：按住团子拖拽，松手发射，通过反弹、借力和路线控制过关。
- 短关卡高重试节奏：单关时间短，失败后可以快速重来，适合反复优化路线。
- 关卡与评分系统：包含多个关卡、星星收集、发射次数统计、通关时间和奖牌结果。
- 皮肤与本地存档：支持皮肤解锁、进度保存和本地记录持久化。
- 桌面 / 触屏双支持：既能鼠标操作，也支持手机触摸拖拽。
- 移动端布局兼容：HUD、菜单、按钮和弹层都已经针对手机屏幕做过响应式适配。

## 操作方式

### 桌面端

- 按住团子并拖拽：调整发射方向和力度
- 松开鼠标：发射团子
- `R`：重试当前关卡
- `Esc`：暂停 / 恢复

### 手机 / 触屏

- 手指按住团子并拖拽：调整方向和力度
- 松手：发射团子
- 屏幕上的按钮可用于暂停、继续和重试

## 技术栈

- **Vite**：本地开发与打包
- **Vanilla JavaScript**：游戏逻辑与 UI 控制
- **HTML5 Canvas**：场景绘制与视觉表现
- **Vitest**：核心逻辑测试
- **localStorage**：本地存档、皮肤与关卡记录
- **Nginx**：生产环境静态资源托管

## 本地开发

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

运行测试：

```bash
npm test -- --run
```

构建生产版本：

```bash
npm run build
```

## 部署说明

这个项目是一个 **静态前端站点**。

- 生产构建产物位于 `dist/`
- 构建完成后，可以直接把 `dist/` 发布到服务器
- 适合使用 **Nginx** 直接托管静态文件
- 生产环境不需要长期运行 Node.js 进程

一个典型的部署方式是：

1. 本地执行 `npm run build`
2. 将 `dist/` 上传到服务器目录
3. 使用 Nginx 指向该目录提供访问

## 项目结构

```text
.
├─ src/        # 游戏逻辑、渲染、UI、存档等核心代码
├─ tests/      # Vitest 测试
├─ docs/       # 设计记录、实现计划等过程文档
├─ index.html
├─ package.json
└─ vite.config.js
```

## 后续可扩展方向

- 增加更多主题化关卡
- 添加更完整的音效 / 背景音乐层次
- 增加更丰富的皮肤或视觉反馈
- 补一组项目截图或 GIF 作为仓库展示素材

## License

当前仓库未单独声明许可证。如需开源发布，建议补充 `LICENSE` 文件。
```

- [ ] **Step 2: Verify the README content locally**

Run:

```bash
Get-Content README.md
```

Expected:
- README 标题、简介、亮点、操作方式、技术栈、本地开发、部署说明、项目结构、后续可扩展方向这些 sections 全部存在
- 内容和当前项目实际能力一致

### Task 2: Publish the README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Check Git status before commit**

Run:

```bash
git -c safe.directory='C:/Users/99448/Desktop/JellyBridge' status --short
```

Expected:
- 只看到 `README.md` 和这次计划文档相关的新增或修改

- [ ] **Step 2: Commit the README**

```bash
git -c safe.directory='C:/Users/99448/Desktop/JellyBridge' add README.md docs/superpowers/plans/2026-04-21-readme-showcase.md
git -c safe.directory='C:/Users/99448/Desktop/JellyBridge' commit -m "docs: add project showcase readme"
```

- [ ] **Step 3: Push to GitHub**

```bash
git -c safe.directory='C:/Users/99448/Desktop/JellyBridge' push origin main
```

## Self-Review Checklist

- Spec coverage:
  - Hero 区、项目简介、亮点、操作说明、技术栈、本地开发、部署说明、项目结构、roadmap 都已覆盖
- Placeholder scan:
  - 无 TODO、TBD、假链接、未实现功能宣称
- Type consistency:
  - 项目名、技术栈、部署方式与当前仓库保持一致
