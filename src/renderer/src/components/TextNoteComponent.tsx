import { Flex, IconButton, TextField } from '@radix-ui/themes'
import { TextNote } from 'src/shared/models'
import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { useEffect, useState } from 'react'
import { Resizable } from 're-resizable'
import { Cross1Icon } from '@radix-ui/react-icons'
import { ipc } from '@renderer/lib/ipc'
import { store } from '@renderer/lib/store'

export type TextNoteComponentProps = {
  note: TextNote
}

const theme = EditorView.theme(
  {
    '&': {
      fontSize: '10pt'
    },
    'cm-theme': {
      height: '100%'
    },
    '&.cm-editor': {
      height: '100%'
    }
  },
  {
    dark: true
  }
)

export const TextNoteComponent: React.FC<TextNoteComponentProps> = ({ note }) => {
  const [localNote, setLocalNote] = useState(note)

  useEffect(() => {
    ipc.saveTextNote(localNote)
  }, [localNote])

  const [focused, setFocused] = useState(false)

  return (
    <Flex direction="column" gap="1">
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
          placeholder="Untitled Note"
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
          height: note.height
        }}
        onResizeStop={(_ev, _d, el) => {
          setLocalNote((n) => ({
            ...n,
            height: el.getBoundingClientRect().height
          }))
        }}
      >
        <CodeMirror
          value={localNote.content}
          basicSetup={{
            lineNumbers: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false
          }}
          extensions={[EditorView.lineWrapping, markdown()]}
          theme={theme}
          onChange={(value) => {
            setLocalNote((n) => (value === n.content ? n : { ...n, content: value }))
          }}
        />
      </Resizable>
    </Flex>
  )
}
