const CACHE = 'clock-v15';
const FILES = ['./', './index.html', './big.html', './manifest.webmanifest', './icon.svg'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
// 更新のとき、ブラウザが持っている古いコピーを使わず、必ずサーバーから取り直す
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (FONT_HOSTS.includes(url.hostname)) {
    // フォントは一度取れたらオフラインでも使えるように保存しておく
    e.respondWith(caches.open(CACHE).then(c => c.match(e.request).then(hit =>
      hit || fetch(e.request).then(res => { c.put(e.request, res.clone()); return res; })
    )));
    return;
  }
  if (url.origin !== location.origin) return;
  // 自分のファイルは「ネットがあれば常に最新、なければ保存したもの」
  e.respondWith(
    fetch(url.href, { cache: 'no-cache' })
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
