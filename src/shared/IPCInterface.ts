import { Note, TextNote } from './models'

export interface IPCDBInterface {
  getNotes: () => Promise<Note[]>

  createTextNote: () => Promise<void>
  saveTextNote: (note: TextNote) => Promise<void>
  deleteNote: (id: number) => Promise<void>
}

export interface IPCInterface extends IPCDBInterface {
  hideWindow: () => Promise<void>
}
