/* ============================================================
   NATHAN PHOTOGRAPHY — Core JS
   ============================================================ */

// ---- Global State ----
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
  // Works on both localhost and GitHub Pages subdirectory
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

function meetCoverPath(meet) {
  if (meet.coverImage) return meet.coverImage;
  const first = meet.photos?.[0];
  return first ? photoFilePath(first) : '';
}

// ============================================================
// NAVIGATION
// ============================================================
function initNav() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile');
  const links = document.querySelectorAll('.nav-links a, .nav-mobile a');

  // Active link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html') ||
        (currentPage === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Scroll shadow
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Hamburger
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu?.classList.toggle('open');
  });

  // Close menu on link click
  mobileMenu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      mobileMenu.classList.remove('open');
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
      <div class="lightbox-meta" id="lb-meta"></div>
      <button class="lb-nav lb-prev" id="lb-prev" aria-label="Previous photo">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button class="lb-nav lb-next" id="lb-next" aria-label="Next photo">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </button>
      <div class="lightbox-footer">
        <a class="lightbox-download" id="lb-download" href="#" download>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Download
        </a>
      </div>
    </div>`;
  document.body.appendChild(lb);

  // Events
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

  // Swipe support
  let startX = 0;
  lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) shiftLightbox(dx < 0 ? 1 : -1);
  });
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
  const filePath = photoFilePath(photo);
  img.src = imageUrl(filePath);
  img.alt = photo.title || '';
  img.onload = () => { img.style.opacity = '1'; img.style.transition = 'opacity 0.2s'; };

  document.getElementById('lb-title').textContent = photo.title || '';
  document.getElementById('lb-counter').textContent = `${index + 1} / ${photos.length}`;
  document.getElementById('lb-meta').textContent = photo.settings || photo.camera || '';
  const dl = document.getElementById('lb-download');
  dl.href = imageUrl(filePath);
  dl.download = (photo.title || 'photo').replace(/\s+/g, '-').toLowerCase() + '.jpg';

  document.getElementById('lb-prev').style.display = photos.length <= 1 ? 'none' : '';
  document.getElementById('lb-next').style.display = photos.length <= 1 ? 'none' : '';
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
      img.classList.add('loaded');
      obs.unobserve(img);
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('img.lazy').forEach(img => observer.observe(img));
}

// ============================================================
// PHOTO CARD BUILDER
// ============================================================
function createPhotoCard(photo, allPhotos, index, options = {}) {
  const card = document.createElement('div');
  card.className = 'photo-card';
  if (options.listitem) card.setAttribute('role', 'listitem');

  const thumb = imageUrl(photoThumbPath(photo));
  const file = imageUrl(photoFilePath(photo));

  const img = document.createElement('img');
  img.className = 'photo-img lazy';
  img.dataset.src = thumb;
  img.alt = photo.title || '';

  const overlay = document.createElement('div');
  overlay.className = 'photo-overlay';
  overlay.innerHTML = `
    <div class="photo-meta">
      <div class="photo-title">${photo.title || ''}</div>
      ${photo.settings ? `<div class="photo-detail">${photo.settings}</div>` : ''}
    </div>`;

  const actions = document.createElement('div');
  actions.className = 'photo-actions';
  const dlBtn = document.createElement('button');
  dlBtn.className = 'btn-icon';
  dlBtn.title = 'Download';
  dlBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`;
  dlBtn.addEventListener('click', e => downloadPhoto(e, file, photo.title || 'photo'));
  actions.appendChild(dlBtn);

  card.append(img, overlay, actions);
  card.addEventListener('click', e => {
    if (e.target.closest('.photo-actions')) return;
    openLightbox(allPhotos, index);
  });
  return card;
}

function downloadAllPhotos(photos, delayMs = 300) {
  photos.forEach((photo, i) => {
    setTimeout(() => {
      downloadPhoto(
        { stopPropagation: () => {} },
        imageUrl(photoFilePath(photo)),
        photo.title || `photo-${i + 1}`
      );
    }, i * delayMs);
  });
}

/** @deprecated use createPhotoCard */
function buildPhotoCard(photo, photos, index, basePath) {
  return createPhotoCard(photo, photos, index);
}

// ============================================================
// DOWNLOAD
// ============================================================
function downloadPhoto(e, url, title) {
  e.stopPropagation();
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/\s+/g, '-').toLowerCase() + '.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Downloading…');
}

// ============================================================
// TOAST
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
// FILTER + SEARCH
// ============================================================
function initFilters(containerSelector, cards, getCategory) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.querySelector('.search-input');

  let activeFilter = 'all';
  let searchTerm = '';

  function applyFilters() {
    const items = container.querySelectorAll('[data-filter]');
    let visibleCount = 0;
    items.forEach(item => {
      const cat = item.dataset.filter || '';
      const title = (item.dataset.title || '').toLowerCase();
      const matchFilter = activeFilter === 'all' || cat === activeFilter;
      const matchSearch = !searchTerm || title.includes(searchTerm);
      const show = matchFilter && matchSearch;
      item.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    const empty = container.querySelector('.empty-state');
    if (empty) empty.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.category;
      applyFilters();
    });
  });

  searchInput?.addEventListener('input', e => {
    searchTerm = e.target.value.toLowerCase().trim();
    applyFilters();
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  buildLightbox();
  initLazyLoad();
});
