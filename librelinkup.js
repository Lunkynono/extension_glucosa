// Adaptado de DiaKEM/libre-link-up-api-client v0.7.2 (MIT, véase LICENSE-DiaKEM.txt).
// Usa fetch y Web Crypto para funcionar directamente en una extensión de Chrome.
const VERSION = '4.17.0';
const EUROPE = 'https://api-eu.libreview.io';
const NORTH_AMERICA = 'https://api-us.libreview.io';
const REGIONS = new Map([
  ['eu', EUROPE], ['eu2', 'https://api-eu2.libreview.io'],
  ['de', 'https://api-de.libreview.io'], ['fr', 'https://api-fr.libreview.io'],
  ['us', NORTH_AMERICA],
]);

export class LibreError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

async function request(origin, path, { body, session } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'product': 'llu.android',
    'version': VERSION,
  };
  if (session) {
    headers.Authorization = 'Bearer ' + session.token;
    headers['Account-Id'] = session.accountId;
  }
  let response;
  try {
    response = await fetch(origin + path, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new LibreError('No se pudo contactar con LibreLinkUp. Revisa tu conexión y vuelve a intentarlo.', 'network');
  }
  const payload = await response.json().catch(() => null);
  if (payload?.status === 920) {
    throw new LibreError('Abbott exige una versión más reciente del cliente. La extensión necesita una actualización.', 'version');
  }
  if (body && payload?.status === 4) {
    throw new LibreError('Abre la app LibreLinkUp y completa los pasos pendientes de tu cuenta antes de volver a intentarlo.', 'account');
  }
  if (body && (payload?.status === 2 || response.status === 401)) {
    throw new LibreError('Revisa el correo y la contraseña de la cuenta seguidora de LibreLinkUp.', 'credentials');
  }
  if (session && (response.status === 401 || payload?.status === 2)) {
    throw new LibreError('Tu sesión ha caducado. Inicia sesión de nuevo.', 'expired');
  }
  if (response.status === 429) {
    throw new LibreError('LibreLinkUp pide esperar antes de volver a actualizar.', 'rate');
  }
  if (path.endsWith('/graph') && [403, 404].includes(response.status)) return null;
  if (!response.ok || payload?.status !== 0 || payload.data == null) {
    throw new LibreError('LibreLinkUp devolvió una respuesta inesperada. Inténtalo de nuevo más tarde.', 'response');
  }
  return payload.data;
}

export async function login(email, password) {
  let origin = EUROPE;
  const visited = new Set();
  while (!visited.has(origin)) {
    visited.add(origin);
    const data = await request(origin, '/llu/auth/login', { body: { email, password } });
    if (data.redirect) {
      const region = REGIONS.get(String(data.region).toLowerCase());
      if (!region) break;
      origin = region;
      continue;
    }
    const token = data.authTicket?.token;
    const userId = data.user?.id;
    if (typeof token !== 'string' || !token || typeof userId !== 'string' || !userId) break;
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId));
    const accountId = Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
    const expiresAt = Number(data.authTicket.expires) * 1000;
    return { origin, token, accountId, expiresAt: Number.isFinite(expiresAt) ? expiresAt : null };
  }
  throw new LibreError('No se pudo identificar el servidor regional de esta cuenta de LibreLinkUp.', 'region');
}

function sessionOrigin(session) {
  if (!Array.from(REGIONS.values()).includes(session?.origin)) {
    throw new LibreError('Inicia sesión de nuevo.', 'expired');
  }
  if (session.expiresAt > 0 && session.expiresAt <= Date.now()) {
    throw new LibreError('Tu sesión ha caducado. Inicia sesión de nuevo.', 'expired');
  }
  return session.origin;
}

export async function connections(session) {
  const list = await request(sessionOrigin(session), '/llu/connections', { session });
  if (!Array.isArray(list)) {
    throw new LibreError('No se pudieron leer las conexiones de LibreLinkUp.', 'response');
  }
  return list.filter(item => typeof item?.patientId === 'string' && item.patientId.length)
    .map(item => ({
      id: item.patientId,
      name: [item.firstName, item.lastName].filter(part => typeof part === 'string' && part.trim()).join(' '),
      current: item.glucoseMeasurement,
    }));
}

export function graph(session, patientId) {
  return request(sessionOrigin(session), '/llu/connections/' + encodeURIComponent(patientId) + '/graph', { session });
}
