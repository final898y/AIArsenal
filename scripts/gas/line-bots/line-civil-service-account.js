/**
 * @file line-civil-service-account.js
 * @description LINE 公務帳號自動回覆機器人（全 Flex Message 介面、前後綴指令觸發、路燈座標高速檢索、一鍵複製剪貼簿、公務專業排版、上下班時間自動判斷）
 * @version 2.2.2
 * @author ai-arsenal
 * @trigger Webhook (doPost)
 *
 * 必要 Script Properties (專案設定 -> 指令碼屬性):
 * - LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging API Token
 * - SPREADSHEET_ID (選填): 若腳本為獨立專案 (Standalone) 時必填；若為試算表容器綁定 (Container-bound) 專案則會自動取得
 *
 * 關聯服務:
 * - LINE Messaging API (含 Clipboard Action 剪貼簿動作)
 * - Google Sheets (SpreadsheetApp - 1150629新竹市路燈清冊總表)
 * - Google Apps Script Utilities (時區處理)
 */

// 讀取 Channel Access Token 與屬性
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

    const rawUserMessage = event.message.text.trim();
    const userMessage = rawUserMessage.toLowerCase();
    const helpCommands = [".help", ".說明", ".指令", ".幫助"];

    let flexMessageObject = null;

    // 1. 觸發 Help 指令
    if (helpCommands.includes(userMessage)) {
      flexMessageObject = getHelpFlexMessage();
    } else if (/^\.路燈/i.test(rawUserMessage)) {
      // 2. 觸發路燈座標查詢指令（支援格式：.路燈 100001 或 .路燈100001）
      const poleId = rawUserMessage.replace(/^\.路燈[\s\u3000]*/i, "").trim();
      if (!poleId) {
        flexMessageObject = getStreetLightGuideFlexMessage();
      } else {
        flexMessageObject = getStreetLightFlexMessage(poleId);
      }
    } else {
      // 3. 自動判斷上班/下班時間
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
                text: "• 山坡地開發水土保持案件申請\n• 山坡地違規案件通報\n• 山坡地道路兩側路樹修剪\n• 路燈座標快速查詢（指令：.路燈 編號）",
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
 * 輔助函數：智慧取得路燈工作表（容錯防呆）
 */
function getStreetLightSheet(ss) {
  if (!ss) return null;

  // 1. 優先精準名稱比對
  let sheet = ss.getSheetByName("1150629新竹市路燈清冊總表");
  if (sheet) return sheet;

  // 2. 忽略頭尾空白或換行符比對
  const sheets = ss.getSheets();
  sheet = sheets.find(
    (s) => s.getName().trim() === "1150629新竹市路燈清冊總表",
  );
  if (sheet) return sheet;

  // 3. 關鍵字模糊比對（包含「路燈清冊」或「路燈」）
  sheet = sheets.find(
    (s) => s.getName().includes("路燈清冊") || s.getName().includes("路燈"),
  );
  if (sheet) return sheet;

  // 4. 若試算表只有單一頁籤，則直接採用
  if (sheets.length === 1) return sheets[0];

  return null;
}

/**
 * 4. 查詢路燈座標資料 (雙層檢索引擎：TextFinder 高速檢索 + 記憶體陣列備用比對)
 *
 * 欄位結構（頁籤：1150629新竹市路燈清冊總表）：
 * - A 欄 (Col 1, Index 0): 路燈編碼
 * - B 欄 (Col 2, Index 1): 燈桿種類
 * - C 欄 (Col 3, Index 2): 所屬鄉鎮
 * - D 欄 (Col 4, Index 3): 所屬村里
 * - E 欄 (Col 5, Index 4): 地址
 * - F 欄 (Col 6, Index 5): TWD97座標X
 * - G 欄 (Col 7, Index 6): TWD97座標Y
 * - H 欄 (Col 8, Index 7): WGS84座標東經 (Lng)
 * - I 欄 (Col 9, Index 8): WGS84座標北緯度 (Lat)
 *
 * @param {string} poleId 路燈編碼
 * @returns {object|null} 查獲時回傳資料物件，發生系統異常時回傳含 error 屬性之物件，查無則回傳 null
 */
function searchStreetLight(poleId) {
  try {
    const spreadsheetId = props.getProperty("SPREADSHEET_ID");
    let ss = null;

    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      Logger.log("getActiveSpreadsheet 異常: " + e.toString());
    }

    if (!ss && spreadsheetId) {
      ss = SpreadsheetApp.openById(spreadsheetId);
    }

    if (!ss) {
      Logger.log("[searchStreetLight] 找不到 Google 試算表實例");
      return {
        error: "尚未取得試算表權限。請在 Apps Script 執行「authorizeSpreadsheet」授權。",
      };
    }

    const sheet = getStreetLightSheet(ss);
    if (!sheet) {
      Logger.log("[searchStreetLight] 找不到工作表頁籤：1150629新竹市路燈清冊總表");
      return {
        error: "找不到「1150629新竹市路燈清冊總表」頁籤，請確認試算表頁籤名稱是否正確。",
      };
    }

    const searchTarget = String(poleId).trim();
    if (!searchTarget) return null;

    let targetRow = null;
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return null;
    }

    // 引擎 1：TextFinder 伺服器端高速檢索
    try {
      const searchRange = sheet.getRange(1, 1, lastRow, 1);
      const cell = searchRange
        .createTextFinder(searchTarget)
        .matchEntireCell(true)
        .findNext();

      if (cell) {
        targetRow = cell.getRow();
      }
    } catch (tfError) {
      Logger.log("[TextFinder 檢索異常，切換至備用引擎]: " + tfError.toString());
    }

    // 引擎 2（備用保險）：若 TextFinder 因格式或數字類型未能命中，直接讀取 A 欄快速線性比對
    if (!targetRow) {
      const colAValues = sheet.getRange(1, 1, lastRow, 1).getValues();
      for (let i = 0; i < colAValues.length; i++) {
        const rawCell = colAValues[i][0];
        const valStr = String(rawCell !== undefined && rawCell !== null ? rawCell : "").trim();
        if (valStr === searchTarget) {
          targetRow = i + 1; // 列號為 1-based
          break;
        }
      }
    }

    if (!targetRow) {
      return null; // 資料表中確實無此編號
    }

    // 讀取該列從第 1 欄 (A 欄) 到第 9 欄 (I 欄) 的數值 (共 9 欄)
    const rowValues = sheet.getRange(targetRow, 1, 1, 9).getValues()[0];

    return {
      poleId: String(rowValues[0] || poleId).trim(),
      poleType: String(rowValues[1] || "").trim(),
      town: String(rowValues[2] || "").trim(),
      village: String(rowValues[3] || "").trim(),
      address: String(rowValues[4] || "").trim(),
      twd97X: String(rowValues[5] !== undefined ? rowValues[5] : "").trim(),
      twd97Y: String(rowValues[6] !== undefined ? rowValues[6] : "").trim(),
      lng: String(rowValues[7] !== undefined ? rowValues[7] : "").trim(),
      lat: String(rowValues[8] !== undefined ? rowValues[8] : "").trim(),
      rowNumber: targetRow,
    };
  } catch (error) {
    Logger.log("searchStreetLight 發生例外錯誤: " + error.toString());
    return { error: error.toString() };
  }
}

