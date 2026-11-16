/**
 * 防登出雙模式助手 (Dual-Mode Anti-Logout Assistant)
 *
 * @description 彈出視窗介面控制邏輯 (Popup Controller)
 * 負責設定模式切換、間隔分鐘調整、即時連線與防閒置彈窗診斷測試、鬧鐘啟動/停止狀態顯示與 0秒監聽器掛載。
 * @version 2.3.0
 * @author AIArsenal
 */

document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggleBtn");
  const testBtn = document.getElementById("testBtn");
  const statusText = document.getElementById("statusText");
  const testResult = document.getElementById("testResult");
  const intervalInput = document.getElementById("interval");
  const modeRadios = document.getElementsByName("mode");

  // 取得目前活躍分頁 (Active Tab)
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  const tabId = tab.id;
  const alarmName = `keep_alive_${tabId}`;

  // 取得目前勾選的模式 (elearn 或 reload)
  function getSelectedMode() {
    for (const radio of modeRadios) {
      if (radio.checked) return radio.value;
    }
    return "elearn";
  }

  // 讀取該分頁先前的設定狀態
  const storageKey = `config_${tabId}`;
  const savedData = await chrome.storage.local.get(storageKey);
  if (savedData[storageKey]) {
    const { mode, interval } = savedData[storageKey];
    intervalInput.value = interval || 15;
    for (const radio of modeRadios) {
      if (radio.value === mode) radio.checked = true;
    }
  } else if (tab.url && tab.url.includes("elearn.hrd.gov.tw")) {
    document.querySelector('input[value="elearn"]').checked = true;
  }

  // 檢查目前鬧鐘是否正在執行
  const existingAlarm = await chrome.alarms.get(alarmName);
  updateUI(!!existingAlarm, savedData[storageKey]?.mode);

  // 【立即測試一次】按鈕事件 (含 Session 探測 + 跨框架自動點擊診斷 + 活躍重置)
  testBtn.addEventListener("click", async () => {
    const selectedMode = getSelectedMode();
    testResult.textContent = "診斷測試執行中...";
    testResult.style.color = "#666";

    if (selectedMode === "elearn") {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId, allFrames: true },
          func: async () => {
            const report = {
              isTop: window === window.top,
              pingOk: false,
              pingStatus: 0,
              pingError: null,
              clickedText: null,
            };

            // 1. 僅頂層框架向後端發送 Session 探測
            if (report.isTop) {
              try {
                const pingUrl = `${window.location.origin}/online/online.php?_t=${Date.now()}`;
                const res = await fetch(pingUrl, {
                  method: "GET",
                  credentials: "include",
                  cache: "no-store",
                });
                report.pingOk = res.ok;
                report.pingStatus = res.status;
              } catch (err) {
                report.pingError = err.message;
              }
            }

            // 2. 判斷元素是否真實可見
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

            // 3. 掃描並點擊閒置確認按鈕
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
                'button, input[type="button"], input[type="submit"], a, div[role="button"]',
              );

              for (const el of clickableElements) {
                if (!isElementVisible(el)) continue;

                const text = (el.textContent || el.value || "").trim();
                if (!text) continue;

                if (dangerKeywords.some((d) => text.includes(d))) continue;

                const isMatch = safeKeywords.some(
                  (kw) => text === kw || text.includes(kw),
                );
                if (isMatch) {
                  const isInModal = !!el.closest(
                    '.modal, .dialog, [role="dialog"], [role="alertdialog"], .alert, .swal2-container, .layui-layer, .fancybox-wrap, #idleDialog',
                  );
                  const pageHasIdleAlert =
                    /閒置|逾時|尚未操作|連線中斷|即將登出|自動登出|延長學習/.test(
                      document.body.innerText,
                    );

                  if (isInModal || pageHasIdleAlert) {
                    el.click();
                    report.clickedText = text;
                    break;
                  }
                }
              }
            } catch (e) {}

            // 4. 派發原生活躍事件重置前端計時器
            try {
              ["mousemove", "keydown", "scroll"].forEach((evtName) => {
                window.dispatchEvent(new Event(evtName, { bubbles: true }));
                document.dispatchEvent(new Event(evtName, { bubbles: true }));
              });
            } catch (e) {}

            return report;
          },
        });

        // 彙整所有框架回傳的診斷結果
        let topResult = null;
        let anyClicked = null;

        for (const frameRes of results) {
          const rep = frameRes?.result;
          if (!rep) continue;
          if (rep.isTop) topResult = rep;
          if (rep.clickedText && !anyClicked) anyClicked = rep.clickedText;
        }

        // 呈現測試回報
        if (topResult && topResult.pingOk) {
          if (anyClicked) {
            testResult.textContent = `✓ 連線成功 (${topResult.pingStatus}) | 已點擊「${anyClicked}」`;
            testResult.style.color = "#28a745";
          } else {
            testResult.textContent = `✓ 連線成功 (${topResult.pingStatus}) | 活躍重置 (無彈窗)`;
            testResult.style.color = "#28a745";
          }
        } else if (topResult && !topResult.pingOk) {
          const errDetail = topResult.pingStatus
            ? `HTTP ${topResult.pingStatus}`
            : topResult.pingError || "未知異常";
          testResult.textContent = `× online.php 異常 (${errDetail})`;
          testResult.style.color = "#dc3545";
        } else {
          testResult.textContent = `✓ 已掃描 ${results.length} 個框架 | 當前無閒置彈窗`;
          testResult.style.color = "#28a745";
        }
      } catch (err) {
        testResult.textContent = `× 測試失敗: 無法在此分頁注入腳本`;
        testResult.style.color = "#dc3545";
      }
    } else {
      // 一般重整模式測試
      await chrome.tabs.reload(tabId);
      testResult.textContent = "✓ 已送出重新整理指令";
      testResult.style.color = "#28a745";
    }
  });

  // 【啟動 / 停止防登出】按鈕事件
  toggleBtn.addEventListener("click", async () => {
    const currentAlarm = await chrome.alarms.get(alarmName);

    if (currentAlarm) {
      await chrome.alarms.clear(alarmName);
      await chrome.action.setBadgeText({ tabId: tabId, text: "" });
      updateUI(false);
    } else {
      const selectedMode = getSelectedMode();
      const interval = Math.max(1, parseInt(intervalInput.value, 10) || 15);

      await chrome.storage.local.set({
        [storageKey]: { mode: selectedMode, interval: interval },
      });

      await chrome.alarms.create(alarmName, {
        periodInMinutes: interval,
      });

      const badgeText = selectedMode === "elearn" ? "E-ON" : "R-ON";
      const badgeColor = selectedMode === "elearn" ? "#1a73e8" : "#28a745";
      await chrome.action.setBadgeText({ tabId: tabId, text: badgeText });
      await chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: badgeColor,
      });

      // 若為 e等公務園模式，啟動當下立刻向當前分頁（全框架）掛載 0秒 MutationObserver 監聽器
      if (selectedMode === "elearn") {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabId, allFrames: true },
            func: () => {
              if (window.__ANTI_LOGOUT_OBSERVER_ACTIVE__) return;
              window.__ANTI_LOGOUT_OBSERVER_ACTIVE__ = true;

              const isTop = window === window.top;
              const frameLabel = isTop ? "頂層框架" : `子框架 (${window.location.pathname})`;
              let lastClickTime = 0;

              const safeKeywords = ["確定", "繼續", "延長", "知道了", "繼續上課", "延長連線", "確定延長"];
              const dangerKeywords = ["登出", "交卷", "送出", "刪除", "放棄", "取消", "離開", "結束"];

              const isElementVisible = (el) => {
                if (!el) return false;
                const style = window.getComputedStyle(el);
                if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
                  return false;
                }
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
              };

              const scanAndDismiss = () => {
                if (Date.now() - lastClickTime < 1000) return;
                try {
                  const pageText = document.body ? document.body.innerText : "";
                  const pageHasIdleAlert = /閒置|逾時|尚未操作|連線中斷|即將登出|自動登出|延長學習/.test(pageText);

                  const clickableElements = document.querySelectorAll(
                    'button, input[type="button"], input[type="submit"], a, div[role="button"]'
                  );

                  for (const el of clickableElements) {
                    if (!isElementVisible(el)) continue;

                    const text = (el.textContent || el.value || "").trim();
                    if (!text) continue;

                    if (dangerKeywords.some((d) => text.includes(d))) continue;

                    const isMatch = safeKeywords.some((kw) => text === kw || text.includes(kw));
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
                } catch (e) {}
              };

              scanAndDismiss();

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
              }
            },
          });
        } catch (e) {}
      }

      updateUI(true, selectedMode);
    }
  });

  function updateUI(isRunning, mode) {
    if (isRunning) {
      toggleBtn.textContent = "停止防登出";
      toggleBtn.className = "btn-stop";
      const modeName = mode === "reload" ? "一般重整" : "e等公務園專用";
      statusText.textContent = `運作中（${modeName}）`;
      statusText.style.color = "#28a745";
    } else {
      toggleBtn.textContent = "啟動防登出";
      toggleBtn.className = "btn-start";
      statusText.textContent = "目前狀態：未啟動";
      statusText.style.color = "#555";
    }
  }
});
