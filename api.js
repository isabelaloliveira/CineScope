// =============================================
// api.js — TMDB API wrapper
// =============================================
// Chave pública de demonstração (TMDB API v3).
// Em app 100% estático (GitHub Pages) a chave SEMPRE fica visível no browser
// (DevTools → Network) — não há como ocultá-la. Esta é uma chave v3 read-only
// e rate-limited, usada só para demo. Para produção, use um proxy serverless
// (Vercel/Netlify) e mantenha a chave no servidor.
// =============================================

const API_KEY = '80f608549edf770e657e42f3b519613f'; // pública (demo) — ver nota acima
const BASE    = 'https://api.themoviedb.org/3';
const IMG     = 'https://image.tmdb.org/t/p/';

const TMDB = {
  // ── busca multi (filmes + séries ao mesmo tempo) ──
  async search(query, page = 1) {
    const r = await fetch(
      `${BASE}/search/multi?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`
    );
    return r.json();
  },

  // ── trending da semana ──
  async trending() {
    const r = await fetch(
      `${BASE}/trending/all/week?api_key=${API_KEY}&language=pt-BR`
    );
    return r.json();
  },

  // ── gêneros (filmes + séries) ──
  async genres() {
    const [mov, tv] = await Promise.all([
      fetch(`${BASE}/genre/movie/list?api_key=${API_KEY}&language=pt-BR`).then(r => r.json()),
      fetch(`${BASE}/genre/tv/list?api_key=${API_KEY}&language=pt-BR`).then(r => r.json()),
    ]);
    const all = [...(mov.genres || []), ...(tv.genres || [])];
    // deduplicar por id
    return [...new Map(all.map(g => [g.id, g])).values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR')
    );
  },

  // ── detalhes completos de um item ──
  async details(id, type) {
    const r = await fetch(
      `${BASE}/${type}/${id}?api_key=${API_KEY}&language=pt-BR`
    );
    return r.json();
  },

  // ── discover com filtro de gênero ──
  async discover(type = 'movie', genreId, page = 1) {
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const r = await fetch(
      `${BASE}/discover/${endpoint}?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=${genreId}&page=${page}`
    );
    return r.json();
  },

  // ── helpers de imagem ──
  poster(path, size = 'w342') {
    return path ? `${IMG}${size}${path}` : null;
  },
  backdrop(path, size = 'w780') {
    return path ? `${IMG}${size}${path}` : null;
  },
};
