/**
 * @file line-auto-center.js
 * @description LINE 個人自動化中樞（支援台股/美股行情查詢、信用卡結帳/繳款前5天定時推播與回報、社群網址收集自動入庫 Firestore）
 * @version 1.2.0
 * @author ai-arsenal
 * @trigger Webhook (doPost) / HTTP (doGet) / Time-driven (checkCreditCardAlerts)
 *
 * 必要 Script Properties (專案設定 -> 指令碼屬性):
 * - LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging API Token
 * - ALLOWED_USER_ID: 允許操作的個人 LINE User ID
 * - FUGLE_API_KEY: 富果 Fugle 股市行情 API Key
 * - SERVICE_ACCOUNT_KEY: GCP Service Account JSON (具備 Firestore 寫入權限)
 *
 * 關聯服務:
 * - LINE Messaging API (Reply & Push Message)
 * - Google Cloud Firestore
 * - Google Sheet (StockMap 股票代碼對照表、CreditCard 信用卡繳費週期管理)
 * - Fugle Market API (台股行情)
 * - Yahoo Finance API (美股行情)
 * - Google Apps Script CacheService (隨選快取)
 */

/**
 * ==============================================================================
 * 1. 設定檔與環境變數管理
 * ==============================================================================
 */
function getEnv() {
  const props = PropertiesService.getScriptProperties();
  return {
    // LINE Channel Access Token
    LINE_TOKEN: props.getProperty("LINE_CHANNEL_ACCESS_TOKEN") || "",

    // 允許存取的 LINE User ID 白名單
    ALLOWED_USER:
      props.getProperty("ALLOWED_USER_ID") ||
      "U00ef03bc84dd8b1d89e3be7cfda94d43",

    // 富果 Fugle API Key
    FUGLE_KEY: props.getProperty("FUGLE_API_KEY") || "",

    // Firebase / Firestore 設定
    FIREBASE_PROJECT_ID: "travelogue-prod-ebaff",
    FIREBASE_COLLECTION: "trips/MS8NT8KugMSHeunAiAUT/collections",
  };
}

/**
 * ==============================================================================
 * 2. HTTP 進入點 (GET & POST)
 * ==============================================================================
 */

/**
 * 處理 GET 請求 (提供瀏覽器測試與健康檢查)
 */
function doGet(e) {
  return responseText("LINE Webhook Web App 運作正常中！");
}

/**
 * 處理 POST 請求 (接收來自 LINE 的 Webhook 事件)
 */
function doPost(e) {
  // 最外層 Try-Catch 防護，確保無論如何都能回應 HTTP 200 OK 給 LINE
  try {
    // 檢查是否有傳入 postData 內容
    if (!e || !e.postData || !e.postData.contents) {
      return responseText("OK");
    }

    const json = JSON.parse(e.postData.contents);
    const events = json.events;

    // 當在 LINE 控制台按下「Verify」時，events 會是空陣列 []
    if (!events || events.length === 0) {
      return responseText("OK");
    }

    const event = events[0];
    const replyToken = event.replyToken;
    const userId = event.source ? event.source.userId : null;

    // 處理 LINE 官方的測試用 Reply Token (全為 0 或 f)
    if (
      replyToken === "00000000000000000000000000000000" ||
      replyToken === "ffffffffffffffffffffffffffffffff"
    ) {
      return responseText("OK");
    }

    // 權限驗證：確認是否為允許的 User ID
    const env = getEnv();
    if (userId && userId !== env.ALLOWED_USER) {
      replyLineMessage(replyToken, "未經授權的用戶");
      return responseText("OK");
    }

    // 判斷接收到的訊息類型
    if (event.type === "message" && event.message.type === "text") {
      const userText = event.message.text.trim();
      handleTextMessage(replyToken, userText);
    } else {
      replyLineMessage(replyToken, "尚待製作功能");
    }
  } catch (err) {
    Logger.log("doPost 發生例外錯誤: " + err.toString());
  }

  return responseText("OK");
}

/**
 * 輔助函式：回傳純文字 200 OK 格式
 */
function responseText(text) {
  return ContentService.createTextOutput(text).setMimeType(
    ContentService.MimeType.TEXT,
  );
}

/**
 * ==============================================================================
 * 3. 業務邏輯與訊息處理 (Switch)
 * ==============================================================================
 */
