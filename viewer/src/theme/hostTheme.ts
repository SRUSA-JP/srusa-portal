/**
 * 埋め込み先（ホストページ）のテーマを読み取る規則。
 *
 * このアプリは MkDocs のページに iframe で埋め込まれる。ホスト側で
 * ナイトモードに切り替えたら中身も追随させたいので、ホストが DOM に
 * 立てる属性を見る。対応する属性はここだけで管理する。
 */
import type { ThemeMode } from './palette';

export interface HostThemeSource {
  /** 監視する属性名。 */
  attribute: string;
  /** 属性値 → テーマの対応。 */
  values: Record<string, ThemeMode>;
}

/**
 * 上から順に見て、最初に一致したものを採用する。
 *
 * - `data-md-color-scheme`: Material for MkDocs の配色（slate = 夜）
 * - `data-theme`: 自前で立てる場合の属性
 */
export const HOST_THEME_SOURCES: HostThemeSource[] = [
  { attribute: 'data-md-color-scheme', values: { slate: 'dark', default: 'light' } },
  { attribute: 'data-theme', values: { dark: 'dark', light: 'light' } },
];

/** 監視対象の属性名の一覧。 */
export const HOST_THEME_ATTRIBUTES = HOST_THEME_SOURCES.map((source) => source.attribute);

/** 要素に立った属性からテーマを読み取る。判定できなければ null。 */
export function themeFromElement(element: Element | null): ThemeMode | null {
  if (!element) return null;
  for (const source of HOST_THEME_SOURCES) {
    const value = element.getAttribute(source.attribute);
    if (value && source.values[value]) return source.values[value];
  }
  return null;
}

/**
 * 埋め込み先のテーマ。
 *
 * 同一オリジンのときだけ親文書を読む。別オリジンや単独で開いた場合は
 * 例外を握りつぶして null を返し、呼び出し側が OS 設定へ落とす。
 */
export function hostTheme(): ThemeMode | null {
  if (typeof document === 'undefined') return null;

  const own = themeFromElement(document.documentElement) ?? themeFromElement(document.body);
  if (own) return own;

  try {
    const parent = window.parent;
    if (!parent || parent === window) return null;
    const parentDocument = parent.document;
    return themeFromElement(parentDocument.documentElement) ?? themeFromElement(parentDocument.body);
  } catch {
    return null;
  }
}

/** 埋め込み先の変化を監視する。戻り値を呼ぶと監視を止める。 */
export function observeHostTheme(onChange: () => void): () => void {
  const observers: MutationObserver[] = [];
  const observe = (target: Document | null) => {
    if (!target) return;
    for (const element of [target.documentElement, target.body]) {
      if (!element) continue;
      const observer = new MutationObserver(onChange);
      observer.observe(element, { attributes: true, attributeFilter: HOST_THEME_ATTRIBUTES });
      observers.push(observer);
    }
  };

  observe(document);
  try {
    const parent = window.parent;
    if (parent && parent !== window) observe(parent.document);
  } catch {
    /* 別オリジンの埋め込み先は監視できない。OS 設定への追随だけ残る */
  }

  return () => observers.forEach((observer) => observer.disconnect());
}
