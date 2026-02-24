// Load layout preference and create panel
chrome.storage.local.get(['settings'], (result) => {
  const layout = result.settings?.layout || 'b'; // default: Layout B (side-by-side)
  const panelPath = `panel-${layout}/panel.html`;

  chrome.devtools.panels.create('Chameleon', "", panelPath);
});
