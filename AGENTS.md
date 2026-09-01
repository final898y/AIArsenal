# AGENTS.md - 知識庫與工具集規範指南 (Agents & Repository Guidelines)

本檔案為 AI Agent 與開發者在維護、新增、更新此倉庫內容時的**最高遵循準則**。無論是建立新 Prompt、Gemini Gem、Agent Skill 還是 Google Apps Script (GAS)，均須嚴格遵守本規範。

---

## 1. 倉庫核心架構與目錄規範

倉庫採用分類分層管理，結構如下：

```text
├── prompts/                      # 存放各類 Prompt 與 Gemini Gems
│   ├── gems/                     # Google Gemini Gems 專用 Prompt
│   ├── workflows/                # 複合型多步驟工作流 Prompt
│   └── templates/                # 通用結構範本
├── skills/                       # Antigravity / AI Agent Skills
│   └── <skill-name>/             # 獨立 Skill 資料夾 (含 SKILL.md 等)
├── scripts/                      # 程式碼與自動化腳本
│   └── gas/                      # Google Apps Script (GAS) 專用
│       ├── line-bots/            # LINE 相關機器人 / 自動化
│       └── utilities/            # 實用小工具
├── AGENTS.md                     # 本規範文件
└── README.md                     # 倉庫導覽與索引文件
```

---

## 2. Markdown 檔案 Metadata 與結構規範

所有在 `prompts/` 與 `skills/` 下的 Markdown 檔案，**必須包含 YAML Frontmatter**，並依循標準章節架構。

### 2.1 必備 YAML Frontmatter 欄位

```yaml
---
id: "unique-kebab-case-id"           # [必填] 唯一識別代碼，例如: python-ml-tutor
title: "檔案名稱 / 工具名稱"           # [必填] 繁體中文或英文易讀名稱
version: "1.0.0"                    # [必填] 語意化版本號 (SemVer)
type: "gem"                         # [必填] 類型: gem | prompt | skill | workflow
category: "education"               # [必填] 分類: education | coding | productivity | automation | language
tags:                               # [必填] 標籤陣列，利於搜尋與索引
  - python
  - machine-learning
  - tutor
target_platform: "gemini-gem"       # [必填] 目標平台: gemini-gem | chatgpt-gpts | antigravity | claude | general
target_models:                      # [建議] 最佳適配模型
  - "gemini-2.0-flash"
  - "gemini-1.5-pro"
author: "YourName"                  # [必填] 維護者
created_at: "2026-09-02"            # [必填] 建立日期 (YYYY-MM-DD)
updated_at: "2026-09-02"            # [必填] 最後修改日期 (YYYY-MM-DD)
variables:                          # [選填] 提示詞中需要的變數與輸入參數
  - name: "code_snippet"
    description: "使用者欲解構學習的 Python 程式碼"
    required: true
summary: "一句話簡短說明此 Prompt / Skill 的核心價值與目的。" # [必填] 摘要
---
```

### 2.2 標準內容區塊架構

Frontmatter 之後的本文應由以下標準區塊組成（可視需求微調，但順序盡量保持一致）：

```markdown
# [Title / Role Name]

> **摘要與用途說明**
> 簡述適用場景、解決問題與預期效果。

---

## 1. 角色定義與情境 (Persona & Context)
- 明確定義 AI 的角色、語氣、背景設定與目標受眾。

## 2. 核心目標 (Core Goal)
- 具體列出執行的主要任務。

## 3. 輸入變數與前置條件 (Inputs & Prerequisites)
- 說明使用者需要提供什麼資訊（如表格、程式碼、文章章節等）。

## 4. 執行邏輯與規則 (Rules & Instructions)
- 詳細且結構化的規則清單（分項、條列）。
- 嚴格限制與負向提示（例如：Do NOT ...、禁止事項）。

## 5. 輸出格式與範例 (Output Format & Examples)
- 定義輸出的 Markdown 格式、模板或 Few-Shot 範例。

---

## 6. 版本歷史與變更記錄 (Changelog & Diff History)

| 版本 | 日期 | 修改重點 | 調整動機 / 對照說明 |
| :--- | :--- | :--- | :--- |
| `1.0.0` | 2026-09-02 | 初版建立 | 建立基本教學引導邏輯 |
```

---

## 3. 版本控管策略 (Versioning & Retention Policy)

Prompt 與 Skill 隨著模型升級或需求微調會頻繁迭代，為了能快速對照差異並追溯歷史，本倉庫採用**雙層版本控管機制**：

### 3.1 語意化版本編號 (SemVer)
- **`MAJOR` (X.0.0)**：核心 Prompt 重構、角色或行為模式重大改變、輸出格式完全不相容。
- **`MINOR` (0.X.0)**：新增功能模組、增加新規則或輸出區塊，但向後相容。
- **`PATCH` (0.0.X)**：微調詞彙、修復語意模糊、微調 Few-shot 範例或排版。

### 3.2 歷史留存與對照方式
1. **內文變更日誌 (Changelog Table)**：
   - 每次修改檔案時，必須同步更新 Frontmatter 的 `version` 與 `updated_at`。
   - 在檔案底部的 `## 版本歷史與變更記錄` 新增一列，簡述修改動機與差異。
2. **重大版本快照 (Snapshot Archive - 適用重大重構)**：
   - 當進行 `MAJOR` 重大版本更新時，若舊版仍有特定平台使用價值，可在同目錄下建立 `archive/<id>-v<version>.md` 留存歷史快照（例如 `archive/python-ml-tutor-v1.0.0.md`），以利並行對照。
3. **Git Commit 規範**：
   - 使用 Conventional Commits 格式：
     - `feat(prompt): add shadow-coach prompt v1.0.0`
     - `update(prompt): refine python-tutor rules to v1.1.0`
     - `fix(gas): line-auto-center handle null token`

---

## 4. Google Apps Script (GAS) 規範

1. **檔案命名**：使用 `kebab-case.js`（例如 `line-auto-center.js`）。
2. **標頭註解**：必須包含檔案說明、觸發條件（Trigger）、必要屬性（Script Properties / Secrets）及關聯服務。
3. **敏感資訊隔離**：嚴禁寫死 API Key、Channel Access Token 或 Webhook URL，必須透過 `PropertiesService.getScriptProperties()` 讀取。

---

## 5. AI Agent 操作行為準則

當 AI Agent 在本倉庫執行操作時：
1. **建立新檔案**：必須主動產出標準 Frontmatter、填入正確分類，並在 `README.md` 的索引表中登記。
2. **更新現有檔案**：必須升級 `version`、更新 `updated_at`、並在文末 `Changelog` 增加紀錄。
3. **搬移或重新命名**：須同步更新 `README.md` 中的所有超連結。