/**
 * 5. 取得路燈座標查詢結果 Flex Message
 *
 * 排版規劃（公務專業標準）：
 * 第 1 列：開啟 Google 地圖定位 (翡翠森林綠 #2D6A4F)
 * 第 2 列：Google Maps 路線導航 (Google 導航藍 #1A73E8)
 * 第 3 列：複製 WGS84 座標 (獨立一行)
 * 第 4 列：複製 TWD97 座標 (獨立一行)
 *
 * @param {string} poleId 路燈編號
 * @returns {object} Flex Message 物件
 */
function getStreetLightFlexMessage(poleId) {
  const data = searchStreetLight(poleId);

  if (!data || data.error) {
    return getStreetLightNotFoundFlexMessage(poleId, data ? data.error : null);
  }

  const wgs84Text = `${data.lat}, ${data.lng}`;
  const twd97Text = `${data.twd97X}, ${data.twd97Y}`;
  const locationInfo = [data.town, data.village].filter(Boolean).join(" ");
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.lat + "," + data.lng)}`;
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.lat + "," + data.lng)}`;

  return {
    type: "flex",
    altText: `路燈 [${data.poleId}] 座標查詢結果`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: "新竹市路燈圖資查詢系統",
            weight: "bold",
            color: "#1DB446",
            size: "sm",
          },
          {
            type: "text",
            text: `路燈編號：${data.poleId}`,
            weight: "bold",
            size: "xl",
            margin: "xs",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          // 門牌地址與位置區塊 (若有地址或村里則顯示)
          ...(data.address || locationInfo
            ? [
                {
                  type: "box",
                  layout: "vertical",
                  spacing: "xs",
                  contents: [
                    {
                      type: "text",
                      text: "位置與地址：",
                      weight: "bold",
                      size: "xs",
                      color: "#666666",
                    },
                    {
                      type: "text",
                      text: data.address || locationInfo,
                      size: "sm",
                      color: "#333333",
                      wrap: true,
                      weight: "bold",
                    },
                    ...(locationInfo && data.address
                      ? [
                          {
                            type: "text",
                            text: `${locationInfo} ${data.poleType ? "• " + data.poleType : ""}`.trim(),
                            size: "xs",
                            color: "#888888",
                          },
                        ]
                      : []),
                  ],
                },
                {
                  type: "separator",
                },
              ]
            : []),
          // WGS84 經緯度區塊（點擊該區塊亦可直接複製）
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            action: {
              type: "clipboard",
              clipboardText: wgs84Text,
            },
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "WGS84 經緯度：",
                    weight: "bold",
                    size: "xs",
                    color: "#666666",
                    flex: 4,
                  },
                  {
                    type: "text",
                    text: "[點擊複製]",
                    size: "xxs",
                    color: "#1DB446",
                    align: "end",
                    flex: 3,
                  },
                ],
              },
              {
                type: "text",
                text: wgs84Text,
                weight: "bold",
                size: "md",
                color: "#1E3A8A",
                wrap: true,
              },
              {
                type: "text",
                text: `東經 (Lng): ${data.lng}\n北緯 (Lat): ${data.lat}`,
                size: "xs",
                color: "#888888",
                wrap: true,
              },
            ],
          },
          {
            type: "separator",
          },
          // TWD97 座標區塊（點擊該區塊亦可直接複製）
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            action: {
              type: "clipboard",
              clipboardText: twd97Text,
            },
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "TWD97 座標：",
                    weight: "bold",
                    size: "xs",
                    color: "#666666",
                    flex: 4,
                  },
                  {
                    type: "text",
                    text: "[點擊複製]",
                    size: "xxs",
                    color: "#1DB446",
                    align: "end",
                    flex: 3,
                  },
                ],
              },
              {
                type: "text",
                text: twd97Text,
                weight: "bold",
                size: "md",
                color: "#1E3A8A",
                wrap: true,
              },
              {
                type: "text",
                text: `X (東向 E): ${data.twd97X}\nY (北向 N): ${data.twd97Y}`,
                size: "xs",
                color: "#888888",
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
          // 第 1 列：開啟 Google 地圖定位 (Primary - 翡翠綠)
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "開啟 Google 地圖定位",
              uri: mapUrl,
            },
            color: "#2D6A4F",
          },
          // 第 2 列：Google Maps 路線導航 (Primary - 導航藍)
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "Google Maps 路線導航",
              uri: dirUrl,
            },
            color: "#1A73E8",
          },
          // 第 3 列：複製 WGS84 座標 (獨立一行)
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "clipboard",
              label: "複製 WGS84 座標",
              clipboardText: wgs84Text,
            },
          },
          // 第 4 列：複製 TWD97 座標 (獨立一行)
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "clipboard",
              label: "複製 TWD97 座標",
              clipboardText: twd97Text,
            },
          },
        ],
      },
    },
  };
}

