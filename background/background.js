/**
 * Background Service Worker
 * Handles auto-injection, storage changes, and live reload
 */

// Import storage helper
importScripts('../lib/storage.js');

// Track active tabs and their injection status
const injectionStatus = new Map();

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only proceed when page is fully loaded
  if (changeInfo.status !== 'complete') return;

  // Skip chrome:// URLs
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  const domain = StorageHelper.getDomainFromUrl(tab.url);
  if (!domain) return;

  // Check if we have a profile for this domain
  const profile = await StorageHelper.getProfile(domain);

  // Auto-inject if enabled and URL pattern matches
  if (profile.autoInject && profile.enabled) {
    if (StorageHelper.matchUrlPattern(tab.url, profile.urlPattern)) {
      await injectToTab(tabId, tab.url, domain, profile);
    }
  }
});

// Listen for navigation events (for SPA apps)
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only main frame

  const tab = await chrome.tabs.get(details.tabId);
  const domain = StorageHelper.getDomainFromUrl(tab.url);
  if (!domain) return;

  const profile = await StorageHelper.getProfile(domain);

  if (profile.autoInject && profile.enabled) {
    if (StorageHelper.matchUrlPattern(tab.url, profile.urlPattern)) {
      await injectToTab(details.tabId, tab.url, domain, profile);
    }
  }
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INJECT_NOW') {
    handleManualInject(message.data).then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === 'DOWNLOAD_FILE') {
    const { dataUrl, filename } = message.data;
    chrome.downloads.download({ url: dataUrl, filename, saveAs: true })
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'GET_INJECTION_STATUS') {
    sendResponse({
      status: injectionStatus.get(message.tabId) || 'none',
      timestamp: Date.now()
    });
  }

  if (message.type === 'RELOAD_TAB') {
    chrome.tabs.reload(message.tabId);
    sendResponse({ success: true });
  }

  if (message.type === 'OPEN_POPUP_AFTER_PICK') {
    // Reopen popup after element picker (chrome.action.openPopup requires Chrome 127+)
    const windowId = sender.tab?.windowId;
    if (windowId) {
      chrome.action.openPopup({ windowId }).catch(() => {});
    } else {
      chrome.windows.getCurrent({}, (win) => {
        chrome.action.openPopup({ windowId: win.id }).catch(() => {});
      });
    }
    sendResponse({ ok: true });
  }

  if (message.action === 'injectProfile') {
    // Quick Toggle inject request
    (async () => {
      try {
        const profile = await StorageHelper.getProfileById(message.profileId);
        if (!profile) {
          sendResponse({ success: false, error: 'Profile not found' });
          return;
        }

        const tab = await chrome.tabs.get(message.tabId);
        const url = new URL(tab.url);
        const domain = url.hostname;

        await injectToTab(message.tabId, tab.url, domain, profile);
        sendResponse({ success: true });
      } catch (error) {
        console.error('Quick Toggle inject error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (message.type === 'ACTIVATE_PICKER_FOR_TAB') {
    const tabId = message.tabId;
    const tryActivate = () =>
      chrome.tabs.sendMessage(tabId, { type: 'ACTIVATE_PICKER', source: message.source });

    tryActivate()
      .then(() => sendResponse({ ok: true }))
      .catch(() => {
        // Content script disconnected (e.g. after extension reload) — re-inject then retry
        chrome.scripting.executeScript({ target: { tabId }, files: ['content/content.js'] })
          .then(() => tryActivate())
          .then(() => sendResponse({ ok: true }))
          .catch((e) => sendResponse({ ok: false, error: e.message || 'Content script not available' }));
      });
    return true;
  }

  if (message.type === 'LIVE_RELOAD') {
    handleLiveReload(message.data).then(sendResponse);
    return true;
  }

  if (message.type === 'CHECK_JQUERY') {
    chrome.scripting.executeScript({
      target: { tabId: message.tabId },
      world: 'MAIN',
      func: () => typeof window.jQuery !== 'undefined',
    })
      .then(([res]) => sendResponse({ hasJQuery: !!res?.result }))
      .catch(() => sendResponse({ hasJQuery: false }));
    return true;
  }
});

// Storage change listener for live reload
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace !== 'local') return;

  if (changes.profiles) {
    const settings = await StorageHelper.getSettings();
    if (settings.liveReload) {
      await handleLiveReloadForAllTabs();
    }
  }
});

