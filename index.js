(() => {
  const manifestData = chrome.runtime.getManifest();
  const indexModeNode = document.getElementById('indexMode');
  const sortingModeNode = document.getElementById('sortingMode');
  const customWLNode = document.getElementById('customWL');
  const enableOfficialWLNode = document.getElementById('enableOfficialWL');
  document.getElementById('version').innerHTML = `v${manifestData.version}`;
  chrome.storage.sync.get(["indexMode"]).then((result) => {
    indexModeNode.checked = result.indexMode;
  });
  indexModeNode.addEventListener('click', () => {
    chrome.storage.sync.set({ indexMode: indexModeNode.checked });
  });
  chrome.storage.sync.get(["sortingMode"]).then((result) => {
    sortingModeNode.value = result.sortingMode;
  });
  sortingModeNode.addEventListener('change', () => {
    chrome.storage.sync.set({ sortingMode: sortingModeNode.value });
  });
  chrome.storage.sync.get(["customWL"]).then((result) => {
    customWLNode.value = result.customWL;
  });
  customWLNode.addEventListener('change', () => {
    chrome.storage.sync.set({ customWL: customWLNode.value });
  });
  chrome.storage.sync.get(["enableOfficialWL"]).then((result) => {
    enableOfficialWLNode.checked = result.enableOfficialWL;
  });
  enableOfficialWLNode.addEventListener('click', () => {
    chrome.storage.sync.set({ enableOfficialWL: enableOfficialWLNode.checked });
  });

  document.getElementById('clearWL').addEventListener('click', ()=> {
    const node = document.getElementById('customWL');
    node.value = '';
    node.dispatchEvent(new Event('change'));
  });
})();