/**
 * 6. 取得查無路燈資料 Flex Message
 *
 * @param {string} poleId 路燈編號
 * @param {string|null} errorMessage 系統錯誤訊息
 */
function getStreetLightNotFoundFlexMessage(poleId, errorMessage) {
  const isSysError = Boolean(errorMessage);

  return {
    type: "flex",
    altText: isSysError ? `系統查詢異常` : `查無路燈編號 [${poleId}] 資料`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: "新竹市路燈圖資查詢系統",
            weight: "bold",
            color: "#E63946",
            size: "sm",
          },
          {
            type: "text",
            text: isSysError ? "系統查詢提示" : "查無路燈資料",
            weight: "bold",
            size: "xl",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: isSysError
              ? `查詢時發生異常，請檢查權限或試算表設定：\n${errorMessage}`
              : `在路燈清冊中查無編號「${poleId}」的資料。`,
            size: "sm",
            color: "#333333",
            wrap: true,
          },
          {
            type: "text",
            text: isSysError
              ? "提示：請在 Apps Script 執行「authorizeSpreadsheet」進行 Google 帳號授權。"
              : "請確認路燈編號是否輸入完整（範例：.路燈 100001），或確認該路燈是否已收錄於總表。",
            size: "xs",
            color: "#888888",
            wrap: true,
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
              label: "查看指令說明",
              text: ".help",
            },
          },
        ],
      },
    },
  };
}

