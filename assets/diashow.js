/* Diashow im Hero der Startseite.

   Die erste Folie (Teamfoto) ist das Startbild und laedt sofort. Die
   weiteren Motive laden erst nach dem Seitenaufbau. In die Rotation kommt
   nur, was erfolgreich geladen und dekodiert wurde - ein fehlerhaftes Bild
   wird uebersprungen statt in eine leere Flaeche zu blenden. Faellt das
   Startbild aus, bleibt das erste funktionierende Motiv stehen.

   Ohne JavaScript bleibt die erste Folie still sichtbar (CSS). Bei
   "Bewegung reduzieren" wird nicht rotiert und nichts nachgeladen. Die
   Pause-Taste erscheint nur, wenn tatsaechlich rotiert werden kann. */
(function (global) {
  'use strict';

  // Erfuellt, sobald das Bild geladen und dekodiert ist; abgelehnt bei
  // Ladefehler. Cache-Treffer sind beim Aufruf schon "complete".
  function bildBereit(img) {
    return new Promise(function (erfuellt, abgelehnt) {
      function pruefen() {
        if (!(img.naturalWidth > 0)) { abgelehnt(); return; }
        if (typeof img.decode !== 'function') { erfuellt(); return; }
        img.decode().then(erfuellt, function () {
          // decode() kann bei sehr grossen Bildern scheitern, obwohl sie da sind
          if (img.naturalWidth > 0) erfuellt(); else abgelehnt();
        });
      }
      if (img.complete && (img.currentSrc || img.getAttribute('src'))) { pruefen(); return; }
      img.addEventListener('load', pruefen, { once: true });
      img.addEventListener('error', function () { abgelehnt(); }, { once: true });
    });
  }

  function Diashow(figur, optionen) {
    var o = optionen || {};
    var takt = o.takt || 6500;
    var reduziert = !!o.reduziert;
    var knopf = o.knopf || null;
    var uhrStellen = o.setInterval || global.setInterval;
    var uhrLoeschen = o.clearInterval || global.clearInterval;
    var folien = [].slice.call(figur.querySelectorAll('.slide'));
    var bereit = [];
    var aktiv = null, uhr = null, angehalten = false;

    function zeigen(folie) {
      if (aktiv === folie) return;
      if (aktiv) aktiv.classList.remove('aktiv');
      aktiv = folie;
      if (folie) folie.classList.add('aktiv');
    }

    function knopfAktualisieren() {
      if (!knopf) return;
      knopf.hidden = reduziert || bereit.length < 2;
      var text = angehalten ? 'Diashow fortsetzen' : 'Diashow anhalten';
      var label = knopf.querySelector('.diashow-text');
      if (label) label.textContent = text;
      knopf.setAttribute('data-zustand', angehalten ? 'pause' : 'laeuft');
    }

    function anhalten() { if (uhr) { uhrLoeschen(uhr); uhr = null; } }

    function weiter() {
      if (bereit.length < 2) return;
      var i = bereit.indexOf(aktiv);
      zeigen(bereit[(i + 1) % bereit.length]);
    }

    function planen() {
      knopfAktualisieren();
      if (reduziert || angehalten || uhr || bereit.length < 2) return;
      uhr = uhrStellen(weiter, takt);
    }

    function aufnehmen(folie) {
      if (bereit.indexOf(folie) > -1) return;
      folie.hidden = false;
      // Reihenfolge des Markups beibehalten
      bereit.push(folie);
      bereit.sort(function (a, b) { return folien.indexOf(a) - folien.indexOf(b); });
      if (!aktiv) zeigen(folie);
      planen();
    }

    function entfernen(folie) {
      var i = bereit.indexOf(folie);
      if (i > -1) bereit.splice(i, 1);
      folie.hidden = true;
      if (aktiv === folie) { aktiv = null; folie.classList.remove('aktiv'); zeigen(bereit[0] || null); }
      if (bereit.length < 2) anhalten();
      knopfAktualisieren();
    }

    function beobachten(folie) {
      var img = folie.querySelector('img');
      if (!img) { entfernen(folie); return; }
      // Spaetere Wechsel (z. B. andere Quelle nach Drehen des Geraets)
      img.addEventListener('error', function () { entfernen(folie); });
      img.addEventListener('load', function () { if (img.naturalWidth > 0) aufnehmen(folie); });
    }

    function pruefenUndAufnehmen(folie) {
      var img = folie.querySelector('img');
      if (!img) return;
      bildBereit(img).then(function () { aufnehmen(folie); }, function () { entfernen(folie); });
    }

    // Startbild sofort anzeigen; ob es wirklich geladen ist, wird geprueft.
    figur.classList.add('diashow-js');
    zeigen(folien[0] || null);
    folien.forEach(beobachten);
    if (folien[0]) pruefenUndAufnehmen(folien[0]);

    if (knopf) {
      knopf.addEventListener('click', function () {
        angehalten = !angehalten;
        figur.classList.toggle('angehalten', angehalten);
        if (angehalten) anhalten(); else planen();
        knopfAktualisieren();
      });
    }
    knopfAktualisieren();

    function nachladen() {
      if (reduziert) return;
      folien.slice(1).forEach(function (folie) {
        [].forEach.call(folie.querySelectorAll('source[data-srcset]'), function (s) {
          s.setAttribute('srcset', s.getAttribute('data-srcset'));
        });
        var img = folie.querySelector('img');
        if (img && img.getAttribute('data-src')) {
          if (img.getAttribute('data-srcset')) img.setAttribute('srcset', img.getAttribute('data-srcset'));
          img.setAttribute('src', img.getAttribute('data-src'));
        }
        pruefenUndAufnehmen(folie);
      });
    }

    return {
      nachladen: nachladen,
      weiter: weiter,
      aktiv: function () { return aktiv; },
      bereit: function () { return bereit.slice(); },
      laeuft: function () { return !!uhr; }
    };
  }

  global.Diashow = Diashow;

  var doc = global.document;
  if (!doc || !doc.querySelector) return;
  var figur = doc.querySelector('.hero-slides');
  if (!figur) return;
  var reduziert = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var schau = Diashow(figur, { knopf: doc.querySelector('.diashow-knopf'), reduziert: reduziert });
  function spaeter() { global.setTimeout(schau.nachladen, 800); }
  if (doc.readyState === 'complete') spaeter(); else global.addEventListener('load', spaeter);
})(typeof window !== 'undefined' ? window : this);
