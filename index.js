(() => {
  const indexModeNode = document.getElementById('indexMode');
  chrome.storage.sync.get(["indexMode"]).then((result) => {
    indexModeNode.checked = result.indexMode;
    
  });
  indexModeNode.addEventListener('click', () => {
    chrome.storage.sync.set({ indexMode: indexModeNode.checked });
  });
})();