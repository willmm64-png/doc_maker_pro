import { contextBridge, ipcRenderer } from 'electron';

type OpenDocxResult = {
  filePath: string;
  html: string;
  warnings: string[];
};

type OpenProjectResult = {
  filePath: string;
  html: string;
};

type SaveResult = {
  filePath: string;
};

const api = {
  openDocx: (): Promise<OpenDocxResult | null> => ipcRenderer.invoke('file:openDocx'),
  openProject: (): Promise<OpenProjectResult | null> => ipcRenderer.invoke('file:openProject'),
  saveDocx: (html: string): Promise<SaveResult | null> => ipcRenderer.invoke('file:saveDocx', { html }),
  saveProjectAs: (html: string): Promise<SaveResult | null> => ipcRenderer.invoke('file:saveProjectAs', { html }),
  saveProject: (html: string, filePath: string): Promise<SaveResult> =>
    ipcRenderer.invoke('file:saveProject', { html, filePath })
};

contextBridge.exposeInMainWorld('docMakerApi', api);
