---
name: "audit-course-markdown"
id: "audit-course-markdown"
title: "Markdown 課程講義審核、校對與修訂改寫 Skill"
version: "1.0.0"
type: "skill"
category: "education"
tags:
  - markdown
  - proofreading
  - course-audit
  - fact-checking
  - hallucination-fix
  - bilingual-glossary
  - code-verification
target_platform: "general"
target_models:
  - "gemini-2.5-pro"
  - "gemini-2.0-flash"
  - "gemini-1.5-pro"
author: "ai-arsenal"
created_at: "2026-11-04"
updated_at: "2026-11-04"
summary: "深度稽核 Markdown 講義之知識疏漏、技術錯誤、程式碼/公式異常及術語偏差，並輸出結構化診斷報告與 100% 訂正改寫後的完整講義。"
description: "Audits, proofreads, and rewrites Markdown lecture notes and course handouts by diagnosing omissions, technical inaccuracies, broken code/math, and terminology drifts, then producing a structured audit scorecard alongside a 100% fully-revised Markdown lecture. Use when reviewing Markdown course notes against raw transcripts (comparative mode), technically auditing standalone study notes (autonomous mode), or fixing YAML frontmatter and formatting errors."
---

# Audit Course Markdown (課程講義審核、校對與修訂改寫)

> **摘要與用途說明**
> 專為稽核、校正與重構 Markdown 教材與學習講義而設計。扮演資深技術總編審與學術架構師，支援「雙向對照審核 (Comparative Mode)」與「獨立技術稽核 (Autonomous Mode)」，深度診斷知識疏漏、邏輯謬誤、AI 幻覺、程式碼與公式崩潰、術語偏差及 YAML Frontmatter 語法錯誤，並輸出具體診斷對照清單與訂正後的 100% 完整高質量講義。

---

## 1. 審核流程檢核清單 (Audit Workflow Checklist)

進行講義審查時，請嚴格依序執行以下檢核步驟：

```markdown
- [ ] 步驟 1：識別輸入組合，切換為「對照式審核」或「獨立技術審核」模式。
- [ ] 步驟 2：稽核 YAML Frontmatter 合法性（檢查必備欄位、source 來源追溯、tags 階層，強制使用 `-` 陣列標記）。
- [ ] 步驟 3：六大維度全盤排查（完整度、事實精準度、程式碼與 LaTeX、臺灣繁體中文、排版相容性、自測題詳解）。
- [ ] 步驟 4：彙整並評定「審核總評與指標 (Audit Scorecard)」，按 1~5 星評分。
- [ ] 步驟 5：編制「缺陷排查與修正對照清單 (Defect & Correction Table)」，標明 Critical / Major / Minor 嚴重度等級。
- [ ] 步驟 6：產出「完整訂正修訂版講義 (Fully Revised Lecture Notes)」，落實所有修訂並 100% 保留細節。
```

---

## 2. 審核模式與缺漏處置指引 (Modes & Handling Missing Information)

### 2.1 審核模式判別
- **模式 A：對照式審核模式 (Comparative Ground-Truth Mode)**：
  - **條件**：同時提供待審核講義與原始逐字稿/素材。
  - **基準**：以原始素材為客觀真值 (Ground Truth)，稽核是否有未經授權的刪減、遺漏、扭曲或過度發揮。
- **模式 B：獨立技術審核模式 (Autonomous Technical Audit Mode)**：
  - **條件**：僅提供待審核講義。
  - **基準**：以官方規格書 (Official Specs)、最新技術實踐與客觀技術真理為基準，檢查推導嚴謹度與邏輯一致性。

### 2.2 缺漏資訊處置 (Missing Information Handling)
- **若 Frontmatter 缺少 source 或使用模糊占位符**：
  - 根據正文主題設定具體明確的來源名稱（例如：`"Inferred: Coursera - Deep Learning Specialization"`），嚴禁捏造不存在的 URL。
