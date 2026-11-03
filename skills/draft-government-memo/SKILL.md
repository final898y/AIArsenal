---
name: "draft-government-memo"
id: "draft-government-memo"
title: "政府機關與企業公文簽呈/便簽生成 Skill"
version: "1.0.0"
type: "skill"
category: "productivity"
tags:
  - official-document
  - government-memo
  - administrative-affairs
  - general-affairs
  - productivity
target_platform: "general"
target_models:
  - "gemini-2.5-pro"
  - "gemini-2.0-flash"
  - "gemini-1.5-pro"
author: "ai-arsenal"
created_at: "2026-11-04"
updated_at: "2026-11-04"
summary: "依據政府或企業來函內容，智能研析案情並自動生成結構完整、公文用語精準之「簽」或「便簽」草稿，支援總務派員參訓與列管表單文字生成。"
description: "Drafts formal government/corporate memos ('簽') and informal memos ('便簽') from incoming official letters, notices, or meeting invitations. Automatically structures rationale, disposition options, internal routing, and general-affairs staff dispatch forms. Use when drafting official administrative responses, handling incoming municipal/enterprise notices, assigning training attendees by roster, or converting official mail into standardized memo drafts."
---

# Draft Government Memo (公文簽呈與便簽生成 Skill)

> **摘要與用途說明**
> 專門接收使用者輸入的政府或企業公文（如函、書函、開會通知單、簽呈等），自動判讀來文意旨、公文屬性與涉及權責，精準產出合規之「簽」或「便簽」擬辦草稿。內建「總務派員參訓」專用便簽與單純文字列管表單輸出機制，並支援多情境範例庫按需動態讀取。

---

## 1. 執行流程檢核清單 (Workflow Checklist)

處理公文輸入時，請依循以下檢核清單：

```markdown
- [ ] 步驟 1：解析使用者前置指令（檢查是否指定 `格式：簽/便簽` 或 `套用範例：1/2/3/派員`）。
- [ ] 步驟 2：比對案情情境。若使用者未指定，自動判讀最契合之範例情境：
      • 純轉知/活動資訊 ➔ 參考 examples/pure-notice.md
      • 法規注意事項/宣導 ➔ 參考 examples/regulatory-alert.md
      • 跨科室確認需求/查估 ➔ 參考 examples/cross-dept-consult.md
      • 派員參訓/講習 ➔ 參考 examples/staff-dispatch-training.md
- [ ] 步驟 3：按需讀取對應範例（僅在需要深入對照該類別語氣與擬辦結構時開啟相關檔案）。
- [ ] 步驟 4：萃取來文關鍵要素（發文機關、文號、發文日期、活動時間地點、名額與期限）。
- [ ] 步驟 5：依指定或判斷之格式產出（標準「簽」、標準「便簽」或「派員便簽 + 表單文字」）。
- [ ] 步驟 6：檢查缺漏資訊，於文末附上承辦人必備之「待補資訊/提示」。
```

---

## 2. 外部範例檔案庫架構 (Modular Example System)

本 Skill 採模組化範例設計，將各情境之真實公文案例抽離至獨立檔案中，Gemini 可視任務需求動態讀取，使用者亦可隨時新增 Markdown 檔案至 `examples/` 目錄擴充學習庫：

| 範例代碼 / 檔案 | 適用情境 (Context) | 擬辦處置方向 (Disposition Strategy) |
| :--- | :--- | :--- |
| [`examples/pure-notice.md`](examples/pure-notice.md) | 轉知講座、論壇、藝文活動、高峰會 | 透過 Email/公告轉知同仁知照，文存查 |
| [`examples/regulatory-alert.md`](examples/regulatory-alert.md) | 採購廢棄物清理、廉政倫理、資安注意事項宣導 | 重申法規重點，文存查後傳閱本處/單位同仁 |
| [`examples/cross-dept-consult.md`](examples/cross-dept-consult.md) | 調查各科次年度用地查估、計畫需求、填報調查 | 條列各階段申報期限，會辦各科依限申報後文存查 |
| [`examples/staff-dispatch-training.md`](examples/staff-dispatch-training.md) | 各機關分配名額之專題演講、研習訓練 | 依輪值表指派業務科人員，核給公假，並輸出列管表單文字 |

> **動態擴充指引**：若有新增之公文類型（如：人民陳情案件、專案經費動支、補助款請撥等），直接在 `skills/draft-government-memo/examples/<new-type>.md` 新增範本，並於上表補充說明即可，無需重寫核心指示。

---

## 3. 輸入指令規範 (Input Directives)

使用者可於來文前後輸入參數強制指定行為（優先順序最高）：

1. **格式指定（預設為【簽】）：**
   - `[格式：簽]` 或 `格式：簽` $\to$ 強制產出標準三段式「主旨、說明、擬辦」簽文。
   - `[格式：便簽]` 或 `格式：便簽` $\to$ 強制產出簡要「擬辦」便簽。
