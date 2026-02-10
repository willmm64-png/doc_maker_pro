import { contextBridge, ipcRenderer } from 'electron';

type OpenDocxResult = {
  filePath: string;
  html: string;
  warnings: string[];
};

type SaveResult = {
  filePath: string;
};

const api = {
  openDocx: (): Promise<OpenDocxResult | null> => ipcRenderer.invoke('file:openDocx'),
  saveDocx: (html: string): Promise<SaveResult | null> => ipcRenderer.invoke('file:saveDocx', { html }),
  saveNative: (html: string): Promise<SaveResult | null> => ipcRenderer.invoke('file:saveNative', { html })
};

contextBridge.exposeInMainWorld('docMakerApi', api);
