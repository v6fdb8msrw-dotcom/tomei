// Meine Daten: was gespeichert ist, Export, Import (ersetzen oder zusammenführen) und Löschen.
import { Download, FileUp, ShieldCheck, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { BRAND } from '../config/brand.ts'
import { Note, PageHead } from '../components/ui.tsx'
import { downloadFile, getState, isStorageOk, makeBackup, mergeStores, parseBackup, replaceAll, wipeAll, useStore, STORE_KEY } from '../store/store.ts'
import { SCHEMA_VERSION } from '../store/schema.ts'
import { useT } from '../i18n/i18n.ts'
import { setHome } from '../lib/home.ts'
import { wipePhotos } from '../lib/photos.ts'

export function DataPage() {
  const { tx, locale } = useT()
  const s = useStore((x) => x)
  const file = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const [msg, setMsg] = useState<{ t: 'ok' | 'warn'; m: string } | null>(null)
  const size = new Blob([JSON.stringify(s)]).size
  const rows = [
    { l: tx('Fahrzeuge', 'Vehicles'), n: s.vehicles.length },
    { l: tx('Wartungseinträge', 'Maintenance entries'), n: s.maintenance.length },
    { l: tx('Passport-Einträge', 'Passport entries'), n: s.passport.length },
    { l: 'Roadtrips', n: s.trips.length },
  ]
  return (
    <>
      <PageHead
        eyebrow={tx('Meine Daten', 'My data')}
        title={
          <>
            {tx('Deine Daten. ', 'Your data. ')}<em>{tx('Auf deinem Gerät.', 'On your device.')}</em>
          </>
        }
        sub={tx(`${BRAND.name} hat kein Konto und keinen Server für deine Daten. Alles liegt im Speicher dieses Browsers. Sichere es als Datei, zieh es auf ein anderes Gerät um oder lösche es vollständig.`, `${BRAND.name} has no account and no server for your data. Everything lives in this browser’s storage. Back it up as a file, move it to another device or delete it completely.`)}
      />
      <section className="section narrow data-page">
        {!isStorageOk() && <Note tone="warn">{tx('Der Browser lässt gerade nichts speichern (privates Fenster oder Speicher voll). Änderungen gehen beim Schließen verloren. Exportiere sie als Datei.', 'The browser is not allowing storage right now (private window or storage full). Changes will be lost when you close it. Export them as a file.')}</Note>}
        <div className="gcard">
          <h3>
            <ShieldCheck size={18} /> {tx('Gespeichert', 'Stored')}
          </h3>
          <div className="data-rows">
            {rows.map((r) => (
              <div key={r.l}>
                <b className="mono">{r.n}</b>
                <span>{r.l}</span>
              </div>
            ))}
          </div>
          <p className="small muted">
            {tx('Schlüssel', 'Key')} <code>{STORE_KEY}</code> · {tx('Format-Version', 'Format version')} {SCHEMA_VERSION} · {(size / 1024).toLocaleString(locale, { maximumFractionDigits: 1 })} KB
          </p>
        </div>

        <div className="gcard">
          <h3>{tx('Sichern', 'Back up')}</h3>
          <p>{tx('Eine JSON-Datei mit allem: Garage, Wartung, Passport, Roadtrips und Einstellungen.', 'One JSON file with everything: garage, maintenance, passport, road trips and settings.')}</p>
          <button className="btn primary" onClick={() => downloadFile(`${BRAND.ascii.toLowerCase()}-sicherung-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(makeBackup(getState()), null, 2))}>
            <Download size={16} /> {tx('Sicherung herunterladen', 'Download backup')}
          </button>
        </div>

        <div className="gcard">
          <h3>{tx('Einlesen', 'Import')}</h3>
          <p>{tx(`Eine Sicherung von ${BRAND.name} laden. Unbekannte Felder und unsichere Links werden beim Einlesen verworfen.`, `Load a ${BRAND.name} backup. Unknown fields and unsafe links are discarded on import.`)}</p>
          <div className="seg">
            <button className={mode === 'merge' ? 'on' : ''} onClick={() => setMode('merge')}>
              {tx('Zusammenführen', 'Merge')}
            </button>
            <button className={mode === 'replace' ? 'on' : ''} onClick={() => setMode('replace')}>
              {tx('Ersetzen', 'Replace')}
            </button>
          </div>
          <p className="small muted">{mode === 'merge' ? tx('Neue Einträge kommen dazu; bei gleicher ID gewinnt die neuere Fassung.', 'New entries are added; for the same ID the newer version wins.') : tx('Der aktuelle Stand wird vollständig durch die Datei ersetzt.', 'The current state is completely replaced by the file.')}</p>
          <button className="btn" onClick={() => file.current?.click()}>
            <FileUp size={16} /> {tx('Datei wählen', 'Choose file')}
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                if (f.size > 20 * 1024 * 1024) throw new Error(tx('Die Datei ist größer als 20 MB.', 'The file is larger than 20 MB.'))
                const data = parseBackup(await f.text())
                if (mode === 'replace' && !confirm(tx('Aktuellen Stand durch die Datei ersetzen?', 'Replace the current state with the file?'))) return
                replaceAll(mode === 'merge' ? mergeStores(getState(), data) : data)
                setMsg({ t: 'ok', m: tx(`Eingelesen: ${data.vehicles.length} Fahrzeuge, ${data.trips.length} Roadtrips.`, `Imported: ${data.vehicles.length} vehicles, ${data.trips.length} road trips.`) })
              } catch (x) {
                setMsg({ t: 'warn', m: (x as Error).message })
              }
            }}
          />
          {msg && <Note tone={msg.t === 'ok' ? 'info' : 'warn'}>{msg.m}</Note>}
        </div>

        <div className="gcard danger-zone">
          <h3>{tx('Alles löschen', 'Delete everything')}</h3>
          <p>{tx(`Entfernt alle Daten von ${BRAND.name} aus diesem Browser, auch die alte Merkliste und Entwürfe. Das lässt sich nicht rückgängig machen.`, `Removes all ${BRAND.name} data from this browser, including the old watchlist and drafts. This cannot be undone.`)}</p>
          <button
            className="btn danger"
            onClick={() => {
              if (confirm(tx('Wirklich alle Daten löschen? Exportiere vorher eine Sicherung, wenn du sie behalten willst.', 'Really delete all data? Export a backup first if you want to keep it.'))) {
                wipeAll()
                setHome(null)
                void wipePhotos()
                setMsg({ t: 'ok', m: tx('Alle Daten wurden gelöscht.', 'All data has been deleted.') })
              }
            }}
          >
            <Trash2 size={16} /> {tx('Alle Daten löschen', 'Delete all data')}
          </button>
        </div>
      </section>
    </>
  )
}
