# 🧰 AI Arsenal & Knowledge Vault

> 個人專屬的 AI 智慧中樞與自動化工具庫：收錄 **Gemini Gems**、**精選 Prompts**、**Agent Skills** 與 **Google Apps Script (GAS)** 自動化腳本。

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](AGENTS.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#)
[![Maintenance](https://img.shields.io/badge/maintained%3F-yes-brightgreen.svg)](#)

---

## 🧭 目錄導覽 (Table of Contents)

- [倉庫簡介](#-倉庫簡介)
- [資料夾結構](#-資料夾結構)
- [資源索引目錄](#-資源索引目錄)
  - [1. Gemini Gems & 提示詞庫 (Prompts)](#1-gemini-gems--提示詞庫-prompts)
  - [2. Agent 技能組 (Skills)](#2-agent-技能組-skills)
  - [3. Google Apps Script 自動化 (GAS)](#3-google-apps-script-自動化-gas)
- [版本管理與比對機制](#-版本管理與比對機制)
- [規格與維護規範 (AGENTS.md)](#-規格與維護規範)
- [授權與聲明](#-授權與聲明)

---

## 📖 倉庫簡介

本倉庫旨在將日常開發、語言學習、內容重構與自動化流程中累積的高價值資產進行系統化管理：
1. **Prompts & Gems**：經過反覆調優的高效提示詞與 Google Gemini Gem 範本。
2. **Skills**：適用於 AI Agent（如 Antigravity / Claude Code）的自定義執行技能。
3. **Google Apps Script**：串接 LINE、Google Workspace 等雲端自動化程式碼。

---

## 📁 資料夾結構

```text
.
├── prompts/                         # 提示詞庫與 Gemini Gems (統一收錄)
│   ├── python-ml-tutor.md           # Python & ML 零基礎學習導師
│   ├── shadowing-coach.md           # Shadowing（跟讀）教練
│   ├── toeic-golden-lecture.md      # TOEIC 金色證書講義生成
│   ├── markdown-course-converter.md # AI 課程轉 Markdown 筆記
│   ├── markdown-course-auditor.md   # 課程講義審核校對與修訂
│   ├── exam-question-to-handout.md  # 考古題轉自足式精讀講義
│   └── archive/                     # 歷史重大版本快照 (提供離線對照)
├── skills/                          # AI Agent 技能 (含 SKILL.md 與輔助工具)
├── scripts/                         # 程式碼與自動化工具
│   └── gas/                         # Google Apps Script 專案
│       ├── line-bots/               # LINE 訊息整合與自動化服務
│       └── utilities/               # 資料表、雲端硬碟等批次工具
├── AGENTS.md                        # Agent 遵循準則、Metadata 規範與維護標準
└── README.md                        # 倉庫主說明文件與快速索引
```

---

## 📑 資源索引目錄

### 1. 提示詞與 Gemini Gems 庫 (Prompts)

| ID | 名稱 | 類別 | 目標平台 / 模型 | 最新版本 | 檔案路徑 | 說明 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `python-ml-tutor` | Python & ML 零基礎學習導師 | 教育 / 程式 | Gemini Gem / 2.0 Flash | `v1.0.0` | [`prompts/python-ml-tutor.md`](prompts/python-ml-tutor.md) | 為零基礎自學者拆解 ML 程式碼與語法原理 |
| `shadowing-coach` | Shadowing（跟讀）教練 | 語言學習 | Gemini Gem / 2.0 Flash | `v1.1.0` | [`prompts/shadowing-coach.md`](prompts/shadowing-coach.md) | 英文跟讀口說訓練、多益10+核心與主題延伸單字、文法深度舉一反三與發音糾錯 |
| `toeic-golden-lecture` | TOEIC 金色證書講義生成 | 語言學習 | General / Pro | `v2.5.0` | [`prompts/toeic-golden-lecture.md`](prompts/toeic-golden-lecture.md) | 依據多益題庫與句構生成高擬真金色證書講義 |
| `markdown-course-converter`| AI 課程轉 Markdown 筆記 | 內容轉化 | General / 1.5 Pro | `v1.1.0` | [`prompts/markdown-course-converter.md`](prompts/markdown-course-converter.md) | 將線上課程文字重組為高結構化 Markdown 筆記 |
| `markdown-course-auditor` | 課程講義審核校對與修訂 | 內容審核 | General / 2.0 Flash | `v1.1.0` | [`prompts/markdown-course-auditor.md`](prompts/markdown-course-auditor.md) | 深度稽核講義疏漏、技術錯誤與術語規範並產出訂正改寫版 |
| `exam-question-to-handout` | 考古題轉自足式精讀講義 | 考試 / 教育 | General / Flash & Pro | `v1.0.0` | [`prompts/exam-question-to-handout.md`](prompts/exam-question-to-handout.md) | 將題目與選項展開為免查課本之高密度 Markdown 自足式精讀講義 |

---

### 2. Agent 技能組 (Skills)

> 目前收錄適用於各類 Agentic AI 架構的 Skills。

| Skill ID | 技能名稱 | 適用平台 | 版本 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| *(待擴充)* | *持續擴充中* | Antigravity / Agent | - | 歡迎新增專屬 Agent Skill |

---

### 3. Google Apps Script 自動化 (GAS)

| 腳本名稱 | 類別 | 觸發模式 | 關聯服務 | 檔案路徑 |
| :--- | :--- | :--- | :--- | :--- |
| `line-auto-center.js` | 訊息推播 / 服務 | Webhook / DoPost | LINE Messaging API, Sheets | [`scripts/gas/line-bots/line-auto-center.js`](scripts/gas/line-bots/line-auto-center.js) |
| `line-civil-service-account.js` | 帳務 / 業務通知 | Webhook / Trigger | LINE Messaging API | [`scripts/gas/line-bots/line-civil-service-account.js`](scripts/gas/line-bots/line-civil-service-account.js) |

---

## 🔄 版本管理與比對機制

為確保每一版 Prompt 的效果演進可追溯、可對照，本倉庫制定了兩大版本保障機制：

1. **檔案內建 SemVer 與 Changelog 表格**：
   - 每個 Markdown 檔案頂部均有 `version: X.Y.Z` 與 `updated_at`。
   - 檔案文末皆有 `## 版本歷史與變更記錄`，詳細記載每次調優的「修改重點」與「原因」。
2. **歷史版本快照 (Snapshot Archive)**：
   - 當發生重大邏輯調整（Major Update）時，舊版會封存於 `archive/`（例：`archive/python-ml-tutor-v1.0.0.md`），讓使用者不需切換 Git Branch 即可直接開啟雙檔左右並排對照。
3. **Git 歷史追蹤**：
   - 每次版本更新均搭配 Conventional Commits（例如 `update(prompt): refine prompt rules v1.1.0`）。

---

## 🛠️ 規格與維護規範

詳細的 YAML Frontmatter 定義、命名法規、章節結構模板與 AI Agent 協作守則，請參閱：
👉 **[AGENTS.md](AGENTS.md)**

---

## 📄 授權與聲明

本專案採用 [MIT License](LICENSE) 授權開源。歡迎自由引用、修改與分享。
