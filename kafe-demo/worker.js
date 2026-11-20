// Masa101 demo on Cloudflare: serves the app and keeps one shared state per demo room in a Durable Object.
import HTML from "./app.html";
import QRJS from "./qrcode.txt"; // qrcode-generator 1.4.4, MIT, Kazuhiko Arase

import { seed, apply, clip } from "./core.mjs";

export class Hub {
  constructor(state) { this.state = state; }
  async fetch(req) {
    let s = await this.state.storage.get("s2");
    if (!s) { s = seed(); await this.state.storage.put("s2", s); }
    if (req.method === "POST") {
      let a;
      try { a = await req.json(); } catch { return json({ error: "Geçersiz istek" }, 400); }
      s = apply(s, a || {}) || s;
      s.v = (s.v || 0) + 1;
      await this.state.storage.put("s2", s);
    }
    return json({ ...s, now: Date.now() });
  }
}

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/state") {
      if (!["GET", "POST"].includes(request.method)) return json({ error: "Desteklenmiyor" }, 405);
      const room = clip((url.searchParams.get("k") || "demo").toLowerCase().replace(/[^a-z0-9-]/g, ""), 24) || "demo";
      return env.HUB.get(env.HUB.idFromName(room)).fetch(request);
    }
    if (url.pathname === "/qrcode.js") return new Response(QRJS, { headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "public, max-age=86400" } });
    if (url.pathname !== "/") return Response.redirect(url.origin + "/" + url.search + url.hash, 302);
    return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache", "x-content-type-options": "nosniff" } });
  },
};
