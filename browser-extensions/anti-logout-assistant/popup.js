/**
 * 防登出雙模式助手 (Dual-Mode Anti-Logout Assistant)
 *
 * @description 彈出視窗介面控制邏輯 (Popup Controller)
 * 負責設定模式切換、間隔分鐘調整、即時測試與鬧鐘啟動/停止狀態顯示。
 * @version 2.0.0
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

  // 【立即測試一次】按鈕事件
  testBtn.addEventListener("click", async () => {
    const selectedMode = getSelectedMode();
    testResult.textContent = "測試執行中...";
    testResult.style.color = "#666";

    if (selectedMode === "elearn") {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: async () => {
            try {
              const pingUrl = `${window.location.origin}/online/online.php?_t=${Date.now()}`;
              const res = await fetch(pingUrl, {
                method: "GET",
                credentials: "include",
                cache: "no-store",
              });
              return { ok: res.ok, status: res.status };
            } catch (e) {
              return { ok: false, error: e.message };
            }
          },
        });

        const resData = results[0]?.result;
        if (resData && resData.ok) {
          testResult.textContent = `✓ online.php 連線成功 (HTTP ${resData.status})`;
          testResult.style.color = "#28a745";
        } else {
          testResult.textContent = `× 連線異常 (狀態: ${resData?.status || resData?.error || "未知"})`;
          testResult.style.color = "#dc3545";
        }
      } catch (err) {
        testResult.textContent = `× 無法在此頁面執行測試`;
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