// Sync storage listener — merge incoming profiles from other devices into local
chrome.storage.sync.onChanged.addListener(async (changes) => {
  const settings = await StorageHelper.getSettings();
  if (!settings.syncEnabled) return;

  const profiles = await StorageHelper.getAllProfiles();
  let changed = false;

  for (const [key, { newValue }] of Object.entries(changes)) {
    if (!key.startsWith(StorageHelper.SYNC_PREFIX)) continue;
    const domain = key.slice(StorageHelper.SYNC_PREFIX.length);

    if (!newValue) {
      // Profile deleted on another device
      if (profiles[domain]) {
        delete profiles[domain];
        changed = true;
      }
      continue;
    }

    const local = profiles[domain];
    // Only overwrite if the synced version is newer
    if (!local || (newValue.updatedAt || 0) > (local.updatedAt || 0)) {
      profiles[domain] = newValue;
      changed = true;
    }
  }

  // Write directly to local (bypassing saveProfile) to avoid sync loop
  if (changed) await chrome.storage.local.set({ profiles });
});

/**
 * safeInject — type-aware, Trusted Types-safe injection helper
 *
 * @param {number} tabId
 * @param {'css'|'js'|'jquery'} type
 * @param {string} code
 * @param {{ styleId?: string, useJQuery?: boolean }} [opts]
 */
async function safeInject(tabId, type, code, opts = {}) {
  switch (type) {

    // ── CSS ────────────────────────────────────────────────────────────────
    case 'css':
      return chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        world: 'MAIN',
        func: (css, sid) => {
          let el = document.getElementById(sid);
          if (!el) {
            el = document.createElement('style');
            el.id = sid;
            (document.head || document.documentElement).appendChild(el);
          }
          el.textContent = css; // textContent is not a TrustedHTML sink — safe as-is
        },
        args: [code, opts.styleId],
      });

    // ── jQuery lib ─────────────────────────────────────────────────────────
    case 'jquery':
      return chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        world: 'MAIN',
        func: (src) => {
          try {
            // eslint-disable-next-line no-eval
            if (typeof trustedTypes !== 'undefined' && trustedTypes.createPolicy) {
              const p = trustedTypes.createPolicy('dev-override-jquery', { createScript: (s) => s });
              (0, eval)(p.createScript(src));
            } else {
              (0, eval)(src);
            }
          } catch (e) { console.error('[Dev Override] jQuery init error:', e); }
        },
        args: [code],
      });

    // ── JS (plain or jQuery-wrapped) ───────────────────────────────────────
    case 'js':
      return chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        world: 'MAIN',
        func: (src, withJQuery) => {
          try {
            const runCode = withJQuery
              ? `(function($, jQuery){ ${src} })(window.jQuery, window.jQuery);`
              : src;
            // eslint-disable-next-line no-eval
            if (typeof trustedTypes !== 'undefined' && trustedTypes.createPolicy) {
              const p = trustedTypes.createPolicy('dev-override-exec', { createScript: (s) => s });
              (0, eval)(p.createScript(runCode));
            } else {
              (0, eval)(runCode);
            }
          } catch (e) { console.error('[Dev Override] JS error:', e); }
        },
        args: [code, !!opts.useJQuery],
      });

    default:
      throw new Error(`[Dev Override] safeInject: unknown type "${type}"`);
  }
}

/**
 * Inject CSS/JS to a specific tab via chrome.scripting (bypasses page CSP)
 */
