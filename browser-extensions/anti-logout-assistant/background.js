/**
 * 防登出雙模式助手 (Dual-Mode Anti-Logout Assistant)
 *
 * @description Chrome 擴充套件 (Manifest V3) - 背景服務工作線程 (Service Worker)
 * 負責定時連線維持、MutationObserver 即時彈窗攔截 (0秒響應)、活躍事件模擬與生命週期資源回收。
 * @version 2.3.0
 * @author AIArsenal
 */

const ALARM_PREFIX = "keep_alive_";

/**
 * 注入至網頁（各框架）的即時防閒置監聽器函式 (MutationObserver)
 * 只要畫面或子框架動態插入閒置對話框，0秒即刻自動點擊確認並派發活躍事件。
 */
function initRealtimeIdleWatcher() {
  if (window.__ANTI_LOGOUT_OBSERVER_ACTIVE__) return;
  window.__ANTI_LOGOUT_OBSERVER_ACTIVE__ = true;

  const isTop = window === window.top;
  const frameLabel = isTop ? "頂層框架" : `子框架 (${window.location.pathname})`;
  let lastClickTime = 0;

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

  const scanAndDismiss = () => {
    // 限制 1 秒內不重複觸發，避免短時間內連點
    if (Date.now() - lastClickTime < 1000) return;

    try {
      const pageText = document.body ? document.body.innerText : "";
      const pageHasIdleAlert =
        /閒置|逾時|尚未操作|連線中斷|即將登出|自動登出|延長學習/.test(pageText);

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
          (kw) => text === kw || text.includes(kw)
        );

        if (isMatch) {
          const isInModal = !!el.closest(
            '.modal, .dialog, [role="dialog"], [role="alertdialog"], .alert, .swal2-container, .layui-layer, .fancybox-wrap, #idleDialog'
          );

          if (isInModal || pageHasIdleAlert) {
            el.click();
            lastClickTime = Date.now();
            console.log(
              `%c[防登出助手 ⚡ 即時攔截]%c [${new Date().toLocaleTimeString()}] [${frameLabel}] 偵測到閒置彈窗，0 秒自動點擊確認按鈕：「${text}」`,
              "background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;",
              "color: auto;"
            );

            // 立即派發原生活躍事件重置前端計時器
            try {
              ["mousemove", "keydown", "scroll"].forEach((evtName) => {
                window.dispatchEvent(new Event(evtName, { bubbles: true }));
                document.dispatchEvent(new Event(evtName, { bubbles: true }));
              });
            } catch (e) {}
            break;
          }
        }
      }
    } catch (e) {
      // 略過異常
    }
  };

  // 1. 初次載入立刻掃描一次
  scanAndDismiss();

  // 2. 掛載 MutationObserver 即時監聽 DOM 動態變更 (150ms 輕量防抖)
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scanAndDismiss, 150);
  });

  const targetNode = document.body || document.documentElement;
  if (targetNode) {
    observer.observe(targetNode, { childList: true, subtree: true });
    console.log(
      `%c[防登出助手]%c [${new Date().toLocaleTimeString()}] [${frameLabel}] MutationObserver 0秒即時監聽器掛載成功 ⚡`,
      "color: #1a73e8; font-weight: bold;",
      "color: auto;"
    );
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
}

/**
 * 向目標分頁（包含所有子框架）注入 MutationObserver 即時監聽器
 * @param {number} tabId 分頁識別碼
 */
async function injectRealtimeWatcher(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      func: initRealtimeIdleWatcher,
    });
  } catch (err) {
    // 分頁可能正在重載或無注入權限
  }
}

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
    // 確保即時監聽器掛載（雙重保險）
    injectRealtimeWatcher(tabId);

    // 模式一：定時維持任務（Session 探測 + 定時 DOM 掃描 + 活躍事件派發）
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
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

          // --- A. 僅由頂層框架向後端發送 Ping ---
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

          // --- B. 判斷元素是否真實可見 ---
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

          // --- C. 比對閒置確認按鈕並執行點擊 ---
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

              if (dangerKeywords.some((danger) => text.includes(danger))) continue;

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
                    `%c[防登出助手]%c [${frameTime}] [${frameLabel}] 定時掃描：成功點擊閒置確認按鈕：「${text}」`,
                    "color: #28a745; font-weight: bold",
                    "color: auto"
                  );
                  break;
                }
              }
            }
          } catch (e) {}

          // --- D. 派發原生活躍事件 ---
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

// 當分頁更新或載入完成時，維持狀態徽章並自動掛載即時監聽器
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

      // 若該分頁為 e等公務園模式，在分頁載入完成時即刻掛載 MutationObserver 0秒即時監聽器
      if (mode === "elearn") {
        injectRealtimeWatcher(tabId);
      }
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
