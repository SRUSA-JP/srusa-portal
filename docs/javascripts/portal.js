/**
 * 埋め込んだアプリに合わせて、ページ側を整える。
 *
 * 1. アプリ（viewer/src/embed/index.ts）が postMessage で知らせてくる高さに
 *    iframe を合わせ、記事の途中にスクロール枠ができないようにする。
 *    メッセージの形式は上記ファイルが定義しているので、変えるときは両方をそろえる。
 * 2. 埋め込み URL の `?skin=` をページ側にも写し、ヘッダーや本文の見た目を
 *    アプリとそろえる（対応する指定は docs/stylesheets/portal.css）。
 */
(() => {
  /**
   * 埋め込み URL の `?skin=` をページ全体へ広げる。
   * 指定は Markdown の 1 か所（iframe の src）だけで済ませる。
   */
  const applyPageSkin = () => {
    const frame = document.querySelector('.app-embed iframe');
    if (!frame) return;

    const source = new URL(frame.getAttribute('src'), window.location.href);
    const skin = source.searchParams.get('skin');
    if (skin) document.body.setAttribute('data-portal-skin', skin);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPageSkin);
  } else {
    applyPageSkin();
  }

  const HEIGHT_MESSAGE_TYPE = 'srusa-portal:height';
  const HEIGHT_APPLIED_MESSAGE_TYPE = 'srusa-portal:height-applied';

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;

    const message = event.data;
    if (!message || message.type !== HEIGHT_MESSAGE_TYPE) return;
    if (typeof message.height !== 'number' || message.height <= 0) return;

    const height = message.height + 'px';
    const frames = document.querySelectorAll('.app-embed iframe');
    for (const frame of frames) {
      if (frame.contentWindow !== event.source) continue;
      /* 同じ値を入れ直すと再計算を呼ぶだけなので触らない */
      if (frame.style.height !== height) frame.style.height = height;
      /* 高さはこちらで面倒を見る、とアプリに伝える（アプリはスクロールをやめる） */
      event.source.postMessage({ type: HEIGHT_APPLIED_MESSAGE_TYPE }, event.origin);
    }
  });
})();
