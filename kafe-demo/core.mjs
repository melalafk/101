// Masa101 shared logic: menu, demo seed and every state change. Used by worker.js (Cloudflare) and server.mjs (local).

const TABLES = 8;
const CATS = ["Sıcak İçecekler", "Soğuk İçecekler", "Yiyecek", "Atıştırmalık"];
const MENU = [
  { id: "cay", n: "Çay", d: "İnce belli bardakta, taze demlenmiş", p: 20, c: 0, pop: true },
  { id: "fcay", n: "Fincan çay", d: "Büyük fincan", p: 35, c: 0 },
  { id: "turk", n: "Türk kahvesi", d: "Lokum ile", p: 80, c: 0, pop: true },
  { id: "nes", n: "Nescafé", d: "Sütlü veya sade", p: 60, c: 0 },
  { id: "oralet", n: "Oralet", d: "Portakal", p: 25, c: 0 },
  { id: "salep", n: "Salep", d: "Tarçınlı", p: 70, c: 0 },
  { id: "su", n: "Su", d: "0,5 L", p: 15, c: 1 },
  { id: "soda", n: "Soda", d: "Sade veya limonlu", p: 30, c: 1 },
  { id: "kola", n: "Kola", d: "330 ml kutu", p: 60, c: 1 },
  { id: "ayran", n: "Ayran", d: "Yayık ayranı", p: 35, c: 1 },
  { id: "limonata", n: "Ev yapımı limonata", d: "Naneli", p: 70, c: 1 },
  { id: "tost", n: "Kaşarlı tost", d: "Patates cipsi ile", p: 120, c: 2, pop: true },
  { id: "ktost", n: "Karışık tost", d: "Sucuk, kaşar", p: 150, c: 2 },
  { id: "simit", n: "Simit", d: "Taze fırından", p: 25, c: 2 },
  { id: "cekirdek", n: "Çekirdek", d: "Tuzlu, 150 g", p: 60, c: 3 },
  { id: "kuruyemis", n: "Karışık kuruyemiş", d: "Fındık, fıstık, leblebi", p: 120, c: 3 },
  { id: "biskuvi", n: "Bisküvi", d: "Çay yanına", p: 30, c: 3 },
].map(m => ({ ...m, on: true }));

function seed() {
  const now = Date.now(), m = 60000, h = 3600000;
  const o = (id, table, items, ago, status) => ({ id, table, items: items.map(([i, q]) => ({ id: i, q })), t: now - ago * m, status, paid: false, note: "" });
  return {
    v: 1, cafe: "Yıldız Kıraathanesi", tables: TABLES, cats: CATS, menu: MENU,
    orders: [
      o("s1", 2, [["cay", 4], ["cekirdek", 1]], 42, "done"),
      o("s2", 2, [["cay", 4], ["tost", 2]], 18, "done"),
      o("s3", 5, [["turk", 2], ["su", 2]], 3, "new"),
      o("s4", 7, [["cay", 3], ["oralet", 1]], 26, "done"),
      o("s5", 7, [["ktost", 1]], 6, "prep"),
    ],
    calls: [{ id: "c1", table: 7, kind: "hesap", t: now - 1 * m }],
    games: {
      2: { mode: "team", players: ["Kemal", "Yusuf", "Rıza", "Ercan"], teamNames: ["Kırmızılar", "Maviler"], t: now - 50 * m,
        hands: [[56, 23, 40, -101], [-101, 88, 12, 45], [30, 61, -202, 99], [77, 14, 25, 33], [12, -101, 64, 70], [41, 39, 53, 18]] },
      7: { mode: "single", players: ["Hakan", "Selim", "Murat", "Cem"], teamNames: ["", ""], t: now - 80 * m,
        hands: [[-101, 45, 66, 30], [33, -101, 80, 21], [12, 70, 202, -101], [-202, 41, 18, 52], [25, 63, 36, -101]] },
    },
    results: [
      ["Hakan", "Selim"], ["Kemal", "Rıza"], ["Murat"], ["Hakan"], ["Yusuf", "Ercan"], ["Cem"], ["Hakan", "Cem"], ["Kemal", "Rıza"], ["Selim"],
    ].map((w, k) => ({ t: now - (k + 1) * 9 * h, table: (k % TABLES) + 1, winners: w })),
  };
}

const clip = (s, n) => String(s ?? "").trim().slice(0, n);
const int = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.trunc(Number(v)) || 0));
const uid = () => Math.random().toString(36).slice(2, 10);

