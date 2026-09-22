/* Progressive enhancement: content and contact links work without JavaScript. */
(() => {
  'use strict';
  const bar = document.querySelector('.mobile-bar, .mobile-contact');
  if (bar) {
    let previous = window.scrollY;
    let anchor = previous;
    let direction = 0;
    let queued = false;
    bar.classList.add('contact-scroll-aware');
    const update = () => {
      queued = false;
      const y = Math.max(0, window.scrollY);
      const delta = y - previous;
      const next = Math.sign(delta);
      if (next && next !== direction) { anchor = previous; direction = next; }
      const active = document.activeElement;
      const editing = active && active.matches('input, textarea, select, [contenteditable="true"]');
      const inBar = bar.contains(active);
      const menuOpen = document.querySelector('.mobile-menu.open');
      if (editing || menuOpen || y < 240) bar.classList.remove('contact-visible');
      else if (inBar || (direction < 0 && anchor - y > 28)) bar.classList.add('contact-visible');
      else if (direction > 0 && y - anchor > 14) bar.classList.remove('contact-visible');
      previous = y;
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', schedule, {passive: true});
    addEventListener('resize', schedule, {passive: true});
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    update();
  }
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('editorial-in');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: 0.08});
    document.querySelectorAll('.region-group, .sec-head, .hero-people').forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight) {
        el.classList.add('editorial-reveal');
        observer.observe(el);
      }
    });
  }
})();
