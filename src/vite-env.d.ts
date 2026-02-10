/// <reference types="vite/client" />

declare global {
  interface Window {
    docMakerApi: {
      openDocx: () => Promise<{ filePath: string; html: string; warnings: string[] } | null>;
      saveDocx: (html: string) => Promise<{ filePath: string } | null>;
      saveNative: (html: string) => Promise<{ filePath: string } | null>;
    };
  }
}

export {};
