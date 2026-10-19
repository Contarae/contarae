import { registerHooks } from 'node:module';

export function installBlobMock() {
  const stores = new Map();
  const calls = [];
  let version = 0;
  const getStore = input => {
    const name = typeof input === 'string' ? input : input.name;
    if (!stores.has(name)) stores.set(name, new Map());
    const values = stores.get(name);
    const read = (key, options = {}) => {
      const value = values.get(key);
      if (!value) return null;
      const bytes = Buffer.from(value.bytes);
      const data = options.type === 'arrayBuffer' ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length)
        : options.type === 'json' ? JSON.parse(bytes.toString()) : bytes.toString();
      return { data, metadata: structuredClone(value.metadata), etag: value.etag };
    };
    const set = async (key, data, options = {}) => {
      calls.push({ op: 'set', name, key });
      const existing = values.get(key);
      if ((options.onlyIfNew && existing) || (options.onlyIfMatch && existing?.etag !== options.onlyIfMatch)) return { modified: false };
      const bytes = Buffer.from(data);
      const etag = `version-${++version}`;
      values.set(key, { bytes, metadata: structuredClone(options.metadata || {}), etag });
      return { modified: true, etag };
    };
    return {
      async list({ prefix = '' } = {}) {
        calls.push({ op: 'list', name, prefix });
        return { blobs: [...values].filter(([key]) => key.startsWith(prefix)).map(([key,v]) => ({ key, etag: v.etag })) };
      },
      async get(key, options) { calls.push({ op: 'get', name, key }); return read(key, options)?.data ?? null; },
      async getWithMetadata(key, options) { calls.push({ op: 'getWithMetadata', name, key }); return read(key, options); },
      async getMetadata(key) { const v = values.get(key); return v ? { metadata: structuredClone(v.metadata), etag: v.etag } : null; },
      set,
      async setJSON(key, data, options) { return set(key, JSON.stringify(data), options); },
      async delete(key) { calls.push({ op: 'delete', name, key }); values.delete(key); }
    };
  };
  globalThis.__contaraeTestGetStore = getStore;
  registerHooks({
    resolve(specifier, context, next) {
      return specifier === '@netlify/blobs' ? { url: 'file:///contarae-test-blobs.cjs', shortCircuit: true } : next(specifier, context);
    },
    load(url, context, next) {
      return url === 'file:///contarae-test-blobs.cjs'
        ? { format: 'commonjs', source: 'exports.getStore = (...args) => globalThis.__contaraeTestGetStore(...args);', shortCircuit: true }
        : next(url, context);
    }
  });
  return { stores, calls, getStore, reset() { stores.clear(); calls.length = 0; } };
}
