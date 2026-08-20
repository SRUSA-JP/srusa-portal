/**
 * 埋め込んだアプリの高さを、その中身に合わせる。
 *
 * アプリ（viewer/src/embed/index.ts）が自分の高さを postMessage で知らせてくる。
 * それを受けて iframe の高さを変えることで、記事の途中にスクロール枠が
 * できるのを防ぐ。メッセージの形式は上記ファイルが定義しているので、
 * 変えるときは両方をそろえる。
 */
(function () {
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