function sideTotals(g) {
  const t = g.players.map(() => 0);
  g.hands.forEach(h => h.forEach((v, i) => t[i] += v));
  if (g.mode === "team") return [[0, 2], [1, 3]].map((tm, k) => ({ names: tm.map(i => g.players[i]), total: t[tm[0]] + t[tm[1]] }));
  return g.players.map((n, i) => ({ names: [n], total: t[i] }));
}

function apply(s, a) {
  const table = int(a.table, 0, TABLES);
  const okTable = table >= 1;
  switch (a.type) {
    case "order": {
      if (!okTable || !Array.isArray(a.items)) return;
      const items = a.items
        .filter(x => s.menu.some(m => m.id === x.id && m.on))
        .map(x => ({ id: x.id, q: int(x.q, 1, 20) }))
        .slice(0, 30);
      if (!items.length) return;
      s.orders.push({ id: uid(), table, items, t: Date.now(), status: "new", paid: false, note: clip(a.note, 120) });
      break;
    }
    case "status": {
      const o = s.orders.find(x => x.id === a.id);
      if (o && ["new", "prep", "done"].includes(a.status)) o.status = a.status;
      break;
    }
    case "call":
      if (!okTable || !["garson", "hesap"].includes(a.kind)) return;
      if (!s.calls.some(c => c.table === table && c.kind === a.kind)) s.calls.push({ id: uid(), table, kind: a.kind, t: Date.now() });
      break;
    case "callDone":
      s.calls = s.calls.filter(c => c.id !== a.id);
      break;
    case "gameStart": {
      if (!okTable) return;
      const mode = a.mode === "team" ? "team" : "single";
      const n = mode === "team" ? 4 : int(a.count, 2, 4);
      const names = Array.isArray(a.players) ? a.players : [];
      s.games[table] = {
        mode, t: Date.now(), hands: [],
        players: Array.from({ length: n }, (_, i) => clip(names[i], 16) || "Oyuncu " + (i + 1)),
        teamNames: [clip(a.teamNames?.[0], 16) || "Kırmızılar", clip(a.teamNames?.[1], 16) || "Maviler"],
      };
      break;
    }
    case "hand": {
      const g = s.games[table];
      if (!g || !Array.isArray(a.s)) return;
      const h = g.players.map((_, i) => int(a.s[i], -9999, 9999));
      if (a.idx == null) { if (g.hands.length < 60) g.hands.push(h); }
      else if (g.hands[int(a.idx, 0, 999)]) g.hands[int(a.idx, 0, 999)] = h;
      break;
    }
    case "handDel": {
      const g = s.games[table];
      if (g) g.hands.splice(int(a.idx, 0, 999), 1);
      break;
    }
    case "gameEnd": {
      const g = s.games[table];
      if (!g) return;
      if (g.hands.length) {
        const sd = sideTotals(g).sort((x, y) => x.total - y.total);
        s.results.push({ t: Date.now(), table, winners: sd[0].names });
      }
      delete s.games[table];
      break;
    }
    case "close":
      if (!okTable) return;
      s.orders.forEach(o => { if (o.table === table) o.paid = true; });
      s.calls = s.calls.filter(c => c.table !== table);
      if (s.games[table]) return apply(s, { type: "gameEnd", table });
      break;
    case "menuSave": {
      const it = a.item || {};
      const c = int(it.c, 0, CATS.length - 1);
      const p = int(it.p, 0, 100000);
      const n = clip(it.n, 40);
      if (!n) return;
      const ex = s.menu.find(m => m.id === it.id);
      if (ex) Object.assign(ex, { n, d: clip(it.d, 80), p, c });
      else if (s.menu.length < 120) s.menu.push({ id: uid(), n, d: clip(it.d, 80), p, c, on: true });
      break;
    }
    case "menuToggle": {
      const m = s.menu.find(x => x.id === a.id);
      if (m) m.on = !!a.on;
      break;
    }
    case "menuDel":
      s.menu = s.menu.filter(x => x.id !== a.id);
      break;
    case "cafe":
      s.cafe = clip(a.name, 40) || s.cafe;
      break;
    case "reset":
      return seed();
  }
  const cutoff = Date.now() - 12 * 3600000;
  s.orders = s.orders.filter(o => !(o.paid && o.t < cutoff)).slice(-300);
  s.calls = s.calls.slice(-50);
  s.results = s.results.slice(-500);
  return s;
}

export { TABLES, seed, apply, clip };
