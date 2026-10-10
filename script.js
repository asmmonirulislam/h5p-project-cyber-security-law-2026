const SAVE_PROGRESS = true;              // false = start fresh on every page load

const items  = [...document.querySelectorAll('.module-item')];
const cover  = document.querySelector('.panel.cover');
const panels = [...document.querySelectorAll('.panel:not(.cover)')];   // modules only
let current  = 0;
let done     = new Set();

try { if (SAVE_PROGRESS) done = new Set(JSON.parse(localStorage.getItem('done') || '[]')); } catch (e) {}
let started = done.size > 0;            // returning students skip the cover

// A module is open if it is the first, optional, or the one before it is completed
const isOpen = i => i === 0 || items[i].hasAttribute('data-optional') || done.has(i - 1);

function render() {
  items.forEach((el, i) => {
    el.classList.toggle('active', i === current);
    el.classList.toggle('done', done.has(i));
    el.setAttribute('aria-disabled', !isOpen(i));
  });
  cover.classList.toggle('active', !started);
  panels.forEach((p, i) => p.classList.toggle('active', started && i === current));
  document.getElementById('count').textContent = done.size;
  document.getElementById('total').textContent = items.length;
  try { if (SAVE_PROGRESS) localStorage.setItem('done', JSON.stringify([...done])); } catch (e) {}
  checkEnd();
}

// Unlock the complete button only when the student has scrolled to the end
function checkEnd() {
  const slide = started && panels[current].querySelector('.slide');
  const btn   = slide && slide.querySelector('[data-complete]');
  if (!btn) return;
  const atEnd = slide.scrollTop + slide.clientHeight >= slide.scrollHeight - 10;
  btn.disabled = !(atEnd || done.has(current));
}

function goTo(i) {
  if (!isOpen(i)) {                       // locked → shake and stay
    items[i].classList.remove('shake');
    void items[i].offsetWidth;            // restart animation
    items[i].classList.add('shake');
    return;
  }
  current = i;
  started = true;
  render();
  closeMenu();                            // close the mobile drawer after choosing a module
}

// Mobile hamburger menu
function closeMenu() { document.body.classList.remove('menu-open'); }
document.getElementById('hamburger').addEventListener('click', () => document.body.classList.add('menu-open'));
document.querySelectorAll('[data-close-menu]').forEach(el => el.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

// Call this when the student finishes the current module.
// You can also call it from your own code:  completeModule();
function completeModule() {
  done.add(current);
  if (current < items.length - 1) current++;
  render();
}

items.forEach((el, i) => el.addEventListener('click', () => goTo(i)));
document.addEventListener('click', e => { if (e.target.closest('[data-complete]')) completeModule(); });
document.getElementById('toggle').addEventListener('click', () => document.body.classList.toggle('collapsed'));

// Start button on the cover
document.querySelector('[data-start]').addEventListener('click', () => { started = true; render(); });

// Re-check the scroll position while scrolling / resizing
panels.forEach(p => p.querySelector('.slide').addEventListener('scroll', checkEnd));
window.addEventListener('resize', checkEnd);
window.addEventListener('load', checkEnd);

render();