function handleTextMessage(replyToken, text) {
  // A. 股票行情查詢 (.tws 或 .stock 開頭)
  if (text.startsWith(".tws") || text.startsWith(".stock")) {
    const rawInput = text.replace(/^(\.tws|\.stock)/i, "").trim();
    if (!rawInput) {
      replyLineMessage(
        replyToken,
        "請輸入股票名稱或代碼，例如：.tws 2330 或 .tws AAPL",
      );
      return;
    }

    let target = null; // 結構: { code: string, market: 'TW' | 'US' }

    // 格式分流 1: 純數字 -> 判定為台股代碼 (免查表直接走台股 API)
    if (/^\d+$/.test(rawInput)) {
      target = { code: rawInput, market: "TW" };
    }
    // 格式分流 2: 1~5 碼英文字母 (含 BRK.B 格式) -> 判定為美股 Ticker (免查表直接走美股 API)
    else if (/^[A-Za-z]{1,5}(\.[A-Za-z])?$/.test(rawInput)) {
      target = { code: rawInput.toUpperCase(), market: "US" };
    }
    // 格式分流 3: 中文或複合名稱 -> 透過隨選即存快取至 Google Sheet 對照表查詢
    else {
      target = lookupStockCodeByName(rawInput);
    }

    if (!target || !target.code) {
      replyLineMessage(replyToken, "查無此股票資料");
      return;
    }

    // 依據市場分流至對應的即時報價服務
    if (target.market === "US") {
      fetchUSStockPriceAndReply(replyToken, target.code);
    } else {
      fetchStockPriceAndReply(replyToken, target.code);
    }
    return;
  }

  // B. 社群網址收集 (Instagram, YouTube, Threads, 一般 HTTP 連結)
  if (
    text.includes("instagram") ||
    text.includes("youtu") ||
    text.includes("threads") ||
    text.startsWith("http")
  ) {
    let source = "other";
    if (text.includes("instagram")) {
      source = "instagram";
    } else if (text.includes("youtu")) {
      source = "youtube";
    } else if (text.includes("threads")) {
      source = "threads";
    }

    // 清除可能帶有的 .tr 指令前綴
    const cleanUrl = text.replace(".tr ", "").trim();

    // 建立符合需求的資料結構
    const record = {
      id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      title: "待補完",
      url: cleanUrl,
      category: "其他",
      source: source,
      createdAt: new Date().toISOString(),
    };

    // 寫入 Firestore 並回覆結果
    const result = saveToFirestore(record);
    if (result.success) {
      replyLineMessage(replyToken, "網址已存入完成。");
    } else {
      replyLineMessage(
        replyToken,
        `寫入失敗 (${result.code})：${result.message}`,
      );
    }
    return;
  }

  // C. 信用卡繳款回報指令 (.paid 銀行名稱)
  if (text.startsWith(".paid")) {
    const targetBank = text.replace(".paid", "").trim();
    if (!targetBank) {
      replyLineMessage(
        replyToken,
        "請輸入要標記已繳費的銀行，例如：.paid 玉山銀行",
      );
      return;
    }

    const result = markCreditCardAsPaid(targetBank);
    if (result && result.success) {
      replyLineMessage(
        replyToken,
        `✅ 已成功登記【${result.bank}】${result.period} 期信用卡已完成繳款！本期將不再發送繳款提醒。`,
      );
    } else {
      replyLineMessage(
        replyToken,
        `⚠️ 找不到【${targetBank}】的信用卡資料，請確認銀行名稱是否與試算表相符。`,
      );
    }
    return;
  }

  // D. 其他未定義訊息
  replyLineMessage(replyToken, "尚待製作功能");
}

/**
 * ==============================================================================
 * 4. Google 官方 Service Account OAuth2 認證與 Firestore 寫入
 * ==============================================================================
 */

/**
 * 依據 Google 官方做法，建立 OAuth2 服務物件
 */
function getFirestoreOAuthService() {
  const serviceAccountKeyString =
    PropertiesService.getScriptProperties().getProperty("SERVICE_ACCOUNT_KEY");

  if (!serviceAccountKeyString) {
    throw new Error(
      "未找到 SERVICE_ACCOUNT_KEY 腳本屬性，請至「專案設定」新增。",
    );
  }

  const serviceAccountKey = JSON.parse(serviceAccountKeyString);
  const CLIENT_EMAIL = serviceAccountKey.client_email;
  const PRIVATE_KEY = serviceAccountKey.private_key;

  // Firestore REST API 所需權限範圍
  const SCOPES = ["https://www.googleapis.com/auth/datastore"];

  return OAuth2.createService("FirestoreServiceAccount")
    .setTokenUrl("https://oauth2.googleapis.com/token")
    .setPrivateKey(PRIVATE_KEY)
    .setIssuer(CLIENT_EMAIL)
    .setPropertyStore(PropertiesService.getScriptProperties())
    .setScope(SCOPES);
}

