import { Button, Flex } from '@radix-ui/themes'
import { ipc } from './lib/ipc'
import { PlusIcon } from '@radix-ui/react-icons'
import { store } from './lib/store'
import { match } from 'ts-pattern'
import { TextNoteComponent } from './components/TextNoteComponent'

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
      <Button onClick={() => ipc.hideWindow()}>Done</Button>
    </Flex>
  )
}

function App(): React.JSX.Element {
  const notes = store.getNotes.useQuery()

  return (
    <Flex direction="column" gap="2" p="2" style={{ height: '100vh' }}>
      <Header />

      <Flex direction="column" gap="1" flexGrow="1" flexShrink="1" overflow="auto">
        {match(notes)
          .with({ status: 'success' }, ({ data }) => {
            return data.map((note) =>
              match(note)
                .with({ type: 'text' }, (note) => <TextNoteComponent key={note.id} note={note} />)
                .otherwise(() => null)
            )
          })
          .otherwise(() => null)}

        <Button
          variant="soft"
          size="4"
          onClick={() => ipc.createTextNote().then(() => store.getNotes.invalidate())}
        >
          <PlusIcon />
        </Button>
      </Flex>
    </Flex>
  )
}

export default App
