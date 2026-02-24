/**
 * Panel Controller - DevTools Panel UI Logic with CodeMirror
 * Adapted from popup.js — tab ID sourced from chrome.devtools.inspectedWindow.tabId
 */

// State
let currentDomain = '';
let currentProfile = null;
let allProfiles = {};
let settings = {};
let currentSnippetIndex = -1; // -1 = legacy mode (profile.css/js)
let pageHasJQuery = false;    // true if window.jQuery exists on the inspected tab
let currentLang = 'en';       // 'en' | 'tr'
let listenersSetup = false;   // guard: event listeners attached only once

// CodeMirror editor instances
let cssEditorCM = null;
let jsEditorCM  = null;

// DOM Elements
const domainName       = document.getElementById('currentDomain');
const autoInjectToggle = document.getElementById('autoInjectToggle');
const useJQueryToggle  = document.getElementById('useJQueryToggle');
const cssInfo          = document.getElementById('cssInfo');
const jsInfo           = document.getElementById('jsInfo');
const saveBtn          = document.getElementById('saveBtn');
const injectBtn        = document.getElementById('injectBtn');
const clearBtn         = document.getElementById('clearBtn');
const statusMessage    = document.getElementById('statusMessage');

// Per-profile options
const delayInput       = document.getElementById('delayInput');
const urlPatternInput  = document.getElementById('urlPatternInput');

// Snippets
const snippetSelect        = document.getElementById('snippetSelect');
const snippetNameInput     = document.getElementById('snippetNameInput');
const addSnippetBtn        = document.getElementById('addSnippetBtn');
const deleteSnippetBtn     = document.getElementById('deleteSnippetBtn');
const snippetEnabledToggle = document.getElementById('snippetEnabledToggle');

// History panel
const historyPanelOverlay = document.getElementById('historyPanelOverlay');
const historyList         = document.getElementById('historyList');
const clearHistoryBtn     = document.getElementById('clearHistoryBtn');

// Help panel
const helpPanelOverlay = document.getElementById('helpPanelOverlay');

// Language toggle
const langBtn = document.getElementById('langBtn');

// Theme toggle (header button)
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Snippet reorder
const moveUpBtn   = document.getElementById('moveUpBtn');
const moveDownBtn = document.getElementById('moveDownBtn');

// Element picker
const pickerBtn          = document.getElementById('pickerBtn');
const pickerModalOverlay = document.getElementById('pickerModalOverlay');
const pickerSelectorEl   = document.getElementById('pickerSelector');
const pickerInsertCss    = document.getElementById('pickerInsertCss');
const pickerInsertJs     = document.getElementById('pickerInsertJs');
const pickerInsertJq     = document.getElementById('pickerInsertJq');
const pickerModalClose   = document.getElementById('pickerModalClose');

// Settings panel
const panelOverlay = document.getElementById('panelOverlay');

// Profiles
const profilesList  = document.getElementById('profilesList');
const profileSearch = document.getElementById('profileSearch');

// Settings toggles
const liveReloadToggle    = document.getElementById('liveReloadToggle');
const notificationsToggle = document.getElementById('notificationsToggle');
const autoInjectAllToggle = document.getElementById('autoInjectAllToggle');
const themeToggle         = document.getElementById('themeToggle');
const syncToggle          = document.getElementById('syncToggle');
const syncStatus          = document.getElementById('syncStatus');
const importBtn           = document.getElementById('importBtn');
const exportBtnFull       = document.getElementById('exportBtnFull');
const clearAllBtn         = document.getElementById('clearAllBtn');
const importFileInput     = document.getElementById('importFileInput');

// ─────────────────────────────────────────
//  DevTools tab helper
//  In DevTools panel context we use chrome.devtools.inspectedWindow.tabId
// ─────────────────────────────────────────

/** Returns the inspected tab's ID */
function getInspectedTabId() {
  return chrome.devtools.inspectedWindow.tabId;
}

/** Returns a Promise<chrome.tabs.Tab> for the inspected tab */
async function getInspectedTab() {
  const tabId = getInspectedTabId();
  return chrome.tabs.get(tabId);
}

// ─────────────────────────────────────────
//  i18n helpers
// ─────────────────────────────────────────

/** Get translated string (supports function values) */
function t(key, ...args) {
  const v = I18N[currentLang]?.[key] ?? I18N.en[key];
  return typeof v === 'function' ? v(...args) : (v ?? key);
}

/** Apply data-i18n / data-i18n-placeholder / data-i18n-title attributes */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = I18N[currentLang]?.[el.dataset.i18n];
    if (v !== undefined && typeof v === 'string') el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const v = I18N[currentLang]?.[el.dataset.i18nPlaceholder];
    if (v !== undefined) el.placeholder = v;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const v = I18N[currentLang]?.[el.dataset.i18nTitle];
    if (v !== undefined) el.title = v;
  });
  langBtn.textContent = t('langSwitch');
  langBtn.title       = t('titleLang');
  document.documentElement.lang = currentLang;
  renderHelpContent();
}

