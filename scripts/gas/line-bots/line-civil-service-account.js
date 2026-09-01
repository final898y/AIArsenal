/**
 * @file line-civil-service-account.js
 * @description LINE 公務帳號自動回覆機器人（具備上下班時間與週末自動判斷、緊急聯絡資訊提示）
 * @version 1.0.0
 * @author ai-arsenal
 * @trigger Webhook (doPost)
 * 
 * 必要 Script Properties (專案設定 -> 指令碼屬性):
 * - LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging API Token
 * 
 * 關聯服務:
 * - LINE Messaging API
 * - Google Apps Script Utilities (時區處理)
 */

// 讀取 Channel Access Token
const props = PropertiesService.getScriptProperties();
const CHANNEL_ACCESS_TOKEN = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '';

/**
 * LINE Webhook 進入點（函數名稱不可變更）
 */
function doPost(e) {
  try {
    // 防錯：檢查 request postData 是否存在
    if (!e || !e.postData || !e.postData.contents) {
      return createSuccessResponse();
    }

    const json = JSON.parse(e.postData.contents);
    const events = json.events;

    // 防錯：處理 LINE Verify 測試連線（events 為空陣列）
    if (!events || events.length === 0) {
      return createSuccessResponse();
    }

    const event = events[0];

    // 僅處理「使用者傳送文字訊息」事件（忽略貼圖、圖片、退群等）
    if (event.type !== 'message' || !event.message || event.message.type !== 'text') {
      return createSuccessResponse();
    }

    const replyToken = event.replyToken;
    if (!replyToken) {
      return createSuccessResponse();
    }

    const now = new Date();
    const timeString = getTaiwanTimeString(now);
    let messageText = '';

    // 判斷是否為上班時間（週一至週五 08:00–17:00）
    if (isWorkingHours(now)) {
      messageText = 
`您好！
本帳號為新竹市政府產業發展處生態保育科，賴俊辰承辦之公務帳號。
目前時間：${timeString}

收到您的訊息，我會儘速檢視並依序回覆，請您稍加等待。

如有緊急需求，請撥打專線電話：(03) 521-6121 #405 或 0919-970-243，謝謝！`;
    } else {
      messageText = 
`您好！
本帳號為新竹市政府產業發展處生態保育科，賴俊辰承辦之公務帳號。
目前時間：${timeString}（非上班時間）

您的訊息已成功送出，將於下一個工作天的上班時間（週一至週五 08:00–17:00）統一處理與回應。

如有緊急需求，請於上班時間撥打專線電話：(03) 521-6121 #405 或 0919-970-243，謝謝！`;
    }

    // 發送回應
    replyMessage(replyToken, messageText);

  } catch (error) {
    // 紀錄例外 Log 供排錯，並確保依然回傳 200 給 LINE
    Logger.log("Error in doPost: " + error.toString());
  }

  return createSuccessResponse();
}

/**
 * 判斷是否為上班時間（週一至週五 08:00 - 17:00）
 * 使用 GAS 内建 Utilities 避免伺服器跨國時區偏差
 */
function isWorkingHours(date) {
  const timeZone = "Asia/Taipei";
  
  // 取得星期幾：1 (Mon) - 7 (Sun)
  const dayOfWeek = parseInt(Utilities.formatDate(date, timeZone, "u"), 10);
  
  // 取得小時與分鐘 HHmm (例：0800, 1659, 1700)
  const currentTime = parseInt(Utilities.formatDate(date, timeZone, "HHmm"), 10);

  // 1. 判斷週末 (6 = 週六, 7 = 週日)
  if (dayOfWeek === 6 || dayOfWeek === 7) {
    return false;
  }

  // 2. 判斷時間是否在 08:00 (0800) 到 16:59 (1659) 之間
  // 滿 17:00 (1700) 即算下班時間
  if (currentTime >= 800 && currentTime < 1700) {
    return true;
  }

  return false;
}

/**
 * 格式化台灣時間字串 (例：2026/08/30 (週日) 20:56)
 */
function getTaiwanTimeString(date) {
  const timeZone = "Asia/Taipei";
  const days = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'];
  
  const dayOfWeek = parseInt(Utilities.formatDate(date, timeZone, "u"), 10);
  const formattedDate = Utilities.formatDate(date, timeZone, "yyyy/MM/dd");
  const formattedTime = Utilities.formatDate(date, timeZone, "HH:mm");

  return `${formattedDate} (${days[dayOfWeek]}) ${formattedTime}`;
}

/**
 * 發送 LINE Reply Message API
 */
function replyMessage(replyToken, text) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const payload = {
    replyToken: replyToken,
    messages: [{ type: 'text', text: text }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // 防止 LINE API 報錯直接砸毀腳本
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  
  if (responseCode !== 200) {
    Logger.log("LINE Reply Error Code: " + responseCode + ", Response: " + response.getContentText());
  }
}

/**
 * 統一回傳 HTTP 200 給 LINE 伺服器
 */
function createSuccessResponse() {
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
