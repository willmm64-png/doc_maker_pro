import { useEffect, useMemo, useRef, useState } from 'react';

const COMMANDS = [
  { label: 'Bold', command: 'bold' },
  { label: 'Italic', command: 'italic' },
  { label: 'Underline', command: 'underline' },
  { label: 'H1', command: 'formatBlock', value: 'h1' },
  { label: 'H2', command: 'formatBlock', value: 'h2' },
  { label: 'Quote', command: 'formatBlock', value: 'blockquote' },
  { label: 'Bullet', command: 'insertUnorderedList' },
  { label: 'Number', command: 'insertOrderedList' }
] as const;

const STARTER_HTML = `
  <h1>Start writing</h1>
  <p>
    Build rich documents in a dark interface, then save and reopen your editable files.
  </p>
`;

export const App = (): JSX.Element => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Ready');
  const [docWarnings, setDocWarnings] = useState<string[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);

  const wordCount = useMemo(() => {
    const text = editorRef.current?.innerText ?? '';
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [editorVersion]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = STARTER_HTML;
    }
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void onSaveProject();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        void onOpenProject();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const runCommand = (command: string, value?: string): void => {
    document.execCommand(command, false, value);
    setStatus('Edited');
    setEditorVersion((valueNow) => valueNow + 1);
  };

  const onNewFile = (): void => {
    if (!editorRef.current) {
      return;
    }
    editorRef.current.innerHTML = STARTER_HTML;
    setActiveFilePath(null);
    setDocWarnings([]);
    setStatus('New document');
    setEditorVersion((valueNow) => valueNow + 1);
  };

  const onOpenProject = async (): Promise<void> => {
    const result = await window.docMakerApi.openProject();
    if (!result || !editorRef.current) {
      return;
    }

    editorRef.current.innerHTML = result.html;
    setActiveFilePath(result.filePath);
    setDocWarnings([]);
    setStatus(`Opened ${result.filePath}`);
    setEditorVersion((valueNow) => valueNow + 1);
  };

  const onOpenDocx = async (): Promise<void> => {
    const result = await window.docMakerApi.openDocx();
    if (!result || !editorRef.current) {
      return;
    }
    editorRef.current.innerHTML = result.html;
    setActiveFilePath(null);
    setStatus(`Loaded ${result.filePath}`);
    setDocWarnings(result.warnings);
    setEditorVersion((valueNow) => valueNow + 1);
  };

  const getHtml = (): string => editorRef.current?.innerHTML ?? '';

  const onSaveProjectAs = async (): Promise<void> => {
    const result = await window.docMakerApi.saveProjectAs(getHtml());
    if (result) {
      setActiveFilePath(result.filePath);
      setStatus(`Saved ${result.filePath}`);
    }
  };

  const onSaveProject = async (): Promise<void> => {
    const html = getHtml();

    if (!activeFilePath) {
      await onSaveProjectAs();
      return;
    }

    const result = await window.docMakerApi.saveProject(html, activeFilePath);
    setStatus(`Saved ${result.filePath}`);
  };

  const onSaveDocx = async (): Promise<void> => {
    const result = await window.docMakerApi.saveDocx(getHtml());
    if (result) {
      setStatus(`Exported ${result.filePath}`);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Doc Maker Pro</h1>
        <div className="actions">
          <button onClick={onNewFile}>New</button>
          <button onClick={() => void onOpenProject()}>Open File</button>
          <button onClick={() => void onSaveProject()}>Save</button>
          <button onClick={() => void onSaveProjectAs()}>Save As</button>
          <button onClick={() => void onOpenDocx()}>Open .docx</button>
          <button onClick={() => void onSaveDocx()}>Export .docx</button>
        </div>
      </header>

      <section className="toolbar" aria-label="formatting toolbar">
        {COMMANDS.map(({ label, command, value }) => (
          <button key={label} onClick={() => runCommand(command, value)}>
            {label}
          </button>
        ))}
      </section>

      <main className="editor-wrap">
        <aside className="side-panel">
          <h2>Inspector</h2>
          <p>{status}</p>
          <p>{wordCount} words</p>
          <p className="path">{activeFilePath ? activeFilePath : 'Unsaved document'}</p>
          <h3>DOCX import notes</h3>
          {docWarnings.length ? (
            <ul>
              {docWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p>No warnings.</p>
          )}
        </aside>

        <article
          className="editor"
          contentEditable
          suppressContentEditableWarning
          ref={editorRef}
          onInput={() => {
            setStatus('Edited');
            setEditorVersion((valueNow) => valueNow + 1);
          }}
        />
      </main>
    </div>
  );
};
