import { is } from '@electron-toolkit/utils'
import { IPCDBInterface } from '../shared/IPCInterface'
import { dirname, join, resolve } from 'path'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { homedir } from 'os'
import { DB } from '../shared/models'

const file = is.dev ? 'data/dev.json' : join(homedir(), '.paw/data.json')
const imagesDir = join(dirname(file), 'images')

let dbCache: DB = {
  counter: 1,
  notes: [
    {
      id: 1,
      title: 'Welcome to Paw',
      content: 'This is a sample note. You can edit or delete it.',
      type: 'text',
      height: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

const saveDb = async (db: DB): Promise<void> => {
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(db, null, 2), { flag: 'w' })
}

export const loadDb = async (): Promise<DB> => {
  try {
    const data = JSON.parse((await readFile(file)).toString())
    dbCache = data
    return data
  } catch (e) {
    console.error('Failed to load db, use initial data', e)
    return dbCache
  }
}

export const dbInterface: IPCDBInterface = {
  async getNotes() {
    return dbCache.notes
  },

  async createTextNote() {
    dbCache.notes.push({
      id: ++dbCache.counter,
      content: '',
      type: 'text',
      title: 'New Note',
      height: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    await saveDb(dbCache)
  },
  async saveTextNote(note) {
    const index = dbCache.notes.findIndex((v) => v.id === note.id)
    dbCache.notes.splice(index, 1, {
      ...note,
      updatedAt: new Date().toISOString()
    })

    await saveDb(dbCache)
  },

  async deleteNote(id: number) {
    const index = dbCache.notes.findIndex((v) => v.id === id)
    console.log('delete note', index, id)
    if (index === -1) {
      return
    }
    dbCache.notes.splice(index, 1)

    await saveDb(dbCache)
  },

  async createImageNote(path: string) {
    dbCache.notes.push({
      id: ++dbCache.counter,
      type: 'image',
      imagePath: path,
      title: `Image Note ${dbCache.counter}`,
      height: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    await saveDb(dbCache)
  },

  async saveImageNote(note) {
    const index = dbCache.notes.findIndex((v) => v.id === note.id)
    dbCache.notes.splice(index, 1, {
      ...note,
      updatedAt: new Date().toISOString()
    })

    await saveDb(dbCache)
  },

  async saveImage(buf: ArrayBuffer): Promise<string> {
    await mkdir(imagesDir, { recursive: true })
    const imagePath = resolve(join(imagesDir, `image-${Date.now()}.png`))
    await writeFile(imagePath, Buffer.from(buf))
    return imagePath
  }
}
