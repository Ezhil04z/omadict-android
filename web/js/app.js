(function () {
  "use strict";

  var DATAMUSE = "https://api.datamuse.com/words";
  var SUGMUSE = "https://api.datamuse.com/sug";
  var FREEDICT = "https://api.dictionaryapi.dev/api/v2/entries/en";

  var WOTD_WORDS = [
    "serendipity", "ephemeral", "luminous", "resilience", "ubiquitous",
    "meticulous", "enigmatic", "eloquent", "voracious", "tranquil",
    "zenith", "nebula", "cascade", "effervescent", "halcyon",
    "labyrinth", "wander", "glimpse", "ethereal", "quintessential",
    "solace", "drizzle", "embers", "harbor", "meander",
    "ponder", "reverie", "sonder", "nostalgia", "flourish",
    "luminescence", "shadow", "whisper", "horizon", "solitude",
    "crescendo", "verdant", "brisk", "dapple", "gossamer",
    "hush", "indigo", "lull", "murmur", "oscillation",
    "peregrine", "quiescent", "radiant", "amble", "epiphany"
  ];

  var ARPA_VOWELS = {
    AA: "\u0251", AE: "\u00e6", AH: "\u028c", AO: "\u0254", AW: "a\u028a",
    AY: "a\u026a", EH: "\u025b", ER: "\u025d", EY: "e\u026a", IH: "\u026a",
    IY: "i\u02d0", OW: "o\u028a", OY: "\u0254\u026a", UH: "\u028a", UW: "u\u02d0"
  };
  var ARPA_CONSONANTS = {
    B: "b", CH: "t\u0283", D: "d", DH: "\u00f0", F: "f", G: "\u0261",
    HH: "h", JH: "d\u0292", K: "k", L: "l", M: "m", N: "n",
    NG: "\u014b", P: "p", R: "\u0279", S: "s", SH: "\u0283", T: "t",
    TH: "\u03b8", V: "v", W: "w", Y: "j", Z: "z", ZH: "\u0292"
  };

  var POS_NAMES = {
    n: "NOUN", v: "VERB", adj: "ADJECTIVE", adv: "ADVERB", u: "UNKNOWN",
    pron: "PRONOUN", prep: "PREPOSITION", conj: "CONJUNCTION",
    det: "DETERMINER", intj: "INTERJECTION", num: "NUMERAL", part: "PARTICLE"
  };

  var HIST_KEY = "omadict.history.v1";
  var FAV_KEY = "omadict.favorites.v1";
  var CACHE_KEY = "omadict.cache.v1";
  var THEME_KEY = "omadict.theme.v1";
  var OFF = window.__OMADICT_OFFLINE || null;
  var HISTORY_LIMIT = 15;
  var CACHE_LIMIT = 120;
  var TRIM_DAY = 10;

  var THEMES = [
    { id: "omarchy", name: "Omarchy", palette: { bg: "#0c1512", fg: "#c1c497", accent: "#509475", muted: "#53685b" } },
    { id: "midnight", name: "Midnight", palette: { bg: "#070a15", fg: "#aab8d0", accent: "#4f7fd6", muted: "#5a6882" } },
    { id: "matrix", name: "Matrix", palette: { bg: "#010b04", fg: "#7dff9a", accent: "#00ff66", muted: "#2f8f4f" } },
    { id: "purple", name: "Purple", palette: { bg: "#0c0818", fg: "#cfc3ea", accent: "#9a6fe0", muted: "#6a5c8a" } },
    { id: "amber", name: "Amber", palette: { bg: "#120c05", fg: "#d8b58a", accent: "#e8852d", muted: "#8a6b45" } },
    { id: "light", name: "Light", palette: { bg: "#eef2ea", fg: "#333b33", accent: "#2f8a5b", muted: "#6b7a6b" } },
    { id: "tokyo-night", name: "Tokyo Night", palette: { bg: "#16161e", fg: "#c0caf5", accent: "#7aa2f7", muted: "#565f89" } },
    { id: "catppuccin", name: "Catppuccin", palette: { bg: "#181825", fg: "#cdd6f4", accent: "#89b4fa", muted: "#6c7086" } },
    { id: "solitude", name: "Solitude", palette: { bg: "#0b1214", fg: "#c3d4d6", accent: "#6aa9b8", muted: "#5d757a" } },
    { id: "rose-pine", name: "Rose Pine", palette: { bg: "#191724", fg: "#e0def4", accent: "#9ccfd8", muted: "#6e6a86" } },
    { id: "sky-blue", name: "Sky Blue", palette: { bg: "#081427", fg: "#d6e4ff", accent: "#4da6ff", muted: "#5f7fa8" } },
    { id: "pokemon", name: "Pok\u00e9mon", palette: { bg: "#170b0e", fg: "#f0dcd8", accent: "#ff5c5c", muted: "#a06a6a" } },
    { id: "naruto", name: "Naruto", palette: { bg: "#100c07", fg: "#f0e0c4", accent: "#f97b22", muted: "#9a7f5a" } },
    { id: "stranger-things", name: "Stranger Things", palette: { bg: "#100509", fg: "#e8c8d0", accent: "#ff2e4d", muted: "#995b6b" } },
    { id: "retro-82", name: "Retro 82", palette: { bg: "#070905", fg: "#b7d98a", accent: "#7fd962", muted: "#5c7a46" } },
    { id: "noir", name: "Noir", palette: { bg: "#080808", fg: "#e2e2e2", accent: "#ffffff", muted: "#777777" } },
    { id: "pink", name: "Pink", palette: { bg: "#1a0a17", fg: "#f0cfe0", accent: "#ff7ac8", muted: "#a0658c" } }
  ];

  var state = {
    current: "",
    navHistory: [],
    histIdx: -1,
    pageStack: [],
    pageKey: "home",
    menuOpen: false,
    resSearchOpen: false,
    sugSeq: 0,
    navLock: false,
    isAndroid: false
  };

  var currentSpellBox = null;

  var speech = {
    supported: false,
    voices: [],
    loaded: false,
    pending: null,
    voiceTimer: null,
    nativeTried: false,
    webRetried: false
  };

  var store = {
    history: loadList(HIST_KEY),
    favorites: loadList(FAV_KEY),
    cache: loadCache()
  };

  function qs(id) { return document.getElementById(id); }

  var elHomeView = qs("home-view");
  var elResView = qs("res-view");
  var elHistPage = qs("hist-page");
  var elFavPage = qs("fav-page");
  var elThemesPage = qs("themes-page");
  var elAboutPage = qs("about-page");
  var elContent = qs("content");
  var elChips = qs("chips");
  var elMenuPanel = qs("menu-panel");
  var elMenuBtn = qs("btn-menu");
  var elBtnHome = qs("btn-home");
  var elBtnBack = qs("btn-back");
  var elBtnFwd = qs("btn-fwd");
  var elHistChips = qs("hist-chips");
  var elFavChips = qs("fav-chips");
  var elHistNone = qs("hist-none");
  var elFavNone = qs("fav-none");
  var elWotd = qs("wotd-word");
  var elResBar = qs("res-bar");
  var elBtnResSearch = qs("btn-res-search");
  var elThemesList = qs("themes-list");

  var homeBar = makeSearchbar();
  var resBar = makeSearchbar();
  qs("home-bar").appendChild(homeBar.root);
  qs("res-bar").appendChild(resBar.root);

  initCapacitor();
  initUI();

  function initUI() {
    speech.supported = !!(window.speechSynthesis && typeof window.speechSynthesis.speak === "function");
    loadVoices();
    applyTheme(loadTheme());
    elWotd.textContent = wotdWord();
    elWotd.addEventListener("click", function () { searchFrom(wotdWord()); });
    qs("btn-random").addEventListener("click", onRandom);
    elBtnResSearch.addEventListener("click", toggleSearchTools);
    elBtnHome.addEventListener("click", showHome);
    elBtnBack.addEventListener("click", onBackButton);
    elBtnFwd.addEventListener("click", function () { navDelta(1); });
    elMenuBtn.addEventListener("click", toggleMenu);
    qs("mi-themes").addEventListener("click", showThemesPage);
    qs("mi-hist").addEventListener("click", function () { showListPage("history"); });
    qs("mi-fav").addEventListener("click", function () { showListPage("favorites"); });
    qs("mi-about").addEventListener("click", showAboutPage);
    document.addEventListener("click", onAnyClick, true);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && state.menuOpen) closeMenu();
    });
    window.addEventListener("resize", function () {
      if (state.menuOpen) positionMenu();
      fitAscii();
    });
    fitAscii();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitAscii).catch(function () {});
    }
    renderListPage("history");
    renderListPage("favorites");
    renderThemesPage();
    updateNav();
  }

  function themeFor(id) {
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id) return THEMES[i];
    }
    return THEMES[0];
  }

  function fitAscii() {
    var a = qs("ascii");
    if (!a) return;
    var base = parseFloat(getComputedStyle(a).fontSize) || 6;
    var content = a.scrollWidth || 0;
    if (!content) return;
    var parent = a.parentNode;
    var avail = (parent && parent.clientWidth) || window.innerWidth;
    avail = Math.max(28, avail - 12);
    if (content <= avail) return;
    var scaled = base * (avail / content);
    var cap = 9.5;
    a.style.fontSize = Math.min(scaled, cap).toFixed(2) + "px";
    if (a.scrollWidth > avail + 1 && scaled > 1) {
      a.style.fontSize = (base * (avail / (a.scrollWidth || 1))).toFixed(2) + "px";
    }
  }

  function loadTheme() {
    var v = "";
    try { v = localStorage.getItem(THEME_KEY) || ""; } catch (e) {}
    return themeFor(v).id;
  }

  function applyTheme(id) {
    var t = themeFor(id);
    document.documentElement.setAttribute("data-theme", t.id);
    var meta = document.querySelector('meta[name="theme-color"]');
    var cs = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute("content", t.palette.bg);
    if (cs) cs.setAttribute("content", t.id === "light" ? "light" : "dark");
    try { localStorage.setItem(THEME_KEY, t.id); } catch (e) {}
    if (elThemesList && elThemesList.parentNode === elThemesPage) renderThemesPage();
  }

  function renderThemesPage() {
    if (!elThemesList) return;
    while (elThemesList.firstChild) elThemesList.removeChild(elThemesList.firstChild);
    var current = loadTheme();
    THEMES.forEach(function (t) {
      var row = el("button", {
        type: "button",
        class: "theme-row" + (t.id === current ? " selected" : "")
      });
      var name = el("span", { class: "theme-name", textContent: t.name });
      row.appendChild(name);
      var dots = el("span", { class: "theme-dots" });
      var p = t.palette;
      [p.accent, p.fg, p.muted].forEach(function (c) {
        dots.appendChild(el("span", { class: "theme-dot", style: "background:" + c + ";" }));
      });
      row.appendChild(dots);
      row.addEventListener("click", function () { applyTheme(t.id); });
      elThemesList.appendChild(row);
    });
  }

  function initCapacitor() {
    var cap = window.Capacitor;
    if (cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) {
      state.isAndroid = cap.getPlatform() === "android";
      if (cap.Plugins && cap.Plugins.App) {
        cap.Plugins.App.addListener("backButton", function (event) {
          handleBack();
        });
      }
      if (typeof cap.registerPlugin === "function") {
        try { cap.registerPlugin("TextToSpeech"); } catch (e) {}
      }
    }
  }

  function loadList(key) {
    try {
      var v = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(v)) return v.filter(function (x) { return typeof x === "string"; });
    } catch (e) {}
    return [];
  }

  function saveList(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
  }

  function loadCache() {
    try {
      var v = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      if (v && typeof v === "object") return v;
    } catch (e) {}
    return {};
  }

  function saveCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(store.cache)); } catch (e) {}
  }

  function getCached(word) {
    var k = word.toLowerCase();
    var e = store.cache[k];
    return e ? e : null;
  }

  function addToCache(word, part) {
    var k = word.toLowerCase();
    var e = store.cache[k] || { ts: Date.now() };
    for (var p in part) {
      if (Object.prototype.hasOwnProperty.call(part, p)) e[p] = part[p];
    }
    e.ts = Date.now();
    store.cache[k] = e;
    var keys = Object.keys(store.cache).sort(function (a, b) {
      return (store.cache[b].ts || 0) - (store.cache[a].ts || 0);
    });
    if (keys.length > CACHE_LIMIT) {
      var drop = {};
      keys.slice(0, CACHE_LIMIT).forEach(function (k2) { drop[k2] = store.cache[k2]; });
      store.cache = drop;
    }
    saveCache();
  }

  function recordSearch(word) {
    var hist = store.history.filter(function (w) { return w.toLowerCase() !== word.toLowerCase(); });
    hist.unshift(word);
    store.history = hist.slice(0, HISTORY_LIMIT);
    saveList(HIST_KEY, store.history);
  }

  function toggleFavorite(word) {
    var i = store.favorites.indexOf(word);
    if (i >= 0) store.favorites.splice(i, 1);
    else store.favorites.push(word);
    saveList(FAV_KEY, store.favorites);
  }

  function wotdWord() {
    var days = Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 86400000);
    var i = ((days % WOTD_WORDS.length) + WOTD_WORDS.length) % WOTD_WORDS.length;
    return WOTD_WORDS[i];
  }

  function randomWord() {
    return WOTD_WORDS[Math.floor(Math.random() * WOTD_WORDS.length)];
  }

  function apiGet(url, timeout) {
    timeout = timeout || 10000;
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, timeout);
    return fetch(url, {
      signal: ctl ? ctl.signal : undefined,
      headers: { "User-Agent": "OmaDict/6.0" }
    }).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    }).finally(function () { clearTimeout(t); });
  }

  function el(tag, props) {
    var node = document.createElement(tag);
    if (props) {
      for (var k in props) {
        if (Object.prototype.hasOwnProperty.call(props, k)) {
          if (k === "textContent") node.textContent = props[k];
          else node.setAttribute(k, props[k]);
        }
      }
    }
    return node;
  }

  function makeSearchbar() {
    var wrap = el("div", { class: "search-wrap" });
    var entry = el("input", {
      type: "text", class: "search-entry",
      placeholder: "search a word...", autocomplete: "off",
      enterkeyhint: "search"
    });
    var go = el("button", { type: "button", class: "go-btn", textContent: "go" });
    wrap.appendChild(entry);
    wrap.appendChild(go);
    var sugBox = el("div", { class: "sug", hidden: "true" });
    var root = el("div", { class: "searchbar-wrap" });
    root.appendChild(wrap);
    root.appendChild(sugBox);
    entry.addEventListener("input", function () { onType(bar); });
    entry.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { onSearch(bar); e.preventDefault(); }
    });
    entry.addEventListener("focus", function () {
      setTimeout(function () {
        if (bar.root.scrollIntoView) bar.root.scrollIntoView({ block: "nearest" });
      }, 100);
    });
    go.addEventListener("click", function () { onSearch(bar); });
    var bar = { root: root, entry: entry, go: go, sugBox: sugBox };
    return bar;
  }

  function activeBar() {
    return state.pageKey.indexOf("search:") === 0 ? resBar : homeBar;
  }

  function onType(bar) {
    var t = bar.entry.value.trim();
    if (state.navLock || t.length < 2) { hideSugAll(); return; }
    var seq = ++state.sugSeq;
    apiGet(DATAMUSE + "?sp=" + encodeURIComponent(t) + "&max=6", 5000)
      .then(function (data) {
        if (seq !== state.sugSeq) return;
        var words = (data || []).filter(function (d) { return d && d.word; })
          .map(function (d) { return d.word; });
        showSug(bar, words);
      })
      .catch(function () { offlineTypeSug(bar, t, seq); });
  }

  function offlineTypeSug(bar, t, seq) {
    if (!OFF || !OFF.words) return;
    if (seq !== state.sugSeq) return;
    var tl = t.toLowerCase();
    var words = [];
    var seen = {};
    for (var i = 0; i < OFF.words.length && words.length < 6; i++) {
      var w = OFF.words[i];
      var wl = w.toLowerCase();
      if (seen[wl]) continue;
      if (wl.indexOf(tl) === 0) { seen[wl] = true; words.push(w); }
    }
    if (!words.length) return;
    showSug(bar, words);
  }

  function showSug(bar, words) {
    var sb = bar.sugBox;
    while (sb.firstChild) sb.removeChild(sb.firstChild);
    if (!words || !words.length) { hideSugAll(); return; }
    words.forEach(function (w) {
      var b = el("button", { type: "button", class: "sug-item", textContent: w });
      b.addEventListener("click", function () { pickWord(w); });
      sb.appendChild(b);
    });
    sb.removeAttribute("hidden");
  }

  function pickWord(word) {
    var bar = activeBar();
    state.navLock = true;
    bar.entry.value = word;
    state.navLock = false;
    hideSugAll();
    onSearch(bar);
  }

  function hideSugAll() {
    [homeBar, resBar].forEach(function (b) { b.sugBox.setAttribute("hidden", "true"); });
  }

  function onSearch(bar) {
    var word = bar.entry.value.trim();
    if (!word) return;
    hideSugAll();
    searchWord(word);
  }

  function searchFrom(word) {
    var bar = activeBar();
    state.navLock = true;
    bar.entry.value = word;
    state.navLock = false;
    onSearch(bar);
  }

  function searchWord(word) {
    state.current = word;
    if (state.histIdx < state.navHistory.length - 1) {
      state.navHistory = state.navHistory.slice(0, state.histIdx + 1);
    }
    var last = state.navHistory[state.navHistory.length - 1];
    if (!state.navHistory.length || !last || last.toLowerCase() !== word.toLowerCase()) {
      state.navHistory.push(word);
    }
    state.histIdx = state.navHistory.length - 1;
    switchPage("search:" + word);
    updateNav();
    recordSearch(word);
    renderListPage("history");
    doLookup(word);
  }

  function switchPage(key) {
    var old = state.pageKey;
    if (old === key) return;
    state.pageStack.push(old);
    applyPage(key);
  }

  function applyPage(key) {
    state.pageKey = key;
    var showRes = key.indexOf("search:") === 0;
    elHomeView.hidden = key === "home" ? false : true;
    elResView.hidden = showRes ? false : true;
    elHistPage.hidden = key === "history" ? false : true;
    elFavPage.hidden = key === "favorites" ? false : true;
    elThemesPage.hidden = key === "themes" ? false : true;
    elAboutPage.hidden = key === "about" ? false : true;
    elMenuPanel.setAttribute("hidden", "true");
    state.menuOpen = false;
    if (showRes) {
      resBar.entry.value = key.slice(7);
      toggleSearchTools(false);
    }
    updateNav();
  }

  function toggleSearchTools(forceOpen) {
    var show = forceOpen !== undefined ? forceOpen : !state.resSearchOpen;
    state.resSearchOpen = show;
    if (show) {
      elResBar.removeAttribute("hidden");
      elBtnResSearch.setAttribute("aria-expanded", "true");
      setTimeout(function () {
        if (resBar.entry.focus) resBar.entry.focus();
      }, 60);
    } else {
      elResBar.setAttribute("hidden", "true");
      elBtnResSearch.setAttribute("aria-expanded", "false");
      hideSugAll();
    }
  }

  function showHome() {
    state.pageStack = [];
    applyPage("home");
    homeBar.entry.value = "";
    hideSugAll();
    closeMenu();
    updateNav();
  }

  function openPage(key, renderFn) {
    if (state.pageKey === key) {
      if (renderFn) renderFn();
      return;
    }
    state.pageStack.push(state.pageKey);
    applyPage(key);
    if (renderFn) renderFn();
    closeMenu();
  }

  function showListPage(kind) {
    var key = kind === "history" ? "history" : "favorites";
    openPage(key, function () { renderListPage(kind); });
  }

  function showThemesPage() {
    openPage("themes", renderThemesPage);
  }

  function showAboutPage() {
    openPage("about");
  }

  function closeMenu() {
    state.menuOpen = false;
    elMenuPanel.setAttribute("hidden", "true");
    elMenuPanel.style.top = "";
    elMenuPanel.style.left = "";
    elMenuPanel.style.right = "";
    elMenuBtn.setAttribute("aria-expanded", "false");
  }

  function positionMenu() {
    var app = qs("app");
    var appRect = app.getBoundingClientRect();
    var originX = appRect.left + (app.clientLeft || 0);
    var originY = appRect.top + (app.clientTop || 0);
    var rect = elMenuBtn.getBoundingClientRect();
    var appW = app.clientWidth || appRect.width;
    var gap = 4;
    var top = Math.round(rect.bottom - originY + gap);
    var panelW = elMenuPanel.offsetWidth || 172;
    var left = Math.round(rect.left - originX);
    var maxLeft = appW - panelW - 4;
    if (left > maxLeft) left = maxLeft;
    if (left < 4) left = 4;
    elMenuPanel.style.top = top + "px";
    elMenuPanel.style.left = left + "px";
    elMenuPanel.style.right = "auto";
  }

  function toggleMenu() {
    if (state.menuOpen) { closeMenu(); return; }
    state.menuOpen = true;
    elMenuPanel.removeAttribute("hidden");
    positionMenu();
    elMenuBtn.setAttribute("aria-expanded", "true");
  }

  function onAnyClick(e) {
    if (!state.menuOpen) return;
    var inPanel = elMenuPanel.contains(e.target) || e.target === elMenuPanel;
    if (inPanel || e.target === elMenuBtn || elMenuBtn.contains(e.target)) return;
    closeMenu();
  }

  function updateNav() {
    while (elChips.firstChild) elChips.removeChild(elChips.firstChild);
    elBtnBack.disabled = state.histIdx <= 0 && !canPageBack();
    elBtnFwd.disabled = state.histIdx >= state.navHistory.length - 1;
    if (!state.navHistory.length) { elBtnBack.disabled = !canPageBack(); elBtnFwd.disabled = true; return; }
    if (state.pageKey.indexOf("search:") === 0) {
      state.navHistory.forEach(function (w, i) {
        if (i === state.histIdx) {
          elChips.appendChild(el("div", { class: "nav-chip-on", textContent: w }));
        } else {
          var b = el("button", { type: "button", class: "nav-chip", textContent: w });
          (function (idx) {
            b.addEventListener("click", function () { goto(idx); });
          })(i);
          elChips.appendChild(b);
        }
      });
    }
  }

  function navDelta(d) {
    var i = state.histIdx + d;
    if (i >= 0 && i < state.navHistory.length) goto(i);
  }

  function goto(i) {
    state.histIdx = i;
    var w = state.navHistory[i];
    state.current = w;
    hideSugAll();
    doLookup(w);
    applyPage("search:" + w);
  }

  function renderListPage(kind) {
    if (kind === "history") {
      renderChips(elHistChips, store.history, elHistNone, "no searches yet", deleteHistoryWord);
    } else {
      renderChips(elFavChips, store.favorites, elFavNone, "no saved words yet", deleteFavoriteWord);
    }
  }

  function deleteHistoryWord(word) {
    store.history = store.history.filter(function (w) { return w !== word; });
    saveList(HIST_KEY, store.history);
    renderListPage("history");
  }

  function deleteFavoriteWord(word) {
    store.favorites = store.favorites.filter(function (w) { return w !== word; });
    saveList(FAV_KEY, store.favorites);
    renderListPage("favorites");
    var wl = (document.querySelector("#content .word") || {}).textContent;
    if (wl) {
      var favBtn = document.querySelector("#content .favorite");
      var on = store.favorites.indexOf(wl) >= 0;
      if (favBtn) {
        favBtn.textContent = on ? "\u2605" : "\u2606";
        favBtn.classList.toggle("favorite-on", on);
      }
    }
  }

  function renderChips(container, words, noneEl, emptyText, onDelete) {
    while (container.firstChild) container.removeChild(container.firstChild);
    if (!words.length) {
      noneEl.textContent = emptyText;
      noneEl.removeAttribute("hidden");
      return;
    }
    noneEl.setAttribute("hidden", "true");
    words.forEach(function (w) {
      var row = el("div", { class: "list-row" });
      var b = el("button", { type: "button", class: "chip", textContent: w });
      b.addEventListener("click", function () { searchFrom(w); });
      row.appendChild(b);
      if (onDelete) {
        var d = el("button", {
          type: "button", class: "del-btn", title: "remove \u201c" + w + "\u201d", textContent: "\u2715"
        });
        (function (word, btn) {
          btn.addEventListener("click", function () { onDelete(word); });
        })(w, d);
        row.appendChild(d);
      }
      container.appendChild(row);
    });
  }

  function isPageView(key) {
    return key === "themes" || key === "about" || key === "history" || key === "favorites";
  }

  function canPageBack() {
    return isPageView(state.pageKey) && state.pageStack.length > 0;
  }

  function onBackButton() {
    if (state.menuOpen) { closeMenu(); return; }
    if (canPageBack()) { handleBack(); return; }
    navDelta(-1);
  }

  function handleBack() {
    if (state.menuOpen) { closeMenu(); return; }
    if (state.pageStack.length) {
      var prev = state.pageStack.pop();
      if (prev.indexOf("search:") === 0) doLookup(prev.slice(7));
      applyPage(prev);
      return;
    }
    exitApp();
  }

  function exitApp() {
    var cap = window.Capacitor;
    if (cap && cap.Plugins && cap.Plugins.App && cap.Plugins.App.exitApp) {
      cap.Plugins.App.exitApp();
    }
  }

  function doLookup(word) {
    state.current = word;
    clearContent();
    var defsBox = el("div", { class: "defs-box" });
    var spellBox = el("div", { class: "rel-box" });
    var synBox = el("div", { class: "rel-box" });
    var antBox = el("div", { class: "rel-box" });
    var relBox = el("div", { class: "rel-box" });
    var exBox = el("div", { class: "rel-box" });
    var etymBox = el("div", { class: "rel-box" });
    elContent.appendChild(defsBox);
    elContent.appendChild(spellBox);
    elContent.appendChild(synBox);
    elContent.appendChild(antBox);
    elContent.appendChild(relBox);
    elContent.appendChild(exBox);
    elContent.appendChild(etymBox);
    var loading = el("div", { class: "loading", textContent: "looking up \u201c" + word + "\u201d..." });
    defsBox.appendChild(loading);
    currentSpellBox = spellBox;
    fetchDefs(word, defsBox);
    fetchSpelling(word, spellBox);
    fetchSection(word, synBox, fetchSyns, renderSyns);
    fetchSection(word, antBox, fetchAnts, renderAnts);
    fetchSection(word, relBox, fetchRels, renderRels);
    fetchSection(word, exBox, fetchExs, renderExs);
    fetchEtym(word, etymBox);
  }

  function fetchSpelling(word, box) {
    apiGet(SUGMUSE + "?s=" + encodeURIComponent(word) + "&max=6", 6000)
      .then(function (data) {
        renderSpelling(word, box, data);
      })
      .catch(function () {
        var cand = offlineSpelling(word);
        if (cand.length) {
          renderSpelling(word, box, cand.map(function (w) { return { word: w }; }));
        } else {
          clearBox(box);
        }
      });
  }

  function offlineSpelling(word) {
    if (!OFF || !OFF.words || !OFF.words.length) return [];
    var wl = word.toLowerCase();
    if (OFF.data && OFF.data[wl]) return [];
    var out = [];
    var seen = {};
    for (var i = 0; i < OFF.words.length && out.length < 6; i++) {
      var c = OFF.words[i];
      var cl = c.toLowerCase();
      if (cl === wl || seen[cl]) continue;
      if (editDist(cl, wl) <= 2 || (wl.length >= 3 && cl.length >= wl.length + 3 && cl.indexOf(wl) === 0)) {
        seen[cl] = true;
        out.push(c);
      }
    }
    return out;
  }

  function editDist(a, b) {
    var m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    var prev = new Array(n + 1);
    for (var j = 0; j <= n; j++) prev[j] = j;
    for (var i = 1; i <= m; i++) {
      var cur = [i];
      for (var j = 1; j <= n; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = cur;
    }
    return prev[n];
  }

  function renderSpelling(word, box, data) {
    if (state.current !== word && state.pageKey !== "search:" + word) return;
    if (box.parentNode !== elContent) return;
    clearBox(box);
    var wl = word.toLowerCase();
    var words = (data || []).filter(function (x) { return x && x.word; })
      .map(function (x) { return x.word; })
      .filter(function (w) { return w.toLowerCase() !== wl; });
    if (!words.length) return;
    var sec = el("div", { class: "section", textContent: "DID YOU MEAN" });
    var flow = el("div", { class: "chips-flow" });
    words.forEach(function (s) {
      var b = el("button", { type: "button", class: "chip", textContent: s });
      b.addEventListener("click", function () { searchFrom(s); });
      flow.appendChild(b);
    });
    box.appendChild(sec);
    box.appendChild(flow);
  }

  function clearContent() {
    while (elContent.firstChild) elContent.removeChild(elContent.firstChild);
  }

  function fetchDefs(word, box) {
    apiGet(DATAMUSE + "?sp=" + encodeURIComponent(word) + "&md=dr&max=1", 10000)
      .then(function (data) {
        addToCache(word, { defs: data });
        renderDefs(word, box, data, false);
      })
      .catch(function () {
        var cached = getCached(word);
        if (cached && cached.defs) {
          renderDefs(word, box, cached.defs, true);
          return;
        }
        var off = OFF && OFF.data ? OFF.data[word.toLowerCase()] : null;
        if (off && off.defs && off.defs.defs && off.defs.defs.length) {
          renderDefs(word, box, [{
            word: word,
            tags: off.defs.tags || [],
            defs: off.defs.defs
          }], true);
        } else if (off && (off.syns || off.ants || off.rels).length) {
          renderDefsOffline(word, box, "nodef");
        } else if (OFF) {
          renderDefsOffline(word, box, "nomatch");
        } else {
          renderDefsOffline(word, box, "nodict");
        }
      });
  }

  function renderDefsOffline(word, box, reason) {
    clearBox(box);
    var msg;
    if (reason === "nodef") {
      msg = "\u201c" + word + "\u201d has no definition in the built-in dictionary, and no internet connection is available.";
    } else if (reason === "nodict") {
      msg = "\u201c" + word + "\u201d is not cached and no internet connection is available.";
    } else {
      msg = "\u201c" + word + "\u201d is not in the built-in dictionary, and no internet connection is available.";
    }
    var l = el("div", { class: "none", textContent: msg });
    box.appendChild(l);
  }

  function fetchSection(word, box, fetchFn, renderFn) {
    var key = sectionKey(fetchFn);
    fetchFn(word)
      .then(function (data) {
        var cachePart = {};
        cachePart[key] = data;
        addToCache(word, cachePart);
        renderFn(word, box, data, false);
      })
      .catch(function () {
        var cached = getCached(word);
        var val = cached ? cached[key] : null;
        if (val !== undefined && val !== null) {
          renderFn(word, box, val, true);
        } else {
          var offv = offlineSection(word, key);
          if (offv) renderFn(word, box, offv, true);
          else renderFn(word, box, null, false);
        }
      });
  }

  function offlineSection(word, key) {
    if (!OFF || !OFF.data) return null;
    var e = OFF.data[word.toLowerCase()];
    if (!e || !e[key]) return null;
    var val = e[key];
    if (!val.length) return null;
    if (key === "exs") return val.slice();
    return val.map(function (w) { return { word: w }; });
  }

  function sectionKey(fetchFn) {
    if (fetchFn === fetchSyns) return "syns";
    if (fetchFn === fetchAnts) return "ants";
    if (fetchFn === fetchRels) return "rels";
    if (fetchFn === fetchExs) return "exs";
    return "data";
  }

  function fetchSyns(word) {
    return apiGet(DATAMUSE + "?rel_syn=" + encodeURIComponent(word) + "&max=12", 8000);
  }

  function fetchAnts(word) {
    return apiGet(DATAMUSE + "?rel_ant=" + encodeURIComponent(word) + "&max=12", 8000);
  }

  function fetchRels(word) {
    return apiGet(DATAMUSE + "?ml=" + encodeURIComponent(word) + "&max=12", 8000);
  }

  function fetchExs(word) {
    var offv = offlineSection(word, "exs");
    if (offv && offv.length) return Promise.resolve(offv);
    return apiGet(DATAMUSE + "?ml=" + encodeURIComponent(word) + "&md=d&max=8", 6000)
      .catch(function () { return []; })
      .then(function (lex) {
        var defsTxt = [];
        (lex || []).forEach(function (x) {
          (x.defs || []).forEach(function (d) { defsTxt.push(d); });
        });
        var exs = extractExamples(defsTxt);
        if (!exs.length) return fetchFreeExamples(word);
        return exs;
      });
  }

  function extractExamples(defsTxt) {
    var examples = [];
    defsTxt.forEach(function (t) {
      if (t.indexOf("\t") >= 0) t = t.split("\t", 2)[1];
      var m = t.match(/[Ee]\.g\.,\s*["\u201c]?([^"\u201d]+)["\u201d]/);
      if (m && m[1]) {
        var ex = m[1].trim();
        if (ex && ex.length > 8) examples.push(ex);
      }
    });
    return examples.slice(0, 3);
  }

  function fetchFreeExamples(word) {
    return apiGet(FREEDICT + "/" + encodeURIComponent(word), 8000)
      .catch(function () { return []; })
      .then(function (data) {
        var exs = [];
        (data || []).forEach(function (e) {
          (e.meanings || []).forEach(function (m) {
            (m.definitions || []).forEach(function (d) {
              if (d.example) exs.push(d.example);
              if (exs.length >= 3) return;
            });
          });
        });
        return exs.slice(0, 3);
      });
  }

  function fetchEtym(word, box) {
    apiGet(FREEDICT + "/" + encodeURIComponent(word), 10000)
      .then(function (data) {
        var origin = "";
        (data || []).forEach(function (e) {
          if (!origin && e.origin) origin = e.origin;
        });
        addToCache(word, { etym: origin });
        renderEtym(word, box, origin);
      })
      .catch(function () {
        var cached = getCached(word);
        var val = cached ? cached.etym : "";
        if (val !== undefined) renderEtym(word, box, val);
      });
  }

  function renderEtym(word, box, origin) {
    if (state.current !== word && state.pageKey !== "search:" + word) return;
    if (box.parentNode !== elContent) return;
    clearBox(box);
    if (!origin) return;
    var sec = el("div", { class: "section", textContent: "ETYMOLOGY" });
    var p = el("div", { class: "etym", textContent: origin });
    box.appendChild(sec);
    box.appendChild(p);
  }

  function renderDefs(word, box, defs, fromCache) {
    if (state.current !== word && state.pageKey !== "search:" + word) return;
    if (box.parentNode !== elContent) return;
    clearBox(box);
    if (!defs || !defs.length) {
      var nf = el("div", { class: "none", textContent: "\u201c" + word + "\u201d not found" });
      box.appendChild(nf);
      return;
    }
    var entry = defs[0];
    var w = entry.word || word;
    var pron = null;
    (entry.tags || []).forEach(function (t) {
      if (t.indexOf("pron:") === 0 && !pron) pron = arpabetToIpa(t);
    });

    var row = el("div", { class: "word-row" });
    var wl = el("span", { class: "word", textContent: w });
    row.appendChild(wl);
    if (pron) row.appendChild(el("span", { class: "pron", textContent: pron }));
    row.appendChild(buildFavBtn(w));
    row.appendChild(buildSoundBtn(w));
    box.appendChild(row);

    if (fromCache) {
      box.appendChild(el("div", { class: "cached-banner", textContent: "offline \u2014 showing cached data" }));
    }

    var defsList = entry.defs || [];
    if (defsList.length) {
      box.appendChild(el("div", { class: "section", textContent: "DEFINITIONS" }));
      var byPos = {};
      defsList.forEach(function (raw) {
        var parts = parseDef(raw);
        var pos = parts[0];
        var m = parts[1];
        if (!byPos[pos]) byPos[pos] = [];
        byPos[pos].push(m);
      });
      var n = 1;
      Object.keys(byPos).forEach(function (pos) {
        var name = POS_NAMES[pos] || (pos ? pos.toUpperCase() : "");
        if (name) box.appendChild(el("div", { class: "pos", textContent: name }));
        byPos[pos].forEach(function (m) {
          var drow = el("div", { class: "def-row" });
          drow.appendChild(el("span", { class: "defnum", textContent: n + "." }));
          drow.appendChild(el("span", { class: "def", textContent: m }));
          drow.appendChild(buildCopyBtn(m));
          box.appendChild(drow);
          n++;
        });
      });
    }

    var looksMisspelled = defsList.some(function (raw) {
      return /misspelling/i.test(raw);
    });
    if (currentSpellBox && currentSpellBox.parentNode === elContent) {
      if (looksMisspelled) {
        box.appendChild(el("div", { class: "spell-note", textContent: "\u201c" + word + "\u201d may be misspelled\u2014try one of the suggestions below." }));
      } else {
        clearBox(currentSpellBox);
      }
    }
  }

  function parseDef(raw) {
    var idx = raw.indexOf("\t");
    if (idx >= 0) return [raw.slice(0, idx).trim(), raw.slice(idx + 1).trim()];
    return ["", raw];
  }

  function buildFavBtn(w) {
    var on = store.favorites.indexOf(w) >= 0;
    var b = el("button", {
      type: "button",
      class: "favorite" + (on ? " favorite-on" : ""),
      title: "save word",
      textContent: on ? "\u2605" : "\u2606"
    });
    b.addEventListener("click", function () {
      toggleFavorite(w);
      var nowOn = store.favorites.indexOf(w) >= 0;
      b.textContent = nowOn ? "\u2605" : "\u2606";
      if (nowOn) b.classList.add("favorite-on");
      else b.classList.remove("favorite-on");
      renderListPage("favorites");
    });
    return b;
  }

  function loadVoices() {
    var synth = window.speechSynthesis;
    if (!speech.supported || !synth) return;
    function refresh() {
      var v = synth.getVoices();
      if (v && v.length) { speech.voices = v; speech.loaded = true; }
    }
    function onChanged() {
      refresh();
      if (speech.loaded && speech.pending) {
        var p = speech.pending;
        speech.pending = null;
        if (speech.voiceTimer) { clearTimeout(speech.voiceTimer); speech.voiceTimer = null; }
        speakW(p.word, p.btn);
      }
    }
    try { refresh(); } catch (e) {}
    if (!speech.loaded) {
      try {
        synth.addEventListener("voiceschanged", onChanged);
        synth.onvoiceschanged = onChanged;
      } catch (e) {}
    }
  }

  function nativeTTS() {
    var cap = window.Capacitor;
    if (!cap || !cap.Plugins) return null;
    var tts = cap.Plugins.TextToSpeech;
    if (tts && typeof tts.speak === "function") return tts;
    return null;
  }

  function speakNative(word, btn) {
    var tts = nativeTTS();
    if (!tts) return false;
    function safe(op) {
      try {
        var r = op();
        if (r && typeof r.then === "function") r.catch(function () {});
      } catch (e) {
        showSpeechMsg(btn, "speech engine error \u2014 check your device text-to-speech settings");
      }
    }
    safe(function () { if (tts.stop) tts.stop(); });
    safe(function () {
      tts.speak({ text: String(word), lang: "en-US", rate: 1.0, queueStrategy: "flush" });
    });
    return true;
  }

  function speakW(word, btn) {
    var synth = window.speechSynthesis;
    var u = buildUtterance(word, btn);
    if (!u) return;
    if (synth && (synth.speaking || synth.pending)) {
      try { synth.cancel(); } catch (e) {}
    }
    synthSpeak(u);
  }

  function pickVoice() {
    var vs = speech.voices;
    if (!vs || !vs.length) return null;
    function score(v) {
      var lang = (v.lang || "").toLowerCase().replace("_", "-");
      var name = (v.name || "").toLowerCase();
      var s = 0;
      if (lang.indexOf("en-us") === 0) s += 100;
      else if (lang.indexOf("en-gb") === 0) s += 90;
      else if (lang.indexOf("en-") === 0) s += 80;
      if (v.localService) s += 2;
      if (name.indexOf("google") >= 0) s += 1;
      return s;
    }
    var best = vs[0];
    for (var i = 1; i < vs.length; i++) {
      if (score(vs[i]) > score(best)) best = vs[i];
    }
    return best;
  }

  function showSpeechMsg(btn, text, isWarn) {
    clearSpeechMsg();
    var msg = el("div", {
      class: "speech-msg" + (isWarn ? " speech-msg-warn" : ""),
      textContent: text
    });
    var row = (btn && btn.parentNode) || elContent;
    row.insertAdjacentElement("afterend", msg);
    setTimeout(function () { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 3500);
  }

  function clearSpeechMsg() {
    var nodes = document.querySelectorAll(".speech-msg");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }

  function synthSpeak(u) {
    if (!u) return;
    var synth = window.speechSynthesis;
    var attempts = 0;
    function go() {
      attempts++;
      if (synth && (synth.speaking || synth.pending)) {
        if (attempts < 30) { setTimeout(go, 40); return; }
        try { synth.cancel(); } catch (e) {}
        setTimeout(function () { try { synth.speak(u); } catch (e) {} }, 60);
        return;
      }
      try { synth.speak(u); } catch (e) { /* surfaced via u.onerror */ }
    }
    setTimeout(go, 60);
  }

  function buildUtterance(word, btn) {
    var synth = window.speechSynthesis;
    var u;
    try {
      u = new SpeechSynthesisUtterance(String(word));
    } catch (e) {
      if (!speech.nativeTried && state.isAndroid && nativeTTS()) {
        speech.nativeTried = true;
        speakNative(word, btn);
      } else {
        showSpeechMsg(btn, state.isAndroid
          ? "speech engine error \u2014 check your device text-to-speech settings"
          : "speech failed in this browser \u2014 try again");
      }
      return u;
    }
    u.rate = 0.92;
    u.pitch = 1;
    var started = false;
    var voice = pickVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang || "en-US";
    } else {
      u.lang = "en-US";
    }
    u.onstart = function () { started = true; speech.nativeTried = false; };
    u.onend = function () {};
    u.onerror = function (ev) {
      var err = (ev && ev.error) || "unknown";
      if (err === "canceled" || err === "interrupted" || err === "end") {
        if (!started && state.isAndroid && !speech.nativeTried && nativeTTS()) {
          speech.nativeTried = true;
          speakNative(word, btn);
        }
        return;
      }
      if (!speech.nativeTried && state.isAndroid && nativeTTS()) {
        speech.nativeTried = true;
        speakNative(word, btn);
        return;
      }
      if (!speech.webRetried && synth) {
        speech.webRetried = true;
        try { synth.cancel(); } catch (e) {}
        setTimeout(function () { synthSpeak(buildUtterance(word, btn)); }, 60);
        return;
      }
      showSpeechMsg(btn, state.isAndroid
        ? "speech engine error \u2014 check your device text-to-speech settings"
        : "speech failed in this browser \u2014 try again");
    };
    return u;
  }

  function speak(word, btn) {
    clearSpeechMsg();
    speech.nativeTried = false;
    speech.webRetried = false;
    var synth = window.speechSynthesis;

    if (!speech.supported || !synth) {
      if (speakNative(word, btn)) return;
      showSpeechMsg(btn, "no speech engine available \u2014 enable text-to-speech in your device settings");
      return;
    }

    if (!speech.loaded) {
      try {
        var v = synth.getVoices();
        if (v && v.length) { speech.voices = v; speech.loaded = true; }
      } catch (e) {}
    }

    if (!speech.loaded) {
      speech.pending = { word: word, btn: btn };
      if (speech.voiceTimer) clearTimeout(speech.voiceTimer);
      speech.voiceTimer = setTimeout(function () {
        speech.pending = null;
        speech.voiceTimer = null;
        speakW(word, btn);
      }, 900);
      return;
    }
    speakW(word, btn);
  }

  function buildSoundBtn(w) {
    var b = el("button", { type: "button", class: "sound", title: "pronounce", textContent: "\ud83d\udd0a" });
    b.addEventListener("click", function () { speak(w, b); });
    return b;
  }

  function buildCopyBtn(text) {
    var b = el("button", { type: "button", class: "copy-def", title: "copy definition", textContent: "\u29c9" });
    b.addEventListener("click", function () { copyText(text); });
    return b;
  }

  function copyText(text) {
    function showFeedback() {
      var old = qs("copy-feedback");
      if (old) old.remove();
      var fb = el("div", {
        id: "copy-feedback", class: "none",
        style: "color:var(--green);font-size:11px;padding:2px 0;",
        textContent: "definition copied"
      });
      elContent.appendChild(fb);
      setTimeout(function () {
        if (fb.parentNode) fb.parentNode.removeChild(fb);
      }, 1200);
    }
    var done = showFeedback;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e) {}
  }

  function renderSyns(word, box, syns, fromCache) {
    renderWordChips(word, box, "SYNONYMS", "chip-syn", syns, fromCache);
  }

  function renderAnts(word, box, ants, fromCache) {
    renderWordChips(word, box, "ANTONYMS", "chip-ant", ants, fromCache);
  }

  function renderRels(word, box, rels, fromCache) {
    var good = [];
    var seen = { [word.toLowerCase()]: true };
    var list = rels || [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var w = (r.word || "").trim();
      if (!w) continue;
      var key = w.toLowerCase();
      if (seen[key]) continue;
      var wl = word.toLowerCase();
      if (key === wl || key.indexOf(wl) === key.length - wl.length || wl.indexOf(key) === wl.length - key.length) continue;
      if (good.length >= 3 && w.length > word.length) continue;
      seen[key] = true;
      good.push(w);
      if (good.length >= 8) break;
    }
    renderWordChips(word, box, "RELATED WORDS", "chip-rel", good.map(function (w) { return { word: w }; }), fromCache);
  }

  function renderWordChips(word, box, title, cls, arr, fromCache) {
    if (state.current !== word && state.pageKey !== "search:" + word) return;
    if (box.parentNode !== elContent) return;
    clearBox(box);
    var words = (arr || []).filter(function (x) { return x && x.word; }).map(function (x) { return x.word; });
    if (!words.length) return;
    if (title === "RELATED WORDS" && words.length < 3) return;
    var sec = el("div", { class: "section", textContent: title });
    box.appendChild(sec);
    var flow = el("div", { class: "chips-flow" });
    words.forEach(function (w) {
      var b = el("button", { type: "button", class: "chip " + cls, textContent: w });
      b.addEventListener("click", function () { searchFrom(w); });
      flow.appendChild(b);
    });
    box.appendChild(flow);
  }

  function renderExs(word, box, exs, fromCache) {
    if (state.current !== word && state.pageKey !== "search:" + word) return;
    if (box.parentNode !== elContent) return;
    clearBox(box);
    var list = exs || [];
    if (!list.length) return;
    box.appendChild(el("div", { class: "section", textContent: "EXAMPLES" }));
    list.forEach(function (ex) {
      box.appendChild(el("div", { class: "ex", textContent: "\u201c" + ex + "\u201d" }));
    });
  }

  function clearBox(box) {
    while (box.firstChild) box.removeChild(box.firstChild);
  }

  function onRandom() {
    searchFrom(randomWord());
  }

  function arpabetToIpa(tag) {
    var s = (tag.slice(5) || "").trim();
    if (!s) return null;
    var sylls = [];
    var cur = [];
    var toks = s.split(/\s+/);
    for (var i = 0; i < toks.length; i++) {
      var tok = toks[i];
      var st = "";
      if (/[012]$/.test(tok)) {
        st = tok.slice(-1);
        tok = tok.slice(0, -1);
      }
      var ipa = ARPA_VOWELS[tok];
      if (ipa === undefined) ipa = ARPA_CONSONANTS[tok];
      if (ipa === undefined) return null;
      if (tok === "AH") ipa = (!st || st === "0") ? "\u0259" : "\u028c";
      if (Object.prototype.hasOwnProperty.call(ARPA_VOWELS, tok)) {
        if (st === "1") sylls.push("\u02c8" + cur.join("") + ipa);
        else if (st === "2") sylls.push("\u02cc" + cur.join("") + ipa);
        else sylls.push(cur.join("") + ipa);
        cur = [];
      } else {
        cur.push(ipa);
      }
    }
    return "/" + sylls.join("") + cur.join("") + "/";
  }

  window.__omadict = {
    getState: function () {
      return {
        pageKey: state.pageKey,
        pageStack: state.pageStack.slice(),
        menuOpen: state.menuOpen,
        histIdx: state.histIdx,
        navHistory: state.navHistory.slice(),
        current: state.current
      };
    },
    back: handleBack,
    showHome: showHome,
    searchFrom: searchFrom
  };
})();