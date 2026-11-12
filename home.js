// トップページの小さな動き（メニュー・予約人数・添付ファイルの名前）。
(function () {
  'use strict';

  // 予約人数: 初期値の正本は受け口（Apps Script の BOOKED_BASE）。ここ（<body data-booked="3">）の数字は、受け口の数が取れなかった時の予備
  // 予備の数が無い・数字でない・0 以下の時は、予約人数の行ごと出さない（「現在 0名」と出さない）。行を新しく出すこともしない
  var booked = document.body.getAttribute('data-booked');
  var bookedOk = /^\d+$/.test(booked || '') && parseInt(booked, 10) >= 1;
  var setBooked = function (text) {
    document.querySelectorAll('[data-booked]').forEach(function (el) { if (el.tagName !== 'BODY') el.textContent = text; });
  };
  if (bookedOk) setBooked(booked);
  if (!bookedOk) document.querySelectorAll('.booked').forEach(function (el) { el.hidden = true; });

  // 受け口（フォームの data-endpoint と同じ所）の ?count=1 の数をそのまま使う（1 以上の整数の時）。0 が返ったら行を出さない。
  // 取れない・8秒で返らない・形が違う（0 以外で 1 以上の整数でない）時だけ、予備の数のまま。受け口は 2〜5 秒かかることがある（実測）
  var form = document.getElementById('contact-form');
  var endpoint = form && form.getAttribute('data-endpoint');
  if (bookedOk && endpoint && window.fetch) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    fetch(endpoint + (endpoint.indexOf('?') < 0 ? '?' : '&') + 'count=1', { method: 'GET', credentials: 'omit', cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        clearTimeout(timer);
        var n = j && typeof j === 'object' ? j.booked : null;
        if (typeof n !== 'number' || !isFinite(n) || Math.floor(n) !== n) return;
        if (n === 0) { document.querySelectorAll('.booked').forEach(function (el) { el.hidden = true; }); return; }
        if (n >= 1 && n <= 100000) setBooked(String(n));
      })
      .catch(function () { clearTimeout(timer); });
  }

  // スマホ・タブレットのメニュー（ボタンで開閉。Esc で閉じる。リンクを押す・外を押すと閉じる）
  var hdr = document.getElementById('hdr');
  var btn = hdr && hdr.querySelector('.burger');
  var nav = document.getElementById('gnav');
  if (hdr && btn && nav) {
    var setOpen = function (open, focusFirst) {
      hdr.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      if (open && focusFirst) { var a = nav.querySelector('a'); if (a) a.focus(); }
    };
    btn.addEventListener('click', function () { setOpen(!hdr.classList.contains('is-open'), true); });
    nav.addEventListener('click', function (ev) { if (ev.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && hdr.classList.contains('is-open')) { setOpen(false); btn.focus(); }
    });
    document.addEventListener('click', function (ev) {
      if (hdr.classList.contains('is-open') && !hdr.contains(ev.target)) setOpen(false);
    });
    var wide = window.matchMedia('(min-width: 900px)');
    var onWide = function (ev) { if (ev.matches) setOpen(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
  }

  // 添付欄: 選んだファイルの名前を「ファイルを選択」の所に出す（外した時は元の文字に戻す）
  document.querySelectorAll('label.file').forEach(function (label) {
    var input = label.querySelector('input[type=file]');
    var text = label.querySelector('.file-text');
    if (!input || !text) return;
    var empty = text.textContent;
    input.addEventListener('change', function () {
      text.textContent = input.files.length ? Array.prototype.map.call(input.files, function (f) { return f.name; }).join('、') : empty;
    });
  });
})();
