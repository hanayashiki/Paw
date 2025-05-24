import { IpcRenderer } from '@electron-toolkit/preload'

export interface IPCMessage {
  requestId: string
  methodName: string
  args: unknown[]
  resolvers: PromiseWithResolvers<unknown>
}

export class IPCBridge {
  messages: IPCMessage[] = []
  counter = 0

  constructor(private ipcRenderer: IpcRenderer) {
    this.ipcRenderer.on('ipc-response', (_, data) => {
      const [requestId, result] = data
      const message = this.messages.find((msg) => msg.requestId === requestId)
      if (message) {
        message.resolvers.resolve(result)
        this.messages = this.messages.filter((msg) => msg.requestId !== requestId)
      }
    })
  }

  // contextBridge.exposeInMainWorld() 暴露到 renderer 的对象，不能包含带有 prototype 的类实例或函数原型链。
  request = async (methodName: string, ...args: unknown[]): Promise<unknown> => {
    const requestId = `${this.counter++}`
    const message = { requestId, methodName, args, resolvers: Promise.withResolvers<unknown>() }
    this.messages.push(message)
    this.ipcRenderer.send('ipc-request', [methodName, requestId, ...args])

    return await message.resolvers.promise
  }
}