/**
 * 透過 Service Account 存取 Token 並寫入 Firestore
 */
function saveToFirestore(record) {
  const env = getEnv();

  try {
    const service = getFirestoreOAuthService();

    if (!service.hasAccess()) {
      Logger.log("OAuth2 認證失敗: " + service.getLastError());
      return { success: false, code: 401, message: service.getLastError() };
    }

    const token = service.getAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${env.FIREBASE_COLLECTION}`;

    const payload = {
      fields: {
        id: { stringValue: record.id },
        title: { stringValue: record.title },
        url: { stringValue: record.url },
        category: { stringValue: record.category },
        source: { stringValue: record.source },
        createdAt: { timestampValue: record.createdAt },
      },
    };

    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const resCode = response.getResponseCode();
    const resText = response.getContentText();

    if (resCode === 200 || resCode === 201) {
      Logger.log("Firestore 寫入成功");
      return { success: true };
    } else {
      Logger.log(`Firestore 寫入失敗 [${resCode}]: ${resText}`);
      return { success: false, code: resCode, message: resText };
    }
  } catch (e) {
    Logger.log("saveToFirestore Exception: " + e.toString());
    return { success: false, code: "EX", message: e.toString() };
  }
}

/**
 * ==============================================================================
 * 5. 第三方 API 與工具函式
 * ==============================================================================
 */

/**
 * 呼叫 富果 (Fugle) 行情 API
 */
function fetchStockPriceAndReply(replyToken, stockCode) {
  const env = getEnv();
  const url = `https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/${stockCode}`;

  try {
    const response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: { "X-API-KEY": env.FUGLE_KEY },
      muteHttpExceptions: true,
    });

    const resCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());

    if (resCode === 200 && (result.name || result.code)) {
      const name = result.name || stockCode;
      const lastPrice =
        result.lastPrice ||
        (result.closePrice ? result.closePrice : "無成交價格");
      replyLineMessage(replyToken, `${name}，最新價格為 : ${lastPrice} 元`);
    } else {
      const errCode =
        result.error && result.error.code ? result.error.code : resCode;
      replyLineMessage(replyToken, `出現錯誤 ${errCode}`);
    }
  } catch (e) {
    Logger.log("Fugle API 異常: " + e.toString());
    replyLineMessage(replyToken, "查詢股票 API 時發生錯誤");
  }
}

/**
 * LINE Messaging API：發送回覆訊息
 */
function replyLineMessage(replyToken, text) {
  const env = getEnv();
  const url = "https://api.line.me/v2/bot/message/reply";

  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + env.LINE_TOKEN,
      },
      payload: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: "text", text: text }],
      }),
      muteHttpExceptions: true,
    });
  } catch (e) {
    Logger.log("LINE Reply Error: " + e.toString());
  }
}

/**
 * LINE Messaging API：主動推播訊息 (Push Message)
 * @param {string} userId LINE 使用者 ID (UID)
 * @param {string} text 欲推播的文字訊息
 */
function pushLineMessage(userId, text) {
  const env = getEnv();
  const url = "https://api.line.me/v2/bot/message/push";

  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + env.LINE_TOKEN,
      },
      payload: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text: text }],
      }),
      muteHttpExceptions: true,
    });
  } catch (e) {
    Logger.log("LINE Push Error: " + e.toString());
  }
}

/**
 * 依股票名稱/關鍵字至 Google Sheet ("StockMap") 查詢股票代碼與市場
 * 採用「隨選即存快取 (On-Demand Cache)」機制，避免單一 Key 突破 100KB 上限
 * @param {string} query 查詢關鍵字（公司名稱、別名等）
 * @returns {{ code: string, market: string } | null}
 */
function lookupStockCodeByName(query) {
  if (!query) return null;
  const cleanQuery = query.trim().toUpperCase();
  const cacheKey = "STOCK_QUERY_" + encodeURIComponent(cleanQuery);

  try {
    const cache = CacheService.getScriptCache();

    // 1. 優先從 CacheService 讀取隨選快取
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // 2. 快取未命中 (Cache Miss)，讀取試算表
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("StockMap");
    if (!sheet) {
      Logger.log("找不到名為 StockMap 的工作表");
      return null;
    }

    // 資料欄位定義：A欄: 公司名稱/別名, B欄: 股票代碼, C欄: 市場類別 (TW / US，選填)
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const rowName = String(values[i][0]).trim().toUpperCase();
      const rowCode = String(values[i][1]).trim().toUpperCase();
      const rawMarket = String(values[i][2] || "TW")
        .trim()
        .toUpperCase();

      if (rowName === cleanQuery || rowCode === cleanQuery) {
        // 判斷市場：若欄位含 US / 美股，或是代碼為純英文則視為 US，否則預設為 TW
        const market =
          rawMarket.includes("US") ||
          rawMarket.includes("美") ||
          /^[A-Z]{1,5}$/.test(rowCode)
            ? "US"
            : "TW";
        const result = { code: rowCode, market: market };

        // 3. 查到後單獨快取 6 小時 (21,600 秒)
        cache.put(cacheKey, JSON.stringify(result), 21600);
        return result;
      }
    }
  } catch (e) {
    Logger.log("Stock lookup error: " + e.toString());
  }
  return null;
}

/**
 * 呼叫 Yahoo Finance API 查詢美股即時行情
 * @param {string} replyToken LINE 回覆權杖
 * @param {string} ticker 美股代碼 (如 AAPL, TSLA)
 */
function fetchUSStockPriceAndReply(replyToken, ticker) {
  const cleanTicker = ticker.toUpperCase();
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}?interval=1d&range=1d`;

  try {
    const response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      muteHttpExceptions: true,
    });

    const resCode = response.getResponseCode();
    if (resCode === 200) {
      const json = JSON.parse(response.getContentText());
      const result = json.chart && json.chart.result && json.chart.result[0];
      if (result && result.meta) {
        const meta = result.meta;
        const price = meta.regularMarketPrice;
        const currency = meta.currency || "USD";
        const symbol = meta.symbol || cleanTicker;
        const name = meta.shortName || symbol;
        replyLineMessage(
          replyToken,
          `[美股] ${name} (${symbol})，最新價格為 : ${price} ${currency}`,
        );
        return;
      }
    }

    replyLineMessage(replyToken, `美股標的 [${cleanTicker}] 查無即時報價`);
  } catch (e) {
    Logger.log("美股 API 查詢異常: " + e.toString());
    replyLineMessage(replyToken, "查詢美股行情時發生錯誤");
  }
}

