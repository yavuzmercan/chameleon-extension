/**
 * i18n — English (en) and Turkish (tr) UI translations
 */
const I18N = {

  // ──────────────────────────────────────────────────────────────────────────
  en: {
    langSwitch: 'TR',
    titleLang: 'Switch to Turkish',

    // Header button titles
    titleThemeLight: 'Switch to Light theme',
    titleThemeDark:  'Switch to Dark theme',
    titlePickElement: 'Pick element from page',
    titleHistory:  'Inject History',
    titleSettings: 'Settings & Profiles',
    titleExport:   'Export current profile',
    titleHelp:     'How to use',
    uploadCssTitle: 'Upload CSS file from desktop',
    uploadJsTitle:  'Upload JS file from desktop',
    clearCssTitle:  'Clear CSS editor',
    clearJsTitle:   'Clear JS editor',

    // Domain info
    currentDomainLabel:   'Current Domain:',
    autoInjectLabel:      'Auto-inject',
    urlPatternLabel:      'URL Pattern:',
    urlPatternPlaceholder:'e.g. *example.com/admin/*',

    // Snippet toolbar
    snippetNamePlaceholder: 'Snippet name',
    delayLabel:      'Delay:',
    addSnippetBtn:   '+ Add',
    deleteSnippetBtn:'Del',
    snippetOnLabel:  'On',
    defaultSnippet:  '(default css/js)',

    // Action buttons
    saveBtn:   '💾 Save',
    injectBtn: '🚀 Inject Now',
    exportFilesBtn: '📦 Export Files ▼',
    exportNormal: 'Export as ZIP',
    exportMinified: 'Export Minified',
    minifyCode: '⚡ Minify code',
    clearBtn:  '🧹 Clear',

    // Keyboard shortcut descriptions
    shortcutSave:         'Save',
    shortcutInject:       'Inject',
    shortcutAutocomplete: 'Autocomplete',
    shortcutIndent:       'Indent',
    shortcutComment:      'Toggle Comment',

    // Settings panel
    settingsPanelTitle:   'Settings & Profiles',
    profilesSectionTitle: 'Profiles',
    profileSearchPlaceholder: '🔍 Search profiles...',
    noProfilesText:    'No profiles yet',
    noProfilesSubtext: 'Create profiles by saving CSS/JS for different domains',
    globalSettingsTitle: 'Global Settings',
    liveReloadLabel: 'Live Reload',
    liveReloadDesc:  'Auto re-inject when code changes',
    notificationsLabel: 'Show Notifications',
    notificationsDesc:  'Display injection status notifications',
    autoInjectAllLabel: 'Auto-inject All Profiles',
    autoInjectAllDesc:  'Enable auto-injection for all saved profiles',
    lightThemeLabel: 'Light Theme',
    lightThemeDesc:  'Switch between dark and light mode',
    syncLabel: 'Sync Across Devices',
    syncDesc:  'Sync profiles via your Chrome account',
    dataManagementTitle: 'Data Management',
    importProfilesBtn: '📥 Import Profiles',
    exportAllBtn:      '📤 Export All Data',
    clearAllProfilesBtn: '🗑️ Clear All Profiles',
    versionInfo: 'Version 2.0.0 | Made with ❤️ for developers',

    // History panel
    historyPanelTitle:    'Inject History',
    clearHistoryBtnLabel: '🗑️ Clear',
    historyEmpty: 'No inject events yet',

    // Help panel
    helpPanelTitle: 'How to Use',

    // Picker modal
    pickerModalTitle:    '🎯 Element Picked',
    pickerInsertAsLabel: 'Insert as:',

    // Status messages (string values)
    statusSaved:        '✅ Saved!',
    statusSaveFailed:   '❌ Save failed: ',
    statusInjecting:    '⏳ Injecting...',
    statusInjected:     '✅ Injected!',
    statusInjectFailed: '❌ Failed: ',
    statusCleared:      '🧹 Cleared',
    statusSettingsSaved:'Settings saved',
    statusImportOk:     '✅ Import successful!',
    statusImportFail:   '❌ Import failed: ',
    statusExportOk:     '✅ Exported!',
    statusExportFail:   '❌ Export failed: ',
    statusExportCurrentOk: '✅ Exported current profile',
    statusNoExportDomain:  'No domain to export',
    statusAllCleared:   '🗑️ All profiles cleared',
    statusCannotDetect: 'Cannot detect current domain',
    statusInitFailed:   'Failed to initialize: ',
    statusAutoInjectOn:  'Auto-inject enabled',
    statusAutoInjectOff: 'Auto-inject disabled',
    statusJQueryWillInject: '🟡 jQuery will be injected before your JS',
    statusJQueryDisabled:   'jQuery disabled',
    statusJQueryEnabled:    '🟡 jQuery enabled',
    statusSyncing:          'Syncing\u2026',
    statusSyncDisabled:     'Sync disabled \u2014 profiles kept locally',
    statusSyncFailed:       'Sync failed: ',

    // Status messages (function templates)
    statusLoaded:      (d)       => `Loaded: ${d} \u2014 tab opened`,
    statusDeleted:     (d)       => `Deleted ${d}`,
    statusSyncMerged:  (n)       => `Synced: ${n} profile${n > 1 ? 's' : ''} updated`,
    statusSyncOk:      (n, skip) => `Sync enabled \u2014 ${n} profile${n !== 1 ? 's' : ''} uploaded` + (skip ? `, ${skip} skipped (too large)` : ''),

    // Confirm dialogs
    confirmClearEditors:  'Clear CSS & JS for this domain?',
    confirmClearCssEditor: 'Clear CSS editor content?',
    confirmClearJsEditor:  'Clear JavaScript editor content?',
    confirmDeleteSnippet: (name) => `Delete "${name}"?`,
    confirmDeleteProfile: (domain) => `Delete profile for ${domain}?`,
    confirmClearAll1: '\u26a0\ufe0f This will delete ALL profiles. Are you sure?',
    confirmClearAll2: 'Really? This cannot be undone!',

    // jQuery toggle titles
    jqToggleAvailable:   'jQuery is already loaded on this page',
    jqToggleUnavailable: 'jQuery is not available on this page',
    jqInsertAvailable:   'Insert as jQuery code',
    jqInsertUnavailable: 'Enable "Use jQuery" first or open a page that already has jQuery',

    // Help panel sections
    help: {
      sections: [
        {
          title: '1. CSS & JS Inject',
          steps: [
            'Write CSS in the CSS editor, JavaScript in the JS editor',
            '<strong>Save</strong> \u2014 stores code for this domain',
            '<strong>Inject Now</strong> \u2014 applies to the active tab instantly',
          ],
          note: "Injection bypasses the page\u2019s CSP rules via <code>chrome.scripting</code>.",
        },
        {
          title: '2. Snippets',
          steps: [
            'Click <strong>+ Add</strong> to create a new snippet',
            'Give it a name, write CSS/JS, set an optional delay (seconds)',
            'Use <strong>\u25b2 \u25bc</strong> to change injection order',
            'Toggle <strong>On/Off</strong> per snippet \u2014 disabled ones are skipped',
          ],
          note: 'Snippets are injected in list order. Disabled snippets show <code>\u2717</code> in the selector.',
        },
        {
          title: '3. Auto-inject & URL Pattern',
          steps: [
            'Enable <strong>Auto-inject</strong> \u2014 code runs on every page load for this domain',
            'Set a <strong>URL Pattern</strong> to target specific pages only',
          ],
          table: [
            ['Pattern', 'Matches'],
            ['<code>*example.com/admin*</code>', 'Any URL containing that path'],
            ['<code>*checkout*</code>', 'Any URL with \u201ccheckout\u201d'],
            ['<em>(empty)</em>', 'All URLs on this domain'],
          ],
        },
        {
          title: '4. Element Picker \uD83C\uDFAF',
          steps: [
            'Click the <strong>\uD83C\uDFAF</strong> icon \u2014 popup closes, page highlights elements',
            'Hover and click the element you want',
            'Popup reopens \u2014 choose insert mode: CSS / JS / jQuery',
            'Press <strong>Esc</strong> to cancel the picker',
          ],
        },
        {
          title: '5. jQuery',
          steps: [
            'jQuery toggle is only available when <code>window.jQuery</code> is detected on the page',
            'When enabled, your JS runs inside <code>(function($, jQuery){\u2026})</code> \u2014 works even in noConflict mode',
          ],
        },
        {
          title: '6. Live Reload',
          note: 'Settings \u2192 <strong>Live Reload</strong>: saving a profile instantly re-injects into all matching open tabs.',
        },
        {
          title: '7. Sync & Export',
          steps: [
            'Settings \u2192 <strong>Sync Across Devices</strong> \u2014 profiles are mirrored via your Chrome account (7\u00a0KB/profile limit)',
            'Settings \u2192 <strong>Export All</strong> / <strong>Import Profiles</strong> \u2014 JSON backup & restore',
          ],
        },
        {
          title: '8. File Upload & Export',
          steps: [
            '<strong>📁 Upload</strong> \u2014 click upload button in editor header to load CSS/JS files from your desktop',
            '<strong>📦 Export Files</strong> \u2014 export all enabled snippets as a ZIP package',
            '<strong>⚡ Export Minified</strong> \u2014 export with code minification (smaller file size)',
          ],
          note: 'Uploaded files load into the editor but aren\'t saved until you click <strong>Save</strong>.',
        },
        {
          title: '9. Editor Tools',
          steps: [
            '<strong>🗑️ Clear Editor</strong> \u2014 clear CSS or JS editor content with confirmation',
            'Clearing only affects the editor \u2014 profile isn\'t changed until you <strong>Save</strong>',
          ],
        },
        {
          title: '10. Layout Switching',
          note: 'Settings \u2192 <strong>Panel Layout</strong>: choose between Layout A (sidebar), B (side-by-side), or C (three columns). Changes apply instantly.',
        },
        {
          title: 'Keyboard Shortcuts',
          shortcuts: [
            ['Ctrl', 'S',     'Save'],
            ['Ctrl', 'Enter', 'Inject Now'],
            ['Ctrl', 'Space', 'Autocomplete'],
            ['Ctrl', '/',     'Toggle Comment'],
            ['Esc',  null,    'Cancel element picker'],
          ],
        },
        {
          title: 'Troubleshooting',
          list: [
            "<strong>Inject doesn\u2019t work</strong> \u2014 check that the profile is <em>On</em> and URL Pattern matches",
            '<strong>JS error</strong> \u2014 open F12 Console, look for <code>[Dev Override]</code> prefix',
            '<strong>jQuery not available</strong> \u2014 toggle is disabled when page has no jQuery',
            '<strong>Sync skipped</strong> \u2014 profile exceeds 7\u00a0KB; trim CSS/JS or split into snippets',
            '<code>chrome://</code> pages cannot be injected',
          ],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  tr: {
    langSwitch: 'EN',
    titleLang: 'Switch to English',

    // Header button titles
    titleThemeLight: 'A\u00e7\u0131k temaya ge\u00e7',
    titleThemeDark:  'Koyu temaya ge\u00e7',
    titlePickElement: 'Sayfadan element se\u00e7',
    titleHistory:  'Inject Ge\u00e7mi\u015fi',
    titleSettings: 'Ayarlar & Profiller',
    titleExport:   'Mevcut profili d\u0131\u015fa aktar',
    titleHelp:     'Nas\u0131l kullan\u0131l\u0131r',
    uploadCssTitle: 'Masaüstünden CSS dosyası yükle',
    uploadJsTitle:  'Masaüstünden JS dosyası yükle',
    clearCssTitle:  'CSS editörünü temizle',
    clearJsTitle:   'JS editörünü temizle',

    // Domain info
    currentDomainLabel:    'Mevcut Domain:',
    autoInjectLabel:       'Oto. Inject',
    urlPatternLabel:       'URL Deseni:',
    urlPatternPlaceholder: '\u00f6rn. *example.com/admin/*',

    // Snippet toolbar
    snippetNamePlaceholder: 'Snippet ad\u0131',
    delayLabel:       'Gecikme:',
    addSnippetBtn:    '+ Ekle',
    deleteSnippetBtn: 'Sil',
    snippetOnLabel:   'A\u00e7\u0131k',
    defaultSnippet:   '(varsay\u0131lan css/js)',

    // Action buttons
    saveBtn:   '\uD83D\uDCBE Kaydet',
    injectBtn: '\uD83D\uDE80 Inject Et',
    exportFilesBtn: '\uD83D\uDCE6 Dosya Dışa Aktar ▼',
    exportNormal: 'ZIP Olarak Dışa Aktar',
    exportMinified: 'Küçültülmüş Dışa Aktar',
    minifyCode: '\u26A1 Kodu küçült',
    clearBtn:  '\uD83E\uDDF9 Temizle',

    // Keyboard shortcut descriptions
    shortcutSave:         'Kaydet',
    shortcutInject:       'Inject',
    shortcutAutocomplete: 'Otomatik Tamamla',
    shortcutIndent:       'Girintile',
    shortcutComment:      'Yoruma Çevir',

    // Settings panel
    settingsPanelTitle:   'Ayarlar & Profiller',
    profilesSectionTitle: 'Profiller',
    profileSearchPlaceholder: '\uD83D\uDD0D Profil ara...',
    noProfilesText:    'Hen\u00fcz profil yok',
    noProfilesSubtext: 'Farkl\u0131 domainler i\u00e7in CSS/JS kaydederek profil olu\u015fturun',
    globalSettingsTitle: 'Genel Ayarlar',
    liveReloadLabel: 'Canl\u0131 Yenileme',
    liveReloadDesc:  'Kod de\u011fi\u015fti\u011finde otomatik re-inject yap',
    notificationsLabel: 'Bildirim G\u00f6ster',
    notificationsDesc:  'Inject durumu bildirimlerini g\u00f6ster',
    autoInjectAllLabel: 'T\u00fcm\u00fcn\u00fc Otomatik Inject Et',
    autoInjectAllDesc:  'T\u00fcm kay\u0131tl\u0131 profiller i\u00e7in otomatik inject\u2019i etkinle\u015ftir',
    lightThemeLabel: 'A\u00e7\u0131k Tema',
    lightThemeDesc:  'Koyu ve a\u00e7\u0131k tema aras\u0131nda ge\u00e7i\u015f yap',
    syncLabel: 'Cihazlar Aras\u0131 Senkronizasyon',
    syncDesc:  'Chrome hesab\u0131n\u0131z \u00fczerinden profilleri senkronize edin',
    dataManagementTitle: 'Veri Y\u00f6netimi',
    importProfilesBtn:   '\uD83D\uDCE5 Profilleri \u0130\u00e7e Aktar',
    exportAllBtn:        '\uD83D\uDCE4 T\u00fcm\u00fcn\u00fc D\u0131\u015fa Aktar',
    clearAllProfilesBtn: '\uD83D\uDDD1\uFE0F T\u00fcm Profilleri Sil',
    versionInfo: 'S\u00fcr\u00fcm 2.0.0 | Geli\u015ftiriciler i\u00e7in \u2764\uFE0F ile yap\u0131ld\u0131',

    // History panel
    historyPanelTitle:    'Inject Ge\u00e7mi\u015fi',
    clearHistoryBtnLabel: '\uD83D\uDDD1\uFE0F Temizle',
    historyEmpty: 'Hen\u00fcz inject ge\u00e7mi\u015fi yok',

    // Help panel
    helpPanelTitle: 'Nas\u0131l Kullan\u0131l\u0131r',

    // Picker modal
    pickerModalTitle:    '\uD83C\uDFAF Element Se\u00e7ildi',
    pickerInsertAsLabel: '\u015eu \u015fekilde ekle:',

    // Status messages (string values)
    statusSaved:        '\u2705 Kaydedildi!',
    statusSaveFailed:   '\u274c Kaydetme hatas\u0131: ',
    statusInjecting:    '\u23f3 Inject ediliyor...',
    statusInjected:     '\u2705 Inject edildi!',
    statusInjectFailed: '\u274c Hata: ',
    statusCleared:      '\uD83E\uDDF9 Temizlendi',
    statusSettingsSaved:'Ayarlar kaydedildi',
    statusImportOk:     '\u2705 \u0130\u00e7e aktarma ba\u015far\u0131l\u0131!',
    statusImportFail:   '\u274c \u0130\u00e7e aktarma hatas\u0131: ',
    statusExportOk:     '\u2705 D\u0131\u015fa aktar\u0131ld\u0131!',
    statusExportFail:   '\u274c D\u0131\u015fa aktarma hatas\u0131: ',
    statusExportCurrentOk: '\u2705 Mevcut profil d\u0131\u015fa aktar\u0131ld\u0131',
    statusNoExportDomain:  'D\u0131\u015fa aktar\u0131lacak domain yok',
    statusAllCleared:   '\uD83D\uDDD1\uFE0F T\u00fcm profiller silindi',
    statusCannotDetect: 'Mevcut domain tespit edilemiyor',
    statusInitFailed:   'Ba\u015flatma hatas\u0131: ',
    statusAutoInjectOn:  'Otomatik inject etkinle\u015ftirildi',
    statusAutoInjectOff: 'Otomatik inject devre d\u0131\u015f\u0131',
    statusJQueryWillInject: '\uD83D\uDFE1 jQuery JS\u2019ten \u00f6nce inject edilecek',
    statusJQueryDisabled:   'jQuery devre d\u0131\u015f\u0131',
    statusJQueryEnabled:    '\uD83D\uDFE1 jQuery etkinle\u015ftirildi',
    statusSyncing:          'Senkronize ediliyor\u2026',
    statusSyncDisabled:     'Senkronizasyon devre d\u0131\u015f\u0131 \u2014 profiller yerel olarak saklan\u0131yor',
    statusSyncFailed:       'Senkronizasyon hatas\u0131: ',

    // Status messages (function templates)
    statusLoaded:     (d)       => `Y\u00fcklendi: ${d} \u2014 sekme a\u00e7\u0131ld\u0131`,
    statusDeleted:    (d)       => `Silindi: ${d}`,
    statusSyncMerged: (n)       => `Senkronize edildi: ${n} profil g\u00fcncellendi`,
    statusSyncOk:     (n, skip) => `Senkronizasyon aktif \u2014 ${n} profil y\u00fcklendi` + (skip ? `, ${skip} atland\u0131 (\u00e7ok b\u00fcy\u00fck)` : ''),

    // Confirm dialogs
    confirmClearEditors:  'Bu domain i\u00e7in CSS & JS temizlensin mi?',
    confirmClearCssEditor: 'CSS editörü içeriği temizlensin mi?',
    confirmClearJsEditor:  'JavaScript editörü içeriği temizlensin mi?',
    confirmDeleteSnippet: (name)   => `"${name}" silinsin mi?`,
    confirmDeleteProfile: (domain) => `${domain} i\u00e7in profil silinsin mi?`,
    confirmClearAll1: '\u26a0\ufe0f T\u00fcm profiller silinecek. Emin misiniz?',
    confirmClearAll2: 'Ger\u00e7ekten? Bu i\u015flem geri al\u0131namaz!',

    // jQuery toggle titles
    jqToggleAvailable:   'Bu sayfada jQuery zaten y\u00fckl\u00fc',
    jqToggleUnavailable: 'Bu sayfada jQuery mevcut de\u011fil',
    jqInsertAvailable:   'jQuery kodu olarak ekle',
    jqInsertUnavailable: '"jQuery Kullan"\u2019\u0131 etkinle\u015ftirin veya jQuery olan bir sayfay\u0131 a\u00e7\u0131n',

    // Help panel sections
    help: {
      sections: [
        {
          title: '1. CSS & JS Inject',
          steps: [
            'CSS edit\u00f6r\u00fcne CSS, JS edit\u00f6r\u00fcne JavaScript yaz\u0131n',
            '<strong>Kaydet</strong> \u2014 bu domain i\u00e7in kodu kaydeder',
            '<strong>Inject Et</strong> \u2014 aktif sekmeye an\u0131nda uygular',
          ],
          note: 'Inject, <code>chrome.scripting</code> ile yap\u0131l\u0131r \u2014 sayfan\u0131n CSP kurallar\u0131n\u0131 bypass eder.',
        },
        {
          title: '2. Snippet\u2019lar',
          steps: [
            '<strong>+ Ekle</strong>\u2019ye t\u0131klayarak yeni snippet olu\u015fturun',
            '\u0130sim verin, CSS/JS yaz\u0131n, iste\u011fe ba\u011fl\u0131 gecikme ayarlay\u0131n (saniye)',
            '<strong>\u25b2 \u25bc</strong> ile inject s\u0131ras\u0131n\u0131 de\u011fi\u015ftirin',
            'Her snippet i\u00e7in <strong>A\u00e7\u0131k/Kapal\u0131</strong> \u2014 kapal\u0131 olanlar inject edilmez',
          ],
          note: 'Snippet\u2019lar listede g\u00f6r\u00fcnd\u00fc\u011f\u00fc s\u0131rayla inject edilir. Kapal\u0131 snippet\u2019lar se\u00e7icide <code>\u2717</code> ile g\u00f6sterilir.',
        },
        {
          title: '3. Otomatik Inject & URL Deseni',
          steps: [
            '<strong>Oto. Inject</strong>\u2019i etkinle\u015ftirin \u2014 her sayfa y\u00fcklemesinde \u00e7al\u0131\u015f\u0131r',
            'Belirli sayfalarda \u00e7al\u0131\u015fmas\u0131 i\u00e7in <strong>URL Deseni</strong> belirleyin',
          ],
          table: [
            ['Desen', 'E\u015fle\u015fir'],
            ['<code>*example.com/admin*</code>', 'O yolu i\u00e7eren herhangi bir URL'],
            ['<code>*checkout*</code>', '\u201ccheckout\u201d i\u00e7eren herhangi bir URL'],
            ['<em>(bo\u015f)</em>', 'Bu domaindeki t\u00fcm URL\u2019ler'],
          ],
        },
        {
          title: '4. Element Se\u00e7ici \uD83C\uDFAF',
          steps: [
            '<strong>\uD83C\uDFAF</strong> ikonuna t\u0131klay\u0131n \u2014 popup kapan\u0131r, sayfa se\u00e7im moduna ge\u00e7er',
            '\u0130stedi\u011finiz elemente hover yap\u0131p t\u0131klay\u0131n',
            'Popup yeniden a\u00e7\u0131l\u0131r \u2014 ekleme modunu se\u00e7in: CSS / JS / jQuery',
            '\u0130ptal etmek i\u00e7in <strong>Esc</strong>\u2019e bas\u0131n',
          ],
        },
        {
          title: '5. jQuery',
          steps: [
            'jQuery toggle yaln\u0131zca sayfada <code>window.jQuery</code> tespit edildi\u011finde kullan\u0131labilir',
            'Etkin oldu\u011funda JS kodunuz <code>(function($, jQuery){\u2026})</code> i\u00e7inde \u00e7al\u0131\u015f\u0131r \u2014 noConflict modunda da ge\u00e7erlidir',
          ],
        },
        {
          title: '6. Canl\u0131 Yenileme',
          note: 'Ayarlar \u2192 <strong>Canl\u0131 Yenileme</strong>: profil kaydedildi\u011finde t\u00fcm e\u015fle\u015fen a\u00e7\u0131k sekmelere an\u0131nda re-inject yap\u0131l\u0131r.',
        },
        {
          title: '7. Senkronizasyon & D\u0131\u015fa Aktarma',
          steps: [
            'Ayarlar \u2192 <strong>Cihazlar Aras\u0131 Senkronizasyon</strong> \u2014 profiller Chrome hesab\u0131n\u0131z \u00fczerinden yans\u0131t\u0131l\u0131r (profil ba\u015f\u0131 7\u00a0KB s\u0131n\u0131r\u0131)',
            'Ayarlar \u2192 <strong>T\u00fcm\u00fcn\u00fc D\u0131\u015fa Aktar</strong> / <strong>Profilleri \u0130\u00e7e Aktar</strong> \u2014 JSON yedekleme & geri y\u00fckleme',
          ],
        },
        {
          title: '8. Dosya Y\u00fckleme & D\u0131\u015fa Aktarma',
          steps: [
            '<strong>📁 Y\u00fckleme</strong> \u2014 edit\u00f6r ba\u015fl\u0131\u011f\u0131ndaki y\u00fckleme butonuna t\u0131klayarak masa\u00fcst\u00fcnden CSS/JS dosyalar\u0131 y\u00fckleyin',
            '<strong>📦 Dosya D\u0131\u015fa Aktar</strong> \u2014 t\u00fcm aktif snippet\u2019lar\u0131 ZIP paketi olarak d\u0131\u015fa aktar\u0131n',
            '<strong>⚡ K\u00fc\u00e7\u00fclt\u00fclm\u00fc\u015f D\u0131\u015fa Aktar</strong> \u2014 kod k\u00fc\u00e7\u00fcltme ile d\u0131\u015fa aktar (daha k\u00fc\u00e7\u00fck dosya boyutu)',
          ],
          note: 'Y\u00fcklenen dosyalar edit\u00f6re y\u00fcklenir ancak <strong>Kaydet</strong> butonuna basmadan kaydedilmez.',
        },
        {
          title: '9. Edit\u00f6r Ara\u00e7lar\u0131',
          steps: [
            '<strong>🗑️ Edit\u00f6r\u00fc Temizle</strong> \u2014 CSS veya JS edit\u00f6r\u00fc onay ile temizleyin',
            'Temizleme yaln\u0131zca edit\u00f6r\u00fc etkiler \u2014 <strong>Kaydet</strong> yapana kadar profil de\u011fi\u015fmez',
          ],
        },
        {
          title: '10. Layout De\u011fi\u015ftirme',
          note: 'Ayarlar \u2192 <strong>Panel Layout</strong>: Layout A (kenar \u00e7ubu\u011fu), B (yan yana), veya C (\u00fc\u00e7 s\u00fctun) aras\u0131nda se\u00e7im yap\u0131n. De\u011fi\u015fiklikler anl\u0131k uygulan\u0131r.',
        },
        {
          title: 'Klavye K\u0131sayollar\u0131',
          shortcuts: [
            ['Ctrl', 'S',     'Kaydet'],
            ['Ctrl', 'Enter', 'Inject Et'],
            ['Ctrl', 'Space', 'Otomatik Tamamla'],
            ['Ctrl', '/',     'Yoruma Çevir'],
            ['Esc',  null,    'Element se\u00e7imini iptal et'],
          ],
        },
        {
          title: 'Sorun Giderme',
          list: [
            '<strong>Inject \u00e7al\u0131\u015fm\u0131yor</strong> \u2014 profilin <em>A\u00e7\u0131k</em> oldu\u011funu ve URL Deseninin e\u015fle\u015fti\u011fini kontrol edin',
            '<strong>JS hatas\u0131</strong> \u2014 F12 Konsol\u2019u a\u00e7\u0131n, <code>[Dev Override]</code> \u00f6nekli mesaja bak\u0131n',
            '<strong>jQuery mevcut de\u011fil</strong> \u2014 sayfada jQuery yoksa toggle devre d\u0131\u015f\u0131d\u0131r',
            '<strong>Senkronizasyon atland\u0131</strong> \u2014 profil 7\u00a0KB\u2019\u0131 a\u015f\u0131yor; CSS/JS\u2019i k\u0131salt\u0131n veya snippet\u2019lere b\u00f6l\u00fcn',
            '<code>chrome://</code> sayfalar\u0131na inject yap\u0131lamaz',
          ],
        },
      ],
    },
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = I18N;
