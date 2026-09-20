/* ============================================================
   NATHAN FISCHER PHOTOGRAPHY — Core JS
   Shared across every page: nav, data loading, galleries, lightbox.
   ============================================================ */

const NP = {
  data: null,
  lightbox: { photos: [], index: 0 },
};

// ============================================================
// DATA
// ============================================================
async function loadData() {
  if (NP.data) return NP.data;
  try {
    const base = getBasePath();
    const res = await fetch(`${base}data/galleries.json`);
    NP.data = await res.json();
    return NP.data;
  } catch (e) {
    console.warn('Could not load galleries.json', e);
    return null;
  }
}

function getBasePath() {
  // Works on both localhost and a GitHub Pages subdirectory.
  const scripts = document.querySelectorAll('script[src]');
  for (const s of scripts) {
    const m = s.src.match(/(.+\/)js\/core\.js/);
    if (m) return m[1];
  }
  return '/';
}

function imageUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:)/i.test(path)) return path;
  return getBasePath() + path.replace(/^\//, '');
}

function photoThumbPath(photo) {
  return photo.thumb || photo.file || '';
}

function photoFilePath(photo) {
  return photo.file || photo.thumb || '';
}

// Known sports get a sensible default display order; anything new (a folder
// you create yourself, e.g. "basketball") just falls in after them, sorted
// alphabetically — no code change required for it to appear correctly.
const SPORT_PRIORITY = ['football', 'basketball', 'cross-country', 'track', 'baseball', 'soccer', 'wrestling', 'volleyball', 'lacrosse', 'tennis', 'golf'];

function sortedSportCategories(data) {
  return Object.entries(data.sports || {}).sort((a, b) => {
    const ai = SPORT_PRIORITY.indexOf(a[0]);
    const bi = SPORT_PRIORITY.indexOf(b[0]);
    const av = ai === -1 ? 999 : ai;
    const bv = bi === -1 ? 999 : bi;
    if (av !== bv) return av - bv;
    return a[1].label.localeCompare(b[1].label);
  });
}

// Flatten every sports category into one array, tagged with its category slug.
function allSportsPhotos(data) {
  const out = [];
  sortedSportCategories(data).forEach(([slug, cat]) => {
    (cat.photos || []).forEach(p => out.push({ ...p, _cat: slug, _catLabel: cat.label }));
  });
  return out;
}

function featuredSportsPhotos(data, limit) {
  const all = allSportsPhotos(data);
  const featured = all.filter(p => p.featured);
  const rest = all.filter(p => !p.featured);
  return [...featured, ...rest].slice(0, limit);
}

// ============================================================
// NAVIGATION
// ============================================================
function initNav() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile');
  const links = document.querySelectorAll('.nav-links a, .nav-mobile a');

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => {
    const href = (a.getAttribute('href') || '').split('?')[0];
    const hrefFile = href.split('/').pop();
    if (hrefFile === currentPage || (currentPage === '' && hrefFile === 'index.html')) {
      a.classList.add('active');
    }
  });

  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  hamburger?.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileMenu?.classList.toggle('open');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileMenu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ============================================================
// LIGHTBOX
// ============================================================
function buildLightbox() {
  if (document.getElementById('lightbox')) return;
  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = `
    <div class="lightbox-inner">
      <div class="lightbox-bar">
        <div class="lightbox-title" id="lb-title"></div>
        <div class="lightbox-counter" id="lb-counter"></div>
        <button class="lightbox-close" id="lb-close" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="lightbox-img-wrap">
        <img class="lightbox-img" id="lb-img" src="" alt="">
      </div>
      <button class="lb-nav lb-prev" id="lb-prev" aria-label="Previous photo">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button class="lb-nav lb-next" id="lb-next" aria-label="Next photo">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </button>
    </div>`;
  document.body.appendChild(lb);

  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', () => shiftLightbox(-1));
  document.getElementById('lb-next').addEventListener('click', () => shiftLightbox(1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') shiftLightbox(-1);
    if (e.key === 'ArrowRight') shiftLightbox(1);
  });

  let startX = 0;
  lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) shiftLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });
}

