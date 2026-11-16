---
id: "anti-logout-assistant"
title: "防登出雙模式助手 (Dual-Mode Anti-Logout Assistant)"
version: "2.3.0"
type: "extension"
category: "productivity"
tags:
  - chrome-extension
  - auto-refresh
  - keep-alive
  - elearn-hrd
  - mutation-observer
  - background-ping
  - auto-dismiss-dialog
  - productivity
target_platform: "chrome-extension"
author: "AIArsenal"
created_at: "2026-11-16"
updated_at: "2026-11-17"
summary: "支援 e等公務園背景靜默維持（MutationObserver 0秒即時攔截彈窗、Session 探測、原生跨框架穿透）與一般網頁定時自動重整的雙模式防登出 Chrome 擴充套件。"
---

# 防登出雙模式助手 (Dual-Mode Anti-Logout Assistant)

> **摘要與用途說明**
> 專為公務線上數位學習與長時間待命網頁設計的雙模式防登出 Chrome 擴充套件 (Manifest V3)。徹底解決「e等公務園+學習平臺」上課時因閒置逾時被強制登出、影音課程被前端提醒彈窗中斷，或一般公務與後台系統因長時間未操作而 Session 失效的問題。支援**「即時監聽 (0秒攔截) + 定時探測」雙軌防護體系**與整頁重新整理兩種模式。

---

## 1. 雙模式運作機制 (Dual-Mode Operating Mechanisms)

| 模式名稱 | 運作原理 | 適用情境 | 畫面是否重整 | 課程/影片影響 |
| :--- | :--- | :--- | :--- | :--- |
| **e等公務園專用模式** (`elearn`) | **雙軌三重非侵入式安全防護**：<br>1. **即時監聽軌 (0秒攔截)**：分頁載入與啟動時自動掛載 `MutationObserver`，一旦 DOM 動態插入閒置或逾時彈窗，~0 秒（150ms 防抖）立即自動點擊關閉並重置前端活躍計時器。<br>2. **定時探測軌 (後端保活)**：頂層頁面依設定週期向 `/online/online.php` 發送帶憑證之 GET 請求刷新 Session。<br>3. **安全防誤點機制**：具備真實可見度檢查、白名單精準比對與負向危險字詞阻斷（防範誤點送出/交卷/登出）。 | e等公務園線上數位課程學習。 | 否（完全靜默） | 零中斷，徹底阻絕影音播放遭前端彈窗或防掛機確認中斷。 |
| **一般網頁重整模式** (`reload`) | 調用 `chrome.tabs.reload` 對目標分頁執行整頁強制重新整理。 | 差勤系統、公文後台、監控儀表板或一般資訊網頁。 | 是（整頁重整） | 畫面重新載入，維持登入狀態。 |

---

## 2. 核心功能特性 (Key Features)

- **MutationObserver 0 秒即時彈窗攔截 (Zero-latency Modal Interceptor)** ⚡：
  - 在分頁載入完成 (`chrome.tabs.onUpdated`) 或點擊啟動當下，自動穿透向主畫面及所有 `iframe` 掛載 DOM 動態變更監聽器。
  - 無須等待 15 分鐘的定時鬧鐘週期；一旦平臺隨機跳出「防掛機確認」或「逾時提醒」彈窗，0 秒瞬間偵測並模擬點擊關閉。
  - 內建 1 秒點擊防重複冷卻與 150ms 輕量防抖，兼顧零延遲與極低 CPU 資源消耗。
- **原生跨域框架穿透 (Native Cross-Origin Frame Traversal)**：
  - 採用 Chrome 原生 `target: { tabId, allFrames: true }`，完全突破瀏覽器同源政策（Same-Origin Policy）限制，無死角偵測巢狀或外部影音 CDN 內嵌框架中的彈窗。
  - 頂層分頁限制：僅由 `window.top` 發送後端 Ping 請求，避免數個子框架同時發起請求造成伺服器負擔。
- **雙層精準防誤點防護 (Dual-Layer Anti-Misclick Guard)**：
  - **危險關鍵字阻斷**：嚴格過濾包含「登出」、「交卷」、「送出」、「刪除」、「放棄」、「取消」、「離開」、「結束」等操作，避免學員測驗或重要流程遭誤觸發。
  - **安全白名單與情境判定**：嚴格比對確認文字（「確定」、「繼續」、「延長」、「知道了」等），並限制必須處於彈窗容器（Modal/Dialog）內或頁面存在逾時提示時方可點擊。
  - **真實可見度驗證**：檢查 `getComputedStyle` 與元素尺寸，徹底忽略隱藏按鈕。
- **原生活躍事件調度 (Synthetic Activity Events)**：
  - 自動於頁面調度 `mousemove`、`keydown`、`scroll` 等原生活躍事件，直接歸零平臺內部的前端計時器。
