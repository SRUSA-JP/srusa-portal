import type { ReactNode } from 'react';
import { Note } from '../atoms';

export interface SectionHeaderProps {
  title: string;
  /** 読み方や注意点。 */
  note?: string;
  /** 見出しの右に置く操作（プルダウン・ボタン）。 */
  actions?: ReactNode;
}

/** 記事の節の見出し。見出し・注記・操作の並べ方をここだけで決める。 */
export function SectionHeader({ title, note, actions }: SectionHeaderProps) {
  return (
    <header className="card-head">
      <div>
        <h2>{title}</h2>
        {note && <Note>{note}</Note>}
      </div>
      {actions && <div className="card-actions">{actions}</div>}
    </header>
  );
}
