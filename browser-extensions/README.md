# 🧩 瀏覽器擴充套件庫 (Browser Extensions)

> 本目錄收錄專為提升日常工作效率、語言學習與自動化輔助所開發的 **Google Chrome 擴充套件 (Manifest V3)**。

---

## 📑 套件索引目錄 (Extensions Index)

| 套件 ID (目錄名稱) | 套件名稱 | 核心類別 | 最新版本 | 適用平台 / 架構 | 說明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [`cambridge-dictionary-lookup`](cambridge-dictionary-lookup/README.md) | 劍橋雙解詞典快速查詢 | 語言學習 / 閱讀輔助 | `v1.0.0` | Chrome MV3 (Service Worker) | 選取網頁文字後點擊右鍵選單，快速直達劍橋官方繁體中文雙解詞典查詢釋義與例句。 |
| [`anti-logout-assistant`](anti-logout-assistant/README.md) | 防登出雙模式助手 | 工作生產力 / 連線維持 | `v2.3.0` | Chrome MV3 (Alarms + Scripting + Observer) | 支援 e等公務園雙軌維持（MutationObserver 0秒即時攔截彈窗、Session 探測）與一般網頁定時自動重整。 |

---

## 🛠️ 開發與維護規範 (Development Guidelines)

所有收錄於 `browser-extensions/` 之擴充套件均須遵循下列標準：

1. **目錄與識別碼命名**：採用 `kebab-case`（如 `cambridge-dictionary-lookup`），避免包含多餘的 `-extension` 綴詞。
2. **規格標準**：全面採用 **Chrome Extensions Manifest V3** 規範，背景處理採用 `background.service_worker`。
3. **版本管理 (SemVer)**：
   - `manifest.json` 中的 `version` 必須採用三碼語意化版本號（如 `1.0.0`、`2.3.0`）。
   - 每次修訂須同步更新個別資料夾內的 `README.md` 表頭與底部的變更日誌 (`Changelog`)。
4. **最小權限原則 (Principle of Least Privilege)**：
   - 僅聲明必要之 `permissions` 與 `host_permissions`。
   - 所有暫存鬧鐘與本機設定於分頁關閉 (`chrome.tabs.onRemoved`) 時必須主動清理，杜絕記憶體洩漏。
5. **標準文件化**：每個套件資料夾內必須具備 `README.md`，包含標準 YAML Frontmatter、安裝步驟、權限聲明與架構說明。

---

## 🚀 快速安裝步驟 (Installation)

1. 開啟 Chrome 瀏覽器並造訪 `chrome://extensions/`。
2. 開啟右上角**「開發人員模式」**。
3. 點選**「載入未封裝項目」**，選取各擴充套件之個別子目錄（例如 `browser-extensions/anti-logout-assistant`）即可啟用。
