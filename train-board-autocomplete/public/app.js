const state = {
  station: { name: "Jönköping C", signature: "Jö" },
  stations: [],
  highlightedStationIndex: -1,
  stationSearchAbort: null,
  refreshTimer: null,
};

const els = {
  stationSearch: document.querySelector("#stationSearch"),
  stationResults: document.querySelector("#stationResults"),
  stationTemplate: document.querySelector("#stationOptionTemplate"),
  favoriteBtn: document.querySelector("#favoriteBtn"),
  favorites: document.querySelector("#favorites"),
  activityType: document.querySelector("#activityType"),
  hoursAhead: document.querySelector("#hoursAhead"),
  refreshBtn: document.querySelector("#refreshBtn"),
  fullscreenBtn: document.querySelector("#fullscreenBtn"),
  trainRows: document.querySelector("#trainRows"),
  currentStationName: document.querySelector("#currentStationName"),
  currentStationSignature: document.querySelector("#currentStationSignature"),
  directionHeading: document.querySelector("#directionHeading"),
  lastUpdated: document.querySelector("#lastUpdated"),
  clockTime: document.querySelector("#clockTime"),
  clockDate: document.querySelector("#clockDate"),
};

const FAVORITES_KEY = "train-board-favorites-v1";

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value = new Date()) {
  return value.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
}

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  return Math.round((new Date(end) - new Date(start)) / 60000);
}

function normalizeLocation(location) {
  if (!location) return "—";
  if (Array.isArray(location)) {
    return location.map((item) => item?.LocationName || item).filter(Boolean).join(", ");
  }
  return location.LocationName || String(location);
}

function getDirection(train) {
  return els.activityType.value === "Avgang"
    ? normalizeLocation(train.ToLocation)
    : normalizeLocation(train.FromLocation);
}

function getStatus(train) {
  if (train.Canceled) return { text: "Cancelled", tone: "bad" };
  const estimate = train.EstimatedTimeAtLocation || train.TimeAtLocation;
  const delay = minutesBetween(train.AdvertisedTimeAtLocation, estimate);
  if (delay >= 5) return { text: `+${delay} min`, tone: "warn" };
  if (delay <= -2) return { text: `${delay} min`, tone: "good" };
  return { text: "On time", tone: "good" };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong");
  return payload;
}

