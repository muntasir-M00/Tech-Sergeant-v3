/**
 * TechSarge Storage Layer v2
 * -------------------------------------------------------
 * localStorage abstraction with subscribe, CRUD, and
 * video-specific helpers (likes, comments, view tracking).
 * New prefix "v2" forces a fresh seed for returning users.
 */
(function () {
  const PREFIX = "techsarge:v2:";
  const SEED_FLAG = PREFIX + "seeded";
  const SEED_URL = "data/seed.json";

  const subscribers = {};

  function notify(col) {
    (subscribers[col] || []).forEach((cb) => { try { cb(); } catch (e) {} });
  }

  function readCol(name) {
    try { return JSON.parse(localStorage.getItem(PREFIX + name)) || []; }
    catch (_) { return []; }
  }

  function writeCol(name, items) {
    localStorage.setItem(PREFIX + name, JSON.stringify(items));
    notify(name);
  }

  function genId(pre) {
    return `${pre}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  function makeCollection(name, idPre) {
    return {
      list() { return readCol(name); },
      get(id) { return readCol(name).find((x) => x.id === id); },
      create(partial) {
        const items = readCol(name);
        const item = { id: genId(idPre), ...partial };
        items.push(item);
        writeCol(name, items);
        return item;
      },
      update(id, partial) {
        const items = readCol(name);
        const idx = items.findIndex((x) => x.id === id);
        if (idx === -1) return null;
        items[idx] = { ...items[idx], ...partial, id };
        writeCol(name, items);
        return items[idx];
      },
      remove(id) {
        const items = readCol(name);
        const next = items.filter((x) => x.id !== id);
        if (next.length === items.length) return false;
        writeCol(name, next);
        return true;
      },
      toggle(id, field) {
        const items = readCol(name);
        const idx = items.findIndex((x) => x.id === id);
        if (idx === -1) return null;
        items[idx][field] = !items[idx][field];
        writeCol(name, items);
        return items[idx];
      },
    };
  }

  // -------- Video-specific helpers --------
  const videoHelpers = {
    incrementView(id) {
      const items = readCol("videos");
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1) return;
      items[idx].views = (items[idx].views || 0) + 1;
      writeCol("videos", items);
    },
    like(id) {
      const items = readCol("videos");
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1) return null;
      items[idx].likes = (items[idx].likes || 0) + 1;
      writeCol("videos", items);
      return items[idx];
    },
    unlike(id) {
      const items = readCol("videos");
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1) return null;
      items[idx].likes = Math.max(0, (items[idx].likes || 1) - 1);
      writeCol("videos", items);
      return items[idx];
    },
    addComment(id, author, text) {
      const items = readCol("videos");
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1) return null;
      if (!Array.isArray(items[idx].comments)) items[idx].comments = [];
      const comment = { id: genId("c"), author: author || "Anonymous", text, ts: Date.now() };
      items[idx].comments.push(comment);
      writeCol("videos", items);
      return comment;
    },
    removeComment(videoId, commentId) {
      const items = readCol("videos");
      const idx = items.findIndex((x) => x.id === videoId);
      if (idx === -1) return false;
      items[idx].comments = (items[idx].comments || []).filter((c) => c.id !== commentId);
      writeCol("videos", items);
      return true;
    },
  };

  // -------- osLinks step helpers --------
  const osHelpers = {
    addStep(osId, step) {
      const items = readCol("osLinks");
      const idx = items.findIndex((x) => x.id === osId);
      if (idx === -1) return null;
      if (!Array.isArray(items[idx].steps)) items[idx].steps = [];
      const s = { id: genId("s"), ...step };
      items[idx].steps.push(s);
      writeCol("osLinks", items);
      return s;
    },
    removeStep(osId, stepId) {
      const items = readCol("osLinks");
      const idx = items.findIndex((x) => x.id === osId);
      if (idx === -1) return false;
      items[idx].steps = (items[idx].steps || []).filter((s) => s.id !== stepId);
      writeCol("osLinks", items);
      return true;
    },
    updateStep(osId, stepId, partial) {
      const items = readCol("osLinks");
      const idx = items.findIndex((x) => x.id === osId);
      if (idx === -1) return null;
      const si = (items[idx].steps || []).findIndex((s) => s.id === stepId);
      if (si === -1) return null;
      items[idx].steps[si] = { ...items[idx].steps[si], ...partial, id: stepId };
      writeCol("osLinks", items);
      return items[idx].steps[si];
    },
  };

  async function seedIfNeeded() {
    if (localStorage.getItem(SEED_FLAG) === "1") return;
    try {
      const res = await fetch(SEED_URL);
      const seed = await res.json();
      Object.entries(seed).forEach(([k, v]) => {
        if (!localStorage.getItem(PREFIX + k)) {
          localStorage.setItem(PREFIX + k, JSON.stringify(v));
        }
      });
      localStorage.setItem(SEED_FLAG, "1");
    } catch (e) {
      console.error("[Storage] failed to seed:", e);
    }
  }

  const baseVideos = makeCollection("videos", "v");
  const baseOS = makeCollection("osLinks", "os");

  const Storage = {
    ready: seedIfNeeded(),
    videos: { ...baseVideos, ...videoHelpers },
    osLinks: { ...baseOS, ...osHelpers },
    products: makeCollection("products", "p"),
    auth: makeCollection("auth", "auth"),
    subscribe(col, cb) {
      (subscribers[col] = subscribers[col] || []).push(cb);
      return () => {
        subscribers[col] = (subscribers[col] || []).filter((c) => c !== cb);
      };
    },
    async reset() {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
      await seedIfNeeded();
      ["videos", "osLinks", "products"].forEach(notify);
    },
  };

  window.Storage = Storage;
})();
