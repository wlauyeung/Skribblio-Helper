chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content-script.js']
  });
});

chrome.storage.sync.get('indexMode', result => {
  if (result.indexMode === undefined) {
    chrome.storage.sync.set({ indexMode: false });
  }
});

chrome.storage.sync.get('sortingMode', result => {
  if (result.sortingMode === undefined) {
    chrome.storage.sync.set({ sortingMode: 0 });
  }
});