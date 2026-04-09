// stateCodec.js - URL state compression using CompressionStream

const CSS_KEY = '_cssStyles';

async function compress(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  const chunks = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return btoa(String.fromCharCode(...out))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function decompress(b64) {
  const b64padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64padded + '='.repeat((4 - b64padded.length % 4) % 4);
  const binary = atob(padded);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(data);
  writer.close();
  const chunks = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return new TextDecoder().decode(out);
}

export const CSS_EMBED_KEY = CSS_KEY;

export async function encodeState(grammarObj) {
  const json = JSON.stringify(grammarObj);
  const compressed = await compress(json);
  return compressed;
}

export async function decodeState(encoded) {
  const json = await decompress(encoded);
  return JSON.parse(json);
}

export async function buildShareURL(grammarObj, extraParams = {}) {
  const encoded = await encodeState(grammarObj);
  const url = new URL(window.location.href);
  url.hash = '';
  // Start with the grammar parameter
  const searchParams = new URLSearchParams();
  searchParams.set('g', encoded);
  
  // Add any extra parameters (like 'o' for origin or 'v' for view)
  for (const [key, value] of Object.entries(extraParams)) {
    if (value) {
      searchParams.set(key, value);
    }
  }
  
  url.search = '?' + searchParams.toString();
  return url.toString();
}

export async function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const g = params.get('g');
  if (!g) return null;
  try {
    return await decodeState(g);
  } catch (e) {
    console.error('Failed to decode URL state', e);
    return null;
  }
}
