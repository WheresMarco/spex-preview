/* Linköpings Studentspex — Phase 1 preview. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: shrink on scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  function setNav(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Stäng menyn' : 'Öppna menyn');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    window.matchMedia('(min-width: 1101px)').addEventListener('change', function (mq) {
      if (mq.matches) setNav(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Hero: Lisse's name tag (hover on desktop, tap on touch) ---------- */
  var art = document.querySelector('.hero__art');
  if (art) art.addEventListener('click', function () { art.classList.toggle('is-tapped'); });

  /* ---------- Tillrop demo ---------- */
  document.querySelectorAll('[data-shouts]').forEach(function (box) {
    var out = box.querySelector('.shout-stage__text');
    var icon = box.querySelector('.shout-stage__icon');
    var buttons = box.querySelectorAll('.shout');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        out.textContent = btn.getAttribute('data-result');
        icon.textContent = btn.getAttribute('data-icon') || '🎭';
        out.classList.remove('is-new');
        void out.offsetWidth; // restart animation
        out.classList.add('is-new');
      });
    });
  });

  /* ---------- Newsletter forms (Phase 1: validate only, store nothing) ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  document.querySelectorAll('form[data-newsletter]').forEach(function (form) {
    var email = form.querySelector('input[type="email"]');
    var consent = form.querySelector('input[type="checkbox"][name="consent"]');
    var emailErr = form.querySelector('[data-error="email"]');
    var consentErr = form.querySelector('[data-error="consent"]');
    var honeypot = form.querySelector('input[name="website"]');

    function setError(input, holder, msg) {
      holder.textContent = msg || '';
      if (msg) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    function checkEmail() {
      var v = email.value.trim();
      if (!v) return 'Fyll i din e-postadress.';
      if (!EMAIL_RE.test(v)) return 'Det där ser inte ut som en e-postadress – kolla gärna stavningen.';
      return '';
    }

    email.addEventListener('blur', function () { if (email.value) setError(email, emailErr, checkEmail()); });
    email.addEventListener('input', function () { if (email.getAttribute('aria-invalid')) setError(email, emailErr, checkEmail()); });
    consent.addEventListener('change', function () { if (consent.checked) setError(consent, consentErr, ''); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (honeypot && honeypot.value) return; // bots fill hidden fields
      var eMsg = checkEmail();
      var cMsg = consent.checked ? '' : 'Kryssa i rutan så vi vet att det är okej att mejla dig.';
      setError(email, emailErr, eMsg);
      setError(consent, consentErr, cMsg);
      if (eMsg) { email.focus(); return; }
      if (cMsg) { consent.focus(); return; }
      form.querySelector('[data-echo]').textContent = email.value.trim();
      form.classList.add('is-done');
      var success = form.querySelector('.form__success');
      success.setAttribute('tabindex', '-1');
      success.focus();
    });

    var again = form.querySelector('[data-reset]');
    if (again) again.addEventListener('click', function () {
      form.reset();
      form.classList.remove('is-done');
      email.focus();
    });
  });

  /* ---------- Anti-spam mail links ---------- */
  document.querySelectorAll('a.mail[data-u]').forEach(function (a) {
    var addr = a.getAttribute('data-u') + '@' + (a.getAttribute('data-d') || 'studentspex.se');
    a.href = 'mailto:' + addr;
    if (!a.hasAttribute('data-keep-text')) a.textContent = addr;
  });

  /* ---------- Gamla spex: search + decade filter ---------- */
  var archive = document.querySelector('[data-archive]');
  if (archive) {
    var search = document.getElementById('archive-search');
    var chips = document.querySelectorAll('[data-decade-filter]');
    var count = document.querySelector('[data-archive-count]');
    var empty = document.querySelector('.archive-empty');
    var decades = archive.querySelectorAll('.decade');
    var activeDecade = 'all';

    function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function apply() {
      var q = norm(search.value.trim());
      var shown = 0;
      decades.forEach(function (dec) {
        var decOk = activeDecade === 'all' || dec.getAttribute('data-decade') === activeDecade;
        var any = 0;
        dec.querySelectorAll('.show').forEach(function (card) {
          var ok = decOk && (!q || norm(card.getAttribute('data-search')).indexOf(q) !== -1);
          card.hidden = !ok;
          if (ok && !card.classList.contains('show--missing')) shown++;
          if (ok) any++;
        });
        dec.hidden = any === 0;
      });
      count.textContent = shown === 1 ? '1 uppsättning' : shown + ' uppsättningar';
      empty.classList.toggle('is-visible', shown === 0);
    }
    search.addEventListener('input', apply);
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        activeDecade = chip.getAttribute('data-decade-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        apply();
      });
    });
    apply();
  }

  /* ---------- Easter egg: the Netscape line lives on ---------- */
  var egg = document.querySelector('[data-easter-egg]');
  if (egg) egg.addEventListener('click', function () {
    var n = document.querySelector('.netscape');
    n.classList.toggle('is-visible');
    egg.setAttribute('aria-expanded', String(n.classList.contains('is-visible')));
  });

})();