/** Render help panel content from i18n translations */
function renderHelpContent() {
  const container = document.getElementById('helpContent');
  if (!container) return;

  const sections = I18N[currentLang]?.help?.sections ?? I18N.en.help.sections;
  let html = '';

  for (const sec of sections) {
    html += `<div class="help-section"><h3 class="help-section-title">${sec.title}</h3>`;

    if (sec.steps) {
      html += '<ol class="help-steps">';
      sec.steps.forEach(s => { html += `<li>${s}</li>`; });
      html += '</ol>';
    }
    if (sec.list) {
      html += '<ul class="help-steps">';
      sec.list.forEach(s => { html += `<li>${s}</li>`; });
      html += '</ul>';
    }
    if (sec.note) {
      html += `<p class="help-note">${sec.note}</p>`;
    }
    if (sec.table) {
      html += '<div class="help-table-wrap"><table class="help-table">';
      html += `<thead><tr><th>${sec.table[0][0]}</th><th>${sec.table[0][1]}</th></tr></thead><tbody>`;
      for (let i = 1; i < sec.table.length; i++) {
        html += `<tr><td>${sec.table[i][0]}</td><td>${sec.table[i][1]}</td></tr>`;
      }
      html += '</tbody></table></div>';
    }
    if (sec.shortcuts) {
      html += '<div class="help-shortcuts">';
      sec.shortcuts.forEach(([k1, k2, label]) => {
        html += '<div class="help-shortcut-row">';
        html += `<kbd>${k1}</kbd>`;
        if (k2) html += `+<kbd>${k2}</kbd>`;
        html += ` <span>${label}</span></div>`;
      });
      html += '</div>';
    }

    html += '</div>';
  }

  html += `<div class="settings-footer"><small>${t('versionInfo')}</small></div>`;
  container.innerHTML = html;
}

// ─────────────────────────────────────────
//  Editor resizer (drag to resize panes)
// ─────────────────────────────────────────

function initResizer() {
  const resizer   = document.getElementById('editorResizer');
  const leftPane  = resizer?.previousElementSibling;
  const rightPane = resizer?.nextElementSibling;
  if (!resizer || !leftPane || !rightPane) return;

  let dragging = false;
  let startX   = 0;
  let startLeftW = 0;

  resizer.addEventListener('mousedown', (e) => {
    dragging    = true;
    startX      = e.clientX;
    startLeftW  = leftPane.getBoundingClientRect().width;
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx       = e.clientX - startX;
    const container = resizer.parentElement;
    const totalW    = container.getBoundingClientRect().width - resizer.offsetWidth;
    const newLeft   = Math.max(120, Math.min(totalW - 120, startLeftW + dx));
    const newRight  = totalW - newLeft;
    leftPane.style.flex  = 'none';
    leftPane.style.width = newLeft + 'px';
    rightPane.style.flex  = 'none';
    rightPane.style.width = newRight + 'px';
    cssEditorCM?.refresh();
    jsEditorCM?.refresh();
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor    = '';
    document.body.style.userSelect = '';
    cssEditorCM?.refresh();
    jsEditorCM?.refresh();
  });
}

// ─────────────────────────────────────────
//  CodeMirror bootstrap
// ─────────────────────────────────────────

function createCssEditor() {
  cssEditorCM = CodeMirror(document.getElementById('cssEditor'), {
    mode: 'css',
    theme: 'devpro',
    lineNumbers: true,
    lineWrapping: false,
    matchBrackets: true,
    autoCloseBrackets: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    extraKeys: {
      'Ctrl-Space': 'autocomplete',
      'Ctrl-S': () => handleSave(),
      'Ctrl-Enter': () => handleInject(),
      Tab: (cm) => cm.execCommand('indentMore'),
    },
    hintOptions: {
      completeSingle: false,
    },
    placeholder: '/* Enter your CSS overrides here... */\n.example {\n  color: red;\n}',
  });

  cssEditorCM.on('change', (cm) => {
    const lines = cm.lineCount();
    cssInfo.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
    triggerAutocomplete(cm, 'css');
  });
}

function createJsEditor() {
  jsEditorCM = CodeMirror(document.getElementById('jsEditor'), {
    mode: 'javascript',
    theme: 'devpro',
    lineNumbers: true,
    lineWrapping: false,
    matchBrackets: true,
    autoCloseBrackets: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    extraKeys: {
      'Ctrl-Space': 'autocomplete',
      'Ctrl-S': () => handleSave(),
      'Ctrl-Enter': () => handleInject(),
      Tab: (cm) => cm.execCommand('indentMore'),
    },
    hintOptions: {
      completeSingle: false,
      hint: jsHint,
    },
    placeholder: '// Enter your JavaScript overrides here...\nconsole.log(\'Dev override loaded!\');',
  });

  jsEditorCM.on('change', (cm) => {
    const lines = cm.lineCount();
    jsInfo.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
    triggerAutocomplete(cm, 'js');
  });
}

/**
 * Auto-show hint dropdown while typing (only after a real character input)
 */
function triggerAutocomplete(cm, type) {
  const cursor = cm.getCursor();
  const line   = cm.getLine(cursor.line);
  const before = line.slice(0, cursor.ch);

  if (before.trimStart().startsWith('//') || before.trimStart().startsWith('/*')) return;
  if (!/[\w\-.:]$/.test(before)) return;
  if (cm.state.completionActive) return;

  cm.showHint({
    completeSingle: false,
    hint: type === 'css' ? CodeMirror.hint.css : jsHint,
  });
}

/**
 * Custom JS hint that merges anyword + a curated keyword list
 */
