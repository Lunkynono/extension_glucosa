import { storage } from './storage.js';
import { connections, graph } from './librelinkup.js';
import { measurement, STALE } from './glucose.js';
import { displayGlucose, preferences, SETTINGS } from './settings.js';

const ALARM = 'diapreneur-trend';
const SESSION_KEYS = ['lluSession', 'selectedPatient', 'glucoseMonitor'];
const ACTION_TITLE = 'Diapreneur · Glucosa';
const store = storage;
const settingsStore = chrome.storage.local;
const DIRECTIONS = new Map([
  [1, 'down'], [2, 'down'], [3, 'flat'], [4, 'up'], [5, 'up'],
]);
const NOTIFICATIONS = {
  up: { title: '↗ Glucosa en subida', icon: 'icons/trend-up.png' },
  down: { title: '↘ Glucosa en bajada', icon: 'icons/trend-down.png' },
};

async function contextIsCurrent(session, patient) {
  const latest = await store.get(['lluSession', 'selectedPatient']);
  return latest.lluSession?.token === session.token &&
    latest.lluSession?.origin === session.origin && latest.selectedPatient === patient;
}

async function showBadge(reading, settings) {
  const fresh = reading && Date.now() - reading.time < STALE;
  const value = fresh ? displayGlucose(reading.value, settings.unit) : '';
  await Promise.all([
    chrome.action.setBadgeBackgroundColor({ color: settings.theme === 'cyberpunk' ? '#fcee47' : '#79f0c9' }),
    chrome.action.setBadgeTextColor({ color: '#10171a' }),
    chrome.action.setBadgeText({ text: value.length <= 4 ? value : '' }),
    chrome.action.setTitle({ title: value ? ACTION_TITLE + ' · ' + value + ' ' + settings.unit : ACTION_TITLE }),
  ]);
}

async function checkGlucose(readNow) {
  const [{ lluSession: session, selectedPatient: patient, glucoseMonitor }, savedSettings] = await Promise.all([
    store.get(SESSION_KEYS),
    settingsStore.get(SETTINGS),
  ]);
  const settings = preferences(savedSettings);
  if (!session || !patient) {
    await chrome.alarms.clear(ALARM);
    if (glucoseMonitor) await store.remove('glucoseMonitor');
    await showBadge(null, settings);
    return;
  }

  const scope = JSON.stringify([session.origin, session.accountId, patient]);
  const previous = glucoseMonitor?.scope === scope ? glucoseMonitor : { scope };
  if (session.expiresAt > 0 && session.expiresAt <= Date.now()) {
    await chrome.alarms.clear(ALARM);
    await store.remove(SESSION_KEYS);
    await showBadge(null, settings);
    return;
  }
  if (!await chrome.alarms.get(ALARM)) {
    await chrome.alarms.create(ALARM, { periodInMinutes: 0.5 });
  }
  await showBadge(previous.reading, settings);
  if (!readNow || previous.retryAt > Date.now()) return;

  let raw;
  try {
    const list = await connections(session);
    const match = list.find(item => item.id === patient);
    if (!match) return;
    raw = match.current;
    if (raw?.TrendArrow == null) {
      const payload = await graph(session, patient);
      raw = payload?.connection?.glucoseMeasurement ?? raw;
    }
  } catch (error) {
    if (!await contextIsCurrent(session, patient)) return;
    if (error.code === 'expired') {
      await chrome.alarms.clear(ALARM);
      await store.remove(SESSION_KEYS);
      await showBadge(null, settings);
    }
    if (error.code === 'rate') {
      await store.set({ glucoseMonitor: { ...previous, retryAt: Date.now() + 5 * 60_000 } });
    }
    return;
  }

  const now = Date.now();
  const current = measurement(raw, now);
  if (!current || now - current.time >= STALE || current.time < previous.reading?.time) return;
  const arrow = typeof current.trend === 'string' ? Number(current.trend) : current.trend;
  const direction = DIRECTIONS.get(arrow);
  const reading = { time: current.time, value: current.value };
  const lastTrend = previous.trend;
  const newTrend = direction && (!lastTrend || current.time > lastTrend.time)
    ? { time: current.time, direction } : lastTrend;
  if (!await contextIsCurrent(session, patient)) return;
  await store.set({ glucoseMonitor: { scope, reading, trend: newTrend ?? null } });
  const updatedSettings = preferences(await settingsStore.get(SETTINGS));
  if (!await contextIsCurrent(session, patient)) return;
  await showBadge(reading, updatedSettings);

  const changed = newTrend !== lastTrend && lastTrend &&
    current.time - lastTrend.time < STALE && direction !== lastTrend.direction;
  if (!changed || direction === 'flat' || !updatedSettings.trendAlerts ||
      !await contextIsCurrent(session, patient)) return;
  const { title, icon } = NOTIFICATIONS[direction];
  await chrome.notifications.create({
    type: 'basic',
    title,
    iconUrl: chrome.runtime.getURL(icon),
    message: 'Abre Diapreneur · Glucosa para ver la gráfica.',
  });
}

let pending = Promise.resolve();
function queueCheck(readNow) {
  pending = pending.then(() => checkGlucose(readNow)).catch(() => {
    console.warn('No se pudo actualizar el icono o comprobar la tendencia de LibreLinkUp.');
  });
}

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM) queueCheck(true);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.lluSession || changes.selectedPatient)) queueCheck(true);
  if (area === 'local' && SETTINGS.some(key => changes[key])) queueCheck(false);
});
chrome.runtime.onStartup.addListener(() => queueCheck(true));
queueCheck(true);