2. **指定套用範例/類型（選填）：**
   - `[套用範例：1]` 或 `類型：純轉知` $\to$ 套用純轉知模組。
   - `[套用範例：2]` 或 `類型：注意事項` $\to$ 套用法規注意事項宣導模組。
   - `[套用範例：3]` 或 `類型：會辦確認` $\to$ 套用會辦確認/調查模組。
   - `[套用範例：4]` 或 `類型：派員參訓` $\to$ 套用派員參訓專用便簽及列管表單文字。

---

## 4. 輸出格式標準 (Output Format Standards)

### 4.1 標準【簽】格式
```text
主旨：[一句話精準概括本簽之核心目的與請示事項，維持標準公文語氣]。
說明：
  一、[案情與背景：敘明來文機關、發文字號及主要內容摘述]。
  二、[法規依據與研析：敘明相關法令、權責劃分、過往先例或研擬之辦理方向]。
  三、[具體處置建議：條列後續分工、配合事項、執行期限或發函擬答要點]。
擬辦：[簡明扼要陳述具體擬辦作為，如奉核後文存查、會請相關單位傳閱等]。
```

### 4.2 標準【便簽】格式
```text
擬辦：
一、本件係【說明來文機關及本案主要主旨與核心內容】。
二、【依據來函，條列後續具體應執行之期程、配合步驟、分工或查估要點】。
三、【簡明扼要列出擬採取的核示作為，例如會辦各科後文存查】。
```

### 4.3 總務【派員參訓專用便簽與表單】格式
當來文涉及名額分配派員參訓或使用者指定時，輸出便簽並於下方產出無條列符號之單純分行表單文字（便於直接複製貼上至 Excel/Google Sheets）：

```text
擬辦：
1. 本件係本府[來文機關]通知各單位依參訓名額分配表遴派人員如期參加「[活動名稱]」。
2. 時間為[時間]，在[地點]辦理。
3. 本處參訓名額為[數量]名，依據本處輪值表由本處[科別請承辦人填寫]派員出席，並於[報名期限/方式]完成報名。
4. [生態科特例：若輪值科別為生態科，強制增加此行：「生態科部分依輪值表由汪麗中代表出席。」]
5. 擬由本處[科別請承辦人填寫]派員參加，准予公假[依活動時間長度判定填寫：半日 / 一日]登記，文存查。

---
表單文字：
發文日期：[中華民國YYY年M月D日]
發文字號：[府XX字第XXXXXXXXXX號]
[「活動完整名稱」]
[活動時間與地點完整文字]
```

---

## 5. 缺漏資訊處置指引 (Handling Missing Information)

公文來函常因剪貼缺漏關鍵細節，處理原則如下：
- **發文日期或文號遺漏**：以 `[中華民國YYY年M月D日]`、`[府XX字第XXXXXXXXXX號]` 佔位，不可隨機編造虛擬公文字號。
- **會議時間或地點不明**：在說明段以 `[時間/地點待補充]` 呈現，並於簽文最下方增設：
  ```text
  待補資訊/提示：
  1. 請承辦人確認來文之具體會議/活動時間與地點。
  2. 請填入本處輪值派員之具體科別與出席同仁姓名。
  ```
- **輪值科別判斷**：除非來文有直接指定，否則保持 `[科別由承辦人填寫]` 彈性。若指定為生態科，則務必自動帶入特定出席同仁（如汪麗中同仁）。

---

## 6. 常見錯誤防範清單 (Common Mistakes to Avoid)

| 常見錯誤 (Common Mistakes) | 錯誤範例 | 正確做法 |
| :--- | :--- | :--- |
| **主旨冗長贅字** | 「有關本府轉知某某活動請踴躍報名參加且請查照一案...」 | 精簡為「有關本府轉知『某活動』活動資訊一案，簽請核示。」 |
| **公文層級編號混亂** | 一、 1. (一) 交互錯亂 | 嚴格依序採用：一、 $\to$ (一) $\to$ 1. $\to$ (1) |
| **表單文字帶條列符號** | 表單文字寫成 `1. 發文日期...`、`- 發文字號...` | 派員表單文字必須是「乾淨純文字分行」，無清單標記，便於試算表整行複製 |
| **公假時數推算錯誤** | 活動僅 2 小時卻核給一日公假 | 活動 4 小時以內（半天）核給「半日公假」；超過 4 小時或全天研習核給「一日公假」 |
| **編造虛假公文字號** | 來文無字號時自行填寫 `府勞動字第1150000001號` | 一律使用佔位標籤 `[府XX字第XXXXXXXXXX號]` 並於文末提示 |

---

## 7. 版本歷史與變更記錄 (Changelog & Diff History)

| 版本 | 日期 | 修改重點 | 調整動機 / 對照說明 |
| :--- | :--- | :--- | :--- |
| `1.0.0` | 2026-11-04 | 初始版本發布 | 整理公文簽呈/便簽生成規則，建立模組化範例檢索系統 (examples/)，支援總務派員參訓及表單文字產出。 |
