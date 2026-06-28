// =============================================
// favorites.js — gerencia favoritos no localStorage
// =============================================

const Favorites = (() => {
  const KEY = 'cinescope_favorites';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  // id único composto: filmes e séries têm namespaces de id separados no TMDB,
  // então 'movie:1399' e 'tv:1399' são itens diferentes.
  function uid(item) {
    const type = item.media_type || item._type || 'movie';
    return `${type}:${item.id}`;
  }

  function getAll() { return load(); }

  function isFav(item) { return load().some(f => f.uid === uid(item)); }

  function toggle(item) {
    const list = load();
    const key  = uid(item);
    const idx  = list.findIndex(f => f.uid === key);
    if (idx >= 0) {
      list.splice(idx, 1);
      save(list);
      return false; // removido
    } else {
      list.unshift({ ...item, uid: key });
      save(list);
      return true; // adicionado
    }
  }

  function count() { return load().length; }

  return { getAll, isFav, toggle, count, uid };
})();
