---
id: "cambridge-dictionary-lookup"
title: "劍橋雙解詞典快速查詢 (Cambridge Dictionary Quick Lookup)"
version: "1.0.0"
type: "extension"
category: "language"
tags:
  - chrome-extension
  - cambridge-dictionary
  - english-learning
  - vocabulary
  - context-menu
target_platform: "chrome-extension"
author: "AIArsenal"
created_at: "2026-11-16"
updated_at: "2026-11-16"
summary: "選取網頁單字後透過滑鼠右鍵選單，快速跳轉至劍橋英語-漢語（繁體）雙解詞典查詢釋義與例句的 Chrome 擴充套件。"
---

# 劍橋雙解詞典快速查詢 (Cambridge Dictionary Quick Lookup)

> **摘要與用途說明**
> 專為英語學習者與高頻閱讀者設計的輕量級 Chrome 擴充套件 (Chrome Extension Manifest V3)。在任何網頁中選取文字後，點擊滑鼠右鍵選單 (Context Menu) 即可一鍵在新分頁開啟劍橋英語-漢語（繁體）官方雙解詞典，省去手動複製貼上、切換分頁與搜尋的繁瑣步驟。

---

## 1. 核心功能特性 (Key Features)

- **滑鼠右鍵選單整合 (Context Menu Integration)**：選取文字時動態顯示「在劍橋詞典中查詢『單字』」，不選取文字時自動隱藏，介面乾淨俐落。
- **字詞清理與正規化 (Text Normalization)**：自動清除選取字串前後之空白字元，並轉為小寫與 URL 編碼 (URL Encoding)，避免搜尋亂碼或空格造成跳轉失敗。
- **直達繁體中文雙解詞典 (Direct Traditional Chinese Route)**：直接定向至劍橋官方繁體中文版介面（`dictionary.cambridge.org/zht/詞典/英語-漢語-繁體/`），提供權威發音、音標、詞性與雙語例句。
- **Manifest V3 現代化規格**：採用非持續性服務工作線程 (Service Worker)，記憶體零常駐負擔。

---

## 2. 檔案架構與技術規格 (Architecture & Tech Stack)

```text
cambridge-dictionary-lookup/
├── manifest.json         # 套件設定檔 (Manifest V3)
├── background.js        # 背景服務工作線程 (Service Worker，負責右鍵選單註冊與分頁開啟)
└── README.md            # 本說明文件
```

### 技術規格
- **Manifest 版本**：Manifest V3
- **後台架構**：Service Worker (`background.js`)
- **API 依賴**：`chrome.contextMenus`, `chrome.tabs`

---

## 3. 安裝與載入指南 (Installation Guide)

1. 開啟 Google Chrome 或基於 Chromium 架構的瀏覽器（如 Microsoft Edge、Brave）。
2. 在網址列輸入 `chrome://extensions/` 並按下 Enter。
3. 開啟右上角的**「開發人員模式 (Developer Mode)」**開關。
4. 點選左上角**「載入未封裝項目 (Load unpacked)」**按鈕。
5. 選擇本專案資料夾路徑：
   ```text
   d:/MVS/AIArsenal/browser-extensions/cambridge-dictionary-lookup
   ```
6. 載入完成後即可在網頁上選取任何英文單字，點擊右鍵體驗快速查詢。

---

## 4. 權限說明 (Permissions Explanation)

| 權限項目 (Permission) | 權限用途說明 |
| :--- | :--- |
| `contextMenus` | 於瀏覽器滑鼠右鍵功能表動態註冊「在劍橋詞典中查詢」選單項目。 |
| `tabs` | 接收選單點擊事件後，調用 `chrome.tabs.create` 於新分頁開啟目標查詢網址。 |

---

## 5. 版本歷史與變更記錄 (Changelog & Diff History)

| 版本 | 日期 | 修改重點 | 調整動機 / 對照說明 |
| :--- | :--- | :--- | :--- |
| `1.0.0` | 2026-11-16 | 正式納入知識庫並重構命名 | 資料夾由 `cambridge-lookup-extension` 規劃更名為 `cambridge-dictionary-lookup`，更新版本號為語意化版本 `1.0.0`，加入重複 ID 清理防護與標準文件規範。 |
