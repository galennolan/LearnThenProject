import { useState } from 'react';
import { Tldraw, type Editor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import type { SketchSnapshot } from '../types';
import { Button } from './ui';

interface Props {
  initial?: SketchSnapshot | null;
  saving: boolean;
  onSave: (snapshot: SketchSnapshot) => void;
}

/** Papan coretan tldraw. Snapshot dibaca/disimpan oleh parent. */
export default function SketchEditor({ initial, saving, onSave }: Props) {
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <div className="space-y-3">
      <div className="h-[420px] overflow-hidden rounded-lg border border-slate-300">
        <Tldraw snapshot={initial ?? undefined} onMount={setEditor} />
      </div>
      <Button
        disabled={!editor || saving}
        onClick={() => {
          if (editor) onSave(editor.store.serialize() as unknown as SketchSnapshot);
        }}
        className="w-full"
      >
        {saving ? 'Menyimpan...' : 'Simpan coretan'}
      </Button>
    </div>
  );
}
