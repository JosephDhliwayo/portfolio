(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // Slide headings in word by word.
  document.querySelectorAll('[data-split]').forEach(function (h) {
    h.innerHTML = h.textContent.trim().split(/\s+/).map(function (w, i) {
      return '<span class="w"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
  });

  // Chip stagger index, per group.
  document.querySelectorAll('.chips').forEach(function (g) {
    g.querySelectorAll('.chip').forEach(function (c, i) { c.style.setProperty('--c', i); });
  });

  // Count numbers up from zero.
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = 1;
    var end = +el.dataset.count, t0 = null;
    if (reduce) { el.textContent = end.toLocaleString('en-US'); return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1400, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = 0;
    requestAnimationFrame(step);
    setTimeout(function () { el.textContent = end.toLocaleString('en-US'); }, 1600);
  }
  function countIn(tile) { tile.querySelectorAll('[data-count]').forEach(countUp); }

  // Tiles on screen rise in sequence; the rest reveal as you scroll.
  var tiles = [].slice.call(document.querySelectorAll('.tile, .work-head, .section-label'));
  var vh = innerHeight;
  var onScreen = tiles.filter(function (t) { return t.getBoundingClientRect().top < vh; })
    .sort(function (a, b) {
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (ra.top - rb.top) || (ra.left - rb.left);
    });
  onScreen.forEach(function (t, i) {
    t.style.setProperty('--d', (i * 80) + 'ms');
    t.classList.add('enter');
    setTimeout(function () { countIn(t); }, i * 80 + 300);
  });
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.style.setProperty('--d', (n++ * 70) + 'ms');
      e.target.classList.add('in');
      countIn(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 }) : null;
  tiles.forEach(function (t) {
    if (onScreen.indexOf(t) > -1) return;
    if (io) { t.classList.add('reveal'); io.observe(t); } else { t.classList.add('in'); }
  });

  // Spotlight that follows the pointer.
  document.querySelectorAll('.tile').forEach(function (t) {
    t.addEventListener('pointermove', function (e) {
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Theme toggle with a circular reveal where supported.
  var meta = document.querySelector('meta[name="theme-color"]');
  function paintMeta() { if (meta) meta.content = root.getAttribute('data-theme') === 'light' ? '#eef1f4' : '#0b0d10'; }
  function apply(next) {
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    paintMeta();
  }
  paintMeta();
  var btn = document.getElementById('theme');
  if (btn) btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    if (!document.startViewTransition || reduce) { apply(next); return; }
    var r = btn.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('theme-switching');
    var vt = document.startViewTransition(function () { apply(next); });
    vt.ready.then(function () {
      root.animate({ clipPath: ['circle(0 at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' });
    });
    vt.finished.finally(function () { root.classList.remove('theme-switching'); });
  });

  // Copy buttons.
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var label = b.textContent;
      function done(ok) {
        b.textContent = ok ? 'Copied' : 'Select and copy';
        b.classList.toggle('done', ok);
        setTimeout(function () { b.textContent = label; b.classList.remove('done'); }, 1800);
      }
      if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(function () { done(true); }, function () { done(false); });
      else done(false);
    });
  });

  // Local time in Hamden, CT.
  var clock = document.getElementById('clock');
  if (clock) {
    var fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
    var tick = function () { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }

  // Contact form opens the visitor's email app with the message filled in.
  var form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var subject = (f.topic.value || 'Project enquiry') + ' from ' + f.name.value;
    var body = f.message.value + '\n\n' + f.name.value + '\n' + f.email.value + (f.budget.value ? '\nBudget: ' + f.budget.value : '');
    location.href = 'mailto:mrdhliwayojoseph@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
