# 101 Okey Skor

Telefonda 101 Okey skor tablosu: tekli veya eşli oyun, her elde puanlar deftere yazar gibi girilir, toplam ve sıralama otomatik hesaplanır.

Canlı: https://okey101.azalt.workers.dev

## Yayınlama (Cloudflare Workers)

```
npx wrangler deploy
```

`wrangler.jsonc` önce `node build.mjs` çalıştırır: `index.html` tam bir HTML belgesine sarılır ve sayfayı döndüren `public/worker.js` üretilir.
