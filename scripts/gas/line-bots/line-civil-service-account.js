/**
 * @file line-civil-service-account.js
 * @description LINE 公務帳號自動回覆機器人（全 Flex Message 介面、前後綴指令觸發、上下班時間自動判斷）
 * @version 2.0.0
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
const CHANNEL_ACCESS_TOKEN =
  props.getProperty("LINE_CHANNEL_ACCESS_TOKEN") || "";

/**
 * LINE Webhook 進入點（函數名稱不可變更）
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createSuccessResponse();
    }

    const json = JSON.parse(e.postData.contents);
    const events = json.events;

    if (!events || events.length === 0) {
      return createSuccessResponse();
    }

    const event = events[0];

    if (
      event.type !== "message" ||
      !event.message ||
      event.message.type !== "text"
    ) {
      return createSuccessResponse();
    }

    const replyToken = event.replyToken;
    if (!replyToken) {
      return createSuccessResponse();
    }

    const userMessage = event.message.text.trim().toLowerCase();
    const helpCommands = [".help", ".說明", ".指令", ".幫助"];

    let flexMessageObject = null;

    // 1. 觸發 Help 指令
    if (helpCommands.includes(userMessage)) {
      flexMessageObject = getHelpFlexMessage();
    } else {
      // 2. 自動判斷上班/下班時間
      const now = new Date();
      const timeString = getTaiwanTimeString(now);

      if (isWorkingHours(now)) {
        flexMessageObject = getWorkingHoursFlexMessage(timeString);
      } else {
        flexMessageObject = getOffHoursFlexMessage(timeString);
      }
    }

    // 發送 Flex Message
    replyFlexMessage(replyToken, flexMessageObject);
  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
  }

  return createSuccessResponse();
}

/**
 * 1. 取得 Help / 服務說明 Flex Message
 */
function getHelpFlexMessage() {
  return {
    type: "flex",
    altText: "生態保育科公務帳號服務說明",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: "新竹市政府產業發展處生態保育科",
            weight: "bold",
            color: "#1DB446",
            size: "sm",
          },
          {
            type: "text",
            text: "公務帳號服務與查詢指引",
            weight: "bold",
            size: "xl",
            margin: "xs",
            wrap: true,
          },
          {
            type: "text",
            text: "承辦人：賴俊辰",
            size: "xs",
            color: "#888888",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "服務項目",
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: "• 山坡地開發水土保持案件申請\n• 山坡地違規案件通報\n• 山坡地道路兩側路樹修剪",
                size: "sm",
                color: "#666666",
                wrap: true,
              },
            ],
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "服務時間",
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: "週一至週五 08:00–17:00（國定假日除外）",
                size: "sm",
                color: "#666666",
                wrap: true,
              },
            ],
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "緊急聯絡電話",
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: "辦公室：(03) 521-6121 #405",
                size: "sm",
                color: "#666666",
              },
              {
                type: "text",
                text: "公務手機：0919-970-243",
                size: "sm",
                color: "#666666",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "查詢山坡地範圍",
              uri: "https://serv.ardswc.gov.tw/B/",
            },
            color: "#2D6A4F",
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "查詢土地地段地號",
              uri: "https://eghouse.hccg.gov.tw/webgis/",
            },
          },
          {
            type: "button",
            style: "link",
            height: "sm",
            action: {
              type: "uri",
              label: "撥打辦公室電話",
              uri: "tel:035216121,405",
            },
          },
        ],
      },
    },
  };
}

/**
 * 2. 取得上班時間 Flex Message
 */
function getWorkingHoursFlexMessage(timeString) {
  return {
    type: "flex",
    altText: "訊息已收到，將儘速回覆",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: "新竹市政府產業發展處生態保育科",
            weight: "bold",
            color: "#1DB446",
            size: "sm",
          },
          {
            type: "text",
            text: "訊息已成功送出",
            weight: "bold",
            size: "xl",
            margin: "xs",
          },
          {
            type: "text",
            text: "承辦人：賴俊辰",
            size: "xs",
            color: "#888888",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `收到您的訊息，承辦人會儘速檢視並依序回覆，請您稍加等待。`,
            size: "sm",
            color: "#333333",
            wrap: true,
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "接收時間",
                weight: "bold",
                size: "xs",
                color: "#888888",
              },
              {
                type: "text",
                text: timeString,
                size: "sm",
                color: "#666666",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "緊急聯絡：撥打辦公室",
              uri: "tel:035216121,405",
            },
            color: "#2D6A4F",
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "緊急聯絡：撥打公務手機",
              uri: "tel:0919970243",
            },
          },
        ],
      },
    },
  };
}

/**
 * 3. 取得非上班時間 Flex Message
 */
function getOffHoursFlexMessage(timeString) {
  return {
    type: "flex",
    altText: "目前為非上班時間，訊息已記錄",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: "新竹市政府產業發展處生態保育科",
            weight: "bold",
            color: "#E63946",
            size: "sm",
          },
          {
            type: "text",
            text: "目前為非上班時間",
            weight: "bold",
            size: "xl",
            margin: "xs",
          },
          {
            type: "text",
            text: "承辦人：賴俊辰",
            size: "xs",
            color: "#888888",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "您的訊息已成功送出，將於下一個工作天的上班時間（週一至週五 08:00–17:00）統一處理與回應。",
            size: "sm",
            color: "#333333",
            wrap: true,
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "接收時間",
                weight: "bold",
                size: "xs",
                color: "#888888",
              },
              {
                type: "text",
                text: `${timeString}（非上班時間）`,
                size: "sm",
                color: "#666666",
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "message",
              label: "查看服務與查詢指引",
              text: ".help",
            },
          },
          {
            type: "button",
            style: "link",
            height: "sm",
            action: {
              type: "uri",
              label: "上班時間撥打專線",
              uri: "tel:035216121,405",
            },
          },
        ],
      },
    },
  };
}

/**
 * 判斷是否為上班時間（週一至週五 08:00 - 17:00）
 */
function isWorkingHours(date) {
  const timeZone = "Asia/Taipei";
  const dayOfWeek = parseInt(Utilities.formatDate(date, timeZone, "u"), 10);
  const currentTime = parseInt(
    Utilities.formatDate(date, timeZone, "HHmm"),
    10,
  );

  if (dayOfWeek === 6 || dayOfWeek === 7) {
    return false;
  }

  if (currentTime >= 800 && currentTime < 1700) {
    return true;
  }

  return false;
}

/**
 * 格式化台灣時間字串
 */
function getTaiwanTimeString(date) {
  const timeZone = "Asia/Taipei";
  const days = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];

  const dayOfWeek = parseInt(Utilities.formatDate(date, timeZone, "u"), 10);
  const formattedDate = Utilities.formatDate(date, timeZone, "yyyy/MM/dd");
  const formattedTime = Utilities.formatDate(date, timeZone, "HH:mm");

  return `${formattedDate} (${days[dayOfWeek]}) ${formattedTime}`;
}

/**
 * 發送 LINE Flex Message API
 */
function replyFlexMessage(replyToken, flexObject) {
  const url = "https://api.line.me/v2/bot/message/reply";
  const payload = {
    replyToken: replyToken,
    messages: [flexObject],
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + CHANNEL_ACCESS_TOKEN,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    Logger.log(
      "LINE Reply Flex Error Code: " +
        responseCode +
        ", Response: " +
        response.getContentText(),
    );
  }
}

/**
 * 統一回傳 HTTP 200 給 LINE 伺服器
 */
function createSuccessResponse() {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "success" }),
  ).setMimeType(ContentService.MimeType.JSON);
}
