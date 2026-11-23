import { storage } from './storage.js';
import * as libre from './librelinkup.js';
import { demoData, HOUR, normalize, STALE, TRENDS } from './glucose.js';
import { displayGlucose, MG_PER_MMOL, preferences, SETTINGS } from './settings.js';

const get = id => document.getElementById(id);
const store = storage;
const settingsStore = chrome.storage.local;
const timeFormat = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' });
let settings = preferences({});
let activeTab = 'glucose';
let session;
let selected;
let readings;
let choices = [];
let preview = false;
let busy = false;
let nextAutoRefresh = 0;

function message(text = '') {
  get('message').textContent = text;
  get('message').hidden = !text;
}

function setBusy(value) {
  busy = value;
  for (const element of document.querySelectorAll('form input, form button, #refresh, #demo, #patient, #signout')) {
    element.disabled = value;
  }
  get('login-form').querySelector('button').textContent = value ? 'Conectando…' : 'Conectar cuenta';
  get('dashboard').setAttribute('aria-busy', String(value));
}

function render() {
  const connected = Boolean(session || preview);
  get('login-view').hidden = connected;
  get('dashboard').hidden = !connected;
  get('refresh').hidden = !session || activeTab !== 'glucose';
  if (!connected || activeTab !== 'glucose') return;

  get('source').textContent = preview ? 'Datos de ejemplo' : 'LibreLinkUp';
  get('signout').textContent = preview ? 'Salir de la demo' : 'Cerrar sesión';
  get('connection-field').hidden = preview || choices.length < 2;

  const now = Date.now();
  const current = readings?.current;
  const old = current && now - current.time >= STALE;
  const trend = current && !old ? TRENDS[current.trend] : null;
  get('value').textContent = current ? displayGlucose(current.value, settings.unit) : '—';
  get('units').textContent = settings.unit;
  get('units').hidden = !current;
  get('chart-units').textContent = settings.unit;
  get('trend').hidden = !trend;
  get('trend').dataset.arrow = trend ? String(current.trend) : '';
  get('arrow').textContent = trend?.[0] ?? '';
  get('arrow').hidden = !trend;
  get('trend-label').textContent = trend?.[1] ?? '';

  const status = get('reading-status');
  status.textContent = preview ? 'Simulación' : old ? 'Lectura atrasada' : !current ? 'Sin lectura' : '';
  status.dataset.state = old ? 'stale' : 'muted';
  const readingTime = get('reading-time');
  readingTime.textContent = '';
  readingTime.removeAttribute('datetime');
  if (current) {
    const date = new Date(current.time);
    const sameDay = date.toDateString() === new Date(now).toDateString();
    readingTime.setAttribute('datetime', date.toISOString());
    readingTime.textContent = sameDay ? timeFormat.format(date) : dateFormat.format(date);
  }
  drawChart(readings?.history ?? [], now, current);
}

