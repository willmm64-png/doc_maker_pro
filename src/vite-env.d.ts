/// <reference types="vite/client" />

declare global {
  interface Window {
    docMakerApi: {
      openDocx: () => Promise<{ filePath: string; html: string; warnings: string[] } | null>;
      openProject: () => Promise<{ filePath: string; html: string } | null>;
      saveDocx: (html: string) => Promise<{ filePath: string } | null>;
      saveProjectAs: (html: string) => Promise<{ filePath: string } | null>;
      saveProject: (html: string, filePath: string) => Promise<{ filePath: string }>;
    };
  }
}

export {};
