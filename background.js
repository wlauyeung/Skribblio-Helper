chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content-script.js']
  });
});

chrome.storage.sync.get('indexMode', result => {
  if (result.indexMode === undefined) {
    chrome.storage.sync.set({ indexMode: true });
  }
});
