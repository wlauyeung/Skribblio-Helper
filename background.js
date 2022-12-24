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

chrome.storage.sync.get('sortingMode', result => {
  if (result.sortingMode === undefined) {
    chrome.storage.sync.set({ sortingMode: 0 });
  }
});

chrome.storage.sync.get('customWL', result => {
  if (result.customWL === undefined) {
    chrome.storage.sync.set({ customWL: '' });
  }
});

chrome.storage.sync.get('enableOfficialWL', result => {
  if (result.enableOfficialWL === undefined) {
    chrome.storage.sync.set({ enableOfficialWL: true });
  }
});