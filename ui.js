// =============================================
// ui.js — renderização e componentes visuais
// =============================================

// ── Skeletons de carregamento ──
function renderSkeletons(containerId, count = 8) {
  const el = document.getElementById(containerId);
  el.innerHTML = Array(count).fill('<div class="skeleton"></div>').join('');
}

// ── Card ──
function buildCard(item) {
  const type    = item.media_type || item._type || 'movie';
  const title   = item.title || item.name || 'Sem título';
  const year    = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating  = item.vote_average ? item.vote_average.toFixed(1) : '–';
  const poster  = TMDB.poster(item.poster_path);
  const fav     = Favorites.isFav(item);
  const typeLabel = type === 'tv' ? 'Série' : 'Filme';

  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id   = item.id;
  card.dataset.type = type;

  card.innerHTML = `
    <span class="card-type-badge">${typeLabel}</span>
    <button class="card-fav ${fav ? 'active' : ''}" title="Favoritar" data-uid="${Favorites.uid(item)}">✦</button>
    ${poster
      ? `<img class="card-poster" src="${poster}" alt="${title}" loading="lazy" />`
      : `<div class="card-poster-placeholder">🎬</div>`
    }
    <div class="card-body">
      <p class="card-title">${title}</p>
      <div class="card-meta">
        <span>${year || '–'}</span>
        <span class="card-rating">★ ${rating}</span>
      </div>
    </div>
  `;

  // clique no card → abre modal
  card.addEventListener('click', (e) => {
    if (e.target.closest('.card-fav')) return;
    openModal(item.id, type);
  });

  // clique no favoritinho
  card.querySelector('.card-fav').addEventListener('click', (e) => {
    e.stopPropagation();
    const normalized = normalizeItem(item, type);
    const added = Favorites.toggle(normalized);
    e.currentTarget.classList.toggle('active', added);
    updateAllFavButtons(Favorites.uid(normalized), added);
    updateFavCount();
    showToast(added ? `✦ ${title} adicionado aos favoritos` : `Removido dos favoritos`);
    if (document.getElementById('tab-favorites').classList.contains('active')) {
      renderFavorites();
    }
  });

  return card;
}

function normalizeItem(item, type) {
  return {
    id:           item.id,
    title:        item.title || item.name,
    media_type:   type,
    _type:        type,
    poster_path:  item.poster_path,
    vote_average: item.vote_average,
    release_date: item.release_date || item.first_air_date,
    first_air_date: item.first_air_date,
    overview:     item.overview,
    genre_ids:    item.genre_ids || [],
  };
}

function updateAllFavButtons(uid, active) {
  document.querySelectorAll(`.card-fav[data-uid="${uid}"]`).forEach(btn => {
    btn.classList.toggle('active', active);
  });
}

// ── Renderiza grade ──
function renderGrid(containerId, items) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  items.forEach(item => {
    const type = item.media_type || item._type || 'movie';
    if (type === 'person') return; // ignora pessoas
    el.appendChild(buildCard(item));
  });
}

function appendGrid(containerId, items) {
  const el = document.getElementById(containerId);
  items.forEach(item => {
    const type = item.media_type || item._type || 'movie';
    if (type === 'person') return;
    el.appendChild(buildCard(item));
  });
}

// ── Favoritos ──
function renderFavorites() {
  const favs  = Favorites.getAll();
  const grid  = document.getElementById('grid-favorites');
  const empty = document.getElementById('fav-empty');
  grid.innerHTML = '';
  if (!favs.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  favs.forEach(f => grid.appendChild(buildCard(f)));
}

// ── Contador do nav ──
function updateFavCount() {
  const n = Favorites.count();
  document.getElementById('fav-count').textContent = n;
}

// ── MODAL ──
let modalCurrentItem = null;

async function openModal(id, type) {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // limpa antes de carregar
  document.getElementById('modal-title').textContent   = 'Carregando…';
  document.getElementById('modal-overview').textContent = '';
  document.getElementById('modal-genres').innerHTML    = '';
  document.getElementById('modal-meta').innerHTML      = '';
  document.getElementById('modal-poster').src          = '';
  document.getElementById('modal-backdrop').style.backgroundImage = '';

  try {
    const data = await TMDB.details(id, type);
    modalCurrentItem = { ...data, media_type: type, _type: type };

    const title   = data.title || data.name;
    const year    = (data.release_date || data.first_air_date || '').slice(0, 4);
    const rating  = data.vote_average ? data.vote_average.toFixed(1) : '–';
    const runtime = data.runtime
      ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}min`
      : data.number_of_seasons
        ? `${data.number_of_seasons} temporada${data.number_of_seasons > 1 ? 's' : ''}`
        : '';

    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-overview').textContent = data.overview || 'Sinopse não disponível.';

    document.getElementById('modal-meta').innerHTML = `
      <span>${year}</span>
      ${runtime ? `<span>${runtime}</span>` : ''}
      <span class="rating-tag">★ ${rating}</span>
      <span>${type === 'tv' ? 'Série' : 'Filme'}</span>
    `;

    const genresEl = document.getElementById('modal-genres');
    (data.genres || []).slice(0, 4).forEach(g => {
      const tag = document.createElement('span');
      tag.className = 'modal-genre-tag';
      tag.textContent = g.name;
      genresEl.appendChild(tag);
    });

    const poster = TMDB.poster(data.poster_path, 'w342');
    if (poster) document.getElementById('modal-poster').src = poster;

    const backdrop = TMDB.backdrop(data.backdrop_path);
    if (backdrop) {
      document.getElementById('modal-backdrop').style.backgroundImage = `url(${backdrop})`;
    }

    updateModalFavBtn();
  } catch (e) {
    document.getElementById('modal-title').textContent = 'Erro ao carregar detalhes.';
  }
}

function updateModalFavBtn() {
  const btn = document.getElementById('btn-fav-modal');
  const fav = modalCurrentItem ? Favorites.isFav(modalCurrentItem) : false;
  btn.textContent = fav ? '✦ Nos seus favoritos' : '✦ Adicionar aos favoritos';
  btn.classList.toggle('is-fav', fav);
}

function toggleFavFromModal() {
  if (!modalCurrentItem) return;
  const normalized = normalizeItem(modalCurrentItem, modalCurrentItem._type);
  const added = Favorites.toggle(normalized);
  updateModalFavBtn();
  updateAllFavButtons(Favorites.uid(normalized), added);
  updateFavCount();
  showToast(added
    ? `✦ ${modalCurrentItem.title || modalCurrentItem.name} adicionado`
    : 'Removido dos favoritos'
  );
  if (document.getElementById('tab-favorites').classList.contains('active')) {
    renderFavorites();
  }
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay') && e.type === 'click') return;
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  modalCurrentItem = null;
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── TOAST ──
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
