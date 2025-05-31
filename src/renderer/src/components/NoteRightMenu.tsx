import React from 'react'
import { ContextMenu } from '@radix-ui/themes'

export type NoteRightMenuProps = {
  children: React.ReactNode
  onSearchGoogle?: () => void
  onAskChatGPT?: () => void
  onAskGrok?: () => void
}

export const NoteRightMenu: React.FC<NoteRightMenuProps> = ({
  children,
  onSearchGoogle,
  onAskChatGPT,
  onAskGrok
}) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item onClick={onSearchGoogle}>Search Google</ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item onClick={onAskChatGPT}>Ask ChatGPT</ContextMenu.Item>
        <ContextMenu.Item onClick={onAskGrok}>Ask Grok</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
