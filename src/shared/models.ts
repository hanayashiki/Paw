export type BaseNote = {
  id: number
  title: string
  height: number
  createdAt: string
  updatedAt: string
}

export type TextNote = BaseNote & {
  type: 'text'
  content: string
}

export type ImageNote = BaseNote & {
  type: 'image'
  imagePath: string
}

export type Note = TextNote | ImageNote

export type DB = {
  counter: number;
  notes: Note[]
}
