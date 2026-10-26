/* Mock exam engine: runs a test defined in window.MOCK_EXAM (see tools/mock-exams/build_mock_exams.py).
   Exam mode: answer everything, then grade. Practice mode: check each answer as you go. */
(function () {
  'use strict';

  var T = window.MOCK_EXAM;
  var app = document.getElementById('app');
  var KEY = 'ai103-mock-' + T.id;
  var BEST_KEY = KEY + '-best';
  var DOMAIN = {};
  T.domains.forEach(function (d) { DOMAIN[d.id] = d; });
  var N = T.questions.length;

  var S = null;          // current attempt
  var timerHandle = null;
  var reviewFilter = 'all';

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  // tiny markdown: ``` blocks, `code`, **bold**, paragraphs
  function fmt(s) {
    var parts = String(s).split('```');
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        var code = parts[i].replace(/^[a-zA-Z0-9_+-]*\n/, '').replace(/\n$/, '');
        out += '<pre><code>' + esc(code) + '</code></pre>';
      } else {
        var t = esc(parts[i]).trim();
        if (!t) continue;
        t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
             .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
             .replace(/\n\n/g, '</p><p>')
             .replace(/\n/g, '<br>');
        out += '<p>' + t + '</p>';
      }
    }
    return out;
  }
  function h(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] == null) return;
      if (k === 'class') e.className = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    if (html != null) e.innerHTML = html;
    return e;
  }
  // When the test runs inside the docs page iframe, bring the frame itself into view
  function showFrame() {
    try { if (window.frameElement) window.frameElement.scrollIntoView({ block: 'start' }); } catch (e) { /* cross-origin */ }
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clock(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    var hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return (hh ? hh + ':' : '') + pad(mm) + ':' + pad(ss);
  }
  function load(key) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function store(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* storage may be blocked */ }
  }
  function drop(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }
  function save() { store(KEY, S); }

  function correctSet(q) {
    var r = [];
    q.o.forEach(function (o, i) { if (o.c) r.push(i); });
    return r;
  }
  function isCorrect(i) {
    var sel = (S.answers[i] || []).slice().sort();
    var cor = correctSet(T.questions[i]);
    if (sel.length !== cor.length) return false;
    for (var k = 0; k < sel.length; k++) if (sel[k] !== cor[k]) return false;
    return true;
  }
  function answered(i) { return (S.answers[i] || []).length > 0; }
  function countAnswered() {
    var c = 0;
    for (var i = 0; i < N; i++) if (answered(i)) c++;
    return c;
  }
  function letter(i) { return String.fromCharCode(65 + i); }

  /* ---------- start screen ---------- */
  function showStart() {
    stopTimer();
    var saved = load(KEY);
    var best = load(BEST_KEY);
    app.innerHTML = '';
    var wrap = h('div', { class: 'wrap' });

    var intro = h('div', { class: 'card' });
    intro.appendChild(h('h1', null, esc(T.title)));
    intro.appendChild(h('p', { class: 'muted' }, esc(T.description)));
    wrap.appendChild(intro);

    var rows = T.domains.map(function (d) {
      return '<tr><td>' + esc(d.name) + '</td><td class="num">' + esc(d.weight) +
        '</td><td class="num">' + d.count + '</td></tr>';
    }).join('');
    var blueprint = h('div', { class: 'card' });
    blueprint.innerHTML = '<h2>Blueprint</h2><table><thead><tr><th>Exam domain</th><th class="num">Official weight</th>' +
      '<th class="num">Questions</th></tr></thead><tbody>' + rows +
      '<tr><td><strong>Total</strong></td><td class="num"></td><td class="num"><strong>' + N + '</strong></td></tr></tbody></table>' +
      '<p class="small muted">Question types: single answer and "select N" (multiple answers). A multiple-answer question counts as correct only if you select exactly the right set.</p>';
    wrap.appendChild(blueprint);

    var cfg = h('div', { class: 'card' });
    cfg.innerHTML = '<h2>Settings</h2><div class="opts">' +
      '<div class="opt-box"><strong>Mode</strong>' +
      '<label><input type="radio" name="mode" value="exam" checked> Exam mode: answer all questions, then press <em>Grade my test</em></label>' +
      '<label><input type="radio" name="mode" value="practice"> Practice mode: check each answer as you go</label></div>' +
      '<div class="opt-box"><strong>Timer</strong>' +
      '<label><input type="radio" name="time" value="' + T.defaultMinutes + '" checked> ' + T.defaultMinutes + ' minutes (exam length)</label>' +
      '<label><input type="radio" name="time" value="90"> 90 minutes</label>' +
      '<label><input type="radio" name="time" value="60"> 60 minutes</label>' +
      '<label><input type="radio" name="time" value="0"> No timer</label></div></div>' +
      '<div class="notice">When the timer reaches zero the test is graded automatically with the answers you have given so far.</div>';
    var go = h('button', { class: 'primary', onclick: startNew }, 'Start test');
    var row = h('div', { class: 'row' });
    row.appendChild(go);
    if (saved && !saved.done) {
      row.appendChild(h('button', { onclick: function () { S = saved; resumeAttempt(); } },
        'Resume saved attempt (' + Object.keys(saved.answers).length + ' answered)'));
    }
    if (saved && saved.done) {
      row.appendChild(h('button', { onclick: function () { S = saved; showResults(); } }, 'View last results'));
    }
    cfg.appendChild(row);
    if (best) {
      cfg.appendChild(h('p', { class: 'small muted' }, 'Best score on this device: ' + best.score + ' / ' + best.total +
        ' (' + Math.round(100 * best.score / best.total) + '%).'));
    }
    wrap.appendChild(cfg);
    app.appendChild(wrap);
  }

  function startNew() {
    var mode = document.querySelector('input[name="mode"]:checked').value;
    var minutes = parseInt(document.querySelector('input[name="time"]:checked').value, 10);
    var now = Date.now();
    S = {
      mode: mode, minutes: minutes, start: now,
      deadline: minutes > 0 ? now + minutes * 60000 : null,
      answers: {}, flags: {}, checked: {}, cur: 0, done: false, end: null
    };
    save();
    showExam();
  }
  function resumeAttempt() {
    if (S.deadline && Date.now() >= S.deadline) { submit(true); return; }
    showExam();
  }

  /* ---------- exam screen ---------- */
  function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }
  function startTimer() {
    stopTimer();
    tick();
    timerHandle = setInterval(tick, 1000);
  }
  function tick() {
    var el = document.getElementById('timer');
    if (!el || !S) return;
    if (!S.deadline) { el.textContent = clock(Date.now() - S.start) + ' elapsed'; return; }
    var left = S.deadline - Date.now();
    if (left <= 0) { submit(true); return; }
    el.textContent = clock(left) + ' left';
    el.className = 'timer' + (left <= 300000 ? ' crit' : left <= 600000 ? ' warn' : '');
  }

  function showExam() {
    app.innerHTML = '';
    var bar = h('div', { class: 'bar' });
    var inner = h('div', { class: 'inner' });
    inner.appendChild(h('span', { class: 'title' }, esc(T.shortTitle || T.title)));
    inner.appendChild(h('span', { class: 'spacer' }));
    inner.appendChild(h('span', { id: 'progress', class: 'muted small' }, ''));
    inner.appendChild(h('span', { id: 'timer', class: 'timer' }, ''));
    inner.appendChild(h('button', { class: 'primary', onclick: confirmSubmit }, 'Grade my test'));
    bar.appendChild(inner);
    app.appendChild(bar);

    var wrap = h('div', { class: 'wrap' });
    var layout = h('div', { class: 'layout' });
    layout.appendChild(h('div', { id: 'qarea' }));
    var side = h('div', { class: 'card' });
    side.innerHTML = '<h2>Questions</h2><div class="palette" id="palette"></div>' +
      '<div class="legend"><span>Blue = answered</span><span>Dot = flagged</span><span>Outline = current</span></div>';
    layout.appendChild(side);
    wrap.appendChild(layout);
    app.appendChild(wrap);

    renderQuestion();
    startTimer();
  }

  function renderPalette() {
    var p = document.getElementById('palette');
    if (!p) return;
    p.innerHTML = '';
    for (var i = 0; i < N; i++) {
      (function (i) {
        var cls = [];
        if (answered(i)) cls.push('answered');
        if (S.flags[i]) cls.push('flag');
        if (i === S.cur) cls.push('cur');
        p.appendChild(h('button', { class: cls.join(' '), title: 'Question ' + (i + 1), onclick: function () { go(i); } }, String(i + 1)));
      })(i);
    }
    var pr = document.getElementById('progress');
    if (pr) pr.textContent = countAnswered() + ' / ' + N + ' answered';
  }

  function go(i) {
    S.cur = Math.max(0, Math.min(N - 1, i));
    save();
    renderQuestion();
    window.scrollTo(0, 0);
    showFrame();
  }

  function renderQuestion() {
    var i = S.cur;
    var q = T.questions[i];
    var area = document.getElementById('qarea');
    area.innerHTML = '';
    var card = h('div', { class: 'card' });
    var need = correctSet(q).length;
    var multi = need > 1;
    var locked = S.mode === 'practice' && S.checked[i];

    card.appendChild(h('div', null,
      '<span class="badge">Question ' + (i + 1) + ' of ' + N + '</span>' +
      '<span class="badge">' + esc(DOMAIN[q.d].name) + '</span>' +
      (multi ? '<span class="badge">Select ' + need + '</span>' : '')));
    card.appendChild(h('div', { class: 'qtext' }, fmt(q.q)));
    if (multi) card.appendChild(h('p', { class: 'small muted' }, 'Select ' + need + ' answers.'));

    var sel = S.answers[i] || [];
    q.o.forEach(function (o, k) {
      var on = sel.indexOf(k) >= 0;
      var cls = 'choice' + (on ? ' sel' : '') + (locked ? ' locked' : '');
      var why = '';
      if (locked) {
        if (o.c) cls += ' right'; else if (on) cls += ' wrong';
        why = '<div class="why"><span class="tag ' + (o.c ? 'ok' : 'bad') + '">' + (o.c ? 'Correct' : 'Incorrect') + '</span> ' +
          fmt(o.e) + '</div>';
      }
      var lab = h('label', { class: cls });
      var inp = h('input', { type: multi ? 'checkbox' : 'radio', name: 'q' + i });
      inp.checked = on;
      if (locked) inp.disabled = true;
      inp.addEventListener('change', function () { choose(k, inp.checked); });
      lab.appendChild(inp);
      lab.appendChild(h('div', { class: 'ct' }, '<p><strong>' + letter(k) + '.</strong> ' +
        esc(o.t).replace(/`([^`]+)`/g, '<code>$1</code>') + '</p>' + why));
      card.appendChild(lab);
    });

    if (locked) {
      var ok = isCorrect(i);
      card.appendChild(h('p', { class: ok ? 'verdict-ok' : 'verdict-bad' },
        ok ? 'Your answer is correct.' : 'Your answer is not correct.'));
      card.appendChild(sourcesBlock(q));
    }

    var nav = h('div', { class: 'nav' });
    nav.appendChild(h('button', { onclick: function () { go(i - 1); }, disabled: i === 0 ? 'disabled' : null }, 'Previous'));
    nav.appendChild(h('button', { onclick: function () { go(i + 1); }, disabled: i === N - 1 ? 'disabled' : null }, 'Next'));
    nav.appendChild(h('button', { class: S.flags[i] ? 'flagged' : '', onclick: function () {
      if (S.flags[i]) delete S.flags[i]; else S.flags[i] = true;
      save(); renderQuestion();
    } }, S.flags[i] ? 'Flagged for review' : 'Flag for review'));
    if (S.mode === 'practice' && !locked) {
      nav.appendChild(h('button', { class: 'primary', disabled: answered(i) ? null : 'disabled', onclick: function () {
        S.checked[i] = true; save(); renderQuestion();
      } }, 'Check answer'));
    }
    card.appendChild(nav);
    area.appendChild(card);
    renderPalette();
  }

  function choose(k, on) {
    var i = S.cur;
    var q = T.questions[i];
    var multi = correctSet(q).length > 1;
    var sel = (S.answers[i] || []).slice();
    if (multi) {
      var at = sel.indexOf(k);
      if (on && at < 0) sel.push(k);
      if (!on && at >= 0) sel.splice(at, 1);
    } else {
      sel = [k];
    }
    if (sel.length) S.answers[i] = sel; else delete S.answers[i];
    save();
    renderQuestion();
  }

  /* ---------- submit ---------- */
  function confirmSubmit() {
    var unanswered = [], flagged = [];
    for (var i = 0; i < N; i++) {
      if (!answered(i)) unanswered.push(i);
      if (S.flags[i]) flagged.push(i);
    }
    var ov = h('div', { class: 'overlay' });
    var m = h('div', { class: 'modal' });
    m.appendChild(h('h2', null, 'Grade the test?'));
    m.appendChild(h('p', null, 'You answered <strong>' + (N - unanswered.length) + '</strong> of ' + N + ' questions. After grading you cannot change answers.'));
    function links(label, list) {
      if (!list.length) return;
      var box = h('div', { class: 'linklist' }, '<p class="small muted">' + label + ' (' + list.length + '): tap to go there</p>');
      list.forEach(function (idx) {
        box.appendChild(h('button', { onclick: function () { document.body.removeChild(ov); go(idx); } }, String(idx + 1)));
      });
      m.appendChild(box);
    }
    links('Unanswered', unanswered);
    links('Flagged', flagged);
    var row = h('div', { class: 'row', style: 'margin-top:14px' });
    row.appendChild(h('button', { onclick: function () { document.body.removeChild(ov); } }, 'Keep working'));
    row.appendChild(h('button', { class: 'primary', onclick: function () { document.body.removeChild(ov); submit(false); } }, 'Grade now'));
    m.appendChild(row);
    ov.appendChild(m);
    document.body.appendChild(ov);
    showFrame();
  }

  function submit(auto) {
    if (S.done) return;
    stopTimer();
    S.done = true;
    S.end = Date.now();
    S.auto = !!auto;
    var score = 0;
    for (var i = 0; i < N; i++) if (isCorrect(i)) score++;
    S.score = score;
    save();
    var best = load(BEST_KEY);
    if (!best || score > best.score) store(BEST_KEY, { score: score, total: N, date: S.end });
    var ov = document.querySelector('.overlay');
    if (ov) ov.parentNode.removeChild(ov);
    reviewFilter = 'all';
    showResults();
    window.scrollTo(0, 0);
    showFrame();
  }

  /* ---------- results ---------- */
  function sourcesBlock(q) {
    var html = '';
    if (q.ref && q.ref.length) {
      html += '<div>Study: ' + q.ref.map(function (r) {
        return '<a href="../deep-dives/' + esc(r) + '/" target="_blank" rel="noopener">' + esc(r.replace(/-/g, ' ')) + '</a>';
      }).join(', ') + '</div>';
    }
    if (q.src && q.src.length) {
      html += '<div>Microsoft Learn: ' + q.src.map(function (u) {
        return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u.replace('https://learn.microsoft.com/en-us/', '')) + '</a>';
      }).join('<br>') + '</div>';
    }
    return h('div', { class: 'srcs muted' }, html);
  }

  function showResults() {
    stopTimer();
    app.innerHTML = '';
    var wrap = h('div', { class: 'wrap' });

    var perDomain = {};
    T.domains.forEach(function (d) { perDomain[d.id] = { ok: 0, total: 0 }; });
    var wrongList = [], unanswered = 0;
    for (var i = 0; i < N; i++) {
      var q = T.questions[i];
      perDomain[q.d].total++;
      if (isCorrect(i)) perDomain[q.d].ok++;
      else if (!answered(i)) { unanswered++; wrongList.push(i); }
      else wrongList.push(i);
    }
    var score = N - wrongList.length;
    var pct = Math.round(100 * score / N);
    var used = (S.end || Date.now()) - S.start;

    var top = h('div', { class: 'card' });
    var verdict = pct >= 80 ? 'Strong. You are in a good range for this practice test.' :
      pct >= 70 ? 'Borderline. Review every explanation, especially the wrong options you picked.' :
      'Below the target. Study the linked lessons for the domains marked red, then retake.';
    top.innerHTML = '<h1>' + esc(T.title) + ': results</h1>' +
      '<div class="score">' + score + ' / ' + N + ' <span class="muted" style="font-size:1.2rem">(' + pct + '%)</span></div>' +
      '<p>' + verdict + '</p>' +
      '<p class="small muted">Time used: ' + clock(used) + (S.auto ? ' (the timer ended and the test was graded automatically)' : '') +
      ' · Unanswered: ' + unanswered + ' · Mode: ' + (S.mode === 'exam' ? 'exam' : 'practice') + '.<br>' +
      'Microsoft reports a scaled score (700 of 1000 to pass). Percent correct is only a rough guide; aim for 80% or more on practice tests.</p>';
    wrap.appendChild(top);

    var dom = h('div', { class: 'card' });
    var drows = T.domains.map(function (d) {
      var r = perDomain[d.id];
      var p = r.total ? Math.round(100 * r.ok / r.total) : 0;
      var cls = p >= 80 ? 'high' : p >= 60 ? 'mid' : 'low';
      return '<tr><td>' + esc(d.name) + '</td><td class="num">' + r.ok + ' / ' + r.total + '</td>' +
        '<td style="width:40%"><div class="bar-bg"><div class="bar-fg ' + cls + '" style="width:' + p + '%"></div></div></td>' +
        '<td class="num">' + p + '%</td></tr>';
    }).join('');
    dom.innerHTML = '<h2>Score by domain</h2><table><thead><tr><th>Domain</th><th class="num">Correct</th><th></th><th class="num">%</th></tr></thead><tbody>' + drows + '</tbody></table>';
    wrap.appendChild(dom);

    var grid = h('div', { class: 'card' });
    grid.appendChild(h('h2', null, 'Question map'));
    var pal = h('div', { class: 'palette' });
    for (var j = 0; j < N; j++) {
      (function (j) {
        var cls = isCorrect(j) ? 'r' : answered(j) ? 'w' : 'u';
        if (S.flags[j]) cls += ' flag';
        pal.appendChild(h('button', { class: cls, onclick: function () {
          var d = document.getElementById('rq' + j);
          if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        } }, String(j + 1)));
      })(j);
    }
    grid.appendChild(pal);
    grid.appendChild(h('div', { class: 'legend' }, '<span>Green = correct</span><span>Red = wrong</span><span>Amber = unanswered</span><span>Dot = flagged</span>'));
    wrap.appendChild(grid);

    var actions = h('div', { class: 'row', style: 'margin-bottom:14px' });
    actions.appendChild(h('button', { class: 'primary', onclick: function () { drop(KEY); showStart(); } }, 'New attempt'));
    actions.appendChild(h('button', { onclick: function () { showStart(); } }, 'Back to start'));
    wrap.appendChild(actions);

    var fcard = h('div', { class: 'card filters' });
    fcard.appendChild(h('h2', null, 'Review answers and explanations'));
    var frow = h('div', { class: 'row' });
    [['all', 'All'], ['wrong', 'Wrong'], ['unanswered', 'Unanswered'], ['flagged', 'Flagged']].forEach(function (f) {
      frow.appendChild(h('button', { class: reviewFilter === f[0] ? 'active' : '', onclick: function () {
        reviewFilter = f[0]; renderReview(); markFilters();
      } }, f[1]));
    });
    fcard.appendChild(frow);
    wrap.appendChild(fcard);
    wrap.appendChild(h('div', { id: 'review' }));
    app.appendChild(wrap);
    renderReview();

    function markFilters() {
      var bs = frow.querySelectorAll('button');
      var keys = ['all', 'wrong', 'unanswered', 'flagged'];
      for (var b = 0; b < bs.length; b++) bs[b].className = keys[b] === reviewFilter ? 'active' : '';
    }
  }

  function renderReview() {
    var box = document.getElementById('review');
    box.innerHTML = '';
    var shown = 0;
    for (var i = 0; i < N; i++) {
      var ok = isCorrect(i), ans = answered(i);
      if (reviewFilter === 'wrong' && (ok || !ans)) continue;
      if (reviewFilter === 'unanswered' && ans) continue;
      if (reviewFilter === 'flagged' && !S.flags[i]) continue;
      shown++;
      box.appendChild(reviewItem(i, ok, ans));
    }
    if (!shown) box.appendChild(h('div', { class: 'card muted' }, 'Nothing to show for this filter.'));
  }

  function reviewItem(i, ok, ans) {
    var q = T.questions[i];
    var sel = S.answers[i] || [];
    var d = h('details', { class: 'rq', id: 'rq' + i });
    if (!ok) d.open = true;
    var verdict = ok ? '<span class="verdict-ok">Correct</span>' : ans ? '<span class="verdict-bad">Wrong</span>' : '<span class="verdict-un">Unanswered</span>';
    d.appendChild(h('summary', null,
      '<strong>Q' + (i + 1) + '</strong> ' + verdict +
      ' <span class="badge">' + esc(DOMAIN[q.d].name) + '</span>' + (S.flags[i] ? '<span class="badge">flagged</span>' : '')));
    var body = h('div', { class: 'rbody' });
    body.appendChild(h('div', { class: 'qtext' }, fmt(q.q)));
    q.o.forEach(function (o, k) {
      var picked = sel.indexOf(k) >= 0;
      var cls = 'choice locked';
      if (o.c) cls += ' right'; else if (picked) cls += ' wrong';
      var marks = [];
      if (picked) marks.push('your answer');
      var tag = '<span class="tag ' + (o.c ? 'ok' : 'bad') + '">' + (o.c ? 'Correct' : 'Incorrect') + '</span>' +
        (marks.length ? ' <span class="small muted">(' + marks.join(', ') + ')</span>' : '');
      var row = h('div', { class: cls });
      row.appendChild(h('div', { class: 'ct' }, '<p><strong>' + letter(k) + '.</strong> ' +
        esc(o.t).replace(/`([^`]+)`/g, '<code>$1</code>') + '</p>' +
        '<div class="why">' + tag + ' ' + fmt(o.e) + '</div>'));
      body.appendChild(row);
    });
    body.appendChild(sourcesBlock(q));
    d.appendChild(body);
    return d;
  }

  /* ---------- boot ---------- */
  showStart();
})();
