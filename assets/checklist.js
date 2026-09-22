'use strict';
(function () {
  var boxes = Array.from(document.querySelectorAll('.checklist-item input[type="checkbox"]'));
  var progress = document.getElementById('check-progress');
  if (!boxes.length || !progress) return;
  function update() {
    progress.textContent = boxes.filter(function (box) { return box.checked; }).length +
      ' von ' + boxes.length + ' Punkten markiert. Nicht jeder Punkt gilt für jedes Objekt.';
  }
  boxes.forEach(function (box) { box.addEventListener('change', update); });
  document.getElementById('print-checklist').addEventListener('click', function () { window.print(); });
  document.getElementById('reset-checklist').addEventListener('click', function () {
    boxes.forEach(function (box) { box.checked = false; });
    update();
  });
  document.querySelector('.check-tools').hidden = false;
  update();
})();
