/**
 * 記事ページへの埋め込み。
 *
 * このアプリは MkDocs の記事に iframe で埋め込まれる。埋め込まれたときは
 * 「独立した画面」ではなく「記事の続き」として見せたいので、次の 3 つを行う。
 *
 * 1. `<html data-embedded="true">` を立てる（CSS が枠と余白を落とす）
 * 2. 中身の高さを埋め込み先へ知らせる（iframe に内部スクロールを作らない）
 * 3. 埋め込み先の書体と地の色を借りる（記事の本文と地続きに見せる）
 *
 * 受け手は docs/javascripts/portal.js。メッセージの形式はこのファイルが
 * 唯一の定義なので、変えるときは両方をそろえる。
 */

import { activeSkin, DEFAULT_SKIN } from '../config/skins';
import { parseCssColor } from '../theme/palette';

/** 高さを知らせるメッセージの種別。 */
export const HEIGHT_MESSAGE_TYPE = 'srusa-portal:height';

/** 埋め込み先が高さを反映したという返事。 */
export const HEIGHT_APPLIED_MESSAGE_TYPE = 'srusa-portal:height-applied';

export interface HeightMessage {
  type: typeof HEIGHT_MESSAGE_TYPE;
  /** 中身の高さ（px）。 */
  height: number;
}

/** 埋め込み先の中で動いているか。単独で開いたときは false。 */
export function isEmbedded(): boolean {
  try {
    return typeof window !== 'undefined' && window.parent !== window;
  } catch {
    /* 別オリジンで親を参照できない場合も、埋め込まれてはいる */
    return true;
  }
}

/**
 * 埋め込み先の地の色。
 *
 * グラフは「背景と同じ色」で積み上げの隙間や点の縁取りを描くので、
 * 自分の配色ではなく埋め込み先の色を使わないと、その部分だけ色が浮く。
 * 同一オリジンのときだけ読める。読めなければ null（既定の配色を使う）。
 */
export function hostBackgroundColor(): string | null {
  if (!isEmbedded()) return null;
  try {
    const hostBody = window.parent.document.body;
    if (!hostBody) return null;
    return parseCssColor(window.parent.getComputedStyle(hostBody).backgroundColor);
  } catch {
    return null;
  }
}

/**
 * 高さを知らせ直す最小の差（px）。
 *
 * 1px 単位の揺れで往復すると、埋め込み先で枠の高さが細かく変わり続ける。
 */
const HEIGHT_STEP = 2;

/**
 * 中身の高さを埋め込み先へ知らせ続ける。
 *
 * 測る → 送る → 枠の高さが変わる → また測る、と連なるので、
 * 1 フレームに 1 回だけ送る。差が小さいときは送らない。
 */
function reportHeight(content: HTMLElement): void {
  let last = 0;
  let queued = 0;

  const send = () => {
    queued = 0;
    /* 文書ではなく中身を測る。文書の高さは iframe の高さ以上になり、
       一度伸びると縮まなくなるため */
    const height = Math.ceil(content.getBoundingClientRect().height);
    if (height === 0 || Math.abs(height - last) < HEIGHT_STEP) return;
    last = height;
    const message: HeightMessage = { type: HEIGHT_MESSAGE_TYPE, height };
    try {
      window.parent.postMessage(message, window.location.origin);
    } catch {
      /* 別オリジン、または file:// で開いた場合。高さは埋め込み先の既定値のまま */
    }
  };

  const schedule = () => {
    if (queued) return;
    queued = requestAnimationFrame(send);
  };

  new ResizeObserver(schedule).observe(content);
  window.addEventListener('load', schedule);
  send();
}

/**
 * 埋め込み先が高さを反映したら、この中のスクロールを止める。
 *
 * 返事が来るまでは自前でスクロールできるようにしておく。埋め込み先が
 * 高さを合わせてくれない場合に、中身が途中で切れてしまうのを防ぐため。
 */
function stopScrollingWhenManaged(): void {
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    if ((event.data as { type?: string } | null)?.type !== HEIGHT_APPLIED_MESSAGE_TYPE) return;
    document.documentElement.dataset.heightManaged = 'true';
  });
}

/**
 * 埋め込み先の本文の書体を借りる。
 *
 * 記事の本文と地続きに見せるため。ただし、そのページのスキンが自前の
 * 書体を持つ場合（ドット絵風など）は、その書体を優先して借りない。
 *
 * 同一オリジンのときだけ読める。読めなければアプリ既定の書体のまま。
 * トークンは documentElement に流し込まれるので、上書きは body に置く。
 */
function adoptHostFont(): void {
  if (activeSkin().font.family !== DEFAULT_SKIN.font.family) return;
  try {
    const hostBody = window.parent.document.body;
    if (!hostBody) return;
    const family = window.parent.getComputedStyle(hostBody).fontFamily;
    if (family) document.body.style.setProperty('--font-family', family);
  } catch {
    /* 別オリジンの埋め込み先からは読めない */
  }
}

/** 埋め込み向けの初期化。単独で開いたときは何もしない。 */
export function setupEmbed(content: HTMLElement): void {
  if (!isEmbedded()) return;
  document.documentElement.dataset.embedded = 'true';
  adoptHostFont();
  stopScrollingWhenManaged();
  reportHeight(content);
}
