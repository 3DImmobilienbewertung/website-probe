/* Laufbaender (Ratgeber, Kundenstimmen): laufen endlos, halten bei Hover,
   Fokus oder Tastendruck an. Ohne JavaScript oder bei reduzierter Bewegung
   bleiben sie eine wischbare Liste. */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function starte(band) {
    var spur = band.querySelector('.rb-spur');
    var knopf = band.querySelector('.rb-knopf');
    var text = knopf && knopf.querySelector('.rb-knopf-text');
    if (!spur || !knopf || !text) return;

    // Zweite, versteckte Kopie fuer den nahtlosen Uebergang; nicht vorlesbar, nicht fokussierbar
    Array.prototype.slice.call(spur.children).forEach(function (li) {
      var klon = li.cloneNode(true);
      klon.classList.add('rb-klon');
      klon.setAttribute('aria-hidden', 'true');
      var a = klon.querySelector('a');
      if (a) a.setAttribute('tabindex', '-1');
      spur.appendChild(klon);
    });

    function dauer() {
      // etwa 40 px pro Sekunde, egal wie viele Eintraege im Band stehen
      var halbe = spur.scrollWidth / 2;
      spur.style.setProperty('--rb-dauer', Math.max(30, Math.round(halbe / 40)) + 's');
    }
    function setze(laeuft) {
      band.classList.toggle('rb-laeuft', laeuft);
      knopf.setAttribute('data-zustand', laeuft ? 'laeuft' : 'pause');
      text.textContent = laeuft ? 'Laufband anhalten' : 'Laufband fortsetzen';
      if (laeuft) dauer();
    }

    knopf.hidden = false;
    setze(true);
    knopf.addEventListener('click', function () { setze(!band.classList.contains('rb-laeuft')); });
    // Wer mit der Tastatur in das Band springt, bekommt eine ruhende, wischbare Liste
    spur.addEventListener('focusin', function () { if (band.classList.contains('rb-laeuft')) setze(false); });
    window.addEventListener('resize', function () { if (band.classList.contains('rb-laeuft')) dauer(); });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.ratgeber-band'), starte);
})();
