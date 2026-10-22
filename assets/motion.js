/* Bewegung nach Vorbild bywater.group.
   Dort bauen sich Ueberschriften Wort fuer Wort auf, sobald sie ins Bild
   scrollen (GSAP ScrollTrigger, 0,6 s, Versatz je Wort). Hier dasselbe
   ohne Bibliothek. Die Hero-Ueberschrift animiert per CSS
   (redesign-20261021.css), damit die erste Darstellung nicht auf dieses
   Skript wartet.

   Versteckt wird erst, wenn das Skript laeuft. Ohne JavaScript oder bei
   "Bewegung reduzieren" bleibt alles sofort sichtbar. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function inWoerterTeilen(el) {
    var n = 0, knoten = [], gang = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    while (gang.nextNode()) knoten.push(gang.currentNode);
    knoten.forEach(function (k) {
      if (!k.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      k.nodeValue.split(/(\s+)/).forEach(function (stueck) {
        if (!stueck) return;
        if (/^\s+$/.test(stueck)) { frag.appendChild(document.createTextNode(stueck)); return; }
        var aussen = document.createElement('span'), innen = document.createElement('span');
        aussen.className = 'w'; innen.className = 'wi';
        innen.textContent = stueck;
        innen.style.transitionDelay = Math.min(n++ * 40, 640) + 'ms';
        aussen.appendChild(innen); frag.appendChild(aussen);
      });
      k.parentNode.replaceChild(frag, k);
    });
  }

  var beobachter = new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('ist-sichtbar');
      beobachter.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });

  var titel = document.querySelectorAll('main h2, .statement-band h2');
  [].forEach.call(titel, function (h) {
    // Was beim Laden schon sichtbar ist, bleibt unangetastet - sonst flackert es.
    if (h.getBoundingClientRect().top < window.innerHeight) return;
    if (h.closest('.hero')) return;
    inWoerterTeilen(h);
    h.classList.add('wort-anim');
    beobachter.observe(h);
  });

  // Sicherheitsnetz: nichts bleibt dauerhaft versteckt, falls der Beobachter haengt.
  window.addEventListener('load', function () {
    setTimeout(function () {
      [].forEach.call(document.querySelectorAll('.wort-anim:not(.ist-sichtbar)'), function (h) {
        if (h.getBoundingClientRect().top < window.innerHeight) h.classList.add('ist-sichtbar');
      });
    }, 1500);
  });

  // Die Hero-Diashow steuert assets/diashow.js.

  // Leichte Parallaxe auf grossflaechigen Bildern
  var bilder = document.querySelectorAll('[data-parallax]');
  if (!bilder.length) return;
  var geplant = false;
  function bewegen() {
    geplant = false;
    [].forEach.call(bilder, function (b) {
      var r = b.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var staerke = parseFloat(b.getAttribute('data-parallax')) || 0.08;
      var abstand = r.top + r.height / 2 - window.innerHeight / 2;
      b.style.transform = 'translate3d(0,' + (abstand * -staerke).toFixed(1) + 'px,0) scale(1.1)';
    });
  }
  window.addEventListener('scroll', function () {
    if (!geplant) { geplant = true; requestAnimationFrame(bewegen); }
  }, { passive: true });
  bewegen();
})();