/**
 * ==============================================================================
 * 6. 信用卡排程提醒與繳費狀態管理 (CreditCard Alerts & Payment Tracking)
 * ==============================================================================
 */

/**
 * 每日定時檢查信用卡結帳日與繳款截止日（建議於 GAS 設定時間驅動觸發條件，每日早上 09:00 執行）
 */
function checkCreditCardAlerts() {
  const env = getEnv();
  if (!env.ALLOWED_USER) {
    Logger.log("未設定 ALLOWED_USER_ID，無法推播信用卡提醒");
    return;
  }

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CreditCard");
  if (!sheet) {
    Logger.log("找不到名為 CreditCard 的工作表");
    return;
  }

  const rows = sheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i < rows.length; i++) {
    const bank = String(rows[i][0] || "").trim();
    const billingRaw = String(rows[i][1] || "").trim(); // 例: 每月25號
    const dueRaw = String(rows[i][2] || "").trim(); // 例: 每月10號
    const lastPaidPeriod = String(rows[i][3] || "").trim(); // 例: 2026-10

    if (!bank) continue;

    // 擷取數字 (例如 "每月25號" -> 25)
    const billDay = parseInt(billingRaw.replace(/\D/g, ""), 10);
    const dueDay = parseInt(dueRaw.replace(/\D/g, ""), 10);

    // 1. 檢查結帳日前 5 天
    if (billDay) {
      const billCheck = isDaysRemaining(today, billDay, 5);
      if (billCheck.isMatch) {
        pushLineMessage(
          env.ALLOWED_USER,
          `📢【信用卡結帳日提醒】\n` +
            `銀行：${bank}\n` +
            `結帳日：每月 ${billDay} 號（倒數 5 天結帳）\n` +
            `💡 提醒您：近期大額消費可考慮於結帳日後再刷，以享有最長免息期。`,
        );
      }
    }

    // 2. 檢查繳款截止日前 5 天
    if (dueDay) {
      const dueCheck = isDaysRemaining(today, dueDay, 5);
      if (dueCheck.isMatch) {
        // 取得該繳款截止日所屬的週期 (YYYY-MM)
        const duePeriod = Utilities.formatDate(
          dueCheck.targetDate,
          "Asia/Taipei",
          "yyyy-MM",
        );

        // 若本期已登記繳費，當期靜音不再通知
        if (lastPaidPeriod === duePeriod) {
          Logger.log(`${bank} 本期 (${duePeriod}) 已繳款，略過通知。`);
          continue;
        }

        // 發送繳款提醒，並附帶 .paid 快速回報指令提示
        pushLineMessage(
          env.ALLOWED_USER,
          `💳【信用卡繳款截止提醒】\n` +
            `銀行：${bank}\n` +
            `截止日：每月 ${dueDay} 號（倒數 5 天截止！）\n` +
            `狀態：本期尚未回報繳款\n\n` +
            `👉 若您已繳款，請在 LINE 直接回覆：\n.paid ${bank}`,
        );
      }
    }
  }
}

