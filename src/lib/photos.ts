// Eigene Fotos zu einem Fahrzeug: nur im Browser (IndexedDB), nie auf einem Server.
// Bilder werden vor dem Speichern auf höchstens 1600 px verkleinert.
const DB = 'tomei-photos'
const STORE = 'photos'

export type Photo = { id: string; vehicleId: string; blob: Blob; createdAt: string }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore(STORE, { keyPath: 'id' })
      s.createIndex('vehicleId', 'vehicleId')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const r = fn(t.objectStore(STORE))
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

export async function listPhotos(vehicleId: string): Promise<Photo[]> {
  try {
    const all = await tx<Photo[]>('readonly', (s) => s.index('vehicleId').getAll(vehicleId))
    return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  } catch {
    return []
  }
}

/** Bild verkleinern (JPEG, max. 1600 px) */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const cv = document.createElement('canvas')
  cv.width = Math.round(bmp.width * k)
  cv.height = Math.round(bmp.height * k)
  cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height)
  return new Promise((res) => cv.toBlob((b) => res(b ?? file), 'image/jpeg', 0.82))
}

export async function addPhotos(vehicleId: string, files: FileList | File[]): Promise<number> {
  let n = 0
  for (const f of Array.from(files).slice(0, 20)) {
    if (!f.type.startsWith('image/') || f.size > 40 * 1024 * 1024) continue
    const blob = await shrink(f)
    await tx('readwrite', (s) => s.put({ id: `${vehicleId}-${Date.now()}-${n}`, vehicleId, blob, createdAt: new Date().toISOString() } satisfies Photo))
    n++
  }
  return n
}

export async function removePhoto(id: string) {
  await tx('readwrite', (s) => s.delete(id))
}

export async function removeVehiclePhotos(vehicleId: string) {
  try {
    for (const p of await listPhotos(vehicleId)) await removePhoto(p.id)
  } catch {
    /* ohne IndexedDB gibt es nichts zu löschen */
  }
}

export async function wipePhotos() {
  try {
    indexedDB.deleteDatabase(DB)
  } catch {
    /* nichts zu tun */
  }
}