function jsHint(cm) {
  const jQueryKeywords = useJQueryToggle.checked ? [
    '$','jQuery',
    '$(document).ready','$(window)','$(document)',
    '$.fn','$.fn.extend',
    '.find','.filter','.not','.is','.has','.closest','.parent','.parents',
    '.children','.siblings','.next','.nextAll','.nextUntil',
    '.prev','.prevAll','.prevUntil','.first','.last','.eq','.slice',
    '.add','.addBack','.end','.contents',
    '.html','.text','.val','.attr','.prop','.data','.removeAttr','.removeProp',
    '.removeData','.addClass','.removeClass','.toggleClass','.hasClass',
    '.append','.prepend','.appendTo','.prependTo',
    '.after','.before','.insertAfter','.insertBefore',
    '.wrap','.wrapAll','.wrapInner','.unwrap',
    '.remove','.empty','.detach','.replaceWith','.replaceAll','.clone',
    '.css','.width','.height','.innerWidth','.innerHeight',
    '.outerWidth','.outerHeight','.offset','.position','.scrollTop','.scrollLeft',
    '.on','.off','.one','.trigger','.triggerHandler',
    '.click','.dblclick','.mousedown','.mouseup','.mousemove',
    '.mouseenter','.mouseleave','.mouseover','.mouseout',
    '.keydown','.keyup','.keypress',
    '.focus','.blur','.change','.submit','.select',
    '.resize','.scroll','.load','.unload','.error',
    '.hover','.bind','.unbind','.delegate','.undelegate',
    '.show','.hide','.toggle',
    '.fadeIn','.fadeOut','.fadeTo','.fadeToggle',
    '.slideDown','.slideUp','.slideToggle',
    '.animate','.stop','.finish','.delay','.queue','.dequeue','.clearQueue',
    '$.ajax','$.get','$.post','$.getJSON','$.getScript','$.load',
    '$.ajaxSetup','$.ajaxPrefilter',
    '.ajax','.load','.serialize','.serializeArray',
    '$.each','$.map','$.grep','$.inArray','$.merge','$.extend','$.isArray',
    '$.isFunction','$.isPlainObject','$.isEmptyObject','$.isNumeric',
    '$.type','$.trim','$.now','$.noop','$.proxy','$.makeArray',
    '$.parseJSON','$.parseHTML','$.parseXML',
    '$.Deferred','$.when',
    ':first',':last',':eq()',':gt()',':lt()',':even',':odd',
    ':not()',':has()',':contains()',':visible',':hidden',
    ':checked',':selected',':disabled',':enabled',':empty',
    ':input',':text',':password',':radio',':checkbox',':submit',':reset',':file',
    ':animated',':focus',':header',':button',':image',
  ] : [];

  const jsKeywords = [
    'abstract','arguments','async','await','boolean','break','byte','case','catch',
    'char','class','const','continue','debugger','default','delete','do','double',
    'else','enum','eval','export','extends','false','final','finally','float','for',
    'function','goto','if','implements','import','in','instanceof','int','interface',
    'let','long','native','new','null','of','package','private','protected','public',
    'return','short','static','super','switch','synchronized','this','throw','throws',
    'transient','true','try','typeof','undefined','var','void','volatile','while','with',
    'yield',
    'Array','Boolean','Date','Error','Function','JSON','Math','Number','Object',
    'Promise','Proxy','Reflect','RegExp','Set','Map','String','Symbol','WeakMap',
    'WeakSet','clearInterval','clearTimeout','console','decodeURI','decodeURIComponent',
    'encodeURI','encodeURIComponent','fetch','isFinite','isNaN','parseFloat','parseInt',
    'queueMicrotask','requestAnimationFrame','setInterval','setTimeout','structuredClone',
    'document','window','navigator','location','history','screen','event',
    'addEventListener','removeEventListener','dispatchEvent',
    'querySelector','querySelectorAll','getElementById','getElementsByClassName',
    'getElementsByTagName','createElement','createTextNode','createDocumentFragment',
    'getAttribute','setAttribute','removeAttribute','hasAttribute',
    'appendChild','removeChild','replaceChild','insertBefore','insertAdjacentHTML',
    'classList','style','innerHTML','innerText','textContent','value',
    'parentNode','parentElement','children','childNodes','firstChild','lastChild',
    'nextSibling','previousSibling','offsetWidth','offsetHeight','clientWidth','clientHeight',
    'console.log','console.warn','console.error','console.info','console.table',
    'console.group','console.groupEnd','console.time','console.timeEnd',
    'DOMContentLoaded','MutationObserver','IntersectionObserver','ResizeObserver',
    'localStorage','sessionStorage','indexedDB','XMLHttpRequest',
    'Promise.resolve','Promise.reject','Promise.all','Promise.allSettled',
    'Object.keys','Object.values','Object.entries','Object.assign','Object.freeze',
    'Array.from','Array.isArray',
    'Math.abs','Math.ceil','Math.floor','Math.max','Math.min','Math.random','Math.round',
    'JSON.parse','JSON.stringify',
  ];

  const cursor = cm.getCursor();
  const token  = cm.getTokenAt(cursor);
  const start  = token.start;
  const end    = cursor.ch;
  const word   = token.string.slice(0, end - start).toLowerCase();

  const anyResult = CodeMirror.hint.anyword(cm) || { list: [] };
  const anyWords  = anyResult.list.map(i => (typeof i === 'string' ? i : i.text));

  const merged = [...new Set([...jsKeywords, ...jQueryKeywords, ...anyWords])]
    .filter(w => w.toLowerCase().startsWith(word) && w !== word)
    .sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    });

  return {
    list: merged,
    from: CodeMirror.Pos(cursor.line, start),
    to:   CodeMirror.Pos(cursor.line, end),
  };
}

// ─────────────────────────────────────────
//  Initialize
// ─────────────────────────────────────────

createCssEditor();
createJsEditor();
initResizer();
init();

