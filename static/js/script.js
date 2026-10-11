// ===== Cyber Security Law 2026 - course player =====
const SAVE_PROGRESS = true;              // false = start fresh on every page load
const KEY_DONE    = 'cyberlaw2026_done';     // unique names so other pages on the same
const KEY_CURRENT = 'cyberlaw2026_current';  // github.io address cannot overwrite them

const items  = [...document.querySelectorAll('.module-item')];
const cover  = document.querySelector('.panel.cover');
const panels = [...document.querySelectorAll('.panel:not(.cover)')];   // modules only
let current  = 0;
let done     = new Set();

try {
  if (SAVE_PROGRESS) {
    done = new Set(JSON.parse(localStorage.getItem(KEY_DONE) || '[]'));
    const saved = parseInt(localStorage.getItem(KEY_CURRENT), 10);
    if (!isNaN(saved) && saved >= 0 && saved < panels.length) current = saved;
  }
} catch (e) {}

let started = done.size > 0 || current > 0;   // returning students skip the cover

// A module is open if it is the first, optional, or the one before it is completed
const isOpen = i => i === 0 || items[i].hasAttribute('data-optional') || done.has(i - 1);

// ---- H5P frames -----------------------------------------------------------
// H5P measures its own size when it loads. A frame inside a hidden panel
// (display:none) measures 0 px high and stays blank. So each iframe keeps its
// address in data-src and only gets a real src when its panel is visible.
function loadFrame(i) {
  const f = panels[i] && panels[i].querySelector('iframe[data-src]');
  if (f && !f.getAttribute('src')) f.setAttribute('src', f.dataset.src);
}
// Frames that were already loaded: ask H5P to re-measure after the panel appears
function nudgeFrame(i) {
  const f = panels[i] && panels[i].querySelector('iframe');
  if (!f) return;
  [450, 1200].forEach(ms => setTimeout(() => {
    try { f.contentWindow.dispatchEvent(new Event('resize')); } catch (e) {}
  }, ms));
}

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

  if (started) { loadFrame(current); nudgeFrame(current); }

  try {
    if (SAVE_PROGRESS) {
      localStorage.setItem(KEY_DONE, JSON.stringify([...done]));
      localStorage.setItem(KEY_CURRENT, current);
    }
  } catch (e) {}

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
  if (!isOpen(i)) {                       // locked -> shake and stay
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
