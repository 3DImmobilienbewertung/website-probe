/* Produktions-Stub für den Design-Editor.
   Die Szenen-Datei ruft window.useTweaks() auf und rendert optional
   window.TweaksPanel. Auf der Live-Seite gibt es keinen Editor-Host:
   useTweaks liefert die Defaults unveraendert zurueck, TweaksPanel
   bleibt undefined -> das Panel wird nie gerendert. */

window.useTweaks = function (defaults) {
  return [defaults || {}, function () {}];
};
