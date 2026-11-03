---
name: "convert-course-to-markdown"
id: "convert-course-to-markdown"
title: "AI 課程章節轉 Markdown 學習筆記 Skill"
version: "1.0.0"
type: "skill"
category: "education"
tags:
  - markdown
  - note-taking
  - course-converter
  - structured-learning
  - bilingual-glossary
  - metadata
  - obsidian
target_platform: "general"
target_models:
  - "gemini-2.5-pro"
  - "gemini-2.0-flash"
  - "gemini-1.5-pro"
author: "ai-arsenal"
created_at: "2026-11-04"
updated_at: "2026-11-04"
summary: "將線上課程與教材逐字稿轉化為保留 100% 知識細節、自帶標準 YAML Frontmatter、概念定義塊與自測題詳解的 Markdown 筆記。"
description: "Transforms raw, fragmented, or bilingual course materials and lecture transcripts into highly-structured, comprehensive Markdown study notes with standardized YAML frontmatter, concept definitions, comparison tables, and full self-check answers. Use when processing online course chapters (e.g., Coursera, DeepLearning.AI, edX), transcribing video lectures, or converting raw educational content into Obsidian-ready knowledge notes."
---

# Convert Course to Markdown (課程章節轉 Markdown 筆記)

> **摘要與用途說明**
> 專門將線上課程平台（如 Coursera、DeepLearning.AI、edX 等）或影片逐字稿之口語、碎片化素材，轉化為具備結構化知識管理規範的 Markdown 筆記。內建標準 YAML Frontmatter、定義區塊、原生比較表格、公式與程式碼保護、中英雙語對照、延伸概念與自測題詳解。

---

## 1. 執行流程檢核清單 (Workflow Checklist)

處理課程內容時，請依序執行以下檢核步驟：

```markdown
- [ ] 步驟 1：解析來源資訊，提煉並生成合法的 YAML Frontmatter (嚴格使用 `-` 標記列表)。
- [ ] 步驟 2：提取核心精華，撰寫「核心摘要」與 3~5 點「關鍵觀點」。
- [ ] 步驟 3：重構講義正文，100% 完整保留所有細節、公式、程式碼與範例，建立清晰標題階層。
- [ ] 步驟 4：針對核心名詞插入「標準定義區塊」，並於首次出現時提供中英雙語對照。
- [ ] 步驟 5：彙整「相關概念」，提供中英專有名詞與明確關聯說明 (嚴禁捏造虛擬內部路徑)。
- [ ] 步驟 6：設計「自測題與延伸問題」，並於末尾提供「自測題與延伸問題精闢詳解」。
- [ ] 步驟 7：產出「適合輸出內容」與「Key Takeaways (核心要點總結)」。
```

---

## 2. 缺漏資訊處理指引 (Handling Missing Information)

- **若缺少課程名稱或來源連結**：
  - 根據內容主題推導出合適的主題名稱作為 `source`（例如：`"Machine Learning Lecture - Gradient Descent"`）。
  - **嚴格禁止**自行臆測虛構 URL（如 `https://coursera.org/fake-link`），亦嚴格禁止寫死為內部路徑（如 `[[01_Raw/...]]`）。
- **若缺少程式碼或公式上下文**：
  - 若原素材程式碼有省略或不完整，補齊其執行必備之匯入（Import）與關鍵步驟，並以註解清楚說明補充處。
- **若圖片僅有說明文字無圖檔**：
  - 標註 `(Inferred reconstruction from text...)`，並將其概念以條列或 Markdown 比較表格重建。

---

## 3. 格式規範與規則 (Formatting Rules & Guidelines)

### 3.1 YAML Frontmatter 強制規範 (Mandatory YAML Rules)
輸出的 Markdown 開頭必須包含標準 YAML 區塊，且陣列項目**一律使用半形連字號 `-`**，**嚴禁使用星號 `*`**：

```yaml
---
source:
  - "<Course_URL_or_Course_Name_or_File_Name>"
created: YYYY-MM-DD
last_edit_reason: "Initial course lecture transformation"
tags:
  - <domain-tag>
  - <topic-tag>
  - <concept-tag-1>
  - <concept-tag-2>
---
```

- **標籤分類規範 (Tag Taxonomy)**：
  - **Domain Tag（領域標籤，1 個）**：如 `machine-learning`, `deep-learning`, `dev-tools` 等小寫 `kebab-case`。
  - **Topic Tags（主題標籤，1~2 個）**：如 `attention`, `optimization`, `transformer`。
  - **Concept / Method Tags（概念/方法標籤，1~4 個）**：如 `self-attention`, `adamw`, `backpropagation`。

### 3.2 知識完整度與結構 (100% Knowledge Retention)
- **零知識刪減 (No Omission)**：重構並非濃縮。完整保留所有推導步驟、技術細節、例外邊界條件與案例。
- **標題階層**：遵循 `# 主題` $\to$ `## 子模組` $\to$ `### 概念細節`，禁止跨層級跳躍。

### 3.3 核心定義區塊模組 (Definition Blocks)
重要核心專有名詞首次出現時，建立標準引號區塊：
```markdown
> **概念名稱** (Bilingual Term)
> - **定義 (Definition)**：核心嚴謹定義
> - **目的 (Purpose)**：為何需要此技術 / 解決什麼關鍵問題
> - **運作機制 (How it Works)**：具體步驟與運作邏輯
> - **重要性與影響 (Why it Matters)**：對系統效能或理論架構之價值
```