async function init() {
  try {
    const tab = await getInspectedTab();

    if (!tab?.url) {
      showStatus(t('statusCannotDetect'), 'error');
      return;
    }

    currentDomain = StorageHelper.getDomainFromUrl(tab.url);

    if (!currentDomain || tab.url.startsWith('chrome://') || tab.url.startsWith('devtools://')) {
      domainName.textContent = 'N/A (Chrome page)';
      disableEditors();
      return;
    }

    domainName.textContent = currentDomain;

    currentProfile = await StorageHelper.getProfile(currentDomain);
    allProfiles    = await StorageHelper.getAllProfiles();
    settings       = await StorageHelper.getSettings();

    populateEditors();
    updateEditorInfo();
    loadSettings();
    applyTranslations();
    renderProfiles();
    if (!listenersSetup) {
      setupEventListeners();
      listenersSetup = true;
    }

    // Pull synced profiles if sync is enabled (merge newer remote data)
    if (settings.syncEnabled) {
      const merged = await StorageHelper.pullFromSync().catch(() => 0);
      if (merged > 0) {
        currentProfile = await StorageHelper.getProfile(currentDomain);
        allProfiles    = await StorageHelper.getAllProfiles();
        populateEditors();
        renderProfiles();
        showSyncStatus(t('statusSyncMerged', merged), 'info');
      }
    }

    // Check if jQuery exists on the inspected tab
    chrome.runtime.sendMessage({ type: 'CHECK_JQUERY', tabId: tab.id }, (res) => {
      pageHasJQuery = res?.hasJQuery || false;
      updateJQueryUI();
    });

    // Check if the element picker left a pending selector → open modal
    const { pendingPickedElement } = await chrome.storage.local.get('pendingPickedElement');
    if (pendingPickedElement) {
      pickerSelectorEl.textContent = pendingPickedElement;
      updatePickerJqButton();
      pickerModalOverlay.classList.add('open');
    }

  } catch (error) {
    console.error('Init failed:', error);
    showStatus(t('statusInitFailed') + error.message, 'error');
  }
}

// ─────────────────────────────────────────
//  Editor helpers
// ─────────────────────────────────────────

function populateEditors() {
  if (!currentProfile) return;

  autoInjectToggle.checked = currentProfile.autoInject || false;
  useJQueryToggle.checked  = currentProfile.useJQuery  || false;
  urlPatternInput.value    = currentProfile.urlPattern || '';

  if (currentProfile.snippets && currentProfile.snippets.length > 0) {
    currentSnippetIndex = 0;
    renderSnippetSelect();
    loadSnippet(0);
  } else {
    currentSnippetIndex = -1;
    renderSnippetSelect();
    cssEditorCM.setValue(currentProfile.css || '');
    jsEditorCM.setValue(currentProfile.js  || '');
  }

  setTimeout(() => {
    cssEditorCM.refresh();
    jsEditorCM.refresh();
  }, 10);
}

function updateEditorInfo() {
  cssInfo.textContent = `${cssEditorCM.lineCount()} lines`;
  jsInfo.textContent  = `${jsEditorCM.lineCount()} lines`;
}

function disableEditors() {
  cssEditorCM.setOption('readOnly', 'nocursor');
  jsEditorCM.setOption('readOnly', 'nocursor');
  saveBtn.disabled          = true;
  injectBtn.disabled        = true;
  clearBtn.disabled         = true;
  autoInjectToggle.disabled = true;
  useJQueryToggle.disabled  = true;
}

// ─────────────────────────────────────────
//  Snippet helpers
// ─────────────────────────────────────────

function renderSnippetSelect() {
  snippetSelect.innerHTML = '';

  if (!currentProfile.snippets || currentProfile.snippets.length === 0) {
    const opt = document.createElement('option');
    opt.value = '-1';
    opt.textContent = t('defaultSnippet');
    snippetSelect.appendChild(opt);
    snippetNameInput.value = '';
    snippetNameInput.disabled = true;
    deleteSnippetBtn.disabled = true;
    snippetEnabledToggle.checked = true;
    snippetEnabledToggle.disabled = true;
    delayInput.value = currentProfile.delay || 0;
    updateMoveButtons();
    return;
  }

  snippetNameInput.disabled = false;
  deleteSnippetBtn.disabled = false;
  snippetEnabledToggle.disabled = false;

  currentProfile.snippets.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    const prefix = s.enabled !== false ? '✓ ' : '✗ ';
    opt.textContent = prefix + (s.name || `Snippet ${i + 1}`);
    if (s.enabled === false) opt.style.color = 'var(--text-dim, #888)';
    snippetSelect.appendChild(opt);
  });

  const idx = Math.max(0, Math.min(currentSnippetIndex, currentProfile.snippets.length - 1));
  snippetSelect.value = idx;
  currentSnippetIndex = idx;

  const active = currentProfile.snippets[idx];
  snippetNameInput.value = active.name || '';
  snippetEnabledToggle.checked = active.enabled !== false;

  updateMoveButtons();
}

function updateMoveButtons() {
  const len = currentProfile.snippets?.length ?? 0;
  moveUpBtn.disabled   = len === 0 || currentSnippetIndex <= 0;
  moveDownBtn.disabled = len === 0 || currentSnippetIndex >= len - 1;
}

function updateSnippetOptionLabel(index) {
  const s   = currentProfile.snippets?.[index];
  const opt = snippetSelect.options[index];
  if (!s || !opt) return;
  const prefix = s.enabled !== false ? '✓ ' : '✗ ';
  opt.textContent  = prefix + (s.name || `Snippet ${index + 1}`);
  opt.style.color  = s.enabled !== false ? '' : 'var(--text-dim, #888)';
}

function loadSnippet(index) {
  const snippet = currentProfile.snippets[index];
  if (!snippet) return;
  cssEditorCM.setValue(snippet.css || '');
  jsEditorCM.setValue(snippet.js  || '');
  snippetNameInput.value = snippet.name || '';
  snippetEnabledToggle.checked = snippet.enabled !== false;
  delayInput.value = snippet.delay || 0;
}

function saveCurrentSnippetToProfile() {
  if (currentSnippetIndex < 0 || !currentProfile.snippets) return;
  const snippet = currentProfile.snippets[currentSnippetIndex];
  if (!snippet) return;
  snippet.css     = cssEditorCM.getValue();
  snippet.js      = jsEditorCM.getValue();
  snippet.name    = snippetNameInput.value.trim() || snippet.name;
  snippet.enabled = snippetEnabledToggle.checked;
  snippet.delay   = parseInt(delayInput.value, 10) || 0;
}

