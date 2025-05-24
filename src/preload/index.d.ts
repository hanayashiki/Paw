import { ElectronAPI } from '@electron-toolkit/preload'
import { IPCBridge } from './IPCBridge'
declare global {
  interface Window {
    electron: ElectronAPI
    ipcBridge: IPCBridge
  }
}
