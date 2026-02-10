import { useMemo, useRef, useState } from 'react';

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

export const App = (): JSX.Element => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Ready');
  const [docWarnings, setDocWarnings] = useState<string[]>([]);

  const wordCount = useMemo(() => {
    const text = editorRef.current?.innerText ?? '';
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [status]);

  const runCommand = (command: string, value?: string): void => {
    document.execCommand(command, false, value);
    setStatus('Edited');
  };

  const onOpenDocx = async (): Promise<void> => {
    const result = await window.docMakerApi.openDocx();
    if (!result || !editorRef.current) {
      return;
    }
    editorRef.current.innerHTML = result.html;
    setStatus(`Loaded ${result.filePath}`);
    setDocWarnings(result.warnings);
  };

  const onSaveDocx = async (): Promise<void> => {
    const html = editorRef.current?.innerHTML ?? '';
    const result = await window.docMakerApi.saveDocx(html);
    if (result) {
      setStatus(`Saved ${result.filePath}`);
    }
  };

  const onSaveProject = async (): Promise<void> => {
    const html = editorRef.current?.innerHTML ?? '';
    const result = await window.docMakerApi.saveNative(html);
    if (result) {
      setStatus(`Project saved ${result.filePath}`);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Doc Maker Pro</h1>
        <div className="actions">
          <button onClick={onOpenDocx}>Open .docx</button>
          <button onClick={onSaveDocx}>Export .docx</button>
          <button onClick={onSaveProject}>Save project</button>
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
          onInput={() => setStatus('Edited')}
        >
          <h1>Start writing</h1>
          <p>
            Build rich documents in a dark interface, then export to .docx. This starter build ships with
            extensible editor commands and native file dialogs.
          </p>
        </article>
      </main>
    </div>
  );
};
