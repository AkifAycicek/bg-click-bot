# Background Clicker Bot

Herhangi bir pencereye arka planda otomatik tiklama gonderen Windows masaustu uygulamasi — pencere odakta olmasa bile calisir. Electron, Vue 3, PrimeVue ve Tailwind CSS ile gelistirilmistir.

[English](README.md) | Turkce

## Ozellikler

- **Arka plan tiklamasi** — Windows PostMessage API ile tiklama gonderir, alt-tab'dayken de calisir
- **Coklu sekme presetleri** — birden fazla tiklama yapilandirmasini ayri sekmelerde es zamanli calistirin
- **Pencere onizlemeleri** — PrintWindow API ile canli onizlemeli gorsel pencere secici
- **Nokta bazli duraklat/devam** — diger noktalar devam ederken herhangi birini bagimsiz duraklatabilirsiniz
- **Koordinat yakalama** — hedef pencereye tiklayarak koordinat yakalama veya manuel giris
- **Isimli tiklama noktalari** — her noktaya aciklayici isim verin
- **Satir ici duzenleme** — X, Y, aralik degerlerini dogrudan tabloda duzenleyin
- **Global kisayollar** — her sekmeye sistem genelinde klavye kisayolu atayin
- **Preset sistemi** — kaydetme, yukleme, iceri/disari aktarma, yeniden adlandirma, kopyalama
- **Otomatik kaydetme** — degisiklikleri istege bagli olarak otomatik kaydedin
- **Karanlik mod** — sistem tercihine gore otomatik algilama ve manuel gecis
- **Pencere odaklama** — AutoHotkey tarzinda hedef pencereyi guvenilir sekilde on plana getirme

## Indirme ve Kurulum

1. [Releases](https://github.com/AkifAycicek/bg-click-bot/releases) sayfasina gidin
2. En son `.exe` dosyasini indirin
3. Exe'yi calistirin

> **Windows SmartScreen Uyarisi:** Uygulama kod imzali olmadigindan Windows bir uyari gosterebilir. **"Daha fazla bilgi"** → **"Yine de calistir"** seceneklerine tiklayarak devam edin. Bu, imzasiz acik kaynakli uygulamalar icin normaldir.

## Sistem Gereksinimleri

- Windows 10/11 (x64)
- Ek yazilim gerekmez — Node.js ve Electron dahildir

## Gelistirme

### Kurulum

```bash
npm install
```

### Gelistirme modunda calistirma

```bash
npm run dev
```

### Testleri calistirma

```bash
npm test          # Bot birim testleri (47 test)
npm run test:ui   # Vue bilesen testleri (39 test)
npm run test:e2e  # Electron E2E testleri (21 test)
npm run test:all  # Tum testler
```

### Dagitim icin build alma

```bash
npm run build
```

Bu komut `dist/` klasoru ve `dist-electron/` icinde portable `.exe` olusturur.

## Teknoloji Yigini

- **Electron 28** — masaustu framework
- **Vue 3** — UI framework (Composition API)
- **PrimeVue 4** — UI bilesenleri (Aura tema)
- **Tailwind CSS 4** — utility-first stillendirme
- **Vite** — build araci
- **koffi** — Windows API FFI (user32.dll, gdi32.dll, dwmapi.dll)
- **Playwright** — E2E test
- **Vitest** — birim test
- **Husky** — pre-commit hook ile otomatik test

## Proje Yapisi

```
bot.js                  # Cekirdek bot mantigi (Windows API fonksiyonlari)
app/main.js             # Electron ana surec (IPC handler'lar)
app/preload.js          # Context bridge (guvenli API)
app/presets.js           # Preset dosya yoneticisi
src/App.vue             # Ana Vue bileseni
src/composables/        # State yonetimi (useBotInstance, useTabManager, usePresets)
src/components/         # UI bilesenleri
tests/                  # Birim, UI ve E2E testleri
build.js                # Dagitim build scripti
```

## Lisans

MIT
