// Offline shell: network first so a new deploy shows on the next open,
// falling back to the cached copy when offline (or the network is very slow).
const VERSION = "streak-v15";
const SHELL = ["./", "index.html", "css/app.css", "js/app.js", "js/logic.js", "js/store.js", "js/quotes.js", "js/fire.js", "js/vendor/three-fire.js",
  "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];

self.addEventListener("install", e => {
  const freshShell = SHELL.map(path => new Request(new URL(path, self.location.href), {cache:"reload"}));
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(freshShell)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // network first (fresh deploys show immediately), cache when offline or slow
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = () => cache.match(req, {ignoreSearch: true}).then(r => r || (req.mode === "navigate" ? cache.match("index.html") : undefined));
    try{
      const res = await Promise.race([fetch(req, {cache:"no-cache"}), new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), 3500))]);
      if(res.ok) cache.put(req, res.clone());
      return res;
    }catch(err){
      return (await cached()) || Response.error();
    }
  }));
});