/**
 * 輔助函式：取得從指定基準日起算，最近一個即將到來的目標日物件 (處理大小月與跨月)
 * @param {Date} baseDate 基準日期物件 (00:00:00)
 * @param {number} targetDay 目標日數字 (1~31)
 * @returns {Date} 目標日 Date 物件
 */
function getUpcomingDate(baseDate, targetDay) {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();

  const getSafeDate = (year, month, day) => {
    const maxDays = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, maxDays));
  };

  const candThisMonth = getSafeDate(y, m, targetDay);
  candThisMonth.setHours(0, 0, 0, 0);

  // 若本月目標日尚未過（>= 今天），即為本月；否則推算至下月
  if (candThisMonth.getTime() >= baseDate.getTime()) {
    return candThisMonth;
  }

  const candNextMonth = getSafeDate(y, m + 1, targetDay);
  candNextMonth.setHours(0, 0, 0, 0);
  return candNextMonth;
}

/**
 * 輔助函式：判斷今天距離下一個指定日是否剛好剩下 N 天
 * @param {Date} today 今日日期物件 (00:00:00)
 * @param {number} targetDay 目標日數字 (1~31)
 * @param {number} daysBefore 倒數天數 (例如 5)
 * @returns {{ isMatch: boolean, targetDate: Date }}
 */
function isDaysRemaining(today, targetDay, daysBefore) {
  const upcomingDate = getUpcomingDate(today, targetDay);
  const diffTime = upcomingDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return {
    isMatch: diffDays === daysBefore,
    targetDate: upcomingDate,
  };
}

/**
 * 將指定銀行的最後繳款月份更新為即將到期之週期 (YYYY-MM)
 * @param {string} bankName 銀行名稱（支援模糊比對）
 * @returns {{ success: boolean, bank: string, period: string } | null}
 */
function markCreditCardAsPaid(bankName) {
  try {
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CreditCard");
    if (!sheet) return null;

    const values = sheet.getDataRange().getValues();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cleanTarget = bankName.trim().toLowerCase();

    for (let i = 1; i < values.length; i++) {
      const rowBank = String(values[i][0] || "").trim();
      const cleanRowBank = rowBank.toLowerCase();

      if (
        cleanRowBank &&
        (cleanRowBank.includes(cleanTarget) ||
          cleanTarget.includes(cleanRowBank))
      ) {
        const dueRaw = String(values[i][2] || "").trim();
        const dueDay = parseInt(dueRaw.replace(/\D/g, ""), 10) || 10;
        // 計算該卡即將到來的繳款日所屬週期 (YYYY-MM)
        const upcomingDueDate = getUpcomingDate(today, dueDay);
        const period = Utilities.formatDate(
          upcomingDueDate,
          "Asia/Taipei",
          "yyyy-MM",
        );

        // 寫入第 D 欄 (第 4 欄: 最後已繳月份)
        sheet.getRange(i + 1, 4).setValue(period);
        return { success: true, bank: rowBank, period: period };
      }
    }
  } catch (e) {
    Logger.log("Mark credit card paid error: " + e.toString());
  }
  return null;
}

/**
 * ==============================================================================
 * 7. 版本歷史與變更記錄 (Changelog)
 * ==============================================================================
 *
 * | 版本 | 日期 | 修改重點 | 調整動機 / 對照說明 |
 * | :--- | :--- | :--- | :--- |
 * | `1.2.0` | 2026-10-02 | 信用卡排程提醒與已繳回報機制 | 實裝 checkCreditCardAlerts 每日排程（結帳日/截止日前5天主動推播）、.paid 繳費回報指令、與當期自動靜音/次月自動復原機制 |
 * | `1.1.0` | 2026-10-02 | 股票查詢分流與隨選快取升級 | 實作輸入格式分流（台股純數字/美股純英文代碼免查表），重構 lookupStockCodeByName 為 On-Demand 快取以防 100KB 上限溢位，並整合美股即時報價 |
 * | `1.0.0` | 2026-09-02 | 初版建立 | 支援 LINE Webhook、富果台股即時報價與 Firestore 社群網址入庫 |
 */
