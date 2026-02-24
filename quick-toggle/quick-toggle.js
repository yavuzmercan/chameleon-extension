// Quick Toggle Popup Logic - V3 Current Domain Only
// ────────────────────────────────────────────────────────────

let currentDomain = '';
let currentProfile = null;

// DOM Elements
const domainEl = document.getElementById('currentDomain');
const profileSection = document.getElementById('profileSection');
const emptyState = document.getElementById('emptyState');
const snippetsContainer = document.getElementById('snippetsContainer');
const profileNameEl = document.getElementById('profileName');
const autoInjectToggle = document.getElementById('autoInjectToggle');
const injectNowBtn = document.getElementById('injectNowBtn');
const statusMessage = document.getElementById('statusMessage');

// ────────────────────────────────────────────────────────────
// Initialize
// ────────────────────────────────────────────────────────────

async function init() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const url = new URL(tab.url);
    currentDomain = url.hostname;
    domainEl.textContent = currentDomain;

    // Load profiles
    const allProfiles = await StorageHelper.getAllProfilesArray();

    // Find profile for this domain (enabled or not)
    currentProfile = allProfiles.find(p => p.domain === currentDomain);

    // Render UI
    if (currentProfile) {
      renderProfile();
    } else {
      showEmptyState();
    }

    // Setup event listeners
    setupEventListeners();

  } catch (error) {
    console.error('Quick Toggle init error:', error);
    showStatus('Failed to initialize', 'error');
  }
}

// ────────────────────────────────────────────────────────────
// Rendering
// ────────────────────────────────────────────────────────────

function renderProfile() {
  // Show profile section, hide empty state
  profileSection.style.display = 'block';
  emptyState.style.display = 'none';

  // Set profile name
  profileNameEl.textContent = currentProfile.name || currentDomain || 'Unnamed Profile';

  // Set auto-inject toggle
  autoInjectToggle.checked = currentProfile.autoInject || false;

  // Render snippets
  renderSnippets();
}

function renderSnippets() {
  snippetsContainer.innerHTML = '';

  const snippets = currentProfile.snippets || [];

  if (snippets.length === 0) {
    // No snippets - show message
    const message = document.createElement('div');
    message.className = 'no-snippets-message';
    message.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 12px;">
        No snippets yet.<br>
        Open DevTools → <strong>Chameleon</strong> tab to add snippets
      </div>
    `;
    snippetsContainer.appendChild(message);
    return;
  }

  // Render each snippet
  snippets.forEach(snippet => {
    const item = createSnippetItem(snippet);
    snippetsContainer.appendChild(item);
  });
}

function createSnippetItem(snippet) {
  const item = document.createElement('div');
  item.className = 'snippet-item';

  const name = document.createElement('span');
  name.className = 'snippet-name';
  name.textContent = snippet.name || `Snippet ${snippet.id}`;

  const toggle = createToggle(snippet.enabled !== false, async (checked) => {
    await toggleSnippet(snippet, checked);
  });

  item.appendChild(name);
  item.appendChild(toggle);

  return item;
}

function createToggle(checked, onChange) {
  const label = document.createElement('label');
  label.className = 'toggle-switch-small';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', (e) => {
    e.stopPropagation();
    onChange(e.target.checked);
  });

  const slider = document.createElement('span');
  slider.className = 'toggle-slider';

  label.appendChild(input);
  label.appendChild(slider);

  return label;
}

function showEmptyState() {
  // Hide profile section, show empty state
  profileSection.style.display = 'none';
  emptyState.style.display = 'block';
}

// ────────────────────────────────────────────────────────────
// Toggle Handlers
// ────────────────────────────────────────────────────────────

async function toggleAutoInject(enabled) {
  console.log('[Quick Toggle] toggleAutoInject:', enabled);

  try {
    currentProfile.autoInject = enabled;
    await StorageHelper.saveProfile(currentProfile.domain, currentProfile);

    // Reload page so the change takes effect immediately
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.reload(tab.id);
    }

    if (enabled) {
      showStatus('✓ Auto-inject enabled', 'success');
    } else {
      showStatus('✓ Auto-inject disabled', 'success');
    }
  } catch (error) {
    console.error('[Quick Toggle] Toggle auto-inject error:', error);
    showStatus('Failed to toggle auto-inject', 'error');
    // Revert toggle
    autoInjectToggle.checked = !enabled;
  }
}

async function toggleSnippet(snippet, enabled) {
  console.log('[Quick Toggle] toggleSnippet:', {
    snippetName: snippet.name || snippet.id,
    enabled
  });

  try {
    snippet.enabled = enabled;
    await StorageHelper.saveProfile(currentProfile.domain, currentProfile);

    // Re-inject if profile is enabled
    if (currentProfile.enabled) {
      console.log('[Quick Toggle] Re-injecting profile after snippet toggle...');
      await injectProfile();
      console.log('[Quick Toggle] Re-inject completed');
    }

    showStatus(
      enabled ? '✓ Snippet enabled' : 'Snippet disabled',
      enabled ? 'success' : 'error'
    );

    // Re-render to update UI
    renderSnippets();
  } catch (error) {
    console.error('[Quick Toggle] Toggle snippet error:', error);
    showStatus('Failed to toggle snippet', 'error');
  }
}

// ────────────────────────────────────────────────────────────
// Event Handlers
// ────────────────────────────────────────────────────────────

function setupEventListeners() {
  // Auto-inject toggle
  if (autoInjectToggle) {
    autoInjectToggle.addEventListener('change', (e) => {
      toggleAutoInject(e.target.checked);
    });
  }

  // Inject Now button
  if (injectNowBtn) {
    injectNowBtn.addEventListener('click', async () => {
      try {
        await injectProfile();
        showStatus('✓ Injected successfully', 'success');
      } catch (error) {
        console.error('Inject error:', error);
        showStatus('Failed to inject', 'error');
      }
    });
  }

  // Listen for storage changes (e.g. from devtools panel)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.profiles || !currentDomain) return;
    const profiles = changes.profiles.newValue || {};
    const updated = profiles[currentDomain];
    if (updated) {
      currentProfile = { ...updated, id: updated.id || currentDomain, domain: currentDomain, name: updated.name || currentDomain };
      renderProfile();
    }
  });
}

// ────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────

async function injectProfile() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // Send message to background script to inject
  await chrome.runtime.sendMessage({
    action: 'injectProfile',
    profileId: currentProfile.id,
    tabId: tab.id
  });
}

function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

// ────────────────────────────────────────────────────────────
// Initialize on load
// ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
