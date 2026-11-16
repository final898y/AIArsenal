/**
 * 防登出雙模式助手 (Dual-Mode Anti-Logout Assistant)
 *
 * @description Chrome 擴充套件 (Manifest V3) - 背景服務工作線程 (Service Worker)
 * 負責定時連線維持、前端安全防閒置點擊、合成活躍事件與生命週期資源回收。
 * @version 2.2.0
 * @author AIArsenal
 */

const ALARM_PREFIX = "keep_alive_";

// 監聽鬧鐘觸發事件 (Alarms API)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;

  const suffix = alarm.name.replace(ALARM_PREFIX, "");
  const tabId = parseInt(suffix, 10);
  const now = new Date();
  const timeStr = now.toLocaleTimeString();

  if (isNaN(tabId)) {
    console.warn(`[防登出助手] [${timeStr}] 略過非合法分頁鬧鐘: ${alarm.name}`);
    return;
  }

  // 1. 先確認分頁是否仍然存在，避免向已關閉分頁注入腳本
  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch (err) {
    console.log(`[防登出助手] [${timeStr}] 分頁 #${tabId} 已不存在，執行自動清理`);
    cleanupTab(tabId, alarm.name);
    return;
  }

  // 2. 讀取該分頁設定的模式
  const storageKey = `config_${tabId}`;
  const data = await chrome.storage.local.get(storageKey);
  const mode = data[storageKey]?.mode || "elearn";

  console.log(
    `%c[防登出助手 觸發]%c [${timeStr}] 分頁 #${tabId}（${tab.title || "未知標題"}） | 模式: ${mode === "elearn" ? "e等公務園專用" : "一般網頁重整"}`,
    "background: #1a73e8; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;",
    "color: auto;"
  );

  if (mode === "elearn") {
    // 模式一：e等公務園專用模式（Session 探測 + 精準防閒置彈窗關閉 + 活躍事件模擬）
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true }, // 原生穿透所有子框架 (跨域 SCORM/影音)
        func: () => {
          const isTop = window === window.top;
          const frameLabel = isTop ? "頂層框架" : `子框架 (${window.location.pathname})`;
          const frameTime = new Date().toLocaleTimeString();

          const resultPayload = {
            isTop,
            frameLabel,
            frameUrl: window.location.href,
            pingStatus: null,
            pingError: null,
            clickedButton: null,
            eventDispatched: false,
          };

          // --- A. 僅由頂層框架向後端發送 Ping，避免多框架重複轟炸 ---
          if (isTop) {
            const pingUrl = `${window.location.origin}/online/online.php?_t=${Date.now()}`;
            fetch(pingUrl, {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            })
              .then((res) => {
                resultPayload.pingStatus = res.status;
                console.log(
                  `%c[防登出助手]%c [${frameTime}] [${frameLabel}] online.php 維持成功 (HTTP ${res.status})`,
                  "color: #1a73e8; font-weight: bold",
                  "color: auto"
                );
              })
              .catch((err) => {
                resultPayload.pingError = err.message;
                console.warn(
                  `%c[防登出助手]%c [${frameTime}] [${frameLabel}] Session 探測失敗:`,
                  "color: #dc3545; font-weight: bold",
                  "color: auto",
                  err
                );
              });
          }

          // --- B. 判斷元素是否真實可見 (避免誤點隱藏元素) ---
          const isElementVisible = (el) => {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              style.opacity === "0"
            ) {
              return false;
            }
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          };

          // --- C. 精準比對閒置彈窗確認按鈕 (防範誤點送出/交卷/登出) ---
          try {
            const safeKeywords = [
              "確定",
              "繼續",
              "延長",
              "知道了",
              "繼續上課",
              "延長連線",
              "確定延長",
            ];
            const dangerKeywords = [
              "登出",
              "交卷",
              "送出",
              "刪除",
              "放棄",
              "取消",
              "離開",
              "結束",
            ];

            const clickableElements = document.querySelectorAll(
              'button, input[type="button"], input[type="submit"], a, div[role="button"]'
            );

            for (const el of clickableElements) {
              if (!isElementVisible(el)) continue;

              const text = (el.textContent || el.value || "").trim();
              if (!text) continue;

              // 若包含危險字詞，絕對跳過
              if (dangerKeywords.some((danger) => text.includes(danger))) continue;

              // 檢查文字是否符合安全關鍵字
              const isMatch = safeKeywords.some(
                (keyword) => text === keyword || text.includes(keyword)
              );

              if (isMatch) {
                const isInModal = !!el.closest(
                  '.modal, .dialog, [role="dialog"], [role="alertdialog"], .alert, .swal2-container, .layui-layer, .fancybox-wrap, #idleDialog'
                );
                const pageHasIdleAlert =
                  /閒置|逾時|尚未操作|連線中斷|即將登出|自動登出|延長學習/.test(
                    document.body.innerText
                  );

                if (isInModal || pageHasIdleAlert) {
                  el.click();
                  resultPayload.clickedButton = text;
                  console.log(
                    `%c[防登出助手]%c [${frameTime}] [${frameLabel}] 成功自動點擊閒置確認按鈕：「${text}」`,
                    "color: #28a745; font-weight: bold",
                    "color: auto"
                  );
                  break;
                }
              }
            }
          } catch (e) {
            // 忽略 DOM 查詢異常
          }

          // --- D. 派發原生活躍事件 (重置前端防閒置監聽器) ---
          try {
            ["mousemove", "keydown", "scroll"].forEach((evtName) => {
              window.dispatchEvent(new Event(evtName, { bubbles: true }));
              document.dispatchEvent(new Event(evtName, { bubbles: true }));
            });
            resultPayload.eventDispatched = true;
          } catch (e) {}

          return resultPayload;
        },
      },
      (results) => {
        // 在 Service Worker 背景主控台輸出結構化執行報告
        if (chrome.runtime.lastError) {
          console.warn(
            `[防登出助手] [${timeStr}] 注入腳本異常:`,
            chrome.runtime.lastError.message
          );
          chrome.tabs.get(tabId, (t) => {
            if (chrome.runtime.lastError || !t) {
              cleanupTab(tabId, alarm.name);
            }
          });
          return;
        }

        const frameCount = results ? results.length : 0;
        let anyClicked = null;
        if (results) {
          for (const item of results) {
            if (item?.result?.clickedButton) {
              anyClicked = item.result.clickedButton;
              break;
            }
          }
        }

        console.groupCollapsed(
          `%c[執行報告]%c [${timeStr}] 分頁 #${tabId} | 掃描 ${frameCount} 個框架${anyClicked ? ` | 已點擊「${anyClicked}」` : " | 無閒置彈窗"}`,
          "color: #28a745; font-weight: bold;",
          "color: auto;"
        );
        console.log("分頁資訊:", tab.title, `(${tab.url})`);
        console.log("鬧鐘名稱:", alarm.name);
        console.log("各框架回報明細:", results?.map((r) => r?.result));
        console.groupEnd();
      }
    );
  } else {
    // 模式二：一般網頁（整頁重新整理）
    chrome.tabs.reload(tabId, {}, () => {
      if (chrome.runtime.lastError) {
        chrome.tabs.get(tabId, (t) => {
          if (chrome.runtime.lastError || !t) {
            cleanupTab(tabId, alarm.name);
          }
        });
      } else {
        console.log(`%c[防登出助手]%c [${timeStr}] 分頁 #${tabId} 已成功執行重新整理`, "color: #28a745", "color: auto");
      }
    });
  }
});

