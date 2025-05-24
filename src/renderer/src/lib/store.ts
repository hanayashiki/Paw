/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDeepEqual } from 'remeda'
import { useCallback, useSyncExternalStore } from 'react'
import { IPCInterface } from 'src/shared/IPCInterface'
import { match } from 'ts-pattern'
import { ipc } from './ipc'

export type StoreItemData<D> =
  | {
      status: 'loading'
    }
  | {
      status: 'error'
      error: unknown
    }
  | {
      status: 'success'
      data: D
    }

export type StoreMethods<M extends (...args: any[]) => Promise<any>> = {
  useQuery: (...args: Parameters<M>) => StoreItemData<Awaited<ReturnType<M>>>
  invalidate: (...args: Parameters<M>) => void
}

export type AnyStoreMethods = StoreMethods<(...args: any[]) => Promise<any>>

export type MethodNameAndArgsFilter = {
  type: 'methodNameAndArgs'
  methodName: keyof IPCInterface
  args: any[]
}

export type Filter =
  | {
      type: 'methodName'
      methodName: keyof IPCInterface
    }
  | MethodNameAndArgsFilter

export type Listener = {
  filter: MethodNameAndArgsFilter
  onChange: () => void
}

export type StoreItem = {
  methodName: string
  args: any[]
  rc: number
  invalid: boolean
  isFetching: boolean
  data: StoreItemData<any>
}

const storeItems: StoreItem[] = []

const listeners: Listener[] = []

const matchesFilter = (storeItem: StoreItem, filter: Filter): boolean => {
  return match(filter)
    .returnType<boolean>()
    .with({ type: 'methodName' }, (filter) => {
      return storeItem.methodName === filter.methodName
    })
    .with({ type: 'methodNameAndArgs' }, (filter) => {
      return storeItem.methodName === filter.methodName && isDeepEqual(storeItem.args, filter.args)
    })
    .exhaustive()
}

const emitChange = (): void => {
  listeners.forEach((listener) => {
    listener.onChange()
  })
}

const ensureStoreItem = (filter: MethodNameAndArgsFilter): StoreItem => {
  const item = storeItems.find((storeItem) => matchesFilter(storeItem, filter))
  if (!item) {
    const item: StoreItem = {
      methodName: filter.methodName,
      args: filter.args,
      rc: 0,
      invalid: true,
      isFetching: false,
      data: {
        status: 'loading'
      }
    }

    storeItems.push(item)
    return item
  }
  return item
}

const addListener = (listener: Listener): StoreItem => {
  const item = ensureStoreItem(listener.filter)

  listeners.push(listener)
  item.rc++

  ensureStoreItemValid(item)
  return item
}

const ensureStoreItemValid = (item: StoreItem): void => {
  if (item.invalid === false || item.isFetching) {
    return
  }

  item.isFetching = true
  item.data = {
    status: 'loading'
  }
  emitChange()

  const method = ipc[item.methodName] as (...args: any[]) => Promise<any>
  method(...item.args)
    .then((r) => {
      item.data = {
        status: 'success',
        data: r
      }
      item.invalid = false
      emitChange()
    })
    .catch((e) => {
      item.data = {
        status: 'error',
        error: e
      }
      emitChange()
    })
    .finally(() => (item.isFetching = false))
}

const removeListener = (item: StoreItem, listener: Listener): void => {
  const tg = listeners.findIndex((v) => v === listener)
  if (tg !== -1) {
    listeners.splice(tg, 1)
  }
  item.rc--
  if (item.rc === 0) {
    const tg = storeItems.findIndex((v) => v === item)
    if (tg !== -1) {
      storeItems.splice(tg, 1)
    }
  }
}

export const store: {
  [K in keyof IPCInterface]: StoreMethods<IPCInterface[K]>
} = new Proxy(
  {},
  {
    get(_, prop): AnyStoreMethods {
      return {
        useQuery: (...args: any[]) => {
          const filter: Filter = {
            type: 'methodNameAndArgs',
            methodName: prop as keyof IPCInterface,
            args
          }

          return useSyncExternalStore(
            useCallback((onChange) => {
              const listener: Listener = {
                filter,
                onChange
              }
              const item = addListener(listener)
              return () => {
                removeListener(item, listener)
              }
            }, []),
            useCallback(() => {
              return ensureStoreItem(filter).data
            }, [])
          )
        },
        invalidate: (...args: any[]) => {
          const filter: Filter = {
            type: 'methodNameAndArgs',
            methodName: prop as keyof IPCInterface,
            args
          }

          const invalidated = storeItems.filter((storeItem) => matchesFilter(storeItem, filter))
          for (const item of invalidated) {
            item.invalid = true
            ensureStoreItemValid(item)
          }
        }
      }
    }
  }
) as any
