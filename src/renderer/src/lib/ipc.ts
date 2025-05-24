import type { IPCInterface } from '../../../shared/IPCInterface'

export const ipc: IPCInterface = new Proxy(
  {},
  {
    get(_, prop) {
      return (...args: unknown[]) => {
        return window.ipcBridge.request(prop as string, ...args)
      }
    }
  }
) as IPCInterface
