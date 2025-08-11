export function uuidToBase64Url(uuid: string): string {
  const hex = uuid.replace(/-/g, '').toLowerCase();
  if (hex.length !== 32) throw new Error('Invalid UUID');
  let bin = '';
  for (let i = 0; i < 32; i += 2) {
    bin += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  const base64 = btoa(bin);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlToUuid(code: string): string {
  if (!code) throw new Error('Empty code');
  let b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  const bin = atob(b64);
  let hex = '';
  for (let i = 0; i < bin.length; i++) {
    const h = bin.charCodeAt(i).toString(16).padStart(2, '0');
    hex += h;
  }
  if (hex.length !== 32) throw new Error('Decoded length mismatch');
  return (
    hex.slice(0, 8) + '-' +
    hex.slice(8, 12) + '-' +
    hex.slice(12, 16) + '-' +
    hex.slice(16, 20) + '-' +
    hex.slice(20)
  );
}

export function compactUuid(uuid: string): string {
  return uuid.replace(/-/g, '');
}

export function expandCompactUuid(compact: string): string {
  const hex = compact.toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) throw new Error('Invalid compact UUID');
  return (
    hex.slice(0, 8) + '-' +
    hex.slice(8, 12) + '-' +
    hex.slice(12, 16) + '-' +
    hex.slice(16, 20) + '-' +
    hex.slice(20)
  );
}
