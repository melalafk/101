# Masa101

Okey (101) oynanan kafeler ve kıraathaneler için tek üründe üç şey: **QR menüden sipariş**, **masadaki herkesin telefonunda ortak skor** ve oyun bitince **hesabın kaybedene yazılması**. Şu an satış görüşmelerinde gösterilecek bir **demo**. Gerçek kafe hesabı, giriş veya ödeme yok.

Kullanıcıyla Türkçe konuş, arayüz metinleri de Türkçe. Kullanıcı yazılımcı değil: kısa, sade anlat, teknik terimleri açıkla.

## Ürün fikri ve neden

- Fikir bir arkadaştan geldi: "101 kafelerine tabletten sipariş + skor tutma satarız." Kafeci arkadaşa sorulacak, demo onun için.
- **Asıl fark "kaybeden öder"**: Okeyde masanın hesabını kaybeden taraf öder. Skor kimin kaybettiğini bildiği için adisyon otomatik ona yazılıyor. Araştırmada bunu yapan ürün bulunmadı (ama Okey 101 Çetele'nin sitesi açılamadı, kesin değil).
- Rakipler (Kasım 2026 araştırması):
  - **Okey 101 Çetele** (okey101cetele.com): Doğrudan rakip. QR ile masa, müşteri kendi telefonuyla katılıyor, otomatik 101 puanı, liderlik, rezervasyon, turnuva + TV yayını. 2 masa süresiz ücretsiz, 8 masa ve sınırsız planlar var. Ücretli fiyatlar ve sipariş özelliği doğrulanamadı.
  - **Kafe360**: Kıraathane adisyonu (masa açıkken siparişler tek adisyonda, QR ile garson çağırma, veresiye). QR menü ücretsiz, tam paket yıllık 8.999 TL. Okey skoru yok.
  - QR menü/sipariş piyasası kalabalık: Restomenum 219 ₺/ay, QRall 546 ₺/ay, QR Servisim 699 ₺/ay, OxyMenu 1.499 ₺/ay, 360Sipariş 2.499 ₺/ay, Siparet ciro bazlı.
  - Telefon skor uygulamaları çok (Yazboz 101, Okey Defteri, YazBoz Pro, okey101.app) ama kafeye yönelik değil.
- Fiyat önerimiz: peşin ücret değil, ücretsiz deneme + aylık (≈500 TL piyasanın ortası). "Mevcut adisyon sisteminin yanında okey masaları için" diye konumlamak daha kolay.

## Ekranlar (hepsi `app.html` içinde, hash ile)

| Adres | Ne |
| --- | --- |
| `/` | Demo menüsü, Masa 4'ün QR'ı, demo sıfırlama |
| `/?masa=3#musteri` | Müşteri telefonu: Menü (arama, kategori, sepet, not) · Oyun (ortak skor, el girişi) · Hesap (adisyon, kaybeden öder / eşit böl, garson çağır, hesap iste) |
| `/#panel-siparis` | Tezgâh: garson çağrıları, Yeni / Hazırlanıyor / Teslim sütunları, sesli uyarı |
| `/#panel-masalar` | Salon: masa kartları, açık hesaplar, "Ödendi, masayı kapat" |
| `/#panel-menu` | Menü yönetimi: fiyat/ad düzenleme, ürün ekle/sil, "satışta" anahtarı, kafe adı |
| `/#panel-qr` | Masa QR kodları, yazdırma |
| `/#panel-liderlik` | Haftanın kazananları, son oyunlar |
| `/#tv` | Duvardaki TV: canlı masalar + haftanın liderleri |

`?k=kafeadi` her kafeye ayrı demo odası açar (varsayılan `demo`).

## Dosyalar ve mimari

- `app.html` — arayüzün tamamı, tek dosya, kütüphanesiz (sadece `/qrcode.js`). Sunucudan durumu 2,5 sn'de bir çeker (`GET /api/state?k=oda`), her değişikliği `POST /api/state?k=oda` ile `{type, ...}` olarak gönderir; sunucu yeni durumu döner.
- `core.mjs` — **tek doğruluk kaynağı**: menü, kategoriler, örnek veri (`seed`), tüm eylemler (`apply`). Hem yerel sunucu hem Cloudflare bunu kullanır. Kural değişikliği buraya yapılır.
  - Eylemler: `order`, `status`, `call`, `callDone`, `gameStart`, `hand`, `handDel`, `gameEnd`, `close`, `menuSave`, `menuToggle`, `menuDel`, `cafe`, `reset`.
  - Sunucu her girdiyi doğrular (masa 1–8, menüde olmayan ürün reddedilir, fiyat sunucudan, metinler kırpılır, listeler sınırlı). Bunu koru.
  - Oyun: `games[masa] = {mode: "team"|"single", players, teamNames, hands: [[puan,...]]}`. Eşlide takımlar oyuncu 0+2 ve 1+3. En düşük toplam önde, en yüksek toplam **hesabı öder**. Puanlar defterdeki gibi elle girilen sayılar (biten −101 vb.), kural hesabı yok.
  - `close` masanın siparişlerini ödendi yapar, oyun varsa bitirip kazananı `results`'a yazar.
- `server.mjs` — yerel sunucu, paketsiz Node 18+. Odaları bellekte tutar, `veri.json`'a yazar, ağ IP'sini konsola basar, `GET /api/lan` ile verir (sayfa localhost'tan açılırsa uyarı gösterir, çünkü QR'lar sayfanın adresini içerir).
- `worker.js` + `wrangler.jsonc` — Cloudflare Workers sürümü: her oda bir Durable Object (`Hub`, SQLite), `app.html` ve `qrcode.txt` metin olarak gömülü.
- `qrcode.txt` — qrcode-generator 1.4.4 (MIT, Kazuhiko Arase). `.txt` uzantısı Wrangler'ın metin olarak gömmesi için.
- `baslat.bat` / `baslat.command` — çift tıklayınca başlatma.

## Çalıştırma

- Yerel: `node server.mjs` (veya `npm start`) → `http://localhost:8080`; telefon/tablet aynı Wi-Fi'da, konsoldaki ağ adresinden. Port: `PORT=3000 node server.mjs`. Sıfırlamak için `veri.json`'u sil.
- Cloudflare: canlı adres **https://masa101.azalt.workers.dev** (hesabın workers.dev alt alanı `azalt`, worker adı `masa101`). Yüklemek için bir kez `npx wrangler login`, sonra `npx wrangler deploy` (veya `npm run cf:deploy`).
- Ayrı bir ürün olarak basit skor uygulaması da var: **https://okey101.azalt.workers.dev** (repo kökündeki `index.html`, kendi `wrangler.jsonc`'si ile). Ona dokunmadan çalış.

## Tasarım kuralları

- Görünüm **iOS / Apple** gibi: sistem yazı tipi (yedek Inter), büyük başlıklar, gruplu beyaz listeler, `--tint` mavi, iOS anahtarı ve bölmeli seçici, alt sekme çubuğu, iPad'de yan menü, karanlık mod (renkler `:root` değişkenlerinde, `prefers-color-scheme: dark` ile).
- Hareket **apple-design** becerisine göre (`.claude/skills/apple-design/SKILL.md`): alttan açılan sayfalar yay fiziğiyle (`spring()`, `mountSheet()`), parmakla sürüklenir, bırakınca hız ölçülüp nereye gideceği hesaplanır (`project()`), yarıda yakalanabilir; butonlar dokunuşta küçülür; üst çubuk kaydırınca buzlu cama döner; `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` desteklenir. Yeni bir sayfa (sheet) eklerken `mountSheet()` çağır, kapatırken `closeLayer()`.
- El girişi: her oyuncuya tek sayı kutusu, `−` tuşu ile eksi, Enter sıradaki oyuncuya geçer, sonda kaydeder. Kullanıcı bunu özellikle istedi ("defterdeki gibi"), açamadı/çift gibi kural düğmeleri geri getirme.
- Ekran yenilenirken yazılan metin kaybolmamalı: odakta bir input varken `render()` erteleniyor; açık el girişi sayfası başka cihazdan gelen güncellemede yeniden çizilmiyor.

## Test

Değişiklikten sonra Playwright ile birden fazla "cihaz" açıp uçtan uca dene: müşteri sipariş verir → panelde görünür → durum değişince müşteride görünür; iki telefon aynı masada oyun, biri el yazar diğerinde görünür; hesapta kaybeden; panelden masa kapatılınca liderliğe yazılır; telefon genişliğinde yatay taşma yok. Yerelde `node server.mjs` ile test etmek en kolayı.

## Sıradaki işler (kafeci "alırım" derse)

- Kafe girişi / şifre, kafe başına hesap (şu an oda adı bilen herkes değiştirebilir)
- Gerçek menü ve fotoğraflar, kategori yönetimi
- Gün sonu raporu, ödeme yöntemi kaydı, yazıcıya adisyon
- Masa sayısını ayarlanabilir yapmak (şu an 8, `core.mjs` → `TABLES`)
- Süre bazlı masa ücreti (kıraathanelerde yaygın)
