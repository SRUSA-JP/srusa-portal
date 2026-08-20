import type { ReactNode } from 'react';

export interface NoteProps {
  children: ReactNode;
  /** 読み方の注意は muted、失敗の知らせは error。 */
  tone?: 'muted' | 'error';
}

/** 本文に添える短い文。注記と、エラーの知らせに使う。 */
export function Note({ children, tone = 'muted' }: NoteProps) {
  return <p className={tone === 'error' ? 'error' : 'note'}>{children}</p>;
}
