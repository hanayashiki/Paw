// filepath: /Users/chenyuwang/paw/paw/src/renderer/src/components/ImageNoteComponent.tsx
import { Flex, IconButton, TextField } from '@radix-ui/themes'
import { ImageNote } from 'src/shared/models'
import { useEffect, useState } from 'react'
import { Resizable } from 're-resizable'
import { Cross1Icon } from '@radix-ui/react-icons'
import { ipc } from '@renderer/lib/ipc'
import { store } from '@renderer/lib/store'

export type ImageNoteComponentProps = {
  note: ImageNote
}

export const ImageNoteComponent: React.FC<ImageNoteComponentProps> = ({ note }) => {
  const [localNote, setLocalNote] = useState(note)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    ipc.saveImageNote(localNote)
  }, [localNote])

  const handleImageClick = (): void => {
    // Open the image in macOS Preview app
    ipc.openImageInPreview(localNote.imagePath)
  }

  return (
    <Flex direction="column" gap="4">
      <Flex
        direction="row"
        align="center"
        gap="2"
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={(ev) => {
          if (!ev.currentTarget.contains(ev.relatedTarget)) {
            setFocused(false)
          }
        }}
      >
        <TextField.Root
          size="2"
          placeholder="Untitled Image"
          value={localNote.title}
          style={{ flexGrow: 1 }}
          onChange={(ev) => {
            setLocalNote((n) =>
              ev.target.value === n.title ? n : { ...n, title: ev.target.value }
            )
          }}
        />
        {focused && (
          <IconButton
            color="red"
            variant="solid"
            onClick={() => ipc.deleteNote(localNote.id).then(() => store.getNotes.invalidate())}
          >
            <Cross1Icon />
          </IconButton>
        )}
      </Flex>

      <Resizable
        defaultSize={{
          height: note.height,
          width: '100%'
        }}
        onResizeStop={(_ev, _d, el) => {
          setLocalNote((n) => ({
            ...n,
            height: el.getBoundingClientRect().height
          }))
        }}
        style={{
          borderRadius: '4px',
          overflow: 'hidden',
          paddingBottom: 16,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <img
          src={`file://${localNote.imagePath}`}
          alt={localNote.title || 'Image note'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            cursor: 'pointer',
            display: 'block'
          }}
          onClick={handleImageClick}
        />
      </Resizable>
    </Flex>
  )
}
