# Dev CSS & JS Override Injector Pro

Herhangi bir web sayfasına CSS ve JavaScript inject eden, domain bazlı profil yöneten bir Chrome eklentisi.

---

## Kurulum

1. Chrome'da `chrome://extensions` sayfasını aç
2. Sağ üstten **Developer mode**'u aktif et
3. **Load unpacked** butonuna tıkla
4. `chrome-dev-override` klasörünü seç
5. Eklenti yüklendi — adres çubuğunun yanında ikonuna tıkla veya `Ctrl+Shift+Y`

---

## Temel Kavramlar

| Kavram | Açıklama |
|--------|----------|
| **Profil** | Her domain için ayrı tutulan CSS/JS/ayarlar seti |
| **Snippet** | Bir profil içindeki bağımsız kod bloğu (birden fazla olabilir) |
| **Auto-inject** | Sayfa yüklendiğinde otomatik inject |
| **Live Reload** | Kod kaydedildiğinde açık sekmelere anında re-inject |

---

## Özellikler

### 1. CSS & JS Inject

**Nasıl yapılır:**
1. Popup'ı aç
2. CSS editörüne CSS, JS editörüne JavaScript yaz
3. **Save** → profili kaydet
4. **Inject Now** → aktif sekmeye anında uygula

**Notlar:**
- Inject `chrome.scripting` API ile yapılır — sayfanın CSP kurallarını bypass eder
- `require-trusted-types-for 'script'` olan sayfalar da desteklenir (TrustedScript policy kullanılır)

---

### 2. Snippet Sistemi

Bir profilde birden fazla bağımsız kod bloğu (snippet) tanımlanabilir.

**Snippet oluşturma:**
1. **+ Add** butonuna tıkla → yeni snippet oluşur
2. İsim gir (Snippet name alanı)
3. CSS ve/veya JS yaz
4. Delay ayarla (opsiyonel, saniye cinsinden)
5. Save

**Snippet sıralama:**
- **▲ ▼** butonlarıyla inject sırasını değiştir
- Snippetlar listede göründüğü sırayla inject edilir

**Snippet enable/disable:**
- Toolbar'daki **On** checkbox'ı ile her snippet ayrı ayrı kapatılabilir
- Pasif snippetlar select listesinde `✗` prefix'iyle gri gösterilir, inject'e dahil edilmez

**Delay (gecikme):**
- Her snippet'a bağımsız gecikme tanımlanabilir (saniye)
- Örnek: `Snippet 1: 0s` → `Snippet 2: 2s` → `Snippet 3: 5s` şeklinde kademeli çalışma

---

### 3. URL Pattern

Domain'in tüm URL'leri yerine belirli sayfalarda inject etmek için.

**Örnekler:**

| Pattern | Eşleşir | Eşleşmez |
|---------|---------|-----------|
| `*example.com/admin*` | `example.com/admin/users` | `example.com/home` |
| `*checkout*` | `.../checkout/confirm` | `.../cart` |
| *(boş)* | Tüm URL'ler | — |

**Sözdizimi:** `*` herhangi bir karakter dizisi, `?` tek karakter, boş = hepsi

---

### 4. Auto-inject

- Profildeki **Auto-inject** toggle aktifken sayfa her yüklenişinde otomatik inject yapılır
- SPA (React, Vue, Angular) uygulamalarında route değişimlerinde de tetiklenir (history state)
- URL Pattern tanımlanmışsa sadece eşleşen URL'lerde çalışır

---

### 5. Element Picker (🎯)

Sayfadan element seçip CSS seçicisini editöre ekle.

**Kullanım:**
1. Header'daki **🎯** ikonuna tıkla — popup kapanır
2. Sayfada mavi highlight aktif olur
3. İstediğin elemente hover yap ve tıkla
4. Popup otomatik açılır, seçici modal'da gösterilir
5. Butondan insert tipini seç:
   - **CSS** → `selector { }` bloğu CSS editörünün sonuna eklenir
   - **JS** → `document.querySelector('...')` JS editörünün sonuna eklenir
   - **jQuery** → `$('...')` ile JS editörüne eklenir (jQuery aktifse)
6. **Esc** → picker'ı iptal et

**CSS seçici önceliği:**
- Element `id` varsa → `#id`
- Yoksa → `tag.class1.class2:nth-of-type(n)` (max 3 seviye derinlik)

---

### 6. jQuery Desteği

