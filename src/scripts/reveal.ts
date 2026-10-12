// Scroll reveal: one IntersectionObserver adds .is-revealed, CSS does the
// animation (global.css). The root margin reaches 25% below the viewport so
// tall card groups are revealed before the visitor gets there (Bilto lesson).
// After the transition the attribute is removed so card hover transforms
// are not slowed down by the reveal transition.
function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!items.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.removeAttribute('data-reveal'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        el.classList.add('is-revealed');
        const done = () => {
          el.classList.remove('is-revealed');
          el.removeAttribute('data-reveal');
        };
        el.addEventListener('transitionend', done, { once: true });
        // Safety net: a transition that never fires must not leave content hidden.
        window.setTimeout(done, 1500);
      }
    },
    { threshold: 0, rootMargin: '0px 0px 25% 0px' },
  );
  items.forEach((el) => observer.observe(el));
}

function initHeader() {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (header) {
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }
  // The CSS-only mobile menu stays open after an in-page anchor tap; close it.
  const toggle = document.getElementById('nav-toggle');
  if (toggle instanceof HTMLInputElement) {
    document.querySelectorAll('#mobile-menu a').forEach((link) =>
      link.addEventListener('click', () => {
        toggle.checked = false;
      }),
    );
  }
}

initReveal();
initHeader();
