// =============================================
// app.js — inicialização e lógica principal
// =============================================

let currentQuery   = '';
let currentGenre   = '';
let currentPage    = 1;
let currentTab     = 'discover';
let totalPages     = 1;
let allGenres      = [];

// ── INIT ──
async function init() {
  updateFavCount();
  await loadGenres();
  await loadTrending();

  // Enter na busca compacta
  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') search();
  });
  // Enter na busca do hero
  document.getElementById('hero-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') triggerHeroSearch();
  });
}

// ── HERO SEARCH ──
function triggerHeroSearch() {
  const q = document.getElementById('hero-input').value.trim();
  if (!q) return;
  document.getElementById('search-input').value = q;
  document.getElementById('hero').classList.add('hidden');
  search();
}

function showHome() {
  document.getElementById('hero').classList.remove('hidden');
  document.getElementById('section-results').classList.add('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('section-trending').classList.remove('hidden');
  document.getElementById('search-input').value = '';
  document.getElementById('hero-input').value = '';
  currentQuery = '';
  currentPage  = 1;
  setTab('discover');
}

// ── TABS ──
function setTab(name) {
  currentTab = name;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');
  document.getElementById(`btn-${name}`).classList.add('active');

  if (name === 'favorites') renderFavorites();
}

// ── GENRES ──
async function loadGenres() {
  try {
    allGenres = await TMDB.genres();
    renderGenreChips();
  } catch (e) {
    console.warn('Erro ao carregar gêneros:', e);
  }
}

function renderGenreChips() {
  const container = document.getElementById('genre-filters');
  // mantém o chip "Todos" e adiciona os demais
  const existing = container.querySelector('[data-genre=""]');
  container.innerHTML = '';
  container.appendChild(existing || createChip({ id: '', name: 'Todos' }));

  allGenres.slice(0, 14).forEach(g => {
    container.appendChild(createChip(g));
  });
}

function createChip(genre) {
  const btn = document.createElement('button');
  btn.className = `genre-chip${genre.id === '' || currentGenre === String(genre.id) ? ' active' : ''}`;
  btn.dataset.genre = genre.id;
  btn.textContent = genre.name;
  btn.addEventListener('click', () => selectGenre(genre.id));
  return btn;
}

async function selectGenre(genreId) {
  currentGenre = String(genreId);
  currentPage  = 1;

  // gênero é um modo próprio — limpa a busca textual
  currentQuery = '';
  document.getElementById('search-input').value = '';

  document.querySelectorAll('.genre-chip').forEach(c => {
    c.classList.toggle('active', String(c.dataset.genre) === currentGenre);
  });

  if (currentGenre) await discoverByGenre();
  else showHome();
}

// ── TRENDING ──
async function loadTrending() {
  renderSkeletons('grid-trending', 8);
  try {
    const data = await TMDB.trending();
    renderGrid('grid-trending', data.results || []);
  } catch (e) {
    document.getElementById('grid-trending').innerHTML =
      '<p style="color:var(--text-3);padding:20px">Erro ao carregar trending.</p>';
  }
}

// ── SEARCH ──
async function search(keepPage = false) {
  const q = document.getElementById('search-input').value.trim();
  if (!q) return;

  currentQuery = q;
  if (!keepPage) {
    currentPage  = 1;
    // busca textual é um modo próprio — zera o filtro de gênero
    currentGenre = '';
    document.querySelectorAll('.genre-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.genre === '');
    });
  }

  document.getElementById('hero').classList.add('hidden');
  document.getElementById('section-trending').classList.add('hidden');
  document.getElementById('section-results').classList.remove('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('load-more-wrap').classList.add('hidden');

  if (currentPage === 1) {
    renderSkeletons('grid-results', 8);
    document.getElementById('results-title').textContent =
      q ? `Resultados para "${q}"` : 'Filmes & Séries';
  }

  try {
    const data = await TMDB.search(q, currentPage);
    let results = data.results || [];
    totalPages  = data.total_pages || 1;

    // remove "person"
    results = results.filter(r => r.media_type !== 'person');

    if (currentPage === 1) {
      if (!results.length) {
        document.getElementById('grid-results').innerHTML = '';
        document.getElementById('empty-state').classList.remove('hidden');
        return;
      }
      renderGrid('grid-results', results);
    } else {
      appendGrid('grid-results', results);
    }

    if (currentPage < totalPages) {
      document.getElementById('load-more-wrap').classList.remove('hidden');
    }
  } catch (e) {
    console.error(e);
    document.getElementById('grid-results').innerHTML =
      '<p style="color:var(--text-3);padding:20px">Erro ao buscar. Verifique sua chave da API.</p>';
  }
}

// ── DISCOVER por gênero ──
async function discoverByGenre() {
  if (!currentGenre) { showHome(); return; }

  document.getElementById('hero').classList.add('hidden');
  document.getElementById('section-trending').classList.add('hidden');
  document.getElementById('section-results').classList.remove('hidden');
  document.getElementById('empty-state').classList.add('hidden');

  const genreName = (allGenres.find(g => String(g.id) === currentGenre) || {}).name || 'Gênero';
  document.getElementById('results-title').textContent = genreName;

  if (currentPage === 1) renderSkeletons('grid-results', 8);

  try {
    const [movies, tvs] = await Promise.all([
      TMDB.discover('movie', currentGenre, currentPage),
      TMDB.discover('tv', currentGenre, currentPage),
    ]);

    const combined = [
      ...(movies.results || []).map(r => ({ ...r, media_type: 'movie', _type: 'movie' })),
      ...(tvs.results   || []).map(r => ({ ...r, media_type: 'tv',    _type: 'tv' })),
    ].sort((a, b) => b.popularity - a.popularity);

    totalPages = Math.max(movies.total_pages || 1, tvs.total_pages || 1);

    if (currentPage === 1) renderGrid('grid-results', combined);
    else appendGrid('grid-results', combined);

    const wrap = document.getElementById('load-more-wrap');
    if (currentPage < totalPages) wrap.classList.remove('hidden');
    else wrap.classList.add('hidden');
  } catch (e) {
    console.error(e);
  }
}

// ── LOAD MORE ──
async function loadMore() {
  currentPage++;
  if (currentQuery) {
    await search(true);
  } else if (currentGenre) {
    await discoverByGenre();
  }
}

// ── START ──
init();