- **jQuery toggle** sadece sayfada `window.jQuery` tanımlıysa aktif edilebilir
- Aktifken JS kodun `(function($, jQuery){ ... })(window.jQuery, window.jQuery)` sarması içinde çalışır
- `$` noConflict durumundan bağımsız olarak her zaman erişilebilir

---

### 7. Live Reload

**Settings → Live Reload** toggle aktifken: profil kaydedildiğinde o domain'in açık tüm sekmeleri otomatik re-inject edilir.

---

### 8. Inject Geçmişi

Son 50 inject olayı kaydedilir (domain, URL, tarih, başarı/hata).

**Erişim:** Ana ekran → **History** butonu → **Clear** ile temizle

---

### 9. Sync (Cihazlar Arası)

**Settings → Sync Across Devices** toggle ile profilleri Chrome hesabı üzerinden diğer cihazlara sync et.

**Akış:**
- Toggle açılınca tüm profiller `chrome.storage.sync`'e yüklenir
- Sonraki her kayıtta otomatik olarak sync'e mirror'lanır
- Popup açıldığında sync'ten daha yeni veri varsa otomatik merge edilir
- Merge: `updatedAt` timestamp büyük olan kazanır

**Sınırlamalar:**
- Per-item limit: **7KB** — büyük CSS/JS içeren profiller skip edilir, status bar'da bildirilir
- Toplam: **100KB**

---

### 10. Export / Import

**Settings → Export All** → JSON dosyası indir
**Settings → Import Profiles** → JSON dosyası seç → profiller merge edilir

---

### 11. Tema

Header'daki **☀️/🌙** veya Settings → **Light Theme** toggle ile dark/light tema geçişi.

---

## Dosya Yapısı

```
chrome-dev-override/
├── manifest.json           # MV3 manifest
├── background/
│   └── background.js       # Service worker: inject, sync listener, live reload
├── content/
│   └── content.js          # Element picker, toast göstergesi
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js            # Ana UI mantığı
└── lib/
    ├── storage.js           # Chrome storage abstraction + sync metodları
    ├── jquery.min.js
    └── codemirror/          # Kod editörü kütüphanesi
```

---

## Storage Yapısı

| Key | Depolama | İçerik |
|-----|----------|--------|
| `profiles` | `local` | Tüm domain profilleri |
| `settings` | `local` | Global ayarlar (tema, liveReload, syncEnabled…) |
| `injectHistory` | `local` | Son 50 inject olayı |
| `pendingPickedElement` | `local` | Picker'dan gelen geçici seçici |
| `sp_{domain}` | `sync` | Sync edilen profiller (`sp_` prefix'i) |

---

## Profil Veri Yapısı

```json
{
  "enabled": true,
  "css": "",
  "js": "",
  "autoInject": false,
  "useJQuery": false,
  "urlPattern": "",
  "delay": 0,
  "snippets": [
    {
      "id": 1700000000000,
      "name": "Snippet 1",
      "css": ".example { color: red; }",
      "js": "console.log('hello')",
      "delay": 0,
      "enabled": true
    }
  ],
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

---

## İzinler

| İzin | Neden |
|------|-------|
| `scripting` | CSS/JS inject (`executeScript`) |
| `activeTab` | Aktif sekme bilgisi |
| `tabs` | Tab sorgulama ve yenileme |
| `storage` | Profil ve ayar saklama + sync |
| `webNavigation` | SPA route değişimlerini yakalama |
| `<all_urls>` | Tüm sayfalara inject yetkisi |

---

## Kısayollar

| Kısayol | Eylem |
|---------|-------|
| `Ctrl+Shift+Y` | Popup'ı aç |
| `Esc` | Element picker'ı iptal et |

---

## Sık Karşılaşılan Durumlar

**Inject çalışmıyor:**
- Profil **On** durumda mı?
- `chrome://` sayfalarına inject yapılamaz
- URL Pattern ayarlıysa mevcut URL eşleşiyor mu?

**JS hatası:**
- F12 → Console → `[Dev Override]` prefix'li mesaja bak

**jQuery çalışmıyor:**
- Toggle sadece `window.jQuery` olan sayfalarda aktif olur — yoksa plain JS yaz

**Sync çalışmıyor:**
- Chrome hesabına giriş yapıldığından emin ol
- Profil 7KB'dan büyükse sync atlanır, status bar'da uyarı çıkar