// ─────────────────────────────────────────
//  History
// ─────────────────────────────────────────

async function renderHistory() {
  const history = await StorageHelper.getInjectHistory();
  if (!history.length) {
    historyList.innerHTML = `<div class="history-empty">${t('historyEmpty')}</div>`;
    return;
  }
  historyList.innerHTML = history.map(ev => {
    const date = new Date(ev.timestamp);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const icon = ev.success ? '✅' : '❌';
    return `<div class="history-item">
      <span class="history-status">${icon}</span>
      <span class="history-domain">${ev.domain}</span>
      <span class="history-time">${dateStr} ${time}</span>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────
//  Settings
// ─────────────────────────────────────────

function loadSettings() {
  liveReloadToggle.checked    = settings.liveReload || false;
  notificationsToggle.checked = settings.showNotifications !== false;
  autoInjectAllToggle.checked = settings.autoInjectAll || false;
  themeToggle.checked         = settings.theme === 'light';
  syncToggle.checked          = settings.syncEnabled || false;
  applyTheme(settings.theme || 'dark');
  currentLang = settings.lang || 'en';
}

// ─────────────────────────────────────────
//  Event listeners
// ─────────────────────────────────────────

function setupEventListeners() {
  autoInjectToggle.addEventListener('change', handleAutoInjectToggle);
  useJQueryToggle.addEventListener('change', handleJQueryToggle);
  saveBtn.addEventListener('click', handleSave);
  injectBtn.addEventListener('click', handleInject);
  clearBtn.addEventListener('click', handleClear);

  profileSearch.addEventListener('input', handleProfileSearch);

  liveReloadToggle.addEventListener('change', handleSettingsChange);
  notificationsToggle.addEventListener('change', handleSettingsChange);
  autoInjectAllToggle.addEventListener('change', handleSettingsChange);
  themeToggle.addEventListener('change', handleSettingsChange);
  syncToggle.addEventListener('change', handleSyncToggle);

  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', handleImport);
  exportBtnFull.addEventListener('click', handleExportAll);
  clearAllBtn.addEventListener('click', handleClearAll);

  // Snippet toolbar
  addSnippetBtn.addEventListener('click', handleAddSnippet);
  deleteSnippetBtn.addEventListener('click', handleDeleteSnippet);
  moveUpBtn.addEventListener('click', handleMoveSnippetUp);
  moveDownBtn.addEventListener('click', handleMoveSnippetDown);
  snippetSelect.addEventListener('change', handleSnippetChange);
  snippetNameInput.addEventListener('input', () => {
    if (currentSnippetIndex >= 0 && currentProfile.snippets?.[currentSnippetIndex]) {
      currentProfile.snippets[currentSnippetIndex].name = snippetNameInput.value;
      updateSnippetOptionLabel(currentSnippetIndex);
    }
  });
  snippetEnabledToggle.addEventListener('change', () => {
    if (currentSnippetIndex >= 0 && currentProfile.snippets?.[currentSnippetIndex]) {
      currentProfile.snippets[currentSnippetIndex].enabled = snippetEnabledToggle.checked;
      updateSnippetOptionLabel(currentSnippetIndex);
    }
  });

  // History panel
  document.getElementById('historyBtn').addEventListener('click', openHistoryPanel);
  document.getElementById('closeHistoryPanelBtn').addEventListener('click', closeHistoryPanel);
  historyPanelOverlay.addEventListener('click', (e) => {
    if (e.target === historyPanelOverlay) closeHistoryPanel();
  });
  clearHistoryBtn.addEventListener('click', async () => {
    await StorageHelper.clearInjectHistory();
    renderHistory();
  });

  // Help panel
  document.getElementById('helpBtn').addEventListener('click', openHelpPanel);
  document.getElementById('closeHelpPanelBtn').addEventListener('click', closeHelpPanel);
  helpPanelOverlay.addEventListener('click', (e) => {
    if (e.target === helpPanelOverlay) closeHelpPanel();
  });

  // Language toggle
  langBtn.addEventListener('click', async () => {
    currentLang = currentLang === 'en' ? 'tr' : 'en';
    settings.lang = currentLang;
    await StorageHelper.saveSettings(settings);
    applyTranslations();
  });

  document.getElementById('exportBtn').addEventListener('click', handleExportCurrent);
  document.getElementById('settingsBtn').addEventListener('click', openPanel);
  document.getElementById('closePanelBtn').addEventListener('click', closePanel);

  // Theme toggle header button
  themeToggleBtn.addEventListener('click', async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    settings.theme = newTheme;
    themeToggle.checked = newTheme === 'light';
    applyTheme(newTheme);
    await StorageHelper.saveSettings(settings);
  });

  // Element picker button — routed via background.js for reliable content script delivery
  pickerBtn.addEventListener('click', async () => {
    const tabId = getInspectedTabId();
    if (!tabId) { showStatus('No inspected tab', 'error'); return; }
    const res = await chrome.runtime.sendMessage({
      type: 'ACTIVATE_PICKER_FOR_TAB',
      tabId,
      source: 'devtools',
    }).catch(() => ({ ok: false, error: 'Background not available' }));
    if (res?.ok) {
      showStatus('Click an element on the page', 'info');
    } else {
      showStatus(res?.error || 'Picker unavailable on this page', 'error');
    }
  });

  // Listen for picker result via storage (DevTools panel stays open, no popup)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.pendingPickedElement?.newValue) return;
    pickerSelectorEl.textContent = changes.pendingPickedElement.newValue;
    updatePickerJqButton();
    pickerModalOverlay.classList.add('open');
  });

  // Picker modal — insert as CSS
  pickerInsertCss.addEventListener('click', () => {
    const sel = pickerSelectorEl.textContent.trim();
    if (!sel) return;
    appendToEditor(cssEditorCM, `\n${sel} {\n  \n}`);
    cssEditorCM.focus();
    dismissPickerModal();
  });

  // Picker modal — insert as vanilla JS
  pickerInsertJs.addEventListener('click', async () => {
    const sel = pickerSelectorEl.textContent.trim();
    if (!sel) return;
    if (useJQueryToggle.checked) {
      useJQueryToggle.checked = false;
      currentProfile.useJQuery = false;
      await StorageHelper.saveProfile(currentDomain, currentProfile);
      showStatus(t('statusJQueryDisabled'), 'info');
    }
    appendToEditor(jsEditorCM, `\nconst el = document.querySelector('${sel}');`);
    jsEditorCM.focus();
    dismissPickerModal();
  });

  // Picker modal — insert as jQuery
  pickerInsertJq.addEventListener('click', async () => {
    const sel = pickerSelectorEl.textContent.trim();
    if (!sel) return;
    if (!useJQueryToggle.checked) {
      useJQueryToggle.checked = true;
      currentProfile.useJQuery = true;
      await StorageHelper.saveProfile(currentDomain, currentProfile);
      showStatus(t('statusJQueryEnabled'), 'success');
    }
    appendToEditor(jsEditorCM, `\nconst $el = $('${sel}');`);
    jsEditorCM.focus();
    dismissPickerModal();
  });

  pickerModalClose.addEventListener('click', dismissPickerModal);
  pickerModalOverlay.addEventListener('click', (e) => {
    if (e.target === pickerModalOverlay) dismissPickerModal();
  });

  // Close settings panel on backdrop click
  panelOverlay.addEventListener('click', (e) => {
    if (e.target === panelOverlay) closePanel();
  });

  // Refresh domain/profile on navigation — listeners already set up, skip re-attaching
  chrome.devtools.network.onNavigated.addListener(async () => {
    try {
      const tab = await getInspectedTab();
      if (!tab?.url) return;
      const newDomain = StorageHelper.getDomainFromUrl(tab.url);
      if (!newDomain || tab.url.startsWith('chrome://') || tab.url.startsWith('devtools://')) {
        domainName.textContent = 'N/A (Chrome page)';
        return;
      }
      currentDomain  = newDomain;
      currentProfile = await StorageHelper.getProfile(currentDomain);
      domainName.textContent = currentDomain;
      populateEditors();
      updateEditorInfo();
      // Re-check jQuery presence on new page
      chrome.runtime.sendMessage({ type: 'CHECK_JQUERY', tabId: tab.id }, (res) => {
        pageHasJQuery = res?.hasJQuery || false;
        updateJQueryUI();
      });
    } catch (_) {}
  });
}

function openPanel() {
  renderProfiles();
  panelOverlay.classList.add('open');
}

function closePanel() {
  panelOverlay.classList.remove('open');
  setTimeout(() => {
    cssEditorCM.refresh();
    jsEditorCM.refresh();
  }, 50);
}

function openHistoryPanel() {
  renderHistory();
  historyPanelOverlay.classList.add('open');
}

function closeHistoryPanel() {
  historyPanelOverlay.classList.remove('open');
  setTimeout(() => {
    cssEditorCM.refresh();
    jsEditorCM.refresh();
  }, 50);
}

function openHelpPanel() {
  helpPanelOverlay.classList.add('open');
}

function closeHelpPanel() {
  helpPanelOverlay.classList.remove('open');
  setTimeout(() => {
    cssEditorCM.refresh();
    jsEditorCM.refresh();
  }, 50);
}

function applyTheme(theme) {
  document.body.classList.toggle('light-theme', theme === 'light');
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = theme === 'light' ? '<span class="icon icon-night"></span>' : '<span class="icon icon-day"></span>';
    themeToggleBtn.title = theme === 'light' ? t('titleThemeDark') : t('titleThemeLight');
  }
}

function handleAddSnippet() {
  if (!currentProfile.snippets) currentProfile.snippets = [];

  if (currentProfile.snippets.length === 0 && (currentProfile.css || currentProfile.js)) {
    currentProfile.snippets.push({
      id: Date.now() - 1,
      name: 'Default',
      css: currentProfile.css || '',
      js: currentProfile.js  || '',
      enabled: true,
    });
  }

  saveCurrentSnippetToProfile();

  const newSnippet = {
    id: Date.now(),
    name: `Snippet ${currentProfile.snippets.length + 1}`,
    css: '',
    js: '',
    delay: 0,
    enabled: true,
  };
  currentProfile.snippets.push(newSnippet);
  currentSnippetIndex = currentProfile.snippets.length - 1;
  renderSnippetSelect();
  loadSnippet(currentSnippetIndex);
}

function handleDeleteSnippet() {
  if (!currentProfile.snippets?.length || currentSnippetIndex < 0) return;
  const name = currentProfile.snippets[currentSnippetIndex].name || `Snippet ${currentSnippetIndex + 1}`;
  if (!confirm(t('confirmDeleteSnippet', name))) return;

  currentProfile.snippets.splice(currentSnippetIndex, 1);
  currentSnippetIndex = Math.max(0, currentSnippetIndex - 1);

  if (currentProfile.snippets.length === 0) {
    currentSnippetIndex = -1;
    cssEditorCM.setValue('');
    jsEditorCM.setValue('');
  } else {
    loadSnippet(currentSnippetIndex);
  }
  renderSnippetSelect();
}

function handleSnippetChange() {
  saveCurrentSnippetToProfile();
  currentSnippetIndex = parseInt(snippetSelect.value, 10);
  loadSnippet(currentSnippetIndex);
  updateMoveButtons();
}

function handleMoveSnippetUp() {
  const i = currentSnippetIndex;
  if (i <= 0 || !currentProfile.snippets?.length) return;
  saveCurrentSnippetToProfile();
  [currentProfile.snippets[i - 1], currentProfile.snippets[i]] =
    [currentProfile.snippets[i], currentProfile.snippets[i - 1]];
  currentSnippetIndex = i - 1;
  renderSnippetSelect();
  loadSnippet(currentSnippetIndex);
}

function handleMoveSnippetDown() {
  const i = currentSnippetIndex;
  if (i < 0 || i >= (currentProfile.snippets?.length ?? 0) - 1) return;
  saveCurrentSnippetToProfile();
  [currentProfile.snippets[i], currentProfile.snippets[i + 1]] =
    [currentProfile.snippets[i + 1], currentProfile.snippets[i]];
  currentSnippetIndex = i + 1;
  renderSnippetSelect();
  loadSnippet(currentSnippetIndex);
}

// ─────────────────────────────────────────
//  Actions
// ─────────────────────────────────────────

async function handleAutoInjectToggle() {
  currentProfile.autoInject = autoInjectToggle.checked;
  await StorageHelper.saveProfile(currentDomain, currentProfile);
  showStatus(autoInjectToggle.checked ? t('statusAutoInjectOn') : t('statusAutoInjectOff'), 'success');
}

async function handleJQueryToggle() {
  currentProfile.useJQuery = useJQueryToggle.checked;
  await StorageHelper.saveProfile(currentDomain, currentProfile);
  showStatus(
    useJQueryToggle.checked ? t('statusJQueryWillInject') : t('statusJQueryDisabled'),
    'success',
  );
}

async function handleSave() {
  try {
    currentProfile.urlPattern = urlPatternInput.value.trim();

    if (currentProfile.snippets && currentProfile.snippets.length > 0) {
      saveCurrentSnippetToProfile();
    } else {
      currentProfile.css   = cssEditorCM.getValue();
      currentProfile.js    = jsEditorCM.getValue();
      currentProfile.delay = parseInt(delayInput.value, 10) || 0;
    }

    // Store the full URL of the inspected tab
    const tab = await getInspectedTab().catch(() => null);
    if (tab?.url) currentProfile.url = tab.url;

    await StorageHelper.saveProfile(currentDomain, currentProfile);
    showStatus(t('statusSaved'), 'success');

    if (settings.liveReload && currentProfile.autoInject) await triggerLiveReload();

    allProfiles = await StorageHelper.getAllProfiles();
    renderProfiles();
  } catch (error) {
    showStatus(t('statusSaveFailed') + error.message, 'error');
  }
}

async function handleInject() {
  try {
    showStatus(t('statusInjecting'), 'info');

    const tabId = getInspectedTabId();

    const response = await chrome.runtime.sendMessage({
      type: 'INJECT_NOW',
      data: { tabId, domain: currentDomain },
    });

    showStatus(
      response.success ? t('statusInjected') : t('statusInjectFailed') + response.error,
      response.success ? 'success' : 'error',
    );
  } catch (error) {
    showStatus(t('statusInjectFailed') + error.message, 'error');
  }
}

async function handleClear() {
  if (!confirm(t('confirmClearEditors'))) return;

  cssEditorCM.setValue('');
  jsEditorCM.setValue('');
  updateEditorInfo();

  await handleSave();
  showStatus(t('statusCleared'), 'info');
}

// ─────────────────────────────────────────
//  Profiles
// ─────────────────────────────────────────

function buildProfileItem(domain, profile) {
  const tags = [
    profile.css?.trim() && 'CSS',
    profile.js?.trim()  && 'JS',
    profile.autoInject  && 'Auto',
  ].filter(Boolean).join(' • ');

  return `
    <div class="profile-item" data-domain="${domain}">
      <div class="profile-info">
        <div class="profile-domain">${domain}</div>
        <div class="profile-meta">${tags}</div>
      </div>
      <div class="profile-actions">
        <button data-action="load" data-domain="${domain}">Load</button>
        <button data-action="delete" data-domain="${domain}">Delete</button>
      </div>
    </div>`;
}

async function renderProfiles() {
  allProfiles = await StorageHelper.getAllProfiles();
  const entries = Object.entries(allProfiles)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt);

  if (!entries.length) {
    profilesList.innerHTML = `
      <div class="empty-state">
        <p>${t('noProfilesText')}</p>
        <small>${t('noProfilesSubtext')}</small>
      </div>`;
    return;
  }

  profilesList.innerHTML = entries.map(([domain, profile]) => buildProfileItem(domain, profile)).join('');
}

async function handleProfileSearch() {
  const query = profileSearch.value.toLowerCase();
  if (!query) { renderProfiles(); return; }

  const results = await StorageHelper.searchProfiles(query);
  const entries = Object.entries(results);

  profilesList.innerHTML = entries.length
    ? entries.map(([domain, profile]) => buildProfileItem(domain, profile)).join('')
    : `<div class="empty-state"><p>No results found</p></div>`;
}

profilesList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const domain = btn.dataset.domain;

  if (action === 'load') {
    const profile = await StorageHelper.getProfile(domain);
    currentDomain  = domain;
    currentProfile = profile;

    domainName.textContent      = domain;
    autoInjectToggle.checked    = profile.autoInject || false;
    useJQueryToggle.checked     = profile.useJQuery  || false;

    cssEditorCM.setValue(profile.css || '');
    jsEditorCM.setValue(profile.js  || '');

    // Open the saved URL in a new tab (background)
    const tabUrl = profile.url || `https://${domain}`;
    await chrome.tabs.create({ url: tabUrl, active: false });

    closePanel();
    updateEditorInfo();
    showStatus(t('statusLoaded', domain), 'success');
  }

  if (action === 'delete') {
    if (!confirm(t('confirmDeleteProfile', domain))) return;
    await StorageHelper.deleteProfile(domain);
    showStatus(t('statusDeleted', domain), 'success');
    renderProfiles();
  }
});

