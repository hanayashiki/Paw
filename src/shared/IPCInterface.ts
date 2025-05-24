import { Note, TextNote, ImageNote } from './models'

export interface IPCDBInterface {
  getNotes: () => Promise<Note[]>

  createTextNote: () => Promise<void>
  saveTextNote: (note: TextNote) => Promise<void>
  deleteNote: (id: number) => Promise<void>
  saveImage: (buf: ArrayBuffer) => Promise<string>
  createImageNote: (path: string) => Promise<void>
  saveImageNote: (note: ImageNote) => Promise<void>
}

export interface IPCInterface extends IPCDBInterface {
  hideWindow: () => Promise<void>
  openImageInPreview: (imagePath: string) => Promise<void>
}
