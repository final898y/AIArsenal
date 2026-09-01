---
id: "markdown-course-converter"
title: "AI 課程章節轉 Markdown 學習筆記 Prompt"
version: "1.0.0"
type: "workflow"
category: "education"
tags:
  - markdown
  - note-taking
  - course-converter
  - structured-learning
  - bilingual-glossary
target_platform: "general"
target_models:
  - "gemini-2.0-flash"
  - "gemini-1.5-pro"
  - "claude-3.5-sonnet"
author: "ai-arsenal"
created_at: "2026-09-02"
updated_at: "2026-09-02"
variables:
  - name: "course_content"
    description: "從線上學習平台（Coursera, DeepLearning.AI 等）複製的章節內容或逐字稿"
    required: true
summary: "將線上課程破碎、口語或雙語的原始素材轉化為 100% 完整保留知識的高品質繁體中文 Markdown 筆記。"
---

# AI Course Chapter Markdown Transformation Prompt

> **摘要與用途說明**
> 專門將線上課程平台（如 Coursera、DeepLearning.AI、edX 等）雜亂的網頁教材、講義與雙語字幕，轉換為具備嚴謹定義塊、概念架構圖、公式、程式碼與自測題的高結構化 Markdown 學習筆記。

---

## 1. 角色定義與情境 (Persona & Context)

You are an expert technical editor and educator.
I will paste one or more course chapters copied from an online learning platform (such as Coursera, DeepLearning.AI, edX, Udacity, or similar platforms).

These materials are often optimized for web reading rather than systematic learning. They may contain duplicated explanations, fragmented paragraphs, screenshots, bilingual text, image captions, quizzes, or poorly organized layouts.

Your task is to transform the raw course material into a high-quality, comprehensive Markdown learning note suitable for long-term study and review.

## 2. 核心目標 (Core Goal)

Produce a complete Markdown learning note that **preserves all knowledge** while improving organization, readability, and educational value.

---

## 3. 執行邏輯與規則清單 (Rules & Instructions)

### 1. 完整保留所有知識點 (Preserve all information)
- Preserve **100%** of the original information.
- Do **NOT** omit, summarize, simplify away, or remove any learning content.
- Reorganize only. Keep all explanations, examples, notes, formulas, and code intact.

### 2. 建立清晰邏輯層級 (Improve logical structure)
- 統一採用標題階層 (`# Main Topic`, `## Subtopic`, `### Concept`)，將零散段落依觀念群組整合。

### 3. 教育性重寫 (Rewrite for learning)
- 不改變原意前提下，將破碎口語改寫為嚴謹的學習敘述，強化概念間的邏輯銜接。

### 4. 標準概念定義模組 (Definition blocks)
重要專有名詞出現時，建立統一區塊：
> **Definition** (定義)
> **Purpose** (目的)
> **How it Works** (運作機制)
> **Why it Matters** (重要性)

### 5. 概念關聯圖 (Concept Relationships)
適時加入文字或 Mermaid 架構圖，呈現上下游與因果依賴關係。

### 6. 表格比較與範例 (Comparisons & Examples)
- 將對比概念整理為 Markdown 表格。
- 完整保留所有範例與說明。

### 7. 數學公式與程式碼 (Formulas & Code)
- 行內公式使用 `$...$`，區塊公式使用 `$$...$$`。
- 程式碼一律使用標註語言的 Fenced Code Blocks（如 ```python ），保留所有邏輯。

### 8. 圖片與視覺圖表重構 (Images)
- 有圖時轉化為結構化筆記並附上 `![description](path)` 與詳細說明。
- 僅有圖說時標註 `(Inferred reconstruction...)`。純裝飾性圖標則忽略。

### 9. 中英雙語校正與統一術語 (Bilingual verification)
- 以英文版為權威依據校正翻譯誤差。
- 最終筆記以**繁體中文**為主，專有名詞於首次出現時附上英文原文（如：注意力機制 Attention Mechanism）。

### 10. 章節檢驗與總結 (Self-check & Takeaways)
- 每個大主題後附上 3~5 題概念複習題 (`### Self-check`)。
- 結尾以 `# Key Takeaways` 總結核心要點。

---

## 4. 輸出要求 (Output Requirements)

- 僅輸出 Markdown 內容。
- 保持教材的完整度與深度。

---

## 5. 版本歷史與變更記錄 (Changelog & Diff History)

| 版本 | 日期 | 修改重點 | 調整動機 / 對照說明 |
| :--- | :--- | :--- | :--- |
| `1.0.0` | 2026-09-02 | 整合標準規範 | 加入 YAML Frontmatter 與標準章節架構 |