// ─────────────────────────────────────────
//  Settings handlers
// ─────────────────────────────────────────

async function handleSettingsChange() {
  settings.liveReload        = liveReloadToggle.checked;
  settings.showNotifications = notificationsToggle.checked;
  settings.autoInjectAll     = autoInjectAllToggle.checked;
  settings.theme             = themeToggle.checked ? 'light' : 'dark';
  settings.syncEnabled       = syncToggle.checked;
  settings.lang              = currentLang;

  applyTheme(settings.theme);
  await StorageHelper.saveSettings(settings);
  showStatus(t('statusSettingsSaved'), 'success');

  if (settings.autoInjectAll) {
    const profiles = await StorageHelper.getAllProfiles();
    for (const [domain, profile] of Object.entries(profiles)) {
      profile.autoInject = true;
      await StorageHelper.saveProfile(domain, profile);
    }
  }
}

async function handleSyncToggle() {
  settings.syncEnabled = syncToggle.checked;
  await StorageHelper.saveSettings(settings);

  if (settings.syncEnabled) {
    showSyncStatus(t('statusSyncing'), 'info');
    try {
      const result = await StorageHelper.pushAllToSync();
      showSyncStatus(t('statusSyncOk', result.synced, result.skipped), 'success');
    } catch (e) {
      showSyncStatus(t('statusSyncFailed') + e.message, 'error');
    }
  } else {
    showSyncStatus(t('statusSyncDisabled'), 'info');
  }
}

