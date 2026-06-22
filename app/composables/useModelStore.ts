// Tiny IndexedDB-backed store for user-uploaded 3D models.
// Each record: { id, name, ext, data (ArrayBuffer), size, createdAt }

export interface StoredModel {
  id: string
  name: string
  ext: 'stl' | 'obj'
  data: ArrayBuffer
  size: number
  createdAt: number
}

export type ModelMeta = Omit<StoredModel, 'data'>

const DB_NAME = 'aero-sim'
const STORE = 'models'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = fn(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error)
      }),
  )
}

export function useModelStore() {
  const isClient = typeof window !== 'undefined' && 'indexedDB' in window

  async function list(): Promise<ModelMeta[]> {
    if (!isClient) return []
    const all = await tx<StoredModel[]>('readonly', (s) => s.getAll())
    return all
      .map(({ data, ...meta }) => meta)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  async function get(id: string): Promise<StoredModel | undefined> {
    if (!isClient) return undefined
    return tx<StoredModel>('readonly', (s) => s.get(id))
  }

  async function save(file: File): Promise<ModelMeta> {
    const ext = (file.name.split('.').pop() || '').toLowerCase() as 'stl' | 'obj'
    const data = await file.arrayBuffer()
    const rec: StoredModel = {
      id: `m_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
      name: file.name,
      ext,
      data,
      size: file.size,
      createdAt: Date.now(),
    }
    await tx('readwrite', (s) => s.put(rec))
    const { data: _omit, ...meta } = rec
    return meta
  }

  async function remove(id: string): Promise<void> {
    if (!isClient) return
    await tx('readwrite', (s) => s.delete(id))
  }

  return { list, get, save, remove }
}
