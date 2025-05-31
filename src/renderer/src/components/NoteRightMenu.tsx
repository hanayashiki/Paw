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
        <ContextMenu.Item onClick={onSearchGoogle}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Search Google
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item onClick={onAskChatGPT}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            stroke-width="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Ask ChatGPT
        </ContextMenu.Item>
        <ContextMenu.Item onClick={onAskGrok}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            stroke-width="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Ask Grok
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
