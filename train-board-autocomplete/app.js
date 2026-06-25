:root {
  color-scheme: dark;
  --bg: #07111f;
  --panel: rgba(12, 25, 45, 0.88);
  --panel-strong: #0f223d;
  --text: #f4f7fb;
  --muted: #9fb1c9;
  --line: rgba(255, 255, 255, 0.12);
  --accent: #7dd3fc;
  --accent-strong: #38bdf8;
  --good: #4ade80;
  --warn: #fbbf24;
  --bad: #fb7185;
  --shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.22), transparent 32rem),
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.16), transparent 28rem),
    var(--bg);
  color: var(--text);
}

.shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 36px 0;
}

.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.eyebrow {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  margin: 0 0 8px;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(2.2rem, 7vw, 5.4rem);
  line-height: 0.88;
  letter-spacing: -0.07em;
  margin: 0;
}

.subtitle {
  color: var(--muted);
  font-size: 1.05rem;
  margin: 16px 0 0;
}

.clock {
  min-width: 160px;
  padding: 18px 22px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
  text-align: right;
  box-shadow: var(--shadow);
}

.clock span {
  display: block;
  font-size: 2.1rem;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.clock small { color: var(--muted); }

.panel {
  border: 1px solid var(--line);
  border-radius: 30px;
  background: var(--panel);
  box-shadow: var(--shadow);
  overflow: visible;
  backdrop-filter: blur(18px);
}

.controls {
  position: relative;
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 160px 130px auto auto;
  gap: 14px;
  padding: 22px;
  border-bottom: 1px solid var(--line);
}

.field { display: grid; gap: 8px; }
.field span { color: var(--muted); font-size: 0.82rem; font-weight: 700; }
.field-help { margin: -2px 0 0; color: var(--muted); font-size: 0.78rem; }

input, select, button {
  height: 46px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--text);
  font: inherit;
}

input, select {
  width: 100%;
  background: rgba(255, 255, 255, 0.07);
  padding: 0 14px;
  outline: none;
}

input:focus, select:focus { border-color: var(--accent); }

.combo { display: flex; gap: 8px; }
.combo input { flex: 1; }
.combo button { width: 48px; font-size: 1.5rem; }

button {
  cursor: pointer;
  font-weight: 800;
  padding: 0 18px;
  transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
}

button:hover { transform: translateY(-1px); }
button:active { transform: translateY(0); }

.primary {
  align-self: end;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #03111f;
  border-color: transparent;
}

.ghost, .combo button, .favorite-chip {
  align-self: end;
  background: rgba(255, 255, 255, 0.07);
}

.station-field { position: relative; }
.station-results {
  position: absolute;
  z-index: 5;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  max-height: 330px;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: #0b1930;
  box-shadow: var(--shadow);
  padding: 8px;
}

.station-option {
  width: 100%;
  height: auto;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: transparent;
  border-color: transparent;
  text-align: left;
}

.station-option:hover, .station-option.active { background: rgba(255, 255, 255, 0.08); }
.station-option span { color: var(--muted); }
.station-option mark { background: rgba(125, 211, 252, 0.18); color: var(--accent); border-radius: 5px; padding: 0 2px; }

.favorites {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 22px 18px;
}

.favorite-chip {
  height: 34px;
  border-radius: 999px;
  font-size: 0.86rem;
  color: var(--muted);
}

.status-strip {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 22px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.035);
  color: var(--muted);
}

.status-strip strong { color: var(--text); margin-right: 8px; }
.status-strip span { color: var(--accent); font-weight: 800; }

.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 760px; }
th, td { padding: 17px 22px; border-bottom: 1px solid var(--line); text-align: left; }
th { color: var(--muted); font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; }
td { font-size: 1.02rem; }
.train-id { font-weight: 900; color: var(--accent); }
.direction { font-weight: 750; }
.time { font-variant-numeric: tabular-nums; font-weight: 850; }
.track { font-weight: 900; font-size: 1.2rem; }
.badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 7px 11px; font-size: 0.82rem; font-weight: 900; }
.badge.good { background: rgba(74, 222, 128, 0.13); color: var(--good); }
.badge.warn { background: rgba(251, 191, 36, 0.13); color: var(--warn); }
.badge.bad { background: rgba(251, 113, 133, 0.13); color: var(--bad); }
.empty { color: var(--muted); text-align: center; padding: 48px 22px; }
.hint { margin: 0; padding: 18px 22px 22px; color: var(--muted); font-size: 0.9rem; }

body.board-mode .shell { width: min(1500px, calc(100% - 24px)); padding: 18px 0; }
body.board-mode .controls, body.board-mode .favorites, body.board-mode .hint { display: none; }
body.board-mode h1 { font-size: clamp(3rem, 8vw, 7rem); }
body.board-mode td { font-size: clamp(1.1rem, 2vw, 2rem); }
body.board-mode th { font-size: 0.95rem; }
body.board-mode .panel { border-radius: 18px; }

@media (max-width: 900px) {
  .hero { align-items: stretch; flex-direction: column; }
  .clock { text-align: left; }
  .controls { grid-template-columns: 1fr 1fr; }
  .station-field { grid-column: 1 / -1; }
  .primary, .ghost { width: 100%; }
}

@media (max-width: 560px) {
  .shell { width: min(100% - 20px, 1180px); padding: 18px 0; }
  .controls { grid-template-columns: 1fr; padding: 16px; }
  .status-strip { flex-direction: column; padding: 16px; }
  th, td { padding: 14px 16px; }
}