### 3.4 原生 Markdown 優先與視覺規範 (Markdown-First & Mermaid)
- **原生 Markdown 優先原則 (Markdown-First)**：觀念對比、流程步驟與上下游依賴，優先使用 Markdown 比較表格與巢狀清單呈現。
- **Mermaid 限制與相容性**：僅在極度複雜非線性流程時才繪製 Mermaid。繪製時必須使用 ````mermaid```` 圍欄代碼區塊，且節點文字內若含括號或空格，必須強制加雙引號（例如：`id["節點名稱 (註釋)"]`），確保 Obsidian 完美渲染。

### 3.5 程式碼與數學公式
- 數學公式：行內使用 `$...$`，區塊使用 `$$...$$`。
- 程式碼：必須帶有語言標籤（如 ````python````），維持完整縮排與清楚註解。

### 3.6 臺灣繁體中文在地化 (Traditional Chinese Localization)
- 統一採用臺灣慣用繁體中文術語：
  - 程式碼 (Code)、向量 (Vector)、記憶體 (Memory)、除錯 (Debug)、預設 (Default)、最佳化 (Optimization)、網路 (Network)。
- 核心術語首次出現時強制雙語對照，例如：`注意力機制 (Attention Mechanism)`。

---

## 4. 輸出範本 (Output Template)

```markdown
---
source:
  - "{課程連結 URL / 課程名稱與章節 / 原始檔案名稱}"
created: {當前日期 YYYY-MM-DD}
last_edit_reason: "Initial course lecture transformation"
tags:
  - {domain-tag}
  - {topic-tag}
  - {concept-tag-1}
  - {concept-tag-2}
---

# [課程主題 / 章節完整名稱]

## 核心摘要 (Core Summary)
[2~4 句話精準提煉本章核心主題、解決痛點與核心技術]

## 關鍵觀點 (Key Viewpoints)
- [觀點 1：核心結論或技術原理]
- [觀點 2：實作或架構上的關鍵發現]
- [觀點 3：性能權衡或限制]

---

## 講義正文：系統化教學內容 (Lecture Content)

[依據原始素材展開完整教學章節，100% 保留所有內容，結構化組織]

### 1. [第一模組主題]
...
> **[專有名詞] (English Term)**
> - **定義 (Definition)**: ...
> - **目的 (Purpose)**: ...
> - **運作機制 (How it Works)**: ...
> - **重要性 (Why it Matters)**: ...

### 2. [第二模組主題：含比較表格 / 公式 / 程式碼]
...

---

## 相關概念 (Related Concepts)
- **[概念名稱 1 (Bilingual Term)]**：[簡要說明核心定義，以及與本章主題的上下游或互補關聯]
- **[概念名稱 2 (Bilingual Term)]**：[簡要說明核心定義，以及與本章主題的上下游或互補關聯]
- **[概念名稱 3 (Bilingual Term)]**：[簡要說明核心定義，以及與本章主題的上下游或互補關聯]

## 可延伸問題與章節檢驗 (Self-check & Questions)
### Self-check 自測題
1. ...
2. ...
### 延伸探討問題
- [針對實務應用或邊界情境之延伸思考]

## 適合輸出成什麼內容 (Output Recommendations)
- [例如：Wiki 核心條目 / 實作 Lab 腳本 / 技術架構圖]

---

## 💡 自測題與延伸問題精闢詳解 (Answers & Explanations)
> 說明：本區塊為上述自測題與延伸問題提供詳盡解答與思考引導，確保學習者免翻查其他資料即可自足掌握。

### Self-check 自測題解答
1. **第 1 題解答**：
   - **標準答案**：[明確結論]
   - **核心思路剖析**：[解題原理與概念深入剖析]
2. **第 2 題解答**：
   - **標準答案**：...
   - **核心思路剖析**：...

### 延伸探討問題引導思路
- **[延伸問題簡述]**：[提供具體的分析維度、實務考量、技術權衡 (Trade-offs) 或架構選型思考方向]

---

# Key Takeaways (核心要點總結)
- 📌 **要點 1**: ...
- 📌 **要點 2**: ...
- 📌 **要點 3**: ...
```

---

## 5. 常見錯誤防範清單 (Common Mistakes to Avoid)

| 常見錯誤 (Common Mistakes) | 錯誤範例 | 正確做法 |
| :--- | :--- | :--- |
| **YAML 列表符號誤用** | `tags: * machine-learning` | 一律使用 `-`：`tags:\n  - machine-learning` |
| **捏造雙向內部連結** | `[[02_Notes/CNN]]` | 使用中英對照清單與簡述，不臆測使用者筆記庫路徑 |
| **擅自簡化或省略內容** | 只留結論，刪除過程細節與推導 | 保留 100% 知識細節，只重構邏輯編排與排版 |
| **自測題欠缺解答** | 留下自測題目，卻沒有附上答案 | 講義末尾必備「💡 自測題與延伸問題精闢詳解」獨立區塊 |
| **簡體中文詞彙殘留** | 使用「代碼」、「優化」、「矢量」 | 替換為「程式碼」、「最佳化」、「向量」等臺灣慣用語 |
| **Mermaid 節點語法崩潰** | `A[Transformer (Base)]` (未加雙引號) | 節點含括號或空格強制加雙引號：`A["Transformer (Base)"]` |

---

## 6. 版本歷史與變更記錄 (Changelog & Diff History)

| 版本 | 日期 | 修改重點 | 調整動機 / 對照說明 |
| :--- | :--- | :--- | :--- |
| `1.0.0` | 2026-11-04 | 正式重構為 Agent Skill 規格 | 基於 `prompts/markdown-course-converter.md` (v1.2.4)，依照 Google Skills 最佳實踐調整為 Action-oriented Skill 結構，新增 Workflow 清單、防錯表與缺漏資訊處理指南。 |