// ─────────────────────────────────────────
//  Import / Export
// ─────────────────────────────────────────

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    await StorageHelper.importData(data);
    showStatus(t('statusImportOk'), 'success');
    allProfiles = await StorageHelper.getAllProfiles();
    renderProfiles();
    importFileInput.value = '';
  } catch (error) {
    showStatus(t('statusImportFail') + error.message, 'error');
  }
}

async function handleExportAll() {
  try {
    downloadJSON(await StorageHelper.exportData(), `dev-override-export-${Date.now()}.json`);
    showStatus(t('statusExportOk'), 'success');
  } catch (error) {
    showStatus(t('statusExportFail') + error.message, 'error');
  }
}

async function handleExportCurrent() {
  if (!currentDomain || currentDomain === 'N/A') {
    showStatus(t('statusNoExportDomain'), 'error');
    return;
  }
  downloadJSON(
    { version: '2.0.0', exportedAt: new Date().toISOString(), profiles: { [currentDomain]: currentProfile } },
    `${currentDomain}-profile.json`,
  );
  showStatus(t('statusExportCurrentOk'), 'success');
}

async function handleClearAll() {
  if (!confirm(t('confirmClearAll1'))) return;
  if (!confirm(t('confirmClearAll2'))) return;
  await chrome.storage.local.clear();
  showStatus(t('statusAllCleared'), 'info');
  setTimeout(() => location.reload(), 1500);
}

