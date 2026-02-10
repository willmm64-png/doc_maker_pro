# Doc Maker Pro

A dark-themed Electron desktop app starter for creating rich documents and working with `.docx` files.

## Features in this starter

- Electron shell with secure preload bridge
- Dark UI optimized for long writing sessions
- Rich text editing using contenteditable commands (bold, headings, lists, quotes)
- `.docx` import with Mammoth
- `.docx` export via `docx`
- Native project save to `.dmp`

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- This is an initial implementation. Export currently flattens rich HTML into plain text for DOCX generation.
- Next step: map editor schema to full DOCX style runs and paragraph structures for higher fidelity.