function setLoading(message = "Loading trains…") {
  els.trainRows.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(message)}</td></tr>`;
}

function renderTrains(trains) {
  els.directionHeading.textContent = els.activityType.value === "Avgang" ? "Destination" : "Origin";

  if (!trains.length) {
    setLoading("No trains found for this station and time window.");
    return;
  }

  els.trainRows.innerHTML = trains.map((train) => {
    const status = getStatus(train);
    const estimated = train.EstimatedTimeAtLocation || train.TimeAtLocation || train.AdvertisedTimeAtLocation;
    const product = Array.isArray(train.ProductInformation) ? train.ProductInformation.join(", ") : train.ProductInformation;
    const title = [product, train.Operator].filter(Boolean).join(" • ");

    return `
      <tr title="${escapeHtml(title)}">
        <td><span class="train-id">${escapeHtml(train.AdvertisedTrainIdent || "—")}</span></td>
        <td><span class="direction">${escapeHtml(getDirection(train))}</span></td>
        <td><span class="time">${formatTime(train.AdvertisedTimeAtLocation)}</span></td>
        <td><span class="time">${formatTime(estimated)}</span></td>
        <td><span class="track">${escapeHtml(train.TrackAtLocation || "—")}</span></td>
        <td><span class="badge ${status.tone}">${escapeHtml(status.text)}</span></td>
      </tr>
    `;
  }).join("");
}

async function loadTrains() {
  setLoading();
  els.currentStationName.textContent = state.station.name;
  els.currentStationSignature.textContent = state.station.signature;

  try {
    const params = new URLSearchParams({
      station: state.station.signature,
      activity: els.activityType.value,
      hours: els.hoursAhead.value,
    });
    const trains = await api(`/api/trains?${params}`);
    renderTrains(trains);
    els.lastUpdated.textContent = `Last updated ${new Date().toLocaleTimeString("sv-SE")}`;
  } catch (error) {
    setLoading(error.message);
  }
}

function highlightMatch(value, query) {
  const safeValue = escapeHtml(value || "");
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) return safeValue;

  const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safeValue.replace(new RegExp(`(${escapedQuery})`, "ig"), "<mark>$1</mark>");
}

function openStationResults() {
  els.stationResults.hidden = false;
  els.stationSearch.setAttribute("aria-expanded", "true");
}

function closeStationResults() {
  els.stationResults.hidden = true;
  els.stationSearch.setAttribute("aria-expanded", "false");
  state.highlightedStationIndex = -1;
}

function setHighlightedStation(index) {
  const buttons = [...els.stationResults.querySelectorAll(".station-option")];
  if (!buttons.length) return;

  state.highlightedStationIndex = (index + buttons.length) % buttons.length;
  buttons.forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === state.highlightedStationIndex);
  });
  buttons[state.highlightedStationIndex].scrollIntoView({ block: "nearest" });
}

function renderStations(stations, query = "") {
  els.stationResults.innerHTML = "";
  state.highlightedStationIndex = -1;

  if (!stations.length) {
    els.stationResults.innerHTML = `<div class="empty">No matching stations found.</div>`;
    openStationResults();
    return;
  }

  stations.slice(0, 12).forEach((station) => {
    const node = els.stationTemplate.content.cloneNode(true);
    const button = node.querySelector("button");
    button.setAttribute("role", "option");
    button.querySelector("strong").innerHTML = highlightMatch(station.name || station.signature, query);
    button.querySelector("span").innerHTML = highlightMatch(station.signature, query);
    button.addEventListener("click", () => selectStation(station));
    els.stationResults.appendChild(node);
  });

  openStationResults();
}

async function searchStations(query) {
  if (!query || query.length < 2) {
    closeStationResults();
    return;
  }

  try {
    state.stationSearchAbort?.abort();
    state.stationSearchAbort = new AbortController();
    els.stationResults.innerHTML = `<div class="empty">Searching stations…</div>`;
    openStationResults();

    const stations = await api(`/api/stations?search=${encodeURIComponent(query)}`, {
      signal: state.stationSearchAbort.signal,
    });
    state.stations = stations;
    renderStations(stations, query);
  } catch (error) {
    if (error.name === "AbortError") return;
    els.stationResults.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    openStationResults();
  }
}

function selectStation(station) {
  state.station = station;
  els.stationSearch.value = `${station.name} (${station.signature})`;
  closeStationResults();
  updateFavoriteButton();
  loadTrains();
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; }
  catch { return []; }
}

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isFavorite(station = state.station) {
  return getFavorites().some((fav) => fav.signature === station.signature);
}

function updateFavoriteButton() {
  els.favoriteBtn.textContent = isFavorite() ? "★" : "☆";
  els.favoriteBtn.title = isFavorite() ? "Remove favorite station" : "Save favorite station";
}

function toggleFavorite() {
  const favorites = getFavorites();
  const exists = favorites.some((fav) => fav.signature === state.station.signature);
  const next = exists
    ? favorites.filter((fav) => fav.signature !== state.station.signature)
    : [...favorites, state.station];
  saveFavorites(next);
  updateFavoriteButton();
  renderFavorites();
}

function renderFavorites() {
  const favorites = getFavorites();
  els.favorites.innerHTML = "";
  favorites.forEach((station) => {
    const button = document.createElement("button");
    button.className = "favorite-chip";
    button.type = "button";
    button.textContent = `${station.name} (${station.signature})`;
    button.addEventListener("click", () => selectStation(station));
    els.favorites.appendChild(button);
  });
}

function tickClock() {
  const now = new Date();
  els.clockTime.textContent = now.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  els.clockDate.textContent = formatDate(now);
}

function setupAutoRefresh() {
  clearInterval(state.refreshTimer);
  state.refreshTimer = setInterval(loadTrains, 30000);
}

function wireEvents() {
  els.stationSearch.addEventListener("input", debounce((event) => searchStations(event.target.value.trim()), 250));
  els.stationSearch.addEventListener("focus", () => {
    if (state.stations.length) renderStations(state.stations, els.stationSearch.value.trim());
  });
  els.stationSearch.addEventListener("keydown", (event) => {
    const buttons = [...els.stationResults.querySelectorAll(".station-option")];
    if (els.stationResults.hidden || !buttons.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedStation(state.highlightedStationIndex + 1);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedStation(state.highlightedStationIndex - 1);
    }

    if (event.key === "Enter" && state.highlightedStationIndex >= 0) {
      event.preventDefault();
      buttons[state.highlightedStationIndex].click();
    }

    if (event.key === "Escape") closeStationResults();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".station-field")) closeStationResults();
  });
  els.activityType.addEventListener("change", loadTrains);
  els.hoursAhead.addEventListener("change", loadTrains);
  els.refreshBtn.addEventListener("click", loadTrains);
  els.favoriteBtn.addEventListener("click", toggleFavorite);
  els.fullscreenBtn.addEventListener("click", async () => {
    document.body.classList.toggle("board-mode");
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      await document.exitFullscreen?.().catch(() => {});
    }
  });
}

function init() {
  els.stationSearch.value = `${state.station.name} (${state.station.signature})`;
  wireEvents();
  renderFavorites();
  updateFavoriteButton();
  tickClock();
  setInterval(tickClock, 1000);
  loadTrains();
  setupAutoRefresh();
}

init();
