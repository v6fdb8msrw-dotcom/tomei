// Meine Daten: was gespeichert ist, Export, Import (ersetzen oder zusammenführen) und Löschen.
import { Download, FileUp, ShieldCheck, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { BRAND } from '../config/brand.ts'
import { Note, PageHead } from '../components/ui.tsx'
import { downloadFile, getState, isStorageOk, makeBackup, mergeStores, parseBackup, replaceAll, wipeAll, useStore, STORE_KEY } from '../store/store.ts'
import { SCHEMA_VERSION } from '../store/schema.ts'

export function DataPage() {
  const s = useStore((x) => x)
  const file = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const [msg, setMsg] = useState<{ t: 'ok' | 'warn'; m: string } | null>(null)
  const size = new Blob([JSON.stringify(s)]).size
  const rows = [
    { l: 'Fahrzeuge', n: s.vehicles.length },
    { l: 'Wartungseinträge', n: s.maintenance.length },
    { l: 'Passport-Einträge', n: s.passport.length },
    { l: 'Roadtrips', n: s.trips.length },
  ]
  return (
    <>
      <PageHead
        eyebrow="Meine Daten"
        title={
          <>
            Deine Daten. <em>Auf deinem Gerät.</em>
          </>
        }
        sub={`${BRAND.name} hat kein Konto und keinen Server für deine Daten. Alles liegt im Speicher dieses Browsers. Sichere es als Datei, zieh es auf ein anderes Gerät um oder lösche es vollständig.`}
      />
      <section className="section narrow data-page">
        {!isStorageOk() && <Note tone="warn">Der Browser lässt gerade nichts speichern (privates Fenster oder Speicher voll). Änderungen gehen beim Schließen verloren. Exportiere sie als Datei.</Note>}
        <div className="gcard">
          <h3>
            <ShieldCheck size={18} /> Gespeichert
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
            Schlüssel <code>{STORE_KEY}</code> · Format-Version {SCHEMA_VERSION} · {(size / 1024).toLocaleString('de-DE', { maximumFractionDigits: 1 })} KB
          </p>
        </div>

        <div className="gcard">
          <h3>Sichern</h3>
          <p>Eine JSON-Datei mit allem: Garage, Wartung, Passport, Roadtrips und Einstellungen.</p>
          <button className="btn primary" onClick={() => downloadFile(`${BRAND.ascii.toLowerCase()}-sicherung-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(makeBackup(getState()), null, 2))}>
            <Download size={16} /> Sicherung herunterladen
          </button>
        </div>

        <div className="gcard">
          <h3>Einlesen</h3>
          <p>Eine Sicherung von {BRAND.name} laden. Unbekannte Felder und unsichere Links werden beim Einlesen verworfen.</p>
          <div className="seg">
            <button className={mode === 'merge' ? 'on' : ''} onClick={() => setMode('merge')}>
              Zusammenführen
            </button>
            <button className={mode === 'replace' ? 'on' : ''} onClick={() => setMode('replace')}>
              Ersetzen
            </button>
          </div>
          <p className="small muted">{mode === 'merge' ? 'Neue Einträge kommen dazu; bei gleicher ID gewinnt die neuere Fassung.' : 'Der aktuelle Stand wird vollständig durch die Datei ersetzt.'}</p>
          <button className="btn" onClick={() => file.current?.click()}>
            <FileUp size={16} /> Datei wählen
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
                if (f.size > 20 * 1024 * 1024) throw new Error('Die Datei ist größer als 20 MB.')
                const data = parseBackup(await f.text())
                if (mode === 'replace' && !confirm('Aktuellen Stand durch die Datei ersetzen?')) return
                replaceAll(mode === 'merge' ? mergeStores(getState(), data) : data)
                setMsg({ t: 'ok', m: `Eingelesen: ${data.vehicles.length} Fahrzeuge, ${data.trips.length} Roadtrips.` })
              } catch (x) {
                setMsg({ t: 'warn', m: (x as Error).message })
              }
            }}
          />
          {msg && <Note tone={msg.t === 'ok' ? 'info' : 'warn'}>{msg.m}</Note>}
        </div>

        <div className="gcard danger-zone">
          <h3>Alles löschen</h3>
          <p>Entfernt alle Daten von {BRAND.name} aus diesem Browser, auch die alte Merkliste und Entwürfe. Das lässt sich nicht rückgängig machen.</p>
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Wirklich alle Daten löschen? Exportiere vorher eine Sicherung, wenn du sie behalten willst.')) {
                wipeAll()
                setMsg({ t: 'ok', m: 'Alle Daten wurden gelöscht.' })
              }
            }}
          >
            <Trash2 size={16} /> Alle Daten löschen
          </button>
        </div>
      </section>
    </>
  )
}
