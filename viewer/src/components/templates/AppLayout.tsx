import type { ReactNode } from 'react';
import { Note } from '../atoms';

export interface AppLayoutProps {
  /** 画面の名前。記事に埋め込んだときはページ側に見出しがあるので出さない。 */
  title: string;
  /** 見出しの下に出す出典や規模の説明。 */
  note?: string;
  /** 見出しの右に置く操作（データの読み込み・書き出しなど）。 */
  actions?: ReactNode;
  /** 本文の前に出す知らせ（読み込みの失敗など）。 */
  messages?: ReactNode;
  children: ReactNode;
  /** 画面の末尾に出す出典。 */
  footer?: ReactNode;
}

/**
 * 画面の骨格。
 *
 * 見出し・知らせ・本文・出典の並び方だけを決める。何を出すかは
 * ページ（pages/）が決め、この層は中身を知らない。
 */
export function AppLayout({ title, note, actions, messages, children, footer }: AppLayoutProps) {
  return (
    <div className="app">
      <header className="app-head">
        <div>
          <h1 className="app-title">{title}</h1>
          {note && <Note>{note}</Note>}
        </div>
        {actions && <div className="app-actions">{actions}</div>}
      </header>

      {messages}

      <main>{children}</main>

      {footer && <footer className="app-foot">{footer}</footer>}
    </div>
  );
}
