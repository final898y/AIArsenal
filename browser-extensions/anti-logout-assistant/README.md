---
id: "anti-logout-assistant"
title: "防登出雙模式助手 (Dual-Mode Anti-Logout Assistant)"
version: "2.2.0"
type: "extension"
category: "productivity"
tags:
  - chrome-extension
  - auto-refresh
  - keep-alive
  - elearn-hrd
  - background-ping
  - auto-dismiss-dialog
  - productivity
target_platform: "chrome-extension"
author: "AIArsenal"
created_at: "2026-11-16"
updated_at: "2026-11-16"
summary: "支援 e等公務園背景靜默維持（Session 探測、防誤點閒置提醒自動關閉、原生跨框架穿透）與一般網頁定時自動重整的雙模式防登出 Chrome 擴充套件。"
---

# 防登出雙模式助手 (Dual-Mode Anti-Logout Assistant)

> **摘要與用途說明**
> 專為公務線上數位學習與長時間待命網頁設計的雙模式防登出 Chrome 擴充套件 (Manifest V3)。徹底解決「e等公務園+學習平臺」上課時因閒置逾時被強制登出、影音課程被前端提醒彈窗中斷，或一般公務與後台系統因長時間未操作而 Session 失效的問題。支援非侵入式三重防護（後端探測 + 精準彈窗防誤點排除 + 原生活躍事件派發）與整頁重新整理兩種模式。

---

## 1. 雙模式運作機制 (Dual-Mode Operating Mechanisms)

| 模式名稱 | 運作原理 | 適用情境 | 畫面是否重整 | 課程/影片影響 |
| :--- | :--- | :--- | :--- | :--- |
| **e等公務園專用模式** (`elearn`) | **三重非侵入式安全維持**：<br>1. **後端維持**：頂層頁面定時向 `/online/online.php` 發送帶憑證之 GET 請求刷新 Session。<br>2. **彈窗自動關閉**：利用 `allFrames: true` 原生穿透跨域 SCORM 影音框架，具備元素可見度檢查、白名單精準比對與危險阻斷關鍵字過濾（防範誤點送出/交卷/登出）。<br>3. **全域事件重置**：主動調度原生活躍事件 (`mousemove`/`keydown`/`scroll`) 重置平臺前端防閒置監聽器。 | e等公務園線上數位課程學習。 | 否（完全靜默） | 零中斷，徹底阻絕影音播放遭前端彈窗中斷。 |
| **一般網頁重整模式** (`reload`) | 調用 `chrome.tabs.reload` 對目標分頁執行整頁強制重新整理。 | 差勤系統、公文後台、監控儀表板或一般資訊網頁。 | 是（整頁重整） | 畫面重新載入，維持登入狀態。 |

---

## 2. 核心功能特性 (Key Features)

- **原生跨域框架穿透 (Native Cross-Origin Frame Traversal)**：
  - 採用 Chrome 原生 `target: { tabId, allFrames: true }`，完全突破瀏覽器同源政策（Same-Origin Policy）限制，無死角偵測巢狀或外部影音 CDN 內嵌框架中的彈窗。
  - 頂層分頁限制：僅由 `window.top` 發送後端 Ping 請求，避免數個子框架同時發起請求造成伺服器負擔。
- **雙層精準防誤點防護 (Dual-Layer Anti-Misclick Guard)**：
  - **危險關鍵字阻斷**：嚴格過濾包含「登出」、「交卷」、「送出」、「刪除」、「放棄」、「取消」、「離開」、「結束」等操作，避免學員測驗或重要流程遭誤觸發。
  - **安全白名單與情境判定**：嚴格比對確認文字（「確定」、「繼續」、「延長」、「知道了」等），並限制必須處於彈窗容器（Modal/Dialog）內或頁面存在逾時提示時方可點擊。
  - **真實可見度驗證**：檢查 `getComputedStyle` 與元素尺寸，徹底忽略隱藏按鈕。
- **原生活躍事件調度 (Synthetic Activity Events)**：
  - 自動於頁面調度 `mousemove`、`keydown`、`scroll` 等原生活躍事件，直接歸零平臺內部的前端計時器。
- **容錯性分頁維護 (Resilient Tab State Handling)**：
  - 課程單元切換或換頁時，先調用 `chrome.tabs.get` 查核分頁實體，不再因瞬時換頁載入錯誤而誤殺使用者的防護鬧鐘排程。
- **分頁獨立鬧鐘隔離 (Tab-isolated Alarms)**：各分頁以 Tab ID 獨立配置模式與執行間隔（1~120 分鐘），互不干擾。
- **視覺化狀態徽章 (Status Action Badges)**：
  - 藍色 `E-ON`：代表該分頁正在執行 e等公務園背景維持模式。
  - 綠色 `R-ON`：代表該分頁正在執行一般網頁定時重整模式。
- **生命週期完整清理 (Lifecycle Garbage Collection)**：
  - 包含分頁關閉自動釋放，以及瀏覽器開機啟動 (`chrome.runtime.onStartup`) 清理前次無效工作階段的幽靈鬧鐘 (Ghost Alarms)。

---

## 3. 檔案架構與技術規格 (Architecture & Tech Stack)

```text
anti-logout-assistant/
├── manifest.json         # 套件宣告檔 (Manifest V3)
├── background.js        # 鬧鐘排程、DOM 彈窗偵測、事件調度與生命週期維護 (Service Worker)
├── popup.html           # 控制面板介面 (UI 樣式與排版)
├── popup.js             # 面板互動控制邏輯 (狀態切換、測試連線與儲存)
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
| `scripting` | 在 e等公務園模式下向目標分頁注入探測腳本與閒置彈窗關閉邏輯。 |
| `host_permissions` | 允許在公務學習網站或目標系統網域下執行安全背景探測與 DOM 操作。 |

---

## 6. 版本歷史與變更記錄 (Changelog & Diff History)

| 版本 | 日期 | 修改重點 | 調整動機 / 對照說明 |
| :--- | :--- | :--- | :--- |
| `2.2.0` | 2026-11-16 | 全面防禦性架構重構與跨框架強化 | 1. 導入危險阻斷字詞與可見度判斷，杜絕誤點交卷/送出/登出按鈕；2. 改用 `allFrames: true` 原生穿透跨域 SCORM 影音框架；3. 注入原生活躍事件重置前端計時器；4. 加入分頁存在性二度驗證防止換頁誤刪鬧鐘；5. 增加瀏覽器啟動時幽靈鬧鐘清理。 |
| `2.1.0` | 2026-11-16 | 新增前端閒置提醒彈窗自動點擊排除與計時器重置 | 增強 e等公務園專用模式：加入框架掃描機制，偵測確認按鈕並模擬點擊。 |
| `2.0.0` | 2026-11-16 | 正式納入知識庫並重構命名 | 資料夾由暫存名稱 `refresh` 規劃更名為 `anti-logout-assistant`，版本號升級為語意化版本 `2.0.0`。 |
| `1.0.0` | 2026-11-01 | 初版實作 | 完成一般重新整理與初階背景保持功能。 |