// ─────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────

async function triggerLiveReload() {
  try {
    await chrome.runtime.sendMessage({ type: 'LIVE_RELOAD', data: { domain: currentDomain } });
  } catch (_) {}
}

function appendToEditor(cm, text) {
  const doc  = cm.getDoc();
  const last = doc.lastLine();
  const end  = { line: last, ch: doc.getLine(last).length };
  doc.replaceRange(text, end);
  const newLast = doc.lastLine();
  cm.setCursor({ line: newLast, ch: doc.getLine(newLast).length });
}

async function dismissPickerModal() {
  pickerModalOverlay.classList.remove('open');
  await chrome.storage.local.remove('pendingPickedElement');
}

function jqAvailable() {
  return pageHasJQuery || useJQueryToggle.checked;
}

function updateJQueryUI() {
  useJQueryToggle.disabled = !pageHasJQuery;
  useJQueryToggle.title = pageHasJQuery
    ? t('jqToggleAvailable')
    : t('jqToggleUnavailable');
  if (!pageHasJQuery) {
    useJQueryToggle.checked = false;
    if (currentProfile) currentProfile.useJQuery = false;
  }
  updatePickerJqButton();
}

function updatePickerJqButton() {
  const available = jqAvailable();
  pickerInsertJq.classList.toggle('jq-inactive', !available);
  pickerInsertJq.disabled = !available;
  pickerInsertJq.title = available
    ? t('jqInsertAvailable')
    : t('jqInsertUnavailable');
}

function showSyncStatus(message, type = 'info') {
  syncStatus.textContent = message;
  syncStatus.className   = `sync-status ${type}`;
  syncStatus.style.display = 'block';
  setTimeout(() => { syncStatus.style.display = 'none'; }, 4000);
}

function showStatus(message, type = 'info') {
  document.getElementById('dev-override-indicator')?.remove();

  const indicator = document.createElement('div');
  indicator.id = 'dev-override-indicator';
  const bg = type === 'success' ? 'linear-gradient(135deg, #10b981, #34d399)'
           : type === 'error'   ? 'linear-gradient(135deg, #ef4444, #f87171)'
           :                      'linear-gradient(135deg, #2563eb, #38bdf8)';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bg};
    color: white;
    padding: 10px 18px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.35);
    z-index: 2147483647;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    transition: opacity 0.3s, transform 0.3s;
    opacity: 0;
    transform: translateX(60px);
  `;
  indicator.textContent = message;

  document.body?.appendChild(indicator);

  requestAnimationFrame(() => {
    indicator.style.opacity  = '1';
    indicator.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    indicator.style.opacity   = '0';
    indicator.style.transform = 'translateX(60px)';
    setTimeout(() => indicator.remove(), 300);
  }, 2000);
}

function downloadJSON(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

console.log('🚀 DevTools Panel initialized with CodeMirror intellisense');