async function injectToTab(tabId, tabUrl, domain, profile) {
  const results = { success: true, domain, jquery: false, css: false, js: false, errors: [] };

  try {
    // Ensure profile has an id (old profiles may not have one)
    if (!profile.id) profile.id = domain;

    // ── 0. Cleanup ONLY if re-injecting the SAME profile ────────────────────────
    // This prevents duplicate injects from the same profile, but allows multiple profiles
    const cleanProfileId = profile.id.replace(/\./g, '-');
    try {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        world: 'MAIN',
        func: (profileIdClean) => {
          // Remove style tags ONLY from this specific profile ID
          document.querySelectorAll(`style[id^="dev-override-${profileIdClean}-"]`).forEach(el => el.remove());
        },
        args: [cleanProfileId]
      });
    } catch (e) {
      console.warn('[Dev Override] Cleanup failed:', e.message);
    }


    // ── 1. jQuery lib ────────────────────────────────────────────────────────
    if (profile.useJQuery) {
      try {
        const [jqPresent] = await chrome.scripting.executeScript({
          target: { tabId, allFrames: false },
          world: 'MAIN',
          func: () => typeof window.jQuery !== 'undefined',
        });

        if (!jqPresent?.result) {
          const jqCode = await fetch(chrome.runtime.getURL('lib/jquery.min.js')).then(r => r.text());
          await safeInject(tabId, 'jquery', jqCode);
        }

        results.jquery = true;
      } catch (e) {
        console.warn('[Dev Override] jQuery inject failed:', e.message);
        results.jquery = false;
      }
    }

    // ── 2 & 3. Snippets (CSS + JS) ───────────────────────────────────────────
    const snippets = profile.snippets && profile.snippets.length
      ? profile.snippets.filter(s => s.enabled !== false)
      : [{ css: profile.css || '', js: profile.js || '', delay: profile.delay || 0 }];

    for (let i = 0; i < snippets.length; i++) {
      const snippet = snippets[i];
      // Use profile.id instead of domain to allow multiple profiles on same page
      const styleId = `dev-override-${profile.id.replace(/\./g, '-')}-${i}`;

      if (snippet.delay && snippet.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, snippet.delay * 1000));
      }

      if (snippet.css && snippet.css.trim()) {
        try {
          await safeInject(tabId, 'css', snippet.css, { styleId });
          results.css = true;
        } catch (e) {
          results.errors.push({ type: 'css', message: e.message });
        }
      }

      if (snippet.js && snippet.js.trim()) {
        try {
          await safeInject(tabId, 'js', snippet.js, { useJQuery: profile.useJQuery });
          results.js = true;
        } catch (e) {
          results.errors.push({ type: 'js', message: e.message });
        }
      }
    }

    // ── 4. Visual indicator ──────────────────────────────────────────────────
    chrome.tabs.sendMessage(tabId, { type: 'SHOW_INDICATOR', data: results }).catch(() => {});

    injectionStatus.set(tabId, { domain, status: 'success', timestamp: Date.now() });

    const settings = await StorageHelper.getSettings();
    if (settings.showNotifications) showNotification(`✅ Injected to ${domain}`, 'success');

    // ── 5. Inject history ────────────────────────────────────────────────────
    await StorageHelper.addInjectEvent({ domain, url: tabUrl, timestamp: Date.now(), success: true });

    return results;

  } catch (error) {
    console.error('Injection failed:', error);
    injectionStatus.set(tabId, { domain, status: 'error', error: error.message, timestamp: Date.now() });
    await StorageHelper.addInjectEvent({ domain, url: tabUrl, timestamp: Date.now(), success: false });
    return { success: false, error: error.message };
  }
}

/**
 * Handle manual injection from popup
 */
async function handleManualInject({ tabId, domain }) {
  const profile = await StorageHelper.getProfile(domain);
  const tab = await chrome.tabs.get(tabId).catch(() => ({}));
  return await injectToTab(tabId, tab.url || '', domain, profile);
}

/**
 * Handle live reload - re-inject to all tabs with matching domain
 */
async function handleLiveReload({ domain }) {
  const tabs = await chrome.tabs.query({});
  const profile = await StorageHelper.getProfile(domain);

  let injectedCount = 0;

  for (const tab of tabs) {
    const tabDomain = StorageHelper.getDomainFromUrl(tab.url);
    if (tabDomain === domain && profile.enabled) {
      await injectToTab(tab.id, tab.url, domain, profile);
      injectedCount++;
    }
  }

  return { success: true, injectedCount };
}

/**
 * Live reload for all tabs (when storage changes)
 */
async function handleLiveReloadForAllTabs() {
  const tabs = await chrome.tabs.query({});
  const profiles = await StorageHelper.getAllProfiles();

  for (const tab of tabs) {
    const domain = StorageHelper.getDomainFromUrl(tab.url);
    if (!domain) continue;

    const profile = profiles[domain];
    if (profile && profile.enabled && profile.autoInject) {
      if (StorageHelper.matchUrlPattern(tab.url, profile.urlPattern)) {
        await injectToTab(tab.id, tab.url, domain, profile);
      }
    }
  }
}

/**
 * Show notification (badge + optional notification)
 */
function showNotification(_message, type = 'info') {
  if (!chrome.action) return;
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  };

  chrome.action.setBadgeText({ text: '✓' });
  chrome.action.setBadgeBackgroundColor({ color: colors[type] });

  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 2000);
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Dev Override Pro installed!');
    // Initialize default settings
    StorageHelper.saveSettings({
      theme: 'dark',
      autoInjectAll: false,
      showNotifications: true,
      liveReload: false
    });
  }
});

console.log('🚀 Background Service Worker loaded');