- **全方位結構化除錯日誌 (Structured Debug Logging)**：
  - **Service Worker DevTools**：輸出分頁標題、鬧鐘週期與各框架掃描狀態折疊報表。
  - **網頁 Console (F12)**：提供彩色高亮日誌，包含 `[防登出助手 ⚡ 即時攔截]` 即時點擊紀錄。
- **容錯性分頁維護 (Resilient Tab State Handling)**：
  - 課程單元切換或換頁時，先調用 `chrome.tabs.get` 查核分頁實體，不再因瞬時換頁載入錯誤而誤殺使用者的防護鬧鐘排程。
- **生命週期完整清理 (Lifecycle Garbage Collection)**：
  - 包含分頁關閉自動釋放，以及瀏覽器開機啟動 (`chrome.runtime.onStartup`) 清理前次無效工作階段的幽靈鬧鐘 (Ghost Alarms)。

---

## 3. 檔案架構與技術規格 (Architecture & Tech Stack)

```text
anti-logout-assistant/
├── manifest.json         # 套件宣告檔 (Manifest V3)
├── background.js        # 鬧鐘排程、DOM 彈窗偵測、MutationObserver 注入與生命週期維護 (Service Worker)
├── popup.html           # 控制面板介面 (UI 樣式與排版)
├── popup.js             # 面板互動控制邏輯 (狀態切換、完整診斷測試與監聽器掛載)
└── README.md            # 本說明文件
```

### 技術規格
- **Manifest 版本**：Manifest V3
- **後台處理**：Service Worker (`background.js`)
- **API 依賴**：`chrome.alarms`, `chrome.storage.local`, `chrome.tabs`, `chrome.scripting`, `chrome.action`
- **主機權限**：`http://*/*`, `https://*/*`（用於跨站背景注入執行探測與彈窗清理）

---

## 4. 安裝與載入指南 (Installation Guide)

1. 開啟 Google Chrome 或基於 Chromium 架構的瀏覽器（如 Microsoft Edge）。
2. 於網址列輸入 `chrome://extensions/` 並進入擴充功能管理頁面。
3. 開啟右上角**「開發人員模式 (Developer Mode)」**。
4. 點選左上角**「載入未封裝項目 (Load unpacked)」**按鈕。
5. 選取本擴充套件目錄路徑：
   ```text
   d:/MVS/AIArsenal/browser-extensions/anti-logout-assistant
   ```
6. 載入成功後，可將擴充套件圖示釘選 (Pin) 至瀏覽器工具列方便隨時點擊設定。

---

## 5. 權限說明與安全規範 (Permissions & Security)

| 權限項目 (Permission) | 權限用途說明 |
| :--- | :--- |
| `alarms` | 註冊定時觸發計時器，喚醒背景 Service Worker 執行連線維持動作。 |
| `storage` | 儲存各分頁的設定組態（模式類型、執行間隔分鐘數）。 |
| `tabs` | 查詢目前作用中分頁網址、分頁關閉監聽與執行整頁重新整理。 |
| `scripting` | 在 e等公務園模式下向目標分頁注入探測腳本、MutationObserver 與閒置彈窗關閉邏輯。 |
| `host_permissions` | 允許在公務學習網站或目標系統網域下執行安全背景探測與 DOM 操作。 |

---

## 6. 版本歷史與變更記錄 (Changelog & Diff History)

| 版本 | 日期 | 修改重點 | 調整動機 / 對照說明 |
| :--- | :--- | :--- | :--- |
| `2.3.0` | 2026-11-17 | 新增 MutationObserver 0秒即時彈窗攔截與雙向除錯日誌 | 1. 導入 `MutationObserver` 即時 DOM 監聽器，於分頁載入與啟動當下掛載，一旦彈窗出現 0 秒即刻點擊；2. 升級面板「立即測試一次」為全功能即時診斷；3. 補齊 Service Worker 與網頁 Console 雙向結構化彩色除錯日誌。 |
| `2.2.0` | 2026-11-16 | 全面防禦性架構重構與跨框架強化 | 1. 導入危險阻斷字詞與可見度判斷，杜絕誤點交卷/送出/登出按鈕；2. 改用 `allFrames: true` 原生穿透跨域 SCORM 影音框架；3. 注入原生活躍事件重置前端計時器；4. 加入分頁存在性二度驗證防止換頁誤刪鬧鐘；5. 增加瀏覽器啟動時幽靈鬧鐘清理。 |
| `2.1.0` | 2026-11-16 | 新增前端閒置提醒彈窗自動點擊排除與計時器重置 | 增強 e等公務園專用模式：加入框架掃描機制，偵測確認按鈕並模擬點擊。 |
| `2.0.0` | 2026-11-16 | 正式納入知識庫並重構命名 | 資料夾由暫存名稱 `refresh` 規劃更名為 `anti-logout-assistant`，版本號升級為語意化版本 `2.0.0`。 |
| `1.0.0` | 2026-11-01 | 初版實作 | 完成一般重新整理與初階背景保持功能。 |
