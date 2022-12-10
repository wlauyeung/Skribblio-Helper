(() => {
  const indexModeNode = document.getElementById('indexMode');
  const sortingModeNode = document.getElementById('sortingMode');
  chrome.storage.sync.get(["indexMode"]).then((result) => {
    indexModeNode.checked = result.indexMode;
  });
  indexModeNode.addEventListener('click', () => {
    chrome.storage.sync.set({ indexMode: indexModeNode.checked });
  });
  chrome.storage.sync.get(["sortingMode"]).then((result) => {
    console.log(result.sortingMode);
    sortingModeNode.value = result.sortingMode;
  });
  sortingModeNode.addEventListener('change', () => {
    chrome.storage.sync.set({ sortingMode: sortingModeNode.value });
  });
})();