function drawChart(history, now, current) {
  const start = now - 3 * HOUR;
  const points = history.filter(point => point.time >= start && point.time <= now);
  const canvas = get('plot');
  const empty = get('chart-empty');
  empty.hidden = Boolean(points.length);
  canvas.hidden = !points.length;
  if (!points.length) {
    empty.textContent = 'Sin datos para este intervalo.';
    return;
  }
  canvas.setAttribute('aria-label', 'Gráfica de glucosa en ' + settings.unit + ' de las últimas tres horas. ' + points.length + ' lecturas.');
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    empty.textContent = 'No se pudo dibujar la gráfica.';
    empty.hidden = false;
    canvas.hidden = true;
    return;
  }
  ctx.scale(ratio, ratio);
  const scanner = settings.theme === 'cyberpunk';
  const top = 11;
  const bottom = h - 25;
  const left = 31;
  const right = w - (scanner ? 9 : 6);
  const mmol = settings.unit === 'mmol/L';
  const divisor = mmol ? MG_PER_MMOL : 1;
  const min = Math.min(...points.map(point => point.value)) / divisor;
  const max = Math.max(...points.map(point => point.value)) / divisor;
  const interval = mmol ? 1 : 20;
  const margin = mmol ? 0.4 : 7;
  const step = Math.max(interval, Math.ceil((max - min) / (3 * interval)) * interval);
  const lower = Math.max(0, Math.floor((min - margin) / step) * step);
  const upper = Math.max(lower + 2 * step, Math.ceil((max + margin) / step) * step);
  const x = time => left + (time - start) / (3 * HOUR) * (right - left);
  const y = value => bottom - (value - lower) / (upper - lower) * (bottom - top);

  const css = window.getComputedStyle(document.documentElement);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = css.getPropertyValue('--muted').trim();
  ctx.strokeStyle = css.getPropertyValue('--plot-grid').trim();
  ctx.textBaseline = 'middle';
  for (let tick = lower; tick <= upper; tick += step) {
    const lineY = y(tick);
    ctx.fillText(String(tick), 0, lineY);
    ctx.beginPath();
    ctx.moveTo(left, lineY);
    ctx.lineTo(right, lineY);
    ctx.stroke();
  }
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  const localNow = new Date(now);
  const lastHour = now - localNow.getMinutes() * 60_000 - localNow.getSeconds() * 1000 - localNow.getMilliseconds();
  let previousLabelEnd = -Infinity;
  for (let hour = lastHour - 3 * HOUR; hour <= lastHour; hour += HOUR) {
    if (hour < start) continue;
    const axisX = x(hour);
    ctx.beginPath();
    ctx.moveTo(axisX, top);
    ctx.lineTo(axisX, bottom);
    ctx.stroke();

    const label = timeFormat.format(hour);
    const halfWidth = ctx.measureText(label).width / 2;
    const labelX = Math.max(left, Math.min(right - halfWidth, axisX));
    if (labelX - halfWidth < previousLabelEnd + 8) continue;
    ctx.fillText(label, labelX, h - 6);
    previousLabelEnd = labelX + halfWidth;
  }

  const plotColor = css.getPropertyValue('--plot-line').trim();
  const nodes = points.map(point => ({ time: point.time, x: x(point.time), y: y(point.value / divisor) }));
  const gap = 25 * 60_000;
  if (scanner) {
    const fill = ctx.createLinearGradient(0, top, 0, bottom);
    fill.addColorStop(0, '#63eeff40');
    fill.addColorStop(1, '#63eeff00');
    ctx.fillStyle = fill;
    let first = 0;
    for (let end = 1; end <= nodes.length; end++) {
      if (end < nodes.length && nodes[end].time - nodes[end - 1].time <= gap) continue;
      if (end - first > 1) {
        ctx.beginPath();
        ctx.moveTo(nodes[first].x, bottom);
        for (let i = first; i < end; i++) ctx.lineTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[end - 1].x, bottom);
        ctx.closePath();
        ctx.fill();
      }
      first = end;
    }
    const latest = nodes.find(node => node.time === current?.time);
    if (latest) {
      ctx.save();
      ctx.strokeStyle = '#63eeff85';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(latest.x, top);
      ctx.lineTo(latest.x, bottom);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.strokeStyle = plotColor;
  ctx.fillStyle = plotColor;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (let i = 0; i < nodes.length; i++) {
    const point = nodes[i];
    const before = nodes[i - 1];
    if (before && point.time - before.time <= gap) {
      ctx.beginPath();
      ctx.moveTo(before.x, before.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  }
  for (const point of nodes) {
    const latest = point.time === current?.time;
    ctx.beginPath();
    ctx.arc(point.x, point.y, latest ? 3.8 : 1.4, 0, 2 * Math.PI);
    ctx.fill();
    if (scanner && latest) {
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeRect(point.x - 6.5, point.y - 6.5, 13, 13);
      ctx.restore();
    }
  }
}

function setOptions() {
  const options = choices.map(({ id, name }, index) => new Option(name || 'Conexión ' + (index + 1), id));
  get('patient').replaceChildren(...options);
  if (choices.length > 1 && !selected) {
    const placeholder = new Option('Elige tus lecturas', '', true, true);
    placeholder.disabled = true;
    get('patient').prepend(placeholder);
  }
  if (selected) get('patient').value = selected;
}

async function clearSession() {
  session = undefined;
  selected = undefined;
  choices = [];
  readings = undefined;
  await store.remove(['lluSession', 'selectedPatient', 'glucoseMonitor']);
}

async function refresh() {
  let loadedConnections = false;
  if (!choices.length) {
    choices = await libre.connections(session);
    loadedConnections = true;
    const previous = selected;
    if (!choices.some(item => item.id === selected)) selected = undefined;
    if (choices.length === 1) selected = choices[0].id;
    if (selected !== previous) {
      if (selected) await store.set({ selectedPatient: selected });
      else await store.remove('selectedPatient');
    }
    setOptions();
  }

  if (!choices.length) {
    message('Esta cuenta aún no recibe lecturas. Acepta la invitación en la app LibreLinkUp y vuelve a actualizar.');
    return;
  }
  if (!selected) return;

  const payload = await libre.graph(session, selected);
  readings = normalize(payload);
  if (!readings.current) {
    const listing = loadedConnections ? choices : await libre.connections(session);
    const connection = listing.find(item => item.id === selected);
    readings = normalize({
      graphData: payload?.graphData,
      connection: { glucoseMeasurement: connection?.current },
    });
  }
  if (!readings.current) {
    message('LibreLinkUp no devuelve una lectura válida con hora de medición.');
  } else if (!payload?.graphData?.length) {
    message('LibreLinkUp envió la lectura actual sin historial.');
  }
}

async function run(task) {
  if (busy) return;
  message();
  setBusy(true);
  try {
    await task();
  } catch (error) {
    if (error.code === 'expired') await clearSession();
    if (error.code === 'rate') nextAutoRefresh = Date.now() + 5 * 60_000;
    message(error instanceof libre.LibreError
      ? error.message
      : 'No se pudo completar la operación. Vuelve a intentarlo.');
  } finally {
    setBusy(false);
    render();
  }
}

get('login-form').addEventListener('submit', event => {
  event.preventDefault();
  const email = get('email').value.trim();
  const password = get('password').value;
  get('password').value = '';
  void run(async () => {
    session = await libre.login(email, password);
    get('email').value = '';
    await store.set({ lluSession: session });
    render();
    await refresh();
  });
});

get('refresh').addEventListener('click', () => { void run(refresh); });
get('patient').addEventListener('change', () => {
  selected = get('patient').value;
  readings = undefined;
  setOptions();
  render();
  void run(async () => {
    await store.set({ selectedPatient: selected });
    await refresh();
  });
});

get('demo').addEventListener('click', () => {
  preview = true;
  readings = demoData(Date.now());
  message();
  render();
});

get('signout').addEventListener('click', () => {
  void run(async () => {
    preview = false;
    await clearSession();
  });
});

function switchTab(tab, focus = false) {
  activeTab = tab;
  for (const name of ['glucose', 'settings']) {
    const button = get(name + '-tab');
    const active = name === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    get(name + '-pane').hidden = !active;
    if (active && focus) button.focus();
  }
  render();
}

for (const name of ['glucose', 'settings']) {
  const tab = get(name + '-tab');
  tab.addEventListener('click', () => switchTab(name));
  tab.addEventListener('keydown', event => {
    const alternate = name === 'glucose' ? 'settings' : 'glucose';
    const next = { ArrowLeft: alternate, ArrowRight: alternate, Home: 'glucose', End: 'settings' }[event.key];
    if (!next) return;
    event.preventDefault();
    switchTab(next, true);
  });
}

function applySettings() {
  document.documentElement.dataset.theme = settings.theme;
  get('unit-setting').value = settings.unit;
  get('theme-setting').value = settings.theme;
  get('alerts-setting').checked = settings.trendAlerts;
  render();
}

const fields = { 'unit-setting': 'unit', 'theme-setting': 'theme', 'alerts-setting': 'trendAlerts' };
for (const [id, key] of Object.entries(fields)) {
  get(id).addEventListener('change', async ({ target }) => {
    const value = key === 'trendAlerts' ? target.checked : target.value;
    target.disabled = true;
    get('settings-error').hidden = true;
    try {
      await settingsStore.set({ [key]: value });
      settings = preferences({ ...settings, [key]: value });
    } catch {
      get('settings-error').hidden = false;
    } finally {
      applySettings();
      target.disabled = false;
    }
  });
}

setInterval(() => {
  if (session && selected && !document.hidden && Date.now() >= nextAutoRefresh) void run(refresh);
}, 30_000);

void run(async () => {
  const [saved, savedSettings] = await Promise.all([
    store.get(['lluSession', 'selectedPatient']),
    settingsStore.get(SETTINGS),
  ]);
  settings = preferences(savedSettings);
  session = saved.lluSession;
  selected = saved.selectedPatient;
  applySettings();
  if (session) await refresh();
});