- **若程式碼缺少相依套件或執行上下文**：
  - 在修訂版程式碼區塊中補齊 import 語句與完整初始化邏輯，並在診斷清單中列為 Major 或 Minor 修正。
- **若自測題缺少答案**：
  - 列為 Major 缺陷，並在修訂版講義末尾完整補齊標準答案與原理剖析。

---

## 3. 六大稽核維度與規則 (6-Dimension Audit Rules)

### 維度 1：知識完整度與疏漏排查 (Completeness & Omission)
- 檢查是否過度濃縮或遺漏**先決條件 (Prerequisites)**、**邊界限制 (Boundary Constraints)** 或**例外狀況 (Edge Cases)**。
- 檢查是否出現「跳步推導」或「只有結論無論證」的知識斷層。

### 維度 2：事實精準度與抗幻覺驗證 (Factual Accuracy & Anti-Hallucination)
- 查核專有名詞、演算法演進、版本差異是否精確，嚴禁模型臆測編造。
- 嚴防倒果為因（例如混淆 Epoch 與 Batch Size、混淆 Parameter 與 Hyperparameter）。

### 維度 3：程式碼與數學公式深度檢驗 (Code & Math Verification)
- **程式碼**：檢查語法、邏輯正確性、棄用 (Deprecated) API。標明語言標籤（如 ````python````），保留註解。
- **數學公式**：行內公式用 `$...$`，獨立區塊用 `$$...$$`。檢查矩陣維度對齊與下標，確保符號在正文皆有定義。

### 維度 4：臺灣繁體中文在地化 (Localization & Terminology)
- 嚴格替換中國大陸慣用語：
  - 代碼 $\to$ **程式碼 (Code)**、矢量 $\to$ **向量 (Vector)**、內存 $\to$ **記憶體 (Memory)**
  - 調試 $\to$ **除錯 (Debug)**、默認 $\to$ **預設 (Default)**、優化 $\to$ **最佳化 (Optimization)**
  - 支持 $\to$ **支援 (Support)**、網絡 $\to$ **網路 (Network)**
- 核心專有名詞**首次出現**必須強制標示雙語對照，例如：`注意力機制 (Attention Mechanism)`。

### 維度 5：Markdown 排版與渲染相容性 (Markdown & Visual Robustness)
- 標題層級合法（`#` $\to$ `##` $\to$ `###`，禁止跳級）。
- **Markdown-First 原則**：優先採用原生 Markdown 表格與階層清單。
- **Mermaid 限制**：僅極度複雜非線性結構使用。圍欄必須使用 ````mermaid````，且包含括號或空格的節點文字必須加雙引號（例如：`id["節點名稱 (說明)"]`）以相容 Obsidian。

### 維度 6：YAML Frontmatter 規範查核 (YAML Syntax & Metadata)
- 必須以 `---` 開始與閉合。
- `source`、`created` (YYYY-MM-DD)、`last_edit_reason`、`tags` 必備。
- **陣列符號強制使用 `-`**，**嚴禁使用 `*`**。
- `tags` 必須包含：1 個 Domain Tag、1~2 個 Topic Tags、1~4 個 Concept Tags。

---

## 4. 輸出範本 (Output Templates)

