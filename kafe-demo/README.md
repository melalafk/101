# Masa101

Okey masası için QR menü, ortak skor ve "kaybeden öder" hesap. Demo sürümü.

## Kendi bilgisayarında çalıştırma

Gerekli olan tek şey **Node.js** (18 veya üstü): https://nodejs.org adresinden "LTS" sürümünü kur. Başka paket kurmaya gerek yok.

**Windows:** `baslat.bat` dosyasına çift tıkla.
**Mac:** `baslat.command` dosyasına çift tıkla. İlk seferde Mac "açılamıyor" derse dosyaya sağ tıklayıp **Aç**'ı seç.
**Terminalden:** bu klasörde `node server.mjs` (veya `npm start`).

Açılan pencerede iki adres yazar:

```
  Bu bilgisayarda:   http://localhost:8080
  Telefon / tablet:  http://192.168.1.25:8080
```

- Telefon ve tablet **aynı Wi-Fi'a** bağlı olmalı. İnternet olmasa da çalışır.
- Tableti (ve bilgisayarı) **"Telefon / tablet"** adresinden aç. Masa QR kodları bu adresi içerir. `localhost` ile açarsan QR kodları telefonda açılmaz, sayfa bunu uyarır.
- Durdurmak için pencerede **Ctrl + C**.
- Siparişler, oyunlar ve menü değişiklikleri `veri.json` dosyasına kaydedilir. Kapatıp açınca kaybolmaz. Sıfırdan başlamak için bu dosyayı sil veya sayfadaki "Demoyu sıfırla"yı kullan.
- Port 8080 doluysa: `PORT=3000 node server.mjs` (Windows'ta: `set PORT=3000 && node server.mjs`).
- Bilgisayarın güvenlik duvarı "Node.js ağ erişimi" sorarsa **izin ver** (özel ağ). Yoksa telefonlar bağlanamaz.

## Ekranlar

| Adres | Ne için |
| --- | --- |
| `/` | Demo menüsü ve Masa 4'ün QR'ı |
| `/#musteri` | Müşteri: menü, sipariş, ortak skor, hesap (masa: `?masa=3`) |
| `/#panel` | Kafe paneli: siparişler, masalar, menü yönetimi, QR kodları, liderlik |
| `/#tv` | Duvardaki TV: canlı masalar ve haftanın liderleri |

Her kafeye ayrı demo için adrese `?k=kafeadi` ekle, örneğin `http://192.168.1.25:8080/?k=yildiz`.

## Dosyalar

- `app.html` arayüzün tamamı
- `core.mjs` menü, örnek veriler ve tüm kurallar (sipariş, oyun, hesap). Yerel sunucu ve Cloudflare aynı dosyayı kullanır.
- `server.mjs` yerel sunucu
- `worker.js` + `wrangler.jsonc` Cloudflare Workers sürümü (`npm run cf:deploy`)
- `qrcode.txt` QR kod üretici (qrcode-generator 1.4.4, MIT, Kazuhiko Arase)
