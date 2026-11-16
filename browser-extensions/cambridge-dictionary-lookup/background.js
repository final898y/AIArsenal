/**
 * 劍橋雙解詞典快速查詢 (Cambridge Dictionary Quick Lookup)
 *
 * @description Chrome 擴充套件 (Manifest V3) - 選取網頁文字後點擊右鍵選單快速跳轉劍橋英語-漢語雙解詞典
 * @version 1.0.0
 * @author AIArsenal
 */

// 套件安裝或更新時初始化右鍵選單 (Context Menu)
chrome.runtime.onInstalled.addListener(() => {
  // 先清除舊有選單項目，防止重複建立導致 ID 衝突
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "searchCambridge",
      title: "在劍橋詞典中查詢「%s」",
      contexts: ["selection"], // 僅在選取文字時顯示右鍵選單
    });
  });
});

// 監聽右鍵選單點擊事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "searchCambridge" && info.selectionText) {
    // 整理選取的單字（去除前後空格並轉為小寫）
    const query = encodeURIComponent(info.selectionText.trim().toLowerCase());

    // 組合成劍橋詞典（繁體中文版）的搜尋網址
    const url = `https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/${query}`;

    // 開啟新分頁跳轉至該網址
    chrome.tabs.create({ url: url });
  }
});
