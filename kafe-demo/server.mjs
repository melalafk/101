// Masa101 local server: runs the demo on your own computer with plain Node.js (no packages needed).
// Phones and tablets on the same Wi-Fi open it through this computer's local address.
//   node server.mjs            -> port 8080
//   PORT=3000 node server.mjs  -> another port
import http from "node:http";
import os from "node:os";
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { seed, apply, clip } from "./core.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const DATA = join(DIR, "veri.json");
const HTML = readFileSync(join(DIR, "app.html"), "utf8");
const QRJS = readFileSync(join(DIR, "qrcode.txt"), "utf8");

// rooms are kept in memory and saved to veri.json so a restart keeps orders and games
let rooms = {};
try { if (existsSync(DATA)) rooms = JSON.parse(readFileSync(DATA, "utf8")) || {}; } catch { console.warn("veri.json okunamadı, demo baştan kuruluyor."); }
let saveTimer = null;
const saveSoon = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { writeFileSync(DATA + ".tmp", JSON.stringify(rooms)); renameSync(DATA + ".tmp", DATA); }
    catch (e) { console.warn("Kaydedilemedi:", e.message); }
  }, 300);
};

function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === "IPv4" && !a.internal) out.push(a.address);
  }
  return out;
}

const send = (res, status, body, type, extra = {}) => {
  res.writeHead(status, { "content-type": type, "x-content-type-options": "nosniff", ...extra });
  res.end(body);
};
const json = (res, d, status = 200) => send(res, status, JSON.stringify(d), "application/json; charset=utf-8", { "cache-control": "no-store" });

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/state") {
    const room = clip((url.searchParams.get("k") || "demo").toLowerCase().replace(/[^a-z0-9-]/g, ""), 24) || "demo";
    if (!rooms[room]) { rooms[room] = seed(); saveSoon(); }
    if (req.method === "GET") return json(res, { ...rooms[room], now: Date.now() });
    if (req.method !== "POST") return json(res, { error: "Desteklenmiyor" }, 405);
    let body = "";
    req.on("data", c => { body += c; if (body.length > 64 * 1024) req.destroy(); });
    req.on("end", () => {
      let a;
      try { a = JSON.parse(body || "{}"); } catch { return json(res, { error: "Geçersiz istek" }, 400); }
      const s = apply(rooms[room], a || {}) || rooms[room];
      s.v = (s.v || 0) + 1;
      rooms[room] = s; saveSoon();
      json(res, { ...s, now: Date.now() });
    });
    return;
  }
  if (url.pathname === "/api/lan") {
    const ip = lanAddresses()[0];
    return json(res, { url: ip ? `http://${ip}:${PORT}` : null });
  }
  if (url.pathname === "/qrcode.js") return send(res, 200, QRJS, "text/javascript; charset=utf-8", { "cache-control": "public, max-age=86400" });
  if (url.pathname === "/" || url.pathname === "/index.html") return send(res, 200, HTML, "text/html; charset=utf-8", { "cache-control": "no-cache" });
  res.writeHead(302, { location: "/" + url.search }); res.end();
});

server.on("error", e => {
  if (e.code === "EADDRINUSE") console.error(`\n${PORT} numaralı port kullanımda. Başka bir port deneyin:  PORT=3000 node server.mjs\n`);
  else console.error(e);
  process.exit(1);
});

server.listen(PORT, "0.0.0.0", () => {
  const ips = lanAddresses();
  console.log("\n  Masa101 çalışıyor\n");
  console.log(`  Bu bilgisayarda:   http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`  Telefon / tablet:  http://${ip}:${PORT}`));
  if (!ips.length) console.log("  Ağ bağlantısı bulunamadı. Telefonlar bu bilgisayara bağlanamaz.");
  console.log("\n  Telefon ve tablet aynı Wi-Fi'da olmalı. QR kodlarının telefonda açılması için");
  console.log("  tableti/bilgisayarı da yukarıdaki \"Telefon / tablet\" adresinden açın.");
  console.log("  Durdurmak için: Ctrl + C\n");
});
