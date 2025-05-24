import { Button, Flex, IconButton } from '@radix-ui/themes'
import { ipc } from './lib/ipc'
import { Cross1Icon, PlusIcon } from '@radix-ui/react-icons'
import { store } from './lib/store'
import { match } from 'ts-pattern'
import { TextNoteComponent } from './components/TextNoteComponent'
import { ImageNoteComponent } from './components/ImageNoteComponent'
import { useEffect, useState } from 'react'

const Header: React.FC = () => {
  return (
    <Flex
      direction="row"
      justify="between"
      style={{
        ...({
          WebkitAppRegion: 'drag'
        } as object)
      }}
    >
      <Button
        style={{
          ...({
            WebkitAppRegion: 'no-drag'
          } as object)
        }}
        onClick={() => ipc.hideWindow()}
      >
        Done
      </Button>

      <Button
        style={{
          ...({
            WebkitAppRegion: 'no-drag'
          } as object)
        }}
        onClick={() => ipc.createTextNote().then(() => store.getNotes.invalidate())}
      >
        <PlusIcon />
      </Button>
    </Flex>
  )
}

function AddImageButton(): React.JSX.Element {
  const [image, setImage] = useState<Blob>()
  const [imageUrl, setImageUrl] = useState<string>()
  const [imageHash, setImageHash] = useState<string>()
  const [doneHash, setDoneHash] = useState<string>()

  useEffect(() => {
    async function handleImage(): Promise<void> {
      if (!document.hasFocus()) return

      const clipboardItems = await navigator.clipboard.read()
      const imageItem = clipboardItems.find((item) =>
        item.types.some((t) => t.startsWith('image/'))
      )
      const blob = await imageItem?.getType(imageItem.types.find((t) => t.startsWith('image/'))!)

      if (blob) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

        setImageUrl(URL.createObjectURL(blob))
        setImageHash(hashHex)
        setImage(blob)
      } else {
        setImageUrl(undefined)
        setImage(undefined)
        setImage(undefined)
      }
    }

    const int = setInterval(handleImage, 1000)

    return () => {
      clearInterval(int)
    }
  }, [])

  if (!image || doneHash === imageHash) {
    return <></>
  }

  return (
    <Flex align="center" p="1" gap="2">
      <img src={imageUrl} style={{ height: 40, width: 40, borderRadius: '4px' }} />
      <IconButton variant="ghost" color="gray" onClick={() => setDoneHash(imageHash)}>
        <Cross1Icon />
      </IconButton>

      <Flex flexGrow="1" />
      <Button
        color="iris"
        onClick={async () => {
          const binary = await image.arrayBuffer()
          const imagePath = await ipc.saveImage(binary)
          await ipc.createImageNote(imagePath)
          store.getNotes.invalidate()
          setDoneHash(imageHash)
        }}
      >
        Add Image
      </Button>
    </Flex>
  )
}

function App(): React.JSX.Element {
  const notes = store.getNotes.useQuery()

  return (
    <Flex direction="column" gap="2" p="2" style={{ height: '100vh' }}>
      <Header />

      <AddImageButton />

      <Flex direction="column" gap="4" flexGrow="1" flexShrink="1" overflow="auto">
        {match(notes)
          .with({ status: 'success' }, ({ data }) => {
            return data.map((note) =>
              match(note)
                .with({ type: 'text' }, (note) => <TextNoteComponent key={note.id} note={note} />)
                .with({ type: 'image' }, (note) => <ImageNoteComponent key={note.id} note={note} />)
                .exhaustive()
            )
          })
          .otherwise(() => null)}

        <Flex style={{ height: 300 }} flexShrink="0" />
      </Flex>
    </Flex>
  )
}

export default App
