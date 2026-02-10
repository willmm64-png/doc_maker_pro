import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const isDev = !app.isPackaged;

const DOCX_FILTER = [{ name: 'Word Document', extensions: ['docx'] }];

const stripHtml = (html: string): string =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const createWindow = async (): Promise<void> => {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#101214',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    await window.loadURL('http://localhost:5173');
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    await window.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

ipcMain.handle('file:openDocx', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Open .docx file',
    filters: DOCX_FILTER,
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  const filePath = filePaths[0];
  const result = await mammoth.convertToHtml({ path: filePath });

  return {
    filePath,
    html: result.value,
    warnings: result.messages.map((message) => message.message)
  };
});

ipcMain.handle('file:saveDocx', async (_, payload: { html: string }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save as .docx',
    defaultPath: 'document.docx',
    filters: DOCX_FILTER
  });

  if (canceled || !filePath) {
    return null;
  }

  const plainText = stripHtml(payload.html);
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: plainText || ' '
              })
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(filePath, buffer);

  return { filePath };
});

ipcMain.handle('file:saveNative', async (_, payload: { html: string }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save project',
    defaultPath: 'document.dmp',
    filters: [{ name: 'Doc Maker Pro File', extensions: ['dmp'] }]
  });

  if (canceled || !filePath) {
    return null;
  }

  await fs.writeFile(filePath, payload.html, 'utf8');
  return { filePath };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
