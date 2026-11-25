// Baut aus dist/ eine Fassung für ein Claude-Artifact (höchstens 511 Dateien): Modellfotos und Gelände in Pakete gebündelt.
// Aufruf: node tools/build-artifact.mjs <zielordner>
import fs from 'node:fs'
import path from 'node:path'
const out = process.argv[2]
fs.rmSync(out, { recursive: true, force: true })
const w = (p, d) => (fs.mkdirSync(path.dirname(path.join(out, p)), { recursive: true }), fs.writeFileSync(path.join(out, p), d))
for (const f of fs.readdirSync('dist/assets')) {
  if (/\.woff$/.test(f) || (/\.woff2$/.test(f) && !/-latin-/.test(f))) continue
  // Das Ersatzzeichen U+FFFD (pdf-lib) lässt Claude nicht als Klartext zu
  w('assets/' + f, f.endsWith('.js') ? fs.readFileSync('dist/assets/' + f, 'utf8').replaceAll('\uFFFD', '\\uFFFD') : fs.readFileSync('dist/assets/' + f))
}
const cat = JSON.parse(fs.readFileSync('src/data/models.json'))
const photos = JSON.parse(fs.readFileSync('src/data/models_photos.json'))
// Reihenfolge wie im Katalog, damit benachbarte Kacheln im selben Paket liegen
const ids = [...Object.keys(photos).filter((i) => i.startsWith('c-')), ...cat.map((m) => m.id).filter((i) => photos[i])]
const index = {}
let pk = 0
function pack(list, max) {
  let cur = {}
  let size = 0
  const flush = () => {
    if (!size) return
    w(`packs/p${pk}.json`, JSON.stringify(cur))
    for (const k of Object.keys(cur)) index[k] = pk
    pk++
    cur = {}
    size = 0
  }
  for (const [key, val] of list) {
    if (size && size + val.length > max) flush()
    cur[key] = val
    size += val.length
  }
  flush()
}
const b64 = (f) => fs.readFileSync(f).toString('base64')
const m = (n) => 'dist/images/m/' + n
pack(ids.map((i) => `${i}-0.webp`).filter((n) => fs.existsSync(m(n))).map((n) => ['images/m/' + n, b64(m(n))]), 1.1e6)
pack(ids.flatMap((i) => photos[i].map((_, k) => `${i}-${k}.avif`)).filter((n) => fs.existsSync(m(n))).map((n) => ['images/m/' + n, b64(m(n))]), 2.4e6)
const imgs = ['', 'cars/', 'roads/'].flatMap((d) => fs.readdirSync('dist/images/' + d).filter((f) => f.endsWith('.webp')).map((f) => 'images/' + d + f))
const pics = (l) => l.map((n) => [n, b64('dist/' + n)])
pack(pics(imgs.filter((n) => n.endsWith('-s.webp'))), 1.5e6)
pack(pics(imgs.filter((n) => !n.endsWith('-s.webp'))), 1.5e6)
pack(fs.readdirSync('dist/data/terrain').map((f) => ['data/terrain/' + f, fs.readFileSync('dist/data/terrain/' + f, 'utf8')]), 6e5)
w('packs/index.json', JSON.stringify(index))
const html = fs.readFileSync('dist/index.html', 'utf8')
const js = html.match(/src="\.\/(assets\/index-[^"]+\.js)"/)[1]
const css = html.match(/href="\.\/(assets\/index-[^"]+\.css)"/)[1]
w(
  'page.html',
  `<title>TŌMEI</title>
<link rel="stylesheet" href="${css}">
<style>html{color-scheme:light}body{background:#F4F2ED}#tm-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;background:#222624;color:#fff;border-radius:999px;padding:12px 20px;font:600 14px system-ui;max-width:calc(100% - 32px)}#tm-inst{position:fixed;right:18px;bottom:18px;z-index:9998;border:0;border-radius:999px;background:#222624;color:#fff;padding:13px 20px;font:600 14px system-ui;cursor:pointer;box-shadow:0 8px 30px rgb(0 0 0/25%)}</style>
<script type="application/json" id="claude-artifacts-manifest">{"permissions":[]}</script>
<div id="root"></div>
<div id="tm-toast" role="status" hidden></div>
<script>
(() => {
  // Pakete: Modellfotos und Gelände
  let idx
  const packs = new Map(), urls = new Map()
  const realFetch = window.fetch.bind(window)
  const getIndex = () => (idx ??= realFetch('packs/index.json').then((r) => r.json()).catch(() => ((idx = null), {})))
  const getPack = (n) => {
    if (!packs.has(n)) packs.set(n, realFetch('packs/p' + n + '.json').then((r) => r.json()).catch(() => (packs.delete(n), {})))
    return packs.get(n)
  }
  const keyOf = (u) => (String(u).match(/(?:images|data\\/terrain)\\/[^?#]+$/) || [])[0]
  const entry = async (key) => {
    const n = (await getIndex())[key]
    return n === undefined ? undefined : (await getPack(n))[key]
  }
  const blobOf = async (key) => {
    const v = await entry(key)
    if (!v) return null
    const bin = atob(v), a = new Uint8Array(bin.length)
    for (let i = 0; i < a.length; i++) a[i] = bin.charCodeAt(i)
    return new Blob([a], { type: key.endsWith('.avif') ? 'image/avif' : 'image/webp' })
  }
  window.fetch = async (u, o) => {
    const key = typeof u === 'string' ? keyOf(u) : undefined
    if (!key) return realFetch(u, o)
    if (key.endsWith('.json')) {
      const v = await entry(key)
      return v ? new Response(v, { headers: { 'content-type': 'application/json' } }) : new Response('', { status: 404 })
    }
    const b = await blobOf(key)
    return b ? new Response(b) : new Response('', { status: 404 })
  }
  addEventListener('error', (e) => {
    const im = e.target
    if (!(im instanceof HTMLImageElement) || im.dataset.tm === im.src) return
    const key = keyOf(im.getAttribute('src') || '')
    if (!key || !key.startsWith('images/')) return
    e.stopPropagation()
    const want = im.getAttribute('src')
    ;(async () => {
      if (!urls.has(key)) {
        const b = await blobOf(key)
        urls.set(key, b ? URL.createObjectURL(b) : '')
      }
      if (im.getAttribute('src') !== want) return
      const u = urls.get(key)
      if (u) im.src = u
      else {
        // gibt es nicht: den Fehler an die Seite weitergeben (dort: kleine Fassung oder Platzhalter)
        im.dataset.tm = im.src
        im.dispatchEvent(new Event('error'))
      }
    })()
  }, true)

  // Hinweise statt Systemdialogen
  const toastEl = document.getElementById('tm-toast')
  let timer
  const toast = (t) => {
    toastEl.textContent = t
    toastEl.hidden = false
    clearTimeout(timer)
    timer = setTimeout(() => (toastEl.hidden = true), 5000)
  }
  let last = ''
  window.confirm = (t) => {
    if (last === t) return (last = ''), (toastEl.hidden = true), true
    last = t
    setTimeout(() => last === t && (last = ''), 6000)
    toast('Zum Bestätigen noch einmal klicken: ' + t)
    return false
  }

  // Dateien über die Claude-Funktion speichern
  const blobs = new Map()
  const mk = URL.createObjectURL.bind(URL)
  URL.createObjectURL = (b) => {
    const u = mk(b)
    if (b instanceof Blob) blobs.set(u, b)
    return u
  }
  const rv = URL.revokeObjectURL.bind(URL)
  URL.revokeObjectURL = (u) => (blobs.delete(u), rv(u))
  const use = (n) => (window.claude && window.claude.use ? window.claude.use(n) : Promise.resolve(null))
  const dl = use('downloads').catch(() => null)
  const click = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function () {
    const b = this.download && blobs.get(this.href)
    if (!b) return click.call(this)
    let name = this.download
    // GPX und Kalender lässt Claude nicht zu: als Text speichern, Endung später entfernen
    if (!/\\.(png|jpe?g|webp|txt|json|csv|pdf|svg)$/i.test(name)) name += '.txt'
    dl.then((d) => {
      if (!d) return toast('Speichern ist hier nicht möglich. Nutze dafür die Webseite.')
      return d.save({ filename: name, data: b }).then(() => name.endsWith('.txt') && toast('Gespeichert. Entferne „.txt“ am Ende des Dateinamens.'))
    }).catch((e) => e && e.code !== 'declined' && toast('Die Datei konnte nicht gespeichert werden.'))
  }

  // Desktop-App: Symbol, Drucken und Installieren
  use('desktop').then(async (d) => {
    if (!d) return
    if (d.app && d.app.dock) {
      const c = document.createElement('canvas')
      c.width = c.height = 256
      const x = c.getContext('2d')
      x.fillStyle = '#F4F2ED'
      x.beginPath()
      x.roundRect(22, 22, 212, 212, 48)
      x.fill()
      x.fillStyle = '#222624'
      x.font = '700 132px system-ui'
      x.textAlign = 'center'
      x.textBaseline = 'middle'
      x.fillText('T', 124, 136)
      x.fillStyle = '#D64B3C'
      x.beginPath()
      x.arc(186, 178, 12, 0, 7)
      x.fill()
      d.app.dock.setIcon(c.toDataURL('image/png')).catch(() => {})
    }
    window.print = () => (d.window ? d.window.print().catch(() => {}) : toast('Nutze „Fahrzeugmappe (PDF)“.'))
    if (d.install && (await d.install.state()) === 'available') {
      const b = document.createElement('button')
      b.id = 'tm-inst'
      b.textContent = 'Als App installieren'
      b.onclick = () => d.install.request().then((r) => r === 'installed' && b.remove()).catch(() => toast('Installieren hat nicht geklappt. Nutze „Install as app“ im Menü.'))
      document.body.append(b)
    }
  }).catch(() => {})
})()
</script>
<script type="module" src="${js}"></script>
`,
)
const all = fs.readdirSync(out, { recursive: true }).filter((f) => fs.statSync(path.join(out, f)).isFile())
console.log(all.length, 'Dateien', Math.round(all.reduce((s, f) => s + fs.statSync(path.join(out, f)).size, 0) / 1e6), 'MB', pk, 'Pakete')