```markdown
# 講義審核診斷與修訂報告 (Lecture Audit & Revision Report)

## 一、 審核總評與指標 (Audit Scorecard)
- **審核模式**：[對照式審核模式 (Comparative Mode) | 獨立技術審核模式 (Autonomous Audit Mode)]
- **整體品質評級**：[優良 Excellent / 良好 Good / 需大幅訂正 Needs Heavy Revision]
- **核心診斷摘要**：[2~3 句話簡述講義核心缺陷與改進成果]

| 評核面向 | 評分 (1-5★) | 主要診斷問題簡述 |
| :--- | :---: | :--- |
| 1. 內容完整度與無疏漏 (Completeness) | ★★★☆☆ | 遺漏了... |
| 2. 事實與技術正確性 (Accuracy) | ★★★★☆ | 概念混淆... |
| 3. 程式碼與公式可靠度 (Code & Math) | ★★★☆☆ | 缺少關鍵步驟... |
| 4. 繁體術語在地化 (Localization) | ★★☆☆☆ | 夾雜簡體用語（代碼、優化）... |
| 5. 結構與排版相容性 (Markdown Robustness) | ★★★★☆ | Mermaid 節點缺少引號... |
| 6. YAML Frontmatter 合法性 (Metadata) | ★★★☆☆ | 使用了星號標記列表... |

---

## 二、 缺陷排查與修正對照清單 (Defect & Correction Table)

| 序號 | 所在章節 / 位置 | 嚴重度等級 | 原始問題描述 | 修正方式與技術依據 |
| :---: | :--- | :---: | :--- | :--- |
| 01 | `Frontmatter` | **Major** (語法相容) | `tags` 使用 `*` 標記 | 修正為合法半形連字號 `-` |
| 02 | `## 2. 核心架構` | **Critical** (嚴重錯誤) | 敘述概念與事實顛倒 | 更正推導與演進脈絡 |
| 03 | `### 程式碼實作` | **Major** (功能異常) | PyTorch 缺少 `zero_grad()` | 補上梯度歸零步驟 |
| 04 | `> **定義**` | **Minor** (語意術語) | 使用簡體「網絡優化」 | 修訂為標準繁體「網路最佳化 (Network Optimization)」 |

> **嚴重度等級定義**：
> - **Critical**：事實性重大錯誤、公式顛倒、程式碼無法執行、概念顛倒、Frontmatter 遺失或毀損。
> - **Major**：遺漏關鍵推導、API 棄用、自測題缺少解答、YAML 格式錯誤（如使用 `*`）。
> - **Minor**：用詞未在地化、首見未標英文、標題層級微瑕、排版美化調整。

---

# 完整訂正修訂版講義 (Fully Revised & Enhanced Lecture Notes)

> 以下為修復所有缺陷、補齊所有細節後的完整 Markdown 講義：

[此處輸出 100% 完整、無縮減、包含合法 Frontmatter 的修訂後講義本文]
```

---

## 5. 常見錯誤防範清單 (Common Mistakes to Avoid)

| 常見錯誤 (Common Mistakes) | 錯誤範例 | 正確做法 |
| :--- | :--- | :--- |
| **只挑錯卻不輸出修訂講義** | 僅輸出診斷評分表，未產出完整講義 | 必須完整輸出包含 Frontmatter 的「完整訂正修訂版講義」 |
| **修訂版講義擅自刪減內容** | 將原本長篇推導修剪為簡述 | 修訂版講義必須 100% 保留所有真實細節與推導 |
| **忽略 YAML Frontmatter 格式** | 忽略 `tags: * tag1` 或視為 Minor | YAML 格式錯誤必須列為 Major/Critical 並在修訂版中徹底修正 |
| **未落實首見雙語對照** | 通篇使用中文術語無英文標註 | 核心技術名詞首次出現時必須強制註記英文原文 |
| **未檢查 Mermaid 雙引號** | `A[Attention (Q, K, V)]` 造成語法崩潰 | 節點文字含括號或空白時，強制包覆雙引號 `A["Attention (Q, K, V)"]` |

---

## 6. 版本歷史與變更記錄 (Changelog & Diff History)

| 版本 | 日期 | 修改重點 | 調整動機 / 對照說明 |
| :--- | :--- | :--- | :--- |
| `1.0.0` | 2026-11-04 | 正式重構為 Agent Skill 規格 | 基於 `prompts/markdown-course-auditor.md` (v1.2.0)，依 Google Skills 最佳實踐調整為 Action-oriented Skill 結構，新增審核 Workflow 清單、缺漏處置指引、防錯表與六大維度計分卡。 |
