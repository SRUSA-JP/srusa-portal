/**
 * 埋め込んだアプリに合わせて、ページ側を整える。
 *
 * 1. アプリ（viewer/src/embed/index.ts）が postMessage で知らせてくる高さに
 *    iframe を合わせ、記事の途中にスクロール枠ができないようにする。
 *    メッセージの形式は上記ファイルが定義しているので、変えるときは両方をそろえる。
 * 2. 埋め込み URL の `?skin=` をページ側にも写し、ヘッダーや本文の見た目を
 *    アプリとそろえる（対応する指定は docs/stylesheets/portal.css）。
 */
(function () {
  /**
   * 埋め込み URL の `?skin=` をページ全体へ広げる。
   * 指定は Markdown の 1 か所（iframe の src）だけで済ませる。
   */
  function applyPageSkin() {
    var frame = document.querySelector('.app-embed iframe');
    if (!frame) return;

    var source = new URL(frame.getAttribute('src'), window.location.href);
    var skin = source.searchParams.get('skin');
    if (skin) document.body.setAttribute('data-portal-skin', skin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPageSkin);
  } else {
    applyPageSkin();
  }

  var HEIGHT_MESSAGE_TYPE = 'srusa-portal:height';
  var HEIGHT_APPLIED_MESSAGE_TYPE = 'srusa-portal:height-applied';

  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin) return;

    var message = event.data;
    if (!message || message.type !== HEIGHT_MESSAGE_TYPE) return;
    if (typeof message.height !== 'number' || message.height <= 0) return;

    var height = message.height + 'px';
    var frames = document.querySelectorAll('.app-embed iframe');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow !== event.source) continue;
      /* 同じ値を入れ直すと再計算を呼ぶだけなので触らない */
      if (frames[i].style.height !== height) frames[i].style.height = height;
      /* 高さはこちらで面倒を見る、とアプリに伝える（アプリはスクロールをやめる） */
      event.source.postMessage({ type: HEIGHT_APPLIED_MESSAGE_TYPE }, event.origin);
    }
  });
})();