/**
 * 7. 取得路燈查詢格式指引 Flex Message
 */
function getStreetLightGuideFlexMessage() {
  return {
    type: "flex",
    altText: "路燈查詢指令格式說明",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: "新竹市路燈圖資查詢系統",
            weight: "bold",
            color: "#1DB446",
            size: "sm",
          },
          {
            type: "text",
            text: "路燈查詢指令說明",
            weight: "bold",
            size: "xl",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: "請在指令「.路燈」後方加上欲查詢的編號。",
            size: "sm",
            color: "#333333",
            wrap: true,
          },
          {
            type: "text",
            text: "輸入範例：\n.路燈 100001",
            size: "sm",
            weight: "bold",
            color: "#1E3A8A",
            wrap: true,
          },
        ],
      },
    },
  };
}

/**
 * 8. 強制觸發 Google 試算表存取授權的專用函數 (無 try-catch)
 *
 * 【操作指引】：
 * 請在 Apps Script 編輯器頂部函數選單選取「authorizeSpreadsheet」並按下「執行」。
 * 系統必定會跳出「需要授權 (Authorization Required)」彈跳視窗，請點選「審查權限」並「允許」即可！
 */
function authorizeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) {
    Logger.log("[成功] 授權成功！已成功連接試算表: " + ss.getName());
  } else {
    Logger.log("[提示] 專案可能為獨立專案 (Standalone)，請設定 SPREADSHEET_ID 屬性。");
  }
}

/**
 * 9. 自我診斷測試函數 (可在 Apps Script 編輯器中手動執行)
 * 點選上方函數選單「testStreetLightSearch」並按下「執行」，即可在執行紀錄中查看除錯資訊。
 */
function testStreetLightSearch() {
  const testId = "100001"; // 使用截圖中的範例編號
  Logger.log("=== 開始執行路燈查詢自我診斷 ===");
  Logger.log("測試查詢編號: " + testId);

  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log("getActiveSpreadsheet 異常: " + e.toString());
  }

  const spreadsheetId = props.getProperty("SPREADSHEET_ID");
  if (!ss && spreadsheetId) {
    Logger.log("嘗試使用 SPREADSHEET_ID 屬性載入試算表: " + spreadsheetId);
    ss = SpreadsheetApp.openById(spreadsheetId);
  }

  if (!ss) {
    Logger.log("[失敗] 無法取得試算表實例！");
    Logger.log("請先執行「authorizeSpreadsheet」函數完成權限授權。");
    return;
  }
  Logger.log("[成功] 連接試算表: " + ss.getName() + " (ID: " + ss.getId() + ")");

  const sheetNames = ss.getSheets().map((s) => s.getName());
  Logger.log("目前試算表所有頁籤名稱: " + JSON.stringify(sheetNames));

  const sheet = getStreetLightSheet(ss);
  if (!sheet) {
    Logger.log("[失敗] 找不到「1150629新竹市路燈清冊總表」工作表！");
    return;
  }
  Logger.log("[成功] 鎖定目標頁籤: " + sheet.getName());
  Logger.log("資料總列數 (Last Row): " + sheet.getLastRow());

  const sampleRow2 = sheet.getRange(2, 1, 1, 9).getValues()[0];
  Logger.log("第 2 列樣本資料: " + JSON.stringify(sampleRow2));

  const result = searchStreetLight(testId);
  Logger.log("searchStreetLight('" + testId + "') 執行結果: " + JSON.stringify(result));

  if (result && !result.error) {
    Logger.log("[完成] 診斷成功！成功取得 " + testId + " 之 WGS84 與 TWD97 座標資料！");
  } else {
    Logger.log("[警告] 查詢未成功，請確認上述錯誤資訊。");
  }
  Logger.log("=== 診斷結束 ===");
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
