import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPCBridge } from './IPCBridge'

try {
  const ipcBridge = new IPCBridge(electronAPI.ipcRenderer)
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('ipcBridge', ipcBridge)
} catch (error) {
  console.error(error)
}
