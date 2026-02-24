/**
 * Content Script - Visual feedback + Element Picker
 * Actual injection is done by background.js via chrome.scripting (CSP-safe)
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SHOW_INDICATOR') {
    showInjectionIndicator(message.data);
  }
  if (message.type === 'ACTIVATE_PICKER') {
    activatePicker(message.source);
    sendResponse({ ok: true }); // keep promise from rejecting in MV3
  }
});

/**
 * Show a brief toast when injection happens
 */
function showInjectionIndicator(results) {
  // Remove existing indicator if any
  document.getElementById('dev-override-indicator')?.remove();

  const parts = [
    results.jquery && '🟡 jQuery',
    results.css    && '✅ CSS',
    results.js     && '✅ JS',
  ].filter(Boolean);

  if (!parts.length) return;

  const indicator = document.createElement('div');
  indicator.id = 'dev-override-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #2563eb, #38bdf8);
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
  indicator.textContent = 'Dev Override: ' + parts.join('  ');

  document.body?.appendChild(indicator);

  // Slide in
  requestAnimationFrame(() => {
    indicator.style.opacity  = '1';
    indicator.style.transform = 'translateX(0)';
  });

  // Slide out after 2 s
  setTimeout(() => {
    indicator.style.opacity   = '0';
    indicator.style.transform = 'translateX(60px)';
    setTimeout(() => indicator.remove(), 300);
  }, 2000);
}

// ── Element Picker ────────────────────────────────────────────────────────────

let pickerActive = false;
let pickerHighlight = null;
let pickerToastEl = null;
let pickerSource = 'popup'; // 'popup' | 'devtools'

function activatePicker(source) {
  if (pickerActive) return;
  pickerActive = true;
  pickerSource = source || 'popup';

  // Highlight overlay
  pickerHighlight = document.createElement('div');
  pickerHighlight.id = 'dev-override-picker-hl';
  pickerHighlight.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 2px solid #38bdf8;
    background: rgba(56, 189, 248, 0.12);
    border-radius: 2px;
    z-index: 2147483646;
    transition: top 0.05s, left 0.05s, width 0.05s, height 0.05s;
    box-shadow: 0 0 0 1px rgba(56,189,248,0.35), inset 0 0 0 1px rgba(56,189,248,0.15);
  `;
  document.documentElement.appendChild(pickerHighlight);

  showPickerToast('🎯 Click an element to pick it  —  Esc to cancel');

  document.addEventListener('mouseover', onPickerMouseover, true);
  document.addEventListener('click',     onPickerClick,     true);
  document.addEventListener('keydown',   onPickerKeydown,   true);
}

function onPickerMouseover(e) {
  const target = e.target;
  // Skip our own overlay elements
  if (target.id === 'dev-override-picker-hl' || target.id === 'dev-override-picker-toast') return;
  e.stopPropagation();

  const rect = target.getBoundingClientRect();
  pickerHighlight.style.left   = (rect.left   - 2) + 'px';
  pickerHighlight.style.top    = (rect.top    - 2) + 'px';
  pickerHighlight.style.width  = (rect.width  + 4) + 'px';
  pickerHighlight.style.height = (rect.height + 4) + 'px';
}

function onPickerClick(e) {
  const target = e.target;
  if (target.id === 'dev-override-picker-hl' || target.id === 'dev-override-picker-toast') return;
  e.preventDefault();
  e.stopPropagation();

  const selector = generateSelector(target);
  chrome.storage.local.set({ pendingPickedElement: selector }, () => {
    deactivatePicker();
    removePickerToast();
    // Only reopen popup when triggered from popup context (not DevTools panel)
    if (pickerSource !== 'devtools') {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP_AFTER_PICK' }).catch(() => {});
    }
  });
}

function onPickerKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    deactivatePicker();
    removePickerToast();
  }
}

function deactivatePicker() {
  pickerActive = false;
  pickerHighlight?.remove();
  pickerHighlight = null;
  document.removeEventListener('mouseover', onPickerMouseover, true);
  document.removeEventListener('click',     onPickerClick,     true);
  document.removeEventListener('keydown',   onPickerKeydown,   true);
}

function showPickerToast(text) {
  removePickerToast();
  pickerToastEl = document.createElement('div');
  pickerToastEl.id = 'dev-override-picker-toast';
  pickerToastEl.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #0f172a;
    color: #f1f5f9;
    padding: 9px 20px;
    border-radius: 8px;
    border: 1px solid #38bdf8;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    z-index: 2147483647;
    font-family: system-ui, sans-serif;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
  `;
  pickerToastEl.textContent = text;
  document.documentElement.appendChild(pickerToastEl);
}

function removePickerToast() {
  pickerToastEl?.remove();
  pickerToastEl = null;
}

/**
 * Build a concise CSS selector for an element.
 * Priority: #id > tag.class1.class2 path (max 3 levels deep)
 */
function generateSelector(el) {
  if (!el || el.nodeType !== 1) return 'body';
  if (el.id) return '#' + CSS.escape(el.id);

  const parts = [];
  let node = el;

  while (node && node.nodeType === 1 && node.tagName !== 'HTML') {
    if (node.id) {
      parts.unshift('#' + CSS.escape(node.id));
      break;
    }

    let seg = node.tagName.toLowerCase();

    // Append up to 2 classes (skip invalid chars)
    if (node.className && typeof node.className === 'string') {
      const cls = node.className.trim().split(/\s+/)
        .filter(c => c && !/[\[\]:()#.+~>^$|\\]/.test(c))
        .slice(0, 2);
      if (cls.length) seg += '.' + cls.map(c => CSS.escape(c)).join('.');
    }

    // nth-of-type disambiguation when siblings share the same tag
    const parent = node.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(c => c.tagName === node.tagName);
      if (sameTag.length > 1) {
        seg += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
    }

    parts.unshift(seg);
    if (parts.length >= 3) break;
    node = node.parentElement;
  }

  return parts.join(' > ') || el.tagName.toLowerCase();
}

console.log('🎯 Dev Override Pro content script loaded');
