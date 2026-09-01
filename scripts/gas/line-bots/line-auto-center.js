/**
 * @file line-auto-center.js
 * @description LINE 個人自動化中樞（支援台股代碼查詢/即時報價、社群網址收集自動入庫 Firestore）
 * @version 1.0.0
 * @author ai-arsenal
 * @trigger Webhook (doPost) / HTTP (doGet)
 * 
 * 必要 Script Properties (專案設定 -> 指令碼屬性):
 * - LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging API Token
 * - ALLOWED_USER_ID: 允許操作的個人 LINE User ID
 * - FUGLE_API_KEY: 富果 Fugle 股市行情 API Key
 * - SERVICE_ACCOUNT_KEY: GCP Service Account JSON (具備 Firestore 寫入權限)
 * 
 * 關聯服務:
 * - LINE Messaging API
 * - Google Cloud Firestore
 * - Google Sheet (工作表名稱: StockMap)
 * - Fugle Market API
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
    LINE_TOKEN: props.getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '',
    
    // 允許存取的 LINE User ID 白名單
    ALLOWED_USER: props.getProperty('ALLOWED_USER_ID') || 'U00ef03bc84dd8b1d89e3be7cfda94d43',
    
    // 富果 Fugle API Key
    FUGLE_KEY: props.getProperty('FUGLE_API_KEY') || '',
    
    // Firebase / Firestore 設定
    FIREBASE_PROJECT_ID: 'travelogue-prod-ebaff',
    FIREBASE_COLLECTION: 'trips/MS8NT8KugMSHeunAiAUT/collections'
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
    if (replyToken === '00000000000000000000000000000000' || replyToken === 'ffffffffffffffffffffffffffffffff') {
      return responseText("OK");
    }

    // 權限驗證：確認是否為允許的 User ID
    const env = getEnv();
    if (userId && userId !== env.ALLOWED_USER) {
      replyLineMessage(replyToken, "未經授權的用戶");
      return responseText("OK");
    }

    // 判斷接收到的訊息類型
    if (event.type === 'message' && event.message.type === 'text') {
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
  return ContentService.createTextOutput(text)
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * ==============================================================================
 * 3. 業務邏輯與訊息處理 (Switch)
 * ==============================================================================
 */
function handleTextMessage(replyToken, text) {
  // A. 股票行情查詢 (.tws 開頭)
  if (text.startsWith('.tws')) {
    const rawInput = text.replace('.tws', '').trim();
    let stockCode = rawInput;

    // 如果非純數字，嘗試從 Google 試算表查詢對應代碼
    if (!/^\d+$/.test(rawInput)) {
      stockCode = lookupStockCodeByName(rawInput);
    }

    if (!stockCode) {
      replyLineMessage(replyToken, "查無此股票資料");
      return;
    }

    fetchStockPriceAndReply(replyToken, stockCode);
    return;
  }

  // B. 社群網址收集 (Instagram, YouTube, Threads, 一般 HTTP 連結)
  if (text.includes('instagram') || text.includes('youtu') || text.includes('threads') || text.startsWith('http')) {
    let source = 'other';
    if (text.includes('instagram')) {
      source = 'instagram';
    } else if (text.includes('youtu')) {
      source = 'youtube';
    } else if (text.includes('threads')) {
      source = 'threads';
    }

    // 清除可能帶有的 .tr 指令前綴
    const cleanUrl = text.replace('.tr ', '').trim();

    // 建立符合需求的資料結構
    const record = {
      id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      title: "待補完",
      url: cleanUrl,
      category: "其他",
      source: source,
      createdAt: new Date().toISOString()
    };

    // 寫入 Firestore 並回覆結果
    const result = saveToFirestore(record);
    if (result.success) {
      replyLineMessage(replyToken, "網址已存入完成。");
    } else {
      replyLineMessage(replyToken, `寫入失敗 (${result.code})：${result.message}`);
    }
    return;
  }

  // C. 其他未定義訊息
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
  const serviceAccountKeyString = PropertiesService.getScriptProperties()
      .getProperty('SERVICE_ACCOUNT_KEY');

  if (!serviceAccountKeyString) {
    throw new Error('未找到 SERVICE_ACCOUNT_KEY 腳本屬性，請至「專案設定」新增。');
  }

  const serviceAccountKey = JSON.parse(serviceAccountKeyString);
  const CLIENT_EMAIL = serviceAccountKey.client_email;
  const PRIVATE_KEY = serviceAccountKey.private_key;

  // Firestore REST API 所需權限範圍
  const SCOPES = ['https://www.googleapis.com/auth/datastore'];

  return OAuth2.createService('FirestoreServiceAccount')
      .setTokenUrl('https://oauth2.googleapis.com/token')
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
        createdAt: { timestampValue: record.createdAt }
      }
    };

    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
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
      muteHttpExceptions: true
    });

    const resCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());

    if (resCode === 200 && (result.name || result.code)) {
      const name = result.name || stockCode;
      const lastPrice = result.lastPrice || (result.closePrice ? result.closePrice : "無成交價格");
      replyLineMessage(replyToken, `${name}，最新價格為 : ${lastPrice} 元`);
    } else {
      const errCode = (result.error && result.error.code) ? result.error.code : resCode;
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
        "Authorization": "Bearer " + env.LINE_TOKEN
      },
      payload: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: "text", text: text }]
      }),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log("LINE Reply Error: " + e.toString());
  }
}

/**
 * 依股票名稱至對應 Google Sheet ("StockMap") 查詢股票代碼
 */
function lookupStockCodeByName(companyName) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("StockMap");
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues(); // A欄: 公司名稱, B欄: 股票代碼
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === companyName) {
        return data[i][1];
      }
    }
  } catch (e) {
    Logger.log("Sheet 對照查詢失敗: " + e.toString());
  }
  return null;
}
