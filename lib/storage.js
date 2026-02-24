/**
 * Storage Helper - Domain-based profile management
 */

const StorageHelper = {

  // Default profile structure
  getDefaultProfile() {
    return {
      enabled: true,
      css: '',
      js: '',
      autoInject: false,
      useJQuery: false,
      url: '',
      delay: 0,
      urlPattern: '',
      snippets: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  },

  // Get all profiles
  async getAllProfiles() {
    const result = await chrome.storage.local.get('profiles');
    return result.profiles || {};
  },

  // Get all profiles as array (for quick toggle and UI lists)
  async getAllProfilesArray() {
    const profiles = await this.getAllProfiles();
    return Object.entries(profiles).map(([domain, profile]) => ({
      ...profile,
      id: profile.id || domain, // Use domain as ID if no ID exists
      domain: domain,
      name: profile.name || domain // Fallback to domain if no name
    }));
  },

  // Get profile by ID (currently domain-based)
  async getProfileById(id) {
    const profiles = await this.getAllProfiles();
    // Try as domain first
    if (profiles[id]) {
      return { ...profiles[id], id, domain: id };
    }
    // Search by ID field if exists
    for (const [domain, profile] of Object.entries(profiles)) {
      if (profile.id === id) {
        return { ...profile, domain };
      }
    }
    return null;
  },

  // Get profile for specific domain
  async getProfile(domain) {
    const profiles = await this.getAllProfiles();
    return profiles[domain] || this.getDefaultProfile();
  },

  // Save profile for domain
  async saveProfile(domain, profileData) {
    const profiles = await this.getAllProfiles();
    profiles[domain] = {
      ...this.getDefaultProfile(),
      ...profileData,
      updatedAt: Date.now()
    };
    await chrome.storage.local.set({ profiles });
    // Mirror to sync if enabled
    const settings = await this.getSettings();
    if (settings.syncEnabled) {
      await this.syncPushProfile(domain, profiles[domain]).catch(() => {});
    }
    return profiles[domain];
  },

  // Delete profile
  async deleteProfile(domain) {
    const profiles = await this.getAllProfiles();
    delete profiles[domain];
    await chrome.storage.local.set({ profiles });
    // Remove from sync if enabled
    const settings = await this.getSettings();
    if (settings.syncEnabled) {
      await chrome.storage.sync.remove(this.SYNC_PREFIX + domain).catch(() => {});
    }
  },

  // Get global settings
  async getSettings() {
    const result = await chrome.storage.local.get('settings');
    return result.settings || {
      theme: 'dark',
      autoInjectAll: false,
      showNotifications: true,
      liveReload: false,
      syncEnabled: false
    };
  },

  // Save global settings
  async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  },

  // Export all data
  async exportData() {
    const profiles = await this.getAllProfiles();
    const settings = await this.getSettings();
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      profiles,
      settings
    };
  },

  // Import data
  async importData(data) {
    if (!data.profiles) throw new Error('Invalid import data');
    await chrome.storage.local.set({
      profiles: data.profiles,
      settings: data.settings || {}
    });
  },

  // Get current domain from URL
  getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return null;
    }
  },

  // Match URL against a glob pattern (empty pattern = always match)
  matchUrlPattern(url, pattern) {
    if (!pattern || !pattern.trim()) return true;
    const escaped = pattern.trim()
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    try {
      return new RegExp('^' + escaped + '$', 'i').test(url);
    } catch (e) {
      return true; // Invalid pattern → don't block injection
    }
  },

  // Inject history (separate key to avoid storage.onChanged loop)
  async getInjectHistory() {
    const r = await chrome.storage.local.get('injectHistory');
    return r.injectHistory || [];
  },

  async addInjectEvent(event) {
    const history = await this.getInjectHistory();
    history.unshift(event);
    if (history.length > 50) history.length = 50;
    await chrome.storage.local.set({ injectHistory: history });
  },

  async clearInjectHistory() {
    await chrome.storage.local.set({ injectHistory: [] });
  },

  // ── Sync storage ────────────────────────────────────────────────────────

  SYNC_PREFIX: 'sp_',
  SYNC_ITEM_LIMIT: 7168, // 7 KB safe margin (chrome.storage.sync max = 8192 bytes/item)

  // Push one profile to chrome.storage.sync
  // Returns false (and logs warning) if the profile is too large to sync.
  async syncPushProfile(domain, profile) {
    const payload = JSON.stringify(profile);
    if (payload.length > this.SYNC_ITEM_LIMIT) {
      console.warn(`[Dev Override] Profile "${domain}" too large to sync (${payload.length} B > ${this.SYNC_ITEM_LIMIT} B). Skipped.`);
      return false;
    }
    await chrome.storage.sync.set({ [this.SYNC_PREFIX + domain]: profile });
    return true;
  },

  // Push all local profiles to sync, return summary { synced, skipped, errors }
  async pushAllToSync() {
    const profiles = await this.getAllProfiles();
    const result = { synced: 0, skipped: 0, errors: [] };
    for (const [domain, profile] of Object.entries(profiles)) {
      try {
        const ok = await this.syncPushProfile(domain, profile);
        if (ok) result.synced++; else result.skipped++;
      } catch (e) {
        result.errors.push({ domain, error: e.message });
      }
    }
    return result;
  },

  // Pull synced profiles and merge into local (sync wins when updatedAt is newer)
  async pullFromSync() {
    const syncData = await chrome.storage.sync.get(null);
    const profiles = await this.getAllProfiles();
    let merged = 0;
    for (const [key, syncProfile] of Object.entries(syncData)) {
      if (!key.startsWith(this.SYNC_PREFIX)) continue;
      if (!syncProfile || typeof syncProfile !== 'object') continue;
      const domain = key.slice(this.SYNC_PREFIX.length);
      const local = profiles[domain];
      if (!local || (syncProfile.updatedAt || 0) > (local.updatedAt || 0)) {
        profiles[domain] = syncProfile;
        merged++;
      }
    }
    if (merged > 0) await chrome.storage.local.set({ profiles });
    return merged;
  },

  // Get list of domains currently stored in sync
  async getSyncedDomains() {
    const syncData = await chrome.storage.sync.get(null);
    return Object.keys(syncData)
      .filter(k => k.startsWith(this.SYNC_PREFIX))
      .map(k => k.slice(this.SYNC_PREFIX.length));
  },

  // Search profiles
  async searchProfiles(query) {
    const profiles = await this.getAllProfiles();
    const results = {};

    for (const [domain, profile] of Object.entries(profiles)) {
      if (domain.includes(query) ||
          profile.css.includes(query) ||
          profile.js.includes(query)) {
        results[domain] = profile;
      }
    }

    return results;
  }
};

// Make it available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageHelper;
}
