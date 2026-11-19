// Masa101 demo: serves the app and keeps one shared state per demo room in a Durable Object.
import HTML from "./app.html";

const MENU = [
  { id: "cay", n: "Çay", p: 20, c: "Sıcak" },
  { id: "fcay", n: "Fincan çay", p: 35, c: "Sıcak" },
  { id: "turk", n: "Türk kahvesi", p: 80, c: "Sıcak" },
  { id: "nes", n: "Nescafé", p: 60, c: "Sıcak" },
  { id: "oralet", n: "Oralet", p: 25, c: "Sıcak" },
  { id: "salep", n: "Salep", p: 70, c: "Sıcak" },
  { id: "su", n: "Su", p: 15, c: "Soğuk" },
  { id: "soda", n: "Soda", p: 30, c: "Soğuk" },
  { id: "kola", n: "Kola", p: 60, c: "Soğuk" },
  { id: "ayran", n: "Ayran", p: 35, c: "Soğuk" },
  { id: "meyve", n: "Meyve suyu", p: 45, c: "Soğuk" },
  { id: "tost", n: "Kaşarlı tost", p: 120, c: "Yiyecek" },
  { id: "ktost", n: "Karışık tost", p: 150, c: "Yiyecek" },
  { id: "simit", n: "Simit", p: 25, c: "Yiyecek" },
  { id: "cekirdek", n: "Çekirdek", p: 60, c: "Atıştırmalık" },
  { id: "kuruyemis", n: "Karışık kuruyemiş", p: 120, c: "Atıştırmalık" },
  { id: "biskuvi", n: "Bisküvi", p: 30, c: "Atıştırmalık" },
];
const TABLES = 8;

function seed() {
  const now = Date.now(), m = 60000;
  const o = (id, table, items, ago, status) => ({ id, table, items: items.map(([i, q]) => ({ id: i, q })), t: now - ago * m, status, paid: false });
  return {
    v: 1, menu: MENU, tables: TABLES,
    orders: [
      o("s1", 2, [["cay", 4], ["cekirdek", 1]], 42, "done"),
      o("s2", 2, [["cay", 4], ["tost", 2]], 18, "done"),
      o("s3", 5, [["turk", 2], ["su", 2]], 3, "new"),
      o("s4", 7, [["cay", 3], ["oralet", 1]], 26, "done"),
      o("s5", 7, [["ktost", 1]], 6, "prep"),
    ],
    calls: [{ id: "c1", table: 7, kind: "hesap", t: now - 1 * m }],
    games: {
      2: { mode: "team", hands: 6, sides: [{ name: "Kırmızılar", total: 212 }, { name: "Maviler", total: 488 }] },
      7: { mode: "single", hands: 9, sides: [{ name: "Hakan", total: -150 }, { name: "Selim", total: 311 }, { name: "Murat", total: 402 }, { name: "Cem", total: 97 }] },
    },
  };
}

const clip = (s, n) => String(s ?? "").slice(0, n);
const id = () => Math.random().toString(36).slice(2, 10);

function apply(s, a) {
  const table = Math.trunc(Number(a.table));
  const okTable = table >= 1 && table <= TABLES;
  switch (a.type) {
    case "order": {
      if (!okTable || !Array.isArray(a.items)) return;
      const items = a.items
        .filter(x => MENU.some(m => m.id === x.id))
        .map(x => ({ id: x.id, q: Math.min(20, Math.max(1, Math.trunc(Number(x.q)) || 1)) }))
        .slice(0, 30);
      if (!items.length) return;
      s.orders.push({ id: id(), table, items, t: Date.now(), status: "new", paid: false, note: clip(a.note, 80) });
      break;
    }
    case "status": {
      const o = s.orders.find(x => x.id === a.id);
      if (o && ["new", "prep", "done"].includes(a.status)) o.status = a.status;
      break;
    }
    case "call":
      if (!okTable || !["garson", "hesap"].includes(a.kind)) return;
      if (!s.calls.some(c => c.table === table && c.kind === a.kind)) s.calls.push({ id: id(), table, kind: a.kind, t: Date.now() });
      break;
    case "callDone":
      s.calls = s.calls.filter(c => c.id !== a.id);
      break;
    case "game": {
      if (!okTable) return;
      const g = a.game;
      if (!g) { delete s.games[table]; break; }
      s.games[table] = {
        mode: g.mode === "team" ? "team" : "single",
        hands: Math.min(999, Math.max(0, Math.trunc(Number(g.hands)) || 0)),
        sides: (Array.isArray(g.sides) ? g.sides : []).slice(0, 4).map(x => ({ name: clip(x.name, 24), total: Math.trunc(Number(x.total)) || 0 })),
      };
      break;
    }
    case "close":
      if (!okTable) return;
      s.orders.forEach(o => { if (o.table === table) o.paid = true; });
      s.calls = s.calls.filter(c => c.table !== table);
      delete s.games[table];
      break;
    case "reset":
      return seed();
  }
  // keep the store small: drop paid orders older than 12 hours, cap list length
  const cutoff = Date.now() - 12 * 3600000;
  s.orders = s.orders.filter(o => !(o.paid && o.t < cutoff)).slice(-300);
  s.calls = s.calls.slice(-50);
  return s;
}

export class Hub {
  constructor(state) { this.state = state; }
  async fetch(req) {
    let s = await this.state.storage.get("s");
    if (!s) { s = seed(); await this.state.storage.put("s", s); }
    if (req.method === "POST") {
      let a;
      try { a = await req.json(); } catch { return json({ error: "Geçersiz istek" }, 400); }
      s = apply(s, a || {}) || s;
      s.v = (s.v || 0) + 1;
      s.menu = MENU;
      await this.state.storage.put("s", s);
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
    if (url.pathname !== "/") return Response.redirect(url.origin + "/" + url.search, 302);
    return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache", "x-content-type-options": "nosniff" } });
  },
};
