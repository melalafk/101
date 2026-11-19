// Wraps index.html (written as a page fragment) into a full HTML document in public/ for Cloudflare.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const body = readFileSync(new URL("./index.html", import.meta.url), "utf8")
  .replace(/<meta charset="utf-8">\s*/i, "")
  .replace(/<meta name="viewport"[^>]*>\s*/i, "");
const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1f5a43">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="101 Skor">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${body}
</body>
</html>
`;
mkdirSync(new URL("./public/", import.meta.url), { recursive: true });
writeFileSync(new URL("./public/index.html", import.meta.url), html);
// Worker that serves the page (no static-assets upload needed)
const worker = `const HTML = ${JSON.stringify(html)};
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/" && url.pathname !== "/index.html") return Response.redirect(url.origin + "/", 302);
    return new Response(HTML, { headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    } });
  },
};
`;
writeFileSync(new URL("./public/worker.js", import.meta.url), worker);
console.log("public/index.html and public/worker.js written");
