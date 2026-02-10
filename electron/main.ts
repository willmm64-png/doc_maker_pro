import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const isDev = !app.isPackaged;

const DOCX_FILTER = [{ name: 'Word Document', extensions: ['docx'] }];
const PROJECT_FILTERS = [
  { name: 'Doc Maker Pro File', extensions: ['dmp'] },
  { name: 'HTML File', extensions: ['html'] },
  { name: 'Text File', extensions: ['txt'] }
];

const stripHtml = (html: string): string =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extensionToHtml = (raw: string, extension: string): string => {
  if (extension === '.txt') {
    return `<p>${raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</p>`;
  }

  return raw;
};

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

ipcMain.handle('file:openProject', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Open file',
    filters: PROJECT_FILTERS,
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  const filePath = filePaths[0];
  const raw = await fs.readFile(filePath, 'utf8');
  const extension = path.extname(filePath).toLowerCase();

  return {
    filePath,
    html: extensionToHtml(raw, extension)
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

ipcMain.handle('file:saveProjectAs', async (_, payload: { html: string }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save project',
    defaultPath: 'document.dmp',
    filters: PROJECT_FILTERS
  });

  if (canceled || !filePath) {
    return null;
  }

  await fs.writeFile(filePath, payload.html, 'utf8');
  return { filePath };
});

ipcMain.handle('file:saveProject', async (_, payload: { html: string; filePath: string }) => {
  await fs.writeFile(payload.filePath, payload.html, 'utf8');
  return { filePath: payload.filePath };
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
