// Restringe el acceso a los contextos propios de la extensión antes de usar los datos.
const local = chrome.storage.local;
const ready = local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });

export const storage = {
  async get(keys) {
    await ready;
    return local.get(keys);
  },
  async set(data) {
    await ready;
    return local.set(data);
  },
  async remove(keys) {
    await ready;
    return local.remove(keys);
  },
};