function openLightbox(photos, index) {
  buildLightbox();
  NP.lightbox.photos = photos;
  NP.lightbox.index = index;
  renderLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
  document.body.style.overflow = '';
}

function shiftLightbox(dir) {
  const len = NP.lightbox.photos.length;
  NP.lightbox.index = (NP.lightbox.index + dir + len) % len;
  renderLightbox();
}

function renderLightbox() {
  const { photos, index } = NP.lightbox;
  const photo = photos[index];

  const img = document.getElementById('lb-img');
  img.style.opacity = '0';
  img.src = imageUrl(photoFilePath(photo));
  img.alt = photo.title || 'Photo';
  img.onload = () => { img.style.opacity = '1'; };

  document.getElementById('lb-title').textContent = photo.title || '';
  document.getElementById('lb-counter').textContent = `${index + 1} / ${photos.length}`;

  const showNav = photos.length > 1;
  document.getElementById('lb-prev').style.display = showNav ? '' : 'none';
  document.getElementById('lb-next').style.display = showNav ? '' : 'none';
}

// ============================================================
// LAZY LOADING
// ============================================================
function initLazyLoad() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('img.lazy').forEach(img => {
      img.src = img.dataset.src;
      img.classList.add('loaded');
    });
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      obs.unobserve(img);
    });
  }, { rootMargin: '250px' });

  document.querySelectorAll('img.lazy:not(.loaded)').forEach(img => observer.observe(img));
}

// ============================================================
// PHOTO CARD + GALLERY GRID
// ============================================================
function createPhotoCard(photo, allPhotos, index) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'photo-card';
  card.setAttribute('aria-label', `Open photo: ${photo.title || 'untitled'}`);
  if (photo.w && photo.h) card.style.setProperty('--ar', `${photo.w} / ${photo.h}`);

  const img = document.createElement('img');
  img.className = 'photo-img lazy';
  img.dataset.src = imageUrl(photoThumbPath(photo));
  img.alt = photo.title || 'Sports and wildlife photography';
  img.loading = 'lazy';
  img.decoding = 'async';

  const overlay = document.createElement('div');
  overlay.className = 'photo-overlay';
  if (photo._catLabel) {
    overlay.innerHTML = `<span class="photo-tag">${photo._catLabel}</span>`;
  }

  card.append(img, overlay);
  card.addEventListener('click', () => openLightbox(allPhotos, index));
  return card;
}

/**
 * Renders a masonry-style photo grid into `container`.
 * `photos` is an array of gallery photo objects (as stored in galleries.json,
 * optionally with _cat / _catLabel added for filtering).
 */
function renderGallery(container, photos, emptyMessage) {
  if (!container) return;
  container.innerHTML = '';

  if (!photos.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      <h3>More coming soon</h3>
      <p>${emptyMessage || 'New photos are added regularly — check back soon.'}</p>`;
    container.appendChild(empty);
    return;
  }

  photos.forEach((photo, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'masonry-item';
    if (photo._cat) wrapper.dataset.filter = photo._cat;
    wrapper.appendChild(createPhotoCard(photo, photos, i));
    container.appendChild(wrapper);
  });

  initLazyLoad();
}

// ============================================================
// FILTER TABS (category pills, e.g. on the Sports page)
// ============================================================
function initFilterTabs(tabsContainer, gridContainer, onChange) {
  if (!tabsContainer) return;
  tabsContainer.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    tabsContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.category;
    gridContainer?.querySelectorAll('.masonry-item').forEach(item => {
      const show = filter === 'all' || item.dataset.filter === filter;
      item.style.display = show ? '' : 'none';
    });
    onChange?.(filter);
  });
}

// ============================================================
// TOAST (used by the booking form)
// ============================================================
function showToast(msg) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  buildLightbox();
  initLazyLoad();
});