// 當分頁載入完成時，維持工具列圖示狀態徽章 (Badge)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    const alarmName = ALARM_PREFIX + tabId;
    const existingAlarm = await chrome.alarms.get(alarmName);
    if (existingAlarm) {
      const data = await chrome.storage.local.get(`config_${tabId}`);
      const mode = data[`config_${tabId}`]?.mode || "elearn";
      const badgeText = mode === "elearn" ? "E-ON" : "R-ON";
      const badgeColor = mode === "elearn" ? "#1a73e8" : "#28a745";

      await chrome.action.setBadgeText({ tabId: tabId, text: badgeText });
      await chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: badgeColor,
      });
    }
  }
});

// 當分頁關閉時，自動清理關聯的鬧鐘與儲存設定
chrome.tabs.onRemoved.addListener((tabId) => {
  cleanupTab(tabId, ALARM_PREFIX + tabId);
});

// 瀏覽器啟動時，清理無效的幽靈鬧鐘 (Ghost Alarms)
chrome.runtime.onStartup.addListener(async () => {
  const allAlarms = await chrome.alarms.getAll();
  for (const alarm of allAlarms) {
    if (alarm.name.startsWith(ALARM_PREFIX)) {
      const tabId = parseInt(alarm.name.replace(ALARM_PREFIX, ""), 10);
      try {
        await chrome.tabs.get(tabId);
      } catch (e) {
        cleanupTab(tabId, alarm.name);
      }
    }
  }
});

function cleanupTab(tabId, alarmName) {
  console.log(`[清理] 分頁 ${tabId} 已關閉或失效，清除鬧鐘與設定`);
  chrome.alarms.clear(alarmName);
  chrome.storage.local.remove(`config_${tabId}`);
}
